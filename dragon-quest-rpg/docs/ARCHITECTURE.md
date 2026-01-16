# アーキテクチャ設計書

## 概要

本ゲームは単一の `index.html` ファイル内にすべてのコードが含まれるモノリシック構造を採用しています。約12,000行のJavaScriptコードが機能別にセクション化されています。

---

## コード構造

### 全体像

```
index.html (約12,000行)
├── HTML構造 (1-470行)
│   ├── <head> - メタ情報、CSS
│   └── <body> - Canvas、UI要素
├── CSS (7-400行)
│   ├── 基本スタイル
│   ├── タイトル画面
│   ├── HUD・コントロール
│   └── メニュー・ダイアログ
└── JavaScript (470-12000行)
    ├── ゲーム設定・定数
    ├── データ定義
    ├── ゲームシステム
    └── レンダリング・入力処理
```

---

## 主要セクション（行番号ガイド）

### 1. ゲーム設定・定数 (470-600行)

```javascript
// 基本設定
const VISIBLE_TILES = 10;
const SAVE_KEY = 'dragonquest_rpg_save';

// ゲームモード
const MODE = {
    TITLE: 'title',
    FIELD: 'field',
    BATTLE: 'battle',
    MENU: 'menu',
    // ...
};

// タイルタイプ定義
const TILE = {
    GRASS: 0,
    MOUNTAIN: 1,
    SEA: 2,
    // ... (30種類以上)
};
```

### 2. アイテムデータ (600-700行)

```javascript
const items = {
    // 消費アイテム
    1: { id: 1, name: '薬草', type: 'heal', value: 30, price: 8 },
    
    // 武器
    10: { id: 10, name: 'こんぼう', type: 'weapon', value: 2, price: 10, equippable: ['hero', 'mage'] },
    
    // 防具（属性耐性付き）
    24: { id: 24, name: 'まほうのよろい', type: 'armor', value: 35, resistances: { fire: 0.7, ice: 0.7 } },
    
    // クエストアイテム
    30: { id: 30, name: '清らかな水', type: 'quest', price: 0 },
};
```

### 3. モンスターデータ (770-1600行)

```javascript
const monsters = {
    slime: {
        name: 'スライム',
        sprite: '🟢',
        level: 1, hp: 8, atk: 5, def: 2, speed: 3,
        exp: 2, gold: 2,
        resistances: { sleep: 1.0, blind: 1.0, poison: 1.0 }
    },
    
    // ボス（専用スキル付き）
    iceQueen: {
        name: 'こおりのじょおう',
        isBoss: true,
        actions: 2,  // 2回行動
        skills: ['attack', 'hyados', 'iceBreath', 'absoluteZero', 'behoma'],
        resistances: { ice: 0, fire: 2.0 }
    },
};
```

### 4. 呪文データ (1670-1720行)

```javascript
const spells = {
    // 回復呪文
    hoimi: { name: 'ホイミ', mp: 3, type: 'heal', power: 30, learnLevel: 2, learnableBy: ['hero'] },
    
    // 攻撃呪文（属性付き）
    mera: { name: 'メラ', mp: 2, type: 'attack', target: 'single', power: 15, element: 'fire' },
    
    // 補助呪文
    sukuruto: { name: 'スクルト', mp: 4, type: 'buff', buffType: 'defense', buffRate: 1.5 },
    
    // 移動呪文
    rura: { name: 'ルーラ', mp: 8, type: 'warp', learnLevel: 15, learnableBy: ['hero'] },
};
```

### 5. サウンドシステム (1860-2280行)

```javascript
// Web Audio API ベースのサウンドシステム
let audioCtx = null;
const audioBufferCache = {};

function playSE(filename) {
    if (!seEnabled || !audioCtx) return;
    // バッファキャッシュから再生
}

const BGM = {
    play: function(type) { /* BGM再生 */ },
    stop: function() { /* BGM停止 */ },
    // ...
};
```

### 6. ゲーム進行フラグ (2320-2600行)

```javascript
const gameProgress = {
    // ボス撃破フラグ
    bossDefeated: {
        midBoss: false,
        maou: false,
        iceQueen: false,
        // ...
    },
    
    // ストーリー進行フラグ
    storyFlags: {
        area4Entered: false,
        sunFlameObtained: false,
        glacioJoined: false,
        // ...
    },
    
    // クエストフラグ
    quests: {
        // ...
    },
    
    // ルーラ用拠点リスト
    visitedLocations: [],
};
```

### 7. マップシステム (2610-2800行)

```javascript
// 埋め込みマップデータ（デフォルト）
const maps = {
    field: { mapId: 'field', name: 'ルミナス大陸', data: [...], warps: [...] },
    castle: { mapId: 'castle', name: 'グランディア城', npcs: [...] },
    // ...
};

// 外部JSONマップ読み込み関数
async function loadMap(mapPath) { /* ... */ }
```

### 8. パーティシステム (2825-3100行)

```javascript
// パーティメンバー作成
function createPartyMember(config) {
    return {
        id: config.id,
        name: config.name,
        job: config.job,
        hp: config.hp,
        mp: config.mp,
        equipment: { weapon: null, armor: null },
        // ...
    };
}

// パーティ配列
const MAX_PARTY_SIZE = 4;
const party = [];
```

### 9. 戦闘システム (約4000-6000行)

```javascript
// 戦闘状態管理
const battle = {
    active: false,
    phase: 'start',
    enemy: null,
    enemyHp: 0,
    // ...
};

// 戦闘処理
function startBattle(monsterKey) { /* ... */ }
function processBattleAction(action) { /* ... */ }
function endBattle(result) { /* ... */ }
```

### 10. レンダリング (約8000-10000行)

```javascript
// メインループ
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// 描画関数
function render() {
    renderMap();
    renderPlayer();
    renderNPCs();
    renderUI();
}
```

### 11. 入力処理 (約10000-11000行)

```javascript
// キーボード入力
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// タッチ入力
dpadBtn.addEventListener('touchstart', handleDpadTouch);
dpadBtn.addEventListener('touchend', handleDpadRelease);
```

---

## データフロー

### ゲーム開始〜プレイ

```
1. ページロード
   ↓
2. DOMContentLoaded
   ↓
3. initGame() - ゲーム初期化
   ↓
4. loadSaveData() - セーブデータ読み込み（あれば）
   ↓
5. タイトル画面表示
   ↓
6. ゲーム開始選択
   ↓
7. loadMap() - 初期マップロード
   ↓
8. gameLoop() - メインループ開始
```

### マップ移動

```
1. プレイヤー移動
   ↓
2. ワープポイント判定
   ↓
3. loadMap() - 新マップ読み込み
   ↓
4. フェードアウト/イン
   ↓
5. プレイヤー座標更新
   ↓
6. BGM切替
```

### 戦闘フロー

```
1. エンカウント判定
   ↓
2. startBattle() - 戦闘開始
   ↓
3. コマンド選択 (player)
   ↓
4. 行動順序決定 (speed)
   ↓
5. 行動実行
   ↓
6. 勝敗判定
   ↓
7. endBattle() - 戦闘終了
```

---

## 状態管理

### グローバル状態

```javascript
// ゲームモード
let gameMode = MODE.FIELD;

// 現在のマップ
let currentMap = maps['field'];
let currentMapPath = 'maps/field.json';

// パーティ（配列）
const party = [/* メンバーオブジェクト */];

// ゲーム進行状態
const gameProgress = { /* フラグ類 */ };
```

### 永続化（LocalStorage）

```javascript
// セーブ対象
{
    party: [...],           // パーティ全員のステータス
    partyData: {...},       // 位置、ゴールド、アイテム
    currentMapPath: '...',  // 現在のマップ
    gameProgress: {...},    // 進行フラグ
    lastTown: {...},        // 最後の町
    // ...
}
```

---

## 拡張性

### 新エリア追加の手順

1. **マップJSON作成**: `maps/` に新規JSONファイル
2. **モンスター追加**: `monsters` オブジェクトに定義追加
3. **エンカウンターテーブル**: `encounterTables` に追加
4. **ストーリーフラグ**: `gameProgress.storyFlags` に追加
5. **ボスフラグ**: `gameProgress.bossDefeated` に追加
6. **ワープ設定**: 関連マップのwarps配列を更新

### 新キャラクター追加の手順

1. **ステータス定義**: `createPartyMember()` 用の設定
2. **ジョブ固有スキル**: `spells` に追加
3. **装備可能アイテム**: `items` の `equippable` を更新
4. **加入イベント**: NPCダイアログとフラグ処理

---

## 更新履歴

- 2026-01-15: 初版作成
