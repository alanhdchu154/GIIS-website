# 需要人類補一手：AP CS A 與 AP Psychology 還沒跑過 review cascade

> Slot B（2026-05-22 5am CT）的 QA 巡檢發現。沒有急著動任何東西，先把情況講清楚給你和 Umi 看。

## 一句話總結

有 **26 支課程影片**（AP Computer Science A 的 M1–M10、AP Psychology 的 M1–M16）
**完全沒有跑過 3-reviewer cascade**——也就是和當初 AP Bio M1–M9 一樣，是「沒過品管就出貨」的狀態。
其中 **11 支已經上 YouTube、家長看得到了**，這條剛好踩在 CLAUDE.md 最在意的第一條：**信任**。

## 為什麼這一棒沒有自己修

cascade 的第三位 reviewer（Citation Checker / 防幻覺）規定**只能拿 `references/<slug>-ced.md` 來比對**。
目前 `references/` 只有 `ap-biology-ced.md` 和 `ap-calc-ab-ced.md`，
**AP CS A 和 AP Psychology 都沒有 CED reference doc**，所以 Reviewer C 根本跑不起來。

按 AUTO_PIPELINE.md 的硬規定，「沒有 reference 就不要產不能被引用核對的內容」——
硬產只會重演 AP Bio M1–M9 的退步。所以這一棒選擇誠實做 QA、不硬幹。
（我也沒有自己捏一份 CED 來假裝核對，那等於左手查右手，失去 cascade 的意義。）

## 哪些已經上線（最該先看的）

**AP Computer Science A（10 支全部沒 cascade，7 支已上線）**
- 已上線：M1 primitives、M2 using-objects、M3 booleans-if、M4 iteration、M5 writing-classes、M6 array、M10 recursion
- 還沒上線：M7 arraylist、M8 2d-array、M9 inheritance
- 內容缺口：對照課程 JSON（14 單元）還少一支 **「Sorting & Searching Algorithms」**（JSON M14）

**AP Psychology（16 支全部沒 cascade，4 支已上線）**
- 已上線：M1 history、M11 personality、M12 testing-intelligence、M13 abnormal
- 還沒上線：M2–M10、M14–M16
- 內容覆蓋完整（16 支對得上 16 個單元），只是都沒被核對過

好消息：**禁用詞掃描全乾淨**（沒有 Cognia / accredited / US-accredited / UCSB / NJIT /（SIT）/ 美国认证），
四門 AP 課的 script 和 build_slides 都沒有踩到不實宣稱。

## 建議的處理順序

1. **補兩份 CED reference**：`references/ap-cs-a-ced.md`、`references/ap-psychology-ced.md`
   （這是唯一的解鎖鑰匙，補了之後自動化才有正規可做的事）
2. CED 補好後，下一棒先對**已存在的 script.json** 跑一輪 **post-hoc cascade**
   （比照 2026-05-19 對 AP Bio M1–M9 的做法），**先把已上線的 11 支補核對**，再談產新內容。
3. 已經上 YouTube 的（broadcast-locked）**不要改 script.json**；
   若 reviewer 抓到錯，照 AP Calc M4/M12 的前例，把 errata 寫到 `_review_failed/<slug>/WHY.md` 留給人類重錄。
4. （可選、低風險）AP CS A 缺的「Sorting & Searching」要等 CED 有了才產。

## 其他可選的清理（不急）

- repo 裡有兩個 `_audit/` 位置（root 的 `/_audit/<course>/` 和 `/teaching-videos/_audit/<course>/`），可以擇日合併。
- `audit_lessons.py` 在同一秒連跑會撞檔名，建議輸出檔名加 per-lesson 後綴。
- 每支 AP 影片 audit 都會跳的「AP course naming…」其實是 `audit_lessons.py` 第 284–285 行對任何「AP 」開頭課程的固定提醒，不是個別瑕疵，可以不用理它。

完整數據在同資料夾的 `2026-05-22T10-12-36Z-summary.json`。
