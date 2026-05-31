# macOS launchd 一次性安裝（foundation-video 23:00）

> 舊的 `lesson-build 08:00 + youtube-daily 09:00` 是 AP-era pipeline，已因品質風險暫停。
> 新的 foundation pipeline 只有一個 23:00 CT 工作：Umi/Codex 先做 source packet
> 和 gate，cc 做影片製作，最後只上傳 approval artifact 裡的影片。

## 全景

```
23:00 CT ── Mac launchd: com.giis.foundation-video-daily
           │   ├─ foundation_daily_orchestrator.py
           │   ├─ select 2-3 non-AP foundation modules
           │   ├─ verify module/resources/URLs
           │   ├─ write source_packet + teaching/visual brief
           │   ├─ call cc_foundation_worker.py
           │   ├─ render/gate/release check
           │   ├─ write approved_ready_to_upload.json only for clean score 100
           │   ├─ yt_queue.py upload --gate-ready --privacy unlisted
           │   └─ sync manifest + commit/push metadata
              ↓
           Netlify 自動 deploy → Learn Portal 出現新影片
```

不裝 launchd 就不會 auto 跑。但**手動隨時可以 dry-run**：

```bash
bash /Users/alanhdchu/giis-website/tools/lesson-video/foundation_daily.sh \
  --dry-run --no-cc --no-upload --skip-network-check
```

---

## 安裝步驟（一次 4 行）

```bash
cd /Users/alanhdchu/giis-website

# 1. 把新的 foundation plist 複製到 LaunchAgents 資料夾（macOS 掃描的地方）
cp tools/lesson-video/com.giis.foundation-video-daily.plist ~/Library/LaunchAgents/

# 2. Load job 進 launchd
launchctl load ~/Library/LaunchAgents/com.giis.foundation-video-daily.plist

# 3. 確認 launchd 真的看到了
launchctl list | grep giis
```

裝完就**等下一個 23:00 CT 自動跑**了。

---

## 馬上手動觸發看跑不跑得起來（推薦做一次）

不用等明天 23:00，可以強制觸發看看：

```bash
launchctl kickstart -k gui/$(id -u)/com.giis.foundation-video-daily

# 跟著 log 看執行過程
tail -f ~/Library/Logs/giis-foundation-video-daily.log
```

第一次正式跑可能會很久，因為 cc 要製作 slides/TTS/MP4。想只驗證選題與 source packet 邏輯，先跑 dry-run。

---

## 日常維護

| 想做的事 | 指令 |
|---|---|
| 看今天跑得怎樣 | `tail ~/Library/Logs/giis-foundation-video-daily.log` |
| 看錯誤 | `cat ~/Library/Logs/giis-foundation-video-daily.err.log` |
| 暫停 job | `launchctl unload ~/Library/LaunchAgents/com.giis.foundation-video-daily.plist` |
| 恢復 | 同檔案 `launchctl load ...` |
| 永久移除 | `unload` + `rm ~/Library/LaunchAgents/com.giis.foundation-video-daily.plist` |
| 改 schedule（例如改 9am 為 10am） | 編輯 repo 裡的 plist，重新 cp + unload + load |

---

## 常見坑

**1. Mac 23:00 在睡覺怎辦？**

launchd 預設「醒來補跑」是開的，但筆電 lid 關著放包包裡可能不會醒。如果你的 Mac 平常 23:00 不一定開，建議：
- 把時間調到你比較確定 Mac 醒著的時候（例如改成 14:00）
- 或者改成多時段觸發（在 plist 的 `StartCalendarInterval` 改成 array 列多個時段）

**2. Python 路徑找不到**

`foundation_daily.sh` 預設先找 `~/.cache/giis-video-pipeline-venv/bin/python`，
再找 `/opt/homebrew/bin/python3`，最後才用 PATH 上的 `python3`。這個 venv
需要 `Pillow edge-tts imageio-ffmpeg google-api-python-client
google-auth-oauthlib google-auth`。

**3. OAuth token 半年後過期**

跑到 `invalid_grant` → `rm /Users/alanhdchu/giis-website/tools/youtube-upload/token.json`，下次手動 `npm run yt:upload` 彈瀏覽器重 auth，之後 launchd 又可以跑。

**4. foundation pipeline 太重 / Mac 太燙**

預設每天最多 3 支。可以用環境變數改小：

```bash
FOUNDATION_MAX_MODULES=1 FOUNDATION_UPLOAD_MAX=1 \
  bash tools/lesson-video/foundation_daily.sh
```
