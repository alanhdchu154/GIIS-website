# GIIS 任務歸屬與對話整理

2026-10-04 建立並依 Alan 的 GIIS3 決定更新。此表管理 owner、實際接受狀態
與歷史去向，不承載重複 backlog。Umi 是 GIIS shared-doc writer 與校務營運
owner；只有具體工作才派發，日常 owner 沒有工作包時即待命。

| 角色 | 對話識別 | Current ownership / acceptance |
| --- | --- | --- |
| GIIS Umi／校務營運 | `01a10544-eb12-71f3-ac89-54133d9a53a5` 原「校長」 | **已接受**三個日常 owner 的 routing／驗收，以及原 registrar／compliance 未移交的報告、證據缺口與批准問題追蹤；不是 Principal 或法規簽核人。 |
| 教學與學務 | `01a06e31-dd7e-72f2-a350-c40e39978778` 原「檢查考試與作業品質」 | Alan 指定沿用此日常 owner；保留既有 unified content schedule target、時間與 ACTIVE 狀態。角色更新不等於新 worker run 或學術批准。 |
| 招生與家長服務 | `01a06e12-0149-79c1-96c3-a0e1741bdd08` 原「研究 GIIS 申請與課程模式」 | Alan 指定沿用此日常 owner；負責已授權案件的下一步與完成證據。舊 session 安全工作屬平台工程；舊批准不是現況證據。 |
| 平台工程 | `01a10868-bf73-7761-ac64-4c0efcce250f` 原「GIIS｜Branch 清理與分批部署」 | Alan 指定沿用此日常 owner；現階段待命，沒有因改名獲得新部署、資料或 credentials 權限。 |
| 學籍專家（按需） | `01a1087e-7a13-7612-92a3-8842989611fb` | 保留歷史與 registrar-intake 證據；Alan 明確批准後，Central 已於 2026-10-04 封存同一 ID（`archived:true`）。未喚醒、未接受新工作；既有責任由 GIIS Umi 承接。只有具體學籍 dependency 或必要獨立 gate 才回復同一 ID 並由 Umi 發 scoped packet。 |
| 合規專家（按需） | `01a10869-276d-7421-84bc-53cf2b65c82a` | 保留 school-ops／registration／accreditation 歷史；Alan 明確批准後，Central 已於 2026-10-04 封存同一 ID（`archived:true`）。未喚醒、未接受新工作；既有責任由 GIIS Umi 承接。只有具體官方來源／合規 dependency 或必要獨立 gate 才回復同一 ID 並由 Umi 發 scoped packet。 |
| 歷史影片紀錄 | `019ed161-61fe-7240-8d07-4f0c0ae1fdf3` 原「GIIS_影片_producer」 | 保留查閱，不再獨立派工；影片業務已納教學與學務。 |

主責移交規則：Alan 的角色指定由 GIIS Umi 接受並寫入 routing；實際工作包
仍須由 named owner 接受 scope 與 checkpoint。未接受前責任留在 sender／Umi，
不能只因 registry 已更新就宣稱 specialist 或 idle owner 正在執行。

GIIS3 重組當時沒有刪除、封存或重建對話；其後 Alan 明確批准清理，Central
已於 2026-10-04 封存上述兩個 specialist 的同一 ID。本專案 worker 不操作
app title 或對話狀態；沒有刪除、重建或排程變更。Central files 仍由 Central
處理。非 GIIS 專案不搬動；跨專案平台能力只能使用分開的 repo、資料、
credentials、release authority 與批准 packet。

`giis` 維持既有 ACTIVE 每日 00:00 CT target；`giis-video-quality-daily` 維持
PAUSED。本輪不新增／修改排程，不自動恢復歷史影片工作，也不授予學術批准。
