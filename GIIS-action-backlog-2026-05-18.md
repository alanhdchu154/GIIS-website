# GIIS Platform — 行動 Backlog（給 Cowork 處理用）

更新：2026-05-18
來源：策略 review 對話（round 1 + round 2）
總任務數：51（5/22 前需完成 14 項）

**目標**：
1. 讓家長願意付錢且持續付錢
2. 當美國大學/audit 來查時，能拿出完整證據鏈

---

## 🚨 RED FLAGS：5/22 前要先回答的事（4 天倒數）

這三件不是 task，是 STOP signal。回答不出來，5/22 senior release 要緩。

### RF-1：5 位 senior 的 G12 在平台上有真實活動紀錄嗎？
拉出 Yunfan / Baoyi / Ruwen / Tao / Hanxi 各自的：登入次數、看過幾支教學影片、做過幾個 quiz、交過幾份作業。
**判斷標準**：任一學生 G12 學年 < 20h activity → 不能 release，要先補。
**Action**：今天跑一次 query，列出 5 人各自 activity 總時數。

### RF-2：「AP 課程」過 College Board AP Course Audit 了嗎？
你掛 AP Calc AB / AP Bio / AP Psych / AP CSA。沒有 AP Course Ledger 的 approval 不能用「AP」label，否則是違規使用 trademark。
**Action**：今天上 https://apcentral.collegeboard.org/courses/ap-course-audit 確認 GIIS 在不在 ledger 上。不在的話，transcript 上的「AP」全部 5/22 前改成「Honors」或「Advanced」。

### RF-3：5 位 senior 秋天有大學可以去嗎？
他們送出 Common App 了嗎？拿到 acceptance 了嗎？如果還沒申請，CEEB code 沒有、School Profile 沒有，他們去不了任何學校。
**Action**：列每位 senior 目前的大學申請狀態（已送出/已 admit/未申請）。

---

## 等 Alan 決策（卡住的 task）

| ID | 決策 | 預設建議 | 影響範圍 |
|----|------|----------|----------|
| D-1 | Group Plan 是 Family（siblings）還是 Cohort（補習班代購）？ | Family only，撤掉 Cohort | T-602 |
| D-2 | 購買後是自動開通還是人工審核？ | 自動建帳號 + 24h soft-hold | T-105 |
| D-3 | 取消訂閱用 Stripe Customer Portal 還是自建？ | Stripe Portal（30 分鐘）| T-101 |
| D-4 | Founders $19.90 滿員後怎麼升價？ | 鎖 12 個月→跳 $99（老會員 50% off 永久）| T-601, T-603 |
| D-5 | Counselor letter 誰簽（不能是 Alan 自己）？ | 待定 | T-303 |

---

## SPRINT 0：5/22 Release Gate（4 天內）

### T-001  建立 student audit trail 頁面
- **Priority**: P0 | **Owner**: Dev | **Effort**: 0.5 天
- 新頁面 `/admin/students/:id/audit-trail`，顯示：
  - 每週登入時間戳
  - 每門課每個 module 完成 datetime
  - Quiz/exam session log（開始/結束時間、IP、用時）
  - 作業提交歷史 + 老師批改評語
  - Export PDF 按鈕
- **完成標準**：可對任一 senior export 完整 PDF audit log
- **為何**：大學/audit 唯一可拿出來的證據鏈

### T-002  Senior 5 人活動量盤點
- **Priority**: P0 | **Owner**: Dev + Alan | **Effort**: 0.25 天
- 跑 SQL 列出 Class of 2026 senior 各自的活動總時數、課程完成率、quiz 通過數
- 檢查所有 G12 課程是否都有 platform 軌跡
- **Trigger**：< 20h activity 的學生 → 啟動 T-003

### T-003  補追 senior 缺失活動（conditional）
- **Priority**: P0 | **Owner**: Ops | **Effort**: 1-3 天
- 條件觸發：T-002 顯示某 senior activity 不足
- 要求學生補完缺失 quiz、補繳作業，5/22 前讓平台軌跡與 transcript 對得上
- **為何**：避免 audit 時 transcript 與 platform 對不上

### T-004  AP label 合規檢查
- **Priority**: P0 | **Owner**: Alan | **Effort**: 2 小時
- 上 AP Course Ledger 確認 GIIS 課程在不在
- 不在的話：transcript、課程頁、行銷頁所有「AP」字樣 → 改成「Honors」或「Advanced」
- **Block**：T-001 audit trail 頁面也要連動移除 AP wording

### T-005  Senior 大學申請狀態盤點
- **Priority**: P0 | **Owner**: Alan | **Effort**: 2 小時
- 每位 senior 列出：已申請學校、Common App 狀態、是否拿到 acceptance、CEEB code 卡關沒卡關

---

## SPRINT 1：付款流程修補（本週）

### T-101  開啟 Stripe Customer Portal
- **Priority**: P0 | **Owner**: Alan-external | **Effort**: 30 分鐘
- Stripe Dashboard → Settings → Billing → Customer portal → Enable
- 配置：允許取消訂閱、更新付款方式、下載發票
- 加 portal link 到 `/parent/dashboard`
- **依賴**：D-3

### T-102  處理 charge.refunded webhook
- **Priority**: P0 | **Owner**: Dev | **Effort**: 0.5 天
- 退款事件觸發 → 對應 Subscription status = cancelled
- 學生帳號 deactivate（不能登入）
- 寄 email 通知家長與 admin

### T-103  past_due 自動鎖帳號
- **Priority**: P0 | **Owner**: Dev | **Effort**: 0.5 天
- Stripe `invoice.payment_failed` 連續 2 次 → 學生帳號降權
- 降權狀態：可登入看 dashboard，但不能進考試 / 不能看新 module
- 寄 email 通知家長更新付款方式

### T-104  Stripe 啟用 Alipay 付款
- **Priority**: P0 | **Owner**: Alan-external | **Effort**: 10 分鐘
- Stripe Dashboard → Payment methods → Activate Alipay
- **為何**：中國 mainland 家長 conversion 立即翻倍

### T-105  自動建學生帳號（24h soft-hold）
- **Priority**: P1 | **Owner**: Dev | **Effort**: 1 天
- Webhook `checkout.session.completed` → 自動建 Student record
- 發 email 含臨時密碼，status = `pending_review`
- 學生可登入看 Welcome 但不能 take exam
- Admin 24h 內手動 approve 後解鎖
- **依賴**：D-2

### T-106  /admin/subscriptions 頁面
- **Priority**: P1 | **Owner**: Dev | **Effort**: 0.5 天
- 列所有 Subscription、付款狀態、扣款日期、對應 Student
- 加 filter（active / past_due / cancelled）

### T-107  Subscription ↔ Student 關聯
- **Priority**: P1 | **Owner**: Dev | **Effort**: 0.5 天
- Subscription table 加 `studentId` foreign key
- Admin 在 T-106 頁面手動 link

---

## SPRINT 2：信任訊號（本週，瓶頸在 Alan 交內容）

### T-201  校長頁面 /about/principal
- **Priority**: P0 | **Owner**: Alan-content + Dev | **Effort**: 內容 1 天 / Dev 0.5 天
- Alan 提供：校長照片（高解析度）、bio（中英雙語）、教育背景、聯絡 email
- Dev 建頁面後 link from Footer + About
- **為何**：中國家長 Google 的第一個關鍵字就是校長

### T-202  Footer 加 FL DOE 註冊號
- **Priority**: P0 | **Owner**: Alan-content + Dev | **Effort**: 內容 10 分鐘 / Dev 10 分鐘
- Alan 提供 Florida private school registration number
- Dev 加進 footer + `/about/school-profile`
- 加超連結到 FL DOE 驗證頁面

### T-203  WeChat 官方 QR
- **Priority**: P0 | **Owner**: Alan-content + Dev | **Effort**: 內容 30 分鐘 / Dev 10 分鐘
- Alan 設立微信服務號（或先用個人號）+ 產生 QR
- Dev 加進 Footer + Contact 頁
- **為何**：中文家長主要溝通管道，沒有就是疏離訊號

### T-204  SuccessStories 換真人照片 + 錄取信
- **Priority**: P1 | **Owner**: Alan-content + Dev | **Effort**: 內容 1 天 / Dev 0.5 天
- 取得 Yunfan / Baoyi 等：頭像、acceptance letter PDF（去敏處理）、本人 + 家長書面授權
- 替換現有字母頭像

### T-205  Faculty / Teachers 頁面
- **Priority**: P1 | **Owner**: Alan-content + Dev | **Effort**: 內容 1 週 / Dev 0.5 天
- 列出實際授課老師、學位、credentials、簡介
- **為何**：FL DOE 要求「qualified instructors」，audit 來會問

### T-206  Board of Advisors 頁面
- **Priority**: P2 | **Owner**: Alan-content + Dev | **Effort**: 內容 2 週 / Dev 0.5 天
- 找 3-5 位有 credentials 的人（退休教師、教授、教育界家長）擔任 advisor
- 公開列照片、bio、所屬機構

---

## SPRINT 3：College Application 基礎建設（兩週內）

### T-301  申請 CEEB Code
- **Priority**: P0 | **Owner**: Alan-external | **Effort**: 申請 1 小時 + 等待 4-6 週
- 上 collegeboard.org 提交 GIIS 學校註冊
- **今天就送**，否則秋季申請季趕不上
- 拿到後填進 School Profile + transcript

### T-302  製作 School Profile PDF
- **Priority**: P0 | **Owner**: Alan-content | **Effort**: 1 天
- 1-2 頁標準格式，內容：
  - Grading scale（4.0 或百分制？AP weighted 5.0？）
  - 課程強度、AP / Honors 數量
  - Graduating class size、平均 GPA
  - Accreditation 聲明 + FL DOE reg
  - 學校特色、教學模式
- 每份 transcript 都附這個

### T-303  指定 Counselor
- **Priority**: P0 | **Owner**: Alan-decision | **Effort**: 1 天
- 找一位非 Alan、有 educator credentials 的人
- 負責 Common App counselor letter 簽署
- **依賴**：D-5

### T-304  AP Course Audit 申請（若未通過）
- **Priority**: P0 | **Owner**: Alan-external | **Effort**: 每門課 syllabus 1 天 + 數週等待
- 每門掛 AP 的課程提交 syllabus 給 College Board AP Course Audit
- 未通過前 transcript 不可用「AP」label
- **依賴**：T-004 結果

### T-305  確認 senior 報名 College Board AP Exam
- **Priority**: P0 | **Owner**: Alan | **Effort**: 0.5 天
- 2026 年 5 月 AP 考試 window 是 5/4-5/22，確認 5 位 senior 有沒有實際考
- 沒考過 AP exam 的「AP」label 在 admissions 眼裡價值很低
- 沒考的話考慮 2027 年補考

### T-306  sealed/signed transcript 機制
- **Priority**: P1 | **Owner**: Dev + Alan | **Effort**: 1 天
- 除現有 QR 驗證 PDF，加 counselor 電子簽名 + 「official」浮水印
- 評估跟 Parchment 整合（美國大學認的 transcript 寄送平台）

---

## SPRINT 4：留存 & Onboarding（兩週內）

### T-401  申請 Resend API key
- **Priority**: P0 | **Owner**: Alan-external | **Effort**: 10 分鐘
- 上 resend.com 註冊
- 驗證 sending domain（genesisideas.school）
- 拿 API key 給 dev

### T-402  Email 模板系統
- **Priority**: P0 | **Owner**: Dev | **Effort**: 1 天
- 建中英雙語 email 模板：Welcome、Day 1、Day 7、Day 30、每週 progress
- 資料抽 Student / Activity table
- 用 cron 或 trigger 自動發送
- **依賴**：T-401

### T-403  Day 0 Welcome Email
- **Priority**: P0 | **Owner**: Dev + Alan-content | **Effort**: 0.5 天
- 付款後立即觸發
- 內容：感謝信、onboarding PDF 連結、登入資訊、advisor 介紹
- Alan 草擬中英版本，dev 接 webhook

### T-404  每週 Parent Progress Email
- **Priority**: P0 | **Owner**: Dev | **Effort**: 1 天
- 每週日晚上自動寄
- 內容：本週登入時數、完成 module、quiz 分數、advisor 評語（如有）
- HTML 美觀 template
- **依賴**：T-402

### T-405  Day 30 Review Email + Zoom 邀約
- **Priority**: P1 | **Owner**: Dev + Alan | **Effort**: 0.5 天
- Trigger：Subscription 滿 30 天
- 內容：學生本月 progress + advisor calendar link
- **依賴**：T-701（advisor 預約系統）

### T-406  忘記密碼 flow
- **Priority**: P0 | **Owner**: Dev | **Effort**: 0.5 天
- 學生 + 家長 reset password via email magic link
- Token 有效期 1 小時

### T-407  Advisor 筆記系統
- **Priority**: P1 | **Owner**: Dev | **Effort**: 1 天
- Parent dashboard 已有空版位
- Admin 在 student detail 頁面留筆記
- 標記哪些筆記家長可見 / 內部用
- 家長 dashboard 顯示可見的筆記

---

## SPRINT 5：考試誠信機制（一個月內）

### T-501  Webcam 監考 v1
- **Priority**: P0 | **Owner**: Dev | **Effort**: 2 天
- 期中期末考開始前：要求啟用 webcam + 出示 ID 拍照
- 考試中每 30 秒抓一張 frame 存 S3（含時間戳）
- 隱私聲明：明確告知學生 + 家長，留存期限

### T-502  Lockdown 偵測
- **Priority**: P0 | **Owner**: Dev | **Effort**: 1 天
- 監測：頁面失焦、tab 切換、devtools 開啟
- 違規 → 警告 → 多次違規 → 該次考試作廢
- 違規紀錄存 audit log（給 T-001 用）

### T-503  題庫亂序 + subset 抽題
- **Priority**: P0 | **Owner**: Dev | **Effort**: 1 天
- 從題庫隨機抽 N 題給每個學生
- 題目順序隨機、選項順序隨機
- **前置**：需先擴充每門課的題庫到至少 3x 考試題數

### T-504  Oral Defense 機制
- **Priority**: P1 | **Owner**: Dev + Alan | **Effort**: 2 天
- 部分課程加 oral defense：學生錄 5 分鐘 video 解釋一個概念
- 老師看影片打分
- 先在 AP CS A 或 English I 試點

### T-505  School Profile 補上 integrity 聲明
- **Priority**: P0 | **Owner**: Alan | **Effort**: 10 分鐘
- T-302 完成後加一行：「All summative assessments are proctored via webcam recording and randomized question banks.」
- **依賴**：T-302, T-501-503 完成

---

## SPRINT 6：商業模式調整（決策後執行）

### T-601  Pricing 頁面 anchoring 重做
- **Priority**: P0 | **Owner**: Dev + Alan | **Effort**: 0.5 天
- 「Standard $199/mo」用劃線
- 「Founders 50% off = $19.90/mo」放大
- 加「locked 12 months」說明
- **依賴**：D-4

### T-602  撤掉 Group Plan，改 Family Plan
- **Priority**: P0 | **Owner**: Dev + Alan | **Effort**: 0.5 天
- 移除 Cohort 概念
- Family Plan 限制 2-4 siblings、需提交出生證明或同戶口
- 改 Stripe Product 結構
- **依賴**：D-1

### T-603  TOS 加入續訂條款
- **Priority**: P0 | **Owner**: Alan-content | **Effort**: 1 天
- 明確寫：
  - Founders 鎖 12 個月、到期跳 $X
  - 老會員 lifetime Y% off
  - 退款 policy（pro-rated? no refund after N days?）
  - 取消方式、生效時間
- 法律 review（如有 budget）
- **依賴**：D-4

### T-604  加入 Premium Tier（可選 anchor）
- **Priority**: P2 | **Owner**: Alan-decision + Dev | **Effort**: 1 天
- $299/mo Premium：1:1 counselor + live tutoring + college consulting
- 讓 $19.90 看起來是入門 tier
- **依賴**：D-4 之後再決定要不要做

---

## SPRINT 7：Live 觸點（一個月內，需 Alan 親自）

### T-701  Monthly Advisor 1:1 系統
- **Priority**: P0 | **Owner**: Alan + Dev | **Effort**: 預約系統 1 天 + 每月每學生 30 分鐘
- 每學生每月 1 次 30-min Zoom
- Initially Alan 親自做，scale 後 hire
- 需建簡易預約頁（or 用 Calendly 嵌入）
- 預約後寫進 advisor 筆記（T-407）

### T-702  Monthly Principal Town Hall
- **Priority**: P1 | **Owner**: Alan | **Effort**: 每月 30 min + 1 小時準備
- 全校學生 + 家長 Zoom
- 校長講近況 + Q&A
- 錄影上傳 YouTube unlisted，給缺席家庭看
- **為何**：建立「真的有校長、真的有 community」的感覺

### T-703  AP Office Hours
- **Priority**: P1 | **Owner**: Alan / 老師 | **Effort**: 每門課每月 1 小時
- 非強制出席，錄影 upload 到 learn portal
- 先從 AP Calc AB 開始
- **依賴**：T-205（faculty）就位

---

## SPRINT 8：5/22 Commencement & Marketing 收割

### T-801  線上 Commencement Ceremony
- **Priority**: P0 | **Owner**: Alan | **Effort**: 籌備 2 天 + 當天 1 小時
- 5/22 Zoom 30 分鐘
- 流程：校長致詞 5 min → 5 位 senior 各 1 分鐘感言 → 虛擬授予 diploma → 合影
- 全程錄影

### T-802  實體 Diploma 印製寄送
- **Priority**: P0 | **Owner**: Ops | **Effort**: 2 天製作 + 國際寄送
- 厚紙 + 燙金 + 校長親簽 + 皮夾文件夾
- 成本 $50/份 × 5 = $250
- 國際 EMS 寄到家長地址
- **為何**：家長拍照發朋友圈 = 零成本廣告

### T-803  Senior Capstone Showcase 頁
- **Priority**: P0 | **Owner**: Alan-content + Dev | **Effort**: 每位 0.5 天 × 5 = 2.5 天
- 路徑：`/students/{name}-2026`
- 內容：final project、AP scores、acceptance list、90 秒中文 video testimonial、本人照片
- 從首頁 link 到這 5 個頁面
- **為何**：接下來 6 個月對下一批家長 sales 最強素材

### T-804  Commencement Highlight 影片
- **Priority**: P1 | **Owner**: Alan | **Effort**: 1 天
- T-801 錄影剪 3 分鐘高光放首頁

### T-805  Senior 朋友圈素材包
- **Priority**: P1 | **Owner**: Alan | **Effort**: 0.5 天
- 給每位 senior + 家長分享包：diploma 美圖、ceremony 截圖、可分享簡中文案
- 鼓勵發朋友圈 / 小紅書
- 提供 hashtag 與 @ tag

---

## OPERATIONAL DEBT（暫不入 sprint 但記著）

| 項目 | 影響 | 緊急度 |
|------|------|--------|
| Refund policy 具體條文 | 法律風險 | 中 |
| 隱私政策（中英雙語，含 student PII 處理）| 合規 + 信任 | 中 |
| Time zone display（後台 UTC，前端北京時間）| UX 細節 | 低 |
| 中文文案 native speaker review | 第一印象 | 中 |
| Liability / E&O insurance | 法律風險 | 中 |
| Analytics（PostHog 免費 tier，track funnel）| 商業決策依據 | 中 |
| Admissions interview（30 min Zoom per applicant）| Conversion + credibility | 中 |

---

## 任務統計摘要

**5/22 前必完成（14 項）**：
T-001, T-002, T-003*, T-004, T-005, T-101, T-102, T-103, T-104, T-201, T-202, T-203, T-801, T-802, T-803
（*conditional）

**完全卡 Alan（內容/外部帳號）**：
T-004, T-005, T-104, T-201, T-202, T-203, T-204, T-205, T-206, T-301, T-302, T-303, T-304, T-305, T-401, T-505, T-603, T-701, T-702, T-801, T-802, T-803, T-804, T-805

**完全卡 Dev**：
T-001, T-102, T-103, T-105, T-106, T-107, T-306, T-402, T-404, T-406, T-407, T-501, T-502, T-503, T-601, T-602

**需 Alan 先做決策**：
D-1（影響 T-602）、D-2（影響 T-105）、D-3（影響 T-101）、D-4（影響 T-601, T-603, T-604）、D-5（影響 T-303）

---

## 建議執行順序（Day-by-Day）

**今天（5/18）**：D-1 ~ D-5 全部決策、RF-1/2/3 三件回答、T-004 + T-005 + T-104 + T-301 + T-401（都是查/申請，可平行）

**5/19**：T-001 啟動、T-101 ~ T-103 啟動、T-201/202/203 內容 Alan 寫起來

**5/20**：T-001 完成、T-002 跑 query、T-302 School Profile 完成、Commencement T-801 籌備

**5/21**：T-003 條件補活動、T-803 capstone 頁面完成、Diploma 印製送出（T-802）

**5/22**：Commencement 直播（T-801），release 與否依 T-002 結果

**5/23 後**：Sprint 1-7 並行推進
