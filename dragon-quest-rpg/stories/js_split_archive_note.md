# js/ フォルダ（分割版）アーカイブノート

## 概要

area5 実装に伴い index.html が巨大化したため、js/ フォルダにモジュール分割を試みたが、
多くの関数欠落・バグが発生し修復困難となったため、分割前の状態（index_6c69ad3.html）に戻した。

js/ フォルダは**参考用として残してある**。

## 分割版の経緯

- **分割前**: index.html 12,074行（完全に動作）
- **分割後**: index.html + js/ フォルダ 10ファイル、合計 6,070行
- **結果**: 約30個の重要関数が欠落、ゲームが正常に動作しない状態に

## js/ フォルダのファイル構成

| ファイル | 行数 | 責務 |
|---------|------|------|
| state.js | 473行 | ゲーム状態、gameProgress、player/party データ |
| constants.js | 152行 | 定数（TILE、MODE、MAP_TILE_COLORS） |
| data.js | 331行 | ゲームデータ（items、monsters、spells） |
| engine.js | 2,227行 | ゲームロジック、NPC、メニュー、ワープ、セーブ |
| battle.js | 251行 | 戦闘システム、敵グループ生成 |
| renderer.js | 1,102行 | 描画全般（マップ、NPC、UI） |
| input.js | 715行 | キーボード、タッチ、パッド入力処理 |
| map.js | 311行 | ワールドマップ表示・管理 |
| sound.js | 377行 | オーディオ管理、SE、BGM |
| app.js | 131行 | メインゲームループ、初期化 |

## 分割版で欠落していた主な機能

### フラグ操作関数（致命的）
- `setStoryFlag()`, `setBossDefeated()`, `setQuestFlag()`, `getQuestFlag()`

### NPC 相互作用関数（13個）
- `handleHealerNpc()`, `handleKingDialog()`, `handleBossNpc()`
- `handlePartyJoinNpc()`, `executePartyJoin()` など

### メニュー・入力処理（約220行）
- 宿屋、教会、ショップの入力処理が完全欠落
- `confirmInn()`, `executeItemAction()`, `equipItem()` など

### その他
- `startMaouBattle()`, `collectWedge()`, `flashScreen()` など

## 関連ドキュメント（作成済みだが未解決のまま）

以下のドキュメントは分割版の修復を試みた際に作成されたもの：

- `BATTLE_DRAW_IMPLEMENTATION.txt`
- `EVENT_LISTENERS_ANALYSIS.md`
- `IMPLEMENTATION_PLAN.md`
- `MIGRATION_CHECKLIST.md`
- `ORIGINAL_FUNCTIONS_LIST.md`
- `PHASE1_IMPLEMENTATION_GUIDE.md`
- `PHASE2_IMPLEMENTATION_GUIDE.md`
- `PHASE3_IMPLEMENTATION_PLAN.md`
- `SPLIT_FUNCTIONS_LIST.md`

## 今後の方針

1. **index.html（単一ファイル）をベースに area5 を実装する**
2. 分割は行わず、単一ファイルのまま開発を継続
3. 将来的に分割が必要になった場合は、以下に注意：
   - 1システムずつ段階的に分割
   - 各段階で動作確認
   - 関数の欠落チェックリストを作成

## 復元日

2025-01-25

## 復元コミット

`0237857` - revert: index.htmlを分割前の状態(index_6c69ad3.html)に復元
