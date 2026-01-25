# イベントリスナー分析

## 元のコード (28個)

### キーボード入力
- addEventListener('keydown') - 行10290
- addEventListener('keyup') - 行10843

### 方向ボタン (上下左右) - 各ボタン5個ずつ
- addEventListener('touchstart') - 行11029
- addEventListener('touchend') - 行11030
- addEventListener('mousedown') - 行11031
- addEventListener('mouseup') - 行11032
- addEventListener('mouseleave') - 行11033

### アクションボタン (AとB) - 各ボタン5個ずつ
- addEventListener('touchstart') - 行11045
- addEventListener('touchend') - 行11046
- addEventListener('mousedown') - 行11047
- addEventListener('mouseup') - 行11048
- addEventListener('mouseleave') - 行11049

### キャンバス操作
- addEventListener('click') - 行11240 (canvas)
- addEventListener('touchend') - 行11245 (canvas)

### タッチ・ジェスチャー制御
- addEventListener('touchend') - 行11261 (document)
- addEventListener('touchstart') - 行11270 (document)
- addEventListener('gesturestart') - 行11277 (document)
- addEventListener('gesturechange') - 行11281 (document)
- addEventListener('gestureend') - 行11285 (document)

### UI要素
- addEventListener('click') - 行11587 (worldMapOverlay)
- addEventListener('click') - 行11596 (mapPinBtn)
- addEventListener('click') - 行11698 (soundToggleBtn)
- addEventListener('touchend') - 行11699 (soundToggleBtn)

### タイトル画面・メニュー
- addEventListener('click') - 行12033 (menuContinue)
- addEventListener('click') - 行12042 (menuNewGame)
- addEventListener('click') - 行12051 (titleScreen)

### その他
- addEventListener('resize') - 行12061 (window)
- addEventListener('contextmenu') - 行12071 (document)

**合計: 28個**

---

## 分割後のコード (24個)

### app.js (2個)
- addEventListener('resize') - 行31 (window)
- addEventListener('click') - 行44 (soundBtn)

### map.js (1個)
- addEventListener('click') - 行306 (worldMapOverlay)

### input.js (21個)

#### キーボード入力
- addEventListener('keydown') - 行32 (window)
- addEventListener('keyup') - 行38 (window)

#### UI要素
- addEventListener('click') - 行54 (mapPinBtn)
- addEventListener('click') - 行65 (canvas)
- addEventListener('touchend') - 行70 (canvas)

#### タッチ・ジェスチャー制御
- addEventListener('touchend') - 行82 (document)
- addEventListener('touchstart') - 行91 (document)
- addEventListener('gesturestart') - 行98 (document)
- addEventListener('gesturechange') - 行102 (document)
- addEventListener('gestureend') - 行106 (document)

#### その他
- addEventListener('contextmenu') - 行111 (document)

#### 方向ボタン (setupDirectionalPad内)
- addEventListener('touchstart') - 行269
- addEventListener('touchend') - 行270
- addEventListener('mousedown') - 行271
- addEventListener('mouseup') - 行272
- addEventListener('mouseleave') - 行273

#### アクションボタン (setupActionButtons内)
- addEventListener('touchstart') - 行290
- addEventListener('touchend') - 行291
- addEventListener('mousedown') - 行292
- addEventListener('mouseup') - 行293
- addEventListener('mouseleave') - 行294

**合計: 24個**

---

## 欠落しているイベントリスナー (4個)

1. **soundToggleBtn touchend** (元: 行11699)
   - app.js では click のみ実装 (行44)
   - touchend イベントが欠落

2. **menuContinue click** (元: 行12033)
   - タイトル画面のコンティニューボタン
   - 分割後のコードに見当たらない

3. **menuNewGame click** (元: 行12042)
   - タイトル画面のニューゲームボタン
   - 分割後のコードに見当たらない

4. **titleScreen click** (元: 行12051)
   - タイトル画面全体のクリックイベント
   - 分割後のコードに見当たらない

---

## 詳細分析

### 正常に移行されたイベント (24個)
- キーボード入力: 2個 ✓
- 方向ボタン: 5個 ✓
- アクションボタン: 5個 ✓
- キャンバス操作: 2個 ✓
- タッチ・ジェスチャー: 5個 ✓
- ワールドマップ: 1個 ✓
- マップピンボタン: 1個 ✓
- リサイズ: 1個 ✓
- コンテキストメニュー防止: 1個 ✓
- サウンドボタン (click のみ): 1個 ⚠️

### 欠落したイベント (4個)
- サウンドボタン (touchend): 1個 ❌
- タイトル画面関連: 3個 ❌

---

## 推奨される修正

### 1. app.js の soundBtn に touchend を追加
```javascript
soundBtn.addEventListener('click', handleSoundToggle);
soundBtn.addEventListener('touchend', handleSoundToggle);
```

### 2. タイトル画面のイベントリスナーを追加
タイトル画面の初期化関数に以下を追加:
- menuContinue の click イベント
- menuNewGame の click イベント
- titleScreen の click イベント

これらのイベントリスナーは、おそらく app.js または新しい ui.js/menu.js ファイルに実装する必要があります。
