#!/usr/bin/env python3
"""Fail-closed GIIS lesson-video replacement lifecycle.

The old public video remains canonical until the replacement has passed local
release evidence, YouTube readback, an isolated manifest-only deploy, and live
website readback. Only then may this tool retire the exact old video ID.
"""
from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
import re
import secrets
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from contextlib import contextmanager, nullcontext
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterator


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
from release_lock import (  # noqa: E402
    ReleaseLockError,
    canonical_release_lock_path,
    acquire_release_lock,
)

TEACHING_ROOT = (ROOT / "teaching-videos").resolve()
SANDBOX_ROOT = (TEACHING_ROOT / ".quality-sandbox").resolve()
MANIFEST_REL = Path("public/data/lessons-manifest.json")
MANIFEST_PATH = ROOT / MANIFEST_REL
AUDIT_ROOT = TEACHING_ROOT / "_audit" / "replacements"
STATE_PATH = ROOT / "umi" / "video-quality-round-robin.json"
STATE_LOCK_PATH = ROOT / "umi" / ".quality-locks" / "video-quality-state.lock"
LIVE_MANIFEST_URL = "https://genesisideas.school/data/lessons-manifest.json"
SCHEMA_VERSION = "giis.youtube-replacement.v1"
STATE_ORDER = {
    "prepared": 0,
    "upload_intent": 1,
    "uploaded_pending_readback": 2,
    "upload_verified": 3,
    "manifest_published": 4,
    "manifest_live": 5,
    "website_verified": 6,
    "replaced": 7,
}

sys.path.insert(0, str(ROOT / "tools" / "lesson-video"))
sys.path.insert(0, str(ROOT / "tools" / "youtube-upload"))
from audit_lessons import audit_lesson  # noqa: E402
from local_audio_review import (  # noqa: E402
    SCHEMA_VERSION as AUDIO_SCHEMA_VERSION,
    validate_local_audio_review,
)
from parent_trust_video_audit import audit_folder as audit_parent_trust  # noqa: E402
from video_review_evidence import (  # noqa: E402
    SCHEMA_VERSION as REVIEW_SCHEMA_VERSION,
    validate_review_evidence,
)
from approval_gate import approved_candidate_mp4  # noqa: E402
from upload_video import get_creds  # noqa: E402


class ReplacementError(RuntimeError):
    pass


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def sha256_file(path: Path) -> str:
    require(path.is_file(), f"file does not exist: {path}")
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", dir=path.parent, prefix=f".{path.name}.", delete=False
    ) as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
        temp_path = Path(handle.name)
    os.replace(temp_path, path)
    directory_fd = os.open(path.parent, os.O_RDONLY)
    try:
        os.fsync(directory_fd)
    finally:
        os.close(directory_fd)


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text())
    except Exception as exc:
        raise ReplacementError(f"cannot read JSON: {path}: {exc}") from exc


def relative(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(ROOT.resolve()))
    except ValueError:
        return str(path.resolve())


def resolve_repo_path(value: str) -> Path:
    path = Path(value)
    return path.resolve() if path.is_absolute() else (ROOT / path).resolve()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ReplacementError(message)


def identity_state_path(identity: str, suffix: str) -> Path:
    require(bool(identity), "replacement identity is missing")
    root = canonical_release_lock_path(ROOT).parent / "video-replacements"
    return root / (hashlib.sha256(identity.encode("utf-8")).hexdigest() + suffix)


def claim_upload(
    plan_path: Path, plan: dict[str, Any], *, pre_dispatch_video_ids: list[str],
) -> dict[str, Any]:
    """Persist intent shared across worktrees, including alternate plan paths.

    Caller holds both the shared release lock and the identity lock. Never
    clear this record on failure: an uncertain upload requires reconciliation.
    """
    path = identity_state_path(plan["identity"], ".upload.json")
    if path.exists():
        prior = read_json(path)
        require(prior.get("identity") == plan["identity"], "shared upload intent identity mismatch")
        require(prior.get("old_video_id") != plan["old_video_id"],
                "shared upload intent already exists; reconcile the prior upload before retrying")
        # Retired artifacts may have changed or been cleaned. Check the durable
        # completion/identity chain, without revalidating that historical MP4.
        prior_plan = read_json(Path(prior["plan_path"]))
        require(prior_plan.get("schema_version") == SCHEMA_VERSION
                and prior_plan.get("identity") == plan["identity"]
                and prior_plan.get("old_video_id") == prior.get("old_video_id"),
                "shared upload intent does not match its prior plan")
        require(prior_plan.get("state") == "replaced", "another replacement upload is unresolved")
        require(prior_plan.get("new_video_id") == plan["old_video_id"], "shared replacement chain does not match old video")
    intent = {
        **upload_binding(plan_path, plan),
        "token": secrets.token_hex(32),
        "reconciliation_nonce": secrets.token_hex(24),
        "pre_dispatch_video_ids": sorted(set(pre_dispatch_video_ids)),
        "started_at": now_iso(), "status": "ready",
    }
    atomic_write_json(path, intent)
    return intent


def upload_binding(plan_path: Path, plan: dict[str, Any]) -> dict[str, Any]:
    """Immutable input binding; YouTube output is deliberately excluded."""
    candidate = resolve_repo_path(plan["candidate_lesson_dir"])
    script = read_json(candidate / "script.json")
    script.pop("youtube", None)
    return {
        "plan_path": str(plan_path.resolve()),
        "identity": plan["identity"], "old_video_id": plan["old_video_id"],
        "plan_binding": {key: plan.get(key) for key in (
            "schema_version", "course", "course_slug", "module_number", "expected_youtube_title",
            "privacy", "canonical_lesson_dir", "candidate_lesson_dir", "candidate_mp4",
            "candidate_mp4_sha256", "approval_file", "review_id", "review_packet_sha256",
            "local_audio_receipt_sha256", "playlist_id", "playlist_name", "manifest_sha256_before",
        )},
        "approval_sha256": sha256_file(resolve_repo_path(plan["approval_file"])),
        "script_sha256": hashlib.sha256(json.dumps(script, sort_keys=True).encode()).hexdigest(),
    }


def validate_upload_intent(plan_path: Path, plan: dict[str, Any]) -> dict[str, Any]:
    intent = read_json(identity_state_path(plan["identity"], ".upload.json"))
    for key, value in upload_binding(plan_path, plan).items():
        require(intent.get(key) == value, f"durable upload intent {key} mismatch")
    require(bool(intent.get("token")), "durable upload intent lacks token")
    validate_reconciliation_intent(
        intent,
        require_dispatched=intent.get("status") in {"dispatched", "uploaded"},
    )
    return intent


def validate_inherited_lock(fd: int, path: Path) -> None:
    """Require this exact open description to own the canonical inode lock.

    An independent open must be blocked, while flock on the inherited open
    description must succeed. Merely pointing an FD at the lock file is not
    enough, nor is another process holding an unrelated lock.
    """
    actual, expected = os.fstat(fd), path.stat()
    require((actual.st_dev, actual.st_ino) == (expected.st_dev, expected.st_ino),
            "handoff lock is not the canonical inode")
    with path.open("r+") as probe:
        try:
            fcntl.flock(probe.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            pass
        else:
            fcntl.flock(probe.fileno(), fcntl.LOCK_UN)
            raise ReplacementError("handoff canonical lock is not held")
    try:
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError as exc:
        raise ReplacementError("handoff FD does not own the canonical lock") from exc


def consume_upload_handoff(
    plan_path: Path, token: str, candidate: Path, approval: Path, mp4: Path,
    privacy: str, release_fd: int, identity_fd: int,
) -> tuple[Path, dict[str, Any]]:
    """Validate and consume a lifecycle-only capability before any upload.

    The inherited locks remain open throughout the child process. The atomic
    exclusive claim prevents replay even by two children sharing those FDs.
    An uncertain dispatched intent is never reset automatically.
    """
    validate_inherited_lock(release_fd, canonical_release_lock_path(ROOT))
    plan = load_plan(plan_path)
    validate_inherited_lock(identity_fd, identity_state_path(plan["identity"], ".lock"))
    require(plan["state"] == "upload_intent" and not plan.get("new_video_id"), "plan is not awaiting this upload")
    require(resolve_repo_path(plan["candidate_lesson_dir"]) == candidate, "handoff candidate mismatch")
    require(resolve_repo_path(plan["approval_file"]) == approval, "handoff approval mismatch")
    require(resolve_repo_path(plan["candidate_mp4"]) == mp4
            and sha256_file(mp4) == plan["candidate_mp4_sha256"], "handoff MP4 mismatch")
    require(plan["privacy"] == privacy, "handoff privacy mismatch")
    script = read_json(candidate / "script.json")
    require(not (script.get("youtube") or {}).get("video_id"), "candidate already has a video ID")
    require(plan["identity"] == f"{plan['course_slug']}:{plan['module_number']}"
            and script.get("course") == plan["course"]
            and module_number(script) == int(plan["module_number"])
            and youtube_title(script) == plan["expected_youtube_title"], "handoff lesson identity mismatch")
    intent = validate_upload_intent(plan_path, plan)
    require(secrets.compare_digest(str(intent["token"]), token), "handoff token mismatch")
    require(intent.get("status") == "ready", "upload handoff already consumed; reconcile instead of retrying")
    # Approval is revalidated here as well as in upload_lesson's normal gate.
    from approval_gate import approved_rows
    row = approved_rows(approval, root=ROOT).get(candidate.name)
    require(row is not None and approved_candidate_mp4(row, root=ROOT, lesson_dir=candidate) == mp4,
            "handoff approval no longer validates this candidate")
    path = identity_state_path(plan["identity"], ".upload.json")
    marker = path.with_name(path.name + "." + intent["token"] + ".started")
    try:
        fd = os.open(marker, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError as exc:
        raise ReplacementError("upload handoff already consumed; reconcile instead of retrying") from exc
    with os.fdopen(fd, "w") as handle:
        handle.write(str(plan_path.resolve()))
        handle.flush()
        os.fsync(handle.fileno())
    intent.update(status="dispatched", dispatched_at=now_iso())
    atomic_write_json(path, intent)
    return path, intent


def record_upload_result(handoff: tuple[Path, dict[str, Any]], youtube: dict[str, Any]) -> None:
    path, intent = handoff
    require(read_json(path) == intent, "upload intent changed before result persistence")
    require(intent.get("status") == "dispatched", "upload handoff is not dispatched")
    require(bool(youtube.get("video_id")) and youtube["video_id"] != intent["old_video_id"],
            "upload result lacks a distinct video ID")
    intent.update(status="uploaded", youtube=youtube, uploaded_at=now_iso())
    atomic_write_json(path, intent)


@contextmanager
def identity_lock(identity: str) -> Iterator[Any]:
    require(bool(identity), "replacement identity is missing")
    path = identity_state_path(identity, ".lock")
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a+") as handle:
        try:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise ReplacementError(f"another worker holds replacement identity {identity}") from exc
        yield handle


@contextmanager
def media_followup_lock(identity: str) -> Iterator[Any]:
    """Serialize optional media work without holding release/identity locks."""
    require(bool(identity), "replacement identity is missing")
    path = identity_state_path(identity, ".media.lock")
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a+") as handle:
        try:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise ReplacementError(
                f"another worker holds optional media follow-up {identity}"
            ) from exc
        yield handle


@contextmanager
def playlist_lock(playlist_name: str) -> Iterator[Any]:
    """Serialize lookup/create/membership changes for one managed playlist."""
    normalized = " ".join(str(playlist_name).split()).casefold()
    require(bool(normalized), "playlist name is missing")
    path = identity_state_path(f"playlist:{normalized}", ".playlist.lock")
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a+") as handle:
        try:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise ReplacementError(f"another worker holds playlist {playlist_name}") from exc
        yield handle


def module_number(script: dict[str, Any]) -> int:
    for key in ("module_number", "moduleNumber", "module_order", "moduleOrder"):
        if script.get(key) is not None:
            try:
                return int(script[key])
            except (TypeError, ValueError):
                pass
    import re

    match = re.match(r"\s*(?:Module\s+)?(\d+)", str(script.get("module") or ""), re.IGNORECASE)
    if not match:
        raise ReplacementError("candidate script lacks a parseable module number")
    return int(match.group(1))


def manifest_rows(manifest: dict[str, Any], course: str, number: int) -> tuple[dict[str, Any], dict[str, Any]]:
    flat = [
        row for row in manifest.get("lessons", [])
        if row.get("course") == course and int(row.get("module_number", -1)) == number
    ]
    grouped = [
        row for rows in (manifest.get("by_course") or {}).values() for row in rows
        if row.get("course") == course and int(row.get("module_number", -1)) == number
    ]
    require(len(flat) == 1, f"manifest must contain exactly one flat row for {course} M{number}")
    require(len(grouped) == 1, f"manifest must contain exactly one grouped row for {course} M{number}")
    require(flat[0].get("youtube_id") == grouped[0].get("youtube_id"), "manifest row copies disagree")
    require(flat[0].get("lesson_dir") == grouped[0].get("lesson_dir"), "manifest lesson_dir copies disagree")
    return flat[0], grouped[0]


def youtube_title(script: dict[str, Any]) -> str:
    return f"{script.get('course', '?')} — {script.get('module', '?')}"


def approval_row(candidate: Path, mp4: Path, review: dict[str, Any], audio: dict[str, Any]) -> dict[str, Any]:
    return {
        "slug": candidate.name,
        "path": relative(candidate),
        "quality_score": 100,
        "verdict": "pass",
        "approved_by": "replacement_lifecycle",
        "approved_at": now_iso(),
        "review_id": review["review_id"],
        "review_schema_version": REVIEW_SCHEMA_VERSION,
        "review_packet_sha256": review["packet_sha256"],
        "candidate_mp4": relative(mp4),
        "candidate_mp4_sha256": sha256_file(mp4),
        "local_audio_schema_version": AUDIO_SCHEMA_VERSION,
        "local_audio_receipt_sha256": audio["receipt_sha256"],
        "local_audio_model_sha256": audio["model_sha256"],
    }


def validate_candidate(candidate: Path, mp4: Path) -> dict[str, Any]:
    require(candidate.is_dir(), f"candidate folder does not exist: {candidate}")
    require(SANDBOX_ROOT in candidate.parents, "replacement candidate must remain inside .quality-sandbox")
    require(mp4.is_file() and candidate in mp4.parents, "candidate MP4 must exist inside candidate folder")
    script = read_json(candidate / "script.json")
    require(isinstance(script, dict), "candidate script.json must be an object")
    audit = audit_lesson(candidate)
    require(audit.get("quality_score") == 100 and audit.get("verdict") == "pass", "candidate audit is not score 100/pass")
    trust = audit_parent_trust(candidate)
    require(trust.get("verdict") == "TRUST_READY" and not trust.get("hard_findings"), "candidate is not TRUST_READY")
    review = validate_review_evidence(candidate)
    require(review.get("valid") and review.get("verdict") == "PASS", "independent review evidence is not a valid PASS")
    require(resolve_repo_path(str(review.get("candidate_mp4"))) == mp4, "independent review is bound to a different MP4")
    dimensions = review.get("dimensions") or {}
    require(dimensions and all(row.get("status") == "PASS" for row in dimensions.values()), "not every review dimension is PASS")
    packet = read_json(candidate / "_review_packet_v2.json")
    script_binding = (packet.get("artifacts") or {}).get("script") or {}
    allowed_review_script_sha = (
        script_binding.get("sha256") if script_binding.get("hash_mode") == "review_script" else None
    )
    audio = validate_local_audio_review(
        candidate,
        expected_mp4=mp4,
        allowed_review_script_sha=allowed_review_script_sha,
    )
    require(audio.get("valid") and audio.get("status") == "PASS", "local audio review is not a valid PASS")
    return {"script": script, "audit": audit, "trust": trust, "review": review, "audio": audio}


def choose_plan_path(plan_dir: Path, output: Path | None, candidate_sha256: str) -> Path:
    """Preserve completed plans so the next replacement can prove its chain."""
    default = plan_dir / "replacement-plan.json"
    existing = sorted(plan_dir.glob("replacement-plan*.json")) if plan_dir.is_dir() else []
    for path in existing:
        current = read_json(path)
        require(current.get("state") == "replaced", f"active replacement plan already exists: {path}")
    if output is not None:
        require(output.parent.resolve() == plan_dir.resolve(),
                "explicit output must remain in the canonical replacement directory")
        require(
            output.name == "replacement-plan.json"
            or (output.name.startswith("replacement-plan-") and output.name.endswith(".json")),
            "explicit output must use a replacement-plan*.json name",
        )
        if output.exists():
            raise ReplacementError("explicit output already exists; choose a new output path")
        return output
    if not default.exists():
        return default
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    selected = plan_dir / f"replacement-plan-{stamp}-{candidate_sha256[:12]}.json"
    require(not selected.exists(), "generated replacement plan path already exists")
    return selected


def plan_artifact_path(plan_path: Path, label: str) -> Path:
    """Give every replacement plan immutable, plan-specific evidence files."""
    plan_key = hashlib.sha256(str(plan_path.resolve()).encode("utf-8")).hexdigest()[:20]
    return plan_path.parent / f"evidence-{plan_key}-{label}.json"


def prepare(candidate: Path, mp4: Path, output: Path | None = None) -> Path:
    evidence = validate_candidate(candidate, mp4)
    script = evidence["script"]
    course = str(script.get("course") or "").strip()
    number = module_number(script)
    require(bool(course), "candidate script lacks course")
    run(["git", "fetch", "origin", "main"], timeout=300)
    manifest, origin_manifest_hash = git_show_manifest("origin/main")
    flat, _grouped = manifest_rows(manifest, course, number)
    require(bool(flat.get("course_slug")), "manifest row lacks course_slug")
    identity = f"{flat.get('course_slug')}:{number}"
    with release_lock(), identity_lock(identity):
        local_manifest = read_json(MANIFEST_PATH)
        local_flat, _local_grouped = manifest_rows(local_manifest, course, number)
        require(local_flat.get("youtube_id") == flat.get("youtube_id"), "local and origin/main manifest target IDs disagree")
        old_id = str(flat.get("youtube_id") or "").strip()
        require(bool(old_id), "current manifest row lacks old youtube_id")
        canonical = (TEACHING_ROOT / str(flat.get("lesson_dir") or "")).resolve()
        require(canonical.is_dir() and canonical.parent == TEACHING_ROOT, "canonical lesson folder is invalid")
        canonical_script = read_json(canonical / "script.json")
        canonical_youtube = canonical_script.get("youtube") or {}
        canonical_id = str(canonical_youtube.get("video_id") or "")
        require(canonical_id == old_id, "canonical script and manifest do not agree on old video ID")
        playlist_id = str(canonical_youtube.get("playlist_id") or "").strip()
        playlist_name = str(canonical_youtube.get("playlist") or "").strip()
        require(bool(playlist_id) and bool(playlist_name), "canonical script lacks managed course playlist identity")
        require(str(canonical_script.get("course")) == course, "candidate and canonical course disagree")
        require(module_number(canonical_script) == number, "candidate and canonical module disagree")
        row = approval_row(candidate, mp4, evidence["review"], evidence["audio"])
        require(approved_candidate_mp4(row, root=ROOT, lesson_dir=candidate) == mp4, "scoped upload approval did not revalidate")

        plan_dir = AUDIT_ROOT / canonical.name
        plan_path = choose_plan_path(plan_dir, output, row["candidate_mp4_sha256"])
        approval_path = plan_artifact_path(plan_path, "scoped-upload-approval")
        trust_receipt = plan_artifact_path(plan_path, "parent-trust")
        atomic_write_json(approval_path, {"approved_ready_to_upload": [row]})
        atomic_write_json(trust_receipt, evidence["trust"])
        plan = {
            "schema_version": SCHEMA_VERSION,
            "state": "prepared",
            "created_at": now_iso(),
            "updated_at": now_iso(),
            "course": course,
            "course_slug": flat.get("course_slug"),
            "identity": identity,
            "module_number": number,
            "expected_youtube_title": youtube_title(script),
            "privacy": "unlisted",
            "canonical_lesson_dir": relative(canonical),
            "candidate_lesson_dir": relative(candidate),
            "candidate_mp4": relative(mp4),
            "candidate_mp4_sha256": row["candidate_mp4_sha256"],
            "old_video_id": old_id,
            "new_video_id": None,
            "playlist_id": playlist_id,
            "playlist_name": playlist_name,
            "manifest_sha256_before": origin_manifest_hash,
            "manifest_lesson_dir": flat["lesson_dir"],
            "approval_file": relative(approval_path),
            "approval_file_sha256": sha256_file(approval_path),
            "parent_trust_receipt": relative(trust_receipt),
            "parent_trust_receipt_sha256": sha256_file(trust_receipt),
            "review_id": evidence["review"]["review_id"],
            "review_packet_sha256": evidence["review"]["packet_sha256"],
            "local_audio_receipt_sha256": evidence["audio"]["receipt_sha256"],
            "events": [{"at": now_iso(), "event": "prepared"}],
        }
        atomic_write_json(plan_path, plan)
        sync_round_robin(plan_path, plan)
        print(f"[prepared] {relative(plan_path)}")
        print(f"[old] {old_id}")
        print(f"[candidate] {row['candidate_mp4_sha256']}")
        return plan_path


def load_plan(path: Path, *, minimum_state: str | None = None) -> dict[str, Any]:
    plan = read_json(path)
    require(isinstance(plan, dict) and plan.get("schema_version") == SCHEMA_VERSION, "unsupported replacement plan")
    state = str(plan.get("state") or "")
    require(state in STATE_ORDER, f"invalid replacement state: {state}")
    if minimum_state:
        require(STATE_ORDER[state] >= STATE_ORDER[minimum_state], f"replacement state {state} is before {minimum_state}")
    if plan.get("new_video_id"):
        require(plan["new_video_id"] != plan.get("old_video_id"), "old and new video IDs must differ")
    require(bool(plan.get("playlist_id")) and bool(plan.get("playlist_name")), "replacement plan lacks managed playlist identity")
    approval_path = resolve_repo_path(str(plan.get("approval_file") or ""))
    trust_path = resolve_repo_path(str(plan.get("parent_trust_receipt") or ""))
    require(sha256_file(approval_path) == plan.get("approval_file_sha256"),
            "replacement approval evidence changed or is missing")
    require(sha256_file(trust_path) == plan.get("parent_trust_receipt_sha256"),
            "parent-trust evidence changed or is missing")
    candidate = resolve_repo_path(str(plan["candidate_lesson_dir"]))
    mp4 = resolve_repo_path(str(plan["candidate_mp4"]))
    require(sha256_file(mp4) == plan.get("candidate_mp4_sha256"), "candidate MP4 hash drifted")
    evidence = validate_candidate(candidate, mp4)
    require(evidence["review"].get("review_id") == plan.get("review_id"), "review ID drifted")
    require(evidence["review"].get("packet_sha256") == plan.get("review_packet_sha256"), "review packet drifted")
    require(evidence["audio"].get("receipt_sha256") == plan.get("local_audio_receipt_sha256"), "audio receipt drifted")
    if STATE_ORDER[state] >= STATE_ORDER["upload_verified"]:
        require(validate_replacement_media_plan_receipt(path, plan),
                "verified replacement lacks a valid optional media receipt")
    return plan


def save_event(path: Path, plan: dict[str, Any], state: str, event: str, **fields: Any) -> None:
    require(load_plan(path) == plan, "replacement plan changed before durable state transition")
    plan.update(fields)
    plan["state"] = state
    plan["updated_at"] = now_iso()
    plan.setdefault("events", []).append({"at": now_iso(), "event": event, **fields})
    atomic_write_json(path, plan)
    sync_round_robin(path, plan)


def next_action_for(state: str) -> str:
    return {
        "prepared": "Run the scoped replacement upload, then verify YouTube readback before changing the website.",
        "upload_intent": "Upload outcome is unresolved; recover the candidate video ID or reconcile the exact channel title before retrying.",
        "uploaded_pending_readback": "Verify the new YouTube ID, channel, title, processing state, privacy and embeddability.",
        "upload_verified": "Publish the exact one-row manifest replacement from an isolated worktree.",
        "manifest_published": "Wait for Netlify, then verify the production manifest and new YouTube embed.",
        "manifest_live": "Verify the real public lesson-library card and iframe before retiring the old video.",
        "website_verified": "Retire only the recorded old YouTube ID, then verify old absence and new presence.",
        "replaced": "Replacement lifecycle complete; retain local source, renders and evidence.",
    }[state]


def sync_round_robin(plan_path: Path, plan: dict[str, Any]) -> None:
    """Keep the durable repair queue aligned with replacement receipts."""
    if not STATE_PATH.is_file():
        return
    STATE_LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    with STATE_LOCK_PATH.open("a+") as handle:
        try:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
            state = read_json(STATE_PATH)
            repairs = state.get("repairs") if isinstance(state, dict) else None
            if not isinstance(repairs, list):
                raise ReplacementError("round-robin state lacks repairs[]")
            matches = [row for row in repairs if row.get("identity") == plan.get("identity")]
            require(len(matches) == 1, f"round-robin state must contain exactly one repair {plan.get('identity')}")
            repair = matches[0]
            repair.update({
                "stage": plan["state"],
                "replacement_plan": relative(plan_path),
                "old_video_id": plan.get("old_video_id"),
                "new_video_id": plan.get("new_video_id"),
                "next_action": next_action_for(plan["state"]),
                "blockers": [],
                "updated_at": now_iso(),
            })
            for key in (
                "optional_media_receipt",
                "optional_media_receipt_sha256",
                "approval_file_sha256",
                "parent_trust_receipt_sha256",
                "youtube_readback",
                "remote_preflight",
                "manifest_commit",
                "website_readback",
                "local_manifest_receipt",
                "browser_readback",
                "post_retirement_browser_readback",
                "playlist_receipt",
                "retirement_receipt",
            ):
                if plan.get(key):
                    repair[key] = plan[key]
            if plan["state"] == "replaced":
                new_id = plan["new_video_id"]
                published_at = plan.get("published_at")
                for row in [repair.get("lesson")] + list(state.get("rotation") or []):
                    if not isinstance(row, dict):
                        continue
                    if row.get("course_slug") != plan.get("course_slug") or int(row.get("module_number", -1)) != int(plan["module_number"]):
                        continue
                    row.update({
                        "youtube_id": new_id,
                        "url": f"https://youtu.be/{new_id}",
                        "embed_url": f"https://www.youtube.com/embed/{new_id}",
                        "published_at": published_at,
                    })
            atomic_write_json(STATE_PATH, state)
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def sync_status(plan_path: Path) -> dict[str, Any]:
    """Refresh queue status from a plan while serializing with state changes."""
    observed = load_plan(plan_path)
    identity = str(observed.get("identity") or "")
    with identity_lock(identity):
        plan = load_plan(plan_path)
        require(plan.get("identity") == identity, "replacement identity changed while waiting for status lock")
        sync_round_robin(plan_path, plan)
        return plan


def run(command: list[str], *, cwd: Path = ROOT, timeout: int = 1800, pass_fds: tuple[int, ...] = ()) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(command, cwd=cwd, text=True, capture_output=True, timeout=timeout, check=False, pass_fds=pass_fds)
    if result.returncode:
        raise ReplacementError(
            f"command failed ({result.returncode}): {' '.join(command)}\n{result.stdout[-2000:]}\n{result.stderr[-2000:]}"
        )
    return result


def verify_origin_manifest_unchanged(plan: dict[str, Any]) -> None:
    run(["git", "fetch", "origin", "main"], timeout=300)
    manifest, source_hash = git_show_manifest("origin/main")
    require(source_hash == plan.get("manifest_sha256_before"), "origin/main manifest changed since prepare; re-prepare before upload")
    flat, _grouped = manifest_rows(manifest, plan["course"], int(plan["module_number"]))
    require(flat.get("youtube_id") == plan.get("old_video_id"), "origin/main no longer points to the planned old video")
    require(flat.get("lesson_dir") == plan.get("manifest_lesson_dir"), "origin/main lesson_dir changed since prepare")


def upload(plan_path: Path, *, apply: bool) -> None:
    plan = load_plan(plan_path)
    require(plan["state"] in {"prepared", "upload_intent"}, "upload requires prepared or recoverable upload_intent state")
    candidate = resolve_repo_path(plan["candidate_lesson_dir"])
    approval = resolve_repo_path(plan["approval_file"])
    command = [
        sys.executable,
        str(ROOT / "tools/youtube-upload/upload_lesson.py"),
        str(candidate),
        "--privacy", plan["privacy"],
        "--approval-file", str(approval),
        "--replacement",
    ]
    print("[upload-command] " + " ".join(command))
    if not apply:
        print("[dry-run] no upload performed")
        return
    new_id = ""
    with release_lock() as release, identity_lock(str(plan.get("identity") or "")) as identity:
        locked_plan = load_plan(plan_path)
        require(locked_plan == plan, "replacement plan changed before lock acquisition; retry validation")
        plan = locked_plan
        require(plan["state"] in {"prepared", "upload_intent"}, "upload state changed while waiting for identity lock")
        existing_script = read_json(candidate / "script.json")
        existing_id = str(((existing_script.get("youtube") or {}).get("video_id")) or "").strip()
        if existing_id or plan["state"] == "upload_intent":
            intent = validate_upload_intent(plan_path, plan)
            youtube = intent.get("youtube") or {}
            recovered_id = str(youtube.get("video_id") or "")
            require(intent.get("status") == "uploaded" and recovered_id and recovered_id != plan["old_video_id"],
                    "prior upload outcome is unresolved; do not create a duplicate upload")
            require(not existing_id or existing_id == recovered_id, "candidate video ID differs from durable upload result")
            existing_script["youtube"] = youtube
            atomic_write_json(candidate / "script.json", existing_script)
            save_event(plan_path, plan, "uploaded_pending_readback", "recovered_existing_upload", new_video_id=recovered_id)
            print(f"[recovered-upload] {recovered_id}")
            new_id = recovered_id
        else:
            require(not existing_id, "candidate script already has the old canonical video ID; refusing ambiguous replacement upload")
            require(plan["state"] == "prepared", "prior upload outcome is unresolved; do not create a duplicate upload")
            verify_origin_manifest_unchanged(plan)
            remote_receipt = verify_remote_replacement_target(plan, youtube_client())
            remote_receipt_path = plan_artifact_path(plan_path, "pre-upload-remote-readback")
            atomic_write_json(remote_receipt_path, remote_receipt)
            intent = claim_upload(
                plan_path, plan,
                pre_dispatch_video_ids=authenticated_upload_ids(youtube_client()),
            )
            save_event(
                plan_path,
                plan,
                "upload_intent",
                "upload_started",
                remote_preflight=relative(remote_receipt_path),
            )
            lock_fds = (release._handle.fileno(), identity.fileno())
            command += ["--replacement-plan", str(plan_path.resolve()),
                        "--replacement-token", intent["token"],
                        "--release-lock-fd", str(lock_fds[0]),
                        "--identity-lock-fd", str(lock_fds[1])]
            try:
                result = run(command, pass_fds=lock_fds)
            except ReplacementError as exc:
                intent = validate_upload_intent(plan_path, plan)
                youtube = intent.get("youtube") or {}
                recovered_id = str(youtube.get("video_id") or "")
                if intent.get("status") == "uploaded" and recovered_id and recovered_id != plan["old_video_id"]:
                    script = read_json(candidate / "script.json")
                    require(not (script.get("youtube") or {}).get("video_id")
                            or script["youtube"]["video_id"] == recovered_id, "candidate video ID differs from durable upload result")
                    script["youtube"] = youtube
                    atomic_write_json(candidate / "script.json", script)
                    save_event(plan_path, plan, "uploaded_pending_readback", "recovered_after_upload_error", new_video_id=recovered_id)
                    print(f"[recovered-upload] {recovered_id}")
                    new_id = recovered_id
                else:
                    raise ReplacementError(f"upload outcome is unresolved and no new video ID was persisted; manual exact-title reconciliation required: {exc}") from exc
            else:
                sys.stdout.write(result.stdout)
                intent = validate_upload_intent(plan_path, plan)
                new_id = str((intent.get("youtube") or {}).get("video_id") or "")
                script = read_json(candidate / "script.json")
                require(intent.get("status") == "uploaded" and bool(new_id) and new_id != plan["old_video_id"]
                        and (script.get("youtube") or {}).get("video_id") == new_id,
                        "upload did not persist a matching durable new video ID")
                save_event(plan_path, plan, "uploaded_pending_readback", "uploaded", new_video_id=new_id)
    complete_replacement_media_followups(plan_path, candidate, new_id)


def reconcile_upload(plan_path: Path, *, apply: bool) -> None:
    plan = load_plan(plan_path)
    require(plan["state"] == "upload_intent" and not plan.get("new_video_id"),
            "upload reconciliation requires an unresolved upload_intent plan")
    if not apply:
        print("[dry-run] would search the authenticated channel for one exact bounded upload")
        return
    with release_lock(), identity_lock(str(plan.get("identity") or "")):
        plan = load_plan(plan_path)
        require(plan["state"] == "upload_intent" and not plan.get("new_video_id"),
                "replacement state changed before upload reconciliation")
        intent = validate_upload_intent(plan_path, plan)
        require(intent.get("status") == "dispatched" and not (intent.get("youtube") or {}).get("video_id"),
                "replacement upload intent is not an unresolved dispatch")
        nonce, pre_dispatch_ids, started_at = validate_reconciliation_intent(
            intent, require_dispatched=True,
        )
        row = find_exact_upload_adoption(
            youtube_client(),
            expected_title=str(plan.get("expected_youtube_title") or ""),
            privacy=str(plan.get("privacy") or ""),
            started_at=started_at,
            reconciliation_nonce=nonce,
            pre_dispatch_video_ids=pre_dispatch_ids,
            exclude_video_ids={str(plan.get("old_video_id") or "")},
        )
        youtube = adopted_youtube_payload(
            row, privacy=str(plan["privacy"]),
            playlist_name=str(plan.get("playlist_name") or "") or None,
        )
        candidate = resolve_repo_path(plan["candidate_lesson_dir"])
        script = read_json(candidate / "script.json")
        require(not (script.get("youtube") or {}).get("video_id"),
                "candidate already has a different YouTube identity")
        intent.update(status="uploaded", youtube=youtube, reconciled_at=now_iso())
        atomic_write_json(identity_state_path(plan["identity"], ".upload.json"), intent)
        script["youtube"] = youtube
        atomic_write_json(candidate / "script.json", script)
        save_event(
            plan_path, plan, "uploaded_pending_readback", "upload_reconciled",
            new_video_id=youtube["video_id"],
        )
    complete_replacement_media_followups(
        plan_path, resolve_repo_path(plan["candidate_lesson_dir"]), youtube["video_id"],
    )


OPTIONAL_MEDIA_SCHEMA_VERSION = "giis.youtube-optional-media.v1"


def validate_optional_media_receipt(
    receipt_path: Path, *, expected: dict[str, Any],
) -> dict[str, Any]:
    receipt = read_json(receipt_path)
    require(isinstance(receipt, dict), "optional media receipt must be an object")
    require(receipt.get("schema_version") == OPTIONAL_MEDIA_SCHEMA_VERSION,
            "optional media receipt schema mismatch")
    require(receipt.get("status") == "completed", "optional media receipt is incomplete")
    for key, value in expected.items():
        require(receipt.get(key) == value, f"optional media receipt {key} mismatch")
    return receipt


def run_durable_optional_media_followups(
    *, identity: str, operation: str, lesson: Path, video_id: str,
    receipt_path: Path, binding: dict[str, Any],
    no_thumbnail: bool = False, no_captions: bool = False,
) -> tuple[Path, str]:
    """Execute optional media at most once per immutable operation binding."""
    require(bool(identity) and bool(operation) and bool(video_id),
            "optional media operation identity is incomplete")
    immutable = {
        "schema_version": OPTIONAL_MEDIA_SCHEMA_VERSION,
        "operation": operation,
        "identity": identity,
        "lesson_dir": str(lesson.resolve()),
        "video_id": video_id,
        **binding,
    }
    operation_hash = hashlib.sha256(operation.encode("utf-8")).hexdigest()
    intent_path = identity_state_path(identity, f".{operation_hash}.media.json")
    with media_followup_lock(identity):
        intent = read_json(intent_path) if intent_path.exists() else None
        if intent is not None:
            require(isinstance(intent, dict), "optional media intent must be an object")
            for key, value in immutable.items():
                require(intent.get(key) == value, f"optional media intent {key} mismatch")
            status = intent.get("status")
            if status == "completed":
                bound_receipt = resolve_repo_path(str(intent.get("receipt_path") or ""))
                validate_optional_media_receipt(bound_receipt, expected=immutable)
                require(sha256_file(bound_receipt) == intent.get("receipt_sha256"),
                        "optional media intent receipt hash mismatch")
                return bound_receipt, str(intent["receipt_sha256"])
            if status == "dispatched" and receipt_path.is_file():
                validate_optional_media_receipt(receipt_path, expected=immutable)
                receipt_sha = sha256_file(receipt_path)
                intent.update(
                    status="completed", completed_at=now_iso(),
                    receipt_path=str(receipt_path.resolve()), receipt_sha256=receipt_sha,
                )
                atomic_write_json(intent_path, intent)
                return receipt_path, receipt_sha
            if status == "dispatched":
                raise ReplacementError(
                    "optional media outcome is unresolved; reconcile before retrying"
                )
            raise ReplacementError(f"unsupported optional media intent status: {status}")

        intent = {**immutable, "status": "dispatched", "started_at": now_iso()}
        atomic_write_json(intent_path, intent)
        from upload_lesson import run_optional_media_followups
        results = run_optional_media_followups(
            lesson, video_id, no_thumbnail=no_thumbnail, no_captions=no_captions,
        )
        receipt = {
            **immutable,
            "status": "completed",
            "completed_at": now_iso(),
            "results": results,
        }
        atomic_write_json(receipt_path, receipt)
        receipt_sha = sha256_file(receipt_path)
        intent.update(
            status="completed", completed_at=now_iso(),
            receipt_path=str(receipt_path.resolve()), receipt_sha256=receipt_sha,
        )
        atomic_write_json(intent_path, intent)
        return receipt_path, receipt_sha


def validate_replacement_media_plan_receipt(plan_path: Path, plan: dict[str, Any]) -> bool:
    receipt_text = str(plan.get("optional_media_receipt") or "")
    receipt_sha = str(plan.get("optional_media_receipt_sha256") or "")
    if not receipt_text and not receipt_sha:
        return False
    require(bool(receipt_text) and bool(receipt_sha),
            "optional media plan receipt binding is incomplete")
    identity = str(plan.get("identity") or "")
    video_id = str(plan.get("new_video_id") or "")
    candidate = resolve_repo_path(str(plan.get("candidate_lesson_dir") or ""))
    expected = {
        "schema_version": OPTIONAL_MEDIA_SCHEMA_VERSION,
        "operation": f"replacement:{plan_path.resolve()}",
        "identity": identity,
        "lesson_dir": str(candidate.resolve()),
        "video_id": video_id,
        "plan_path": str(plan_path.resolve()),
    }
    receipt_path = resolve_repo_path(receipt_text)
    validate_optional_media_receipt(receipt_path, expected=expected)
    require(sha256_file(receipt_path) == receipt_sha, "optional media receipt hash mismatch")
    return True


def complete_replacement_media_followups(plan_path: Path, candidate: Path, video_id: str) -> None:
    """Run optional media once, outside upload-critical locks, with crash evidence."""
    require(bool(video_id), "replacement optional media follow-up lacks a video ID")
    current = load_plan(plan_path, minimum_state="uploaded_pending_readback")
    identity = str(current.get("identity") or "")
    require(current.get("new_video_id") == video_id, "replacement optional media video mismatch")
    operation = f"replacement:{plan_path.resolve()}"
    if validate_replacement_media_plan_receipt(plan_path, current):
        return

    receipt_path = plan_artifact_path(plan_path, f"optional-media-{video_id}")
    receipt_path, receipt_sha = run_durable_optional_media_followups(
        identity=identity,
        operation=operation,
        lesson=candidate,
        video_id=video_id,
        receipt_path=receipt_path,
        binding={"plan_path": str(plan_path.resolve())},
    )
    with identity_lock(identity):
        locked = load_plan(plan_path, minimum_state="uploaded_pending_readback")
        require(locked.get("new_video_id") == video_id,
                "replacement video changed before media receipt persistence")
        if not validate_replacement_media_plan_receipt(plan_path, locked):
            save_event(
                plan_path,
                locked,
                locked["state"],
                "optional_media_followups_completed",
                optional_media_receipt=relative(receipt_path),
                optional_media_receipt_sha256=receipt_sha,
            )


def youtube_client():
    from googleapiclient.discovery import build

    return build("youtube", "v3", credentials=get_creds())


def authenticated_upload_inventory(yt: Any, *, max_pages: int = 20) -> list[dict[str, str]]:
    channels = yt.channels().list(part="id,contentDetails", mine=True).execute().get("items") or []
    require(len(channels) == 1, "cannot identify exactly one authenticated YouTube channel")
    uploads_id = str((((channels[0].get("contentDetails") or {}).get("relatedPlaylists") or {}).get("uploads")) or "")
    require(bool(uploads_id), "authenticated channel lacks an uploads playlist")
    rows: dict[str, dict[str, str]] = {}
    page = None
    for _ in range(max_pages):
        response = yt.playlistItems().list(
            part="snippet,contentDetails", playlistId=uploads_id, maxResults=50, pageToken=page,
        ).execute()
        for row in response.get("items") or []:
            video_id = str(((row.get("contentDetails") or {}).get("videoId")) or "")
            require(bool(video_id), "authenticated upload inventory row lacks a video ID")
            title = str(((row.get("snippet") or {}).get("title")) or "").strip()
            require(bool(title), f"authenticated upload inventory row {video_id} lacks a title")
            require(video_id not in rows, "authenticated upload inventory contains a duplicate video ID")
            rows[video_id] = {
                "video_id": video_id,
                "title": title,
            }
        page = response.get("nextPageToken")
        if not page:
            return [rows[video_id] for video_id in sorted(rows)]
    require(not page, "authenticated upload snapshot exceeded the bounded page limit")
    return []


def authenticated_upload_ids(yt: Any, *, max_pages: int = 20) -> list[str]:
    return [row["video_id"] for row in authenticated_upload_inventory(yt, max_pages=max_pages)]


def _parse_utc(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    require(parsed.tzinfo is not None, "upload intent timestamp lacks timezone")
    return parsed.astimezone(timezone.utc)


def validate_reconciliation_intent(
    intent: dict[str, Any], *, require_dispatched: bool,
) -> tuple[str, set[str], str]:
    """Validate crash-recovery inputs without converting corrupt state to defaults."""
    nonce = intent.get("reconciliation_nonce")
    require(
        isinstance(nonce, str) and re.fullmatch(r"[0-9a-f]{48}", nonce) is not None,
        "durable upload intent has an invalid reconciliation nonce",
    )
    raw_ids = intent.get("pre_dispatch_video_ids")
    require(
        isinstance(raw_ids, list)
        and all(
            isinstance(video_id, str)
            and video_id.strip() == video_id
            and bool(video_id)
            for video_id in raw_ids
        )
        and raw_ids == sorted(set(raw_ids)),
        "durable upload intent has an invalid pre-dispatch snapshot",
    )
    started_at = intent.get("started_at")
    require(
        isinstance(started_at, str) and bool(started_at),
        "durable upload intent lacks a valid start timestamp",
    )
    try:
        started = _parse_utc(started_at)
    except (TypeError, ValueError) as exc:
        raise ReplacementError("durable upload intent has an invalid start timestamp") from exc
    dispatched_at = intent.get("dispatched_at")
    if require_dispatched:
        require(
            isinstance(dispatched_at, str) and bool(dispatched_at),
            "durable upload intent lacks a valid dispatch timestamp",
        )
        try:
            dispatched = _parse_utc(dispatched_at)
        except (TypeError, ValueError) as exc:
            raise ReplacementError("durable upload intent has an invalid dispatch timestamp") from exc
        require(
            dispatched >= started,
            "durable upload intent dispatch timestamp predates its start",
        )
        return nonce, set(raw_ids), dispatched_at
    if dispatched_at is not None:
        require(
            isinstance(dispatched_at, str) and bool(dispatched_at),
            "durable upload intent has an invalid dispatch timestamp",
        )
        try:
            dispatched = _parse_utc(dispatched_at)
        except (TypeError, ValueError) as exc:
            raise ReplacementError("durable upload intent has an invalid dispatch timestamp") from exc
        require(
            dispatched >= started,
            "durable upload intent dispatch timestamp predates its start",
        )
        return nonce, set(raw_ids), dispatched_at
    return nonce, set(raw_ids), started_at


def find_exact_upload_adoption(
    yt: Any, *, expected_title: str, privacy: str, started_at: str,
    reconciliation_nonce: str,
    pre_dispatch_video_ids: set[str],
    exclude_video_ids: set[str] | None = None,
) -> dict[str, Any]:
    """Find one exact upload accepted during the bounded dispatch window."""
    exclude_video_ids = exclude_video_ids or set()
    require(bool(reconciliation_nonce), "upload reconciliation nonce is missing")
    start = _parse_utc(started_at)
    end = start + timedelta(hours=6)
    channels = yt.channels().list(part="id,contentDetails", mine=True).execute().get("items") or []
    require(len(channels) == 1, "cannot identify exactly one authenticated YouTube channel")
    channel_id = str(channels[0].get("id") or "")
    uploads_id = str((((channels[0].get("contentDetails") or {}).get("relatedPlaylists") or {}).get("uploads")) or "")
    require(bool(channel_id) and bool(uploads_id), "authenticated channel lacks an uploads playlist")
    ids: list[str] = []
    page = None
    for _ in range(10):
        response = yt.playlistItems().list(
            part="contentDetails", playlistId=uploads_id, maxResults=50, pageToken=page,
        ).execute()
        for row in response.get("items") or []:
            video_id = str(((row.get("contentDetails") or {}).get("videoId")) or "")
            if video_id and video_id not in exclude_video_ids and video_id not in pre_dispatch_video_ids:
                ids.append(video_id)
        page = response.get("nextPageToken")
        if not page:
            break
    require(not page, "upload reconciliation candidate search exceeded the bounded page limit")
    matches: list[dict[str, Any]] = []
    for index in range(0, len(ids), 50):
        rows = yt.videos().list(
            part="snippet,status", id=",".join(ids[index:index + 50]), maxResults=50,
        ).execute().get("items") or []
        for row in rows:
            snippet = row.get("snippet") or {}
            status = row.get("status") or {}
            try:
                published = _parse_utc(str(snippet.get("publishedAt") or ""))
            except (ValueError, ReplacementError):
                continue
            marker = f"GIIS_UPLOAD_INTENT={reconciliation_nonce}"
            if (
                str(snippet.get("channelId") or "") == channel_id
                and snippet.get("title") == expected_title
                and status.get("privacyStatus") == privacy
                and str(snippet.get("description") or "").splitlines().count(marker) == 1
                and start <= published <= end
            ):
                matches.append(row)
    require(len(matches) == 1,
            f"upload reconciliation found {len(matches)} exact candidates; refusing adoption")
    return matches[0]


def adopted_youtube_payload(
    row: dict[str, Any], *, privacy: str, playlist_name: str | None,
) -> dict[str, Any]:
    video_id = str(row.get("id") or "")
    snippet = row.get("snippet") or {}
    require(bool(video_id), "reconciled YouTube candidate lacks video ID")
    return {
        "video_id": video_id,
        "url": f"https://youtu.be/{video_id}",
        "embed_url": f"https://www.youtube.com/embed/{video_id}",
        "studio_url": f"https://studio.youtube.com/video/{video_id}/edit",
        "privacy": privacy,
        "playlist": playlist_name,
        "playlist_id": None,
        "uploaded_at": snippet.get("publishedAt") or now_iso(),
    }


def youtube_video(yt: Any, video_id: str) -> dict[str, Any] | None:
    response = yt.videos().list(part="snippet,status,processingDetails", id=video_id).execute()
    items = response.get("items") or []
    return items[0] if items else None


def verify_new_video(plan: dict[str, Any], yt: Any) -> dict[str, Any]:
    new_id = str(plan.get("new_video_id") or "")
    require(bool(new_id), "plan lacks new video ID")
    mine = yt.channels().list(part="id", mine=True).execute().get("items") or []
    require(len(mine) == 1, "cannot identify exactly one authenticated YouTube channel")
    video = youtube_video(yt, new_id)
    require(video is not None, "new video is not readable from YouTube")
    snippet = video.get("snippet") or {}
    status = video.get("status") or {}
    processing = video.get("processingDetails") or {}
    require(snippet.get("channelId") == mine[0].get("id"), "new video is on the wrong channel")
    require(snippet.get("title") == plan.get("expected_youtube_title"), "new video title does not match exact lesson identity")
    require(status.get("uploadStatus") == "processed", f"new video uploadStatus is {status.get('uploadStatus')}")
    require(processing.get("processingStatus") == "succeeded", "new video processing did not succeed")
    require(status.get("privacyStatus") == plan.get("privacy"), "new video privacy does not match plan")
    require(status.get("embeddable") is True, "new video is not explicitly embeddable")
    return {
        "video_id": new_id,
        "title": snippet.get("title"),
        "channel_id": snippet.get("channelId"),
        "privacy": status.get("privacyStatus"),
        "upload_status": status.get("uploadStatus"),
        "processing_status": processing.get("processingStatus"),
        "embeddable": status.get("embeddable"),
        "published_at": snippet.get("publishedAt"),
        "verified_at": now_iso(),
    }


def youtube_playlist(yt: Any, playlist_id: str) -> dict[str, Any]:
    response = yt.playlists().list(part="snippet,status", id=playlist_id, maxResults=1).execute()
    items = response.get("items") or []
    require(len(items) == 1, "managed course playlist is not readable")
    return items[0]


def verify_remote_replacement_target(plan: dict[str, Any], yt: Any) -> dict[str, Any]:
    mine = yt.channels().list(part="id", mine=True).execute().get("items") or []
    require(len(mine) == 1, "cannot identify exactly one authenticated YouTube channel")
    channel_id = mine[0].get("id")
    old = youtube_video(yt, str(plan.get("old_video_id") or ""))
    require(old is not None, "planned old video is not readable before replacement upload")
    old_snippet = old.get("snippet") or {}
    require(old_snippet.get("channelId") == channel_id, "planned old video is on the wrong channel")
    require(old_snippet.get("title") == plan.get("expected_youtube_title"), "planned old video title does not match lesson identity")
    playlist = youtube_playlist(yt, str(plan.get("playlist_id") or ""))
    playlist_snippet = playlist.get("snippet") or {}
    require(playlist_snippet.get("channelId") == channel_id, "managed playlist is on the wrong channel")
    require(playlist_snippet.get("title") == plan.get("playlist_name"), "managed playlist title does not match replacement plan")
    entries = playlist_entries(yt, str(plan.get("playlist_id") or ""))
    old_rows = [row for row in entries if row["video_id"] == plan.get("old_video_id")]
    require(len(old_rows) == 1, "planned old video must appear exactly once in the managed playlist")
    return {
        "verified_at": now_iso(),
        "channel_id": channel_id,
        "old_video_id": plan["old_video_id"],
        "old_video_title": old_snippet.get("title"),
        "playlist_id": plan["playlist_id"],
        "playlist_name": plan["playlist_name"],
        "old_playlist_position": old_rows[0].get("position"),
    }


def playlist_entries(yt: Any, playlist_id: str) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    page_token = None
    while True:
        response = yt.playlistItems().list(
            part="snippet,contentDetails",
            playlistId=playlist_id,
            maxResults=50,
            pageToken=page_token,
        ).execute()
        for item in response.get("items") or []:
            snippet = item.get("snippet") or {}
            content = item.get("contentDetails") or {}
            resource = snippet.get("resourceId") or {}
            video_id = content.get("videoId") or resource.get("videoId")
            if video_id:
                entries.append({
                    "item_id": item.get("id"),
                    "video_id": video_id,
                    "position": snippet.get("position"),
                })
        page_token = response.get("nextPageToken")
        if not page_token:
            return entries


def managed_playlists_by_title(yt: Any, title: str) -> list[dict[str, Any]]:
    matches: list[dict[str, Any]] = []
    page_token = None
    while True:
        response = yt.playlists().list(
            part="snippet,status", mine=True, maxResults=50, pageToken=page_token,
        ).execute()
        matches.extend(
            item for item in (response.get("items") or [])
            if str((item.get("snippet") or {}).get("title") or "").casefold()
            == title.casefold()
        )
        page_token = response.get("nextPageToken")
        if not page_token:
            return matches


def ensure_playlist_continuity(
    plan: dict[str, Any], yt: Any, *, channel_id: str,
    old_video_exists: bool, apply: bool,
) -> dict[str, Any]:
    with playlist_lock(str(plan.get("playlist_name") or "")):
        return _ensure_playlist_continuity_locked(
            plan, yt, channel_id=channel_id,
            old_video_exists=old_video_exists, apply=apply,
        )


def replacement_playlist_binding(plan: dict[str, Any]) -> dict[str, Any]:
    return {
        "schema_version": "giis.youtube-replacement-playlist.v1",
        "identity": str(plan.get("identity") or ""),
        "playlist_id": str(plan.get("playlist_id") or ""),
        "playlist_name": str(plan.get("playlist_name") or ""),
        "old_video_id": plan.get("old_video_id"),
        "new_video_id": plan.get("new_video_id"),
    }


def _ensure_playlist_continuity_locked(
    plan: dict[str, Any],
    yt: Any,
    *,
    channel_id: str,
    old_video_exists: bool,
    apply: bool,
) -> dict[str, Any]:
    playlist_id = str(plan.get("playlist_id") or "")
    playlist_name = str(plan.get("playlist_name") or "")
    require(bool(playlist_id) and bool(playlist_name), "replacement plan lacks managed playlist identity")
    named = managed_playlists_by_title(yt, playlist_name)
    require(len(named) == 1, "managed playlist title is missing or duplicated")
    require(str(named[0].get("id") or "") == playlist_id,
            "managed playlist title resolves to a different playlist ID")
    playlist = youtube_playlist(yt, playlist_id)
    snippet = playlist.get("snippet") or {}
    require(snippet.get("channelId") == channel_id, "managed playlist is on the wrong channel")
    require(snippet.get("title") == playlist_name, "managed playlist title does not match the replacement plan")

    entries = playlist_entries(yt, playlist_id)
    old_rows = [row for row in entries if row["video_id"] == plan["old_video_id"]]
    new_rows = [row for row in entries if row["video_id"] == plan["new_video_id"]]
    require(len(old_rows) <= 1 and len(new_rows) <= 1, "playlist has duplicate old/new lesson entries")
    require(old_rows or new_rows or not old_video_exists, "old video exists but is absent from its managed playlist")
    inserted = False
    if not new_rows and apply:
        identity = str(plan.get("identity") or "")
        require(bool(identity), "replacement playlist operation lacks identity")
        intent_path = identity_state_path(
            identity, f".replacement-playlist-{plan['new_video_id']}.json",
        )
        immutable = replacement_playlist_binding(plan)
        if intent_path.exists():
            intent = read_json(intent_path)
            for key, value in immutable.items():
                require(intent.get(key) == value, f"replacement playlist intent {key} mismatch")
            require(intent.get("status") in {"dispatched", "completed"},
                    "replacement playlist intent has unsupported status")
            raise ReplacementError(
                "replacement playlist insert outcome remains unresolved; no insert replayed"
            )
        intent = {**immutable, "status": "dispatched", "started_at": now_iso()}
        atomic_write_json(intent_path, intent)
        body = {
            "snippet": {
                "playlistId": playlist_id,
                "resourceId": {"kind": "youtube#video", "videoId": plan["new_video_id"]},
            }
        }
        if old_rows and old_rows[0].get("position") is not None:
            body["snippet"]["position"] = int(old_rows[0]["position"])
        insert_error: Exception | None = None
        try:
            yt.playlistItems().insert(part="snippet", body=body).execute()
            inserted = True
        except Exception as exc:
            insert_error = exc
        for attempt in range(6):
            entries = playlist_entries(yt, playlist_id)
            new_rows = [row for row in entries if row["video_id"] == plan["new_video_id"]]
            if len(new_rows) == 1:
                break
            if len(new_rows) > 1:
                raise ReplacementError("new video playlist membership read back more than once")
            if attempt == 5:
                message = "new video playlist insert outcome is unresolved; no retry was sent"
                raise ReplacementError(message) from insert_error
            time.sleep(2)
        inserted = True
        intent.update(
            status="completed", completed_at=now_iso(),
            playlist_item_id=new_rows[0].get("item_id"),
        )
        atomic_write_json(intent_path, intent)
    elif new_rows and apply:
        identity = str(plan.get("identity") or "")
        if identity:
            intent_path = identity_state_path(
                identity, f".replacement-playlist-{plan['new_video_id']}.json",
            )
            if intent_path.exists():
                intent = read_json(intent_path)
                immutable = replacement_playlist_binding(plan)
                for key, value in immutable.items():
                    require(intent.get(key) == value,
                            f"replacement playlist intent {key} mismatch")
                require(intent.get("status") in {"dispatched", "completed"},
                        "replacement playlist intent has unsupported status")
                intent.update(
                    status="completed", completed_at=now_iso(),
                    playlist_item_id=new_rows[0].get("item_id"),
                )
                atomic_write_json(intent_path, intent)

    return {
        "playlist_id": playlist_id,
        "playlist_name": playlist_name,
        "old_present": bool(old_rows),
        "new_present": bool(new_rows),
        "needs_insert": not bool(new_rows),
        "inserted": inserted,
        "new_position": new_rows[0].get("position") if new_rows else None,
        "verified_at": now_iso(),
    }


def remove_old_playlist_entry(plan: dict[str, Any], yt: Any, *, apply: bool) -> dict[str, Any]:
    with playlist_lock(str(plan.get("playlist_name") or "")):
        return _remove_old_playlist_entry_locked(plan, yt, apply=apply)


def _remove_old_playlist_entry_locked(
    plan: dict[str, Any], yt: Any, *, apply: bool,
) -> dict[str, Any]:
    playlist_id = str(plan.get("playlist_id") or "")
    playlist_name = str(plan.get("playlist_name") or "")
    named = managed_playlists_by_title(yt, playlist_name)
    require(len(named) == 1 and str(named[0].get("id") or "") == playlist_id,
            "managed playlist title is missing, duplicated, or changed")
    entries = playlist_entries(yt, playlist_id)
    old_rows = [row for row in entries if row["video_id"] == plan["old_video_id"]]
    require(len(old_rows) <= 1, "playlist has duplicate old lesson entries")
    removed = False
    if old_rows and apply:
        item_id = str(old_rows[0].get("item_id") or "")
        require(bool(item_id), "old playlist entry lacks an item ID")
        yt.playlistItems().delete(id=item_id).execute()
        removed = True
        for attempt in range(6):
            entries = playlist_entries(yt, playlist_id)
            old_rows = [row for row in entries if row["video_id"] == plan["old_video_id"]]
            if not old_rows:
                break
            if attempt == 5:
                raise ReplacementError("old playlist entry still exists after removal propagation wait")
            time.sleep(2)
    return {
        "old_playlist_item_present": bool(old_rows),
        "old_playlist_item_removed": removed,
        "verified_at": now_iso(),
    }


def verify_upload(plan_path: Path) -> None:
    plan = load_plan(plan_path, minimum_state="uploaded_pending_readback")
    require(plan["state"] == "uploaded_pending_readback", "upload readback has already advanced or is out of order")
    require(validate_replacement_media_plan_receipt(plan_path, plan),
            "optional media follow-up receipt is required before upload verification")
    with identity_lock(str(plan.get("identity") or "")):
        locked_plan = load_plan(plan_path, minimum_state="uploaded_pending_readback")
        require(locked_plan == plan, "replacement plan changed before upload readback lock")
        require(locked_plan["state"] == "uploaded_pending_readback", "upload readback state changed while waiting for identity lock")
        require(validate_replacement_media_plan_receipt(plan_path, locked_plan),
                "optional media follow-up receipt changed before upload verification")
        plan = locked_plan
        receipt = verify_new_video(plan, youtube_client())
        receipt["oembed"] = verify_oembed(plan["new_video_id"])
        require(receipt["oembed"].get("title") == plan.get("expected_youtube_title"), "oEmbed title does not match lesson identity")
        receipt_path = plan_artifact_path(plan_path, "youtube-upload-readback")
        atomic_write_json(receipt_path, receipt)
        save_event(
            plan_path, plan, "upload_verified", "youtube_readback_passed",
            youtube_readback=relative(receipt_path), published_at=receipt.get("published_at"),
        )
    print(f"[upload-verified] {receipt['video_id']}")


def update_manifest(manifest: dict[str, Any], plan: dict[str, Any], *, published_at: str) -> None:
    require(bool(plan.get("new_video_id")), "plan lacks new video ID")
    flat, grouped = manifest_rows(manifest, plan["course"], int(plan["module_number"]))
    require(flat.get("lesson_dir") == plan.get("manifest_lesson_dir"), "manifest lesson_dir changed")
    require(flat.get("youtube_id") == plan.get("old_video_id"), "manifest no longer points to expected old video")
    for row in (flat, grouped):
        row["youtube_id"] = plan["new_video_id"]
        row["url"] = f"https://youtu.be/{plan['new_video_id']}"
        row["embed_url"] = f"https://www.youtube.com/embed/{plan['new_video_id']}"
        row["published_at"] = published_at
    manifest["generated_at"] = now_iso()


def sync_local_manifest_row(
    local_manifest: dict[str, Any], live_manifest: dict[str, Any], plan: dict[str, Any]
) -> bool:
    """Copy only the verified replacement row into the active checkout."""
    local_flat, local_grouped = manifest_rows(
        local_manifest, plan["course"], int(plan["module_number"])
    )
    live_flat, live_grouped = manifest_rows(
        live_manifest, plan["course"], int(plan["module_number"])
    )
    require(live_flat.get("youtube_id") == plan.get("new_video_id"), "live manifest is not pinned to the new video")
    require(live_grouped.get("youtube_id") == plan.get("new_video_id"), "live grouped manifest is not pinned to the new video")
    require(
        local_flat.get("youtube_id") in {plan.get("old_video_id"), plan.get("new_video_id")},
        "local manifest replacement row drifted to an unexpected video ID",
    )
    require(
        local_flat.get("lesson_dir") == plan.get("manifest_lesson_dir"),
        "local manifest lesson_dir changed",
    )
    changed = False
    for local_row, live_row in ((local_flat, live_flat), (local_grouped, live_grouped)):
        for key in ("youtube_id", "url", "embed_url", "published_at"):
            if local_row.get(key) != live_row.get(key):
                local_row[key] = live_row.get(key)
                changed = True
    return changed


def sync_local_manifest(plan_path: Path, plan: dict[str, Any], live_manifest: dict[str, Any]) -> Path:
    before = sha256_file(MANIFEST_PATH)
    local_manifest = read_json(MANIFEST_PATH)
    changed = sync_local_manifest_row(local_manifest, live_manifest, plan)
    if changed:
        atomic_write_json(MANIFEST_PATH, local_manifest)
    receipt_path = plan_artifact_path(plan_path, "local-manifest-sync")
    atomic_write_json(receipt_path, {
        "schema_version": "giis.local-manifest-sync.v1",
        "status": "SYNCED" if changed else "ALIGNED",
        "verified_at": now_iso(),
        "course": plan["course"],
        "module_number": plan["module_number"],
        "video_id": plan["new_video_id"],
        "manifest_path": relative(MANIFEST_PATH),
        "manifest_sha256_before": before,
        "manifest_sha256_after": sha256_file(MANIFEST_PATH),
    })
    return receipt_path


def git_show_manifest(ref: str) -> tuple[dict[str, Any], str]:
    result = run(["git", "show", f"{ref}:{MANIFEST_REL}"])
    raw = result.stdout
    return json.loads(raw), hashlib.sha256(raw.encode()).hexdigest()


@contextmanager
def release_lock() -> Iterator[Any]:
    try:
        with acquire_release_lock(
            ROOT,
            owner="youtube-replacement-lifecycle",
        ) as held:
            yield held
    except ReleaseLockError as exc:
        raise ReplacementError(f"shared release lock unavailable: {exc}") from exc


def manifest_publish_binding(plan_path: Path, plan: dict[str, Any]) -> dict[str, Any]:
    return {
        "schema_version": "giis.youtube-manifest-publish.v1",
        "plan_path": str(plan_path.resolve()),
        "identity": plan.get("identity"),
        "old_video_id": plan.get("old_video_id"),
        "new_video_id": plan.get("new_video_id"),
        "manifest_sha256_before": plan.get("manifest_sha256_before"),
    }


def validate_manifest_publish_intent(
    intent: Any, *, plan_path: Path, plan: dict[str, Any],
) -> dict[str, Any]:
    require(isinstance(intent, dict), "manifest publish intent must be an object")
    for key, value in manifest_publish_binding(plan_path, plan).items():
        require(intent.get(key) == value, f"manifest publish intent {key} mismatch")
    return intent


def verify_published_manifest_commit(
    plan: dict[str, Any], commit: str, expected_manifest_sha: str,
) -> None:
    require(bool(commit) and bool(expected_manifest_sha),
            "manifest publish intent lacks commit evidence")
    commit_manifest, commit_manifest_sha = git_show_manifest(commit)
    require(commit_manifest_sha == expected_manifest_sha,
            "manifest publish commit evidence hash mismatch")
    flat, grouped = manifest_rows(commit_manifest, plan["course"], int(plan["module_number"]))
    require(flat.get("youtube_id") == plan.get("new_video_id")
            and grouped.get("youtube_id") == plan.get("new_video_id"),
            "manifest publish commit does not contain the planned replacement")


def publish_manifest(plan_path: Path, *, apply: bool) -> None:
    plan = load_plan(plan_path, minimum_state="upload_verified")
    require(plan["state"] == "upload_verified", "manifest publish requires upload_verified state")
    require(plan.get("published_at"), "YouTube readback lacks published_at")
    with (release_lock() if apply else nullcontext()), (
        identity_lock(str(plan.get("identity") or "")) if apply else nullcontext()
    ):
        if apply:
            locked_plan = load_plan(plan_path, minimum_state="upload_verified")
            require(locked_plan == plan, "replacement plan changed before manifest publish locks")
            require(locked_plan["state"] == "upload_verified", "manifest publish state changed while waiting for locks")
            plan = locked_plan
        run(["git", "fetch", "origin", "main"], timeout=300)
        manifest, source_hash = git_show_manifest("origin/main")
        intent_path = (
            identity_state_path(
                str(plan.get("identity") or ""),
                "." + hashlib.sha256(str(plan_path.resolve()).encode("utf-8")).hexdigest()
                + ".manifest-publish.json",
            )
            if apply else None
        )
        intent = (
            validate_manifest_publish_intent(
                read_json(intent_path), plan_path=plan_path, plan=plan,
            )
            if intent_path is not None and intent_path.exists() else None
        )
        if source_hash != plan.get("manifest_sha256_before"):
            require(intent is not None, "origin/main manifest changed since prepare; re-prepare")
            commit = str(intent.get("commit") or "")
            expected_after = str(intent.get("manifest_sha256_after") or "")
            verify_published_manifest_commit(plan, commit, expected_after)
            run(["git", "merge-base", "--is-ancestor", commit, "origin/main"])
            remote_flat, remote_grouped = manifest_rows(
                manifest, plan["course"], int(plan["module_number"])
            )
            require(remote_flat.get("youtube_id") == plan.get("new_video_id")
                    and remote_grouped.get("youtube_id") == plan.get("new_video_id"),
                    "origin/main changed without retaining the planned replacement")
            save_event(
                plan_path, plan, "manifest_published", "manifest_push_recovered",
                manifest_commit=commit,
            )
            print(f"[manifest-published:recovered] {commit}")
            return
        update_manifest(manifest, plan, published_at=plan["published_at"])
        if not apply:
            print(f"[dry-run] would publish one manifest row: {plan['course']} M{plan['module_number']}")
            print(f"[link] {plan['old_video_id']} -> {plan['new_video_id']}")
            return
        if intent is None:
            intent = {
                **manifest_publish_binding(plan_path, plan),
                "status": "started",
                "started_at": now_iso(),
            }
            atomic_write_json(intent_path, intent)
        elif intent.get("status") == "commit_ready":
            commit = str(intent.get("commit") or "")
            expected_after = str(intent.get("manifest_sha256_after") or "")
            verify_published_manifest_commit(plan, commit, expected_after)
            parent = run(["git", "rev-parse", f"{commit}^"]).stdout.strip()
            remote_head = run(["git", "rev-parse", "origin/main"]).stdout.strip()
            require(parent == remote_head, "manifest commit is no longer based on current origin/main")
            run(["git", "push", "origin", f"{commit}:main"], timeout=300)
            run(["git", "fetch", "origin", "main"], timeout=300)
            remote_manifest, _remote_sha = git_show_manifest("origin/main")
            remote_flat, _remote_grouped = manifest_rows(
                remote_manifest, plan["course"], int(plan["module_number"])
            )
            require(remote_flat.get("youtube_id") == plan.get("new_video_id"),
                    "replayed manifest push did not read back the planned video")
            intent.update(status="pushed", pushed_at=now_iso())
            atomic_write_json(intent_path, intent)
            save_event(
                plan_path, plan, "manifest_published", "manifest_commit_push_replayed",
                manifest_commit=commit,
            )
            print(f"[manifest-published:replayed] {commit}")
            return
        else:
            require(intent.get("status") == "started",
                    f"unsupported manifest publish intent status: {intent.get('status')}")
        with tempfile.TemporaryDirectory(prefix="giis-video-replacement-") as tmp:
            worktree = Path(tmp) / "worktree"
            run(["git", "worktree", "add", "--detach", str(worktree), "origin/main"], timeout=300)
            try:
                manifest_path = worktree / MANIFEST_REL
                atomic_write_json(manifest_path, manifest)
                run(["node", "tools/youtube-upload/audit_manifest_alignment.js", "--strict"], cwd=worktree)
                run(["git", "add", str(MANIFEST_REL)], cwd=worktree)
                staged = run(["git", "diff", "--cached", "--name-only"], cwd=worktree).stdout.splitlines()
                require_only_manifest_staged(staged)
                message = f"Replace {plan['course']} module {plan['module_number']} lesson video"
                run(["git", "commit", "-m", message], cwd=worktree)
                commit = run(["git", "rev-parse", "HEAD"], cwd=worktree).stdout.strip()
                _committed_manifest, manifest_sha_after = git_show_manifest(commit)
                intent.update(
                    status="commit_ready", commit=commit,
                    manifest_sha256_after=manifest_sha_after,
                    commit_ready_at=now_iso(),
                )
                atomic_write_json(intent_path, intent)
                run(["git", "push", "origin", "HEAD:main"], cwd=worktree, timeout=300)
            finally:
                subprocess.run(
                    ["git", "worktree", "remove", "--force", str(worktree)],
                    cwd=ROOT, text=True, capture_output=True, check=False,
                )
        run(["git", "fetch", "origin", "main"], timeout=300)
        remote_manifest, _remote_sha = git_show_manifest("origin/main")
        remote_flat, _remote_grouped = manifest_rows(
            remote_manifest, plan["course"], int(plan["module_number"])
        )
        require(remote_flat.get("youtube_id") == plan.get("new_video_id"),
                "manifest push did not read back the planned video")
        intent.update(status="pushed", pushed_at=now_iso())
        atomic_write_json(intent_path, intent)
        save_event(plan_path, plan, "manifest_published", "manifest_commit_pushed", manifest_commit=commit)
        print(f"[manifest-published] {commit}")


def require_only_manifest_staged(staged: list[str]) -> None:
    require(staged == [str(MANIFEST_REL)], f"manifest deploy staged unexpected files: {staged}")


def fetch_live_manifest(url: str) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": "GIIS replacement verifier/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            require(response.status == 200, f"live manifest returned HTTP {response.status}")
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, json.JSONDecodeError) as exc:
        raise ReplacementError(f"cannot read live manifest: {exc}") from exc


def verify_oembed(video_id: str) -> dict[str, Any]:
    import urllib.parse

    target = f"https://www.youtube.com/watch?v={video_id}"
    url = "https://www.youtube.com/oembed?" + urllib.parse.urlencode({"url": target, "format": "json"})
    request = urllib.request.Request(url, headers={"User-Agent": "GIIS replacement verifier/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            require(response.status == 200, f"YouTube oEmbed returned HTTP {response.status}")
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, json.JSONDecodeError) as exc:
        raise ReplacementError(f"new video failed external oEmbed readback: {exc}") from exc
    require(bool(payload.get("html")), "YouTube oEmbed response lacks embed HTML")
    return {"verified_at": now_iso(), "title": payload.get("title"), "author_name": payload.get("author_name")}


def sync_canonical_script(plan: dict[str, Any]) -> None:
    canonical = resolve_repo_path(plan["canonical_lesson_dir"])
    candidate = resolve_repo_path(plan["candidate_lesson_dir"])
    canonical_script_path = canonical / "script.json"
    canonical_script = read_json(canonical_script_path)
    old_youtube = canonical_script.get("youtube") or {}
    require(
        old_youtube.get("video_id") in {plan["old_video_id"], plan["new_video_id"]},
        "canonical script video ID changed outside the replacement plan",
    )
    candidate_youtube = (read_json(candidate / "script.json").get("youtube") or {})
    require(candidate_youtube.get("video_id") == plan["new_video_id"], "candidate script does not retain new video ID")
    if old_youtube.get("video_id") == plan["new_video_id"]:
        return
    next_youtube = dict(candidate_youtube)
    if old_youtube.get("playlist_id") and not next_youtube.get("playlist_id"):
        next_youtube["playlist_id"] = old_youtube["playlist_id"]
    next_youtube["synced_at"] = now_iso()
    canonical_script["youtube"] = next_youtube
    atomic_write_json(canonical_script_path, canonical_script)


def verify_live(plan_path: Path, *, url: str, timeout: int, interval: int) -> None:
    plan = load_plan(plan_path, minimum_state="manifest_published")
    require(plan["state"] == "manifest_published", "live verification requires manifest_published state")
    deadline = time.monotonic() + timeout
    last_error = ""
    while True:
        try:
            manifest = fetch_live_manifest(url)
            flat, grouped = manifest_rows(manifest, plan["course"], int(plan["module_number"]))
            require(flat.get("youtube_id") == plan["new_video_id"], "live manifest still points at old video")
            require(grouped.get("embed_url") == f"https://www.youtube.com/embed/{plan['new_video_id']}", "live embed URL is wrong")
            verify_new_video(plan, youtube_client())
            oembed = verify_oembed(plan["new_video_id"])
            require(oembed.get("title") == plan.get("expected_youtube_title"), "live oEmbed title does not match lesson identity")
            break
        except ReplacementError as exc:
            last_error = str(exc)
            if time.monotonic() >= deadline:
                raise ReplacementError(f"live verification timed out: {last_error}") from exc
            time.sleep(interval)
    # Poll without the global lock while Netlify catches up. Once live, take
    # both canonical locks, reload the exact plan, and repeat readback before
    # mutating the active manifest, canonical script, plan, or repair queue.
    with release_lock(), identity_lock(str(plan.get("identity") or "")):
        locked_plan = load_plan(plan_path, minimum_state="manifest_published")
        require(locked_plan == plan, "replacement plan changed before locked live synchronization")
        require(locked_plan["state"] == "manifest_published", "live verification state changed while waiting for locks")
        plan = locked_plan
        manifest = fetch_live_manifest(url)
        flat, grouped = manifest_rows(manifest, plan["course"], int(plan["module_number"]))
        require(flat.get("youtube_id") == plan["new_video_id"], "live manifest changed before local synchronization")
        require(grouped.get("embed_url") == f"https://www.youtube.com/embed/{plan['new_video_id']}", "live embed URL changed before local synchronization")
        verify_new_video(plan, youtube_client())
        oembed = verify_oembed(plan["new_video_id"])
        require(oembed.get("title") == plan.get("expected_youtube_title"), "live oEmbed title changed before local synchronization")
        receipt_path = plan_artifact_path(plan_path, "website-live-readback")
        receipt = {
            "verified_at": now_iso(),
            "manifest_url": url,
            "course": plan["course"],
            "module_number": plan["module_number"],
            "video_id": plan["new_video_id"],
            "embed_url": f"https://www.youtube.com/embed/{plan['new_video_id']}",
        }
        atomic_write_json(receipt_path, receipt)
        local_manifest_receipt = sync_local_manifest(plan_path, plan, manifest)
        sync_canonical_script(plan)
        save_event(
            plan_path,
            plan,
            "manifest_live",
            "website_live_readback_passed",
            website_readback=relative(receipt_path),
            local_manifest_receipt=relative(local_manifest_receipt),
        )
    print(f"[manifest-live] {plan['new_video_id']}")


def verify_website_browser(plan: dict[str, Any], receipt_path: Path, *, url: str, timeout: int) -> dict[str, Any]:
    command = [
        "node",
        str(ROOT / "tools/youtube-upload/verify_lesson_website_link.js"),
        "--url", url,
        "--course", str(plan["course"]),
        "--module", str(plan["module_number"]),
        "--video-id", str(plan["new_video_id"]),
        "--receipt", str(receipt_path),
        "--timeout", str(timeout),
    ]
    run(command, timeout=timeout + 60)
    receipt = read_json(receipt_path)
    require(receipt.get("status") == "PASS", "public lesson-library browser verification did not pass")
    require(receipt.get("video_id") == plan.get("new_video_id"), "browser receipt is bound to another video")
    require(receipt.get("course") == plan.get("course"), "browser receipt is bound to another course")
    require(int(receipt.get("module_number", -1)) == int(plan["module_number"]), "browser receipt is bound to another module")
    iframe = urllib.parse.urlparse(str(receipt.get("iframe_src") or ""))
    require(
        iframe.scheme == "https"
        and iframe.netloc == "www.youtube.com"
        and iframe.path == f"/embed/{plan['new_video_id']}"
        and not iframe.username
        and not iframe.password,
        "browser receipt iframe is not the exact expected YouTube embed",
    )
    return receipt


def verify_website(plan_path: Path, *, url: str, timeout: int) -> None:
    plan = load_plan(plan_path, minimum_state="manifest_live")
    require(plan["state"] == "manifest_live", "website verification requires manifest_live state")
    with identity_lock(str(plan.get("identity") or "")):
        locked_plan = load_plan(plan_path, minimum_state="manifest_live")
        require(locked_plan == plan, "replacement plan changed before website verification lock")
        require(locked_plan["state"] == "manifest_live", "website verification state changed while waiting for identity lock")
        plan = locked_plan
        receipt_path = plan_artifact_path(plan_path, "website-browser-readback")
        verify_website_browser(plan, receipt_path, url=url, timeout=timeout)
        save_event(
            plan_path,
            plan,
            "website_verified",
            "website_browser_readback_passed",
            browser_readback=relative(receipt_path),
        )
    print(f"[website-verified] {plan['new_video_id']}")


def retire_old(plan_path: Path, *, apply: bool, live_url: str) -> None:
    plan = load_plan(plan_path, minimum_state="website_verified")
    require(plan["state"] in {"website_verified", "replaced"}, "old-video retirement requires website_verified state")
    with (release_lock() if apply else nullcontext()), (
        identity_lock(str(plan.get("identity") or "")) if apply else nullcontext()
    ):
        if apply:
            locked_plan = load_plan(plan_path, minimum_state="website_verified")
            require(locked_plan == plan, "replacement plan changed before retirement locks")
            require(locked_plan["state"] in {"website_verified", "replaced"}, "retirement state changed while waiting for locks")
            plan = locked_plan
        live = fetch_live_manifest(live_url)
        flat, _grouped = manifest_rows(live, plan["course"], int(plan["module_number"]))
        require(flat.get("youtube_id") == plan["new_video_id"], "live website is not pinned to new video")
        yt = youtube_client()
        new_receipt = verify_new_video(plan, yt)
        old = youtube_video(yt, plan["old_video_id"])
        if old is not None:
            old_snippet = old.get("snippet") or {}
            require(old_snippet.get("channelId") == new_receipt.get("channel_id"), "old video is not on the authenticated replacement channel")
            require(old_snippet.get("title") == plan.get("expected_youtube_title"), "old video title does not match plan identity")
        playlist_transfer = ensure_playlist_continuity(
            plan,
            yt,
            channel_id=new_receipt["channel_id"],
            old_video_exists=old is not None,
            apply=apply,
        )
        if not apply:
            if playlist_transfer["needs_insert"]:
                print(f"[dry-run] would add {plan['new_video_id']} to playlist {plan['playlist_id']}")
            action = "record already-absent old video" if old is None else f"delete exact old video ID {plan['old_video_id']}"
            print(f"[dry-run] would {action}")
            if playlist_transfer["old_present"]:
                print(f"[dry-run] would remove the exact old playlist item from {plan['playlist_id']}")
            return
        already_absent = old is None
        if old is not None:
            live = fetch_live_manifest(live_url)
            flat, _grouped = manifest_rows(live, plan["course"], int(plan["module_number"]))
            require(
                flat.get("youtube_id") == plan["new_video_id"],
                "live website changed before old-video deletion",
            )
            verify_website_browser(
                plan, plan_artifact_path(plan_path, "website-pre-retirement-readback"),
                url="https://genesisideas.school/lessons", timeout=120,
            )
            yt.videos().delete(id=plan["old_video_id"]).execute()
            for attempt in range(6):
                if youtube_video(yt, plan["old_video_id"]) is None:
                    break
                if attempt == 5:
                    raise ReplacementError("old video still exists after delete propagation wait")
                time.sleep(5)
        verify_new_video(plan, yt)
        old_playlist_cleanup = remove_old_playlist_entry(plan, yt, apply=True)
        require(not old_playlist_cleanup["old_playlist_item_present"], "old video remains in the managed playlist")
        playlist_post = ensure_playlist_continuity(
            plan,
            yt,
            channel_id=new_receipt["channel_id"],
            old_video_exists=False,
            apply=False,
        )
        require(playlist_post["new_present"], "new video left the managed playlist after old-video retirement")
        require(not playlist_post["old_present"], "old video remains in the managed playlist after retirement")
        oembed = verify_oembed(plan["new_video_id"])
        require(oembed.get("title") == plan.get("expected_youtube_title"), "post-retirement oEmbed title does not match lesson identity")
        post_browser_receipt_path = plan_artifact_path(plan_path, "website-post-retirement-readback")
        verify_website_browser(plan, post_browser_receipt_path, url="https://genesisideas.school/lessons", timeout=120)
        playlist_receipt_path = plan_artifact_path(plan_path, "playlist-transfer")
        playlist_transfer["post_retirement"] = playlist_post
        playlist_transfer["old_playlist_cleanup"] = old_playlist_cleanup
        atomic_write_json(playlist_receipt_path, playlist_transfer)
        receipt_path = plan_artifact_path(plan_path, "old-video-retirement")
        receipt = {
            "retired_at": now_iso(),
            "old_video_id": plan["old_video_id"],
            "new_video_id": plan["new_video_id"],
            "scope": "exact-id-only",
            "already_absent_on_entry": already_absent,
        }
        atomic_write_json(receipt_path, receipt)
        save_event(
            plan_path,
            plan,
            "replaced",
            "old_video_retired",
            post_retirement_browser_readback=relative(post_browser_receipt_path),
            playlist_receipt=relative(playlist_receipt_path),
            retirement_receipt=relative(receipt_path),
        )
        print(f"[replaced] {plan['old_video_id']} -> {plan['new_video_id']}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("prepare")
    p.add_argument("candidate", type=Path)
    p.add_argument("--mp4", type=Path, required=True)
    p.add_argument("--output", type=Path)
    p = sub.add_parser("upload")
    p.add_argument("plan", type=Path)
    p.add_argument("--apply", action="store_true")
    p = sub.add_parser("reconcile-upload")
    p.add_argument("plan", type=Path)
    p.add_argument("--apply", action="store_true")
    p = sub.add_parser("complete-media")
    p.add_argument("plan", type=Path)
    p = sub.add_parser("verify-upload")
    p.add_argument("plan", type=Path)
    p = sub.add_parser("publish-manifest")
    p.add_argument("plan", type=Path)
    p.add_argument("--apply", action="store_true")
    p = sub.add_parser("verify-live")
    p.add_argument("plan", type=Path)
    p.add_argument("--url", default=LIVE_MANIFEST_URL)
    p.add_argument("--timeout", type=int, default=600)
    p.add_argument("--interval", type=int, default=20)
    p = sub.add_parser("verify-website")
    p.add_argument("plan", type=Path)
    p.add_argument("--url", default="https://genesisideas.school/lessons")
    p.add_argument("--timeout", type=int, default=90)
    p = sub.add_parser("retire-old")
    p.add_argument("plan", type=Path)
    p.add_argument("--apply", action="store_true")
    p.add_argument("--url", default=LIVE_MANIFEST_URL)
    p = sub.add_parser("status")
    p.add_argument("plan", type=Path)
    args = parser.parse_args()
    try:
        if args.command == "prepare":
            candidate = args.candidate.resolve() if args.candidate.is_absolute() else (ROOT / args.candidate).resolve()
            mp4 = args.mp4.resolve() if args.mp4.is_absolute() else (candidate / args.mp4).resolve()
            output = None if args.output is None else (args.output.resolve() if args.output.is_absolute() else (ROOT / args.output).resolve())
            prepare(candidate, mp4, output)
        elif args.command == "upload":
            upload(args.plan.resolve(), apply=args.apply)
        elif args.command == "reconcile-upload":
            reconcile_upload(args.plan.resolve(), apply=args.apply)
        elif args.command == "complete-media":
            plan_path = args.plan.resolve()
            plan = load_plan(plan_path, minimum_state="uploaded_pending_readback")
            require(plan["state"] == "uploaded_pending_readback",
                    "optional media completion requires uploaded_pending_readback state")
            complete_replacement_media_followups(
                plan_path,
                resolve_repo_path(plan["candidate_lesson_dir"]),
                str(plan.get("new_video_id") or ""),
            )
        elif args.command == "verify-upload":
            verify_upload(args.plan.resolve())
        elif args.command == "publish-manifest":
            publish_manifest(args.plan.resolve(), apply=args.apply)
        elif args.command == "verify-live":
            verify_live(args.plan.resolve(), url=args.url, timeout=args.timeout, interval=args.interval)
        elif args.command == "verify-website":
            verify_website(args.plan.resolve(), url=args.url, timeout=args.timeout)
        elif args.command == "retire-old":
            retire_old(args.plan.resolve(), apply=args.apply, live_url=args.url)
        else:
            plan = sync_status(args.plan.resolve())
            print(json.dumps(plan, indent=2, ensure_ascii=False))
        return 0
    except ReplacementError as exc:
        print(f"[HOLD] {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
