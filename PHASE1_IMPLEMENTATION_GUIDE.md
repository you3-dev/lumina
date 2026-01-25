# Phase 1: 欠落機能実装ガイド（詳細版）

## 🎯 目的
分割前のindex_6c69ad3.htmlから欠落している9個の機能を実装する。
このドキュメントは実装中に参照し、完了したら✅でマークする。

---

## 📋 実装対象の全体像

### 欠落している機能（9個）
1. ❌ worldMapOverlay クリックイベント
2. ❌ canvas クリックイベント（handleCanvasTap）
3. ❌ canvas touchendイベント（handleCanvasTap）
4. ❌ ダブルタップ防止（document touchend）
5. ❌ ピンチズーム防止（document touchstart）
6. ❌ gesturestart防止
7. ❌ gesturechange防止
8. ❌ gestureend防止
9. ❌ contextmenu防止

---

## 🗂️ ファイル構成計画

### 新規作成
- `dragon-quest-rpg/js/map.js` - ワールドマップ機能専用モジュール

### 変更
- `dragon-quest-rpg/js/input.js` - 各種イベントリスナー追加
- `dragon-quest-rpg/js/app.js` - map.jsのインポート

---

## 📝 Step 1: 必要な関数の抽出と理解

### コマンド実行チェックリスト
```bash
# renderWorldMap関数を検索
grep -n "function renderWorldMap" dragon-quest-rpg/index_6c69ad3.html

# startPlayerMarkerAnimation関数を検索
grep -n "function startPlayerMarkerAnimation" dragon-quest-rpg/index_6c69ad3.html

# worldMapAnimationId変数を検索
grep -n "worldMapAnimationId" dragon-quest-rpg/index_6c69ad3.html

# openWorldMapの全体を確認（25行表示）
grep -A 25 "function openWorldMap" dragon-quest-rpg/index_6c69ad3.html

# closeWorldMapの全体を確認（15行表示）
grep -A 15 "function closeWorldMap" dragon-quest-rpg/index_6c69ad3.html
```

### 抽出が必要な関数（index_6c69ad3.html）
- [ ] openWorldMap() - 11358行付近
- [ ] closeWorldMap() - 11379行付近
- [ ] renderWorldMap() - 検索で確認
- [ ] startPlayerMarkerAnimation() - 検索で確認
- [ ] updateMapPinVisibility() - 11604行付近

---

## 📝 Step 2: map.js の作成

### ファイル: dragon-quest-rpg/js/map.js

#### インポート
```javascript
import { MODE } from './constants.js';
import { gameMode, setGameMode, currentMap, player } from './state.js';
```

#### 実装する関数
```javascript
export function openWorldMap() { ... }
export function closeWorldMap() { ... }
export function renderWorldMap() { ... }
export function updateMapPinVisibility() { ... }
```

#### チェックリスト
- [ ] DOM要素の取得（worldMapOverlay, worldMapCanvas, worldMapTitle）
- [ ] openWorldMap実装
- [ ] closeWorldMap実装
- [ ] renderWorldMap実装
- [ ] startPlayerMarkerAnimation実装
- [ ] updateMapPinVisibility実装
- [ ] worldMapOverlay.addEventListenerの追加

---

## 📝 Step 3: input.js の更新（Part 1: worldMap）

### 追加するimport
```javascript
import { closeWorldMap } from './map.js';
```

### setupInputs関数に追加
```javascript
// ワールドマップオーバーレイのクリックイベント
const worldMapOverlay = document.getElementById('worldMapOverlay');
if (worldMapOverlay) {
    worldMapOverlay.addEventListener('click', () => {
        if (gameMode === MODE.MAP_VIEW) {
            closeWorldMap();
        }
    });
}
```

#### チェックリスト
- [ ] import追加
- [ ] worldMapOverlay イベント追加

---

## 📝 Step 4: input.js の更新（Part 2: handleCanvasTap）

### 必要なimport追加
既に以下がインポートされているか確認:
- menu, party, canvasWidth, canvasHeight, tileSize

### handleCanvasTap関数の実装
参照: index_6c69ad3.html 11194-11237行

### setupInputs関数に追加
```javascript
// Canvas タップイベント
const canvas = document.getElementById('gameCanvas');
if (canvas) {
    canvas.addEventListener('click', (e) => {
        initAudio();
        handleCanvasTap(e.clientX, e.clientY);
    });

    canvas.addEventListener('touchend', (e) => {
        initAudio();
        if (e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            if (handleCanvasTap(touch.clientX, touch.clientY)) {
                e.preventDefault();
            }
        }
    }, { passive: false });
}
```

#### チェックリスト
- [ ] handleCanvasTap関数の実装
- [ ] canvas click イベント追加
- [ ] canvas touchend イベント追加

---

## 📝 Step 5: input.js の更新（Part 3: ズーム/ジェスチャー防止）

### モジュールスコープに追加
```javascript
let lastTouchEnd = 0;
```

### setupInputs関数に追加
```javascript
// ダブルタップによるズームを防止
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

// ピンチズームを防止（2本指タッチ）
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// gestureイベント（Safari）を防止
document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
}, { passive: false });

document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
}, { passive: false });

document.addEventListener('gestureend', (e) => {
    e.preventDefault();
}, { passive: false });

// 右クリックメニューを無効化
document.addEventListener('contextmenu', (e) => e.preventDefault());
```

#### チェックリスト
- [ ] lastTouchEnd変数追加
- [ ] ダブルタップ防止
- [ ] ピンチズーム防止
- [ ] gesturestart防止
- [ ] gesturechange防止
- [ ] gestureend防止
- [ ] contextmenu防止

---

## 📝 Step 6: app.js の更新

### 追加するimport
```javascript
import { updateMapPinVisibility } from './map.js';
```

### 呼び出し箇所の検討
updateMapPinVisibility()を呼ぶべきタイミング:
- マップ遷移後（performWarp完了後）
- 必要に応じてengine.jsに実装するかも

#### チェックリスト
- [ ] import文の追加
- [ ] 必要に応じて関数呼び出しを追加

---

## 🧪 テスト計画

### ワールドマップ機能
- [ ] 📍ボタンをクリック → マップが開く
- [ ] マップオーバーレイをクリック → マップが閉じる
- [ ] プレイヤー位置がマップ上に表示される

### canvasタップ機能
- [ ] メニューでメンバーリストをタップ → カーソル移動

### ズーム/ジェスチャー防止
- [ ] ダブルタップ → ズームしない
- [ ] ピンチ → ズームしない
- [ ] 右クリック → メニュー出ない

---

## ✅ 完了確認

### イベントリスナー数の確認
```bash
grep -r "addEventListener" dragon-quest-rpg/js/ | wc -l
# 期待値: 28個
```

---

## 📊 進捗トラッキング

### 全体の進捗
- [ ] Step 1: 関数の抽出と理解
- [ ] Step 2: map.jsの作成
- [ ] Step 3: input.js更新（worldMap）
- [ ] Step 4: input.js更新（handleCanvasTap）
- [ ] Step 5: input.js更新（ズーム防止）
- [ ] Step 6: app.jsの更新
- [ ] テスト実施
- [ ] コミット作成

---

## 🔄 実装開始

このガイドを参照しながら実装を進める。
完了したステップは✅でマークする。
