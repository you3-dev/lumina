# Phase 3: 大規模欠落機能実装計画

## 🎯 目的
分割時に欠落した約30個の関数と220行のメニュー操作コードを一括実装し、ゲームを完全に動作する状態に戻す。

---

## 📊 現状分析サマリー

### 元のコード
- **総関数数**: 約220個
- **総イベントリスナー**: 28個

### 分割後のコード
- **総export function数**: 113個
- **総イベントリスナー**: 24個

### 欠落状況
- **欠落関数**: 約30個の重要関数
- **欠落イベントリスナー**: 4個（タイトル画面関連）
- **欠落コード**: メニュー操作の入力処理（約220行）

---

## 🔴 発見された問題と原因

### 問題1: メニュー操作ができない
**原因**: メニュー操作の入力処理コード（約220行）が完全に欠落
**場所**: input.js の handleKeyDown 関数内（現在は `// メニュー操作は後で実装` のみ）
**元のコード**: index_6c69ad3.html 10600-10818行

### 問題2: 宿屋で固まる
**原因**: confirmInn() 関数が欠落
**元のコード**: index_6c69ad3.html 7528行

### 問題3: バトル画面の表示崩れ・敵が表示されない
**原因**: バトル関連の関数が一部欠落している可能性
**調査が必要**: battle.jsの実装状況を確認

---

## 📋 欠落している関数一覧（優先度順）

### 🔴 最優先: メニュー操作（8関数）

| 関数名 | 元の行番号 | 実装先 | 説明 |
|--------|-----------|--------|------|
| `executeItemAction()` | 7404 | engine.js | アイテムアクション実行 |
| `confirmEquipMember()` | 7479 | engine.js | 装備メンバー選択確定 |
| `confirmItemMember()` | 7501 | engine.js | アイテム使用メンバー選択確定 |
| **メニュー入力処理** | 10600-10818 | input.js | handleKeyDown内の220行コード |

### 🔴 最優先: 宿屋・教会システム（4関数）

| 関数名 | 元の行番号 | 実装先 | 説明 |
|--------|-----------|--------|------|
| `confirmInn()` | 7528 | engine.js | 宿屋利用確定（固まる問題の原因！） |
| `selectChurchMenu()` | 7584 | engine.js | 教会メニュー選択 |
| `confirmChurchMember()` | 7620 | engine.js | 教会対象メンバー確定 |
| `confirmChurchAction()` | 7650 | engine.js | 教会アクション確定 |

### 🔴 最優先: ショップシステム（2関数）

| 関数名 | 元の行番号 | 実装先 | 説明 |
|--------|-----------|--------|------|
| `updateSellableItems()` | 7707 | engine.js | 売却可能アイテムリスト更新 |
| `closeShop()` | 7716 | engine.js | ショップを閉じる |
| **handleShopInput完全版** | 7721 | engine.js | 現在は基本実装のみ |

### 🟡 高優先: フィールド魔法・アイテム使用（11関数）

| 関数名 | 元の行番号 | 実装先 | 説明 |
|--------|-----------|--------|------|
| `useItem(itemId, targetMember)` | 7857 | engine.js | アイテム使用 |
| `useSpellInField()` | 7969 | engine.js | フィールドで呪文使用 |
| `executeFieldSpellOnTarget()` | 8048 | engine.js | フィールド呪文を対象に実行 |
| `useRura()` | 8136 | engine.js | ルーラ使用 |
| `executeRura(locationIndex)` | 8173 | engine.js | ルーラ実行（async） |
| `playRuraAnimation()` | 8199 | engine.js | ルーラアニメーション（async） |
| `useRiremito()` | 8214 | engine.js | リレミト使用 |
| `playRiremitoAnimation()` | 8251 | engine.js | リレミトアニメーション（async） |
| `drawRuraSelection()` | 8265 | renderer.js | ルーラ選択画面描画 |
| `cancelRuraSelection()` | 8323 | engine.js | ルーラ選択キャンセル |
| `equipItem(itemId, member)` | 8327 | engine.js | 装備品を装備 |

### 🟢 中優先: バトルシステム（調査後に決定）

battle.jsの実装状況を確認し、欠落している関数を特定する必要があります。

### 🟢 低優先: タイトル画面イベント（4個）

| イベント | 元の行番号 | 実装先 | 説明 |
|----------|-----------|--------|------|
| soundToggleBtn touchend | 11699 | app.js | タッチデバイス対応 |
| menuContinue click | 12033 | engine.js | コンティニューボタン |
| menuNewGame click | 12042 | engine.js | ニューゲームボタン |
| titleScreen click | 12051 | engine.js | タイトル画面全体クリック |

---

## 🗂️ 実装ステップ

### Step 1: 最優先機能の実装（メニュー・宿屋・ショップ）

#### 1.1 メニュー操作の入力処理（input.js）
- handleKeyDown 関数内の `// メニュー操作は後で実装` 部分に220行のコードを実装
- 元のコード: index_6c69ad3.html 10600-10818行
- 含まれる処理:
  - ステータスタブの操作
  - 呪文タブの操作（メンバー選択、呪文選択、対象選択）
  - アイテムタブの操作（アイテム選択、アクション選択、対象選択）
  - ちずタブの操作
  - タブ切り替え

#### 1.2 メニュー関連関数（engine.js）
```javascript
export function executeItemAction() { ... }
export function confirmEquipMember() { ... }
export function confirmItemMember() { ... }
```

#### 1.3 宿屋・教会システム（engine.js）
```javascript
export function confirmInn() { ... }
export function selectChurchMenu() { ... }
export function confirmChurchMember() { ... }
export function confirmChurchAction() { ... }
```

#### 1.4 ショップシステム（engine.js）
```javascript
export function updateSellableItems() { ... }
export function closeShop() { ... }
// handleShopInput を完全実装に置き換え
```

### Step 2: フィールド魔法・アイテム使用（engine.js + renderer.js）

```javascript
// engine.js
export function useItem(itemId, targetMember) { ... }
export function useSpellInField() { ... }
export function executeFieldSpellOnTarget() { ... }
export async function useRura() { ... }
export async function executeRura(locationIndex) { ... }
export async function playRuraAnimation() { ... }
export function useRiremito() { ... }
export async function playRiremitoAnimation() { ... }
export function cancelRuraSelection() { ... }
export function equipItem(itemId, member) { ... }

// renderer.js
export function drawRuraSelection() { ... }
```

### Step 3: バトルシステムの調査と修正

1. battle.jsの実装状況を確認
2. 欠落している関数を特定
3. 必要に応じて実装

### Step 4: タイトル画面イベント（低優先）

app.js または engine.js にイベントリスナーを追加

---

## 🧪 テスト計画

実装完了後、**1回だけ**の包括的テストで以下を確認：

### 必須確認項目
- [ ] メニューが開き、カーソルキーで操作できる
- [ ] ステータス、呪文、アイテム、ちずの各タブが動作する
- [ ] 宿屋で話しかけても固まらない、宿泊できる
- [ ] 教会で蘇生・解毒ができる
- [ ] ショップで売買ができる
- [ ] バトル画面で敵が表示される
- [ ] バトル画面のHP/MPが正しく表示される
- [ ] バトルコマンドが表示され、操作できる
- [ ] エンカウントが正常に動作する

### オプション確認項目
- [ ] フィールドでアイテム使用ができる
- [ ] フィールドで呪文（ルーラ、リレミト等）が使える
- [ ] タイトル画面のボタンが動作する

---

## 📝 実装時の注意事項

### 依存関係の確認
以下の関数がengine.jsやstate.jsに存在するか確認：
- `startDialog()`
- `addItem()` / `removeItem()`
- `saveGame()`
- `setGameMode()`
- `items` オブジェクト（data.js）
- `spells` オブジェクト（data.js）

### import文の追加
必要に応じて以下のimportを追加：
```javascript
// engine.js
import { items, spells } from './data.js';

// input.js に既に必要なものは追加済み
```

### 関数の呼び出し元
- executeItemAction は メニュー入力処理から呼ばれる
- confirmInn は 宿屋の入力処理から呼ばれる
- useSpellInField は メニュー入力処理から呼ばれる

---

## 🚀 実装開始

このガイドに従って、Step 1から順に実装を進めます。
全実装完了後、1回の包括的テストで動作確認を行います。
