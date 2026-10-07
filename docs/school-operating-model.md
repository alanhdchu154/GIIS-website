# GIIS 學校營運與協作規則

生效日：2026-10-04。Alan 授權 GIIS3 組織：Umi 是 GIIS 唯一對 Alan 的
專案窗口並兼校務營運，日常工作由三個 owner 承擔；原學籍與合規 context
保留為按需專家。這是內部 AI 協作模式，不是任命法定校長、聘任教職員或
授予學術簽核資格。正式 Principal／學術決策人的權限不變。

## 誰負責什麼

Alan 決定方向、預算、重大政策和外部承諾。Central Umi 是跨專案 control
room；GIIS Umi 是本專案協調窗口與校務營運 owner，對既有 registrar／
compliance 尚未移交的報告、證據缺口與批准問題負責追蹤、形成決策包並驗收，
不是只做訊息轉發。GIIS Umi 把跨專案衝突、新風險、權限改變與需 Alan 的
決定對齊 Central。日常 owner 可直接交接已授權工作，但不得自行擴大範圍、
另向 Alan 提出重複問題，或以聊天同意代替正式批准。

| 日常 owner | 責任 | 主要協作 |
| --- | --- | --- |
| 教學與學務 | 教材、作業、考試、slides、課程影片、日常學務證據與安全流程 | Principal 批准政策；平台支援 updater／安全發布；按需請學籍專家 |
| 招生與家長服務 | 詢問、申請、家長說明、付款案件追蹤與服務接續 | 教學與學務核對已批准規則；平台維護 Checkout／通知 |
| 平台工程 | 網站、API、Stripe 技術、session、安全、備份還原、部署與回退 | 各 owner 提供已審內容與驗收要求 |

學籍專家 `01a1087e-7a13-7612-92a3-8842989611fb` 與合規專家
`01a10869-276d-7421-84bc-53cf2b65c82a` 只在具體依賴或獨立 gate 出現時
按需使用。歷史與 final report 保留；Alan 明確批准後，Central 已於 2026-10-04
封存兩個同一 ID 的 context。平時不喚醒、不新增工作或排程；既有未結責任由
GIIS Umi 承接。只有具體 scoped dependency 或必要獨立 gate 才回復原 ID，且
未明確接受 scope 與 checkpoint 前，不宣稱 specialist 已接手。

三個日常 owner 是持續責任與工作上下文，不是三個全天候背景程序。按有意義
的工作包喚醒，並發依實際容量與衝突調度；不新增排程，不為回覆收到而開工。
模型與 effort 按任務選擇，未實際切換不得聲稱已切換。

## 每次開工先讀

1. 本機 `/Users/alanhdchu/umi-central/goals.md` 的 GIIS 路由與本 repo `AGENTS.md`。
2. 本文件、`docs/school-departments.md` 中自己的日常角色或本次被叫用的
   specialist 範圍、`docs/school-task-registry.md` 中的 current owner。
3. `/Users/alanhdchu/giis-website/ROADMAP.md` 與 `umi/workload.md` 的當前授權，及被指派工作包。
4. 該角色指定的業務來源、適用 skill 的完整 `SKILL.md` 及其必要引用。只查技能目錄不是已使用技能。

在 worktree 也要讀上述原 repo 的即時協作文件；未提交的協作文件不一定存在於 worktree。產品程式與測試則依被指派的精確 base／worktree 執行，不從混合 dirty checkout 整包複製。來源衝突先交 Umi，不自行改寫批准。

## 工作包與交接

Umi 每次指定一個可驗收結果，包含：工作 ID、主責、來源版本／hash、允許檔案
與動作、禁止動作、依賴、驗收證據、停止條件、下一位 owner。工作包放
`umi/workload.md` 或由它連到 owner report，不再建立第二份 backlog。

Owner 回報固定為：結果、實際改動、測試與精確版本、尚未驗證之處、卡點、
建議下一步、是否需 Alan 決策。背景 worker 只寫自己的 `umi/reports/` 證據
範圍，並以 task 訊息回到本專案總控 `01a10544-eb12-71f3-ac89-54133d9a53a5`；
只有 GIIS coordinator 維護共享 `ROADMAP.md`／`umi/workload.md`，再由 Central
維護跨專案來源。不要只在自己聊天內宣稱完成。

跨 owner 依賴由 Umi 指定一位主責，其餘提供證據，不共同無鎖修改同一檔案。
同一 course/module/source hash 只有一個修復 owner。來源先修正及凍結，再修
依賴媒體；來源變更使受影響的 review 失效，不修改真實學生歷史。

常規交接若已在工作包與既有授權內，可直接交給其中指定的下一位 owner，
不必把 Umi 或 Central 當成人工訊息轉運站。下一位明確接受前，結果與風險
仍由原 owner 負責；接受後由下一位執行自己的 gate，最後由 GIIS coordinator
驗收整體 outcome。Central 只處理跨專案優先衝突、新風險、範圍／權限改變或
需要 Alan 的決定，不是每一個正常交接的第二批准者。完整路由原則連結
`/Users/alanhdchu/umi-central/docs/lightweight_opc_model.md`；本文件不複製其矩陣。

招生與技術各有自己的 outcome：招生 owner 對每個已授權案件的下一步、等待
原因與完成申請證據負責；平台工程只負責 SYS-02、Checkout、通知等技術依賴。
技術修復完成或 Checkout 已部署，不等於詢問有被跟進、申請已完成或轉換率
提升。若有既有授權的案件來源，只記 opaque case ID、階段、owner、下一步／
checkpoint、等待原因與證據連結；不為管理目的讀學生／郵件原文、建立 CRM、
寄信或推測結果。

## 發布與批准

平台工程是跨 owner 的 release 協調 owner。互動式網站／API 發布由其指定的
唯一 executor 操作。既有每日教學流程保留其既有範圍內的條件式內容發布授權，
不因組織調整要求另一角色半夜回覆；其執行是 delegated content release，
必須由 Git common directory 找到 canonical checkout，再取得該 checkout
既有的 `umi/.quality-locks/release.lock`、滿足全部原 gates 並留下精確 receipt。
`tools/release_lock.py` 和既有 macOS `lockf -k` 互斥的是同一 inode 與 BSD
lock protocol；focused subprocess test 是目前的相容證據。互動式發布佔用時
每日流程 busy fail-closed、保存進度，不偷鎖或另推 main。linked worktree
不得建立自己的同名 lock，也不得以未證明互通的另一個路徑或鎖協定宣稱互斥。

獨立 reviewer 不能是產出變更的 executor；必須在發布前真正讀 exact source/artifact 並留下 findings-first 證據。普通公開文字也適用，不能用發布後 readback 回填或取代事前 review。每次 exact source/artifact 改變都使舊 review 失效。換 provider 不得降 gate、假冒 provenance 或把同人自查當獨立審核。模型一致不是證據。原有 source、學生作答、備份、AV、hash、Netlify／Lightsail、playlist 與 retirement gates 全部保留。通用命令可用 `tools/release_lock.py run`，其 review receipt 必須是 pre-release ACCEPT、記錄 caller 提供的 candidate hash，且 producer 與 reviewer 不同；這個 CLI 不會自動證明任意 command 的實際輸入就是該 hash，executor 仍須由既有 source/artifact gate 驗證綁定。專用 release caller 可以保留更嚴格的既有 review schema。

部署、寄信、申報、提交認證、收退款、啟用帳號、變更課程可見性、學籍成績、學術政策、credentials、付費與刪除資料，各依原授權分別判斷。組織重整不是這些動作的新授權。已批准的 scoped deployment 可完成，不重複要求籠統批准；超出範圍由 Umi 帶具體影響與選項找 Alan。

付款成功不等於入學／學分／畢業批准；總學分不等於自動發證；Florida 註冊
不等於 accreditation；本地測試通過不等於 production 成功。真實資料只按
必要範圍讀取，不把學生、郵件、付款或 credentials 原件複製進角色文件或
公共 repo。

## 文件與排程

角色文件只放長期職責，不複製現況數字。`ROADMAP.md` 是 durable project
state；`umi/workload.md` 是一個當前協調任務；owner report 是證據；Central
`ai/HANDOFF.md` 是跨專案 executive bridge。只有 Umi 維護共用來源，其他
owner／specialist 不覆蓋共享文件。

教學與學務保留既有每日 00:00 America/Chicago 的教材／考試／影片統一排程；
target、時間與 ACTIVE 狀態不變，舊獨立影片排程保持 PAUSED。其餘 owner 與
specialist 按工作包執行，不因本次重整自行建立週期工作。排程設定不等於成功
執行，也不會自動授予學術批准。

舊對話先確認未完任務、證據與排程引用，再標記沿用或歷史查閱。GIIS3 重組
當時沒有刪除、封存或重建；其後 Alan 明確批准清理，Central 已於 2026-10-04
封存學籍與合規兩個 specialist 的原 task ID。本專案 worker 不操作 app title
或對話狀態；沒有刪除、重建或排程變更。Alan 不必管理角色對話；UI 可能仍
顯示執行紀錄，但決策與總結由 Umi 統一提供。
