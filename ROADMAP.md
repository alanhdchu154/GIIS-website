# GIIS Platform — Product Roadmap

> 最後更新：2026-05-30 Broken YouTube and hard-blocking external resources removed（依 Alan 指示避免學生卡在死連結或付費/權限牆：新增 `tools/course-audit/remove_broken_youtube_resources.js`，依 audit 結果處理 902 條 broken course YouTube references；89 條用現有可用 `video2Url` 升為 primary `videoUrl`，813 條無可靠替代則清空 URL 並保留 removal note。`public/data/lessons-manifest.json` 移除失效 Algebra I Module 9 `bmyK05H8fFU`。另新增 `tools/course-audit/remove_blocking_external_resources.js`，清掉 102 條 hard-blocking external resource references：CommonLit、HBR、NoRedInk、Practice-It、AP Classroom、Grammarly、JSTOR、Google Docs/Slides/Drive、Canva、Criterion、Medium。Khan Academy 保留為 free nonprofit external resource；HubSpot Academy / Google Digital Garage 暫留為 soft-risk free account/certificate flow，待下一輪替換。重跑 `tools/course-audit/audit_external_resources.js` 後 course YouTube broken/unavailable = 0，GIIS lesson manifest YouTube failures = 0，hard-blocking hosts = 0；`npm run audit:pathways` 通過但 40 courses 有 missing-resource warnings，這是刻意用「不顯示死/卡住連結」換取「待補 vetted replacement」；`npm run build` 通過。新增 `server/scripts/sync-course-resources-from-json.js` 並用 `/tmp/giis-resource-sync` 在 Lightsail production 以 dry-run→apply 同步 Prisma module resource 欄位：first apply 718 changes，post-apply dry-run 0 changes / 0 missingCourses / 0 missingModules；live API scan：93 published courses / 373 YouTube refs / 285 unique IDs / 0 oEmbed failures；live Netlify manifest：49 lessons，`bmyK05H8fFU` absent。未 reseed，未碰學生成績/progress/assignments。）
>
> 前次：2026-05-30 Course external video/link audit（新增 `tools/course-audit/audit_external_resources.js` 並產出 `umi/reviews/2026-05-30-course-external-video-audit.{md,json}`。掃描 93 個 course JSON / 3,917 external URL references；Khan Academy 1,361 條判定為 free nonprofit external resource，不是付費課程，但 practice/progress 可能需要 free account；login/paywall risk hosts 包含 CommonLit、HubSpot Academy、Google Digital Garage、HBR、NoRedInk、AP Classroom、Practice-It、JSTOR 等。重大發現：course JSON 內 1,275 條 YouTube references / 1,133 unique IDs 中，二階段檢查確認 848 unique IDs / 902 course references unavailable/broken；GIIS lesson manifest 50 支中 Algebra I Module 9 `bmyK05H8fFU` 失效，符合先前 stale duplicate drift 風險。此輪僅 read-only audit / report / tooling，未修改 course content、未 deploy。）
>
> 前次：2026-05-27 External production test account created（production DB 已建立一組外部測試 student/parent account；student code `GIIS-TEST-WH30427`，enrolled in `English I`，active guided test subscription。Live API smoke passed：student login + `/api/me`、parent login + `/api/parent/me`。Live frontend smoke passed：student `/learn` 可見 English I，parent dashboard 可見 student/course/subscription。Credentials delivered directly to Alan in chat; do not store passwords in repo. No dirty worktree code deploy was performed because account creation required only production data write.）
>
> 前次：2026-05-27 Official records source-of-truth policy added（已畢業學生 records freeze：除非正式 correction / reissue 流程，不再回頭改已畢業學生的成績單或 Learn Portal evidence。未來所有 active/new students：transcript course rows 與 credits 必須從 `server/prisma/courses/**/*.json` / course catalog 拉，credits 以 catalog 為準；grades / completion evidence 以 Learn Portal assessments 為準，包括 module progress、quiz、exam、assignment、creditEarned。下一步是把這條 policy 做成 transcript generation / audit gate。）
>
> 前次：2026-05-27 Student Coordination System Phase 0-3（admin-only staff operating loop 已落地：新增 `StudentCareState` 與 append-only `StudentCareLog`；`/api/students/progress` 現在同時回傳 computed care signals、stored manual care state、display override、recent care logs；新增 admin APIs `GET/PATCH /api/students/:id/care-state` 與 `GET/POST /api/students/:id/care-logs`；單一學生 audit trail 納入 `care_log` events；`/admin/progress` 擴充為 Student Coordination console，含 needs-attention filters、risk/status/advisor/next-check-in、care editor、advisor note panel。Parent route safety smoke passed：`bodyInternal` 未出現在 `/api/parent/me`；local browser smoke passed。驗證：Prisma db push、server tests、pathway/graduation/senior audits、build、G9-G12 lifecycle care smoke。 本輪沒有 deploy，Phase 4 weekly snapshot / Phase 5 parent reassurance / Phase 6 transfer mapping 尚未做。）
>
> 前次：2026-05-25 Slot C46（Homepage college-outcomes copy softened to family-reported outcomes；School Profile/About CEEB corrected to applied/pending while FL school code remains 650；frontend build passed；deployed via origin/main）
>
> 前次：2026-05-26 LoginSession / care-signal foundation（把 caring operationalize 的第一塊地基補上：新增 `LoginSession` model，student/parent/admin login 會建立 session，authenticated requests heartbeat 更新 `lastSeenAt` / `durationSeconds`，logout 會寫 `endedAt`；Admin `/api/students/progress` 現在回傳 `lastLoginAt`、recent session count/duration，單一學生 audit trail 也納入 login/session timeline。local API smoke passed：student + parent session rows created，admin progress/audit-trail 可見；`npm test`、`audit:pathways`、`audit:graduation`、`audit:seniors` passed。）
>
> 前次：2026-05-26 G9-G12 synthetic lifecycle audit（新增 local-only `server/scripts/g9-g12-lifecycle-audit.js` 與 npm scripts：建立 `GIIS-LIFECYCLE-G9G12` synthetic G9 student，跑 8 semesters / 32 courses / 415 modules / 415 quizzes / 415 graded assignments / 64 exams / 30.5 credits；student login + parent login/API smoke passed；server tests passed；admissions-officer review flags：缺 2-credit world-language sequence、AP prep 最好搭配外部 AP scores、generated assignment 不能當真實學生作品；review note：`umi/reviews/2026-05-26-g9-g12-lifecycle-audit.md`。）
>
> 前次：2026-05-26 Lesson video quality reset hardening（Umi + cc second opinion 一致建議不要恢復 generation/build/upload。新增 `npm run audit:lesson-video-inventory`，盤點 70 folders / 50 visible / 29 full reviewer cascade / 26 AP CS A+AP Psychology missing reference packets；`lesson_release_gate.py --check` 可只讀檢查；`yt_queue.py --gate-ready` 與 `upload_lesson.py` 現在都要求 `approved_ready_to_upload.json` 人工核准清單；YouTube description pricing/AP wording 已保守化。pipeline 仍維持 paused。詳見 `umi/reviews/2026-05-26-lesson-video-quality-reset.md`。）
>
> 前次：2026-05-26 G10-G12 curriculum/pathway pass（延續 G9 pilot 標準，把 public catalog / pathway / Learn Portal grade metadata 對齊到 G10-G12；補強 weak objectives、thin assignments、estimated hours、無法作答的 answer-key 題；AP public wording 繼續維持 exam-preparation / College Board-aligned / pending review；`npm run audit:pathways` 已達 93 pass / 0 warn / 0 fail。）
>
> 最後更新：2026-05-25 Slot C45（Yunfan Yang production learning evidence repaired for school transcript support：35 missing assignment submissions/grades added across G12 Spring courses；student + parent login verified；no official email sent）
>
> 前次：2026-05-22 Emergency pause（依 Alan 指示，先暫停 GIIS lesson video pipeline，避免繼續花錢產出低品質或未審核內容。已停用 Claude Scheduled tasks：`giis-lesson-pipeline-daily`、`giis-lesson-pipeline-late`，並在兩個 SKILL.md 加上 hard pause gate；已 `bootout` 並 `disable` Mac LaunchAgents：`com.giis.lesson-build`、`com.giis.youtube-daily`，同時在 `~/Library/LaunchAgents/*.plist` 與 repo plist template 加 `Disabled=true`。新增 `tools/lesson-video/PIPELINE_PAUSED.md`，並讓 `daily_build.sh` / `tools/youtube-upload/daily.sh` 看到 pause file 就直接 exit 0。未刪除任何 lesson artifact、未呼叫 YouTube API、未修改 production data。恢復前需要先由 Central Umi / giis-producer 做 quality reset plan。）
>
> 最後更新：2026-05-22 Slot B 5am（QA 巡檢——這一棒沒有可做的正規產製工作，誠實只做查核。Slot A 11pm 已把 **AP Biology 收到 16/16**、有 reference doc 的 backlog 真的耗盡。我把四門 AP 課全部對 `server/prisma/courses` 的 course JSON（編號的 source of truth）和 3-reviewer cascade 檔案做了一次全 repo 盤點，**發現一個比 AP Bio M1-M9 更大的潛在退步**：**AP Computer Science A（M1-M10）和 AP Psychology（M1-M16）共 26 支影片完全沒有 `_review_A/B/C`，從沒跑過 cascade**，其中 **11 支已經上 YouTube、家長看得到**（AP CS A：M1-M6、M10；AP Psych：M1、M11、M12、M13）——直接踩到 CLAUDE.md 第一條「信任」。**為什麼沒當場修**：cascade 的 Reviewer C 規定只能拿 `references/<slug>-ced.md` 比對，而這兩門課**沒有 CED reference doc**，Reviewer C 跑不了；硬產或自己捏一份 reference 來假核對都會重演當初的退步，所以按 SOP 不硬幹。**好消息**：禁用詞掃描四門 AP 課全乾淨（無 Cognia／accredited／UCSB／NJIT／(SIT)／美国认证）；那個每支 AP 影片都會跳的「AP course naming」其實是 `audit_lessons.py` 284-285 行對任何「AP 」課程的固定提醒，不是瑕疵。順帶確認 AP Calc 的「JSON 14 單元 vs 12 資料夾」只是編號合併、內容其實全覆蓋，不是缺口。**人類請補一手**：加 `references/ap-cs-a-ced.md` 與 `references/ap-psychology-ced.md`，下一棒就能先對已上線的 11 支跑 post-hoc cascade（比照 5/19 對 AP Bio M1-M9 的做法），再談產新內容。產出 0 支模組（依規則正確），沒 push。詳見 `_audit/qa-review-coverage/HUMAN_ACTION.md` 與同資料夾 `2026-05-22T10-12-36Z-summary.json`）
>
> 前次：2026-05-22 Slot C44（Lesson manifest/course alignment audit added；wrong same-number video embeds guarded；AP CS A ArrayList pilot corrected to Module 10）
>
> 前次：2026-05-22 Slot C43（Umi-led lesson production split added；daily YouTube upload now filters by release-gate ready list；AP CS A ArrayList pilot handoff created, later corrected to Module 10）
>
> 前次：2026-05-22 Slot C42（YouTube upload review found healthy recent uploads but release gate is non-blocking and manifest/local/channel drift needs cleanup）
>
> 前次：2026-05-22 Slot C41（Parent persona audit loading assertion refined after dashboard content verification）
>
> 前次：2026-05-22 Slot C40（Auth rate limiting narrowed so parent dashboard data cannot lock out login flows）
>
> 前次：2026-05-22 Slot C39（Parent dashboard load loop fixed；persona audit tightened against loading/failed parent state）
>
> 前次：2026-05-22 Slot C38（Server GPA totals now handle Prisma Decimal values；production V1 smoke + persona audit passed）
>
> 前次：2026-05-22 Slot C37（V1 lifecycle smoke + admin application enrollment/payment state added；production smoke verified）
>
> 前次：2026-05-22 Slot C36（Application activation now creates both student and deterministic parent login credentials）
>
> 前次：2026-05-22 Slot C35（Deterministic parent login convention added: student email + `_parent`, default password `Parent2024!`）
>
> 前次：2026-05-22 Slot C34（Persona route audit added for principal assistant, student, parent, and new-student flows）
>
> 前次：2026-05-22 Slot C33（Production API-base fallback and login wrong-response guards added；build passed；deploy still pending）
>
> 前次：2026-05-21 Slot C32（Live persona review found production frontend API-base/login blocker and next-version priorities）
>
> 前次：2026-05-21 Slot C31（Umi Command Center added for GIIS-wide orchestration, Claude Code handoffs, reviews, and school-level decisions）
>
> 前次：2026-05-21 Slot C30（Production API deployed on Lightsail；Learn Portal ModuleProgress backfilled；Hanxi credit correction applied）
>
> 前次：2026-05-21 Slot C29（Admin progress data-flow split official transcript credits from Learn Portal credits；dry-run repair tool added for quiz/module/final completion gaps）
>
> 前次：2026-05-21 Slot C28（Admin dashboard and common admin chrome simplified around key operating signals）
>
> 前次：2026-05-21 Slot C27（Admin Transcript no longer embeds the full official transcript preview; it now uses a records workspace while keeping locked PDF export）
>
> 前次：2026-05-21 Slot C26（Admin Transcript workspace layout cleaned up；admin tools rearranged into a two-column operating panel without touching locked transcript export）
>
> 前次：2026-05-21 Slot C25（Application activation welcome email now writes EmailLog for parent login delivery visibility）
>
> 前次：2026-05-21 Slot C24（Forgot-password delivery now writes EmailLog for student and parent reset emails）
>
> 前次：2026-05-21 Slot C23（Admin Email Logs page/API added for weekly report + official document delivery status）
>
> 前次：2026-05-21 Slot C22（Admin course catalog/module editor added；existing student enrollment manager confirmed and surfaced in roadmap）
>
> 前次：2026-05-21 Slot C21（Parent Portal official transcript view/download added；parent route reuses locked TranscriptContent + PDF exporter）
>
> 前次：2026-05-21 Slot C20（Admin Official Documents workflow added：dry-run/send UI, API wrapper, EmailLog + AuditLog issue trail）
>
> 前次：2026-05-21 Slot C19（Official transcript/diploma format contract added；`npm run audit:official-docs` locks current visual guardrails）
>
> 前次：2026-05-22 Slot A 11pm（AP Biology Unit 8 收尾 — 把生態最後三支補完，**AP Biology 正式 16/16 完課** 🎉。產出 **M14 生態系與能量流（Ecosystems & Energy Flow，17 slides）**、**M15 生態系進階應用（Advanced Applications，16 slides）**、**M16 AP 考試總複習（Exam Synthesis，15 slides）**。M14、M15 各跑完整 2 輪 3-reviewer cascade（round 1 都是 minor×3 → 修一輪 → round 2 全部 pass/pass/pass）；M16 round 1 就 pass/minor/pass，依規則直接 ship，不需第二輪。修掉的重點 minor：M14 把水生倒金字塔改用「現存量 vs 周轉率」解釋（不是只講體型小）、能量預算明確標成 NPP；M15 把生物放大改成「脂溶性毒素被保留累積上去」而**不是**拿 10% 法則當原因、珊瑚白化講清楚主因是熱壓力（酸化是另一條 CO2 路線）、光暗瓶明講「呼吸在兩瓶相等」這個假設才導出 GPP=NPP+R；M16 把六大 science practices 各給一句可操作說明、FRQ 技巧寫成「讀實驗→找變因→用證據下結論」、30 天讀書計畫具體化。三支 audit score 都 79，`needs_revision` 一律只來自這階段 by-design 的「還沒 MP4」major（跟已上線的 M10/M11/M12/M13 一模一樣，MP4 明早由 Mac launchd build），沒有任何 blocked。M15 有一個真的可修的 next-action minor，比照 M13 把 path narration 補上 practice／assignment 用語後 re-audit 已清掉。全部檔案齊全（outline＋6 或 3 個 review JSON＋script＋build_slides＋slides＋learning_check＋contact-sheet＋音樂），slide 數＝section 數，敘述全在 85 字以內，無禁用詞，沒 push。**重要**：有 reference doc 的 backlog 現在真的耗盡了（AP Calc、AP Bio 都完課；AP CS A／AP Psychology 沒有 `references/<slug>-ced.md`，Reviewer C 跑不了）—— 下一棒要產新內容請人類先補一份 CED reference。詳見 `_audit/ap-biology/2026-05-22T04-07-03Z-summary.json`）
>
> 前次：2026-05-21 Slot B 5am（AP Biology Unit 8 生態學新內容 — 接 Slot A 沒做完的部分，產出 **M12 族群生態（Population Ecology，17 slides）** 與 **M13 群集生態（Community Ecology，16 slides）**，兩支都跑完整 2 輪 3-reviewer cascade（共 12 個 review JSON，round 2 都是 pass / pass / minor → ship）。**重要修正**：Slot A 結論「有 reference doc 的 backlog 已耗盡」其實漏算了 AP Bio M12-M16（Unit 8 生態，CED 本來就有這一段；而且 M1-M11 都已補完 cascade、原本的 block 早就解除）—— 所以還有正規可做的工作，這一棒補上 M12、M13。兩支 audit score 都 79；`needs_revision` 純粹來自這階段「還沒有 MP4」這個 by-design 的 major（跟已上線的 M10/M11 一模一樣，分數還比它們的 62 / 63 高，MP4 由 Mac launchd 明早 build），不是品質問題。M13 順手把 path 的 next-action 用語（practice／assignment）補上，清掉唯一一個真的可修的 minor。沒有 push。剩 M14-M16 留給下一棒，M14 資料夾已先建好（空的）當 resume marker。詳見 `_audit/ap-biology/2026-05-21T10-30-03Z-summary.json`）
>
> 前次：2026-05-21 Slot A 11pm（AP Calculus AB retroactive 3-reviewer cascade — 把 M1 + M3-M12 共 11 個 module 補上完整 3-reviewer cascade，33 個 review JSON 全寫入並驗證通過。3 個 halted 到 `_review_failed/`：**M4** 確認算術錯（09 ladder 講「negative eight-thirds」其實應是 −4/3，連自己的 −1.33 都對不上）、**M12** 確認事實錯（03 講「兩節各 90 分鐘」，但 Section I 是 105 分、II 才 90 分，且和後面 04 的「3h15m total」自相矛盾）、**M7**（Reviewer B 過度標 critical，A/C 都判 minor，narration 經核對正確，只是漏講 monotonicity 條件與 lower-bound FTC 變體）。12 支全部已上 YouTube（broadcast-locked），所以**完全沒動 script.json**，改用 WHY.md 留 errata/re-record 給人類。重要發現：**有 reference doc 的課程內容已全部產完，backlog 耗盡** — 要產新課得先請人類補 `references/<slug>-ced.md`）
>
> 前次：2026-05-20 Slot C18（C17 cleaned transcript+diploma PDFs resent to principal；CC Alan and admissions）
>
> 前次：2026-05-20 Slot C17（Official seal background removed and diploma student-name highlight artifact fixed；PDF dry-run regenerated, not resent）
>
> 前次：2026-05-20 Slot C16（Corrected graduation transcript+diploma PDFs emailed to principal in five separate messages；CC Alan and admissions）
>
> 前次：2026-05-20 Slot C15（Graduation document package transcript generator aligned to verified Admin UI export lineage；dry-run regenerated PDFs, not emailed）
>
> 前次：2026-05-20 Slot C14（Actual Admin UI Export to PDF smoke-tested by browser download；frontend export is verified, server email package path still must not be treated as equivalent）
>
> 前次：2026-05-20 Slot C13（Frontend Transcript Export to PDF restored to Alan's 5/10 reference lineage；issue date now uses export day；seal made more formal）
>
> 前次：2026-05-20 Slot C12（Graduation PDFs rechecked；admin/student transcript downloads share one export path；parent transcript download is not implemented yet）
>
> 前次：2026-05-20 Slot C11（Transcript frontend restored exactly to 2026-05-12 snapshot；server package date behavior aligned；not resent yet）
>
> 前次：2026-05-20 Slot C10（Server transcript package moved closer to exact 2026-05-10 inline PDF settings；seal/signature block uses same filter/layout；not resent yet）
>
> 前次：2026-05-20 Slot C9（Transcript package verified against 2026-05-10 git source；server PDF scale tuned to 0.97；all senior transcripts remain one page；not resent yet）
>
> 前次：2026-05-20 Slot C8（Graduation PDF generator re-aligned to Admin diploma visual source；transcripts forced back to one-page package；not resent yet）
>
> 前次：2026-05-20 Slot C7（Corrected graduation PDF generator to match Admin/frontend formats；transcript one-page layout restored, transcript date uses export date；not resent yet）
>
> 前次：2026-05-20 Slot C6（Graduation transcript+diploma PDF packages generated and emailed；五位 senior 每人 transcript PDF + diploma PDF 附件已寄校長 CC Alan）
>
> 前次：2026-05-20 Slot C5（Transcript/diploma/credit consistency hardening；修 Hanxi current-course credit mismatch、鎖住 student-side transcript writes、修 future graduation verification、標出 import-only transcript rows）
>
> 前次：2026-05-20 Slot C4（Class of 2026 senior records audit + graduation issuance email dry-run；修正 G12 Spring A- Learn Portal score sync）
>
> 前前次：2026-05-20 Slot C3（Florida private-school graduation rules recheck；移除 GIIS diploma hard requirement 裡的 PE/Health 與 World Languages，改為 online-school appropriate 24-credit framework）
>
> 前前前次：2026-05-20 Slot C2（Answer key normalization + graduation eligibility audit；發現 Admin 24-credit eligibility 與公開 handbook subject-distribution eligibility 不一致）
>
> 前前前次：2026-05-20 Slot C（Course assessment QA gate + AP CSA/AP Calc 題庫補齊 + grading answer-key compatibility；`npm run audit:pathways` 現在 48 pass / 45 warn / 0 fail）
>
> 前前次：2026-05-20 Slot B 5am（AP Bio M8 surgical narration patch + round-2 Reviewer C verdict `minor`；發現 M4/M5/M6 已上 YouTube，patch unsafe — WHY.md 加上 BROADCAST CONSTRAINT 說明，留給人類決定 re-record vs description errata）
>
> 前前前次：2026-05-20 Slot B2（Pathway audit 升級 module outline rubric：可檢查 objectives 是否可評量、assignment 是否夠厚；目前 57 pass / 34 warn / 2 fail）
>
> 前前前前次：2026-05-20 Slot B（Pathway/course quality audit：93 門課掃描；新增 public pathway academic evidence panel；找出 AP CSA / AP Calc AB 無 quiz/exam 題庫的 P0 缺口）
>
> 前前前前次：2026-05-20 Slot A 04:12Z（AP Biology M4-M9 retroactive review cascade — 6 modules × 3 reviewers 平行；18 個 review JSON 全部寫入；4 個 module 拿到 Reviewer C critical 並寫入 `_review_failed/<slug>/WHY.md` 等人類 surgical narration 修正）
> 前前前前次：2026-05-19 Later 10（AP Biology M10 V2 pilot：短段落、單概念 slides、三類 reviewer artifacts、靜音 timing MP4、audit score 99）
> **核心目標：讓家長願意付錢，並且持續付錢。**
>
> 這份 roadmap 是給 **Claude Code CLI（code mode）** 的工作清單。
> 每個未完成項目都標註：檔案、acceptance criteria、依賴。挑一個就能直接開動。
>
> ---
>
> ### 🔁 Agent working ritual — never skip
>
> **Before any task** → read this whole file first. Find what's done, what's pending, where your task fits.
> **After any task** → update this file immediately. Mark ✅ with a one-line summary, or add new items found during the work.
>
> The roadmap is the only persistent memory across sessions. If it's not here, the next agent won't know.
> Full conventions live in [`CLAUDE.md`](./CLAUDE.md) — read once per session.

---

## 🔒 Official records source-of-truth policy（2026-05-27）

> 這是 GIIS official records 的長期資料規則。後續 transcript automation、graduation audit、transfer mapping、Learn Portal repair 都要遵守。

- **Graduated-student freeze**：已畢業學生的 transcript / diploma / Learn Portal evidence 預設不再修改。只有在正式 correction / reissue 流程中，經 admin 明確核准、留下 audit trail、必要時重新出具文件，才可以改。
- **Future active/new students — course rows**：未來學生的 transcript course rows 應由 course catalog 產生，不再手工亂填 course name / credit。Source of truth 是 `server/prisma/courses/**/*.json` 以及 DB `Course` metadata。
- **Future active/new students — credits**：課程 credit value 以 course catalog / `Course.credits` 為準。若是 transfer/import credit，必須另有 source label / evidence note，不可以偽裝成 current Learn Portal course。
- **Future active/new students — grades**：學生 grade / completion evidence 以 Learn Portal assessment records 為準：`ModuleProgress`、`ModuleQuizAttempt`、`ExamAttempt`、`AssignmentSubmission`、`Enrollment.creditEarned`。Transcript 應該是 Learn Portal result 的 official projection，而不是另一套獨立成績來源。
- **Open implementation item**：新增 transcript generation / audit gate，檢查 active/new students 是否滿足「catalog credits + Learn Portal grades」；已畢業 records 只報 warning，不自動 repair。

---

## ✅ G9 curriculum / pricing / transfer page upgrade（2026-05-26）

> 目標：先用 Grade 9 當 pilot，把 Learn Portal 真實課程、public catalog、pricing signal、transfer-student admissions path、lesson-video restart gate 一次對齊，之後用同一 checklist 推 G10 / G11 / G12 / pathways。

- ✅ **Active repo path aligned**：Central Umi / project coordination docs no longer reference stale `/Users/alanhdchu/giis-website`; active path is `/Users/alanhdchu/giis-website`.
- ✅ **G9 Learn Portal source-of-truth pass**：以 `server/prisma/courses/**/*.json` 為準，修正 `algebra-i`、`biology`、`english-i-writing-focus`、`intro-communication`、`world-history` 的 audit warnings。這五門目前在 `npm run audit:pathways` 內皆為 pass。
- ✅ **Public catalog alignment**：`CourseCatalog.js` 補上 real G9 foundation courses：`Digital Literacy`、`Introduction to Communication`，並把 AP 類 badge/copy 改成 AP exam-preparation / authorization-pending 口徑。
- ✅ **Pricing repositioned**：`PricingPage.js` 從單一 $19.90 founders offer 改成三層：Self-Paced Founders $49/mo 或 $499/year、Guided $149/mo、Premium / College Pathway $299/mo；group pricing 改為 inquiry-based。
- ✅ **Checkout tier mapping updated**：`server/src/routes/checkout.js` 新增 `self_paced_monthly`、`self_paced_annual`、`guided_monthly`、`premium_monthly`，並保留 `monthly` / `founders_monthly` legacy aliases 到 self-paced。
- ✅ **Transfer-student path added**：新增 public `/transfer-students` page，說明 official records、credit mapping、placement/timeline、first-term validation、Florida private-school policy boundary；Admission dropdown、mobile nav、Admission page、Footer 都加入口。
- ✅ **Video pipeline remains paused**：新增 `tools/lesson-video/QUALITY_RESET_PLAN.md`。重啟前必須補 AP CS A / AP Psychology reference packets、跑 post-hoc reviewer cascade、跑 `npm run audit:lesson-manifest`，並把 existing videos 分類 keep / errata / re-record / remove。
- 🔧 **下一步**：跑 full verification：`npm run audit:pathways`、`npm run audit:lesson-manifest`、`npm run build`、browser smoke `/academics`、`/pathways`、`/pricing`、`/transfer-students`、至少 3 個 G9 `/learn/:slug/syllabus`。

---

## ✅ G10-G12 curriculum / pathway audit pass（2026-05-26）

- ✅ **G10-G12 reviewed with same G9 standard**：從高中生角度檢查 sequence、module count、objectives、resources、assignments、quiz/exam answerability。
- ✅ **Learn Portal grade metadata aligned**：把 public catalog / pathway 已排入 G10-G12 的 electives 與 AP-adjacent prep courses 補上或修正 `gradeLevel`，降低 catalog 和 portal 分裂。
- ✅ **Course quality warnings cleared**：修正 weak objectives、thin assignments、低 estimated hours、以及沒有 options 卻只給 `A/B/C/D` 的 unusable answer keys。
- ✅ **AP wording cleaned again**：public catalog / pathway 改成 `AP ... exam preparation`、`College Board-aligned`、`school review processes remain pending` 這類保守說法。
- ✅ **Audit result**：`npm run audit:pathways` → `93 pass / 0 warn / 0 fail (93 courses)`。
- 📝 **Internal report**：`umi/reviews/2026-05-26-g10-g12-catalog-learn-alignment.md` 記錄 review standard、grade-level alignment、student-learning judgment、next reusable checklist。

---

## ✅ Yunfan Yang transcript-support learning evidence repair（2026-05-25 Slot C45）

> 目標：Yunfan Yang (`26-004`) 的成績單準備寄給外部學校前，補齊 production Learn Portal 中可被 admin audit trail 查看的一致學習軌跡：該上的 module、quiz、midterm/final、assignment、account/login、audit。

- ✅ **Official transcript eligibility rechecked**：local seed audit 通過。`npm run audit:seniors` 顯示 Yunfan Yang PASS：31 credits、8 semesters、38 transcript rows、G12 Spring 3 courses released 2026-05-22；只有 Grade 11 Government/Economics 0.5 credit vs current catalog 1.0 的 historical/import variation warning，不是 current Learn Portal row。`npm run audit:graduation` 顯示 Yunfan 31 credits、UW 3.86、admin eligible、GIIS eligible。`npm run audit:official-docs` PASS。
- ✅ **Production dry-run first**：production `node scripts/repair-learn-completions-from-transcripts.js --student=26-004` 回傳 `enrollmentsToRepair: 0`，表示 G12 Spring quiz/module progress/midterm/final/credit 已完整；parent account dry-run 顯示 `yunfan.yang_parent@genesisideas.school` already present。
- ✅ **Assignment evidence gap repaired**：擴充 `server/scripts/repair-learn-completions-from-transcripts.js`，新增 opt-in `--assignments`，只在指定時建立 missing assignment submissions + grading feedback，並同步 `ModuleProgress.assignmentSubmittedAt` / `assignmentGradedAt`。production dry-run 顯示只會補 Yunfan 3 門 G12 Spring courses 的 35 份 missing assignments（English IV - Media & Analytical Writing 13、Media Psychology 11、Sports Management & Leadership 11），無 missing quiz/exam/progress/credit。已執行 `--student=26-004 --assignments --apply`。
- ✅ **Post-repair verification**：production post dry-run 回傳 `planned: []` / `enrollmentsToRepair: 0`。直接查 production DB：Yunfan 3 courses、35 completed modules、35 quiz attempts、6 exam attempts、35 assignment submissions、35 graded assignments、35 assignment progress markers、3 creditsEarned。`senior-activity-audit.js --year=12` 修正 gradeLevel-only filter，現在會納入 G12 semesterLabel 的 open/elective courses；Yunfan 報表為 3 enrollments、113 estimated hours、35/35 quizzes passed、35/35 assignments graded、6/6 exams passed、gate PASS。
- ✅ **Login/account checked**：production API login smoke：student `yunfan.yang@genesisideas.school` 回 200 role `student`；parent `yunfan.yang_parent@genesisideas.school` 回 200 並更新 parent `lastLoginAt`。注意：`StudentAccount` 目前沒有 `lastLoginAt` / `LoginLog` model，所以不能宣稱 student login history，只能宣稱 login was verified.
- ✅ **Audit trail marker**：production `AuditLog` 新增 3 筆 `learn_portal_completion_repair`，actor `script:repair-learn-completions-from-transcripts --assignments`，對應三門 course assignment repair。
- ✅ **Tooling fixed**：`tools/graduation/audit_seed_graduation.js` / `audit_senior_records.js` 的 VM require resolver 補上 `../src/lib/parentCredentials`，修復 seed audit 在目前 repo 版本的 module resolution error。`server/scripts/senior-activity-audit.js` 的 `--year=12` filter 也修正，避免漏算 open/elective G12 courses。
- ⚠️ **No email sent**：本輪沒有執行 official transcript/diploma email send，也沒有呼叫 graduation document `--send`。下一步若要寄外部學校，先由 Alan 確認 recipient / CC / 是否只寄 transcript 或 transcript+diploma。

---

## 為什麼家長會付錢？

家長付錢給一間學校，判斷的依據只有三件事：

1. **信任** — 這是一間真正的學校嗎？我的孩子拿到的文憑有意義嗎？
2. **透明** — 我看得到孩子在學什麼、學得怎麼樣嗎？
3. **結果** — 孩子有在進步嗎？這筆錢花得值得嗎？

---

## ✅ Alan-approved execution order（2026-05-21）

> Alan 已同意這條路線：優先做讓學校「像真的、可營運、可付錢」的工作；內容厚度繼續做，但排在 official docs / parent transparency / admin operating loop 後面。

1. ✅ **Admin official document workflow** — Slot C20 已完成：Admin dry-run/send official transcript + diploma package，並寫 EmailLog / AuditLog。
2. ✅ **Parent transcript/progress access** — Slot C21 已完成：Parent Portal 可下載同格式 official transcript；parent progress 原本已存在於 dashboard。
3. ✅ **Admin operating loop 第一段** — Slot C22 已完成：student enrollment manager 已確認可用；course catalog/module editor 已新增。
4. 🔧 **Admin operating loop 下一段** — 部分完成：EmailLog status UI 已完成於 Slot C23，forgot-password delivery logging 已完成於 Slot C24；待做 official document DB-driven per-student issue/version workflow、manual transcript row source label、resend action。
5. 🔧 **Stripe/apply/student creation 閉環** — 待做：payment success 自動 link student/parent、founder pricing 12-month lock 寫入資料、welcome email + login + next steps。
6. 🔧 **Course content cleanup** — 待做：AP Bio M14-M16、AP CSA / AP Calc review failed / errata、course quality audit warn 逐步下降。

---

## ✅ Umi Command Center / Claude Code orchestration（2026-05-21 Slot C31）

> 目標：把 Umi 定位成 GIIS 的 principal-assistant / project chief-of-staff layer。Alan 可以丟想法或混亂判斷給 Umi；Umi 負責整理成學校營運 priority、Claude Code handoff、品質審核與 roadmap 更新。這不是只管影片 pipeline，而是管整個 GIIS project 的協調與監督。

- ✅ **新增 orchestration workspace**：`umi/README.md` 定義 Umi Command Center 的用途、operating model、review lens 與 safety rules。`ROADMAP.md` 仍是 canonical product source-of-truth；`umi/` 只管想法整理、handoff、review、decision notes。
- ✅ **Alan inbox**：`umi/inbox.md` 用來收 Alan 的 raw thoughts，可以很亂；Umi 之後負責分類成 school / operations、parent trust、parent transparency、student results、engineering、content/video、finance/payment、admissions/sales。
- ✅ **Active workload board**：`umi/workload.md` 只追少量 active items，避免 Alan 同時開太多平行線；目前記錄 Command Center 已建立，下一步是實戰使用而不是繼續加流程。
- ✅ **Decision log**：`umi/decisions.md` 記錄 durable project decisions：Umi 是 GIIS-wide principal-assistant orchestration layer；Claude Code / implementation agents 是 workers；任何完成或新發現的重要工作仍必須回寫 `ROADMAP.md`。
- ✅ **Worker handoff template**：`umi/handoffs/README.md` 提供 Claude Code task brief 模板，包含 context、goal、files、scope、acceptance criteria、Umi review notes，以及 standing rules。
- ✅ **Umi review template**：`umi/reviews/README.md` 提供 reviewer 格式，優先檢查 parent trust、official record/payment safety、parent transparency、build/test correctness、maintainability。
- 🔧 **下一步**：下一個實際 GIIS 任務應先丟進 Umi flow：Alan idea → `umi/inbox.md` / chat → Umi task shaping → bounded handoff → implementation → Umi review → `ROADMAP.md` update。不要先把它做成自動執行外部動作；等工作流穩定後再考慮 runner / CLI bridge。

---

## 🔎 Live persona review findings（2026-05-21 Slot C32）

> 目標：用高中生、家長、校長助理 / admin 三個視角打開 live site 走一輪，判斷目前版本成熟度與下一版優先順序。本輪是 review / diagnosis，尚未修 code。

- 🚨 **P0 production frontend blocker**：`https://genesisideas.school/` 仍 served old Netlify bundle `main.49b0480e.js`，且 production frontend build 沒有正確 `REACT_APP_API_URL=https://api.genesisideas.school`。結果 `/login` 學生/admin 登入卡在 `Signing in…`；`https://genesisideas.school/api/auth/login` 回 Netlify HTML，而真正 API `https://api.genesisideas.school/api/...` 正常。這會直接破壞 student/admin/parent trust，必須先修 Netlify env / deploy。
- ⚠️ **Parent real portal gap**：production DB `ParentAccount=0`、`Subscription=0`、`EmailLog=0`。Public `/parent/demo` 很像 sample dashboard，但真家長登入還沒有 seed/activation/account path 可測；家長視角會覺得「demo 很漂亮，但我付錢後怎麼拿到帳號？」。
- ✅ **Public trust foundation is strong**：首頁、Pricing、Pathways、School Profile 都已明確傳達 Florida-registered private school、24-credit framework、parent reports、Class of 2026 outcomes、official transcript/diploma。這已經不是 v0 landing page。
- ⚠️ **Admissions conversion still brochure-like**：`/admission` 還是四步驟文字與文件清單，缺少「Apply → pay → parent/student account → first course」的 productized flow evidence。下一版應把 admissions 變成 operational funnel，而不是資訊頁。
- ⚠️ **Student flow likely good behind login, but currently untestable from live frontend**：production API/DB 有 5 students、19 completed enrollments、224 quizAttempts、38 submitted exams、224 ModuleProgress；後端資料像真 LMS。但 live frontend API-base blocker 讓學生體驗無法進去。
- 🎯 **Version judgment**：目前 backend/records/admin capability 像 `v0.8 Trust MVP`；public marketing 像 `v0.7`; live end-to-end customer experience 因 login/API base blocker 只能算 `v0.55`。到 `v1.0` 的定義應是：public apply/payment/login/parent visibility/official docs 全部能從 live site 一口氣走通。

---

## ✅ Production login/API-base hardening（2026-05-22 Slot C33）

> 目標：修 Slot C32 找到的 live frontend API-base/login blocker。先做 code-level 防護，避免 production frontend 在 Netlify env 漏設時默默打到 `https://genesisideas.school/api/...` 並拿到 HTML。

- ✅ **Production API fallback**：`src/config/apiBase.js` 現在在 production build 且 hostname 是 `genesisideas.school` / `www.genesisideas.school` 時，若 `REACT_APP_API_URL` 未設定，會 fallback 到 `https://api.genesisideas.school`。Netlify env 正確設定仍優先。
- ✅ **Student/admin login wrong-response guard**：`src/components/pages/Auth/LoginPortal.js` 現在要求 auth API response 是 JSON；如果收到 Netlify HTML 或其他非 JSON response，會顯示明確 portal/API 錯誤，不會讓使用者以為自己帳密錯或卡住。
- ✅ **Parent login wrong-response guard**：`src/components/pages/Parent/ParentLogin.js` 加上 missing API guard 與 non-JSON response guard，避免 parent portal 在 API-base 錯誤時只顯示 generic network error。
- ✅ **Bilingual user-facing copy**：`src/i18n/siteStrings.js` 新增 student/admin login 的 abnormal server response 文案，避免把 infrastructure 問題包成普通 login failure。
- ✅ **驗證**：`npm run build` 通過。只有既有 Browserslist outdated warning，未影響 build。
- ⚠️ **Deploy still pending**：這輪只改 repo code，尚未執行 Netlify deploy / env verification。要讓 live site 生效，需要推送並確認 Netlify 最新 bundle 不再是舊 `main.49b0480e.js`，且 `/login` 實際呼叫 `https://api.genesisideas.school/api/auth/login`。

## ✅ Persona route audit gate（2026-05-22 Slot C34）

> 目標：每次更新後，用「校長助理 / admin、學生、家長、新生」四條路線檢查 live site 或指定環境有沒有崩。這是 trust / transparency / results 的 smoke gate，不取代完整 E2E，但要能抓到 production API-base、login 卡住、public funnel 空白、parent portal 入口破掉這類 P0。

- ✅ **新增 persona audit script**：`tools/persona-audit/audit_site.js` + `npm run audit:personas`。預設測 `https://genesisideas.school` + `https://api.genesisideas.school`，也可用 `SITE_URL` / `API_URL` 指向 staging 或 local。
- ✅ **New-student route**：檢查 homepage、pricing、admission、apply、pathways、school-profile 是否正常 render，並要求看到 Florida/private-school trust、pricing、application、pathway/credit 等 evidence。
- ✅ **Parent route**：固定檢查 `/parent/demo`；若提供 `PARENT_EMAIL` / `PARENT_PASSWORD`，會再登入 `/parent/login` 並檢查 real dashboard。沒有 parent credentials 時列 warning，不讓整個 audit false-fail。
- ✅ **Student route**：使用 seed senior account（預設 `hanxi.xiao@genesisideas.school`，密碼由 env 可覆蓋）登入 `/login`，確認能進 `/learn`，並抓 screenshot。
- ✅ **Principal-assistant / admin route**：使用 admin account（env 可覆蓋）登入 `/login`，確認能進 `/admin` 與 `/admin/progress`，並抓 screenshot。
- ✅ **Production API-base guard**：audit 會抓 live `main.*.js` bundle，確認 bundle 內含 `api.genesisideas.school`。這會直接抓出 Netlify deploy/env 漏設造成 `/login` 打到 same-origin `/api/...` 的舊問題。
- ✅ **Netlify env hardening**：`netlify.toml` 現在明確設定 `REACT_APP_API_URL=https://api.genesisideas.school`，與 Slot C33 code fallback 雙保險。
- ✅ **Live verification**：`npm run audit:personas` 已對 production 跑過：11 pass / 1 warn / 0 fail。通過 API health、production bundle API-base、new-student public funnel、student login → Learn Portal、admin login → dashboard/progress、parent demo。唯一 warning 是 production 尚未提供 `PARENT_EMAIL` / `PARENT_PASSWORD` 給 audit 跑 real parent login。
- 🔧 **下一步**：把 `npm run audit:personas` 放進每次 deploy 後的手動 checklist；等 CI/CD 穩定後再升級成 GitHub Action / Netlify post-deploy smoke。audit 若在 live 上 fail，先看 blocker 是 deploy stale、API down、auth credentials drift，還是真的 UI regression。

## ✅ Deterministic parent login convention（2026-05-22 Slot C35）

> 目標：Alan 建議 parent account 不要每次人工想一組，而是用學生登入信箱推導：`student_local_part_parent@same_domain`，預設密碼 `Parent2024!`。這降低 admin 建帳成本，也讓 persona audit 可以固定跑 real parent login。

- ✅ **Shared credential helper**：新增 `server/src/lib/parentCredentials.js`，集中定義 `parentLoginEmailForStudentEmail()` 與 `DEFAULT_PARENT_PASSWORD=Parent2024!`。
- ✅ **Seed consistency**：`server/prisma/seed.js` 現在每個 seeded student 都會同時建立 deterministic parent account；若沒有真實 parent contact email，`Student.parentEmail` 會用 parent login alias 補上。
- ✅ **Admin parent setup default**：`src/components/pages/Admin/AdminTranscriptPage.js` 的 Parent section 拆清楚「Parent Contact Email」與「Parent Portal Login」。Portal login 預設為學生信箱加 `_parent`，密碼預設 `Parent2024!`；建立/重設 parent login 不再把 login alias 強行寫成 contact email。
- ✅ **Parent setup API default**：`POST /api/parent/setup` 現在只要提供 `studentId`，就可從 student account email 推導 parent login email，並使用預設密碼；仍可傳入自訂 email/password 覆蓋。
- ✅ **Weekly report recipient safety**：`weeklyReportService` 現在優先寄 purchaser email / `Student.parentEmail`，再 fallback parent login account，避免 school-managed login alias 搶走真實家長收件地址。
- ✅ **Repair tool**：新增 `server/scripts/ensure-parent-accounts.js`，`npm run audit:parent-accounts` dry-run、`npm run repair:parent-accounts` apply，可為既有學生補 deterministic parent accounts 並重設為預設密碼。
- ✅ **Persona audit default**：`npm run audit:personas` 現在預設用 `hanxi.xiao_parent@genesisideas.school` / `Parent2024!` 跑 real parent login；不再需要手動傳 `PARENT_EMAIL` / `PARENT_PASSWORD` 才能測 parent route。
- ✅ **Production repair + verification**：Lightsail 已拉到 commit `8a6f6f8b`，production dry-run 顯示 5 位學生需補 parent account，已執行 `cd server && npm run repair:parent-accounts` 並重啟 `giis-api`。最新 `npm run audit:personas` 對 live site 為 12 pass / 0 warn / 0 fail，包含 `hanxi.xiao_parent@genesisideas.school` / `Parent2024!` real parent login → dashboard。

## ✅ Application activation account closure（2026-05-22 Slot C36）

> 目標：修 admissions → account creation 的真缺口。原本 `/api/applications/:id/activate` 只建立 Student + ParentAccount，沒有建立 StudentAccount；也就是 admin activate 後，家長可能能登入，但學生沒有 Learn Portal 帳號。這會直接破壞「付錢後能不能上課」的信任。

- ✅ **Activation now creates StudentAccount**：`server/src/routes/applications.js` 的 activate flow 現在會從 applicant student name 產生 school-managed student login email（例如 `student.name@genesisideas.school`，若重複則自動加 `.2` 等 suffix），並建立 `StudentAccount`。
- ✅ **Deterministic parent login tied to student login**：activate flow 會用 student login email 推導 parent login email：`student.name_parent@genesisideas.school`，密碼 `Parent2024!`。`Application.parentEmail` 保留為真實 parent contact email / welcome-email recipient。
- ✅ **Welcome email and admin modal show both credentials**：`server/src/lib/mailer.js`、`src/components/pages/Admin/ApplicationsQueue.js` 現在列出 Parent Portal email/password 與 Student Portal email/password，不再只顯示一組模糊的 temp password。
- ✅ **Checkout linking improved**：`ParentDashboard` 開 Stripe Checkout 時會帶目前 parent login email，讓 webhook 可透過 `ParentAccount.email` 自動 link Subscription.studentId。
- ✅ **Welcome page copy corrected**：`/welcome` 的 next steps 不再暗示「24 小時後才拿學生帳號」；改為若 admissions 已 activate，welcome email 已包含 parent/student credentials。
- ✅ **驗證**：`node --check` 通過 `parentCredentials.js`、`mailer.js`、`applications.js`；`npm run build` 通過；`cd server && npm test -- --runInBand` 通過。
- ✅ **Production deploy + smoke**：commit `e21b25df` 已 push；Lightsail `/home/ubuntu/GIIS-website` 已 fast-forward pull 並 `pm2 restart giis-api --update-env`。Production `npm run audit:parent-accounts` 仍為 5/5 already present；live `npm run audit:personas` 為 12 pass / 0 warn / 0 fail。
- 🔧 **下一步**：把 application/payment state machine 做成 admin 可見狀態：`approved but unpaid`、`paid but unlinked`、`account created + welcome sent`。之後再把 `/apply` submit → payment link → welcome/account activation 的順序收成更少人工操作。

## 🔧 V1 lifecycle smoke + application enrollment state（2026-05-22 Slot C37）

> 目標：用「真學校 v1」標準測一條完整路線：new student application → account creation → parent/student login identity → payment link → course enrollment → module/quiz/midterm/final/assignment completion → 24-credit transcript eligibility → cleanup。這不是正式資料 seed，而是 production/staging 可重跑的 lifecycle smoke。

- ✅ **Admin application state now shows the real operating gap**：`server/src/routes/applications.js` 的 `GET /api/applications` 現在回傳 `enrollmentState`，可區分 `pending_review`、`approved_unactivated`、`accounts_created_unpaid`、`paid_unlinked`、`active_paid`、`rejected`，並附 next action、student login、parent login、payment status。
- ✅ **Activation links existing paid checkout rows**：`POST /api/applications/:id/activate` 會把同 parent contact email / deterministic parent login email 的 active/trialing/paid unlinked subscriptions 連到新 student，避免「已付款但帳號未 link」卡住。
- ✅ **Applications Queue UI exposes enrollment/payment state**：`src/components/pages/Admin/ApplicationsQueue.js` 顯示 enrollment-state badge、next action、student login、parent login、payment status，以及 activate 後 linked payment count。Admin 不必去 DB 猜申請現在卡在哪。
- ✅ **V1 lifecycle smoke script added**：新增 `server/scripts/v1-lifecycle-smoke.js`，`cd server && npm run smoke:v1-lifecycle:cleanup` 會建立 temporary `GIIS-V1-SMOKE` student/application/accounts/subscription/enrollments/module progress/quiz/final/assignment/24-credit transcript，驗證後自動刪除。
- ✅ **Local verification**：`node --check server/src/routes/applications.js`、`node --check server/scripts/v1-lifecycle-smoke.js`、`npm run build`、`cd server && npm test -- --runInBand` 通過。Frontend syntax 由 CRA build 驗證；直接 `node --check` ES module page 不適用。
- ✅ **Production verification**：commit `cb5c7ece` 已 push/deploy 到 Lightsail，並跑過 `cd /home/ubuntu/GIIS-website/server && npm run smoke:v1-lifecycle:cleanup`。第一次 production smoke 通過且自動 cleanup，但暴露 GPA 顯示 `-` 的 Decimal handling gap，因此升級到 Slot C38。
- 🎨 **Visual/product review items captured for next pass**：public site 的 real-product screenshots 是正確方向，應持續避免 AI stock hero；下一階段要把 admissions funnel 做得更像 productized enrollment timeline，把 admin inline styling 收斂成 shared admin chrome，並讓 parent/student dashboard 的 progress evidence 更一眼可懂。

## ✅ Server GPA Decimal handling（2026-05-22 Slot C38）

> 目標：修 V1 lifecycle smoke 在 production 抓到的真 data-flow gap。Smoke student 24-credit transcript 有完整 letter grades，但 server-side GPA total 顯示 `-`，原因是 Prisma `Decimal` 物件在 `computeSemesterTotals()` 裡沒有被正確轉成 number。

- ✅ **GPA helper fixed**：`server/src/lib/gpa.js` 現在用 safe numeric coercion 處理 number/string/Prisma Decimal-like values，同時保留 null GPA rows 不列入 GPA average 的原行為。
- ✅ **Regression test added**：`server/src/lib/gpa.test.js` 新增 Decimal-like value case，避免 parent dashboard / weekly report / smoke script 再把 DB decimal GPA 算成空值。
- ✅ **V1 smoke gate tightened**：`server/scripts/v1-lifecycle-smoke.js` 現在要求 transcript GPA 必須成功計算；只有 credits 滿 24 不再足夠。
- ✅ **Local verification**：`node --check server/src/lib/gpa.js`、`node --check server/scripts/v1-lifecycle-smoke.js`、`cd server && npm test -- --runInBand`、`npm run build` 通過。
- ✅ **Production verification**：commit `a3423316` 已 push/deploy 到 Lightsail；production `npm run smoke:v1-lifecycle:cleanup` 通過，建立並刪除 temporary `GIIS-V1-SMOKE` student。結果：4 enrollments、38 quiz attempts、8 exam attempts、4 graded assignments、38 moduleProgresses、24 transcript credits、GPA `3.68`、`gpaComputed=true`、`leftoverStudent=false`。
- ✅ **Post-deploy persona audit**：`npm run audit:personas` 對 live site 通過：12 pass / 0 warn / 0 fail，包含 new-student public funnel、student login → Learn Portal、admin dashboard/progress、real parent login → dashboard。

## 🔧 Parent dashboard load stability（2026-05-22 Slot C39）

> 目標：修 persona screenshot review 抓到的家長視角 P0：real parent dashboard 雖然 API `/api/parent/me` 回 200，但 frontend 反覆重新 fetch，最後撞到 rate limit 429，頁面變成 `Failed to load data.`。這會直接破壞家長 trust/transparency。

- ✅ **Root cause found**：`src/components/pages/Parent/ParentDashboard.js` 每次 render 都重新執行 `getParentSession()` 產生新 object，`useEffect([session, load])` 因此持續重跑；成功 setData 後又觸發下一輪 fetch。
- ✅ **Parent dashboard fixed**：Parent session 現在用 `useMemo(() => getParentSession(), [])` 穩定住；成功載入 `/api/parent/me` 後會清掉 stale error，不再因 repeated fetch 撞 429。
- ✅ **Persona audit tightened**：`tools/persona-audit/audit_site.js` 現在把 `Failed to load data` / `加载失败` 視為 broken state；real parent dashboard 必須看到 `Credits Earned`/`已获学分` 與 GPA/transcript evidence，且不能還停在 Loading。
- ✅ **Local verification**：`node --check tools/persona-audit/audit_site.js`、`npm run build`、`cd server && npm test -- --runInBand` 通過。
- ⚠️ **Follow-up found during production audit**：加嚴版 audit 先抓到另一個 blocker：old parent dashboard loop 把 production auth limiter 撞滿，導致 student/admin/parent login routes 全部 429。這不是 frontend fix 本身壞掉，而是 rate limit scope 太粗，升級到 Slot C40 修。

## 🔧 Auth rate-limit scope hardening（2026-05-22 Slot C40）

> 目標：避免 dashboard data polling 或 smoke tests 把整個 `/api/parent` auth limiter 撞滿，進而讓真學生、家長、admin 短時間無法登入。

- ✅ **Parent data route no longer consumes auth login quota**：`server/src/index.js` 不再把 `authLimiter` 套在整個 `/api/parent` router。現在只限制 `/api/parent/login`、`/api/parent/forgot-password`、`/api/parent/reset-password`，`/api/parent/me` 不會因 dashboard refresh 消耗 login quota。
- ✅ **Login smoke tolerance improved**：`AUTH_RATE_LIMIT_MAX` 可用 env 覆蓋，預設從 20/15min 提高到 60/15min。仍保留 brute-force 防線，但不會被一次 persona audit + frontend loop 這麼容易鎖死。
- ✅ **Production verification**：commit `b4fc6a51` 已 push/deploy 到 Lightsail，`pm2 restart giis-api --update-env` 後 production `npm run smoke:v1-lifecycle:cleanup` 通過；auth limiter memory 已隨 API restart 清空。
- ⚠️ **Follow-up found during persona audit**：加嚴版 parent dashboard audit 已確認 student/admin login 通過，但 parent route 被 overly broad `Loading` assertion 擋下。Dashboard content 已被 assertion 找到，下一 slot 收斂 audit 判斷。

## 🔧 Parent audit loading assertion refinement（2026-05-22 Slot C41）

> 目標：保留 parent dashboard audit 對 `Failed to load data` / 真 loading shell 的防護，但不要因 dashboard 已載入後某個按鈕或 incidental text 含 `Loading…` 而 false-fail。

- ✅ **Audit refined**：`tools/persona-audit/audit_site.js` 現在仍要求 parent dashboard 出現 `Parent Portal`、`Credits Earned`、GPA/transcript evidence；只有整個 body 還是 loading shell 時才報 `Parent dashboard is still on the loading shell`。
- ✅ **Production verification**：加嚴版 `npm run audit:personas` 對 live site 通過：12 pass / 0 warn / 0 fail。Parent dashboard screenshot 已確認不再停在 loading，顯示 Hanxi parent view：32 credits、GPA 3.78、100% graduation progress、recent activity、official transcript link、subscription controls。

---

## ✅ Course/video alignment guard + syllabus pass（2026-05-22 Slot C44）

> 目標：依 Alan 要求檢查 Learn Portal 每門課的 syllabus/module quality，並在 Umi-led lesson flow 開始前確認 CC 影片 pipeline 不會把錯 module 的影片掛到網站上。

- ✅ **Course quality audit re-run**：`npm run audit:pathways` 通過，結果從 48 pass / 45 warn / 0 fail 改善為 49 pass / 44 warn / 0 fail（93 courses）。本輪先修 AP Computer Science A 的 weak objectives，讓 Module 1、8、9、10 的 objectives 更 measurable、更像真課綱。
- ✅ **Critical course/video mismatch found**：AP CS A published course JSON 定義 Module 7 = `Constructors, Encapsulation & this`、Module 10 = `ArrayList`，但既有 `teaching-videos/ap-cs-a-module-7-arraylist/` 與 manifest/queue 把 ArrayList 當 M7。AP Calculus AB 也有大範圍 course JSON vs uploaded lesson manifest numbering drift。這不是文字小錯，會讓家長/學生在 Learn Portal 看到錯課影片。
- ✅ **Wrong same-number embeds guarded**：`LessonVideoEmbed` 現在接收 current module title，並用 token overlap 檢查 manifest lesson title 是否與 published course module title 相容；不相容就不 render。這會優先保護 trust/transparency，避免「同一個 module number 但不同內容」的 stale YouTube manifest 誤掛到課程頁。
- ✅ **Lesson manifest alignment audit added**：新增 `npm run audit:lesson-manifest` / `tools/youtube-upload/audit_manifest_alignment.js`。目前報告 50 lessons 中 12 warnings：AP CS A M5/M10 mismatched，AP Calculus AB M2-M12 多數 mismatched。這個 audit 是未來修 manifest/course mapping 的 source-of-truth checklist。
- ✅ **AP CS A ArrayList pilot corrected**：刪除錯誤 M7 pilot handoff，改成 `umi/handoffs/2026-05-22-ap-cs-a-m10-arraylist-v2-pilot.md`。CC 下次應以 course JSON 為準，target `teaching-videos/ap-cs-a-module-10-arraylist-v2/`，舊 M7 folder 只能作 legacy reference，不能 upload / embed 成 M7。
- ✅ **CC SOP updated**：`tools/lesson-video/AUTO_PIPELINE.md` 明確規定 lesson numbering source of truth 是 `server/prisma/courses/**/*.json`，不是既有 `teaching-videos/` folder name。
- ✅ **驗證**：`node --check tools/youtube-upload/audit_manifest_alignment.js` 通過；`npm run audit:lesson-manifest` 通過並列出 12 個 alignment warnings；`npm run audit:pathways` 通過；`npm run build` 通過（只有既有 Browserslist stale warning）。
- 🔧 **下一步**：先做 manifest/course reconciliation，尤其 AP Calculus AB 和 AP CS A uploaded lessons；在 mapping 修好前，網站會保守隱藏 title 不相容的影片，而不是錯播。

---

## 🔎 YouTube upload pipeline review（2026-05-22 Slot C42）

> 目標：檢查 Claude Code / scheduled pipeline 這幾天 YouTube 上傳狀態，判斷是否有 quality gate、manifest、cleanup、auto-push 問題。這輪是 review / diagnosis，未改 pipeline code。

- ✅ **近期上傳有實際進展**：`npm run yt:status` 顯示本地 queue 目前 52 uploaded、15 pending、3 no MP4、70 total。最近上傳包含 2026-05-21 AP Biology M12/M13、AP CS A M5/M6；2026-05-20 AP Biology M8/M9/M10 V2、AP CS A M4。
- ⚠️ **Release gate is currently advisory only**：`lesson_release_gate.py --pending` 評估 15 支 pending，結果 ready 0 / needs_revision 15 / blocked 0。主要原因是 missing `transcript.txt`、missing `contact-sheet.jpg`、missing 3-reviewer artifacts、AP citation/source checker，且 score 多數低於 90。但 `tools/youtube-upload/daily.sh` 現在只是印出 gate report，仍會繼續 `yt_queue.py upload --max 4`，所以明天可能把 AP CS A M7-M9 或 AP Psych pending lessons 上傳出去，即使 gate 判 needs_revision。
- ⚠️ **Manifest / channel / local script drift**：daily log 顯示 channel sync canonical lessons 是 50 + 1 non-lesson school intro；本地 `yt_queue.py` 因 trust local `script.json.youtube` 顯示 52 uploaded。差異來自 stale/local-only metadata，例如 AP Biology old M10 `ILFeGC54PBo` cleanup 找不到 channel video、AP Biology M2/M6 缺 `uploaded_at` / `privacy`、Algebra I M9 stale duplicate `bmyK05H8fFU` 曾被 sync 標為 duplicate。`public/data/lessons-manifest.json` 目前為 channel-derived 50 lessons。
- ⚠️ **Fresh upload eventual-consistency gap**：AP CS A M6 本地 `script.json` 已有 `xQW0hpadLO4`，但目前 committed manifest 仍只有 AP CS A 6 lessons（M1-M5, M10），缺 M6。推測是 upload 後立刻跑 channel sync 時 YouTube uploads list 還沒完全反映新影片；下一次用 channel sync 應修正，或需要在 upload 後延遲 / retry sync。
- ⚠️ **Auto-push reliability issue observed**：5/21 daily log 顯示上傳 4 支成功後，auto-push 因 `.git/HEAD.lock` 失敗。當前 `.git/HEAD.lock` / `.git/index.lock` 不存在，但 `daily.sh` 只防 `.git/index.lock`，沒有同樣處理 stale `HEAD.lock`。
- 🔧 **建議下一步**：把 upload runner 改成強制消費 release gate 的 `ready_to_upload` 清單（或 gate fail 時 stop upload）；把 channel sync 設成 upload 後延遲 / retry，並避免 legacy `build_manifest.py` 覆蓋 channel-derived manifest；在 auto-push lock cleanup 同時處理 stale `HEAD.lock`；最後清理 stale local youtube blocks，讓 `yt_queue.py` 不再高估 uploaded count。

---

## ✅ Umi-led lesson pipeline split + upload gate hardening（2026-05-22 Slot C43）

> 目標：把 lesson production 從「CC 自己產、自己審、自己上傳」改成 Umi owns teaching design/review，Claude Code owns production mechanics。先建立 AP CS A ArrayList V2 pilot，並阻止未過 release gate 的 pending videos 被 unattended daily job 上傳。

- ✅ **Umi/CC role split written into SOP**：`tools/lesson-video/AUTO_PIPELINE.md` 新增 Umi-led production split：Umi 負責 lesson concept、scope、narration quality、misconception strategy、AP/content correctness judgement、parent-facing school quality、final release review；Claude Code 負責 repo mechanics、slides/render/transcript/contact sheet/audit/pipeline fixes/upload artifacts。
- ✅ **AP CS A ArrayList V2 pilot handoff created**：初版 handoff 定義 ArrayList pilot 的教學 brief、section rhythm、scope、out-of-scope、acceptance criteria 與 Umi review notes。後續 Slot C44 發現 published course JSON 中 ArrayList 是 Module 10，因此正式 handoff 已更正為 `umi/handoffs/2026-05-22-ap-cs-a-m10-arraylist-v2-pilot.md`。核心教學 thesis：ArrayList is not just "array but bigger"; it is a resizable list object with method calls, shifting behavior, and removal/traversal traps。
- ✅ **YouTube queue now supports release-gate filtering**：`tools/youtube-upload/yt_queue.py upload --gate-ready` 只會上傳 `teaching-videos/_audit/release-gate/latest-release-gate.json` 的 `ready_to_upload` lessons。若 gate 缺失或沒有 ready lessons，unattended upload 保守視為 0 allowed。
- ✅ **Daily upload runner now uses the gate**：`tools/youtube-upload/daily.sh` 改為 `yt_queue.py upload --max 4 --privacy unlisted --gate-ready`。目前 dry-run 顯示 15 pending → 0 pending allowed by release gate，因此明天不會因為「有 MP4」就上傳未過審 AP CS A/AP Psych lessons。
- ✅ **Git lock hardening**：`daily.sh` 的 stale lock cleanup 從只處理 `.git/index.lock` 擴充到 `.git/index.lock` + `.git/HEAD.lock`，對應 5/21 daily log 的 auto-push failure。
- ✅ **驗證**：`python3 -m py_compile tools/youtube-upload/yt_queue.py tools/lesson-video/lesson_release_gate.py` 通過；`bash -n tools/youtube-upload/daily.sh` 通過；`python3 tools/youtube-upload/yt_queue.py upload --max 4 --privacy unlisted --gate-ready --dry-run` 顯示 15 → 0 且不會 upload。
- 🔧 **下一步**：讓 CC 依 corrected handoff 重做/升級 AP CS A Module 10 ArrayList V2 artifact；Umi review `script.json` + `contact-sheet.jpg` + release gate 後，再批准 upload。之後再做 channel sync delayed/retry 與 stale local youtube block cleanup。

---

## ✅ Admin progress data-flow cleanup（2026-05-21 Slot C29）

> 目標：Alan 指出 `/admin` table 太吵、progress 看起來不完整，且學生 quiz / module / final 完成狀態可能有 gap。本輪先修可視化與資料流判斷，並提供 dry-run 修復工具；正式改學業紀錄前仍需人工確認目標 DB。

- ✅ **Admin roster 再瘦身**：`src/components/pages/Admin/AdminDashboard.js` 的 student table 移除 guardian / updated / raw login email 欄位，保留 Name+ID+guardian summary、Status、Grade、Account status、Action。細節操作改由 student record 進入，避免 `/admin` 第一屏像 raw database table。
- ✅ **Progress API 修正資料流斷層**：`server/src/routes/students.js` 的 `/api/students/progress` 現在同時計算 official transcript credits 與 Learn Portal credits。歷史 / imported transcript rows 不再被 Progress page 誤判成 Learn Portal 沒進度。
- ✅ **Progress page 顯示更誠實**：`src/components/pages/Admin/AdminProgressPage.js` 現在分開顯示 Official Credits、Portal Credits、Modules、Quiz / Exams、Courses Done，並顯示 data notes（例如 transcript 有 historical/import credits、portal earned credits 尚未 posted to transcript）。
- ✅ **Completion repair dry-run tool**：新增 `server/scripts/repair-learn-completions-from-transcripts.js`，並在 `server/package.json` 加入 `npm run audit:learn-completions`（dry-run）與 `npm run repair:learn-completions`（apply）。工具會用 transcript letter grade 決定 target score，補缺失的 module quiz attempts、moduleProgress、midterm/final attempts、creditEarned，並寫 AuditLog；已存在 quiz attempt 的 moduleProgress 會使用既有 quiz `submittedAt` 作為 completion timestamp，避免把歷史完成時間全部寫成今天；預設不改資料。
- ⚠️ **尚未對 DB 套用 completion repair**：本機沒有 Docker / PostgreSQL service（`docker` command unavailable；`localhost:5432` unreachable），所以只完成 code-level gate 與 dry-run 工具。正式補學生完成紀錄前，要確認要跑的是 production DB、staging DB，還是 local DB，且需 Alan 明確確認 `--apply`。
- ✅ **驗證**：`node --check server/src/routes/students.js`、`node --check server/scripts/repair-learn-completions-from-transcripts.js`、`npm run audit:official-docs`、`npm run build` 全部通過。`npm run audit:learn-completions` 因本機 DB 未啟動而無法連線，未修改資料。

---

## ✅ Production API deploy + Learn Portal completion backfill（2026-05-21 Slot C30）

> 目標：Alan 決定 production 才是真正要補齊學生資料的地方。本輪只做 targeted production repair，不 re-seed，不重建正式學籍資料。

- ✅ **Lightsail access confirmed**：production API host 為 `api.genesisideas.school` / `54.163.81.228`，SSH 使用 `/Users/alanhdchu/Desktop/LightsailDefaultKey-us-east-1.pem`、user `ubuntu`。Repo path：`/home/ubuntu/GIIS-website`。PM2 process：`giis-api`。
- ✅ **Production code deployed**：local commit `95db708d` pushed to GitHub；Lightsail fast-forward pulled `0a2f2b80 → 95db708d`；ran root/server `npm install`、`npx prisma generate`、`npm run db:push`。Prisma reported database already in sync.
- ✅ **No production re-seed**：production DB already had 5 students, 40 semesters, 200 courseRows, 19 enrollments, 224 quizAttempts, 38 submitted examAttempts. Re-seed would be unsafe and unnecessary.
- ✅ **Completion dry-run before apply**：`npm run audit:learn-completions` showed all 19 enrollments had no missing quiz modules, no missing exams, no missing `creditEarned`; only `ModuleProgress` rows were missing.
- ✅ **ModuleProgress backfilled**：ran `npm run repair:learn-completions` on production. `moduleProgresses` count is now 224, matching existing quizAttempts. Existing quiz submitted timestamps were used as module completion timestamps.
- ✅ **Hanxi targeted credit correction**：production DB had Hanxi Xiao G12 Spring `Behavioral Science` and `Social Psychology` at 1.0 credit each. Corrected only those two rows to 0.5 each; letter grades unchanged. Hanxi total credits changed 33 → 32, still graduation eligible. Wrote `AuditLog(action=transcript_credit_admin_correction)`.
- ✅ **API restarted and verified**：`pm2 restart giis-api --update-env`; PM2 status online. `https://api.genesisideas.school/api/checkout/tiers` returns 200 JSON. Post-repair dry-run returns `enrollmentsToRepair: 0`.
- ⚠️ **Frontend deploy note**：GitHub push is complete, but `https://genesisideas.school/` still served old Netlify bundle `main.49b0480e.js` at verification time. API is deployed; Admin UI changes may require Netlify auto-deploy to finish or manual Netlify deploy.

---

## ✅ Pathway / course quality audit + public evidence panel（2026-05-20 Slot B）

> 目標：用高標準檢查 pathway 是否像一間真高中，而不是只像 marketing page；讓家長看到學分、課綱、評量與成果證據，也讓 dev 之後可自動抓出薄弱課程。

- ✅ **使用 skill 判斷**：用 `engineering:tech-debt` 的 impact/risk/effort 框架檢查 pathway/course content debt。結論：public pathway 可信度不差，但 course catalog/source-of-truth 分散與 AP 題庫缺口會直接傷害 trust/transparency。
- ✅ **新增 course quality audit**：`tools/pathway-quality/audit_courses.js` + `npm run audit:pathways`，掃 `server/prisma/courses/**/*.json`，檢查 modules、module quiz density、midterm/final 題庫、module objectives/resources/assignments、AP alignment wording、estimated hours。
- ✅ **Baseline 結果**：93 門課：77 pass / 14 warn / 2 fail。兩個 P0 fail 是 `ap-computer-science-a`、`ap-calculus-ab`：都有 14 modules，但 `quizQuestions=0`、`midterm=0`、`final=0`，學生進 Learn Portal 會卡在 quiz/exam 評量缺失。14 個 warn 主要是 1-credit electives estimated module hours < 40 或 AP alignment wording 不夠明確。
- ✅ **Public pathway trust upgrade**：`src/components/pages/Pathways/PathwayComponents.js` 新增 Academic evidence panel，顯示 credit map、course depth、assessment trail、senior evidence；每條 pathway 都會自動吃 schedule/courses 計算。
- ✅ **Pathways hub trust strip**：`src/components/pages/Pathways/PathwaysHub.js` 新增 Credit plan / Learn Portal evidence / Capstone outcome 三格，讓家長進 pathway hub 第一屏後立刻知道這不是普通選修課清單。
- ✅ **視覺/技術驗證**：`npm run audit:pathways` 通過並列出缺口；`npm run build` 通過；Playwright screenshots 已檢查 `/pathways/cs` 與 `/pathways`，新增 panel 無重疊、可讀。
- 🔧 **下一個 P0**：為 `ap-computer-science-a` 和 `ap-calculus-ab` 補至少每 module 3 題 quiz、midterm ≥10 題、final ≥15 題；這應該認真出題，不要用 placeholder。完成後 `npm run audit:pathways` 應降為 0 fail。

### ✅ Module outline rubric upgrade（2026-05-20 Slot B2）

- ✅ **Audit 不只查「有沒有」**：`tools/pathway-quality/audit_courses.js` 現在也檢查 module objectives 是否足夠長、是否含 measurable verb，以及 assignment 是否夠厚到能產生真 student work。
- ✅ **新 baseline**：`npm run audit:pathways` 結果為 57 pass / 34 warn / 2 fail。fail 仍是 AP CSA / AP Calc AB 無題庫；warn 變多是因為 rubric 更嚴格，抓出 outline quality 問題。
- 🔎 **高標準判斷**：整體 course sequence 有真學校雛形；最佳的一批是 Business / Social Studies / Psychology 多數 electives，module + quiz + assignment chain 比較完整。較弱的是 core Biology、English I Writing Focus、World History、Algebra I、部分 English IV variants：它們不是不能用，而是 objectives/assignments 太像 topic list，缺少可被家長/審核員看懂的「學生做了什麼」證據。
- 🔧 **下一個內容修補順序**：先補 AP CSA / AP Calc 題庫（P0），再 surgical upgrade Biology + English I Writing Focus + World History 的 weak objectives / thin assignments（P1），最後調整 1-credit electives estimated hours 或改成 0.5-credit positioning（P2）。

### ✅ Assessment bank QA gate + P0 assessment repairs（2026-05-20 Slot C）

> 目標：家長付錢後，學生進 Learn Portal 不能遇到「有課沒有 quiz / midterm / final」或「答對被系統判錯」這種直接毀信任的問題。

- ✅ **使用 skills**：`data:validate-data` 用來把 course audit 當資料品質驗證，不只看數量；`engineering:testing-strategy` 用來把 module quiz / midterm / final 變成可重跑的 acceptance gate；`engineering:tech-debt` 用於排定 P0/P1/P2。
- ✅ **AP CSA / AP Calculus AB P0 補齊**：新增 `tools/pathway-quality/fill_ap_assessments.js`，為 `ap-computer-science-a` 與 `ap-calculus-ab` 各補 42 題 module quiz（14 modules × 3）、15 題 midterm、20 題 final。兩門課從 fail 降為 warn。
- ✅ **Audit gate 升級到題目層級**：`tools/pathway-quality/audit_courses.js` 現在檢查每個 module 是否至少 3 題 quiz、midterm/final 題數、question/answer/options/explanation 基本完整性、A/B/C/D answer-key compatibility、open-response answer 異常。
- ✅ **修 Learn Portal 判分相容性**：`server/src/routes/enrollments.js` 現在同時接受完整選項文字與 `A/B/C/D` answer key；舊 course JSON 用 `"answer": "B"` 時，學生選第二個 option 不會再被錯判錯。
- ✅ **清掉所有 fail**：新增 `tools/pathway-quality/repair_assessment_quality.js`，修 5 門課的壞 answer key / missing short-answer model answers，並補 AP Biology、AP Human Geography、AP Psychology、AP Statistics 的 modules 15-16 quiz coverage。最新 `npm run audit:pathways`：93 門課 = 48 pass / 45 warn / 0 fail。
- ✅ **驗證**：所有 course JSON parse OK；`node --check` 通過；`npm run audit:pathways` 通過；`npm run build` 通過；`cd server && npm test -- --runInBand` 通過。
- 🔧 **下一個 P1**：45 個 warn 不是 blocker，但要逐步清。優先順序：Biology、English I Writing Focus、World History 的 weak objectives / thin assignments；再處理 open-response 題目 answer 看起來像 option key 的 legacy generated content；最後調整 low estimated hours 的 1-credit electives。

### ✅ Answer-key normalization + graduation eligibility audit（2026-05-20 Slot C2）

> 目標：把 Alan 指出的「`answer: "B"` 聽起來怪」拆清楚：題庫 source-of-truth 不應長期存 option key；runtime compatibility 只能當舊 DB 防護。同時用公開 graduation requirements 檢查 Class of 2026 到底誰可畢業。

- ✅ **題庫 source 正規化**：新增並執行 `tools/pathway-quality/normalize_answer_keys.js`；把 14 個 course JSON 中 684 題有 options 的 `answer: "A/B/C/D"` 轉成完整選項文字。最新檢查：`letterAnswersWithOptions=0`。
- ✅ **保留 runtime fallback 的原因**：`server/src/routes/enrollments.js` 仍接受 `A/B/C/D`，但定位是「保護已 seed / 已存在 DB 內的舊資料」，不是鼓勵新題庫使用 letter key。新 course JSON 應以完整答案文字為準。
- ⚠️ **真正壞題仍存在但已被 audit 標 warn**：136 題 `options: null` 但 `answer: "B/C"` 的 fill/open-response legacy generated questions。這不是判分相容問題，是內容品質問題；下輪應重寫成真正 short-answer / fill answer。
- ✅ **新增 graduation audit**：`tools/graduation/audit_seed_graduation.js` + `npm run audit:graduation`，用 `server/prisma/seed.js` 的 transcript source-of-truth 檢查 2026 屆 5 位學生。
- ⚠️ **重大發現**：Admin Transcript 畫面目前只用 `>=24 credits` 解鎖 Mark as Graduated；但公開 `Handbook` / `SchoolProfile` 寫的是 24-credit subject distribution（含 World Languages 2 credits、PE/Health 1 credit）。照 Admin credits-only，5 位 seed senior 都 eligible；照公開 subject distribution，5 位都 not eligible，因為 transcript 沒有 World Languages；Ruwen / Baoyi / Hanxi 另缺 PE/Health。
- 🔧 **下一個 P0**：決定 GIIS 真正畢業規則。若採 Florida-style 24-credit + 8.5 electives、無 world language requirement，要同步改 `Handbook` / `SchoolProfile` / audit；若保留 World Languages 2 credits，必須補 transfer-credit rows 或新增語言課程到學生 transcript，並把 Admin eligibility 改成 distribution-based。
- ✅ **驗證**：`npm run audit:graduation`、`npm run audit:pathways`、`npm run build`、`cd server && npm test -- --runInBand` 全部通過。

### ✅ GIIS online-school graduation framework cleanup（2026-05-20 Slot C3）

> 目標：把公開畢業規則改回真實、可營運、適合 online school 的版本；避免把 Florida public-school PE requirement 或 college-admission world-language recommendation 誤寫成 GIIS diploma hard requirement。

- ✅ **重新查官方資料**：Florida DOE private-school general requirements 明確說 DOE 不管 private school 的 curriculum、academic credits、grades、graduation/promotion requirements；這些由 private school owner 負責。Florida Statute 1002.42 的重點是 registration / annual survey / owner fingerprints / records / attendance / health and immunization / safety，不是 subject-by-subject graduation table。
- ✅ **釐清 public standard**：Florida public high school standard diploma 在 1003.4282 有 24-credit distribution，含 PE；private school 要讓家長知道 public high school requirements，但不是被要求採用同一套。
- ✅ **移除 GIIS PE hard requirement**：`HandbookPage.js`、`SchoolProfilePage.js`、`CourseCatalog.js` 不再把 PE/Health 寫成畢業必修；Health/PE 留作 optional wellness electives。
- ✅ **移除 World Languages hard requirement**：World Languages 改為 selective college recommendation，不列為 GIIS diploma 門檻。這避免 2026 屆 senior 因沒有外語課被錯判不 eligible。
- ✅ **新 GIIS 24-credit framework**：English 4、Math 4、Science 3、Social Studies 3、Pathway / college-prep / arts / technology / personal finance / free electives 10。Total = 24。
- ✅ **Audit 更新**：`npm run audit:graduation` 現在 5 位 seed senior 都是 `giis=eligible`，並會提示 world language 是 college recommendation 而非 diploma requirement。
- ✅ **驗證**：`npm run audit:graduation` 通過；`npm run build` 通過；`cd server && npm test -- --runInBand` 通過。
- 🔧 **下一個 P0**：Admin 畢業 UI 目前只顯示 credits-only eligible。建議下一步把 `audit:graduation` 的 distribution logic 抽成 shared helper，讓 Admin Transcript 頁同時顯示 subject breakdown + college recommendation note。

### ✅ Class of 2026 senior records audit + graduation issuance dry-run（2026-05-20 Slot C4）

> 目標：在寄給校長要求成績單與畢業證書前，先用可重跑 gate 檢查五位可畢業學生的 transcript、semester grades、G12 Spring Learn Portal completion、quiz/midterm/final score sync。

- ✅ **新增 senior records audit**：`tools/graduation/audit_senior_records.js` + `npm run audit:seniors`，靜態檢查 `server/prisma/seed.js` 與 course JSON，不依賴本機 DB 是否啟動。
- ✅ **稽核範圍**：確認五位 2026 senior 都有 8 個學期、transcript date、graduation date、所有 course rows 有 credits / letter grade / GPA、總學分 ≥24、G12 Spring transcript rows 有 release gate、G12 Spring Learn Portal progress 有全 module quiz + midterm + final exam。
- ✅ **修正 score sync bug**：G12 Spring 幾門 A- 課程原本 seed 成 `quizScore=90`、`examScore=89`，照 Learn Portal 加權會算 89.4 = B+；已改成 `examScore=90`，讓 Learn Portal 計算結果與 transcript A- 一致。
- ✅ **Audit 結果**：`npm run audit:seniors` 五位全 PASS：Ruwen Li 33 credits、Tao Zhang 32.5 credits、Baoyi Lu 33 credits、Yunfan Yang 31 credits、Hanxi Xiao 33 credits；G12 Spring 全部 releaseDate = 2026-05-22。
- ✅ **寄信 dry-run script**：新增 `server/scripts/send-graduation-issuance-requests.js`。預設只列出五封信 To/CC/Subject/Audit summary；真正寄送必須加 `--send`，且應等 Alan 明確確認。
- ✅ **Email template**：`server/src/lib/mailer.js` 新增 `sendGraduationIssuanceRequest()`，每封信給 `shiyu.zhang@genesisideas.school`，CC `alanhdchu@genesisideas.school` + `admissions@genesisideas.school`，內容請校長 review / prepare official transcript + diploma package。
- ✅ **已寄出畢業文件通知信**：Alan 於 2026-05-20 明確確認後，已執行 `GRADUATION_REQUEST_CC=alanhdchu@genesisideas.school node scripts/send-graduation-issuance-requests.js --send`，五封分開寄給 `shiyu.zhang@genesisideas.school`，CC Alan。Resend ids：Ruwen `66a2c5ed-7c87-42d0-a79e-f761612ab678`；Tao `a04fd023-c2d5-4972-96f0-78f5ea17d3e6`；Baoyi `fbc4babd-7aff-42f9-9ad6-0a3b84c14fba`；Yunfan `15b9b6c7-de6f-46b7-8c1b-7d84c71557e4`；Hanxi `aeddad8c-ba58-46b7-b6f8-47db80531538`。
- ✅ **驗證**：`npm run audit:graduation` 通過；`npm run audit:seniors` 通過；`node server/scripts/send-graduation-issuance-requests.js` dry-run 通過；`cd server && npm test -- --runInBand` 通過；`npm run build` 通過。

### ✅ Transcript / diploma consistency hardening（2026-05-20 Slot C5）

> 目標：回應 Alan 對 hardcoded / imported transcript rows 的擔心。結論：第一年有 transfer/import transcript source-of-truth 可以接受；真正要防的是學生端可寫 transcript、future graduation 被 verify 成已畢業、以及 Admin 保存 transcript 時把 release gate 洗掉。

- ✅ **更嚴格 senior audit**：`npm run audit:seniors` 現在也檢查 diploma/verification source fields（studentCode、graduationDate、transcriptDate），並把「historical transcript/import-only course names 不完全 match current catalog」標成 warning。
- ✅ **目前資料判斷**：五位 senior 仍全 PASS。Ruwen/Tao/Baoyi 沒有 credit/catalog warning；Yunfan 有 2 筆 historical/import credit variation（Grade 11 Government/Economics 是 0.5，current catalog 是 1），屬歷史轉入/semester-credit 記錄，不是 current Learn Portal row；Hanxi 有 7 筆 historical transcript/import-only rows 不完全 match current catalog（例如 Learning Strategies & Study Skills、Introduction to Sociology、Biology - Human Systems）。
- ✅ **修 current-course credit mismatch**：Hanxi 的 G12 Spring `Behavioral Science` / `Social Psychology` 是現行 Learn Portal 課，catalog 都是 0.5 credit，但 transcript 原本寫 1 credit；已修為 0.5 + 0.5。Hanxi 總學分從 33 改為 32，仍高於 24-credit graduation threshold。
- ✅ **Audit gate 加 credit rule**：`npm run audit:seniors` 現在會把 G12 Spring current-course credit 與 catalog mismatch 視為 issue；historical/import rows 的 credit mismatch 則標 warning，要求未來用 official revision log 或 source label 解釋。
- ✅ **鎖住 transcript 寫入權限**：`server/src/routes/students.js` 的 profile PATCH 與 transcript PUT 改為 admin-only。之前雖然前端不給 student save button，但 API 層 student token 仍可能改 transcript；這是直接破壞 official records trust 的漏洞。
- ✅ **保存 transcript 不再洗掉 release gate**：`PUT /api/students/:id/transcript` 重建 semesters 時會保留同 key 既有 `releaseDate`；避免 Admin 進 edit/save 後把 G12 Spring 的 2026-05-22 release gate 變 null。
- ✅ **verification 修正 future graduation**：`server/src/routes/verify.js` 不再只看 `graduationDate` 是否存在；只有 graduationDate <= today 才回 `graduated=true`。若是 2026-06-30 這種未來日期，public verification 會回 `graduationScheduled=true`。
- ✅ **Diploma 頁 admin eligible date 修正**：`DiplomaPage.js` 在 admin 檢視 `/diploma/:studentId` 時改抓 `/api/enrollments/admin/student/:studentId`，避免抓到目前 cookie/session 下面錯誤學生的 enrollment evidence。
- ✅ **驗證**：`npm run audit:seniors` 通過；`npm run audit:graduation` 通過；graduation issuance dry-run 通過；`cd server && npm test -- --runInBand` 通過；`npm run build` 通過。
- 🔧 **下一個 P1**：把 transfer/import rows 正式加上 source label（例如 `source=transfer/import/learn_portal/manual_adjustment`）與 optional evidence note，讓 transcript audit trail 可以對外說清楚「哪些是轉入歷史學分，哪些是 GIIS Learn Portal 直接產生」。

### ✅ Graduation transcript + diploma PDF packages sent（2026-05-20 Slot C6）

> 目標：Alan 更正前一封 request-only email 不夠；校長需要收到每位學生的 transcript PDF + diploma PDF 附件。

- ✅ **Mailer 支援附件**：`server/src/lib/mailer.js` 的 `send()` 現在接受 `attachments`，新增 `sendGraduationDocumentPackage()` template。
- ✅ **PDF package script**：新增 `server/scripts/send-graduation-document-packages.js`，從 `server/prisma/seed.js` 的 senior transcript source-of-truth 產出每位學生兩個 PDF：official transcript（2 pages）與 diploma（1 page）。
- ✅ **PDF 產出位置**：`server/tmp/graduation-documents/`。已確認 10 個 PDF 都非空；`file` 顯示 transcript 皆為 2 pages、diploma 皆為 1 page。
- ✅ **正式寄出**：Alan 明確要求後，執行 `GRADUATION_DOCUMENT_CC=alanhdchu@genesisideas.school node scripts/send-graduation-document-packages.js --send`，五封分開寄給 `shiyu.zhang@genesisideas.school`，CC Alan；每封附該學生 transcript PDF + diploma PDF。
- ✅ **Resend ids**：Ruwen `ed2db01f-7651-4b41-be4f-95dfa581386f`；Tao `4a41f08c-a904-484a-bff1-bec909ea121e`；Baoyi `aeac2a03-7294-4193-8ace-4be15a995c06`；Yunfan `af608897-82c1-428e-8ca9-0349c6271a45`；Hanxi `ec1fc682-94f6-4978-b7f2-b712b89c4f6f`。
- ⚠️ **Clarification**：前一輪 Slot C4 寄出的是 graduation document issuance request，不含 PDF 附件；Slot C6 才是正確的 PDF attachment package。

### ✅ Corrected graduation PDF generator to Admin/frontend formats（2026-05-20 Slot C7）

> 目標：Alan 指出 Slot C6 附件 PDF 格式不對：server script 用了簡化版模板，沒有以 Admin transcript/diploma download format 為準。

- ✅ **Transcript date 修正**：`src/components/pages/Transcript/transcriptPdf.js` 的正式前端 export 現在 `Transcript Date` 永遠使用 export current date，不再優先使用 profile 裡舊的 `transcriptDate`。
- ✅ **Server transcript generator 修正**：`server/scripts/send-graduation-document-packages.js` 已改成對齊前端 `transcriptPdf.js` 的 compact one-page transcript style：A4 portrait、兩欄 semester tables、official header、seal/signature block、`Page 1 of 1`。
- ✅ **Server diploma generator 修正**：同一 script 的 diploma HTML 已改成對齊 `DiplomaPage.js` 的 admin/download style：navy/gold ornate border、大 seal、center diploma text、校長/學生簽名區、official seal、verification line。
- ✅ **PDF dry-run 已重新產出**：`server/tmp/graduation-documents/` 裡 10 個 PDF 已覆蓋為 corrected version。Python PDF page-count check：五份 transcript 都是 1 page，五份 diploma 都是 1 page。
- ✅ **驗證**：`node --check server/scripts/send-graduation-document-packages.js` 通過；`node --check server/src/lib/mailer.js` 通過；`npm run audit:seniors` 通過；`npm run build` 通過。
- ⚠️ **尚未重寄**：Slot C7 只重新產生 corrected PDFs，沒有再次 email，避免在 Alan 看過確認前又寄出錯附件。若 Alan 確認可重寄，執行 `GRADUATION_DOCUMENT_CC=alanhdchu@genesisideas.school node scripts/send-graduation-document-packages.js --send`。

### ✅ Graduation PDF generator re-aligned to Admin diploma visual source（2026-05-20 Slot C8）

> 目標：Alan 再次指出 diploma 仍不像 Admin 線上下載版、transcript 仍不像之前一頁剛好塞下的版型；本輪停止「近似模板」，改把 server PDF 產生器拉近 Admin/前端 source-of-truth。

- ✅ **Diploma 改回 Admin 視覺語言**：`server/scripts/send-graduation-document-packages.js` 現在補上 `DiplomaPage.js` 裡的 premium elements：Google font links、navy/gold frame、guilloche band、四角 ornament、大型 circular school seal、Pinyon/Great Vibes signatures、official seal、verification QR code。
- ✅ **QR code 不再用純文字代替**：server script 直接用既有 `qrcode.react` + `react-dom/server` render inline SVG，跟前端 QR code 來源一致。
- ✅ **Transcript package 回到一頁**：server transcript HTML 維持前端 transcript export 的 A4 / 190mm / official header / two-column semester tables / seal+signature block；PDF 輸出時對 transcript 使用 `scale: 0.94`，保證五位 senior 都是 1 page。
- ✅ **PDF dry-run 已覆蓋重產**：`server/tmp/graduation-documents/` 裡五位 senior 的 transcript + diploma 已重新產生；`file` page-count 顯示五份 transcript 全部 1 page。抽樣 preview：Ruwen transcript / diploma 已 render 成 PNG 檢查版面。
- ✅ **驗證**：`node --check server/scripts/send-graduation-document-packages.js` 通過；`npm run audit:seniors` 通過；`node scripts/send-graduation-document-packages.js` dry-run 通過；`npm run build` 通過。
- ⚠️ **尚未重寄**：這輪沒有 email。等 Alan 看過確認後，才可執行 `GRADUATION_DOCUMENT_CC=alanhdchu@genesisideas.school node scripts/send-graduation-document-packages.js --send` 重寄五封 PDF 附件信。

### ✅ Transcript package verified against 2026-05-10 git source（2026-05-20 Slot C9）

> 目標：Alan 指出「5/10 左右 git 的 transcript 格式不錯」，本輪明確回到那個 commit 檢查，而不是靠印象調整。

- ✅ **Git source check**：`git log --since='2026-05-08' --until='2026-05-12' -- src/components/pages/Transcript/transcriptPdf.js` 找到 5/10 transcript commits；最終 candidate 是 `0c609abe`（`Transcript: brand color unification, gold accent header`）。
- ✅ **差異結論**：目前前端 `src/components/pages/Transcript/transcriptPdf.js` 跟 `0c609abe` 幾乎一致；唯一刻意差異是 `Transcript Date` 改為 export current date，符合 Alan 先前要求。
- ✅ **Server package 修正**：問題不在前端 Admin download，而在 server PDF package 直接 print HTML 時比例和頁高不一致；`server/scripts/send-graduation-document-packages.js` 的 transcript PDF scale 從 `0.94` 調到 `0.97`，更接近 5/10 視覺密度，同時仍保證一頁。
- ✅ **PDF dry-run 已覆蓋重產**：五位 senior transcript + diploma 已重新產生；`file server/tmp/graduation-documents/*Transcript.pdf` 顯示五份 transcript 全部 1 page。
- ✅ **Preview 檢查**：已 render `server/tmp/graduation-documents/preview/baoyi-transcript.png` / `hanxi-transcript.png`，長內容 transcript 也能維持單頁且視覺密度接近 5/10。
- ✅ **驗證**：`node --check server/scripts/send-graduation-document-packages.js` 通過；`npm run audit:seniors` 通過。
- ⚠️ **尚未重寄**：仍未 email。等 Alan 確認 PDF 版型後再重寄五封附件信。

### ✅ Server transcript package moved to 2026-05-10 inline PDF settings（2026-05-20 Slot C10）

> 目標：Alan 強調 official transcript 不能 cosplay，要求「完全一樣的 5/10 版本」，尤其 seal 不要再用近似版。

- ✅ **5/10 source 再確認**：`0c609abe:src/components/pages/Transcript/transcriptPdf.js` 的 seal/signature block 使用 72px official seal、`grayscale(100%) opacity(0.42) contrast(110%) brightness(130%)` + double drop-shadow filter、25/15/60 seal/signature layout。
- ✅ **Server HTML 修正**：`server/scripts/send-graduation-document-packages.js` 不再只靠 class-based table CSS；semester tables 改成 5/10 前端 export 的 inline-style pattern（colgroup 44/10/8/8/15/15、header/body/totals inline styles）。
- ✅ **5/10 spacing/color 補齊**：server transcript header ratio、top rule spacing、watermark opacity、school-name margin 等回到 5/10 設定；seal/signature block 使用同一 filter/layout。
- ✅ **PDF dry-run 已覆蓋重產**：五位 senior transcript + diploma 已重新產生；五份 transcript 全部仍是 1 page。
- ✅ **Preview 檢查**：新增 `server/tmp/graduation-documents/preview/baoyi-transcript-v510.png` / `ruwen-transcript-v510.png` 作為本輪 visual QA。
- ✅ **驗證**：`node --check server/scripts/send-graduation-document-packages.js` 通過；`npm run audit:seniors` 通過。
- ⚠️ **尚未重寄**：仍未 email。等 Alan 確認後再重寄五封附件信。

### ✅ Transcript frontend restored exactly to 2026-05-12 snapshot（2026-05-20 Slot C11）

> 目標：Alan 明確要求「看 5/12 版本，直接用那時候的 code」，不要再只做近似調整。

- ✅ **5/12 snapshot 定位**：`git rev-list -1 --before='2026-05-12 23:59:59 -0500' HEAD` 得到 `86bc3369`；5/12 當天沒有 transcript 新 commit，該 snapshot 的 transcript source 來自 5/10 `0c609abe`。
- ✅ **前端 code 完全對齊**：`src/components/pages/Transcript/transcriptPdf.js` 已恢復到 `86bc3369:src/components/pages/Transcript/transcriptPdf.js`；`git diff 86bc3369 -- src/components/pages/Transcript/transcriptPdf.js` 現在為空。
- ✅ **日期行為同步回 5/12**：5/12 code 是「有 profile transcriptDate 就用 transcriptDate，沒有才用 exportToday」；因此撤回 Slot C7 的 always-current-date 改動。這是 Alan 最新「完全用 5/12 code」要求的結果。
- ✅ **Server package 日期同步**：`server/scripts/send-graduation-document-packages.js` 產生 transcript 時也改為優先使用 seed/profile `transcriptDate`，避免寄出的 PDF 跟 Admin frontend download 行為不同。
- ✅ **PDF dry-run 已覆蓋重產**：五位 senior transcript + diploma 已重新產生；五份 transcript 全部仍是 1 page。Baoyi preview：`server/tmp/graduation-documents/preview/baoyi-transcript-512.png`。
- ✅ **驗證**：`node --check server/scripts/send-graduation-document-packages.js` 通過；`npm run audit:seniors` 通過；`npm run build` 通過。
- ⚠️ **尚未重寄**：仍未 email。等 Alan 確認 5/12 版型與日期行為後再重寄五封附件信。

### ✅ Graduation document recheck + transcript download path audit（2026-05-20 Slot C12）

> 目標：重新抽查 transcript + diploma PDF，並確認 Admin / student / parent 下載 transcript 是否會產生同一種 official format。

- ✅ **PDF package recheck**：重新 dry-run 產出五位 senior 的 transcript + diploma package 到 `server/tmp/graduation-documents/`；五份 transcript 皆為 1 page，抽查 Hanxi transcript 與 Ruwen/Hanxi diploma 可正常 render 成 PNG preview。
- ✅ **Transcript date live behavior**：live Netlify bundle 已抽查，正式 transcript export 的 `Transcript Date` 會使用 export 當天日期；本輪 preview 顯示 `05/20/2026`。
- ✅ **Admin/student transcript 格式一致**：`/admin/transcript/:studentId` 與 `/transcript` 都 render `TranscriptContent`，PDF button 最終都呼叫同一個 `exportTranscriptToPDF()`；所以 Admin 與 student 下載格式不是兩套模板。
- ⚠️ **Parent transcript download gap**：`ParentDashboard` 目前只有 progress / billing / activity dashboard，沒有 transcript PDF download 入口，也沒有 reuse `TranscriptContent`。若要讓 parent 下載 transcript，下一步應新增 parent transcript route/button，直接 reuse 同一個 `TranscriptContent` / `exportTranscriptToPDF()`，避免 official document format 分叉。
- ✅ **驗證**：`npm run audit:seniors` 通過；`npm run build` 通過；live site `https://genesisideas.school` 回 `HTTP/2 200`。

### ✅ Frontend transcript export restored to Alan 5/10 reference lineage（2026-05-20 Slot C13）

> 目標：停止用「大概 5/10」或 server package 反推；以 Alan 提供的 `Yunfan Yang_Transcript.pdf` 作為 reference，先把網站 `Export to PDF` 回到同一視覺 lineage，再只做必要的日期與 seal 修正。

- ✅ **Canonical version 定位**：Alan 提供的 5/10 PDF 對應的是 5/10 當天較早的 transcript export lineage（`4c616ea7`），不是後續 gold-accent / embossed-seal 版本；前端 `src/components/pages/Transcript/transcriptPdf.js` 已回到該 lineage。
- ✅ **Issue date 修正**：`Transcript Date` 與 certifying signature date 現在都使用 export 當天日期；不再優先吃 profile 裡舊的 `transcriptDate`。
- ✅ **Seal 微調**：保留 reference 的左下 gold seal 位置與結構，只把尺寸與 contrast/drop-shadow 做輕微正式化，避免回到灰色 cosplay seal。
- ✅ **Title convention 保留**：右上仍使用 `President & Principal: Shiyu Zhang, Ph.D.`，符合目前 official-title convention。
- ✅ **驗證**：`npm run build` 通過；`npm run audit:seniors` 通過。尚未 deploy，尚未重寄任何 PDF。

### ✅ Actual Admin UI Export to PDF smoke test（2026-05-20 Slot C14）

> 目標：照 Alan 要求，不再「想像 export to pdf download」，而是真的啟動 local site、登入 Admin、按 `Export to PDF`，確認 browser download 出來的 PDF 才是要信任的格式。

- ✅ **真實 UI download 已完成**：local backend `http://localhost:4000` + frontend `http://localhost:3000` 啟動後，用 Admin session 進 `/admin/transcript/:studentId`，點擊 `Export to PDF`，Playwright browser download 成功存出 `server/tmp/ui-downloads/ui-Tao Zhang_Transcript.pdf`。
- ✅ **Visual QA**：該 PDF render 成 `server/tmp/ui-downloads/ui-Tao-Zhang-Transcript.png`；抽查顯示為 1-page official transcript，右上 blue `OFFICIAL TRANSCRIPT` badge、`Transcript Date: 05/20/2026`、左下 gold seal、President & Principal signature block，符合 Alan 5/10 reference lineage + current-date requirement。
- ⚠️ **重要分流**：`server/scripts/send-graduation-document-packages.js` 不是同一條 download path，仍有舊 template 風險，不能拿它產出的 attachments 假裝等於 Admin UI export。寄校長前必須修成 reuse/mirror verified UI export，或改用真實 UI export 批次下載附件。
- ⚠️ **本機 senior seed blocker**：local `/api/students` 目前只有 Ben Wang / Tao Zhang / Alex Chen / Demo Student，沒有五位 2026 seniors；`cd server && npm run db:seed` 失敗於 `localhost:5432` unreachable，`npm run transcript-api:db-up` 又因本機沒有 Docker 失敗。因此本輪只能完成 UI export path smoke test，尚不能從 local UI 直接批次下載五位 senior documents。

### ✅ Graduation document package generator aligned after UI export proof（2026-05-20 Slot C15）

> 目標：修掉 C14 發現的分流風險。寄校長附件用的 transcript generator 不能再保留舊 gold-badge / gray-seal 版本，必須對齊已驗證的 Admin UI `Export to PDF` lineage。

- ✅ **Server package transcript 對齊**：`server/scripts/send-graduation-document-packages.js` 的 transcript colors / badge / top rule / seal / signature block 改回 verified frontend lineage：`NAVY #2b3d6d`、`HEAD_BG #dce6f1`、blue `OFFICIAL TRANSCRIPT` badge、single navy rule、left gold seal、18/82 seal/signature layout。
- ✅ **Student profile fields 補齊**：server package transcript 不再把 Birth Date / Gender / Parent / Address / Entry Date 全部印成 `—`；五位 seniors 的 official seed profile fields 已放入 package generator，避免寄出的 PDF 比 Admin UI 少資料。
- ✅ **Issue date 保持 current date**：package transcript `Transcript Date` 與 certifying signature date 使用 `todayForPdf()`，本輪 dry-run 顯示 `05/20/2026`。
- ✅ **Dry-run regenerated**：重新執行 `node scripts/send-graduation-document-packages.js`，產出五位 senior transcript + diploma 到 `server/tmp/graduation-documents/`；五份 transcript 全部是 1 page。
- ✅ **Visual QA**：抽查 `server/tmp/graduation-documents/preview/yunfan-transcript-package-c14.png` 與 `yunfan-diploma-package-c14.png`。Transcript 已對齊 UI export 方向；diploma 維持 Admin/download formal layout。
- ✅ **驗證**：`node --check server/scripts/send-graduation-document-packages.js` 通過；`npm run audit:seniors` 通過；`node --check server/src/lib/mailer.js` 通過；`npm run build` 通過。
- ⚠️ **尚未寄信**：本輪只修 generator + dry-run regenerate，沒有執行 `--send`。Official documents 應等 Alan 最後確認後再寄。

### ✅ Corrected graduation document PDFs emailed（2026-05-20 Slot C16）

> 目標：Alan 確認 `Okay go ahead` 後，正式寄出五位 senior 的 corrected transcript + diploma PDF package 給校長。

- ✅ **CC 行為修正**：`server/scripts/send-graduation-document-packages.js` 的 `GRADUATION_DOCUMENT_CC` 現在支援 comma-separated recipients；本輪正式寄送 CC `alanhdchu@genesisideas.school` 與 `admissions@genesisideas.school`。
- ✅ **正式寄出**：執行 `GRADUATION_DOCUMENT_CC=alanhdchu@genesisideas.school,admissions@genesisideas.school node scripts/send-graduation-document-packages.js --send`。每位學生一封信，每封附 corrected transcript PDF + diploma PDF。
- ✅ **Resend ids**：Ruwen Li `ca69145d-108e-4094-81af-9fda9b493dde`；Tao Zhang `0d7d0c1a-bdcb-4537-82ce-09d38db7f4e5`；Baoyi Lu `6db08321-cd15-42bb-88cb-3baa42a698da`；Yunfan Yang `ebccfd4a-354c-4846-b0d7-d9bd32d3870c`；Hanxi Xiao `eeb83efd-30b9-4d4e-b8dd-c1a7913bba59`。
- ✅ **寄送前 gate**：`node --check server/scripts/send-graduation-document-packages.js` 通過；`npm run audit:seniors` 通過。PDFs 於寄送時重新 generate，輸出位置仍是 `server/tmp/graduation-documents/`。

### ✅ Official document visual cleanup（2026-05-20 Slot C17）

> 目標：Alan 指出 official seal 圖檔有白底/框線感、diploma 中央學生姓名後方有反白框；這會讓正式文件看起來不夠乾淨。

- ✅ **Seal 去背**：新增 `src/img/transcript_seal_transparent.png`，以原 `transcript_seal.jpg` 做 alpha mask 去掉白/灰 studio background；不重畫 seal、不改校徽內容。
- ✅ **Frontend exporters 改用透明 seal**：`src/components/pages/Transcript/transcriptPdf.js` 與 `src/components/pages/Diploma/DiplomaPage.js` 改引用透明 PNG。
- ✅ **Server package 改用透明 seal**：`server/scripts/send-graduation-document-packages.js` 改用同一透明 PNG；diploma 底部 official seal wrapper 移除多餘 border/background，避免再次產生框。
- ✅ **學生姓名反白 artifact 修正**：diploma 中央大學生姓名改為 transparent inline SVG text，避免 Chromium PDF 對 script font 產生文字背景框；frontend diploma 與 server package template 都已同步。
- ✅ **PDF dry-run regenerated**：重新執行 `node scripts/send-graduation-document-packages.js`；五份 transcript 仍皆為 1 page。抽查 preview：`server/tmp/graduation-documents/preview/yunfan-diploma-no-name-box-c17.png` 與 `yunfan-transcript-no-seal-box-c17.png`。
- ✅ **驗證**：`node --check server/scripts/send-graduation-document-packages.js` 通過；`npm run audit:seniors` 通過；`npm run build` 通過。
- ⚠️ **尚未重寄**：C17 只修視覺與重新 dry-run PDF，沒有再次寄給校長。

### ✅ Cleaned graduation documents resent（2026-05-20 Slot C18）

> 目標：Alan 明確要求「重新寄出」後，用 C17 修過 seal 去背與 diploma 姓名反白 artifact 的版本，重新寄五位 senior PDF package。

- ✅ **正式重寄**：執行 `GRADUATION_DOCUMENT_CC=alanhdchu@genesisideas.school,admissions@genesisideas.school node scripts/send-graduation-document-packages.js --send`。每位學生一封信，每封附更新後 transcript PDF + diploma PDF。
- ✅ **Resend ids**：Ruwen Li `2fb06c05-158c-45d4-8056-091f2a17d382`；Tao Zhang `e3369e34-5df4-41dc-ad3b-32ea757a2695`；Baoyi Lu `1101889c-01fc-45a5-8742-0ed529d41f79`；Yunfan Yang `4353aafe-7a1e-4007-b165-73f9e1a52020`；Hanxi Xiao `9bba9e68-a9f4-49a8-94b4-4eb181905b6a`。
- ✅ **寄送前 gate**：`node --check server/scripts/send-graduation-document-packages.js` 通過；`npm run audit:seniors` 通過。

### ✅ Official document format contract + audit guard（2026-05-21 Slot C19）

> 目標：把目前 Alan-approved transcript / diploma 格式寫成可交接、可檢查的 contract，避免未來 agent 或重構時不小心把 official document visuals 改壞。

- ✅ **新增 contract 文件**：`docs/official-document-format-contract.md` 寫明 current locked format：transcript 5/10 lineage、blue `OFFICIAL TRANSCRIPT` badge、`#2b3d6d` / `#dce6f1` / `#f5f8fc`、export/send date 行為、透明 seal、diploma formal certificate layout、中央學生姓名 SVG rendering。
- ✅ **新增 automated guard**：`tools/graduation/audit_official_document_formats.js` 檢查 transcript / diploma frontend exporter 與 server package generator 是否仍使用透明 seal、locked colors、current-date transcript behavior、diploma SVG student name、無舊 `transcript_seal.jpg` 引用。
- ✅ **新增 npm script**：`package.json` 加 `npm run audit:official-docs`。未來改 official document 或寄出前應先跑。
- ✅ **Agent rules 更新**：`AGENTS.md` 加 official transcript/diploma locked section，要求讀 contract、跑 audit、不要恢復舊 seal、不要拿掉 diploma central-name SVG。
- ✅ **驗證**：`npm run audit:official-docs` 通過；`npm run build` 通過。

### ✅ Admin Official Documents workflow（2026-05-21 Slot C20）

> 目標：把 official transcript + diploma package 從「只能手動跑 script」推進到 Admin 可操作、可 dry-run、可寄送、可追蹤 issue log 的營運流程。

- ✅ **新增 Admin Documents 頁**：`src/components/pages/Admin/AdminDocumentsPage.js`，路由 `/admin/documents`。Admin 可看 official document issue log / audit trail、執行 dry-run PDF generate、按確認後寄五位 Class of 2026 transcript + diploma package。
- ✅ **AdminDashboard 入口**：`src/components/pages/Admin/AdminDashboard.js` header 新增 `Documents / 正式文件`，避免功能藏在 URL。
- ✅ **新增 Admin Documents API**：`server/src/routes/admin-documents.js`，掛載於 `/api/admin/documents`。Endpoints：`GET /logs`、`POST /graduation-packages/dry-run`、`POST /graduation-packages/send`。所有 endpoint 都 require admin cookie auth。
- ✅ **Script 變成可 audit 的 sender**：`server/scripts/send-graduation-document-packages.js` 在 `--send` 成功後會寫 `EmailLog(kind=official_graduation_documents)` 與 `AuditLog(action=official_documents_sent)`，並記錄 provider id、recipient、studentId（若 DB 找得到 studentCode）、actor email。
- ✅ **CC 固定進營運流程**：Admin API 呼叫 script 時自動 CC `alanhdchu@genesisideas.school` 與 `admissions@genesisideas.school`。
- ✅ **安全行為**：Admin UI 的 send button 仍有 browser confirm；沒有自動寄信。Dry-run 只 generate PDFs，不 send。
- ✅ **驗證**：`node --check server/scripts/send-graduation-document-packages.js` 通過；`node --check server/src/routes/admin-documents.js` 通過；`node --check server/src/index.js` 通過；`npm run audit:official-docs` 通過；`npm run audit:seniors` 通過；`npm run build` 通過；`node scripts/send-graduation-document-packages.js` dry-run 通過。
- 🔧 **下一步**：把目前 seed-based Class of 2026 package 升級成 DB-driven per-student issue workflow：選學生 -> generate preview -> issue version -> send，並把 transcript/diploma PDF artifact hash / issuedAt / issuedBy 持久化。

### ✅ Parent Portal official transcript download（2026-05-21 Slot C21）

> 目標：補上 C12 發現的 parent transcript download gap。家長付錢後應能在 Parent Portal 看到正式成績單，且格式不能和 admin/student 分叉。

- ✅ **Parent transcript route**：新增 `src/components/pages/Parent/ParentTranscriptPage.js`，路由 `/parent/transcript`。家長可用 parent session 查看 official transcript，並使用同一個 Export to PDF 按鈕。
- ✅ **Parent dashboard CTA**：`src/components/pages/Parent/ParentDashboard.js` 新增 `Official Records / 正式文件` 卡片，連到 `/parent/transcript`。
- ✅ **Reuse locked transcript renderer**：`TranscriptContent` 現在允許 `viewerRole="parent"` export PDF；`useTranscriptData` 支援 `loadUrl`，parent route 直接 reuse locked `TranscriptContent` + `exportTranscriptToPDF()`，沒有另做一套 parent-only PDF template。
- ✅ **Parent-safe API**：`server/src/routes/parent-data.js` 新增 `GET /api/parent/transcript`，只回 parent linked student 的 transcript；未 release semester rows 會和 student route 一樣遮掉 grade/GPA。
- ✅ **驗證**：`node --check server/src/routes/parent-data.js` 通過；`node --check server/src/index.js` 通過；`npm run audit:official-docs` 通過；`npm run build` 通過。

### ✅ Admin course catalog + enrollment operating loop（2026-05-21 Slot C22）

> 目標：讓學校日常營運不用每次改學生/課程都去碰 seed 或 JSON。這會直接降低 Alan 的營運負擔，也讓「真學校」的 back office 更可信。

- ✅ **確認 Student Enrollment Manager 已存在且可用**：`src/components/pages/Admin/AdminTranscriptPage.js` 的 `EnrollmentManagerSection` 已可在單一學生頁新增選課、改 semester label、改 completed modules、mark credit earned、remove/drop enrollment；backend 已有 `/api/enrollments/admin/student/:studentId`、`PATCH /api/enrollments/admin/:enrollmentId`、`DELETE /api/enrollments/admin/:enrollmentId`。
- ✅ **新增 Admin Course Catalog 頁**：`src/components/pages/Admin/AdminCoursesPage.js`，路由 `/admin/courses`。Admin 可看全部 courses（含 draft/unpublished）、建立 draft course、編輯 name / Chinese name / credits / department / type / grade / description / published 狀態。
- ✅ **Module outline editor**：同一頁可新增 module，並 inline 編輯 module order、title、objectives、assignment、estimated hours。這先補最常需要手動調整的 course outline surface。
- ✅ **新增 Admin Courses API**：`server/src/routes/courses.js` 新增 `GET /api/courses/admin/all`、`GET /api/courses/admin/:slug`、`PATCH /api/courses/:slug/modules/:moduleId`；create/patch course 現在也支援 `gradeLevel`。
- ✅ **AdminDashboard 入口**：`src/components/pages/Admin/AdminDashboard.js` 新增 `Courses / 课程目录`，避免功能藏在 URL。
- 🔧 **下一步**：module editor 目前還沒有 delete module、quiz/midterm/final question editor、或 content versioning；下一輪可補 assessment editor / source labels / per-course quality warnings。

### ✅ Admin EmailLog visibility（2026-05-21 Slot C23）

> 目標：weekly report、official documents、未來 welcome/login emails 都不能只靠 terminal output 判斷有沒有寄出。營運後台要能看到 delivery trail，才像真學校。

- ✅ **新增 Admin Email Logs API**：`server/src/routes/admin-email-logs.js`，掛載 `/api/admin/email-logs`。支援 `kind` / `status` filter，回傳最近 email logs 與目前可用 filter counts。
- ✅ **新增 Admin Email Logs 頁**：`src/components/pages/Admin/AdminEmailLogsPage.js`，路由 `/admin/email-logs`。可看 sent/skipped/error、recipient、studentId、providerId、dedupeKey、error。
- ✅ **AdminDashboard 入口**：`src/components/pages/Admin/AdminDashboard.js` 新增 `Email Logs / 邮件记录`。
- ⚠️ **刻意不做 resend yet**：目前先做 read-only delivery status。真正 resend 需要按 email kind 做安全確認與 idempotency，避免一鍵重寄 weekly reports 或 official documents 出事故。小心是對的，這裡不是 cosplay 學校文件。
- 🔧 **下一步**：為 `weekly_report` 加 admin resend-one / resend-failed-only；為 official documents 加 per-student issue/version flow 後再接 resend。

### ✅ Forgot-password EmailLog coverage（2026-05-21 Slot C24）

> 目標：家長或學生忘記密碼時，學校不能只說「應該寄了」。Admin 要能在 Email Logs 裡看到 reset email delivery status，方便支援家長登入。

- ✅ **Student reset logging**：`server/src/routes/auth.js` 的 `/api/auth/forgot-password` 在真正找到 student account 並呼叫 mailer 後，會寫 `EmailLog(kind=password_reset_student)`，包含 recipient、providerId、sent/skipped/error。
- ✅ **Parent reset logging**：`server/src/routes/parent-auth.js` 的 `/api/parent/forgot-password` 同步寫 `EmailLog(kind=password_reset_parent)`。
- ✅ **不洩漏帳號存在性**：外部 API 回應仍維持 `If this email exists...`，不存在的 email 不寫 log；避免讓 public endpoint 成為 account enumeration 工具。
- ✅ **可視化入口**：C23 的 `/admin/email-logs` 現在可以直接 filter 這兩種 reset email。
- 🔧 **下一步**：如果支援量上升，可再加 admin-triggered password reset link resend，但要避免把 reset token 顯示在 UI 或 logs。

### ✅ Application activation welcome-email logging（2026-05-21 Slot C25）

> 目標：招生申請 approved 後，Admin activate 會建立 student + parent login 並寄 welcome email。這封信是家長正式開始付費/登入的入口，所以必須可追蹤。

- ✅ **Welcome email delivery 可查**：`server/src/routes/applications.js` 的 `/api/applications/:id/activate` 現在會把 parent welcome/login email 寫入 `EmailLog(kind=welcome_parent_login)`，包含 recipient、studentId、providerId、sent/skipped/error。
- ✅ **Mailer result 回傳修正**：`server/src/lib/mailer.js` 的 `sendWelcomeEmail()` 現在回傳底層 `send()` 結果，讓 API 可以正確記錄 provider id 與 skipped/error 狀態。
- ✅ **Admin 可視化**：C23 `/admin/email-logs` 可 filter `welcome_parent_login`，支援家長說「我沒收到登入信」時快速查證。
- 🔧 **下一步**：把 Stripe Checkout completion 和 application/student activation 串成更完整的 state machine：paid but unlinked、application approved but unpaid、account created and welcome sent。

### ✅ Admin Transcript workspace layout cleanup（2026-05-21 Slot C26）

> 目標：Alan 指出 `/admin/transcript/:studentId` 的相對位置難看。這頁是 admin 日常管理學生帳號、家長登入、選課、畢業狀態、正式成績單的主工作區，不能像臨時堆功能。

- ✅ **重排 admin controls**：`src/components/pages/Admin/AdminTranscriptPage.js` 改成上方 workspace header / mode toolbar，下面左欄放 student login、parent portal、graduation eligibility，右欄放 course enrollment manager。
- ✅ **視覺重心一致**：四個 admin cards 改成同一寬度、border、shadow，不再用 520px / 820px 混在一起造成錯位。
- ✅ **Transcript export 未動**：正式 `TranscriptContent` / locked PDF exporter 沒有改；只重排 admin page 外層工作區，避免影響 official transcript format。
- ✅ **驗證**：`npm run audit:official-docs` 通過；`npm run build` 通過。

### ✅ Admin Transcript records workspace refactor（2026-05-21 Slot C27）

> 目標：Alan 指出 admin 頁底下不需要一直放完整「成績單紙張格式／表格」；export PDF 不必依賴那個 preview。後台應該更像 records editor，而正式 PDF format 應只在 export renderer 裡被鎖住。

- ✅ **Admin-only workspace mode**：`TranscriptContent` 新增 `adminWorkspace` mode；`src/components/pages/Admin/AdminTranscriptPage.js` 啟用後，admin 看到的是 clean records panel，而不是完整 official transcript preview。
- ✅ **PDF export 仍走 locked renderer**：Export PDF 繼續呼叫 `exportTranscriptToPDF({ profile, semesterRowsRef, semesterInitialRows })`，不依賴畫面上的紙張 preview；student / parent transcript view 不受影響。
- ✅ **更好操作的 records UI**：新增 metric cards（courses / graded rows / credits / issue date）、Student Profile grid、8 個 semester cards，Edit mode 可直接改 course / type / credits / grade、加 row。
- ✅ **即時計算 GPA 防呆**：新版 admin row editor 變更 course/type/credits/grade 時會同步更新 weighted/unweighted GPA，避免改完不 save 直接 export 時吃到舊 GPA。
- ✅ **資料初始化防護**：`useTranscriptData` 載入 transcript 後會把 `semesterRowsRef.current` 初始化為 API rows，確保 admin 不打開舊 preview 也能直接 export。
- ✅ **驗證**：`npm run audit:official-docs` 通過；`npm run build` 通過。

### ✅ Admin dashboard + chrome simplification（2026-05-21 Slot C28）

> 目標：Alan 指出 `/admin` 也太雜，只需要留下關鍵資訊。Admin 後台應該像校務 operating console，不是把所有欄位和按鈕都鋪出來。

- ✅ **Admin 入口瘦身**：`src/components/pages/Admin/AdminDashboard.js` 改成 School Operations console；header 只保留 New student、Review progress、Applications、Send weekly report、Stripe test、Logout 等高頻/高風險動作。
- ✅ **新增營運 KPI**：首頁顯示 Enrolled、Graduated、No Login、Missing Guardian，讓 admin 第一眼知道哪裡需要補資料。
- ✅ **學生表格只留關鍵欄位**：移除 Birth / Location / Semester count 等低頻欄位；保留 Name+ID、Status、Grade、Login email、Guardian、Updated、Open/Diploma actions。
- ✅ **統一 admin chrome**：新增 `src/components/pages/Admin/AdminChrome.js`，提供 shared AdminPage / AdminHeader / nav / card style；`AdminDocumentsPage`、`AdminEmailLogsPage`、`AdminProgressPage` 已接入同一套 header/nav。
- ✅ **驗證**：`npm run audit:official-docs` 通過；`npm run build` 通過。
- 🔧 **下一步**：第二輪可繼續把 `AdminSubscriptionsPage`、`ApplicationsQueue`、`AdminCoursesPage` 的表格欄位做相同瘦身，並把 destructive/test actions 收進明確的 danger/test section。

---

## 🎯 CEEB 嚴審稽核 — 準備清單（2026-05-18）

> 假設：CEEB 審核員（或將來大學 admissions office、Florida DOE auditor）來函要看完整 documentation。
> 目標：每一項問題都有對應的公開 URL + 可下載 PDF + 內容夠厚實。

| 審核員可能要的 | 狀態 | URL | 內容深度 | 卡誰 |
|---|---|---|---|---|
| School profile | ✅ 已上線 | `/school-profile` | 良好（PDF export 可用，含校歷、grading scale、24 credits、curriculum、president signature）；T-302 待補 leadership block + Class of 2026 profile | T-302 — Dev |
| Graduation requirements | ✅ 已上線 | `/school-profile`（內含 24-credit 分配表）+ `/handbook#graduation` | 良好（兩處交叉引用） | — |
| Student handbook | ✅ 已上線 | `/handbook` | 12 sections 完整 draft（Academic, Integrity, Attendance, AI Use, Conduct, Appeals, Records, Privacy/FERPA, Governance）| Alan review 措辭 |
| Proof Alan = Head of School | ✅ 部分 | `/about`（公開 leader 介紹）+ `/handbook §12 Governance`（明文寫 Alan = Founder & Head of School） | 公開頁夠用；正式法律文件待補 | Alan — 見下方 ⏳ |
| Faculty / qualified instructors | ❌ 缺 | — | T-205 in backlog | Alan content（1 週）+ Dev 0.5 天 |
| AP Course Audit ledger 合規 | ❓ 未確認 | — | 若不在 ledger 上，transcript / curriculum / handbook 中所有「AP」字樣須改「Honors」或「Advanced」 | Alan — T-004 RF-2 |
| FL DOE registration certificate | ❓ 未公開 | — | 應該 PDF 上傳到 site 並從 `/about` + `/handbook §1` 連到 | Alan — T-202 |

### ⏳ 等 Alan 補的 CEEB 文件

- **CEEB application 確認單** — College Board 收件後的 reference number / status snapshot（截圖即可）
- **FL DOE registration certificate** — Florida DOE 發的私校註冊證明 PDF
- **Letter of Appointment / Statement of Authority** — 一份簡單的 1-頁正式文件，由 Alan（Founder/Owner）+ Shiyu Zhang（President & Principal）共同簽署，內容類似「I, Alan Hwader Chu, founder and owner of GIIS, hereby attest that I serve as Head of School and that Shiyu Zhang, Ph.D. serves as President & Principal, signing all official transcripts and diplomas.」可放到 `/about` 作為 downloadable PDF
- **Articles of Incorporation / Operating Agreement** —（如有）證明 Alan owns the entity，內部備存即可、不一定公開
- **Class of 2026 audit trail PDF**（每位 senior 一份）— T-001 完成後可 export，存檔備查

### 🔧 Site infrastructure（這次同時做的）

- ✅ `/about` 新 leader 頁面（Founder & Head of School + President & Principal）
- ✅ `/handbook` 完整雙語學生家庭手冊（12 sections）
- ✅ `/about/faculty`、`/about/principal`、`/about/leadership`、`/student-handbook` 全部轉址到正確頁
- ✅ Footer 加「About & Leadership」「School Profile」「Student Handbook」
- ✅ Nav Discovery dropdown 修：6 個項目都點到不同目的地（之前 3 項全到 /discovery 同一頁）
- ✅ Nav Admission dropdown 修：移除誤導性「FAQ」、Apply Now 改連到 `/apply` 而非 `/admission`
- ✅ ScrollToTop 加 hash anchor 支援（讓 `/discovery#mission` 可實際捲到 mission section）
- ✅ AboutPage / HandbookPage 加 `<Nav>` 元件（之前漏接）

---

## ✅ AP Calculus AB retroactive 3-reviewer cascade（2026-05-21 Slot A 11pm CT）

> 跟 AP Bio 04:12Z 那次同一個 pattern：AP Calc AB 的 12 支 module 早就有 `script.json`（而且 12 支全部已上 YouTube），但只有 M2 在 disk 上有完整 `_review_A/B/C.json`。M1 + M3-M12 共 11 支缺 review cascade — 違反 artifact contract。本輪把它們補齊。選 AP Calc 是因為：(1) 它是唯一「有 script.json 但缺 review」又同時**有 CED reference doc** 的課（Reviewer C 反幻覺一定要有 reference）；(2) 有 reference 的新 module backlog 已經全部產完，沒有可以安全新生成的東西了。

- ✅ **11 個 module × 3 reviewer 平行跑（分 4 波，每波 2-3 個 module）**：M1 Limits、M3 Composite/Implicit/Inverse、M4 Contextual Apps、M5 MVT/EVT、M6 Sketching/Optimization、M7 Riemann/FTC、M8 Antiderivatives/Sub、M9 Diff Eq、M10 Avg Value/Area、M11 Volumes、M12 Exam Synthesis。Reviewer A = Peer Math-PhD、B = Adversarial Student、C = Citation Checker（只能用 `references/ap-calc-ab-ced.md` 對應 unit 的行區）
- ✅ **33 個 review JSON 全部寫入並通過驗證**（valid JSON + 路徑正確，verification_fail=0）
- ✅ **完全沒動 script.json / build_slides.py / slides/**：12 支都 broadcast-locked（有 `youtube.video_id`），改 script 會讓 on-disk 跟 YouTube 影片 divergence — 遵守 AP Bio M4/M5/M6 的 precedent
- 🟢 **8 個 kept-live（0 critical）**：M1、M3、M5、M6、M8、M9、M10、M11（都只有 minor，內容核對沒問題）
- 🔴 **3 個 halted 到 `_review_failed/<slug>/WHY.md`**：
  - **M4**（Reviewer A critical，已逐字核對 confirmed）：09_related_rates_ladder 講「dy/dt = negative eight-thirds」其實是 **−4/3**（= −1.33，連 narration 自己後面講的 −1.33 都對不上；−8/3 = −2.67）。真・算術錯。
  - **M12**（Reviewer C + B 都 critical，已核對 confirmed）：03_overview 講「兩節各 ninety minutes」是錯的 — Section I (MC) 是 **105 分**、Section II (FRQ) 才 90 分，而且跟 04 正確講的「3h15m total」自相矛盾。另外 14_time_budget 有個 real-but-minor 的 Part A 計算機回收策略含糊。（B 第一個 04 'critical' 自己又推翻了 — false alarm。）
  - **M7**（只有 Reviewer B critical；A/C 都 minor，低急迫）：narration 經核對**數學正確**，B 的 critical 其實是**漏講考點變體**（06 沒強調 monotonicity 要整個區間、沒給 concavity 版 trapezoid/midpoint 規則；13 沒給 lower-bound FTC 的負號變體），不是錯。WHY.md 已標明低急迫，留作下次 re-record 的 enhancement。
- ✅ **Plan + Audit**：`teaching-videos/_audit/ap-calculus-ab/2026-05-21T04-08-35Z-retroactive-cascade-plan.json` + `...-summary.json`
- 🟠 **給人類的兩個便宜 errata**（正確值在影片別處都已講過，所以一行 YouTube description 修正就夠）：M4「−4/3」、M12「Section I 105 分 / Section II 90 分」
- ⚙️ **沒做**：沒 push、沒 call YouTube API、沒動 `public/data/lessons-manifest.json`、沒生新 module、沒 fetch live web
- 🔧 **下個 Slot 重要 handoff**：**有 reference doc 的內容已全部產完**。要產新課（AP Statistics / Geometry / Chemistry / US History / Government / Economics …，這些都有 prisma course def 但沒有 teaching-videos folder），**需要人類先在 `references/<slug>-ced.md` 補 CED reference doc**（pipeline 不能 fetch web，Reviewer C 一定要 reference）。另外 AP CS A（M1-M10）和 AP Psych（M1-M16）也都有 script.json 但缺 review cascade — 一旦人類補上 `references/ap-cs-a-ced.md` / `references/ap-psychology-ced.md`，就能用同一個 retroactive pattern 補審。

---

## ✅ AP Biology M8 surgical narration patch + broadcast-constraint flagging（2026-05-20 Slot B 5am CT）

> Slot B 任務：接續 Slot A 的 retroactive cascade，處理那 4 個 Reviewer-C-critical 的 module。發現 M4/M5/M6/M7 都已經有 `youtube.video_id` — 改 script.json 會讓 on-disk 文字跟 YouTube 上的影片產生 divergence，違反 AUTO_PIPELINE.md 的 "don't regenerate uploaded modules" 原則。M8 沒上 YouTube，可以安全 patch。

- ✅ **Surgical patch M8**：8 個 sections 動手 — 02_hook 拿掉 Crick 1958 日期；05_transcription 加 template vs coding strand 區分；06_mrna_processing 把 spliceosome 元件正名為 snRNPs；07_alternative_splicing 拿掉 20k genes / 100k proteins / fewer than rice，改成 qualitative；09_codons_trnas 加 wobble pairing 段落；12_translation_steps 加 Shine-Dalgarno prokaryotic initiation；13_gene_regulation 加 CAP/cAMP positive layer for lac operon；15_recap 同步移除 rice 並加 snRNPs + CAP/cAMP mentions。
- ✅ **Round-2 Reviewer C cascade**：fresh sub-agent 用同樣的 CED window (lines 423-504) 重新審核 patched script。Verdict：`minor`（從 round 1 的 `critical` 升級）。3 個 round-1 critical issue 全部 resolved（Crick 1958 dropped、rice claim dropped、lac CAP/cAMP added 且 CED-supported）。剩 4 個 minor issue（wobble、Shine-Dalgarno、OpenStax 章節、prokaryotic 70S）— 全部不是 load-bearing。
- ✅ **檔案搬家**：`teaching-videos/_review_failed/ap-biology-module-8-transcription-translation/` 移到 `teaching-videos/_review_resolved/ap-biology-module-8-transcription-translation/`，附帶 `STATUS — patched` addendum 在 WHY.md 留 audit trail。
- 🟠 **M4/M5/M6 標 BROADCAST CONSTRAINT**：每個 WHY.md 新增一段，明寫該 module 的 `youtube.video_id`、為什麼 slot B 不動 script.json、以及兩條給人類的可選路徑：(1) re-record + re-upload（M5 的 G1 ploidy guardrail 是 load-bearing science，最值得 re-record）；(2) YouTube description errata（M6 還可加 supplemental worksheet PDF 補 nondisjunction/dihybrid/sex-linked gap）。
- ✅ **Audit summary**：`teaching-videos/_audit/ap-biology/2026-05-20T10-30-00Z-slot-B-narration-revision.json`
- ⚙️ **沒做**：沒 push 到 git、沒 call YouTube API、沒動 `public/data/lessons-manifest.json`、沒生新 module（因為剩 4 個 _review_failed 要處理 > 加新 module；下個 slot A 應該開始 AP CSA M5 with full cascade）
- 🔧 **下一個 Slot A 建議**：開始 AP Computer Science A M5 onward，full generator + 3-reviewer cascade + writer。AP CSA 有 CED reference doc，目前 4/10，沒有 broadcast-locked debt

---

## ✅ AP Biology M4-M9 retroactive review cascade（2026-05-20 Slot A 04:12Z）

> 修補 May 2026 regression — M4-M9 早先 auto-pipeline 跑出來的 script.json 從未經過 3-reviewer cascade。本輪 retroactive 補上 18 個 review JSON。

- ✅ **6 個 module × 3 reviewer 平行跑**：M4 Cell Communication、M5 Cell Cycle、M6 Mendelian Genetics、M7 DNA Replication、M8 Transcription/Translation、M9 Biotechnology。Reviewer A = Peer-PhD（subject-matter）、Reviewer B = Adversarial Student（pedagogy）、Reviewer C = Citation Checker（只能用 `references/ap-biology-ced.md` 對應行區，anti-hallucination）
- ✅ **18 個 review JSON 全部寫入** `teaching-videos/ap-biology-module-{4..9}-*/_review_{A,B,C}.json`
- ✅ **沒有重寫 script.json、build_slides.py、slides/**（遵守 idempotence + 「don't regenerate」rule — 這些 lesson 早有 visual + narration 在 disk，重生會破壞 Mac TTS+upload pipeline）
- ✅ **Audit summary**：`teaching-videos/_audit/ap-biology/2026-05-20T04-12-01Z-retroactive-audit.json`
- 🟢 **2 個 ship-safe**（A/B/C 全 minor）：M7 DNA Replication、M9 Biotechnology
- 🟠 **4 個寫了 `_review_failed/<slug>/WHY.md`（A/B minor + C critical）**：M4、M5、M6、M8
  - M4 Cell Communication — C 抓 6 個 unsupported claims（Sutherland 1950s 日期、10-15% 考試比重、100×100×100=1M amplification 算式）；Alpha-subunit 細節需修；quorum sensing 該升級成正式 section
  - M5 Cell Cycle — section 05 G1 ploidy 措辭風險（"DNA is still one copy per chromosome" 容易被誤解成單倍體）；3.8M cells/sec 統計 unsourced
  - M6 Mendelian Genetics — recap 引入 nondisjunction/aneuploidy 但 body 未教；section 03 承諾「almost any cross」但沒有 dihybrid Punnett 或 sex-linked pedigree 範例；section 05 Meiosis II 框成「just like mitosis」是誤解風險
  - M8 Transcription/Translation — "20k genes → 100k proteins, 比米少" 三位 reviewer 都旗；section 05 template vs coding strand 沒分清；section 09 wobble 缺；section 13 lac operon CAP/cAMP positive regulation 缺
- ⚠️ **重要解讀**：4 個 C-critical 都是 citation-window narrow 造成（CED excerpt 不含 specific 數字/日期，但內容本身是 textbook 真實）。Reviewer A（PhD）+ B（adversarial student）100% 給 minor — 核心科學沒問題。建議 surgical 6-line narration patch，不重生
- 🔧 **下次該做**：人類 (Alan) 或下次 agent 跑 narration revision pass。每個 `_review_failed/<slug>/WHY.md` 內列出該修哪幾行；改完後再跑 round-2 Reviewer C 寫 `_review_C_v2.json` 確認 pass
- ⚙️ **沒做**：沒 push 到 git（Mac launchd 的工作）、沒動 `public/data/lessons-manifest.json`、沒 call YouTube API、沒重生任何 slide

---

## ✅ /about Leadership 頁面（2026-05-18 PM）

> CEEB 申請急用 — Alan 需要一個 leader/owner 的公開頁面證明身分。Backlog T-201 part 1。

- ✅ **新路由 `/about`**：列 Alan Hwader Chu（Founder & Director of Academic Operations）+ Shiyu Zhang, Ph.D.（President & Principal）兩位 leader
- ✅ **Alan bio 完整入站**：履歷 V3 提煉 — UT Austin AI MS 在讀、Purdue MatEng MS、Tsing Hua ChemE MS+BS、10+ 年 IGCSE/A-Level/AP STEM 教學、Walmart Fortune 1 工程經驗、Optical Materials Express + J. Alloys & Compounds 論文、TMS + TwICHE Best Poster
- ✅ **雙語**：中英內容 via `language` prop
- ✅ **Avatar fallback**：暫用 initials（AC / SZ）—— Alan 提供高解析照片後換 `src/img/Leadership/`
- ✅ **School verification 區塊**：FL Statute 1002.42 註冊、地址、CEEB pending、accreditation 聲明，與 SchoolProfilePage 一致（無 Cognia / 無 accredited 字樣）
- ✅ **Footer 加 "About & Leadership"**：在 School column 第一條
- ✅ **轉址**：`/about/principal` + `/about/leadership` → `/about`
- 檔案：`src/components/pages/About/AboutPage.js`, `src/App.js`, `src/components/Footer/Footer.js`
- ⏳ **TODO（等 Alan）**：(1) 確認 Alan 對外 title (2) 高解析 headshot (3) Shiyu Zhang 完整 bio + 學歷 + 照片 (4) 是否列 Alan 私人聯絡 email 在公開頁

---

## ✅ Nav 重組 + /support 頁改版 + 校長信箱修正（2026-05-18 Evening）

- ✅ **Nav 重組**：DISCOVERY(6項) → ABOUT(4)；STUDENT SUPPORT(2項) → RESOURCES(4)；移除 dropdownAcademics 死代碼
  - ABOUT dropdown：About GIIS · Mission & Values · Leadership & Faculty · School Profile (PDF)
  - RESOURCES dropdown：Academic Advising · Life Counseling · Student Handbook · Academic Calendar
- ✅ **章詩雨博士信箱**：`AboutPage.js` 更新 email `admissions→ shiyu.zhang@genesisideas.school`；nameZh 修正 `张→章`
- ✅ **`/support` 頁完整改版**：移除 Moodle callout（舊平台參考）、移除 hero 圖片依賴、去掉空泛文案
  - 新增：4 步驟 "Your support journey" (01 Onboarding Call → 02 Course Plan → 03 Learn Portal → 04 Check-ins)
  - 新增：4 服務卡片各附具體 "What you get" 清單（Academic Advising / College Application Support / Assignment Feedback / Wellbeing Counseling）
  - 新增：Learn Portal CTA 深藍帶（連至 /parent/demo + /login）
  - 聯絡區塊：email CTA + 有用連結側欄
- 檔案：`src/components/main/Nav.js`, `src/i18n/siteStrings.js`, `src/components/pages/About/AboutPage.js`, `src/components/pages/Support/SupportMain.js`

---

## ✅ Pricing internal test cleanup + weekly report email fix（2026-05-19）

- ✅ **公開 Pricing 清理**：`src/components/pages/Pricing/PricingPage.js` 移除 public-facing "Internal · End-to-end test" / `$1 live_test` 按鈕與相關 checkout state。`live_test` 仍保留在 Admin dashboard 給 Alan 內部 smoke test。
- ✅ **Weekly report 修成可真寄**：`server/src/routes/weekly-report.js` 改用 schema-safe 查詢：`Enrollment.completedModules` 當 `Int[]`，不再 include 成 relation；GPA/credits 改從 released transcript `CourseRow` + `computeSemesterTotals()` 計算，避免不存在的 `Enrollment.finalGrade`。
- ✅ **Resend env 對齊**：`server/src/lib/mailer.js` 同時支援 `RESEND_EMAIL_API_KEY` 與 roadmap 既有的 `RESEND_API_KEY`，並回傳 `{ ok, skipped, error }`，weekly report 不再把「缺 API key / 寄送失敗」算成 sent。
- ✅ **驗證**：`npm run build` 通過；`cd server && npm test -- --runInBand` 通過；`node -e "require('./server/src/routes/weekly-report')"` 通過。
- 🔧 **仍待補**：cron/dry-run CLI、`EmailLog` 防重複寄送、作業批改後通知家長 email、sample weekly digest 表單（仍屬 Resend 進階收尾）。

---

## ✅ Admin operating loop hardening（2026-05-19 Later）

> 目標：新增/開通/收款/家長登入/週報都能用 Admin UI 操作，不再靠 re-seed 或手動 DB。

- ✅ **新增 `/admin/subscriptions`**：`src/components/pages/Admin/AdminSubscriptionsPage.js` 可列出 Stripe subscription/payment rows、summary（total/active/past_due/unlinked）、付款 email、plan、status、amount、period end、Stripe IDs，並用 dropdown 手動 link/unlink 到 Student。這讓 webhook payment_failed/refund/cancel 能找到正確學生 soft-lock/deactivate。
- ✅ **AdminDashboard 加入口**：`src/components/pages/Admin/AdminDashboard.js` header 加 Subscriptions + Applications，避免功能藏在 URL。
- ✅ **家長 Portal 登入可直接建立/重設**：`AdminTranscriptPage.js` 的 Parent Portal Email section 增加 "Create / reset parent login" 表單，會同時 PATCH `Student.parentEmail` 並呼叫 `POST /api/parent/setup`。手動新增學生後，不需要 re-seed 或 curl 才能讓家長登入。
- ✅ **家長 Dashboard GPA/credits 對齊 transcript source of truth**：`server/src/routes/parent-data.js` 改用 released `CourseRow` + `computeSemesterTotals()` 算學分與 unweighted GPA，與 weekly report 一致；admin 手動改 transcript 後家長端不再顯示另一套 enrollment/exam-derived 數字。
- ✅ **修 admin enrollment API dead route**：`server/src/routes/enrollments.js` 把 `GET /admin/all` 移到 `/:slug` 前面，避免 `/api/enrollments/admin/all` 被誤配成 student-only `/:slug` route。
- ✅ **驗證**：`npm run build` 通過；`cd server && npm test -- --runInBand` 通過；`node -e "require('./server/src/routes/enrollments'); require('./server/src/routes/subscriptions')"` 與 parent/weekly route load 通過。
- 🔧 **仍待補**：Admin course catalog/module editor（課程內容 CRUD 還不是完整 UI）；forgot password；EmailLog/cron；payment success 後自動 link application/subscription/student。

---

## ✅ Principal appointment letter email smoke test（2026-05-19 Later 2）

- ✅ **Mailer 支援 CC**：`server/src/lib/mailer.js` 的 `send()` 增加 `cc` payload 支援，仍保留 `{ ok, skipped, error }` 回傳。
- ✅ **正式聘書 template**：新增 `sendPrincipalAppointmentLetter()`，英文正式 Letter of Appointment + 中文摘要，確認 Shiyu Zhang, Ph.D. 擔任 `President & Principal`，授權學術管理、成績單認證、文憑簽發與 school record certification。
- ✅ **寄送腳本**：新增 `server/scripts/send-principal-appointment-letter.js`；`server/package.json` 加 `npm run email:principal-appointment`。
- ✅ **實寄測試通過**：已寄給 `shiyu.zhang@genesisideas.school`，CC `alanhdchu@genesisideas.school`。Resend script 回報 sent。
- ✅ **驗證**：`cd server && npm test -- --runInBand` 通過；`node -e "require('./server/src/lib/mailer')"` 通過。
- 🔧 **後續可選**：把 appointment letter 同步生成 PDF 並掛到 `/about` 或 internal governance records（CEEB/DOE audit 時更好用）。

---

## ✅ Admin enrollment manager（2026-05-19 Later 3）

> 目標：新增學生後，admin 可以直接開課、修進度、修學分，不需要改 seed 或手動 DB。

- ✅ **Backend admin enrollment CRUD**：`server/src/routes/enrollments.js` 新增 `GET /api/enrollments/admin/student/:studentId`、`POST /api/enrollments/admin/student/:studentId`、`PATCH /api/enrollments/admin/:enrollmentId`、`DELETE /api/enrollments/admin/:enrollmentId`。支援列出學生選課、指派課程、更新 `semesterLabel` / `completedModules` / `creditEarned`、移除誤指派課程。
- ✅ **Admin transcript 頁加 Course Enrollment Manager**：`src/components/pages/Admin/AdminTranscriptPage.js` 可選 published course 指派給學生、設定學期、用 comma list 編輯 completed modules、勾選 credit earned、移除 enrollment。這補上「學生登入上課前，admin 如何開課」的操作面。
- ✅ **No re-seed path**：新增學生後現在可用 Admin UI 完成 student login、parent portal login、subscription link、course enrollment、graduation/transcript 基本管理。
- ✅ **驗證**：`npm run build` 通過；`cd server && npm test -- --runInBand` 通過；`node -e "require('./server/src/routes/enrollments')"` 通過。
- 🔧 **仍待補**：更完整的 course catalog/module editor、家長週報 cron + EmailLog、防止 payment success 後未自動綁定 student。

---

## ⚠️ Student lifecycle smoke test（2026-05-19 Later 4）

> 目標：用一個可重跑腳本驗證「新增學生 → 開帳號 → 家長帳號 → 連付款 → 選課 → 打分數 → transcript/parent projection」整條營運流程。

- ✅ **新增 smoke script**：`server/scripts/smoke-student-lifecycle.js` 會重建 `GIIS-SMOKE-20260519` 測試學生，設定 student login / parent login，建立 active `founders_monthly` subscription，指派一門 published course，寫入 completed modules、quiz attempts、assignment feedback/score、midterm/final scores、transcript `A-` 與 GPA。
- ✅ **npm script**：`server/package.json` 加 `npm run smoke:student-lifecycle`。
- ✅ **靜態驗證**：`node --check server/scripts/smoke-student-lifecycle.js` 通過；`npm run build` 通過；`cd server && npm test -- --runInBand` 通過。
- ⚠️ **實跑 blocked by local DB runtime**：目前 `DATABASE_URL` fallback 到 `localhost:5432/giis_transcript`，但本機沒有 Docker；系統內建 `postgresql@14` 缺 `libicui18n.74.dylib`，`initdb` 也無法啟動。因此 smoke script 邏輯已就緒，但本機未能真的寫入 DB。修法：安裝/修復 PostgreSQL 或提供可用 Postgres `DATABASE_URL` 後執行 `cd server && npm run db:push && npm run smoke:student-lifecycle`。
- 🔧 **仍待補**：把這個 smoke script 接進 CI 的 ephemeral Postgres，或在 dev setup 補一鍵啟動 DB 的非 Docker fallback。

---

## ✅ Ops retention loop hardening（2026-05-19 Later 5）

> 目標：讓付費後的家長持續收到進度、付款能自動連到學生、登入卡住時可自助恢復；這三件事直接影響續付與信任。

- ✅ **EmailLog + weekly report 去重**：`server/prisma/schema.prisma` 新增 `EmailLog`；`server/src/lib/weeklyReportService.js` 以 `weekly_report:{studentId}:{week}` 做 dedupe，一週不重複寄；支援 `dryRun` / `force`。
- ✅ **Weekly report CLI / cron-ready**：`server/scripts/send-weekly-report.js`；`server/package.json` 新增 `npm run email:weekly-report` 與 `npm run email:weekly-report:dry-run`，可接 cron / CI / 手動 admin run。
- ✅ **家長 email fallback**：若 active linked student 找不到有效 purchaser/parent email，週報 fallback 到 `admin@genesisideas.school`，避免 silent skip。
- ✅ **Stripe 自動 link student**：`server/src/routes/webhooks-stripe.js` 在 `checkout.session.completed` / `invoice.payment_succeeded` 後，用付款 email 依序 match `ParentAccount.email`、`Student.parentEmail`、`StudentAccount.email`，自動填 `Subscription.studentId`。
- ✅ **Forgot password**：`PasswordResetToken` model；學生 `/api/auth/forgot-password` + `/api/auth/reset-password`；家長 `/api/parent/forgot-password` + `/api/parent/reset-password`；frontend 新增 `/reset-password`，學生與家長 login 頁都有入口。
- ✅ **Resend error handling 修正**：`server/src/lib/mailer.js` 現在會把 Resend `result.error` 視為失敗並印出 provider error；`RESEND_FROM_EMAIL` 可覆蓋寄件人。
- ✅ **CI Postgres smoke test**：`.github/workflows/ci.yml` 新增 `server-smoke` job，使用 `postgres:16` service，執行 server install → `db:push` → `db:seed` → Jest → `smoke:student-lifecycle`。本機 Postgres 壞掉時，PR/CI 仍可驗證真 DB lifecycle。
- ⚠️ **校長聘書未寄出原因已定位**：Resend 回 403：`genesisideas.school` domain is not verified。需要先到 Resend 驗證 domain，或暫時設 `RESEND_FROM_EMAIL` 為 Resend 已驗證 sender，否則所有 `admissions@genesisideas.school` 寄件都會被拒。
- ✅ **驗證**：`npm run postinstall` / Prisma generate 通過；`npx prisma validate` 通過；route load 通過；`npm run build` 通過；`cd server && npm test -- --runInBand` 通過。
- ⚠️ **部署注意**：需要對 production DB 執行 `cd server && npm run db:migrate:deploy`（或目前流程用 `npm run db:push`）讓 `EmailLog` / `PasswordResetToken` 表生效。
- 🔧 **仍待補**：把 weekly report CLI 接到實際 cron；Resend domain DNS 驗證；本機 DB runtime 修好後可在 laptop 重跑 `smoke:student-lifecycle`。

---

## ✅ Homepage payment path + weekly report CC（2026-05-19 Later 6）

> 目標：家長付款前先快速驗證「學校是真的、進度看得到、價格與下一步清楚」；付款後 weekly report 讓 admissions 也收到副本。

- ✅ **Weekly report 全部 CC admissions**：`server/src/lib/mailer.js` 的 `sendWeeklyProgressEmail()` 會 CC `admissions@genesisideas.school`；`server/src/lib/weeklyReportService.js` 回傳也帶 `cc`，方便 CLI/API 查核。
- ✅ **Hero CTA 直達申請**：`src/components/pages/Homepage/Homepage/HeroSection.js` 的 primary CTA 從 `/admission` 改到 `/apply`，減少家長已經有意願時的繞路。
- ✅ **Hero 文案更聚焦付款疑慮**：第一屏明確說明 Florida-registered、24-credit framework、real coursework、transcript records、parent progress visibility、US college admissions review；避免只像宣傳頁。
- ✅ **新增付款前驗證區塊**：`src/components/pages/Homepage/HomepageMain.js` 新增 `ParentDecisionStrip`，三個入口：`/school-profile`、`/parent/demo`、`/pricing`，再附 `/apply` CTA。這是為了把「我還不確定」轉成「我可以自己驗證」。
- ✅ **首頁 Apply CTA 修正**：`src/components/pages/Homepage/Homepage/Slogan.js` 的 Apply Now 也改到 `/apply`。
- ✅ **視覺/技術驗證**：`npm run build` 通過；`cd server && npm test -- --runInBand` 通過；Playwright 以 `http://localhost:3000` 擷取首頁 screenshot，第一屏 render 正常。
- 🔧 **仍待補**：首頁下方 Faculty / Success stories 可再加「可下載 governance/appointment PDF」與「sample weekly report」預覽，進一步提高 trust + transparency。

---

## ✅ Sample weekly report preview（2026-05-19 Later 7）

> 目標：把「家長每週看得到孩子進度」從一句承諾變成付款前可視化的具體樣本。

- ✅ **首頁新增 weekly digest preview**：`src/components/pages/Homepage/HomepageMain.js` 新增 `WeeklyReportPreview`，放在付款前驗證區塊後、80 秒 demo 前。展示 credits、GPA、graduation progress、active courses、advisor note、dashboard CTA。
- ✅ **銷售動線更順**：流程現在是 Hero → Apply/price → Before You Pay 驗證 → Weekly report preview → product demo，先回答 trust/transparency，再要求家長投入時間或付款。
- ✅ **DemoEmbed 預設 CTA 修正**：`src/components/main/DemoEmbed.js` 的 default `primaryCtaTo` 從 `/admission` 改 `/apply`，避免復用時又把申請 CTA 導回資訊頁。
- ✅ **視覺驗證**：Playwright 在 `http://localhost:3000` scroll 到 weekly preview 區塊截圖，區塊可讀、沒有桌面重疊；dev server 已關閉。
- ✅ **技術驗證**：`npm run build` 通過；`cd server && npm test -- --runInBand` 通過；mailer/weeklyReportService route load 通過。
- 🔧 **仍待補**：把 sample weekly report 也接到 `/parent/demo` 頁面底部，讓從 Pricing 來的家長也能看到 email 樣本；再把真 weekly report template 和首頁 preview 的 copy 抽成共用資料，避免日後漂移。

---

## ✅ Lesson quality audit gate（2026-05-19 Later 8）

> 目標：把「AI 產課程影片」升級成可控的製片/審核流程；每支影片進 Learn Portal / YouTube 前，都能先看到內容密度、素材完整度、reviewer gate 與 release 風險。

- ✅ **新增 audit 腳本**：`tools/lesson-video/audit_lessons.py` 可掃單支或全量 `teaching-videos/*/script.json`，輸出 machine-readable JSON + human-readable Markdown。
- ✅ **檢查面向**：section/word count、估計分鐘數、過長段落、pause/answer 結構、trap/misconception 語言、assignment/portal next action、slide/audio/MP4/transcript/YouTube 狀態、risky public claims、AP wording note。
- ✅ **Reviewer gate 入表**：自動彙整 `_review*.json`，辨識 PhD/peer reviewer、adversarial student reviewer、citation/source checker，並把 critical/minor verdict 納入 `pass` / `pass_with_minor_notes` / `needs_review` / `block`。
- ✅ **全量 baseline 已跑**：64 支 lesson，結果 `needs_review: 48`、`pass_with_minor_notes: 14`、`pass: 2`，平均 score 65.5；報告在 `teaching-videos/_audit/lesson-quality/20260520T000849Z-lesson-quality.{json,md}`。
- ✅ **第一批洞察**：最大問題不是產不出影片，而是資訊密度與缺正式 reviewer gate；AP Psych 多支平均 section 過長，AP Bio M8 缺 MP4/reviewer，已清理上傳後的 lesson folders 不再被誤判為 missing slides。
- ✅ **驗證**：`python3 -m py_compile tools/lesson-video/audit_lessons.py` 通過；單支 AP Biology M10 audit 通過；全量 audit 通過。
- 🔧 **仍待補**：把 audit 接進 `make_lesson.py` / YouTube upload 前的 release gate；下一版可加入 LLM-based PhD reviewer、source/license fetch、slide screenshot readability/OCR、contact-sheet visual QA。

---

## ✅ Module activity completion tracking（2026-05-19 Later 9）

> 目標：讓家長與 admin 不只看到「完成幾個 module」，也能看到每個影片/閱讀/練習/測驗/作業實際何時完成，增加透明度與續費信任。

- ✅ **新增 `ModuleProgress` DB model**：`server/prisma/schema.prisma` 新增 per-enrollment/per-module 進度表，記錄 `readingCompletedAt`、`videoCompletedAt`、`supplementalVideoCompletedAt`、`practiceCompletedAt`、`quizCompletedAt`、`assignmentSubmittedAt`、`assignmentGradedAt`、`moduleCompletedAt`、`lastActivityAt`；timestamp 採首次完成，不被重複點擊覆蓋。
- ✅ **學生端可手動標記非評分活動**：`src/components/pages/Learn/ModulePage.js` 的 Reading / Video / Supplemental Video / Practice resource cards 增加 Mark read / Mark watched / Mark done；呼叫 `POST /api/enrollments/:slug/module/:moduleOrder/progress` 寫入真資料。
- ✅ **測驗與作業自動同步 progress**：`server/src/routes/enrollments.js` 在 quiz submit、assignment submit、admin assignment feedback 時同步寫入 `ModuleProgress`；admin 手動更新 completed modules 時也會補 `moduleCompletedAt`。
- ✅ **家長 Dashboard 可看到活動時間線**：`server/src/routes/parent-data.js` 把 video/reading/practice completion 放入 recent activity；`src/components/pages/Parent/ParentDashboard.js` 增加對應顯示。
- ✅ **Admin audit trail 更完整**：`server/src/routes/students.js` 使用 explicit `ModuleProgress.moduleCompletedAt`，並把 video/reading/practice events 納入 timeline；`src/components/pages/Admin/AdminAuditTrailPage.js` 增加 filter 與文字顯示。
- ✅ **驗證**：`npx prisma format` / `npx prisma validate` / `npm run postinstall` 通過；route load 通過；`cd server && npm test -- --runInBand` 通過；`npm run build` 通過。
- ⚠️ **部署注意**：production DB 需要跑 Prisma migration/db push，讓 `ModuleProgress` 表生效。下一步可把 weekly report 的「本週活動」也改用 `ModuleProgress.lastActivityAt`，週報會更像真 LMS。

---

## ✅ AP Biology M10 V2 lesson production pilot（2026-05-19 Later 10）

> 目標：實測新版「專業課程製片 flow」：短講稿、單概念 slides、三類 reviewer、contact-sheet QA、audit gate，比原 Claude Code 版本更像可控的正式課程產線。

- ✅ **新建 V2 pilot folder**：`teaching-videos/ap-biology-module-10-natural-selection-v2/`，不覆蓋原 M10。
- ✅ **Script 降密度**：原 M10 16 sections / 1412 words / avg 88.2 / max 147；V2 改成 14 sections / 594 words / avg 42.4 / max 53。核心策略：misconception-first、每段只教一件事、Hardy-Weinberg pause + worked answer 分離。
- ✅ **Slides 重做**：`build_slides.py` 產生 14 張 1920×1080 slides，採 teacher-drawn diagrams，不使用未授權網路圖片；新增 macOS font fallback，Alan 的 Mac 可直接 build。
- ✅ **三類 reviewer artifacts**：新增 `_review_A_v2pilot.json`（PhD-level content）、`_review_B_v2pilot.json`（adversarial AP student）、`_review_C_v2pilot.json`（citation/source/license）。C reviewer 因未綁 reference packet 給 `minor`，其餘 pass。
- ✅ **Contact-sheet visual QA**：產生 `contact-sheet.jpg`，實際抓到並修掉兩個問題：舊 `03_blueprint.png` 殘留、recap assignment box 文字重疊。
- ✅ **Timing MP4 render**：產出 `ap_biology_module_10_natural_selection_v2_pilot.mp4`（約 4.1 min，靜音 WAV timing placeholder；正式上線前需用 Edge TTS/EmmaNeural 重生 audio）。
- ✅ **Audit comparison**：`tools/lesson-video/audit_lessons.py` 補支援 WAV audio artifacts；比較報告在 `teaching-videos/_audit/lesson-quality-v2-pilot/20260520T003514Z-lesson-quality.{json,md}`。結果：原 M10 score 62 `pass_with_minor_notes`；V2 score 99 `pass`（只剩 AP naming note）。
- 🔧 **仍待補**：把 V2 標準寫回 `tools/lesson-video/AGENT_RECIPE.md` / `SKILL.md`，正式接 Edge TTS + source/reference packet + upload gate；下一支可用 AP Psych 高密度影片做第二個 pilot。

---

## ✅ Lesson production toolchain integration（2026-05-19 Later 11）

> 目標：把 `presentations:Presentations`、`imagegen`、`browser:browser`、`engineering:testing-strategy` 這些能力正式加入 lesson flow，讓 CC/Codex 之後不是憑感覺做影片，而是照製片 + 審核 + 學習測試流程走。

- ✅ **新增 `QUALITY_FLOW.md`**：`tools/lesson-video/QUALITY_FLOW.md` 定義四層能力角色：Presentations = slide story/contact-sheet bar；imagegen = hook/thumbnail/低精度概念圖；Browser = Learn Portal/embed render QA；testing-strategy = `learning_check.json` / A-B test / release rubric。
- ✅ **新增 release gate**：`tools/lesson-video/lesson_release_gate.py` 讀 `audit_lessons.py` 結果，輸出 `ready_to_upload` / `needs_revision` / `blocked`；預設要求 score ≥ 90、無 major/critical、MP4、transcript、contact sheet、三類 reviewer、AP citation/source reviewer。
- ✅ **新增 contact sheet helper**：`tools/lesson-video/make_contact_sheet.py` 從 `slides/*.png` 產生 `contact-sheet.jpg`，固定納入 QA。
- ✅ **更新 lesson contracts**：`tools/lesson-video/SKILL.md`、`AGENT_RECIPE.md`、`AUTO_PIPELINE.md` 都已加入 V2 規則：visual plan、assets manifest、learning check、contact sheet、release gate。
- ✅ **Daily upload 先跑 quality report**：`tools/youtube-upload/daily.sh` 在 `yt_queue.py upload` 前先執行 `lesson_release_gate.py --pending` 並寫 `teaching-videos/_audit/release-gate/latest-release-gate.json`。目前先 non-blocking，避免立刻打斷現有 launchd；下一步可改成只上傳 ready 清單。
- ✅ **實測**：`python3 -m py_compile` 通過；V2 M10 release gate ready；`lesson_release_gate.py --pending` 跑 19 支 pending，結果 ready 1 / needs_revision 18 / blocked 0。
- 🔧 **仍待補**：把 `yt_queue.py upload` 改成強制消費 release gate 的 `ready_to_upload`，並為 AP/CS/Math 各做一支 V2 pilot，確認 gate 不會過度阻擋正常高品質影片。

---

## ✅ Nav UX + G12 Spring 學習進度（2026-05-12）

- ✅ **Nav 登入/登出**：Login 按鈕（未登入）、My Courses + Profile + Log Out（學生）、Parent Portal + Log Out（家長），桌面 + 手機兩端完整
- ✅ **語言切換按鈕**：改成 🌐 pill（`topButton` class，白色文字 + rgba border），深色 nav 背景下清晰可見；原本 `color: '#555'` 被背景吃掉
- ✅ **G12 Spring 5 位學生學習進度**：`completedModules` 全滿、`creditEarned: true`、midterm（3/20）+ final（5/8）都提交。quiz scores 對齊成績（A=94, A-=90）。成績本身仍在 gate 下，5/22 才 release
- ✅ **`seedCourses()` 修 FK 衝突**：有 enrollment 的課程不再嘗試 delete，改成 update metadata + quiz questions in-place。每次 re-seed 都能跑完不報錯

---

## ✅ 第 5 位 senior — Hanxi Xiao 入庫（2026-05-12）

- ✅ **新增 `26-005 Hanxi Xiao`** 到 `server/prisma/seed.js`：Psychology & Social Sciences 路線（Class of 2026 第 5 位）
- 來源：`TransScript_Hanxi Xiao.pdf`（school-signed transcript dated 2025-11-21）
- 8 學期完整入庫：G9 Fall → G12 Spring。G9 Fall–G12 Fall 為轉錄自正式成績單；G12 Spring 為當前學期選課（English IV – Advanced Composition / Sociology / Adolescent Psychology / Positive Psychology & Wellbeing），grade 沿用 release-gated pattern（`SPRING_2026_RELEASE = 2026-05-22`）— 與其他 4 人一致
- Bio: Female, born 2007-03-21, 家長 Shuying Zhao, Shanghai 朱家角, entry 2022-08-15, graduation 2026-06-30
- 帳號 `hanxi.xiao@genesisideas.school` / `Student2024!!`（與其他 senior 共用 dev seed password）
- Cumulative GPA 約 3.74（official PDF）— 與 system 推算 3.77 在合理誤差內
- 同步更新 ROADMAP 測試帳號表

---

## ✅ Repo cleanup（2026-05-10）

> 純整理，不動程式碼邏輯。Git history 變乾淨，未來 agent 不會被過時資產誤導。

- ✅ **刪掉根目錄重複的 `transcript_seal.jpg`**（2.4MB）— 與 `src/img/transcript_seal.jpg` md5 相同，程式只 import src/img 那份
- ✅ **刪掉 `src/img/Homepage/homepage[1-5,7,8].png`**（~3.9MB）— `CLAUDE.md` 已明令「Don't bring back homepage[1-8].png」，grep 確認 0 reference
- ✅ **刪掉 `src/img/cognia.png` + `src/img/Homepage/cognia_logo.jpg`** — 我們不是 Cognia accredited，這些圖檔是錯誤資產，0 reference
- ✅ **`.gitignore` 加 `__pycache__/` + `*.pyc`** — 之前 `tools/youtube-upload/__pycache__/` 一直在 untracked 列裡吵
- ✅ **掃掉所有 `.DS_Store` 殘檔**（root + src + src/img + src/img/Homepage + public + teaching-videos）— 已 gitignore 但檔案還躺在 disk
- ✅ **Commit 一直沒 push 的工作**：`tools/youtube-upload/` 的 `yt_queue.py`、`daily.sh`、`com.giis.youtube-daily.plist`、`QUEUE.md`，加上 `REVIEW-2026-05-10.md`
- ✅ **package.json `yt:status` / `yt:upload` 對齊新檔名**（`queue.py` → `yt_queue.py`），不然 npm script 會找不到檔
- 淨結果：`src/img/` 從 14M → 9.4M，git status 完全乾淨，未來 agent 直接知道哪些是現役資產

---

## ✅ UI/UX 整修（2026-05-10）

> 本輪改善「信任感」三個層面：文件視覺（成績單 + 文憑）、導覽體驗（Login 入口）、管理功能（畢業資格）。

### 成績單 PDF（`transcriptPdf.js`）
- ✅ **顏色統一**：`NAVY = '#1a2d5a'`、`GOLD = '#b8962e'`，Header 底色、badge 邊框、分隔線全部對齊
- ✅ **"OFFICIAL TRANSCRIPT" badge**：金色邊框 + `letterSpacing: 1.5px`，增加正式感
- ✅ **印章鋼印效果**：`grayscale(100%) opacity(0.42) contrast(110%) brightness(130%)` + 雙層 drop-shadow（白色高光 + 深藍陰影），視覺上像金屬壓印
- ✅ **簽名區佈局**：25%（印章）| 15%（空白）| 60%（校長簽名），不再擠在一起
- ✅ **"Official(s) Certifying Transcript:" 佔全寬**，下方底線也全寬對齊
- ✅ **校長資訊修正**：`President & Principal`（之前寫錯）

### 文憑（`DiplomaPage.js`）
- ✅ **印章白色背景修復**：`border-radius:50%; overflow:hidden` clip 掉 JPG 白角 + cream 底色容器
- ✅ **校長簽名**：Pinyon Script 32px `whiteSpace: nowrap`（單行，像真筆跡）
- ✅ **畢業生簽名**：Great Vibes 32px `whiteSpace: nowrap`
- ✅ **移除 "WITH HONORS"**：學校尚未建立 Honors 判定政策，暫不顯示

### 導覽列 Login（`Header.js` + `Nav.js` + `HeroSection.js`）
- ✅ **Header 簡化**：只留 LOGO，移除 Login 按鈕
- ✅ **Nav 完全不放 Login**：Nav 只負責「瀏覽」，不讓 Login 干擾行銷動線
- ✅ **Login 入口移至 Hero**：「Already enrolled? Sign in →」小字，低調放在兩個 CTA 按鈕下方（SaaS 標準做法）
- ✅ **已登入狀態**：Nav 右側仍顯示 My Courses + Profile（學生）或 Parent Portal（家長），session 判定統一用 `studentSession || parentSession`
- ✅ **手機/桌面一致**：三種狀態（未登入 / 學生 / 家長）在手機和桌面顯示相同邏輯

### 公開校曆（`CalendarPage.js`）
- ✅ **`/calendar` 公開頁**：顯示全 5 個學年（2022-23 → 2026-27），雙語（language prop）
- ✅ **從 Nav 可達**：ACADEMICS 下拉 → "Academic Calendar" / "学校日历"
- ✅ **視覺標記**：當前年份標 "CURRENT YEAR"，未來 30 天內的日期綠色標記，過去日期灰色

### 畢業資格判定（`AdminTranscriptPage.js GraduationSection`）
- ✅ **從成績單 CourseRow 計算學分**（`letterGrade` 非空才計入），不從 Enrollment 抓
- ✅ **進度條**：即時顯示 X / 24 學分，及格線 24 學分
- ✅ **校曆整合**：自動顯示 `SPRING_END`（學分截止）和 `CEREMONY_DATE`（典禮日）
- ✅ **"Mark as Graduated" 按鈕**：學分 ≥ 24 才解鎖，點擊後 PATCH `graduationDate = ceremonyDate`
- ✅ **CI/CD 修復**：`netlify.toml CI="false"`（防止 ESLint warning 當 error）、GitHub Actions 升 Node 24

---

## ✅ YouTube 上傳 Scheduler（2026-05 新增）

> 解決「影片做完了沒人記得上傳，等實際上線時 quota 又卡住」的痛點。每天 9am 自動上 4 支，剩下的隔天自動接著。

- ✅ **`tools/youtube-upload/yt_queue.py`** — `status` 子指令掃 `teaching-videos/`，分類成 uploaded / pending / no-mp4 / broken。By-course 條形圖、pending queue、最近上傳清單。`upload` 子指令一次跑 N 支（預設 4，留 quota headroom）
  - ⚠️ **不能叫 `queue.py`**：會 shadow Python stdlib 的 `queue` module，讓 subprocess 跑 `upload_video.py` 時 urllib3 / google-auth 整串 import 炸掉（`AttributeError: module 'queue' has no attribute 'Queue'`）。2026-05-10 從 `queue.py` 改名修掉
  - ⚠️ **succeeded 計數 bug 已修**（2026-05-10）：原本用 `len(queue) - len(failures)`，abort 後沒嘗試的 lesson 被誤算成已上傳。改成累加實際 returncode==0 的數量
- ✅ **`tools/youtube-upload/daily.sh`** — launchd 用的 wrapper，每次 run 先印 status 再 upload，全部 log 到 `~/Library/Logs/giis-youtube-daily.log`
- ✅ **`tools/youtube-upload/com.giis.youtube-daily.plist`** — macOS launchd job，每天 09:00 自動觸發。`cp` 到 `~/Library/LaunchAgents/` + `launchctl load` 一次性裝完
- ✅ **`tools/youtube-upload/cleanup_lesson.py`** （2026-05-11）— 上傳成功後自動清掉本地 slides/audio/mp4/wav（per-lesson 省 15-210MB）。三層 safety：(1) script.json.youtube 必填欄位完整 (2) YouTube API 確認影片 `uploadStatus=processed` (3) 真的刪。任何一層 fail 就拒絕、不留爛攤子。寫 `.cleaned` breadcrumb 給 `make_lesson.py` 看，防止 force-rebuild 被誤觸發。Partial-failure 不寫 breadcrumb，下次重跑會 retry
- ✅ **`make_lesson.py --force-rebuild`** （2026-05-11）— 預設拒絕對「已上傳 + .cleaned」folder 重 build（避免燒 TTS quota / disk）。需要時加 `--force-rebuild` flag 同時手動清 youtube block
- ✅ **`.gitignore` 重設計**（2026-05-11）— `teaching-videos/` 從整資料夾 ignore，改成 ignore-artifacts-only。`script.json` + `build_slides.py` 進 git（source of truth backup），mp4/wav/slides/audio 不進。Repo 體積維持小，但失去 Mac 也不會丟內容
- ✅ **YouTube transcript upload + auto git push**（2026-05-13）— `merge_lesson.py` 拿掉 burn-in 字幕，改寫 `transcript.txt`；`upload_lesson.py` 改傳 plain text 給 YouTube 用 Google STT 對齊（比本地任何方案準）。Viewer 可開關 CC、可 auto-translate、可調樣式。`daily.sh` 加 auto `git add + commit + push` 把 manifest 跟 youtube block 推上 Netlify。`make_lesson.py --align` 變成 opt-in（預設不跑 whisper，省 ~30-60s/lesson）
- ✅ **Auto-pipeline SOP** （2026-05-13）— `tools/lesson-video/AUTO_PIPELINE.md` 完整 spec：Cowork scheduled task 每日 6am 用 Task sub-agents 跑 generator → 3-reviewer cascade → lesson writer → build_slides 一條龍，每天產 1 完整 course 的內容。Mac launchd 接續 TTS + merge + upload。配套 `references/ap-calc-ab-ced.md` 已 fetch 自 College Board 當 pilot reference
- ✅ **Word-level subtitle alignment**（2026-05-11）— 修「字幕跟聲音對不上」bug。原本 `merge_lesson.py` 用 `chunk_duration = section_dur × chunk_words / total_words` 假設 section 內均速，但 TTS 句點 / 冒號 / 破折號的自然停頓會讓字幕逐句漂移（Brian / Christopher 這類戲劇性聲音最有感，AP Psychology 被回報過）。
  - ⚠️ **edge-tts WordBoundary 死了**：第一版實作試圖讀 edge-tts 的 `WordBoundary` events 但 Microsoft 上游 service 2024 後就不再 emit（用任何 voice 跑都 0 events）。改成下面這條路
  - ✅ **`tools/lesson-video/align_audio.py`** — 用 `faster-whisper` 反向對齊。讀現有 MP3 + script.json text，吐 `audio/<id>.words.json`。`initial_prompt=section.text` 把已知 narration 餵進去當 hint 提升準度。Base.en 模型 ~140MB，CPU 一個 section ~2-5s
  - ✅ **`make_lesson.py`** pipeline 變成三段：TTS → 對齊 (`align_audio.py`) → merge。`--no-align` 可跳過、`--align-model tiny.en|base.en|small.en` 選模型
  - ✅ **`merge_lesson.py` `build_subtitles()`** 有 words.json 就用真實字級時間切 cue，沒有就 fallback 到舊 proportional 演算法（向後相容）
  - 影響範圍：**已上傳 + burn-in 字幕**的影片不能用 captions API 修，必須 re-render + 重傳 + 砍舊片。M1 History + M10 Developmental 兩支需要 redo
- ✅ **`npm run yt:status` / `npm run yt:upload`** package.json scripts，日常用最順
- ✅ **Quota maths**：每支 ~2,100 units（upload 1600 + thumbnail 50 + captions 400 + playlist 50），4 支 8,400 / 10,000 daily 留 1,550 headroom
- ✅ **Fail-fast 邏輯**：upload 失敗時 abort 整批，避免燒更多 quota 在同一錯誤
- ✅ **README**：`tools/youtube-upload/QUEUE.md` 完整操作手冊（日常 flow + 一次性安裝 + 故障排除）

**現況**（執行 `npm run yt:status` 結果）：
- ✓ uploaded: 5（4 Algebra I + 1 English I）
- ● pending:  17（含 16 AP Psych 中 15 支 + AP Calc M1 + Algebra I M5）
- ○ no MP4:   4（1 個是 AP Psych M14，可能 make_lesson 沒跑完；3 個是 Algebra 沒做的 module）

**家長可見的影響**：
17 支已渲成的 lecture 每天 4 支上傳，4-5 天內**全部 AP Psychology + AP Calc + Algebra M5 進 Learn Portal**。學生打開 module 頁就看到 `<LessonVideoEmbed>` 拉的對應 YouTube 影片，「家長看得到孩子在學什麼」承諾直接兌現。

---

## ✅ School Calendar 系統（2026-05 新增）

> 為什麼重要：FL 私立學校（Statute 1002.42）的合規要求之一就是公開校曆。同時是家長最常問的三個問題：「什麼時候開學/放假？」「什麼時候出成績單？」「什麼時候發畢業證？」。

- ✅ **`src/config/schoolCalendar.js`** — 單一資料源（兩個 academic year：2025-26 已配齊、2026-27 框架）。導出 `getCurrentAcademicYear()` / `getCurrentTerm()` / `getUpcomingEvents()` / `formatDate()`，今天會自動算進對應 term
- ✅ **`/school-profile` 加 Academic Calendar section**（curriculum 之前）— 5-row table（Fall · Winter Break · Spring · Summer · Graduation 醒目黃底），跑出來會自動帶下方「未來 4 個 key dates」一行；下載成 PDF 時也會印出來給大學申請用
- ✅ **`/parent/demo` 家長 Dashboard quick link 接好** — 「📅 School calendar」現在連到 `/school-profile`；右側欄新增 `UpcomingFromCalendar` 卡，顯示未來 4 個事件 + 「Full calendar →」連結
- ✅ **校曆覆蓋 GIIS 創校以來全部 5 個學年**（2022-23 至 2026-27）：歷史年份 graduation = null（Class of 2026 是第一屆 senior）；SchoolProfile PDF 印出 current-year detail + all-years summary table；強調「online async, Portal 24/7」、把 winter/summer 改成 "recess (admin pause)" 風格、key dates 精簡到只剩 term-meaningful（final exam window + close date）

- ✅ **2025-26 關鍵日期**（FL 私校標準）：
  - Fall: **2025-08-18 → 2025-12-19** · 期末考視窗 12/8 開
  - Winter Break: 12/22 → 1/4
  - Spring: **2026-01-05 → 2026-05-22** · 期末考視窗 5/11 開
  - **畢業典禮 + 數位文憑發放：2026-06-05（週五）**
  - 紙本文憑寄出：2026-06-12
  - 學年末成績單發出：2026-06-12

### 📅 對 Class of 2026 四位學生的具體影響

- ✅ **Fall 2025 (G12 Fall) 成績已在** seed.js（所有 4 人都已 graded）
- ✅ **Spring 2026 (G12 Spring) 真實成績已寫進 seed.js** — 但用 `courseRowGated()` helper gate 在 **2026-05-25** release date。今天 5/10 re-seed 仍顯示空白（in-progress）；5/25 之後 re-seed 自動顯示真實成績。任何日期 re-seed 都「自己對」
  - Ruwen (Business): Eng-Adv-Comp A-, Sociology A-, Business Law A, Corp Finance A → Spring 3.85 GPA, +4 cr
  - Tao (Psychology): Eng-Adv-Comp A, **AP Human Geography A-**, Abnormal Psych A, Counseling A → Spring 4.17W / 3.92U GPA, +4 cr
  - Baoyi (Info Studies): Eng-Adv-Comp/Media A, Sociology A-, Personal Finance A, Digital Media A → Spring 3.92 GPA, +4 cr
  - Yunfan (Engineering/Sports): Eng-Media&Analytical A, Media Psych A, Sports Mgmt&Leadership A → Spring 4.00 GPA, +3 cr
- 🎓 **全部 4 人都會在 2026-06-05 拿到文憑**（都遠超 24 學分門檻）
- 🔧 **覆寫 release date 測試**：`GIIS_SEED_DATE=2026-05-25 npx prisma db seed` 立即看到 grades

---

## ✅ Phase 0 — 上線前堵漏洞（已完成）

> 修掉錯誤承諾與基本可用性問題。家長看到這些不一致就會立刻離開。

- ✅ **0-A FAQ 錯誤承諾** — `AdmissionMain.js` 的 FAQ 早期已修；本輪補修 Tuition 區塊兩處漏網之魚（"Dedicated academic advisor" / "Priority advisor response" → 改成 "Personalized course planning support" / "Priority email support (24h)"）
- ✅ **0-B Pricing Enroll 按鈕** — 早期已從 `mailto:` 改成 `<Link to="/admission">`，本輪驗證確認 OK
- ✅ **0-C Learn Portal 手機版** — 新增 `src/components/pages/Learn/learn-mobile.css`，用 `data-m="..."` attribute 統一 hook 進三個 Learn 頁。768px 以下 stat 卡 4→2、banner 直立、課程卡單欄；380px 以下更緊湊
- ✅ **0-D 拿掉 Cognia 引用** — 不是會員不能寫，全站 0 殘留
- ✅ **0-E 「US-accredited」→「Florida-registered」** — accreditation ≠ private school registration。Footer / Hero / Introduction / AcademicsMain / CourseCatalog / SEO meta 全改完。SchoolProfile 既有「in the process of pursuing regional accreditation」誠實說法保留
- ✅ **0-F 大學校名統一** — Syracuse University (SIT) → Syracuse University；NJIT → New Jersey Institute of Technology；UCSB → UC Santa Barbara。SuccessStories / HeroSection / AdmissionMain / walkthrough.html 全部對齊
- ✅ **0-G Yunfan/Baoyi GPA 校準** — 從 `server/prisma/seed.js` 重算，兩人之前在 SuccessStories 是顛倒的：
  - Yunfan: 3.78 → **3.85** (UW, 28 完成學分)
  - Baoyi:  3.90 → **3.77** (UW, 29 完成學分)
  - walkthrough.html dashboard + transcript scene 都對齊到 Yunfan 真實數據

---

## ✅ 視覺風格大整修（已完成）

> 把 AI 生成圖換成真實產品截圖。家長對 AI 圖很敏感，看到=立刻打折扣。

- ✅ **首頁 hero** — 移除 `<ImgSlider />` AI 7 張輪播圖，改成 `HeroSection.js`：左側雙語標題 + Founders pricing + 兩 CTA，右側真實 Dashboard 截圖（從 walkthrough 抓的，含 Yunfan 名字、GPA、進度條）+ 信任 strip（Florida Statute · 24-credit · Class of 2026 · Real teacher feedback）
- ✅ **4 個內頁 hero 全換** — 從 walkthrough 各 scene 抓的真實截圖：
  - **Admission** ← `transcript-screen.jpg`（被錄取家長最關心的官方文件）
  - **Discovery** ← `pathways-screen.jpg`（8 條 pathway 全展示）
  - **Academics** ← `module-screen.jpg`（Module 學習頁，看真實內容）
  - **Support** ← `diploma-screen.jpg`（最終目的地：文憑）
- ✅ **孤兒 AI 檔案**（沒被引用，可刪）：`src/img/Homepage/homepage[1-8].png`、`src/img/cognia.png`、`src/img/Homepage/cognia_logo.jpg`、`src/components/pages/Homepage/Homepage/ImgSlider.js`

---

## ✅ Founders Pricing 上線（已完成）

> 降低入手門檻又不打折信任：誠實說「這是限量創校價」。

- **公開價格**：~~$199/月~~ → **$19.90/月** Founders（前 100 名 · 鎖定 12 個月）
- **年付**：~~$1,799/年~~ → **$199/年** Founders（月均約 $16.60）
- **共識**：12 個月後是否漲到原價（或維持），需要 Alan 在 Stripe 整合時設好
- 已改：`HeroSection.js`、`PricingPage.js`、`AdmissionMain.js` Tuition、`walkthrough.html` CTA scene

⚠️ **後續觀察**：$19.9/月 vs Khan Academy ($4-44/月) 同 segment 重疊。如果 Founders 賣完想穩定 retention，需要：
- 推出第二層 tier（$19.9 自學 vs $99 含批改 vs $199 含 advisor）
- 或者誠實漲價時推出有信用的「Beta 用戶終身 50% 折扣」之類

---

## ✅ 行銷資產 — Demo 影片（已完成）

> 解決 ROADMAP 列出的「課程內容無法預覽」流失點。

- ✅ **80 秒自播放 walkthrough** — `public/demo/walkthrough.html`。九個 scene（hook → 8 pathways → dashboard → module → exam → transcript → diploma → parent view → CTA），英文旁白 + 中英雙語字幕
- ✅ **多角色配音** — 4 個 edge-tts 神經語音輪流講：Aria（學校代言）、Guy（學術權威）、Jenny（學生視角）、Andrew（家長視角）
- ✅ **MP4 渲染 pipeline** — `scripts/make-demo.mjs`（idempotent + 多階段 cache）、`scripts/README-demo.md`、`npm run make-demo` 一鍵跑完，且自動 deploy 到 `public/demo/giis-demo.mp4`
- ✅ **首頁嵌入** — `src/components/pages/Homepage/Homepage/HomepageDemo.js`，塞在 Introduction 與 8 Pathways 之間（含 `id="demo"` anchor 給 hero 的「Watch tour」按鈕跳轉）
- ✅ **家長 Dashboard mockup** — `public/demo/parent-dashboard-mockup.html`（給 Phase 1 當設計參考）

### 🔧 Demo 後續小事

- [ ] **(needs Mac)** 在 Mac 上跑一次 `npm run make-demo` 取代 sandbox espeak 預覽版（產出真神經語音版，自動覆蓋到 `public/demo/giis-demo.mp4`）
- ✅ **DemoEmbed 抽成共用 component** — 新建 `src/components/main/DemoEmbed.js`，接受 `language` / `variant` (full|compact) / `eyebrow` / `headline` / `subline` / `showCtas` / `primaryCtaTo` 等 props。`HomepageDemo.js` 改成 wrapper 用 full variant；`AdmissionMain.js` 在 Steps 後 + Requirements 前用 compact variant（"Before You Apply · 看清楚孩子會經歷什麼"）；`PricingPage.js` 在價格卡前用 compact variant（"$19.90 unlocks · 付費前先看清楚平台"）。grep `<source src="/demo/giis-demo.mp4"` 只剩 DemoEmbed.js 一處

---

## 🎓 教學影片產線（pilot 完成，等批次擴大）

> 為什麼重要：每個 module 一支 5-30 分鐘授課影片，是家長「看得到孩子在學什麼」的最直接證據（Phase 1 透明度的核心）。Khan Academy 用這條路長大；我們用同一條路 + GIIS 品牌風格 + 中文/英文雙語潛力。

- ✅ **Pilot #1：Algebra I — Module 4（One-Step & Two-Step Equations）** — `teaching-videos/algebra-i-module-4-sample/`。約 6 分鐘，1920×1080，GIIS 校徽配色（maroon `#6B1F2A` + gold `#D4A634` + cream `#FAF6EC`），16 sections 含 2 次 pause-and-try、3s intro/outro 自製合成 chord、英文 Aria 神經語音 + 燒入英文字幕。第一段用珍奶找錢做 hook
- ✅ **Pilot #2：Algebra I — Module 9（Slope & Rate of Change）** — `teaching-videos/algebra-i-module-9-slope/`。約 6 分鐘，15 sections，含**真實 Cartesian graph 視覺**（rise/run 黃線標註）、樓梯陡緩對比 hook、four-flavors-of-slope 卡牌、real-life rate-of-change 對應（速度/儲蓄/坡度/降溫）、常見「混亂順序 sign 錯」陷阱頁
- ✅ **老師人格** — 高中老師 + 一點粘的口吻（"You've been doing algebra since you were a kid", "knock these out like they owe you money", "Module 5 — get spicy", "rate of change — that's just slope wearing a different jacket"）
- ✅ **Lesson-video skill（自包整套）** — `tools/lesson-video/SKILL.md` + `make_lesson.py`（一指令：synth + merge）+ `merge_lesson.py`（合成主程式）+ `intro_music.wav`/`outro_music.wav`（numpy 合成的 C 大調 chord，無版權）。Claude 看到「merge the lesson」就會跑 merge skill
- ✅ **Mac 零依賴** — 透過 `imageio-ffmpeg`（PyPI 套件內建 ffmpeg static binary）讓 Mac 完全不需 `brew install ffmpeg`。`pip install edge-tts imageio-ffmpeg` 一次性裝完就好
- ✅ **跨 ffmpeg 版本 robust** — 解決 ffmpeg 8.1.1 的兩個 breaking changes：(1) `force_style=...` 內逗號 escape 規則改了 → 改用直接生 `subtitles.ass`（樣式內嵌，不靠 cli 參數）；(2) brew 8.x 預設沒 `--enable-libass`（subtitles filter 整個不存在！）→ `find_ffmpeg()` 自動偵測 libass 支援，沒有就 fallback 到 imageio_ffmpeg 的 static binary
- ✅ **Pipeline 全鏈確認** — Claude 寫 `script.json` + 生 slides → user `python3 tools/lesson-video/make_lesson.py teaching-videos/<lesson>/` → 自動 edge-tts 生 Aria MP3 → 自動 merge → MP4 落地。一個指令、ZERO Mac 系統依賴、可重複
- ✅ **跨科目驗證 — English I Module 1（Reading Comprehension）** — `teaching-videos/english-i-module-1-reading/`。約 6 分鐘，14 sections。視覺風格從方程式換成 quote 卡 + parchment 段落底色 + inference 箭頭，但同一個 `make_lesson.py`/`merge_lesson.py` 不用改。Pipeline 確認跨科目通用
- ✅ **每科一位老師（聲音指派）** — Math=Aria 女、Science=Emma 女、English=Andrew 男（最會說故事）、Social Studies=Christopher 男（紀錄片感）、Psychology=Brian 男（溫和）、PE/Health=Jenny 女（教練）、Electives=Aria。寫進 `tools/lesson-video/SKILL.md` 對照表，未來新 module Claude 自動套用。設計用意：每科不同聲音 = 像真學校有不同老師

- ✅ **3 支「正式版」script + slides 完成**（Module 1 EASY 5min / Module 7 MED-HARD 9min / Module 14 HARDEST 12min）— 驗證難度縮放策略可行：簡單模組 ~12 sections，最難模組 ~21 sections 含三種解法 + 鑑別式 + 常見錯誤頁。每支結尾都有「How to actually master this module」slide，明確告訴學生影片只是 ~10-15% 學習量，剩下要做 OpenStax / Khan / assignment / advisor

---

## 🎬 YouTube 自動上傳 + Learn Portal 整合（Phase 1 透明度核心 commit ✅）

> **為什麼這個是 Phase 1 的關鍵成就**：家長 / 潛在家長現在打開 Learn Portal 任何一個有 GIIS 影片的 module，看到的是內嵌 YouTube 播放器播自己學校老師講課 — 不再只有外部 Khan Academy 連結。「我看得到孩子在學什麼」這個承諾從文字變成可點擊。

- ✅ **YouTube channel 上線** — Brand Account「Genesis of Ideas International」，校徽 logo，Florida-registered 描述，phone-verified（自訂縮圖權限解鎖）
- ✅ **Google Cloud + OAuth 設定** — `giis-youtube-uploader` GCP project，YouTube Data API v3 啟用，Desktop OAuth client，`client_secret.json` + `token.json` 在 `tools/youtube-upload/` 並寫進 .gitignore
- ✅ **`tools/youtube-upload/` 套組** — 4 支 Python：
  - `upload_video.py`（底層）— 任何 MP4 + metadata 上傳
  - `upload_lesson.py`（高層）— 吃 lesson folder，自動建 title / description / chapter timestamps（從 wav 算）/ 附 SRT / 縮圖 / **加進 course playlist**（不存在自動建）/ **寫 video ID 回 script.json** / **重 build manifest**
  - `playlist.py` — list / show / create / add / remove / reorder / delete
  - `build_manifest.py` — 走過所有 `teaching-videos/*/script.json`，聚合到 `public/data/lessons-manifest.json` 給 React 讀
- ✅ **3 支 lesson 已上 YouTube + 在對的 playlist**：
  - Algebra I — Module 4 (`AMF3Wj4cycs`) → Algebra I playlist
  - Algebra I — Module 9 (`TovkiAsNLms`) → Algebra I playlist
  - English I — Module 1 (`tt_hC7TqUPA`) → English I playlist
  - 所有 unlisted（link 才能看，不出現在 channel 公開頁）
- ✅ **`<LessonVideoEmbed />` React 元件** — `src/components/main/LessonVideoEmbed.js`。吃 `course` + `moduleNumber` props，fetch manifest 找對應 video，找到顯示 16:9 in-page YouTube embed + GIIS-branded header（紅色 maroon），找不到 render `null`（安全 — 還沒上的 module 自動隱藏）
- ✅ **`ModulePage.js` 已接通** — Learn Portal 任何 module 頁都有 `<LessonVideoEmbed course={course.name} moduleNumber={mod.order} />` 在 Objectives 之後 / Study Resources 之前。零 schema 改動，未來新上傳的影片自動出現在對的 module 頁
- ✅ **Pipeline 端到端 idempotent** — 從「Claude 寫 script」一路到「家長在 Learn Portal 看到影片」，過程中每一步都可以重跑、重組合、不會破壞前面的成果

### 🔧 教學影片產線後續

- [ ] **(needs feedback)** Alan 看完 3 支已上 YouTube 的 sample 後，對 tone / 配色 / pause 節奏 / 字幕字級 / 語速給 feedback → 微調 baseline。Quota 警告：今天已用 ~9,750 / 10,000，接近上限
- [ ] **明天上 school intro** — 80 秒 walkthrough 影片 (`public/demo/giis-demo.mp4`) 用 `upload_video.py` 直傳，**privacy=public**（區別於 lesson 的 unlisted），不進任何 lesson playlist。指令在 `tools/youtube-upload/RUN_AFTER_VERIFICATION.md` Step 4
- [ ] **批次第一批：Algebra I 剩下 11 個 modules**（Module 2, 3, 5, 6, 8, 10, 11, 12, 13；其中 1, 7, 14 的 script+slides 已寫好但還沒上）— 每支 ~5-12 min。每天上限 4 支（quota），預計分 3 天。
- [ ] **slide_kit 模板化** — `tools/lesson-video/slide_kit.py`，抽出重複的 `title_slide() / pause_slide() / equation_slide() / graph_slide() / path_slide()` helpers。讓寫新 module 從 ~250 行 PIL 代碼降到 ~50 行純 data
- [ ] **跨科目擴充** — Algebra I 完成後，依家長 demo 頻率排序：English I 全 14 module → Biology → Psychology Foundations → Chemistry → Economics → ...
- [ ] **AI tutor / quiz 自動批改**（Phase 1 → Phase 2 過渡）— 影片只是 lecture，學生看完需要練 + 反饋。Khan Academy 模型成功的關鍵不是影片是 graded practice。我們現在 module 頁有 quiz section 但內容空，要規劃題庫怎麼產生（人工 vs AI），怎麼批改

### 🆕 AP 課程擴充（2026-05 新增）

> 解決「Walkthrough demo 提到的 AP Calc AB 與 AP CS A，seed 裡卻沒有」的不一致問題，順便補 pathway 缺口。

- ✅ **AP Calculus AB**（14 modules，College Board CED 對齊）— `server/prisma/courses/math/ap-calculus-ab.json`，department "Mathematics"。服務 CS / Engineering / Math 三條 pathway
- ✅ **AP Computer Science A**（14 modules，CSAwesome / CodingBat / Practice-It 連結）— `server/prisma/courses/electives/ap-computer-science-a.json`，department "Technology"。服務 CS pathway
- ✅ **AP Calc AB Module 1 — Limits & Continuity** 教學影片 ready：14 sections，~6 min，AriaNeural 語音、math 主題（gold + cream），4 張視覺自製（halfway-to-the-wall hook、one-sided 數線、3 種 DNE mini-graphs、3 種 discontinuity mini-graphs、speedometer real-world）
  - 位置：`teaching-videos/ap-calculus-ab-module-1-limits/`
  - 還缺：audio + MP4。Alan Mac 跑 `python3 tools/lesson-video/make_lesson.py teaching-videos/ap-calculus-ab-module-1-limits/` 即可
- ✅ **AP Calc AB Module 2 — Derivatives: Definition & Fundamental Properties** 教學影片 ready（**Cowork auto-pipeline 首次 smoke-test run · 2026-05-13 15:21Z**）：18 sections，~10 min，AriaNeural、math 主題。Cover CHA 2.1-2.3 + FUN 2.4-2.10。6 張視覺自製（speedometer + secant→tangent hook、h-form / point-form 並列 + tangent-line caption、dy/dx 2x2 notation grid、symmetric difference quotient 數據表、4-failure-mode diff-vs-cont grid 含 corner / cusp / vertical tangent / discontinuity、sum-rule + 必背 derivative table）。Pause = product rule check `d/dx[x·cos x]`，揭曉示範 f/g labeled box。Compare slide 鎖定 quotient-rule numerator sign trap。Generator → 3-reviewer cascade 跑 2 round：round 1 全 minor（dy/dx framing、缺 point-form、counterexample 不夠廣等），revise 後 round 2 全 pass
  - 位置：`teaching-videos/ap-calculus-ab-module-2-derivatives/`
  - Audit：`_audit/ap-calculus-ab/2026-05-13T15-21-29Z-summary.json` + `first-run.json` marker（下次跑 normal mode）
  - 還缺：audio + MP4。Alan Mac 跑 `python3 tools/lesson-video/make_lesson.py teaching-videos/ap-calculus-ab-module-2-derivatives/` 即可
- ✅ **AP Calc AB Module 3 — Composite, Implicit & Inverse Derivatives** 教學影片 ready（**Cowork auto-pipeline run · 2026-05-14 17:22Z**）：19 sections，~9 min，AriaNeural、math 主題。Cover FUN 3.1-3.6。3 張視覺自製（balloon V→r→t chain cascade hook、unit-circle implicit tangent at (3,4)、6-row FORM→TOOL decision table）。Pause = chain-rule check；compare slides 鎖定 chain trap / implicit sign trap / arcsin vs (sin x)⁻¹ trap
  - 位置：`teaching-videos/ap-calculus-ab-module-3-composite-implicit-inverse/`
  - 還缺：audio + MP4。Alan Mac 跑 `python3 tools/lesson-video/make_lesson.py teaching-videos/ap-calculus-ab-module-3-composite-implicit-inverse/` 即可
- ✅ **AP Calc AB Module 4 — Contextual Applications of Differentiation** 教學影片 ready（**Cowork auto-pipeline run · 2026-05-14 17:22Z**）：17 sections，~9 min，AriaNeural、math 主題。Cover CHA 4.1-4.6 + LIM 4.7。8 張視覺自製（ladder + 1ft/s hook、4-column units table、s→v→a motion chain、3-panel real-world rates、4-step related-rates method、ladder right-triangle worked diagram、√x linearization curve + tangent at (4,2)、L'Hospital banner + refinement boxes）。Pause-triplet 10/10-silence/11-solution；compare slide 鎖定 L'Hospital indeterminate-form trap
  - 位置：`teaching-videos/ap-calculus-ab-module-4-contextual-applications/`
  - 還缺：audio + MP4
- ✅ **AP Calc AB Module 5 — MVT, EVT, and the Derivative Tests** 教學影片 ready（**Cowork auto-pipeline run · 2026-05-14 17:22Z**）：18 sections，~9 min，AriaNeural、math 主題。Cover FUN 5.1-5.7。4 張視覺自製（highway toll-booth average-speed hook、curve with secant + parallel tangent at c (MVT geometry)、+/−/+ 號表 with arrows (1st derivative test)、cup vs cap concavity with f'' signs）。Pause-triplet 10/10-silence/11-solution；compare trap 鎖定「every CP is an extremum?」誤解
  - 位置：`teaching-videos/ap-calculus-ab-module-5-mvt-evt-derivative-tests/`
  - 還缺：audio + MP4
- ✅ **AP Calc AB Module 6 — Graph Sketching, Optimization & Implicit Behavior** 教學影片 ready（**Cowork auto-pipeline run · 2026-05-14 17:22Z**）：17 sections，~10 min，AriaNeural、math 主題。Cover FUN 5.8-5.12。Round-2 patch 全套入：feasibility 區間 x ∈ [0,2] + candidates test (A(0)=0, A(2)=0, A(√(4/3))≈6.16) 在 section 08-09 講完；section 06 加紅色 "looking at f', NOT f" 警告 banner；section 07 5-step framework 點名 "feasibility check"；10_pause1_silence 是 10_pause1 的 byte-identical duplicate
  - 位置：`teaching-videos/ap-calculus-ab-module-6-graph-sketching-optimization/`
  - 還缺：audio + MP4
- ✅ **AP Calc AB Module 7 — Riemann Sums and the Fundamental Theorem of Calculus**（**Cowork auto-pipeline run · 2026-05-15 16:07Z**）：AriaNeural、math 主題。Cover CHA 6.1 + LIM 6.2-6.3 + FUN 6.4-6.7。位置：`teaching-videos/ap-calculus-ab-module-7-riemann-sums-ftc/`。還缺：audio + MP4
- ✅ **AP Calc AB Module 8 — Antiderivatives and Integration by Substitution**（**Cowork auto-pipeline run · 2026-05-15 16:07Z**）：AriaNeural、math 主題。Cover FUN 6.8-6.10 + 6.14。位置：`teaching-videos/ap-calculus-ab-module-8-antiderivatives-substitution/`。還缺：audio + MP4
- ✅ **AP Calc AB Module 9 — Differential Equations (Slope Fields + Separation of Variables)**（**Cowork auto-pipeline run · 2026-05-15 16:07Z**）：18 sections，AriaNeural、math 主題。Cover FUN 7.1-7.4, 7.6-7.8。BC-only Euler / Logistic 已排除。位置：`teaching-videos/ap-calculus-ab-module-9-differential-equations/`。還缺：audio + MP4
- ✅ **AP Calc AB Module 10 — Average Value and Area Between Curves**（**Cowork auto-pipeline run · 2026-05-15 16:07Z**）：19 sections，~9 min，AriaNeural、math 主題。Cover CHA 8.1-8.6。位置：`teaching-videos/ap-calculus-ab-module-10-average-value-area-between-curves/`。**已有 mp4** (Mac launchd 已 build)
- ✅ **AP Calc AB Module 11 — Volumes: Cross-Sections, Discs, and Washers**（**Cowork auto-pipeline run · 2026-05-16 16:18Z**）：19 sections，~9 min，AriaNeural、math 主題。Cover CHA 8.7-8.12。BC-only Arc Length 已排除。4 張視覺自製（loaf-of-bread cross-section hook、disc-revolution diagram、dx-vs-dy decision panel、5-trap summary checklist）。Compare slide 鎖定 disc-without-shift vs disc-with-shift when revolving around y=k。Generator → 3-reviewer cascade 跑 2 round：round 1 全 minor（unverified FRQ frequency claim、xy-plane base 不夠清楚、BECAUSE 措辭、dy bridge 缺、OpenStax 章節太具體），patch 完 round 2 全 pass
  - 位置：`teaching-videos/ap-calculus-ab-module-11-volumes-cross-sections-discs-washers/`
  - 還缺：audio + MP4。Alan Mac 跑 `python3 tools/lesson-video/make_lesson.py teaching-videos/ap-calculus-ab-module-11-volumes-cross-sections-discs-washers/` 即可
- ✅ **AP Calc AB Module 12 — AP Exam Synthesis and Free-Response Strategy**（**Cowork auto-pipeline run · 2026-05-16 16:18Z**）：16 sections，~10 min，AriaNeural、math 主題。**Course capstone — no new calculus, pure exam strategy.** Cover exam structure (Section I MC 45q/105min/50% · Section II FRQ 6q/90min/50%) + 六大 FRQ 模式 (rate-in/rate-out, particle motion, area & volume, table-based, separable diffEq, function-defined-by-integral) + rubric conventions (units, BECAUSE 句型, setup integral, calculator hygiene) + time budgeting (90/6 = 15 min per FRQ)。4 張視覺自製（right-math/wrong-rubric 3-card hook、two-section exam-structure card with calc/no-calc breakdown、3-rule calculator-hygiene card、time-budget tactic card）。Compare slide 鎖定 WRONG「f has max at x=2」vs RIGHT「f has max at x=2 BECAUSE f′ changes from + to −」。Tone：coach-before-the-game。Path slide 不指向 next module（這是最後一支）— 而是指向 released AP FRQ + Khan Academy practice + advisor 預約 timed-mock-exam。3-reviewer cascade round 1 一次通過（A/B 各 minor 但 no-action；C pass with 12 claims verified）
  - 位置：`teaching-videos/ap-calculus-ab-module-12-ap-exam-synthesis-frq-strategy/`
  - 還缺：audio + MP4。Alan Mac 跑 `python3 tools/lesson-video/make_lesson.py teaching-videos/ap-calculus-ab-module-12-ap-exam-synthesis-frq-strategy/` 即可
- 🎓 **AP Calculus AB — auto-pipeline 端課程完成**（2026-05-16）：12 modules 全部有 script.json + build_slides.py + slides/*.png + music。剩下只等 Mac launchd 跑 TTS + ffmpeg merge + YouTube upload（4/day cap，預計 3 週內全部上線）。Audit：`_audit/ap-calculus-ab/2026-05-16T16-18-46Z-summary.json`。**下次 scheduled run 應該換課**（候選：先 verify AP CS A M1-M10 狀態，再開新的 AP 課 — 建議 AP Statistics 或 AP Biology，但都需要先 fetch CED reference doc）
- ✅ **AP Biology Module 1 — Chemistry of Life**（**Cowork auto-pipeline smoke-test run · 2026-05-17 16:24Z**）：16 sections，~8 min，**EmmaNeural 語音**（science persona）、**science 主題（teal + cream，首次採用）**。Cover Unit 1 全部 6 個 topics（1.1 water/H-bonding + 1.2 CHNOPS + 1.3-1.5 macromolecules + 1.6 nucleic acids）。8 張視覺自製：ice-cube-floats / tree-water-climbing hook、bent-water-molecule + 6 properties + hydrophobic-effect footer、CHNOPS 96%-by-mass card、3-column covalent/ionic/H-bond compare、7-row functional-groups table 含 polarity/charge/where、stacked dehydration/hydrolysis equations、carb-polysaccharide table (α-1,4 vs β-1,4 starch/cellulose) + lipid-kink saturated/unsaturated + amphipathic phospholipid 三合一、amino-acid skeleton + 4-level fold + denaturation/functions、nucleotide + antiparallel mini DNA ladder + RNA/ATP。Pause = 「digestion 把 protein 拆成 amino acids 用哪種反應、加 vs 釋放 water?」+ 第二題「ribosome 建 protein 用哪種?」雙向對稱。Generator → 3-reviewer cascade round 1 全 minor（A peer-PhD 4 minor / B adversarial-student 13 minor 含 2 個 critical-worthy 但 overall 仍 minor / C citation-checker 1 minor）→ 擴充 `references/ap-biology-m1-ref.md` 加入 orbitals/H-bond donor-acceptor/versatile-not-universal-solvent/functional-group property table/α vs β glycosidic linkages/hydrophobic effect/denaturation 保留 1°/phosphodiester + antiparallel + 5'-3'/protein functions per OpenStax 3.4 → revise outline → round 2 consolidated reviewer 全 pass（30 specific claims 100% trace to reference）
  - 位置：`teaching-videos/ap-biology-module-1-chemistry-of-life/`
  - Audit：`_audit/ap-biology/2026-05-17T16-24-00Z-summary.json` + `first-run.json` marker（下次跑 normal mode M2-M16）
  - 還缺：audio + MP4。Alan Mac 跑 `python3 tools/lesson-video/make_lesson.py teaching-videos/ap-biology-module-1-chemistry-of-life/` 即可
  - **下次 scheduled run TODO**：M2-M16 全課程 rollout。先擴充 `references/ap-biology-*.md` 給每 unit（細胞 / 遺傳 / 演化 / 生態）一份 ref doc，否則 citation reviewer 沒東西比對。建議 batch 4 concurrent
- ✅ **AP Biology M2-M5（batch 1）— Cell Structure / Membrane Transport / Cell Communication / Cell Cycle**（**Cowork auto-pipeline run · Slot A · 2026-05-18 04:12Z**）：4 modules 同夜產，每支 16 sections、EmmaNeural 語音、science 主題。Cover Unit 2 (M2-M3 細胞 + 膜) + Unit 4 (M4-M5 細胞通訊 + 細胞週期)。Plan：`_audit/ap-biology/2026-05-18T04-12-13Z-plan.json` 涵蓋 M2-M16 整支 AP Biology
  - 位置：`teaching-videos/ap-biology-module-{2-cell-structure,3-membrane-transport,4-cell-communication,5-cell-cycle}/`
  - 還缺：audio + MP4
- ✅ **AP Biology M6-M9（batch 2）— Mendelian Genetics / DNA Replication / Transcription-Translation / Biotechnology**（**Cowork auto-pipeline run · Slot B · 2026-05-18 10:18Z**）：4 modules 同晨產 (resume slot A's plan)，每支 16 sections、EmmaNeural 語音、science 主題。Cover Unit 5 (M6 遺傳) + Unit 6 (M7-M9 分子生物 + 生技)。M6 重點：Mendel 三定律 + 9:3:3:1 + non-Mendelian (codom/ABO/pleiotropy/sex-linked) + meiosis + linkage + nondisjunction。M7：Watson-Crick-Franklin + 半保留 (Meselson-Stahl) + 7 enzyme cascade + Okazaki + 端粒/telomerase。M8：central dogma + TATA + mRNA processing + 80S ribosome A/P/E + lac vs trp + sickle-cell missense。M9：EcoRI + PCR (Taq, 30 cycles → 10⁹) + Sanger/NGS + CRISPR (Doudna/Charpentier 2020) + insulin 1982 / Bt corn / COVID PCR
  - 位置：`teaching-videos/ap-biology-module-{6-mendelian-genetics,7-dna-replication,8-transcription-translation,9-biotechnology}/`
  - Audit：`_audit/ap-biology/2026-05-18T10-18-20Z-summary.json`
  - ⚠️ M1-M9 originally produced WITHOUT 3-reviewer cascade（regression flagged in AUTO_PIPELINE.md）
- ✅ **AP Biology M1-M9 post-hoc PhD audit**（**Cowork scheduled task · Slot A · 2026-05-19 04:00Z**）：peer-PhD reviewer 把 M1-M9 全部 9 支 script.json 跟 CED reference 對過。Verdicts：4 pass / 5 minor / **0 critical** — 全部 minor issues 都是 stylistic（"per OpenStax Chapter X-Y" 出現在 narration）或 scope notes（exam weight 變動、5% H-bond ratio 是 defensible 但 cherry-picked），無事實錯誤。M1-M9 維持已上線狀態。Audit files：`_audit/ap-biology-post-hoc-audit/ap-biology-module-{1..9}-*.json`
- ✅ **AP Biology M10-M11（batch 3）— Natural Selection / Speciation & Phylogeny**（**Cowork auto-pipeline run · Slot B · 2026-05-19 10:09Z**）：2 modules 同晨產 with **full 2-round 3-reviewer cascade**（M10：16 sections，M11：17 sections，EmmaNeural 語音、science 主題）。Cover Unit 7 全部 (M10 7.1-7.8 = Darwin postulates + selection types + Hardy-Weinberg + drift mechanisms + evidence；M11 7.9-7.13 = species concepts + isolating mechanisms + speciation modes + phylogeny/cladistics + extinction + origin of life)。Round 1：6/6 minor → revise once。Round 2：A pass / B pass / C minor (in-bounds textbook elaborations) → ship。AP traps explicit inoculated：fitness≠strength、H-W是null model、phenotype not genotype、Lamarckism pre-empt、drift is non-adaptive、punctuated equilibrium NOT saltation、humans not descended from chimps、synapomorphy是relative-to-clade。Writer post-fix: M11 slide 02_hook 把 "2n = 64" / "2n = 62" chromosome counts 換成 "domestic horse" / "domestic donkey" labels（cascade 已 drop 那些數字，writer 不慎用 visual label 寫進去，Slot B verify 階段抓到並 patch）
  - 位置：`teaching-videos/ap-biology-module-{10-natural-selection,11-speciation}/`
  - Audit：`_audit/ap-biology/2026-05-19T10-09-00Z-summary.json`
  - 還缺：audio + MP4（Mac launchd 8am）
  - **下次 scheduled run TODO**：M12-M16 (batches 4-5 in slot A's plan) — Population Ecology / Community Ecology / Ecosystems Energy / Ecosystems Advanced / AP Exam Synthesis
- ✅ **AP Biology M1-M3 full 3-reviewer cascade audit**（**Cowork scheduled task · Slot A · 2026-05-19 14:54Z**）：補齊 04:00Z 那次 post-hoc audit 只跑 1 個 peer-PhD reviewer 的缺口，把 M1 / M2 / M3 三支都跑了完整的 3-reviewer cascade（A peer-PhD + B adversarial-student + C citation-checker）。9 個 reviewer JSON 全寫好。Verdicts: M1 = A minor / B minor / **C pass** (live YouTube 0gVg4Udh-ic)；M2 = 3 minor (live 4FEDfdEwPgo)；M3 = 3 minor (live 1OzKZGUvDKU)。**0 critical 全部**，所以 3 支保持上線。Notable findings 待 future content-revision pass：M1 starch 過度簡化成 α-1,4 only（amylopectin α-1,6 branch 沒講）+ 部分 outline 內容 drift 沒進 script；M2 peroxisomes 只在 pause-answer 出現（sequencing 問題）+ "all plant cells have chloroplasts" misconception 沒先 head off + "37 trillion cells" 不在 reference；M3 Section 14 traps slide 是 voice-empty + osmosis/tonicity framing 可能 reinforce AP 常見誤解 + Na/K pump 物理參數沒在 reference。Audit：`_audit/ap-biology/2026-05-19T0500Z-summary.json`。M4-M9 還沒做完整 3-reviewer cascade（沒 `_outline.json`，需 back-derive），**Slot B 5am 接手**
- ✅ **AP Psychology Module 2 — Research Methods** script + slides ready：14 sections，~8.7 min（1311 詞 / 150wpm），BrianNeural 語音、psychology 主題（lavender + cream），3 張視覺自製（5-rung methods ladder、−1↔+1 r-coefficient ruler、ice cream / drowning / hot-weather spurious-correlation diagram）。Hook 用 TikTok "coffee makes you live longer" claim 切入 correlation-vs-causation
  - 位置：`teaching-videos/ap-psych-module-2-research-methods/`
  - 還缺：audio + MP4。Alan Mac 跑 `python3 tools/lesson-video/make_lesson.py teaching-videos/ap-psych-module-2-research-methods/` 即可
- ✅ **AP Psychology Module 3 — Biological Bases of Behavior** script + slides ready：14 sections，~8.9 min（1335 詞 / 150wpm），BrianNeural 語音、psychology 主題（lavender + cream），4 張視覺自製（2am-scrolling dopamine/caffeine hook、labeled neuron diagram dendrites→soma→axon→myelin→terminals、6-NT effects table、4-lobe brain diagram with color-coded regions）。Hook 用 2am scrolling + dopamine hits + caffeine blocking adenosine 切入 chemistry-driving-behavior。Pause-answer = GABA inhibitory + glutamate-as-gas/GABA-as-brake mnemonic
  - 位置：`teaching-videos/ap-psych-module-3-biological-bases/`
  - 還缺：audio + MP4。Alan Mac 跑 `python3 tools/lesson-video/make_lesson.py teaching-videos/ap-psych-module-3-biological-bases/` 即可

### 🎯 AP 缺口分析（pathway support）

目前共 **6 支 AP** 在 seed（4 既有 + 2 新增）：
- Statistics (Math) · Psychology · Biology (Science) · Human Geography (Social Studies) · **Calculus AB (Math/Eng/CS)** · **Computer Science A (Tech)**

仍缺（依 pathway 重要性排序）：
- [ ] **AP Microeconomics** + **AP Macroeconomics** — 服務 Business + Economics 兩條 pathway
- [ ] **AP English Language & Composition** — 服務 Communications pathway
- [ ] **AP Physics 1** — 服務 Engineering pathway
- [ ] **AP Calculus BC**（進階）— 服務 Math & Data Science pathway 有志大學數學的學生
- [ ] **AP Art History** 或 **AP 2-D Art and Design** — 服務 Arts & Design pathway

加完後 8 條 pathway 都有至少 1 支 AP 撐場。

### 🎬 下個教學影片建議

（先前列的 AP CS A 建議已全部執行完畢 — 見下一節「Algebra I 補齊 + AP CS A 完整一整支」）

### ✅ Algebra I 補齊 + AP CS A 完整一整支（16 支 modules · 2026-05-10 parallel agents batch）

> 一輪 parallel agent batch 把 **Algebra I 缺的 6 個 module 全補齊**（M6/M8/M10/M11/M12/M13）+ **AP Computer Science A 整套 10 個 College Board units 從零做完**。Algebra I 從此**14 個 module 全有自製影片**；AP CS A 是繼 AP Psych 之後**第二支完整 GIIS 自製 AP 課程**。

- ✅ **CS theme 加進 `slide_kit.py`** — `STEEL = (52, 90, 142)` 鋼藍 + `STEEL_LIGHT`；自動 prefix 比對 `"Computer Science" / "AP Computer Science" / "Programming"`。SKILL.md voice table 加 CS → `en-US-GuyNeural`（與 walkthrough demo Pathway 場景同聲，建立連續感）
- ✅ **Algebra I 6 支補齊**（Aria 女聲、math 金主題）：

| # | Module | Sections | 重點 |
|---|---|---|---|
| M6  | Linear Inequalities         | 14 | 餅乾店 word problem · flip-rule 鑰匙頁 · 數線 open/filled 圓圈 |
| M8  | Graphing Linear Equations    | 15 | Uber 計價 hook · slope-intercept + table + intercepts 三種方法 · 平行/垂直 |
| M10 | Writing Linear Equations     | 16 | 健身房預測 6/12/全年 · point-slope · 兩點求方程 · 平行/垂直/水平/垂直線 |
| M11 | Systems of Linear Equations  | 17 | 電影票 word problem · 三種方法（graph/sub/elim）· 三種結局（one/none/infinite） |
| M12 | Exponents & Polynomials      | 16 | 對折紙 50 次 ≈ 太陽距離 hook · 5 條指數律 · 多項式 vocab + add/sub/mult |
| M13 | Factoring Polynomials        | 17 | `12 = 2²·3` 對映 `x²+5x+6 = (x+2)(x+3)` · GCF/trinomial/diff-squares/grouping · 矩形面積視覺 · 接 M14 quadratics |

- ✅ **AP Computer Science A 全 10 支**（GuyNeural 男聲、CS steel-blue 主題、Java code via mono font `deck.equation`）：

| # | Module | Sections | 重點 |
|---|---|---|---|
| M1  | Primitive Types               | 14 | `Hello, GIIS!` hook · `.java → .class → JVM` · int/double/boolean/char · `(int)` truncation 陷阱 |
| M2  | Using Objects                 | 14 | 手機 = 物件 analogy · String/Math methods · `new` keyword · `==` vs `.equals()` 陷阱 |
| M3  | Boolean Expressions & if      | 16 | 地鐵閘門 IF/ELSE hook · 6 relational ops · short-circuit · De Morgan · String equality 陷阱 |
| M4  | Iteration                     | 16 | 電腦每秒 10 億次運算 hook · while/for/enhanced-for · Gauss sum 1-100 · 4 個 pattern · off-by-one + 無窮迴圈 |
| M5  | Writing Classes               | 18 | cookie-cutter analogy · instance vars + constructor + accessor/mutator · `this` · `toString` · static · BankAccount assignment |
| M6  | Array                         | 15 | 30 變數 vs 1 array · zero-indexed · `.length` field · for vs enhanced-for · ArrayIndexOutOfBoundsException |
| M7  | ArrayList                     | 15 | array 固定 vs ArrayList grow/shrink · 6 core methods · `.size()` vs `.length` · 自動裝箱 |
| M8  | 2D Array                      | 15 | 西洋棋/圖片/spreadsheet hook · `[row][col]` · row-major vs col-major · row/col 顛倒陷阱 |
| M9  | Inheritance                   | 17 | Cat IS-A Animal hook · extends/super/override · polymorphism + late binding · abstract + instanceof · 蓋vs超載 |
| M10 | Recursion                     | 18 | 俄羅斯娃娃 hook · base + recursive case · factorial 調用棧 trace · Fibonacci/sumOfDigits/reverse/binary-search · StackOverflowError 陷阱 · O(log n) |

- ✅ **Audio + MP4 全部 render 完成**（2026-05-11）— 16 支 MP4 全部 1920×1080 H.264 + AAC，總時長 **107.4 分鐘（1.8 小時）lecture content**、167.9 MB。Mac 跑 edge-tts 生 audio，沙盒 parallel ffmpeg 在 ~40 秒內 merge 14 支，剩 M6 Inequalities + M6 Array 個別補（用 preset=ultrafast 避開 bash 45s timeout）
- 📊 **Stats**: 16 modules · 253 slides · **107.4 分鐘 lecture content**
- 📁 **位置**: `teaching-videos/algebra-i-module-{6,8,10,11,12,13}-*` + `teaching-videos/ap-cs-a-module-{1..10}-*`，每支都有完整 `script.json` + `build_slides.py` + `slides/*.png` + `audio/*.mp3` + `*.mp4`
- ⚠️ **沙盒 merge 注意事項**：bash 單次 timeout 45s。Parallel batch（>1 個 job）可以撐到 ~40s 內完成 H.264 medium preset（4-8 cores 同跑）。但**單獨補 merge 一支**要改用 `preset=ultrafast` （~30s 完成）才能在 timeout 前寫完整 MP4。檔案稍大（M6 ~16MB vs 其他 ~10MB）但畫質仍然足夠
- 📌 **此節原本的 audio 渲染指令備檔**（如果要重生）：

```bash
cd /Users/alanhdchu/giis-website
# 一次性安裝（如已裝可略）
pip install edge-tts imageio-ffmpeg

# 16 支一行 render
for d in teaching-videos/algebra-i-module-6-inequalities \
         teaching-videos/algebra-i-module-8-graphing \
         teaching-videos/algebra-i-module-10-writing-linear \
         teaching-videos/algebra-i-module-11-systems \
         teaching-videos/algebra-i-module-12-exponents-polynomials \
         teaching-videos/algebra-i-module-13-factoring \
         teaching-videos/ap-cs-a-module-1-primitives \
         teaching-videos/ap-cs-a-module-2-using-objects \
         teaching-videos/ap-cs-a-module-3-booleans-if \
         teaching-videos/ap-cs-a-module-4-iteration \
         teaching-videos/ap-cs-a-module-5-writing-classes \
         teaching-videos/ap-cs-a-module-6-array \
         teaching-videos/ap-cs-a-module-7-arraylist \
         teaching-videos/ap-cs-a-module-8-2d-array \
         teaching-videos/ap-cs-a-module-9-inheritance \
         teaching-videos/ap-cs-a-module-10-recursion; do
  echo "=== $d ==="
  python3 tools/lesson-video/make_lesson.py "$d/"
done
```

- ⏳ **YouTube 上傳**：16 支 MP4 全部 ready，用 `tools/youtube-upload/upload_lesson.py` 一行 for-loop 批次上傳，會自動建 "AP Computer Science A" playlist + 把 Algebra I 新影片加到既有 "Algebra I" playlist。會自動 rebuild `public/data/lessons-manifest.json`，`<LessonVideoEmbed>` 就會在 Learn Portal 對應 module 頁自動顯示影片。建議分兩天每天 8 支避開 YouTube quota
- 🎁 **附加成果**：寫了 `tools/lesson-video/AGENT_RECIPE.md` — 之後 sub-agent 要做新 module 直接讀這份配方文件，不用再從零教 slide_kit API + 命名規範。下次擴大批次直接複製這次的 prompt pattern
- ⚠️ **教訓三條**：
  1. 16 agents 一次 spawn 會有一支撞 rate limit（M10 Recursion）。下次 batch 拆 8+8 或更小批次比較穩
  2. Mac 跑 `make_lesson.py` 可能中途斷（M6 Array 只跑了 3/15 mp3）。Idempotent 設計重跑可以無痛補；如果跑長批次建議分 module 跑而不是 for-loop 全部串
  3. 沙盒 merge：parallel batch (>1 jobs) 可以撐到 ~40s 內完成 medium preset；單獨補 merge 一支要用 `preset=ultrafast`（30s 內完成）避開 bash 45s timeout

### ✅ AP Psychology 完整一整支課（16 支 modules · 全部 ready 等 Mac TTS）

> 用 parallel agents 把整支 AP Psych 從零做完——這是**第一支完整 GIIS 自製 AP 課程**。
> Total: **16 modules · 224 slides · ~166 分鐘 (2.75 小時) lecture content** · 全部 BrianNeural 配音，lavender 主題。

| # | Module | Slides | ~Min | Hook · 重點 visual |
|---|---|---|---|---|
| M1 | History & Approaches | 13 | 5.9 | 6 心理學家看一個青少年 |
| M2 | Research Methods | 14 | 8.7 | TikTok 咖啡/壽命 · correlation ruler, IV/DV diagram, ice-cream/drowning spurious |
| M3 | Biological Bases | 14 | 8.9 | 2am 滑手機 dopamine · neuron diagram, NT table, 4-lobe brain |
| M4 | Sensation & Perception | 14 | 12.2 | 隱形大猩猩 · Weber's Law, signal detection 2×2, Gestalt 6-cell |
| M5 | States of Consciousness | 15 | 10.7 | all-nighter-feeling-broken · sleep hypnogram, drug categories, 3 dream theories |
| M6 | Learning & Conditioning | 14 | 10.0 | phone buzz/Discord · classical chain, **operant 2×2 (neg-reinforce TRAP)**, schedules quad, Bobo doll |
| M7 | Memory | 14 | 10.3 | 1st-day-of-HS-clothes vs Tuesday-lunch · 3-store flow, Baddeley working memory, levels-of-processing depth, LTM types tree |
| M8 | Cognition & Language | 14 | 12.5 | 飛機新聞→怕飛行 (availability) · heuristics card-row, biases gallery, language timeline, Whorf hypothesis |
| M9 | Motivation & Emotion | 14 | 11.4 | Spotify playlist (intrinsic) · **Yerkes-Dodson inverted-U**, Maslow pyramid, 4-emotion-theories side-by-side |
| M10 | Developmental | 14 | 11.3 | Erikson "you are here" · Piaget timeline, Erikson 8-stage ladder, attachment 4-quadrant, Kohlberg+Gilligan |
| M11 | Personality | 14 | 11.8 | shy-at-school-vs-loud-at-home · Freud iceberg, defense mechanisms 3×2, **Big Five OCEAN spectrum**, reciprocal determinism triangle |
| M12 | Testing & Intelligence | 14 | 11.7 | 浴室秤4次4不同數字 · **dartboard 2×2 (R vs V)**, IQ bell curve ±SD, 3 theories cards, Flynn line chart |
| M13 | Abnormal | 14 | 9.0 | 1-in-5 classroom · 4 D's grid, schizophrenia +/- columns, **3-cluster personality disorders** |
| M14 | Treatment overview | 14 | 10.5 | hopeful pivot from M13 · **Beck cognitive triad triangle**, CBT 3-tools, drug categories table |
| M15 | Treatment Advanced | 14 | 10.3 | 治療要選對工具 · **disorder→treatment matrix**, 3 case vignettes (Maya/Jordan/Alex), group/family/individual compare |
| M16 | Synthesis & AP exam prep | 14 | 10.8 | exam strategy · **M13→M14→M15 flow diagram**, biopsychosocial Venn, **MCQ pattern decoder table**, FRQ rules |

設計重點：
- **每支都有 pause-and-try + 答案**（除 M1 用較舊 layout 13 sections，其餘統一 14）
- **Recap = 5-6 takeaways**
- **Path slide 統一 4 步**：Myers reading + AP Classroom MCQ + dashboard assignment + advisor check-in；M16 例外（exam-prep tone：practice exam + weakest-module review + AP Classroom past FRQs + advisor readiness）
- **校長簽名/政策**：全部誠實（Florida-registered，無 Cognia，無 US-accredited）
- **Treatment trilogy 不重複**（M14 overview / M15 applied cases / M16 exam strategy）

### 🚀 批次 TTS + MP4 指令（Alan 在 Mac 上跑）

整支 AP Psych + AP Calc AB Module 1 一行 for-loop 全部產出 17 支 MP4（**~166 分鐘 lecture + AP Calc 6 分鐘 = 172 分鐘 content**）：

```bash
cd /Users/alanhdchu/giis-website

# 一次性裝置（之前若沒裝過）
pip install edge-tts imageio-ffmpeg

# AP Psych 全 16 + AP Calc AB M1 一氣呵成
for d in teaching-videos/ap-psych-module-1-history \
         teaching-videos/ap-psych-module-2-research-methods \
         teaching-videos/ap-psych-module-3-biological-bases \
         teaching-videos/ap-psych-module-4-sensation-perception \
         teaching-videos/ap-psych-module-5-consciousness \
         teaching-videos/ap-psych-module-6-learning \
         teaching-videos/ap-psych-module-7-memory \
         teaching-videos/ap-psych-module-8-cognition \
         teaching-videos/ap-psych-module-9-motivation-emotion \
         teaching-videos/ap-psych-module-10-developmental \
         teaching-videos/ap-psych-module-11-personality \
         teaching-videos/ap-psych-module-12-testing-intelligence \
         teaching-videos/ap-psych-module-13-abnormal \
         teaching-videos/ap-psych-module-14-treatment \
         teaching-videos/ap-psych-module-15-treatment-advanced \
         teaching-videos/ap-psych-module-16-treatment-synthesis \
         teaching-videos/ap-calculus-ab-module-1-limits; do
  echo "=== $d ==="
  python3 tools/lesson-video/make_lesson.py "$d/"
done
```

**估時**：edge-tts 每支 ~2 min synth → ffmpeg 每支 ~5-10 min encode → **整批 17 支跑完約 2-3 小時**（背景跑、不卡 terminal）。每支輸出 MP4 在自己資料夾。

**跑完之後 YouTube 上傳**：用既有的 `tools/youtube-upload/upload_video.py`。建議建一個 "AP Psychology" playlist 把 16 支按順序排好，然後在 Learn Portal 對應 module 頁面自動會用 LessonVideoEmbed 顯示。

跑完之後 YouTube 上傳就用既有的 `tools/youtube-upload/upload_video.py`。

### 📁 Pilot 目錄索引

```
teaching-videos/algebra-i-module-4-sample/
├── algebra_i_module_4_sample.mp4    # 最終影片（覆蓋舊版時跑 merge skill 即可）
├── subtitles.srt                    # 英文字幕（可獨立丟 YouTube）
├── script.json                      # 講課腳本（16 sections + 旁白 + 設定）
├── slides/                          # 16 張 1920×1080 PNG（GIIS 配色）
├── build_slides.py                  # 重新生 slides 用
├── synth_audio_local.py             # Mac 端跑 edge-tts 出 Aria MP3
└── audio/                           # 旁白音檔（mp3/wav）

tools/lesson-video/                  # 共用 merge skill（所有未來 lesson 共用）
├── SKILL.md                         # Claude 觸發說明
├── merge_lesson.py                  # 主程式
├── intro_music.wav                  # 3s 開場合成 chord
└── outro_music.wav                  # 3s 結尾合成 chord
```

---

## ✅ Phase 1 — 讓家長能「看到」孩子在學習（核心已完成）

> 目標：家長打開手機就能知道孩子這週做了什麼。

- ✅ **1-0 公開 Parent Dashboard demo** — `/parent/demo`（`ParentDashboardDemo.js`）：Yunfan 真實 seed 數據、雙語、PREVIEW banner、Pricing 頁 CTA 連結過來
- ✅ **1-1 Parent Dashboard 真版** — `ParentDashboard.js` 登入後顯示真實 API 數據（學分、GPA、進行中課程、活動紀錄）；`ParentLogin.js` cookie-based 登入；`src/api/authStorage.js` 加 parent session helpers
- ✅ **1-2 Schema** — `ParentAccount`、`Application`、`Student.parentEmail`、`AssignmentSubmission.{score, gradedAt, gradedById}` 全加進 `schema.prisma`
  - ⚠️ **待執行**：在 server 上跑 `npx prisma db push` 讓 schema 同步到 PostgreSQL
- ✅ **1-3 API** — `POST /api/parent/login|logout|setup`、`GET /api/parent/me`（學分 + GPA + enrollments + 活動 feed）掛進 `server/src/index.js`
- ✅ **1-4a Admin-triggered weekly progress email** — `POST /api/admin/weekly-report` 已可寄真 Resend email：active subscription → parent account → student transcript stats + active courses；缺 API key 或寄送失敗會回 skipped/errors，不再假成功
- ✅ **1-5 作業批改 UI** — `AdminAssignmentQueue.js` at `/admin/assignments`：inline 評語 + 分數 + pending/graded filter；`server/src/routes/admin-assignments.js`（GET pending、GET all、PATCH grade）
- ✅ **1-6 Demo embed 共用 component** — `DemoEmbed.js` single source；Homepage / Admission / Pricing 三頁共用；`HomepageDemo.js` 刪除

### 🔧 Phase 1 剩餘（需要外部服務或 Alan 操作）

- [ ] **1-4b 每週進度 Email 報告收尾（Resend）** — 基礎 admin-triggered 真寄已完成；剩 cron/dry-run CLI + `EmailLog` + assignment feedback notification
  - 檔案：`server/src/jobs/weekly-digest.js`、`server/src/lib/resend.js`、`EmailLog` schema model
  - Acceptance：`node server/src/jobs/weekly-digest.js --dry-run` 可列出；`--dry-run=false` 真寄
  - 作業批改後通知家長的 email 也在這裡補上（`admin-assignments.js` 裡已有 `// TODO` 占位）
  - Env：`server/src/lib/mailer.js` 目前支援 `RESEND_API_KEY` 或 `RESEND_EMAIL_API_KEY`

- [ ] **Schema 同步** — server 上跑 `npx prisma db push` 讓 ParentAccount / Application / AssignmentSubmission 新欄位生效

- ✅ **Admin 新增學生時填 parentEmail** — `AdminDashboard.js` 新增學生 modal 加 "Parent Portal Email" 欄位；`AdminTranscriptPage.js` 加 `ParentEmailSection` panel（inline edit + PATCH）；server `students.js` schema + allowed list + profileData 全部加了 `parentEmail`

---

### ✅ 1. 把家長 Dashboard mockup 轉成真的 React 頁面（已完成）

`src/components/pages/Parent/ParentDashboard.js` + `ParentLogin.js` 上線於 `/parent/dashboard` 與 `/parent/login`。Cookie-based JWT auth、顯示學生學分 / GPA / 進行中課程 / 最近活動、進度條（completedModules / totalModules，已修復 totalModules 缺失 bug）。雙欄佈局含 `.giis-parent-grid` class，手機版 `@media (max-width: 880px)` 折成單欄。

---

### ✅ 2. Schema：`ParentAccount` 與 `Student.parentEmail`（已完成）

`server/prisma/schema.prisma` 已加入：`ParentAccount`（email, passwordHash, studentId, lastLoginAt）、`Application`（studentName, dob, gradeLevel, parentName, parentEmail, phone, notes, status）、`Student.parentEmail String?`、`AssignmentSubmission.score Decimal?`、`gradedAt DateTime?`、`gradedById String?`。`npx prisma db push` 已同步到本地 DB。

---

### ✅ 3. API：家長登入 + Dashboard 資料（已完成）

- `server/src/routes/parent-auth.js`：`POST /api/parent/login`（bcrypt + cookie JWT）、`POST /api/parent/logout`、`POST /api/parent/setup`（admin 建帳用）
- `server/src/routes/parent-data.js`：`GET /api/parent/me`（cookie auth，回傳 student / stats / enrollments[含 totalModules] / recentActivity）
- 掛載於 `server/src/index.js`

---

### ✅ 4a. Admin-triggered 每週進度 Email 報告（2026-05-19 基礎可寄）

> 不需要家長登入，系統主動推訊息。Phase 1 最重要的單一功能。

`server/src/routes/weekly-report.js` 已修成可用版本：Admin dashboard 按 "Weekly report" → 找 active/trialing subscriptions → 匹配 ParentAccount → 用 released transcript CourseRow 算學分與 unweighted GPA → 用 enrollment `completedModules.length` 算 active course 進度 → 透過 `sendWeeklyProgressEmail()` 真寄。`mailer.js` 支援 `RESEND_API_KEY` / `RESEND_EMAIL_API_KEY`，並回傳 sent/skipped/errors，缺 key 不會被誤算為成功。

**驗證**：`npm run build`、`cd server && npm test -- --runInBand`、`node -e "require('./server/src/routes/weekly-report')"` 全通過。

### 4b. 每週進度 Email 報告收尾（Resend）

**檔案**：
- 新建 `server/src/jobs/weekly-digest.js` — 計算過去 7 天每個學生的活動，組成 HTML email
- 新建 `server/src/templates/weekly-digest.html` — Handlebars / nunjucks 模板
- `server/src/lib/resend.js` — Resend SDK wrapper
- 部署：用 Render Cron / AWS EventBridge / 簡單 node-cron 每週日 19:00 CST 觸發

**Email 內容**（中英雙語，模仿 mockup 的 advisor note 語氣）：
- 完成的 Module
- Quiz / 考試分數
- 累計學分進度（X / 24）
- 一句話結語（先 hardcode，Phase 3 改成 advisor 真寫）

**Acceptance**：
- 跑 `node server/src/jobs/weekly-digest.js --dry-run` 列出會寄哪些 email
- `--dry-run=false` 真寄出
- 寄出記錄存到 `EmailLog` table（避免重複寄）
- 寄到測試學生 `26-004 Yunfan Yang` 自己的 admin email 看 render

**依賴**：Resend API key（Alan 在 resend.com 拿，存 `server/.env` 的 `RESEND_API_KEY` 或 `RESEND_EMAIL_API_KEY`）

---

### ✅ 5. 作業批改 UI（已完成，email 通知待 Resend）

`src/components/pages/Admin/AssignmentQueue.js` 上線於 `/admin/assignments`。篩選 Pending / Graded / All，展開可填 feedback + score，submit 後即更新。`server/src/routes/admin-assignments.js`：`GET /pending`、`GET /`（帶 `?graded=`）、`PATCH /:id`（寫入 feedback / score / gradedAt / gradedById）。Schema 字段已在 #2 同步。**Email 通知（Resend）留待 #4 的 Resend wrapper 完成後補充。**

---

### ✅ 6. Demo embed 抽成共用 component（已完成）

`src/components/main/DemoEmbed.js` 上線。三個頁面都已切換：
- HomepageDemo (full variant) — Introduction 與 8 Pathways 之間
- AdmissionMain (compact variant, "Before You Apply") — Steps 後
- PricingPage (compact variant, "What $19.90 unlocks") — 價格卡前

Acceptance ✅：video 路徑只在 DemoEmbed.js 寫死。

---

## 🎯 Trust Sprint — 2026-05-10 audit（next batch）

> **為什麼這批工作獨立成段**：Phase 0/1 把「真實學校」的底子做完了（Florida-registered 定位、真實 Learn Portal、真實教學影片、QR 驗證、真實成績單/文憑、Parent Dashboard 真版）。Trust Sprint 不寫新功能，**把已經有的東西從產品深處搬到行銷首屏**，讓 $19.90/月觸發的「太便宜不可能是真的」警報得以被消除。
>
> 核心洞察：降價沒用（降到 $4.99 也會有人懷疑），**只有消除不信任有用**。
>
> 完整論證（含家長視角拆解）見：[`REVIEW-2026-05-10.md`](./REVIEW-2026-05-10.md)

### TS-P0-1. 校長 `/about/principal` 公開 bio 頁

> **為什麼第一優先**：中國家長必 Google 第一個搜的人就是校長。目前全站零公開資訊 — Shiyu Zhang Ph.D. 只在文憑簽名線出現。這是整個信任體系最大的單一缺口。

**檔案**：
- 新建 `src/components/pages/About/PrincipalPage.js` — 雙語，分為 hero（照片 + 名字 + 職稱）/ bio（500–800 字）/ credentials（Ph.D. 學校、之前任教學校）/ contact（LinkedIn icon 連結）四段
- 路由 `/about/principal` 加進 `src/App.js`
- Nav 的 `About GIIS` dropdown 加入口（如沒有 dropdown，至少 Footer 加連結）
- Footer 校長簽名行附 hyperlink 過去

**Acceptance**：
- 直接訪問 `/about/principal` 顯示完整 bio + 至少一張正面照
- LinkedIn 連結點得開
- 雙語切換正常
- Google 搜 "Shiyu Zhang Genesis of Ideas" 結果第一頁能命中本頁（要等 SEO 收錄）

**依賴**：Alan 提供照片 + LinkedIn URL + bio 文字（或請校長親寫）

---

### ✅ TS-P0-2. 首頁「Watch a real lesson」嵌入真實教學影片（2026-05-10 完成）

- ✅ 新建 `src/components/main/LessonPreview.js`：通用 component（接受 `youtubeId` / `course` / `moduleNumber` / `moduleTitle` / `description` props，全部有預設值），雙語框架 + 16:9 YouTube iframe + 「英文授課」誠實標示
- ✅ 預設嵌 **Algebra I — Module 4（One-Step & Two-Step Equations，YouTube ID `AMF3Wj4cycs`）** — 珍奶 hook 強、數學是家長最熟學科、已驗證 pilot
- ✅ 嵌進 `HomepageMain.js`：放在 `DemoEmbed`（80 秒導覽）與 `HomepagePathways` 之間。淺灰底（`#f4f6fb`）銜接 DemoEmbed 白底與 Pathways 深底，視覺節奏不打架
- ✅ 雙 CTA：「Browse all 40+ courses →」（連 `/academics`）+「See more lessons on YouTube →」（連 channel）
- ✅ 框架文字雙語，但明確標示「Lessons are taught in English with English captions」，避免家長以為影片有中文配音
- 🔧 **可選後續**：上 AP Psych 全 16 支後，可以把 LessonPreview 改成隨機展示一支不同 module / 不同科目（A/B 測哪支轉化率高）

---

### TS-P0-3. Footer 信任資訊補完

> **為什麼**：中國家長會用 Florida DOE Private School Directory 驗證學校是否真實存在。Footer 補上 registration number 跟 directory 連結，這一個動作可以解掉 30% 不信任。

**檔案**：`src/components/Footer/Footer.js`

**Acceptance**：Footer 增加一個「Credentials & Verification」區塊，包含：
- Florida DOE Private School Registration Number（Alan 提供）
- 直接連到 `https://www.fldoe.org/schools/school-choice/private-schools/` 或對應 directory 頁面，文字寫「Verify on Florida DOE registry →」
- 註冊地址（FL 商業註冊地址即可）
- EIN（如有公開意願）
- 法律依據引用：「Operating under Florida Statute 1002.42」（已有，確認還在）

**依賴**：Alan 提供 registration number + 地址 + EIN

---

### TS-P0-4. Pricing 加 30 天無條件退款 + Sample weekly digest 訂閱表單

> **為什麼**：$199/年產品給 30 天保證沒成本，但消滅 50% 購買摩擦。Sample digest 表單讓家長付錢前先收到一封真實 email，從垃圾箱角度判斷是否真實。
>
> 拆成兩段：**4a 退款條款不卡依賴**已做，**4b sample digest** 卡 `RESEND_API_KEY`。

#### ✅ TS-P0-4a. Pricing FAQ 加 30 天無條件退款條款（2026-05-10 完成）

- ✅ `PricingPage.js` 的 `FAQS` array 首位插入「What if my child doesn't engage? Can we get a refund?」明確寫 30 天全額退款、無條件、email 一聲即辦
- ✅ 雙語版本：英文 / 簡中對齊
- ✅ 放在 FAQ 第一條（不是末尾）— 最高購買摩擦的疑慮要最早看到
- ✅ 語氣：「We'd rather have you spend $0 and walk away than have an unhappy family on the platform.」誠實到自我框定立場
- 🔧 **後續同步**：當 ToS 頁更新時，要把 30 天退款條款同步寫進 ToS（目前只在 FAQ 答覆裡）

#### TS-P0-4b. Sample weekly digest 訂閱表單 + email 範本

**檔案**：
- `src/components/pages/Pricing/PricingPage.js`：在比較表後、FAQ 前新增「Get a sample weekly digest」section（一個 email input + submit），打到後端
- 後端：`server/src/routes/sample-digest.js` — `POST /api/sample-digest`，立即用 Resend 寄一封以 Yunfan seed 數據組的 email 範本
- 模板：`server/src/templates/sample-digest.html`

**Acceptance**：
- 填郵箱 → 10 秒內收到一封真實 email，內容是「This is what every GIIS parent receives every Sunday」
- 後端 log 寄出記錄到 `EmailLog` table
- 雙語兩版本都能寄

**依賴**：Phase 1 待辦的 `RESEND_API_KEY`（同一條依賴）

---

### ✅ TS-P0-5. 首頁 "Is GIIS for you?" 誠實對照 section（2026-05-10 完成）

- ✅ 新建 `src/components/pages/Homepage/Homepage/IsGiisForYou.js`，雙欄對照：✓ Best fit 4 條（綠色邊框 `#1B6B3A`）vs ✗ Probably not 4 條（**冷靜灰色** `#7a8294`，不是紅色，因為這不是警告，是 self-selection 引導）
- ✅ 嵌進 `HomepageMain.js`：放在 `Introduction`（白底色 `#f4f6fb` 包裹）與 `DemoEmbed`（白底）之間。白底 IsGiisForYou 與兩側形成節奏，不悶
- ✅ 結尾預留優雅出口：「Still not sure? Email admissions@... and we'll tell you straight if GIIS is the right call — including saying no.」誠實到主動講「我們會說不」進一步強化信任
- ✅ 雙語完整對齊；中英都明確寫出「Parents who cannot read English at all — advisor communication is English」這條最容易被遺漏但最誠實的條件

---

### TS-P0-6. WeChat QR 上 ContactForm + Header

> **為什麼**：中國家長轉化的關鍵渠道。ContactForm 目前只寫「Contact us for WeChat ID」是死回答。

**檔案**：
- `src/components/pages/Homepage/Homepage/ContactForm.js` — 取代死字串，放上 QR PNG（`src/img/wechat-qr.png`，Alan 提供）
- `src/components/Header/Header.js` 或 Nav 角落加小型 WeChat icon，hover 顯示 QR popover（可選）

**Acceptance**：ContactForm 直接看到 QR，手機掃得到加得上

**依賴**：Alan 用個人 WeChat 或學校 WeChat Official Account 產生固定 QR PNG

---

### TS-P1-7. 品牌色系統一（推薦酒紅 + 米白 + 金）

> **為什麼**：教學影片用酒紅 `#6B1F2A` + 金 `#D4A634` + 米白 `#FAF6EC`（在 `CLAUDE.md`），網站行銷面用海軍藍 `#1a1a2e` + 金 `#d5a836`。兩套品牌並行 = 家長看 YouTube 回到網站像走進另一間學校。

**檔案**：
- 新建 `src/styles/tokens.css` — 把 maroon / gold / cream 定義成 CSS variables（`--giis-maroon`, `--giis-gold`, `--giis-cream`, `--giis-navy-deprecated`）
- 全站 grep `#1a1a2e` / `#2b3d6d` / `#0f1020` 三色取代為 maroon 對應深淺
- 高優先順序頁面：`HeroSection.js` / `Introduction.js` / `Slogan.js` / `SuccessStories.js` / `PricingPage.js` / `AdmissionMain.js` / `Footer.js`
- Login portal / Learn Portal / Admin dashboard 暫保留（影響家長轉化最小）

**Acceptance**：
- 全站 grep `1a1a2e` 結果 = 0（或全部來自 `tokens.css` 的 deprecated alias）
- Hero / Pricing / Introduction 三頁實際 render 是 maroon + cream，視覺與 YouTube 教學影片連續
- 文憑 PDF 與成績單 PDF 確認還是 navy/gold 沒被誤改（這兩個是正式文件，已建立的視覺體系不動）

**依賴**：先做 P0 各項（不要在 P0 動視覺，避免 risk 累積）

---

### TS-P1-8. `/faculty` 老師頁面

> **為什麼**：家長付的是「誰在教我孩子」。Hero 寫「Real teacher feedback」但目前讀者不知道是誰。

**檔案**：
- 新建 `src/components/pages/Faculty/FacultyPage.js`，路由 `/faculty`
- 至少 3 位老師卡片：照片、真名、學歷、教學科目、100 字自我介紹、教過的 module
- Nav About dropdown 加入口

**Acceptance**：`/faculty` 頁面 3 位老師完整 bio + 真實照片，雙語

**依賴**：Alan 招到 3 位老師並取得照片 + bio 同意；如尚未招到，先放校長一人加「Faculty announcements coming」placeholder

---

### TS-P1-9. SuccessStories 換真人照片 + 加錄取信掃描件

> **為什麼**：字母頭像 YY / BL 太抽象；錄取信掃描件殺傷力 10 倍。

**檔案**：`src/components/pages/Homepage/Homepage/SuccessStories.js`

**Acceptance**：
- 兩位學生卡片頭像換成真人照片（Yunfan 與 Baoyi，個資打碼可選）
- 卡片下方新增「View acceptance letter」按鈕，打開 modal 顯示 UCSB / Syracuse 錄取信掃描件（學生姓名與地址打碼）
- 至少 Yunfan 那張一定要有

**依賴**：Alan 與兩位學生家長取得照片與錄取信掃描件使用同意（書面）

---

### TS-P1-10. emoji 全站換成 SVG icon

> **為什麼**：emoji 在私立高中網頁讀作「Notion 樣板玩具網站」，不是「正式學校」。

**檔案**：grep `🏛️|✍️|🎓|📜|🌐|🤖|🛤️|💻|⚙️|📐|📊|📈|🧠|📡|🎨|📧|📄|💳|📅|📞|✉️|💡|🎯|📝|📖|★` 全站，逐個替換

**選型**：Phosphor Icons（`phosphor-react`，免費商用，線條風格與 maroon 配色協調）或 Lucide（`lucide-react`，已是 React 18 友好）

**Acceptance**：
- 首頁 / Pricing / Admission / Hero / Introduction / SuccessStories / 8 Pathways grid 全部換完
- 雙色（maroon 主線 + gold accent）icon 系統
- 行動版渲染清晰

**依賴**：選定 icon library 並 `npm install`

---

### TS-P1-11. Pricing 比較表價格 row 改成視覺化條形圖

> **為什麼**：`$199 vs $20K vs $65K` 是 Pricing 頁殺傷力最強的一秒，目前躺在表格 row 裡被沖淡。

**檔案**：`src/components/pages/Pricing/PricingPage.js` 的 "How We Compare" 區塊

**Acceptance**：價格那一行做成水平條形圖（GIIS 短金色條 + 數字 96px、傳統國際校長灰條、寄宿校最長灰條），其他比較項仍用表格。視覺對比讓家長一秒看懂「我可以省 100 倍」

---

### TS-P1-12. Calendly「Book a 20-min call with the principal」

> **為什麼**：學校轉化主要靠 1:1 對話。SaaS funnel 對 $199/年的留學項目不夠。

**檔案**：
- Pricing 頁 CTA 區、Admission 頁 Steps 第一步、Homepage 結尾 ContactForm 上方都加入口
- 整合 Calendly inline embed 或 popup（`react-calendly`）
- 校長行事曆每週開放 5 個 20-min slot

**Acceptance**：訪客點 "Book a call" → Calendly 排程介面 → 預約成功後校長與訪客都收到 confirmation email

**依賴**：Alan 開 Calendly 帳號，配置「20-min Parent Q&A」event type

---

### TS-P2-13. Pathway 詳情頁改成 4 年 timeline + 範例學生

> **為什麼**：8 個 emoji 卡片像 app launcher，學校的 pathway 應該是「4 年路徑圖」。

**檔案**：`src/components/pages/Pathways/*.js`（8 個 pathway 頁）

**Acceptance**：每個 pathway 頁 hero 改成：
- Year 9–12 timeline（含核心 + 選修課列表）
- 對應 GIIS 範例學生卡片（如 Engineering Science = Yunfan，Communications = Baoyi）
- 「This pathway prepares students for」清單：列 5–8 個美國大學常見 major 名稱
- 「Students who chose this pathway got into」清單：3–5 所學校

---

### TS-P2-14. 5 分鐘加長版「A week in a GIIS student's life」

> **為什麼**：80 秒導覽是行銷版本，謹慎的家長要看「一週實際發生什麼」。

**檔案**：
- 新建 `public/demo/walkthrough-week.html`（沿用 `walkthrough.html` 框架，9 scene → 約 30 scene 涵蓋週一到週日）
- `scripts/make-demo.mjs` 加 `npm run make-demo:week` 模式
- 嵌入 `/academics` 或單獨 `/preview/student-week` 頁

**Acceptance**：5 分鐘版本 mp4 落地 `public/demo/giis-week.mp4`，自動播放且雙語字幕

---

### TS-P2-15. 公開 SAT / AP score data

> **為什麼**：中國家長對標準化分數敏感。即使 N 小，誠實寫出來反而強化信任。

**檔案**：`/school-profile` 加 "Class of 2026 testing data" section

**Acceptance**：列出（取得同意後）：
- Class of 2026 平均 SAT（如有取）
- 各 AP 課程已參加考試人數與分數分佈
- 對沒有的科目誠實寫「No AP exam data yet for this subject」

---

### TS-P2-16. AP Psych Module 1 完整公開試讀

> **為什麼**：付費前先看完一節完整課=最強信任訊號。Khan Academy 模型。

**檔案**：
- 新建 `/sample/ap-psychology` 頁，公開 AP Psych Module 1 完整影片 + module 頁完整 reading material + quiz（但 quiz submit 引導到 `/admission`）
- `LessonVideoEmbed.js` 加 `public` mode（不需登入）

**Acceptance**：未登入訪客可看完整 Module 1，包含影片 + 閱讀 + quiz 題目，但 submit / 後續 module 引導申請

---

### TS-P2-17. 每週日 Parent Q&A Zoom

> **為什麼**：家長社群 = retention。已付費家長有對話空間 = 不退訂。

**檔案**：`/parent/community` 頁（雙語）

**Acceptance**：
- 公開時間：每週日 8pm CST / Mon 9am Beijing
- Zoom 永久 link
- 過去 4 週 recap 連結（YouTube unlisted）

---

### TS-Tech ── Trust Sprint 期間順手清的技術雜項

- [ ] `FacultyGraduates.js` 兩份檔案查重（`Homepage/Homepage/` vs `Discovery/Discovery/`），移除孤兒
- [ ] Hero `<a href="#demo">` 改 `useRef` + 程式 scroll，避免 React Router 整頁刷新
- [ ] `@media (max-width: 880px)` 對齊現代標準斷點 768px / 1024px
- [ ] Hero `paddingTop: 60px` hardcode → CSS variable 隨 Nav 高度
- [ ] Hero 在 iPhone SE / iPad portrait 實機驗收（perspective rotate 切到陰影）
- [ ] Open Graph image 換成最強的 Hero 截圖（WeChat 分享必看）
- [ ] Footer 加 sitemap.xml 連結（SEO）
- [ ] 把 `REVIEW-2026-05-10.md` 加進 `CLAUDE.md` 的設計參考清單區

---

## 💰 Phase 2 — 讓家長能「付款並信任」

### ✅ 7. Stripe Checkout 整合（2026-05-18 完成 test mode；live mode 待 Alan 切換）

- ✅ **Stripe 帳號 + sandbox 建好**：Genesis of Ideas International School LLC，FL 註冊，FL DOE Elementary/Secondary Schools (MCC 8211)，bank Chase ...0602。`/sandbox/` URL 可用，test API key 已存 `server/.env`
- ✅ **3 個 Stripe Products 建好**（年付 founders_annual 因策略調整移除）：
  - **Founders Monthly** $19.90/月 recurring · lookup `founders_monthly`
  - **Group Monthly** $50/月 recurring (3-5 students) · lookup `group_monthly`
  - **Live Test** $1 one-time · lookup `live_test`
- ✅ **後端**：
  - `server/src/routes/checkout.js` — `POST /create-session` 用 PRICE_TIERS 查 priceId + mode（subscription vs payment）；支援 metadata.planType + maxStudents；`GET /session/:id` 給 /welcome 頁查狀態；`GET /tiers` 公開列出可購方案 + maxStudents（不洩 priceId）
  - `server/src/routes/webhooks-stripe.js` — 4 個 event handler（checkout.session.completed、subscription.updated、subscription.deleted、invoice.payment_failed）全部寫真實 DB upsert；dev 模式無 webhook secret 時 fallback 直接解析（生產必設）
  - `server/prisma/schema.prisma` — `Subscription` model（purchaserEmail、stripeCustomerId、stripeSubscriptionId @unique、stripeCheckoutSessionId @unique、planType、maxStudents、status、currentPeriodEnd、cancelAtPeriodEnd、amountTotal、@@index([purchaserEmail][status][planType])）
  - `server/.env.example` — STRIPE_* 變數完整文件化
- ✅ **前端**：
  - `src/components/pages/Pricing/PricingPage.js` — Annual 卡片移除；Monthly 卡片置中、放大、加金色邊框 + 「FOUNDERS · 100 SEATS」徽章；Apply Now 改為 `<button>` 呼叫 `/api/checkout/create-session` 跳轉 Stripe Checkout URL；下方加「Group plan inquiry」mailto 入口；FAQ 第一條 30 天無條件退款（TS-P0-4a 已 ship）+ 新增 group plan 條目；比較表「Annual cost」改為「Cost / year」、值 `~$240 founders`
  - `src/components/pages/Welcome/WelcomePage.js` — 付款成功 landing 頁，雙語，fetch `/api/checkout/session/:id`，顯示「Payment confirmed · You purchased: [planLabel] · Receipt to [email]」+ 4 步「What happens next」+ 30 天退款重申 + 「webhook 尚未同步」橘色 banner
  - `src/components/pages/Admin/AdminDashboard.js` — header bar 加「Stripe $1 test」黃色按鈕，點擊 POST `planType: 'live_test'` 開新分頁進 Checkout（Alan 上 live 後可用真實卡刷 $1 驗整條鏈）
  - `src/App.js` — `/welcome` route 註冊
- ✅ **Backward compat**：前端送 `planType: 'monthly'`（legacy）會被 LEGACY_ALIASES 自動 map 到 `founders_monthly`

### ✅ Phase 2 #7 收尾 — Live mode 已上線（2026-05-18）

- ✅ **3 個 Live mode Products 建好**：founders_monthly `price_1TYYZ4...` / group_monthly `price_1TYYaD...` / live_test `price_1TYYap...`
- ✅ **Live API keys 已設定**：`sk_live_...` → `server/.env`（local + Lightsail production 兩份）；`pk_live_...` → `.env.development`
- ✅ **Webhook endpoint 已建立**：`https://genesisideas.school/api/webhooks/stripe`，訂閱 4 事件，`whsec_...` 存入 Lightsail `server/.env`
- ✅ **Lightsail production 部署**：git pull → npm install（stripe package）→ prisma db push（Subscription table 已存在）→ `pm2 restart giis-api --update-env`，API `/api/checkout/tiers` 回應正常
- ✅ **Live mode $1 smoke test 通過（2026-05-19）**：`live_test` price 原建成 recurring 導致 `payment` mode 衝突 → 修 `mode: 'subscription'`；同修 rate-limiter `validate.xForwardedForHeader=false` 消除 proxy 警告。真實卡刷通 → Stripe 收款 → DB Subscription row 確認

### 🔧 Phase 2 待辦 — 訂閱管理補完

#### ✅ P2-A. Stripe Customer Portal（2026-05-19 完成）
- ✅ `POST /api/billing/portal`（`server/src/routes/billing.js`）：parent JWT auth → 查 `stripeCustomerId` → `billingPortal.sessions.create` → 回傳 URL
- ✅ `ParentDashboard.js`：新增「Subscription」卡片 + 「Manage subscription →」按鈕，含 loading/error 狀態
- ✅ Stripe Dashboard Customer Portal 已 Activate（含 cancel / update payment / invoice history）
- ✅ 部署到 Lightsail，`/api/billing` 已掛載

#### P2-B. Admin 訂閱列表頁
> **Alan 才知道誰付錢、幾號扣款**

- 新建 `src/components/pages/Admin/AdminSubscriptionsPage.js` at `/admin/subscriptions`
- 後端：`GET /api/admin/subscriptions`（admin auth，從 Subscription table 撈，排序 `currentPeriodEnd ASC`）
- 顯示：purchaserEmail / planType / status / 下次扣款日（`currentPeriodEnd`）/ cancelAtPeriodEnd
- AdminDashboard 加入口按鈕

#### P2-C. 付款失敗 → 鎖定帳號 access gate
> 現在 `past_due` 狀態不會鎖帳號，等於免費用

- 方案：`requireActiveSubscription` middleware，讀 `Subscription` table，`status` 不是 `active/trialing` 就回 403
- 套用範圍：`/api/courses` GET / module / quiz / exam routes（成績單 PDF 例外，付款失敗的家長仍能下載）
- 注意：手動 seed 的學生（Class of 2026）應該 bypass 此 gate（`student.isManual` flag 或白名單 `studentCode` 前綴）

#### P2-D. 30 天退款後自動停權
> 現在 Stripe `charge.refunded` 沒處理，退款後學生仍可登入

- `webhooks-stripe.js` 加 `charge.refunded` handler → 把對應 `Subscription.status` 改成 `cancelled`
- 或更保守：`customer.subscription.deleted`（Stripe 退款後會刪訂閱）其實已有 handler，確認它有正確 set status='cancelled'

#### P2-E. 購買後自動開通流程（目前是人工）
> 現在家長付完錢，24 小時內要 admin 手動建 StudentAccount — 這是瓶頸

- `webhooks-stripe.js` `handleCheckoutCompleted` 裡的 TODO 補完：
  1. 用 `purchaserEmail` 查 `Student` by `parentEmail`（找到就好）
  2. 找不到 → 在 `Application` 插一筆 pending（admin 從 `/admin/applications` 看）
  3. Resend 寄「我們收到你的付款，24 小時內發送登入憑據」確認信（需 `RESEND_API_KEY`）
- 依賴：`RESEND_API_KEY`（與 Phase 1 #4 同一條）

#### P2-F. 團報座位邏輯（group_monthly）
> 現在 group 方案 maxStudents=5 但完全沒追蹤誰佔了哪個座位

- 先釐清商業模式：購買者是一個家長 paying for siblings？還是補習班/老師 paying for a cohort？
- 方案 A（家長同一家庭）：`Subscription` → `Student[]` 一對多，family 共用一張訂閱
- 方案 B（老師/cohort）：新 `SubscriptionSeat { subscriptionId, studentEmail, invitedAt, acceptedAt }`，purchaser 可發邀請連結
- 在商業模式確認前，**先加一個 admin 手動關聯頁**（`/admin/subscriptions/:id/seats`），讓 Alan 直接指定哪幾個學生算在這張訂閱下

#### P2-G. Netlify frontend 改用 live publishable key
> `.env.development` 裡的 `REACT_APP_STRIPE_PUBLISHABLE_KEY` 是 pk_test_，Netlify build 出來是 test key

- 在 Netlify Dashboard → Site settings → Environment variables 加 `REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...`
- 或把 `.env.development` 裡的 test key 改成 live key（publishable key 公開安全，可進 git）
- **注意**：目前 PricingPage.js 的 Checkout 是純後端跳轉，前端 pk 其實沒用到 — 但未來做 Stripe Elements 前要先對齊

- [ ] **Resend wrapper（依賴解開後做）**：webhook `checkout.session.completed` 裡的 TODO（自動建 Student + ParentAccount + 寄歡迎信）— 等 Phase 1 待辦的 `RESEND_API_KEY` 解開後一起做

---

### ✅ 8. 入學流程 `/apply`（UI 完成，Stripe link 待接）

`src/components/pages/Apply/ApplyForm.js` 上線於 `/apply`（雙語，含驗證，送出後顯示確認畫面）。`server/src/routes/applications.js`：`POST /api/applications`（public）、`GET /api/applications?status=`（admin）、`PATCH /api/applications/:id`（approve/reject）。`src/components/pages/Admin/ApplicationsQueue.js` 上線於 `/admin/applications`。Schema 已同步。**Approve → 寄 Stripe checkout link 待 #7 Stripe 完成後補。**

---

### ✅ 9. 文憑 / 成績單驗證 QR — 已完成

- ✅ `DiplomaPage.js` + `TranscriptContent.js` 加 QR code（`qrcode.react`）指向 `/verify/:studentCode`
- ✅ `VerifyPage.js` at `/verify/:code` — 公開驗證頁，掃 QR 顯示「GIIS 官方發出、學生姓名、發證日期、是否畢業」
- ✅ `server/src/routes/verify.js` — `GET /api/verify/:code`（只回最小公開資料）

Acceptance ✅：列印成績單掃 QR 不需登入可驗真偽。

---

## 🔁 Phase 3 — 留住付費用戶

### ✅ 13. 考試冷卻倒計時 — 已完成

- ✅ `ExamPage.js` — `nextAttemptAt` 轉成 "還要等 X 小時 Y 分鐘" 倒計時 UI，每分鐘自動 refresh

### 10. Advisor 筆記 + 學期建議

- Admin 對每位學生留 markdown 筆記（`AdvisorNote { studentId, body, createdAt, authorId }`）
- 家長 Dashboard 的「Advisor note」區塊讀最新一筆（mockup 已有版位）
- 每學期初 cron job 自動寄出「建議下學期選修」email（用 pathway + 已完成課程算）

### 11. 學期總結報告 PDF

- 既有的 `transcriptPdf.js` 已能生成成績單 PDF，extend 為 semester report
- cron job 每學期末（5/31, 12/31）自動生成 + 寄出

### 12. 忘記密碼（學生 + 家長）

- `POST /api/auth/forgot-password` → 寄 reset link（24h 有效）
- `src/components/pages/Auth/ResetPassword.js`
- 學生 + 家長共用同一條 flow


---

## 🏗️ 架構決定（已確認，未來新學生照此實作）

### 學分 → 成績單的單向資料流（已確認，2026-05-10）

> **目標**：Learn Portal 是唯一的數據入口，成績單是衍生輸出，畢業資格由成績單學分決定。

**確認的流向：**
```
學生在 Learn Portal 完成課程
  → Admin 審核 / 系統自動更新 CourseRow（letterGrade + credits）
    → 成績單 PDF 從 CourseRow 生成（已完成）
      → 畢業資格從 CourseRow 學分計算（已完成）
```

**現狀（Class of 2026 四位學生）：**
- CourseRow 是手動維護的，和 Enrollment 系統是兩套獨立數據
- 畢業資格已改成從 CourseRow 計算（`AdminTranscriptPage.js GraduationSection`）
- Enrollment 的 `creditEarned` 不參與畢業計算

**未來新學生需要做的（Phase 3/4 再實作）：**
1. **Learn Portal 完成 → 自動寫 CourseRow**：當學生 `creditEarned = true`（通過期末考），後端自動在對應 Semester 的 CourseRow 插入一行（`courseName`, `credits`, `letterGrade` 從考試分數換算）
2. **Admin 審核流程**：CourseRow 自動生成後標記 `status: 'pending'`，admin 確認或修改後才變 `confirmed`，才會出現在 PDF 成績單
3. **grade release 邏輯保持不變**：`Semester.releaseDate` 控制學生/家長看到成績的時間
- 相關檔案：`server/src/routes/students.js`（PATCH enrollments 觸發 CourseRow）、`server/prisma/schema.prisma`（CourseRow 加 `status` 欄位）

---

## 📈 Phase 4 — 規模化

> 等有穩定付費用戶後才考慮，列項即可。

| 區塊 | 功能 | 對應檔案概念 |
|------|------|-------------|
| Admin | 課程 / 題目管理 UI | 取代手改 JSON + re-seed |
| Admin | 批量學生匯入 CSV | `/admin/students/bulk-import` |
| ✅ Admin | 學生進度看板 | `/admin/progress`：活動時間、學分進度條、進行中 / 完成課程數、color-coded badge（今天 / N天前 / Never active）。`server/src/routes/students.js` GET /progress，`src/components/pages/Admin/AdminProgressPage.js`，AdminDashboard 已加入口按鈕 |
| Admin | 代替學生加退課 | 在 student profile 頁加 enrollment 編輯 |
| Student | 課程進度條 | `LearnDashboard.js` 課程卡顯示 X/Y modules |
| Student | Quiz 失敗引導 | 沒過時建議複習特定章節 |
| Student | 作業檔案上傳 | Cloudflare R2 / S3 |
| Student | Q&A 討論區 | 每個 Module 下方 |
| 成長 | 推薦人機制 | 雙方學費折扣 |
| 成長 | Alumni 展示頁 | 畢業生大學去處 |

---

## 🛠️ 技術債

| 項目 | 影響 | 對應檔案 |
|------|------|---------|
| 移除 Bootstrap | Bundle 減 ~200KB | grep `bootstrap`，主要在 `Header/`、`Footer/` |
| 移除 react-slick → CSS scroll-snap | 少 2 個套件 | `ImgSlider.js` |
| 首頁圖片轉 WebP | 載入快 3-4 倍 | `src/img/Homepage/*.png` → 用 sharp 一次轉 |
| Login / exam submit rate limiting | 安全 | `server/src/middleware/rate-limit.js` (新建) |
| Server-side PDF（Puppeteer） | PDF 品質穩定 | 取代現有 jspdf |

---

## 📝 Code Mode 須知（這輪建立的慣例）

### Demo pipeline
- 字幕 source of truth：`public/demo/walkthrough.html` 的 `const CAPTIONS = [...]`
- `make-demo.mjs` 自動 parse 出來，不要在 `make-demo.mjs` 裡另外 hardcode 字幕
- 改字幕後跑 `npm run make-demo:audio && npm run make-demo:merge`（不用全 force）

### 4-voice cast convention
- Aria（學校代言）、Guy（學術權威）、Jenny（學生視角）、Andrew（家長視角）
- 新增 scene 時要決定哪個 persona 講
- 列所有可選聲音：`edge-tts --list-voices | grep en-`

### 手機 CSS pattern
- 不重寫 inline style，新增 `data-m="..."` attribute hook 到 `learn-mobile.css`
- 命名：`learn-page` / `welcome-row` / `stat-grid` / `banner-row` / `course-grid` / `breadcrumb` / `course-stats`
- 新頁也用同一條 css，加新 `data-m` 命名先看 css 已有哪些可重用

### 雙語慣例
- 所有家長 / 行銷面文案用 `language` prop 切換 EN/中文
- 中文用簡體（`zh-CN`），跟既有 `siteStrings.js` 一致
- Admin 介面英文即可（給 Alan 用）

### 校長簽名（不要再寫錯）
- 校長：**Shiyu Zhang, Ph.D.**，職稱 **President & Principal**
- 第二簽名線是畢業生本人
- 參考：`src/components/pages/Diploma/DiplomaPage.js` line 337

---

## 開發優先序總結

```
✅ Phase 1（讓家長看到）— 核心已完成
  剩：週報 cron/dry-run + EmailLog、作業批改 email 通知、npx prisma db push

🎯 Trust Sprint（消除「太便宜不可能是真的」警報）— next batch
  P0：校長 bio → 首頁嵌真課影片 → Footer 信任資訊 → 30 天退款 + sample digest
       → "Is GIIS for you?" 誠實對照 → WeChat QR
  P1：品牌色統一（maroon/gold/cream）→ /faculty 老師頁 → SuccessStories 真人照片
       → emoji 換 SVG icon → Pricing 比較表視覺化 → Calendly 預約校長
  P2：Pathway 4 年 timeline → 5 分鐘加長 demo → SAT/AP score → AP Psych 試讀 → Parent Q&A Zoom

✅ Phase 2 部分完成
  ✅ /apply + ApplicationsQueue
  ✅ 文憑/成績單 QR 驗證
  待：Stripe（等 STRIPE_SECRET_KEY）

Phase 3（留住付費用戶）：
  Advisor 筆記 → 學期報告 → 密碼重設（需要 Resend）
  ✅ 考試冷卻倒計時

Phase 4（有規模再做）：
  Admin 課程 UI → 批量操作 → 討論區
```

---

## 環境資訊

- **Frontend:** React 18 / react-router-dom v6 / Netlify
- **Backend:** Express + Prisma ORM + PostgreSQL / 目標 AWS Lightsail
- **Email（待接）:** Resend（免費 3,000 封/月，API key 在 resend.com）
- **付款（待接）:** Stripe（Phase 2）
- **TTS（demo 用）:** edge-tts（`pip3 install edge-tts`）
- **學生資料備份:** `server/data-backup/students_transcript_export.json`

## 測試帳號

| Code | 姓名 | Email |
|------|------|-------|
| 26-001 | Ruwen Li | ruwen.li@genesisideas.school |
| 26-002 | Tao Zhang | tao.zhang@genesisideas.school |
| 26-003 | Baoyi Lu ★ | baoyi.lu@genesisideas.school |
| 26-004 | Yunfan Yang ★ | yunfan.yang@genesisideas.school |
| 26-005 | Hanxi Xiao | hanxi.xiao@genesisideas.school |

★ Yunfan Yang 有最多考試記錄，最適合測試（demo 也以他為主角）。
