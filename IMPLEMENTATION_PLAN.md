# オプション1: 欠落機能の追加実装計画

## 📊 欠落しているイベントリスナー分析

### 分割前: 28個 → 分割後: 15個 = **13個欠落**

---

## 🔍 欠落機能の詳細分析

### ✅ 既に実装済み（onClickで代替）
以下はengine.js/app.jsで`onclick`プロパティを使用して実装済み：
- ❌ menuContinue.addEventListener('click') → ✅ engine.js:1118 `menuContinue.onclick`
- ❌ menuNewGame.addEventListener('click') → ✅ engine.js:1131 `menuNewGame.onclick`
- ❌ titleScreen.addEventListener('click') → ✅ engine.js:1143 `titleScreen.onclick`
- ❌ soundToggleBtn.addEventListener('click') → ✅ app.js:43 `soundBtn.addEventListener('click')`

**実装済み: 4個**

---

## 🚨 未実装で追加が必要: 9個

### 🔴 優先度: 高（致命的な機能欠落）

#### 1. **worldMapOverlay クリックイベント** (11587行)
```javascript
worldMapOverlay.addEventListener('click', () => {
    if (gameMode === MODE.MAP_VIEW) {
        closeWorldMap();
    }
});
```
**影響**: マップを開いた後、閉じられない
**対処**: engine.jsまたは新しいmap.jsに実装

#### 2. **canvas クリック/タッチイベント** (11240, 11245行)
```javascript
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
```
**影響**: メニュー内タップ操作が動作しない可能性
**対処**: handleCanvasTap関数の実装状況を確認後、適切なモジュールに追加

---

### 🟡 優先度: 中（UX改善）

#### 3-5. **ダブルタップ・ピンチズーム防止** (11261, 11270行)
```javascript
// ダブルタップによるズームを防止
let lastTouchEnd = 0;
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
```
**影響**: モバイルで意図しないズームが発生
**対処**: input.jsに追加

#### 6-8. **Safari用ジェスチャー防止** (11277, 11281, 11285行)
```javascript
document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
}, { passive: false });

document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
}, { passive: false });

document.addEventListener('gestureend', (e) => {
    e.preventDefault();
}, { passive: false });
```
**影響**: Safari（iOS）でピンチジェスチャーが誤作動
**対処**: input.jsに追加

---

### 🟢 優先度: 低（軽微）

#### 9. **右クリックメニュー無効化** (12071行)
```javascript
document.addEventListener('contextmenu', (e) => e.preventDefault());
```
**影響**: 右クリックでブラウザのコンテキストメニューが表示される
**対処**: input.jsに追加

---

## 📋 実装ステップ

### Phase 1: 緊急対応（優先度: 高）

#### Step 1.1: handleCanvasTap 関数の確認
- [ ] handleCanvasTap が何をしているか確認
- [ ] 現在のコードで既に実装されているか確認
- [ ] 必要であれば実装場所を決定

#### Step 1.2: worldMapOverlay の実装
- [ ] openWorldMap/closeWorldMap 関数を確認
- [ ] engine.jsまたは新しいmap.jsに実装
- [ ] 動作確認

### Phase 2: UX改善（優先度: 中）

#### Step 2.1: ズーム防止機能の実装
- [ ] input.jsにダブルタップ防止を追加
- [ ] input.jsにピンチズーム防止を追加
- [ ] モバイルでの動作確認

#### Step 2.2: Safari対応
- [ ] input.jsにgesture系イベントを追加
- [ ] iOSでの動作確認

### Phase 3: 仕上げ（優先度: 低）

#### Step 3.1: 右クリックメニュー無効化
- [ ] input.jsにcontextmenu防止を追加

### Phase 4: 最終確認

- [ ] 全イベントリスナー数が28個になることを確認
- [ ] 実機での全機能動作確認
- [ ] ユーザーによる検証

---

## 🎯 今すぐ実行すべきこと

1. **handleCanvasTap の実装状況確認**
2. **worldMapOverlay の実装** （最優先）
3. **Phase 1完了後、動作確認を依頼**
4. **Phase 2以降は動作確認後に判断**

---

## 📝 メモ

- タイトルメニューのイベントは onclick で実装済み（addEventListener と機能的に同等）
- soundToggle も既に実装済み
- 実際に追加が必要なのは **9個**
