# macOS launchd 一次性安裝（lesson-build 08:00 + youtube-daily 09:00）

> 整個 lesson pipeline 在 Mac 端有兩個自動工作。這份文件帶你**一次裝完**兩個。
> 之後想暫停 / 修改也都看這份。

## 全景

```
Day N  11:00  ──  Cowork scheduled task                       (已設好,跑 11:05)
              │   ├─ generator + 3-reviewer cascade
              │   └─ 寫 teaching-videos/<new>/script.json + slides/
              ↓
Day N+1 08:00 ──  Mac launchd: com.giis.lesson-build           ← 這份文件第 1 段
              │   └─ make_lesson.py: edge-tts + ffmpeg
              │                       → <new>/*.mp4
              ↓
Day N+1 09:00 ──  Mac launchd: com.giis.youtube-daily          ← 這份文件第 2 段
              │   ├─ upload_lesson.py: 上 YouTube + transcript
              │   ├─ cleanup_lesson.py: 刪本地 mp4/audio/slides
              │   ├─ sync_channel.py: 更新 manifest
              │   └─ daily.sh auto: git commit + push
              ↓
              Netlify 自動 deploy → Learn Portal 出現新影片
```

兩個工作不裝就不會 auto 跑。但**手動隨時可以跑**：

```bash
bash ~/GIIS/giis-website/tools/lesson-video/daily_build.sh    # 8am 那段
bash ~/GIIS/giis-website/tools/youtube-upload/daily.sh        # 9am 那段
```

---

## 安裝步驟（一次 4 行）

```bash
cd ~/GIIS/giis-website

# 1. 把兩個 plist 複製到 LaunchAgents 資料夾（macOS 掃描的地方）
cp tools/lesson-video/com.giis.lesson-build.plist        ~/Library/LaunchAgents/
cp tools/youtube-upload/com.giis.youtube-daily.plist     ~/Library/LaunchAgents/

# 2. Load 兩個 job 進 launchd
launchctl load ~/Library/LaunchAgents/com.giis.lesson-build.plist
launchctl load ~/Library/LaunchAgents/com.giis.youtube-daily.plist

# 3. 確認 launchd 真的看到了
launchctl list | grep giis
# 預期輸出兩行：
#   -    0    com.giis.lesson-build
#   -    0    com.giis.youtube-daily
#   ^    ^
#   PID  exit code（沒跑時 PID = "-"，exit 0 = 上次跑沒問題）
```

裝完就**等明天 8am 自動跑**了～

---

## 馬上手動觸發看跑不跑得起來（推薦做一次）

不用等明天 8am，可以強制觸發看看：

```bash
launchctl kickstart -k gui/$(id -u)/com.giis.lesson-build
launchctl kickstart -k gui/$(id -u)/com.giis.youtube-daily

# 跟著 log 看執行過程
tail -f ~/Library/Logs/giis-lesson-build.log
# 看完按 Ctrl+C 退出 tail

tail -f ~/Library/Logs/giis-youtube-daily.log
```

預期 lesson-build 日誌會看到 `Nothing to build. All lessons with slides already have MP4s.`（因為 Cowork 還沒產新東西）。youtube-daily 會把目前 pending 的 AP Psych 接著上 4 部。

---

## 日常維護

| 想做的事 | 指令 |
|---|---|
| 看今天 build 跑得怎樣 | `tail ~/Library/Logs/giis-lesson-build.log` |
| 看今天 upload 跑得怎樣 | `tail ~/Library/Logs/giis-youtube-daily.log` |
| 看錯誤（兩種都有 .err.log） | `cat ~/Library/Logs/giis-lesson-build.err.log` |
| 暫停某個 job（出國度假時） | `launchctl unload ~/Library/LaunchAgents/com.giis.lesson-build.plist` |
| 恢復 | 同檔案 `launchctl load ...` |
| 永久移除 | `unload` + `rm ~/Library/LaunchAgents/com.giis.*.plist` |
| 改 schedule（例如改 9am 為 10am） | 編輯 repo 裡的 plist，重新 cp + unload + load |

---

## 常見坑

**1. Mac 8am / 9am 在睡覺怎辦？**

launchd 預設「醒來補跑」是開的，但筆電 lid 關著放包包裡可能不會醒。如果你的 Mac 平常 9am 不一定開，建議：
- 把時間調到你比較確定 Mac 醒著的時候（例如改成 14:00）
- 或者改成多時段觸發（在 plist 的 `StartCalendarInterval` 改成 array 列多個時段）

**2. Python 路徑找不到**

`daily_build.sh` 預設找 `/Users/alanhdchu/anaconda3/bin/python3`，找不到就用 PATH 上的 `python3`。如果你 anaconda 路徑不一樣，編輯 `tools/lesson-video/daily_build.sh` 開頭的 `PYTHON_CANDIDATES`。

**3. OAuth token 半年後過期**

跑到 `invalid_grant` → `rm ~/GIIS/giis-website/tools/youtube-upload/token.json`，下次手動 `npm run yt:upload` 彈瀏覽器重 auth，之後 launchd 又可以跑。

**4. lesson-build 太重 / Mac 太燙**

每天 4 部 lesson 大概 4-8 分鐘 CPU 滿載。如果嫌吵，編輯 `daily_build.sh` 開頭的 `MAX_BUILDS` 從 4 改成 2。或者改成只在插電時跑（要加 launchd 的 power assertion，比較進階）。

**5. 兩個 launchd 撞時間**

我刻意設 8am + 9am 中間留 1 小時。lesson-build 把 4 部 build 完通常 ~5 分鐘，9am upload 開始前一定結束。如果你改 schedule 要保留這個 buffer。

---

## 全部設定後的 day-1 體驗

今天（手動 trigger 一次後）：
- 11:05 Cowork 跑 → AP Calc M2 script.json + slides 出現
- 你 review M2，覺得 OK

明天：
- 08:00 lesson-build 跑 → M2 變成 MP4
- 09:00 youtube-daily 跑 → M2 上 YouTube + manifest 自動更新 + git push
- 你打開 https://giis.school/learn 看到 M2 已經能看
- 11:05 Cowork 接著做 M3 ~ M12（一次做完整 AP Calc）

往後幾天：
- Mac 每天上 4 部 YouTube（quota 限制），Cowork 每天產 1 整 course
- Backlog 累積（generated 比 uploaded 多），這是預期且健康的，內容 cushion

---

## 全部就先到這～

剩下唯一還沒做的：你 Cowork sidebar 點 **Run Now** 跑第一次 smoke test。要不要現在就試？
