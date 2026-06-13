#!/usr/bin/env python3
"""Upload a single video to the GIIS YouTube channel via YouTube Data API v3.

Usage:
    python3 upload_video.py <video.mp4> \\
        --title "Algebra I — Module 4 — Solving One-Step and Two-Step Equations" \\
        --description-file desc.txt \\
        [--tags "algebra,math,giis"] \\
        [--privacy unlisted|private|public] \\
        [--thumbnail title.png] \\
        [--captions subtitles.srt]

First run will open a browser for Google OAuth and save a `token.json` next
to this script. Subsequent runs reuse the token (no browser needed) until
it expires (~6 months for installed apps).

See setup.md in this folder for the one-time Google Cloud setup steps.
"""
from __future__ import annotations
import argparse, json, os, sys
from pathlib import Path

REQUIRED_PKGS = [
    ("googleapiclient", "google-api-python-client"),
    ("google_auth_oauthlib", "google-auth-oauthlib"),
    ("google.auth.transport.requests", "google-auth"),
]
def _check_deps():
    missing = []
    for mod, pkg in REQUIRED_PKGS:
        try: __import__(mod)
        except ImportError: missing.append(pkg)
    if missing:
        sys.exit(
            "error: missing python packages.\n"
            f"  fix:  pip install {' '.join(missing)}"
        )
_check_deps()

from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

HERE = Path(__file__).resolve().parent
CLIENT_SECRET = HERE / "client_secret.json"
TOKEN_PATH    = HERE / "token.json"

# Scopes:
#   `youtube`           — upload videos, set metadata, manage account
#   `youtube.force-ssl` — required by captions.insert (the regular `youtube`
#                         scope is NOT enough for caption uploads, even though
#                         it covers most other things). Including it here lets
#                         a single OAuth flow handle videos + thumbnails + SRT.
SCOPES = [
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]

def get_creds() -> Credentials:
    """Return valid Google OAuth credentials. Performs interactive flow on
    first run; refreshes token transparently afterwards."""
    if not CLIENT_SECRET.exists():
        sys.exit(
            f"error: missing {CLIENT_SECRET.name}\n"
            "  see setup.md — Google Cloud Console → OAuth client ID → Download JSON"
        )
    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN_PATH.write_text(creds.to_json())
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET), SCOPES)
        creds = flow.run_local_server(port=0)
        TOKEN_PATH.write_text(creds.to_json())
        print(f"[oauth] token saved to {TOKEN_PATH.name}")
    return creds

def upload(video: Path, title: str, description: str, tags: list[str],
           privacy: str, category_id: str = "27") -> str:
    """Upload video, return its YouTube video ID. category 27 = Education."""
    creds = get_creds()
    yt = build("youtube", "v3", credentials=creds)
    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": category_id,  # 27 = Education
            "defaultLanguage": "en",
            "defaultAudioLanguage": "en",
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": False,  # not directed at children <13
            "embeddable": True,
        },
    }
    media = MediaFileUpload(str(video), chunksize=-1, resumable=True,
                            mimetype="video/mp4")
    print(f"[upload] {video.name}  ({video.stat().st_size / 1024 / 1024:.1f} MB)  privacy={privacy}")
    req = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    response = None
    last_pct = -10
    while response is None:
        status, response = req.next_chunk()
        if status:
            pct = int(status.progress() * 100)
            if pct >= last_pct + 10:
                print(f"  …{pct}%")
                last_pct = pct
    vid = response["id"]
    print(f"[done] https://youtu.be/{vid}")
    return vid

def upload_thumbnail(video_id: str, image: Path):
    creds = get_creds()
    yt = build("youtube", "v3", credentials=creds)
    yt.thumbnails().set(videoId=video_id, media_body=MediaFileUpload(str(image))).execute()
    print(f"[thumbnail] set from {image.name}")

def upload_captions(video_id: str, srt: Path, language: str = "en"):
    creds = get_creds()
    yt = build("youtube", "v3", credentials=creds)
    body = {"snippet": {"videoId": video_id, "language": language,
                         "name": "English", "isDraft": False}}
    yt.captions().insert(part="snippet", body=body,
                         media_body=MediaFileUpload(str(srt), mimetype="application/octet-stream")
                         ).execute()
    print(f"[captions] uploaded {srt.name}")


def upload_transcript(video_id: str, transcript: Path, language: str = "en"):
    """Upload a plain-text transcript (no timestamps). YouTube auto-aligns it
    to the audio using Google STT — same engine that powers auto-captions but
    with our known text, so it's 100% accurate text AND timing.

    This replaces the old SRT upload path. Cleaner because:
      - No local subtitle alignment (no whisper, no proportional drift)
      - No burned-in subs in the MP4 (viewers can toggle CC, auto-translate)
      - Captions available immediately after YouTube finishes processing
    """
    creds = get_creds()
    yt = build("youtube", "v3", credentials=creds)
    body = {"snippet": {"videoId": video_id, "language": language,
                         "name": "English", "isDraft": False}}
    yt.captions().insert(
        part="snippet", body=body,
        media_body=MediaFileUpload(str(transcript), mimetype="text/plain"),
    ).execute()
    print(f"[transcript] uploaded {transcript.name} for YouTube to align")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path, help="path to .mp4")
    ap.add_argument("--title", required=True)
    ap.add_argument("--description", help="short description; OR use --description-file")
    ap.add_argument("--description-file", type=Path,
                    help="path to a .txt file with the full description (recommended)")
    ap.add_argument("--tags", default="GIIS,Algebra,high school,math,Khan Academy,private school,Florida,online school",
                    help="comma-separated tags")
    ap.add_argument("--privacy", default="unlisted",
                    choices=["public", "unlisted", "private"],
                    help="default unlisted — share by link, doesn't show in search")
    ap.add_argument("--thumbnail", type=Path, help="optional PNG/JPG thumbnail")
    ap.add_argument("--captions", type=Path,
                    help="optional .srt file to attach (legacy — prefer --transcript)")
    ap.add_argument("--transcript", type=Path,
                    help="plain-text transcript for YouTube to auto-align to audio. "
                         "Preferred over --captions: no local subtitle alignment "
                         "needed, and Google STT does the timing perfectly.")
    args = ap.parse_args()

    if not args.video.exists():
        sys.exit(f"video not found: {args.video}")

    if args.description_file:
        description = args.description_file.read_text()
    elif args.description:
        description = args.description
    else:
        sys.exit("must provide --description or --description-file")
    tags = [t.strip() for t in args.tags.split(",") if t.strip()]

    try:
        vid = upload(args.video, args.title, description, tags, args.privacy)
    except HttpError as e:
        if b"quotaExceeded" in (e.content or b""):
            sys.exit("error: YouTube video upload quota exceeded.\n"
                     "  Wait for the next quota window OR request a quota increase in GCP console.")
        raise

    if args.thumbnail:
        try: upload_thumbnail(vid, args.thumbnail)
        except HttpError as e:
            print(f"  thumbnail skipped: {e}")
    # Transcript preferred — YouTube force-aligns plain text via Google STT.
    # Falls back to SRT captions if --captions was passed instead.
    if args.transcript:
        try: upload_transcript(vid, args.transcript)
        except HttpError as e:
            print(f"  transcript skipped: {e}")
    elif args.captions:
        try: upload_captions(vid, args.captions)
        except HttpError as e:
            print(f"  captions skipped: {e}")

    print(f"\nVIDEO_ID={vid}")
    print(f"URL=https://youtu.be/{vid}")
    print(f"STUDIO=https://studio.youtube.com/video/{vid}/edit")

if __name__ == "__main__":
    main()
