# GIIS Platform — Product Roadmap

> 最後更新：2026-05-18 PM（**/about 領導頁上線：Alan Hwader Chu 創辦人 bio + Shiyu Zhang 校長 placeholder · CEEB 申請急用 (T-201 part 1)**）
>
> 前次：2026-05-18 AM（Stripe Live mode 全鏈上線：live keys + 3 prod price IDs + webhook secret + Lightsail prod deploy）
> 前前次：2026-05-12（Nav 登入/登出 UX · 語言切換按鈕視覺 · 5 位學生 G12 Spring 全課程完成進度 · seedCourses 修 FK 衝突）
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

## 為什麼家長會付錢？

家長付錢給一間學校，判斷的依據只有三件事：

1. **信任** — 這是一間真正的學校嗎？我的孩子拿到的文憑有意義嗎？
2. **透明** — 我看得到孩子在學什麼、學得怎麼樣嗎？
3. **結果** — 孩子有在進步嗎？這筆錢花得值得嗎？

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
  - 還缺：audio + MP4（Mac launchd 8am）
  - **下次 scheduled run TODO**：M10-M16 (batches 3-4 in slot A's plan) — Natural Selection / Speciation / Population Ecology / Community Ecology / Ecosystems Energy / Ecosystems Advanced / AP Exam Synthesis
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
cd /Users/alanhdchu/GIIS/giis-website
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
cd /Users/alanhdchu/GIIS/giis-website

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
- ✅ **1-5 作業批改 UI** — `AdminAssignmentQueue.js` at `/admin/assignments`：inline 評語 + 分數 + pending/graded filter；`server/src/routes/admin-assignments.js`（GET pending、GET all、PATCH grade）
- ✅ **1-6 Demo embed 共用 component** — `DemoEmbed.js` single source；Homepage / Admission / Pricing 三頁共用；`HomepageDemo.js` 刪除

### 🔧 Phase 1 剩餘（需要外部服務或 Alan 操作）

- [ ] **1-4 每週進度 Email 報告（Resend）** — 需要 `RESEND_API_KEY`（Alan 在 resend.com 拿，免費 3,000 封/月）
  - 檔案：`server/src/jobs/weekly-digest.js`、`server/src/lib/resend.js`、`EmailLog` schema model
  - Acceptance：`node server/src/jobs/weekly-digest.js --dry-run` 可列出；`--dry-run=false` 真寄
  - 作業批改後通知家長的 email 也在這裡補上（`admin-assignments.js` 裡已有 `// TODO` 占位）

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

### 4. 每週進度 Email 報告（Resend）

> 不需要家長登入，系統主動推訊息。Phase 1 最重要的單一功能。

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

**依賴**：Resend API key（Alan 在 resend.com 拿，存 `server/.env` 的 `RESEND_API_KEY`）

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
- [ ] **AdminDashboard $1 smoke test**：點「Stripe $1 test」用真實卡刷 $1 → 確認 Chase ...0602 進帳 + DB Subscription row → Stripe dashboard 退款 $1

### 🔧 Phase 2 待辦 — 訂閱管理補完

#### P2-A. Stripe Customer Portal（自助取消/更改訂閱）
> **最緊急**：家長問「怎麼取消」你要能回答。30 行後端 + 1 個按鈕。

- 後端：新增 `POST /api/billing/portal`（用 Stripe `billingPortal.sessions.create`，回傳一次性 portal URL）
- 前端：ParentDashboard 加「Manage subscription →」按鈕，POST 後 `window.location.href = url`
- Stripe Dashboard 開 Customer Portal（Billing → Customer portal → Activate）— 無需另設計 UI，Stripe 提供整套

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
  剩：週報 email（等 RESEND_API_KEY）、Admin 建學生時填 parentEmail、npx prisma db push

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
