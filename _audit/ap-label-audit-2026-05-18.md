# AP 用字稽核 — 2026-05-18

對應 backlog 任務：**T-004**（AP label 合規檢查）

## 結論摘要

代碼裡共有 **9 個檔案分類** 引用「AP」。風險程度從高到低分類如下，等 Alan 在 [AP Course Ledger](https://apcentral.collegeboard.org/courses/ap-course-audit) 確認 GIIS 是否在冊後，照分類批次處理。

---

## ⚠️ HIGH RISK：transcript / 課程資料 / 學生成績單上的「AP」label

**未通過 AP Course Audit 之前不能用。** 這些是 audit 來查、家長下載成績單會看到的地方。

### 1. `server/prisma/seed.js` — `courseType` 欄位
- `courseRow(sortOrder, courseName, courseType, ...)` 第 11、28 行
- 5 位 senior 的 transcript 內若有 `courseType: 'AP'`，匯到 `CourseRow.courseType`，再印到 PDF transcript

**需要：** Grep seed.js 全文找 `'AP'`，列出每個 senior 的「AP-marked」課，與 Alan 一起決定改成 `'Honors'` 或 `'Advanced'`。

### 2. `server/prisma/courses/**/*.json` — 課程種子資料
9 個檔案：
- `science/ap-biology.json`
- `math/ap-calculus-ab.json`
- `math/ap-statistics.json`
- `electives/ap-computer-science-a.json`
- `psychology/ap-psychology.json`
- `social-studies/ap-human-geography.json`
- `english/english-iii.json`、`english/english-iv-advanced-composition.json`（內容裡有提到 AP 字樣）

每個檔案的 `slug`、`name`、`type` 欄位需檢查。如果 ledger 沒過，最低限度改：
- `type: "AP"` → `type: "Honors"` 或 `"Advanced"`
- `name: "AP Calculus AB"` → `"Calculus AB (Honors)"` 或 `"Advanced Calculus"`
- slug 可暫時保留（內部識別），但 user-facing name 必改

### 3. `src/components/pages/Transcript/transcriptPdf.js`、`transcriptMappers.js`、`GradeTable.js`
顯示 transcript 的 PDF / HTML，會根據 `courseType === 'AP'` 給予 weighted GPA 加分（AP=5.0 scale）。

- 如果 AP label 撤掉，weighted GPA 計算邏輯也要改
- 替代方案：Honors 課程沿用 4.5 scale（多數美國 high school 慣例）

**Action：** Alan 確認後，跑全 codebase replace + 重新跑 GPA 計算 + 重 seed senior transcript

---

## ⚠️ MEDIUM RISK：Pathways 頁面與 Course Catalog（招生／marketing）

家長看的「我兒子讀什麼」頁面。

### `src/components/pages/Pathways/*Pathway.js`（8 個 pathway 檔）
全部都有 `stats: [{ label: 'AP Courses', value: N }]` + curriculum 表內列「AP Calculus」「AP Statistics」等。

如果 ledger 沒過：
- `'AP Courses'` stat 改成 `'Honors Courses'` 或 `'Advanced Courses'`
- 課程名 `'AP Calculus AB'` → `'Calculus AB (Advanced)'`
- **保留可以說的**：「Prepares students for the AP Calculus exam」「Aligned to the College Board AP curriculum framework」是 OK 的（外部 reference，沒宣稱我們是 AP 認證）

### `src/components/pages/Academics/Academics/CourseCatalog.js`、`Academicsintroduction2.js`
和上面同邏輯處理。

---

## 🟢 LOW RISK：外部參考連結與「the AP exam」字樣

這些不是 GIIS 的宣稱，是引用 College Board 官方／第三方資源／提到「AP exam」這個外部考試。**保留即可。**

範例：
- `'https://apclassroom.collegeboard.org/'` 連結
- `'AP Statistics — Khan Academy'`
- `'Achieve a score of 3 or higher on the AP CS A exam'`（鼓勵學生考外部考試）
- `'AP Exam Prep'` 作為課程 unit 名稱
- pathway hero copy 內 `'AP Statistics and a strong Calculus record are the baseline'`（提及產業標準，沒宣稱我們提供）

---

## 🟢 NONE：教學影片資產（內部）

不對外宣稱、純內部命名：
- `teaching-videos/ap-biology-module-*/`
- `teaching-videos/ap-calculus-ab-module-*/`
- `teaching-videos/ap-cs-a-module-*/`
- `_audit/ap-biology/*.json`、`references/ap-biology-*.md`
- `public/data/lessons-manifest.json`（YouTube playlist metadata）

這些是 College Board CED（Course and Exam Description）對齊的教學內容。即使我們不能用「AP」label 在 transcript 上，教學內容對齊 CED 是業界正常做法，不違規。

---

## 一頁可執行的決策樹

```
Alan 上 AP Course Ledger 查 GIIS：
│
├─ ✅ 已在 ledger（含 approved AP courses）
│      → 沒事，全部「AP」字樣保留。
│      → 只需在 School Profile 註明 "AP courses approved by College Board"，附上 ledger URL。
│
└─ ❌ 不在 ledger / 部分課程未過
       → 對「未過」的課程，執行：
           1. seed.js courseType "AP" → "Honors"
           2. courses/**/*.json type/name 對應替換
           3. Pathways 頁面 'AP X' → 'X (Advanced)' 或 'X (Honors)'
           4. transcriptPdf weighted GPA：AP scale (5.0) → Honors scale (4.5)
           5. 重 seed senior 5 人 transcript
           6. 重 export PDF transcript 寄/upload
           7. 對外宣傳「Honors / Advanced」改稱
       → 同時：提交 AP Course Audit syllabus（T-304），等核准後再恢復 AP label
```

---

## 自動化幫手（等 Alan 決定後）

如果 Alan 給出 "請全改成 Honors" 的指令，我可以一次跑完：

```
# Dry-run preview
grep -rn '"type":\s*"AP"' server/prisma/courses/
grep -rn "courseType: 'AP'" server/prisma/seed.js

# 替換
node server/scripts/rename-ap-to-honors.js --dry-run
node server/scripts/rename-ap-to-honors.js --apply
npm --prefix server run db:seed
```

（這個 script 還沒寫，Alan 決定後我再補。）

---

## 給 Alan 的問題

1. **AP Ledger 結果**：GIIS 是否在 College Board AP Course Ledger 上？哪些課過了哪些沒過？
2. **如果都沒過**：我們現在標 AP 的 4 門（AP Calc AB / AP Bio / AP Psych / AP CSA）統一改 `Honors` 還是 `Advanced`？
3. **Weighted GPA**：Honors 課程要不要保留 weighted bonus（4.5）還是當作 regular（4.0）？
4. **AP Course Audit syllabus 申請**（T-304）：要對所有 4 門一起提，還是先試最有把握的 1-2 門？
