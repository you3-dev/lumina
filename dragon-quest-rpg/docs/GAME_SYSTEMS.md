# ゲームシステム詳細

## 概要

本ドキュメントでは、ゲーム内の各システムの仕様と実装詳細を記載します。

---

## 1. マップシステム

### タイルタイプ

| ID | 名称 | 定数名 | 通行可否 | エンカウント |
|----|------|--------|----------|--------------|
| 0 | 草原 | GRASS | ⭕ | ⭕ |
| 1 | 山 | MOUNTAIN | ❌ | - |
| 2 | 海 | SEA | ❌ | - |
| 3 | 城 | CASTLE | ⭕ | ❌ |
| 4 | 町 | TOWN | ⭕ | ❌ |
| 5 | 階段 | STAIRS | ⭕ | ❌ |
| 6 | 床 | FLOOR | ⭕ | ⭕ |
| 7 | 壁 | WALL | ❌ | - |
| 8 | 旅の扉 | PORTAL | ⭕ | ❌ |
| 9 | 上り階段 | STAIRS_UP | ⭕ | ❌ |
| 10 | 下り階段 | STAIRS_DOWN | ⭕ | ❌ |
| 11 | 砂漠 | SAND | ⭕ | ⭕ |
| 12 | オアシス | OASIS | ⭕ | ❌ |
| 13 | ピラミッド | PYRAMID | ⭕ | ❌ |
| 14 | 流砂 | QUICKSAND | ⭕ | ❌ |
| 15 | 隠し壁 | HIDDEN_WALL | 条件付き | - |
| 16 | 穴 | HOLE | ⭕ | ❌ |
| 17 | 地底床 | UNDERWORLD_FLOOR | ⭕ | ⭕ |
| 18 | 地底壁 | UNDERWORLD_WALL | ❌ | - |
| 19 | 楔の祭壇 | WEDGE_ALTAR | ⭕ | ❌ |
| 20 | 地底の町 | UNDERWORLD_TOWN | ⭕ | ❌ |
| 21 | 氷床（滑る） | ICE_FLOOR | ⭕ | ⭕ |
| 22 | 氷壁 | ICE_WALL | ❌ | - |
| 23 | 氷の穴 | ICE_HOLE | ⭕ | ❌ |
| 24 | 雪原 | SNOW | ⭕ | ⭕ |
| 25 | 氷の城床 | ICE_CASTLE_FLOOR | ⭕ | ⭕ |
| 26 | 燭台 | TORCH | ⭕ | ❌ |
| 27 | 氷の祭壇 | ICE_ALTAR | ⭕ | ❌ |
| 28 | 圧力スイッチ | ICE_SWITCH | ⭕ | ❌ |
| 29 | 氷ブロック | ICE_BLOCK | ❌ | - |

### マップJSONフォーマット

```json
{
    "mapId": "snow_village",
    "name": "雪原の村",
    "type": "town",
    "cols": 20,
    "rows": 20,
    "encounterRate": 0,
    "encounterTable": "area4_field",
    "isSafe": true,
    "isSettlement": true,
    "isOutdoor": false,
    "area": "area4",
    "bgmType": "town",
    "arrivalX": 10,
    "arrivalY": 18,
    "data": [
        [7, 7, 7, ...],
        [7, 6, 6, ...],
        ...
    ],
    "warps": [
        {
            "x": 10,
            "y": 19,
            "targetMap": "maps/ice_field.json",
            "targetX": 50,
            "targetY": 51
        }
    ],
    "npcs": [
        {
            "id": "snow_elder",
            "x": 10,
            "y": 5,
            "sprite": "👴",
            "type": "villager",
            "messages": ["セリフ1", "セリフ2"]
        }
    ],
    "chests": [
        {
            "id": "chest_001",
            "x": 5,
            "y": 3,
            "itemId": 70,
            "isOpened": false
        }
    ]
}
```

---

## 2. 戦闘システム

### エンカウント方式

**歩数累積方式**を採用。連続移動での連戦を防ぎつつ、長時間歩行で確実にエンカウント。

```javascript
// エンカウント判定
const SAFE_STEPS = 5;           // 不感地帯
const ENCOUNTER_RATE_PER_STEP = 0.02;  // 1歩あたり2%上昇
const MAX_ENCOUNTER_RATE = 0.95;       // 最大95%

// 計算式
encounterRate = Math.min(MAX_ENCOUNTER_RATE, 
    (stepsSinceLastBattle - SAFE_STEPS) * ENCOUNTER_RATE_PER_STEP);
```

### エンカウンターテーブル

| テーブルID | 対象エリア | 出現モンスター |
|------------|------------|----------------|
| field | エリア1フィールド | スライム、ドラキー、コウモリ |
| dungeon | エリア1ダンジョン | ゴースト、がいこつ、さまようよろい |
| desert_field | エリア2砂漠 | サンドスライム、サボテンマン等 |
| area3_underworld | エリア3地底 | シャドースライム、地底ドラゴン等 |
| area4_field | エリア4氷原 | ゆきスライム、スノーウルフ等 |
| area4_castle | エリア4氷城 | こおりのきし、クリスタルドラゴン等 |

### 戦闘コマンド

| コマンド | 説明 |
|----------|------|
| たたかう | 通常攻撃 |
| じゅもん | 呪文選択メニューへ |
| ぼうぎょ | 受けるダメージ半減 |
| どうぐ | アイテム使用 |
| にげる | 逃走試行（ボス戦不可） |

### ダメージ計算

```javascript
// 物理ダメージ
damage = attackerAtk - (defenderDef / 2);
damage = damage * (0.9 + Math.random() * 0.2);  // ±10%揺れ

// 会心の一撃（5%）
if (Math.random() < 0.05) {
    damage = attackerAtk * 2;  // 防御無視
}

// 呪文ダメージ
baseDamage = spell.power + (casterLevel * 0.5);
damage = baseDamage * elementMultiplier;
```

### 属性システム

| 属性 | 色 | 代表呪文 |
|------|-----|----------|
| 火 | 赤 | メラ、ギラ、ベギラマ |
| 氷 | 青 | ヒャド、ヒャダルコ |
| 雷 | 黄 | デイン、ライデイン、ギガデイン |
| 風 | 緑 | バギ、バギマ |
| 光 | 白 | ギガデイン、ミナデイン |

**属性倍率判定**:
- 2.0倍以上: 弱点（こうかは ばつぐんだ！）
- 1.5倍以上: 効果的（こうかが あるようだ！）
- 0.5倍以下: 耐性（こうかは いまひとつのようだ...）
- 0倍: 無効（まったく きかなかった！）

---

## 3. パーティシステム

### パーティ構成

| 加入順 | キャラクター | ジョブ | 役割 |
|--------|--------------|--------|------|
| 1 | ゆうしゃ | hero | 物理+回復バランス型 |
| 2 | マリア | mage | 魔法火力 |
| 3 | セレン | seer | 補助・デバフ |
| 4 | グラシオ | iceKnight | 壁役・高火力 |

### ステータス

| パラメータ | 説明 |
|------------|------|
| HP | 体力（0で戦闘不能） |
| MP | 魔力（呪文使用に消費） |
| 攻撃力 | 物理攻撃力（基礎値+武器） |
| 防御力 | 物理防御力（基礎値+防具） |
| すばやさ | 行動順序決定 |
| レベル | 成長段階 |
| 経験値 | レベルアップに必要 |

### レベルアップ

```javascript
// 必要経験値（段階的成長）
if (level <= 20) {
    requiredExp = level * level * 8;      // 序盤: 緩やか
} else if (level <= 50) {
    requiredExp = level * level * 15;     // 中盤: 標準
} else {
    requiredExp = level * level * 25;     // 終盤: やりこみ
}

// レベルアップ時のステータス上昇（ジョブ別）
// hero: HP+6, MP+2, ATK+2, DEF+1
// mage: HP+3, MP+4, ATK+1, DEF+0.5
// seer: HP+3.5, MP+2.5, ATK+0.9, DEF+0.85
// iceKnight: HP+4.7, MP+0.6, ATK+1.5, DEF+1.3
```

---

## 4. 呪文システム

### 呪文タイプ

| タイプ | 説明 | 例 |
|--------|------|-----|
| heal | HP回復 | ホイミ、ベホマ |
| attack | ダメージ | メラ、ギラ |
| status | 状態異常付与 | ラリホー、マヌーサ |
| buff | ステータス強化 | スクルト、バイキルト |
| debuff | ステータス低下 | ルカニ |
| revive | 蘇生 | ザオラル、ザオリク |
| warp | 移動 | ルーラ、リレミト |

### 主要呪文一覧

| 呪文名 | MP | タイプ | 効果 | 習得Lv |
|--------|-----|--------|------|--------|
| ホイミ | 3 | 回復 | HP30回復 | 2 |
| ベホイミ | 6 | 回復 | HP80回復 | 12 |
| ベホマ | 12 | 回復 | HP全回復 | 32 |
| メラ | 2 | 攻撃 | 炎15ダメージ | 3 |
| ギラ | 5 | 攻撃 | 炎全体35 | 8 |
| ヒャド | 4 | 攻撃 | 氷25ダメージ | 6 |
| ラリホー | 3 | 状態 | 眠り付与 | 5 |
| スクルト | 4 | 補助 | 防御1.5倍 | 25 |
| ルーラ | 8 | 移動 | 町へワープ | 15 |
| ザオラル | 10 | 蘇生 | 50%蘇生 | 22 |

---

## 5. 状態異常システム

### 状態異常一覧

| 状態 | アイコン | 効果 | 持続 |
|------|----------|------|------|
| 眠り | 💤 | 行動不能 | 2-3ターン |
| 毒 | ☠️ | ターン終了時HP10%減 | 戦闘終了まで |
| 幻惑 | 💫 | 命中率50%低下 | 戦闘終了まで |
| 沈黙 | 🔇 | 呪文使用不可 | 3-5ターン |

### 耐性計算

```javascript
// 状態異常成功率
successRate = spell.successRate * enemy.resistances[effect];

// 例: ラリホー（70%）をスライム（眠り耐性1.0）に使用
// → 70% * 1.0 = 70%で成功

// 例: ラリホーをボス（眠り耐性0.1）に使用
// → 70% * 0.1 = 7%で成功
```

---

## 6. アイテムシステム

### アイテムタイプ

| タイプ | 説明 | スタック |
|--------|------|----------|
| heal | HP回復 | ⭕（99個） |
| cure | 状態回復 | ⭕ |
| revive | 蘇生 | ⭕ |
| escape | 脱出 | ⭕ |
| key | 鍵 | ⭕ |
| quest | クエスト用 | ⭕ |
| weapon | 武器 | ❌（個別） |
| armor | 防具 | ❌（個別） |
| accessory | アクセサリー | ❌（個別） |

### 装備可能ジョブ

| アイテムID | 名称 | 装備可能者 |
|------------|------|------------|
| 10-19 | 剣類 | hero |
| 40-45 | 杖類 | mage, seer |
| 70-74 | 氷武器 | hero, iceKnight, mage, seer |
| 20-28 | 鎧類 | hero（一部mage可） |
| 50-54 | ローブ類 | mage, seer |
| 80-83 | 氷防具 | 全員 |

---

## 7. ショップシステム

### ショップ一覧

| ショップID | 場所 | 取扱商品 |
|------------|------|----------|
| default | エリア1 | 基本装備 |
| oasis_shop | オアシスの村 | 砂漠装備+回復 |
| bazaar_shop | バザールの町 | 中級装備 |
| underworld_shop | 地底の村 | エリア3装備 |
| snow_village_weapon | 雪原の村 | 氷武器・防具 |
| snow_village_item | 雪原の村 | 回復+氷対策 |

---

## 8. セーブシステム

### セーブデータ構造

```javascript
{
    // パーティ情報
    party: [
        { id, name, job, level, exp, hp, maxHp, mp, maxMp, ... },
        ...
    ],
    
    // 共有データ
    partyData: {
        x: 10,
        y: 15,
        gold: 5000,
        inventory: [{ id: 1, quantity: 5 }, ...]
    },
    
    // 位置情報
    currentMapPath: 'maps/snow_village.json',
    lastTown: { mapPath, x, y, name },
    
    // 進行状況
    gameProgress: {
        bossDefeated: { ... },
        storyFlags: { ... },
        quests: { ... },
        visitedLocations: [ ... ],
        openedPassages: { ... }
    },
    
    // 宝箱開封状況
    openedChests: { 'chest_id': true, ... }
}
```

### セーブタイミング

- 宿屋で休んだ時
- 教会で祈った時
- Bボタンメニューから手動セーブ

---

## 9. NPCシステム

### NPCタイプ

| タイプ | 機能 |
|--------|------|
| villager | 会話のみ |
| king | 王様（ストーリー進行） |
| guard | 警備兵（道を塞ぐことも） |
| inn | 宿屋（HP/MP全回復） |
| shop | 武器・防具・道具屋 |
| healer | 教会（回復・蘇生・セーブ） |
| hermit | 隠者（ヒント提供） |
| boss | ボス（戦闘発生） |
| event | イベント進行用 |

### 条件付きセリフ

```json
{
    "id": "snow_elder",
    "messages": ["通常時のセリフ"],
    "conditionalMessages": [
        {
            "condition": "sunFlameObtained",
            "messages": ["太陽の炎入手後のセリフ"]
        }
    ]
}
```

---

## 10. 進行フラグシステム

### 主要フラグ

| カテゴリ | フラグ名 | 説明 |
|----------|----------|------|
| **ボス** | iceGolem | 氷のゴーレム撃破 |
| | iceQueen | 氷の女王撃破 |
| **ストーリー** | northPathOpened | 北の山道開通 |
| | area4Entered | エリア4進入 |
| | sunFlameObtained | 太陽の炎入手 |
| | glacioJoined | グラシオ加入 |
| | area4Completed | エリア4クリア |
| **クエスト** | frozenLakeCleared | 凍湖クリア |
| | torchPuzzleCleared | 灯火パズル |
| | memoryPuzzleCleared | 記憶パズル |

---

## 11. パズルシステム（エリア4）

### 滑る床パズル

氷床（ICE_FLOOR）に入ると壁か通常床に当たるまで滑り続ける。

```javascript
function handleIceFloorMovement(direction) {
    while (isIceFloor(nextTile)) {
        player.x = nextPos.x;
        player.y = nextPos.y;
        // 穴に落ちたら入口に戻る
        if (nextTile === TILE.ICE_HOLE) {
            teleportToEntrance();
        }
    }
}
```

### 圧力スイッチパズル

氷ブロック（ICE_BLOCK）を押してスイッチ（ICE_SWITCH）の上に乗せる。

### 灯火パズル

燭台（TORCH）を調べると隣接する燭台も連動して状態変化（ライツアウト式）。

### 記憶パズル

氷の祭壇（ICE_ALTAR）を正しい順序で調べる（北→東→南→西）。

---

## 更新履歴

- 2026-01-15: 初版作成
