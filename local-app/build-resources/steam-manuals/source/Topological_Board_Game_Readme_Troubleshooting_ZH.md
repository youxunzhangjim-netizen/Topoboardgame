# Topological Board Game - README 與問題排除

語言：繁體中文

本檔案提供 Steam 使用者安裝、帳號、線上房間、顯示、效能與重設協助。

## 1. 安裝

- 從 Steam 安裝遊戲。
- 從 Steam Library 啟動。
- 測試版若出現 Windows SmartScreen，請確認發行者與資料夾是預期來源。
- 建議安裝在正常可寫入的 Steam library 資料夾。

## 2. 支援平台

- Windows 64-bit 是主要建置目標。
- macOS 64-bit 與 Linux 可在 Steam depot 包含時發布。
- Android 不是 Steam 桌面版目標，除非另外準備行動版。

## 3. 顯示與控制

- 棋盤跑出畫面時使用 Reset Camera。
- 使用縮放滑桿、滑鼠滾輪或支援頁面的雙指縮放。
- 手機大小視窗會把控制項垂直排列。
- 若文字重疊，請改用較寬視窗或降低瀏覽器 / app 縮放。

## 4. 線上帳號協助

- Email/password 登入需要在 Firebase console 啟用 Email/Password sign-in。
- 若訊息顯示「This sign-in method is not enabled yet」，請開啟 Firebase Console，Authentication，Sign-in method，啟用 Email/Password。
- 重設密碼需要輸入已註冊 email。
- 刪除帳號要小心，因為線上身份資料可能遺失。

## 5. 線上房間

- 檢查網路連線。
- 使用相同遊戲類型、棋盤模式與 room code。
- 若房間狀態異常，離開後重新建立房間。
- 某些實驗性模式在安全同步完成前可能停用線上功能。

## 6. Robot Mode

- 機器人難度會影響速度。
- 較強等級可能思考更久。
- 如果機器人太慢，降低棋盤大小或選擇較低等級。

## 7. Firebase 設定

- 網站部署需要公開 Firebase web config。
- Vite build 應使用 VITE_FIREBASE_API_KEY 等變數。
- 本機 preview 如果沒有環境檔，可能會提示缺少 config。
- 若部署到 hosting provider，Production 與 Preview 需要的變數都應設定。

## 8. Steam 建置檔

- Steam app id 使用 Steamworks 指派的 app id。
- Depot content 必須指向已建置的遊戲資料夾。
- 使用 Steamworks ContentBuilder 上傳。
- 請保留 capsule 圖、icon、manuals、privacy policy、EULA 與 third-party notices。

## 9. 效能

- 3D、4D、大型 Go、Life 掃描與研究圖表可能負擔較高。
- 降低棋盤大小、晶格複雜度或視覺透明度。
- 關閉其他大量使用 GPU 的程式。
- 研究級掃描可用 Python 離線產生，再匯入資料。

## 10. 重設本機資料

- Browser / local app 設定可能包含語言、房間設定、筆記本與已存實驗。
- 優先使用遊戲內 Reset 按鈕。
- 必要時可清除網站或 app webview storage。
- 清除資料前請先匯出重要筆記本。

## 11. 已知限制

- 某些高階拓撲棋盤是數學空間的視覺近似。
- 某些 Labs 模型是 toy 或 estimator 等級示範，不是校準過的物理模擬。
- 某些實驗性時間改寫模式會停用線上同步。

## 12. 取得協助

- 詳細規則請看 Full Manual。
- 短步驟請看 Quick Start Guide。
- Steam Basic Info 分頁的線上手冊只用於文件／支援，不要連到可遊玩的網頁啟動器。Steam 版本是官方桌面版。
