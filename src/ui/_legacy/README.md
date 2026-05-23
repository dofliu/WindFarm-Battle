# 舊 UI 元件（已棄用）

依 HANDOFF-UI.md 的重寫指示，src/ui/components/ 已全部替換為 Cumulus / Tideboard 雙主題系統。本資料夾保留舊版（tailwind dashboard 風格）作為設計史對照，**不再有任何地方 import**。

## 對應替換

| 舊檔（_legacy） | 新檔（src/ui/） |
|---|---|
| `CardChip.tsx` | `components/Card.tsx` |
| `TurbineSlot.tsx` | `components/Turbine.tsx` |
| `PlayerArea.tsx` | `screens/BattleScreen.tsx`（內嵌） |
| `GameHeader.tsx` + `StatusPanel.tsx` | `components/BattleCenter.tsx` |
| `EventLog.tsx` | 拿掉（改以動畫 / toast 呈現） |
| `AiTurnSummary.tsx` | 暫時拿掉（未來可在中央條補回） |
| `HowToPlayModal.tsx` | 暫時拿掉（之後接入 TopBar 玩法按鈕） |
| `CardLibraryModal.tsx` | `components/LibraryModal.tsx` |
| `SimulatorPanel.tsx` | 暫時拿掉（屬於工具列，非戰鬥畫面，後續可以放在獨立 route） |

若日後要恢復某個功能（例如完整事件流檢視 / 玩法說明），可從此處抄回邏輯，但視覺要套新主題（用 `useTheme()`）。
