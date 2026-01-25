# エリア5「大いなる海と沈んだ王国」最終仕様書

> **本ドキュメントは実装の唯一の正とする。矛盾がある場合は本書を優先すること。**

## 1. 概要

| 項目 | 値 |
|------|-----|
| テーマ | 大冒険、海洋探索、失われた超古代文明 |
| レベル帯 | Lv 45 - 60 |
| クリア報酬 | 天空の海図（エリア6進行用） |

---

## 2. マップ一覧と接続

### 2.1 マップ一覧

| mapId | 名称 | サイズ | タイプ | 特殊属性 |
|-------|------|--------|--------|----------|
| `town_portia` | 港町ポルティア | 30x30 | Town | - |
| `area5_ocean` | 広大なる外海 | 200x200 | Field | `isLoopMap: true` |
| `coral_village` | 珊瑚の村 | 20x20 | Town | - |
| `coral_maze` | 珊瑚の迷宮 | 40x40 | Dungeon | - |
| `prison_isle` | 灰色の監獄島 | 30x30 | Dungeon | `sealSpells: true` |
| `gigant_interior` | 巨獣ギガントの体内 | 25x25 | Dungeon | `isLowOxygen: true` |
| `sea_god_altar` | 海神の祭壇 | 15x15 | Event | - |
| `atlantis_ruins` | 海底都市アトランティア | 40x40 | Dungeon | `isUnderwater: true` |

### 2.2 ワープ接続

| 出発 | 座標 | 到着 | 座標 | 条件 | タイプ |
|------|------|------|------|------|--------|
| portal_room | (指定位置) | town_portia | (15,28) | area4クリア | 通常ワープ |
| town_portia | (15,1) | area5_ocean | (100,105) | `shipObtained` | embark |
| area5_ocean | (45,30) | coral_village | (10,18) | - | landing |
| area5_ocean | (160,170) | prison_isle | (15,28) | - | landing |
| area5_ocean | (ギガント位置) | gigant_interior | (12,24) | `gigantAppeared` | landing |
| area5_ocean | (100,100) | sea_god_altar | (7,14) | - | landing |
| sea_god_altar | (7,7) | atlantis_ruins | (20,38) | `allTearsCollected` | 渦潮ワープ |
| coral_village | (10,1) | coral_maze | (20,38) | - | 通常ワープ |

---

## 3. ストーリーフラグ

```javascript
// gameProgress に追加するフラグ
storyFlags: {
    shipObtained: false,        // 船入手済み
    gigantAppeared: false,      // ギガント出現済み
    albidaDefeated: false,      // アルビダ撃破
    tearBlueObtained: false,    // 青の涙入手（珊瑚の迷宮）
    tearRedObtained: false,     // 赤の涙入手（監獄島）
    tearGreenObtained: false,   // 緑の涙入手（ギガント）
    allTearsCollected: false,   // 三至宝を祭壇に捧げた
    leviathanDefeated: false,   // リヴァイアサン撃破
    skyMapObtained: false       // 天空の海図入手
}
```

---

## 4. ボス完全仕様（5体）

### 4.1 海賊貴族アルビダ（中ボス）

```javascript
albida: {
    name: '海賊貴族アルビダ',
    sprite: '🏴‍☠️',
    level: 50,
    hp: 2500,
    atk: 120,
    def: 85,
    speed: 75,
    exp: 3500,
    gold: 2000,
    isBoss: true,
    actions: 2,
    skills: ['commandAttack', 'mahoton', 'strongAttack'],
    resistances: {
        sleep: 0, blind: 0.3, poison: 0, silence: 0,
        fire: 1.0, ice: 1.0, lightning: 1.5, wind: 0.5
    },
    summons: ['pirate_soldier', 'pirate_soldier'],  // 手下を2体召喚
    dropItem: null
}
```

**出現場所**: 外海に出た直後（イベントバトル）
**撃破フラグ**: `albidaDefeated`

---

### 4.2 セイレーンクイーン（珊瑚の迷宮ボス）

```javascript
sirenQueen: {
    name: 'セイレーンクイーン',
    sprite: '🧜‍♀️',
    level: 54,
    hp: 3200,
    atk: 95,
    def: 70,
    speed: 90,
    exp: 4500,
    gold: 2500,
    isBoss: true,
    actions: 2,
    skills: ['lullaby', 'illusionWave', 'hydroBlast', 'hyados'],
    resistances: {
        sleep: 0, blind: 0, poison: 0.5, silence: 0.3,
        fire: 1.5, ice: 0, lightning: 2.0, wind: 0.5, water: 0
    },
    dropItem: { id: 400, name: '青の涙' }
}
```

**出現場所**: 珊瑚の迷宮 最深部
**撃破フラグ**: `tearBlueObtained`

---

### 4.3 監獄長バルバロイ（監獄島ボス）

```javascript
barbaloi: {
    name: '監獄長バルバロイ',
    sprite: '👹',
    level: 56,
    hp: 3800,
    atk: 145,
    def: 130,
    speed: 45,
    exp: 5000,
    gold: 3000,
    isBoss: true,
    actions: 2,
    skills: ['gigantPress', 'ironWall', 'warcry', 'strongAttack'],
    resistances: {
        sleep: 0, blind: 0.2, poison: 0, silence: 0,
        fire: 0.5, ice: 0.5, lightning: 2.0, wind: 1.0  // 雷弱点
    },
    dropItem: { id: 401, name: '赤の涙' }
}
```

**出現場所**: 監獄島 司令室
**撃破フラグ**: `tearRedObtained`
**特記**: このマップは`sealSpells: true`のため、プレイヤーも呪文使用不可

---

### 4.4 寄生王パラサイト（ギガントボス）

```javascript
parasite: {
    name: '寄生王パラサイト',
    sprite: '🦠',
    level: 55,
    hp: 3500,
    atk: 100,
    def: 75,
    speed: 65,
    exp: 4800,
    gold: 2800,
    isBoss: true,
    actions: 2,
    skills: ['staminaDrain', 'toxicCloud', 'bioAcid', 'drain'],
    resistances: {
        sleep: 0.5, blind: 0.5, poison: 0, silence: 0.5,
        fire: 2.0, ice: 1.0, lightning: 1.0, wind: 1.0  // 炎弱点
    },
    dropItem: { id: 402, name: '緑の涙' }
}
```

**出現場所**: ギガント体内 胃袋
**撃破フラグ**: `tearGreenObtained`

---

### 4.5 海神リヴァイアサン（エリアボス）

```javascript
leviathan: {
    name: '海神リヴァイアサン',
    sprite: '🐉',
    level: 60,
    hp: 6000,
    atk: 160,
    def: 100,
    speed: 80,
    exp: 12000,
    gold: 8000,
    isBoss: true,
    actions: 2,
    skills: ['grandTidal', 'elementShift', 'mpDrain', 'absoluteZero', 'hageshiiHonoo', 'raiden'],
    resistances: {
        sleep: 0, blind: 0, poison: 0, silence: 0,
        fire: 1.0, ice: 1.0, lightning: 1.0, wind: 1.0  // 属性変化で変動
    },
    dropItem: { id: 403, name: '天空の海図' },
    phaseChange: {
        hpThreshold: 3000,  // HP50%以下で第2形態
        message: 'リヴァイアサンの姿が変わった！'
    }
}
```

**出現場所**: アトランティア 海神の聖域
**撃破フラグ**: `leviathanDefeated`, `skyMapObtained`

---

## 5. 新規スキル完全仕様（14個）

```javascript
// bossSkills に追加
const area5BossSkills = {
    // === アルビダ用 ===
    commandAttack: {
        name: 'いっせいこうげき',
        type: 'attack',
        target: 'all',
        power: 40,  // 手下2体分も合算したダメージ
        flashColor: 'rgba(255, 150, 50, 0.6)',
        message: 'アルビダが手下に命令した！'
    },

    // === セイレーン用 ===
    lullaby: {
        name: 'ねむりのうた',
        type: 'status',
        target: 'all',
        statusEffect: 'sleep',
        successRate: 0.7,
        flashColor: 'rgba(200, 150, 255, 0.6)',
        message: 'セイレーンが美しい歌を歌った！'
    },
    illusionWave: {
        name: 'げんわくのはどう',
        type: 'status',
        target: 'all',
        statusEffect: 'blind',  // 幻惑 = blind
        successRate: 0.6,
        flashColor: 'rgba(255, 100, 255, 0.6)',
        message: '幻惑の波動が襲いかかる！'
    },
    hydroBlast: {
        name: 'ハイドロブラスト',
        type: 'attack',
        target: 'all',
        power: 70,
        element: 'water',
        flashColor: 'rgba(50, 150, 255, 0.8)',
        message: '激しい水流が襲いかかる！'
    },

    // === バルバロイ用 ===
    gigantPress: {
        name: 'ギガントプレス',
        type: 'attack',
        target: 'all',
        power: 85,
        flashColor: 'rgba(150, 100, 50, 0.8)',
        message: 'バルバロイが巨体で押し潰す！'
    },
    ironWall: {
        name: 'てっぺき',
        type: 'buff',
        buffType: 'defense',
        buffRate: 2.0,
        duration: 3,
        flashColor: 'rgba(150, 150, 150, 0.7)',
        message: 'バルバロイは身を固めた！'
    },
    warcry: {
        name: 'おたけび',
        type: 'status',
        target: 'all',
        statusEffect: 'stun',  // 行動不能
        successRate: 0.5,
        duration: 1,
        flashColor: 'rgba(255, 200, 100, 0.6)',
        message: '轟くおたけびで身がすくむ！'
    },

    // === パラサイト用 ===
    staminaDrain: {
        name: 'スタミナドレイン',
        type: 'drain',
        target: 'single',
        power: 50,
        drainHp: true,
        drainMp: true,
        drainRate: 0.5,  // 与ダメージの50%吸収
        flashColor: 'rgba(100, 50, 100, 0.7)',
        message: '生命力を吸い取られる！'
    },
    toxicCloud: {
        name: 'もうどくのきり',
        type: 'status',
        target: 'all',
        statusEffect: 'poison',
        successRate: 0.8,
        poisonDamageRate: 0.15,  // 猛毒は通常より強い（最大HPの15%）
        flashColor: 'rgba(100, 0, 150, 0.7)',
        message: '猛毒の霧が立ち込める！'
    },
    bioAcid: {
        name: 'ようかいえき',
        type: 'debuff',
        target: 'all',
        debuffType: 'defense',
        debuffRate: 0.5,  // 防御力半減
        successRate: 0.7,
        flashColor: 'rgba(150, 255, 50, 0.6)',
        message: '溶解液が防具を溶かす！'
    },

    // === リヴァイアサン用 ===
    grandTidal: {
        name: 'だいかいしょう',
        type: 'attack',
        target: 'all',
        power: 120,
        element: 'water',
        additionalEffect: 'stun',  // 追加で1ターン行動不能
        stunRate: 0.4,
        flashColor: 'rgba(0, 100, 200, 0.9)',
        message: '大海嘯が全てを飲み込む！'
    },
    elementShift: {
        name: 'エレメントシフト',
        type: 'special',
        effect: 'changeElement',
        elements: ['fire', 'ice', 'lightning'],  // 順番に変化
        flashColor: 'rgba(255, 255, 255, 0.8)',
        message: 'リヴァイアサンの属性が変化した！'
    },
    mpDrain: {
        name: 'マナドレイン',
        type: 'drain',
        target: 'all',
        drainMp: true,
        drainAmount: 15,  // 固定15MP吸収
        flashColor: 'rgba(150, 50, 150, 0.6)',
        message: '魔力が吸い取られる！'
    }
};
```

---

## 6. 新規雑魚モンスター完全仕様（9体）

```javascript
// monsters に追加
const area5Monsters = {
    // === 外海（Lv45-50）===
    seaSlime: {
        name: 'ウミスライム',
        sprite: '💧',
        level: 45,
        hp: 120,
        atk: 55,
        def: 60,
        speed: 35,
        exp: 180,
        gold: 150,
        resistances: { fire: 2.0, ice: 0.5, sleep: 1.0, blind: 1.0, poison: 1.0 }
    },
    manOWar: {
        name: 'しびれクラゲ',
        sprite: '🪼',
        level: 46,
        hp: 110,
        atk: 62,
        def: 50,
        speed: 45,
        exp: 200,
        gold: 170,
        canParalyze: true,  // 痺れ攻撃
        resistances: { lightning: 0.5, ice: 1.5, sleep: 0.8, blind: 0.6, poison: 0 }
    },
    greatShark: {
        name: 'グレートシャーク',
        sprite: '🦈',
        level: 48,
        hp: 350,
        atk: 95,
        def: 75,
        speed: 55,
        exp: 350,
        gold: 280,
        canCritical: true,  // 痛恨の一撃
        resistances: { wind: 2.0, ice: 0.5, sleep: 0.5, blind: 0.7, poison: 1.0 }
    },

    // === 珊瑚の迷宮（Lv48-52）===
    coralMagician: {
        name: 'さんごの魔術師',
        sprite: '🧙',
        hueRotate: 180,
        level: 49,
        hp: 180,
        atk: 70,
        def: 65,
        speed: 40,
        exp: 280,
        gold: 220,
        skills: ['rariho', 'hyados'],
        resistances: { fire: 2.0, ice: 0, sleep: 0.3, blind: 0.5, poison: 1.0 }
    },
    seaSerpent: {
        name: 'シーサーペント',
        sprite: '🐍',
        hueRotate: 200,
        level: 51,
        hp: 450,
        atk: 110,
        def: 90,
        speed: 50,
        exp: 400,
        gold: 320,
        skills: ['iceBreath'],
        resistances: { lightning: 2.0, fire: 0.8, sleep: 0.4, blind: 0.5, poison: 0.3 }
    },

    // === 監獄島（Lv50-54）===
    prisonGuard: {
        name: '監獄の看守',
        sprite: '👮',
        level: 52,
        hp: 280,
        atk: 105,
        def: 110,
        speed: 30,
        exp: 380,
        gold: 300,
        canCritical: true,
        canSummon: true,  // 仲間を呼ぶ
        noEscape: true,   // 逃走不可
        resistances: { sleep: 0.5, blind: 0.5, poison: 0.5, silence: 0.5 }
    },
    ghostPirate: {
        name: 'キャプテン・ゴースト',
        sprite: '👻',
        hueRotate: 240,
        level: 53,
        hp: 300,
        atk: 90,
        def: 80,
        speed: 48,
        exp: 420,
        gold: 350,
        skills: ['mahoton'],
        canCurse: true,
        resistances: { light: 2.0, dark: 0, sleep: 0, blind: 0.8, poison: 0 }
    },

    // === ギガント体内（Lv52-55）===
    ironShell: {
        name: 'アイアンタートル',
        sprite: '🐢',
        level: 52,
        hp: 200,
        atk: 65,
        def: 200,  // 超高防御
        speed: 15,
        exp: 300,
        gold: 250,
        resistances: { lightning: 2.0, ice: 0.2, sleep: 0.3, blind: 1.0, poison: 0 }
    },

    // === アトランティア（Lv54-58）===
    ancientGear: {
        name: '古代の歯車',
        sprite: '⚙️',
        level: 56,
        hp: 220,
        atk: 85,
        def: 120,
        speed: 60,
        exp: 450,
        gold: 400,
        skills: ['beam'],  // 無属性ビーム
        resistances: { lightning: 2.5, water: 0, sleep: 0, blind: 0, poison: 0 }
    }
};
```

---

## 7. エンカウントテーブル

```javascript
// encounterTables に追加
const area5EncounterTables = {
    // 外海
    area5_ocean: ['seaSlime', 'seaSlime', 'manOWar', 'manOWar', 'greatShark'],

    // 珊瑚の迷宮
    area5_coral: ['seaSlime', 'coralMagician', 'coralMagician', 'seaSerpent'],

    // 監獄島
    area5_prison: ['prisonGuard', 'prisonGuard', 'ghostPirate', 'ghostPirate'],

    // ギガント体内
    area5_gigant: ['seaSlime', 'manOWar', 'ironShell', 'ironShell'],

    // アトランティア
    area5_atlantis: ['ancientGear', 'ancientGear', 'seaSerpent', 'ghostPirate']
};
```

---

## 8. 新規アイテム完全仕様

```javascript
// items に追加
const area5Items = {
    // === 武器 ===
    100: {
        id: 100,
        name: 'ポセイドンブレード',
        type: 'weapon',
        value: 85,
        price: 12000,
        equippable: ['hero', 'iceKnight'],
        elementBonus: { water: 1.5 },  // 水属性の敵に1.5倍
        description: '海神の加護を受けた剣。水属性の敵に特効。'
    },
    101: {
        id: 101,
        name: 'シェルスタッフ',
        type: 'weapon',
        value: 65,
        price: 8500,
        equippable: ['mage', 'seer'],
        useEffect: 'sukuruto',  // 使うとスクルトの効果
        description: '貝殻で作られた杖。使うとスクルトの効果。'
    },
    102: {
        id: 102,
        name: '珊瑚の弓',
        type: 'weapon',
        value: 72,
        price: 9000,
        equippable: ['seer'],
        flyingBonus: 1.5,  // 飛行する敵に1.5倍
        description: '珊瑚で作られた弓。飛行する敵に特効。'
    },

    // === 防具 ===
    200: {
        id: 200,
        name: '碧海のローブ',
        type: 'armor',
        value: 45,
        price: 11000,
        equippable: ['mage', 'seer'],
        resistances: { ice: 0.5, water: 0.5 },
        description: '深海の布で織られたローブ。氷・水耐性。'
    },
    201: {
        id: 201,
        name: '竜鱗の鎧',
        type: 'armor',
        value: 62,
        price: 15000,
        equippable: ['hero', 'iceKnight'],
        resistances: { fire: 0.7 },
        description: '海竜の鱗で作られた鎧。炎耐性。'
    },
    202: {
        id: 202,
        name: '泡の盾',
        type: 'shield',
        value: 28,
        price: 7500,
        equippable: ['hero', 'iceKnight'],
        evasionBonus: 0.05,  // 物理回避+5%
        description: '不思議な泡でできた盾。物理攻撃を避けやすい。'
    },

    // === 消費アイテム ===
    60: {
        id: 60,
        name: 'ほかほかスープ',
        type: 'heal',
        value: 150,
        price: 200,
        coldImmunity: 50,  // 50歩の間、寒さダメージ無効
        description: 'HP150回復。50歩の間、寒さダメージ無効。'
    },
    61: {
        id: 61,
        name: '酸素缶',
        type: 'special',
        price: 500,
        oxygenBonus: 50,  // 酸素ゲージ+50
        description: '水中での行動可能歩数を50増やす。'
    },
    62: {
        id: 62,
        name: '海の香草',
        type: 'cure',
        price: 150,
        cures: ['sleep', 'paralysis', 'confusion'],
        description: '眠り、麻痺、混乱を治療する。'
    },

    // === 船強化パーツ ===
    120: {
        id: 120,
        name: '重い錨',
        type: 'ship_part',
        price: 5000,
        effect: 'ignoreCurrentWeak',  // 弱い潮流を無視
        description: '船に装備すると、弱い潮流を無視できる。'
    },
    121: {
        id: 121,
        name: '船の鍵',
        type: 'key',
        price: 0,
        description: 'リヴァイアサン号を動かすための鍵。'
    },

    // === クエストアイテム ===
    400: {
        id: 400,
        name: '青の涙',
        type: 'quest',
        price: 0,
        description: '海神の英知を宿す宝玉。'
    },
    401: {
        id: 401,
        name: '赤の涙',
        type: 'quest',
        price: 0,
        description: '海神の勇気を宿す宝玉。'
    },
    402: {
        id: 402,
        name: '緑の涙',
        type: 'quest',
        price: 0,
        description: '海神の慈愛を宿す宝玉。'
    },
    403: {
        id: 403,
        name: '天空の海図',
        type: 'quest',
        price: 0,
        description: 'エリア6「天空界」への道を示す海図。'
    }
};
```

---

## 9. ショップ定義

```javascript
// shopItemsByArea に追加
area5_weapon: [100, 101, 102, 201],      // ポセイドンブレード、シェルスタッフ、珊瑚の弓、竜鱗の鎧
area5_armor: [200, 201, 202],            // 碧海のローブ、竜鱗の鎧、泡の盾
area5_item: [1, 2, 3, 60, 61, 62, 9]     // 薬草、上薬草、特薬草、スープ、酸素缶、海の香草、どくけし
```

---

## 10. ギミック実装仕様

### 10.1 船システム

```javascript
// partyData に追加
partyData.vehicle = 'none';  // 'none' | 'ship'
partyData.shipPosition = { x: 100, y: 105 };  // 船の現在位置（外海マップ上）

// 移動速度
const SHIP_SPEED_MULTIPLIER = 1.5;  // 船は徒歩の1.5倍速

// 海タイル通行判定（canMoveTo関数内）
if (tileType === TILE.SEA) {
    return partyData.vehicle === 'ship';
}

// 上陸処理（warp type: "landing"）
// 1. 船の位置を記録
// 2. vehicle を 'none' に変更
// 3. 目的地マップへワープ

// 出港処理（warp type: "embark"）
// 1. vehicle を 'ship' に変更
// 2. 外海マップの記録位置へワープ
```

### 10.2 酸素システム

```javascript
// partyData に追加
partyData.oxygen = 100;      // 現在の酸素（0-100）
partyData.maxOxygen = 100;   // 最大酸素

// 水中マップ判定
const isUnderwaterMap = currentMapData.isUnderwater || currentMapData.isLowOxygen;

// 移動時の酸素消費（movePlayer関数内）
if (isUnderwaterMap) {
    partyData.oxygen -= 1;  // 1歩で1消費

    if (partyData.oxygen <= 0) {
        partyData.oxygen = 0;
        // 全員に最大HPの10%ダメージ
        party.forEach(member => {
            const damage = Math.floor(member.maxHp * 0.1);
            member.hp = Math.max(1, member.hp - damage);
        });
        showMessage('息が続かない！ダメージを受けた！');
    }
}

// 空気の泡タイル（タイルID: 50）
if (tileType === 50 && isUnderwaterMap) {
    partyData.oxygen = partyData.maxOxygen;
    showMessage('空気を吸い込んだ！');
}

// 酸素缶使用時
partyData.maxOxygen += 50;
partyData.oxygen = Math.min(partyData.oxygen + 50, partyData.maxOxygen);
```

### 10.3 潮流システム

```javascript
// 潮流タイルの定義（タイルID: 40-43）
const CURRENT_TILES = {
    40: { dx: 0, dy: -1 },  // 上向き潮流
    41: { dx: 0, dy: 1 },   // 下向き潮流
    42: { dx: -1, dy: 0 },  // 左向き潮流
    43: { dx: 1, dy: 0 }    // 右向き潮流
};

// 潮流処理（移動後に実行）
function applyCurrentTile(x, y) {
    const tileType = getTileAt(x, y);
    const current = CURRENT_TILES[tileType];

    if (current) {
        // 重い錨を持っていれば弱い潮流は無視
        const hasHeavyAnchor = hasItem(120);
        const isWeakCurrent = currentMapData.weakCurrentTiles?.includes(`${x},${y}`);

        if (hasHeavyAnchor && isWeakCurrent) {
            return;  // 潮流無視
        }

        // 強制移動
        movePlayer(current.dx, current.dy, true);  // true = 強制移動フラグ
    }
}
```

### 10.4 胃液タイル（ギガント体内）

```javascript
// 胃液タイルの定義（タイルID: 37）
const ACID_TILE = 37;
const ACID_DAMAGE = 15;

// 胃液処理（移動後に実行）
function applyAcidTile(x, y) {
    const tileType = getTileAt(x, y);

    if (tileType === ACID_TILE) {
        // 全員に15ダメージ
        party.forEach(member => {
            if (member.hp > 0) {
                member.hp = Math.max(1, member.hp - ACID_DAMAGE);
            }
        });
        showMessage('胃液でダメージを受けた！');
        playSE('damage');
    }
}
```

### 10.5 魔法封印エリア（監獄島）

```javascript
// マップ属性で判定
if (currentMapData.sealSpells) {
    // 戦闘中の呪文コマンドを無効化
    // バトルメニューで「じゅもん」を選択不可に
}

// 戦闘開始時のメッセージ
if (currentMapData.sealSpells) {
    addBattleLog('この場所では呪文が使えない！');
}
```

### 10.6 珊瑚の迷宮・音パズル

```javascript
// 各分岐点にフラグを設定
const CORAL_MAZE_SOUNDS = {
    'branch_1': { correct: 'east', se_correct: 'chime_high', se_wrong: 'buzzer' },
    'branch_2': { correct: 'north', se_correct: 'chime_high', se_wrong: 'buzzer' },
    'branch_3': { correct: 'east', se_correct: 'chime_high', se_wrong: 'buzzer' },
    'branch_4': { correct: 'west', se_correct: 'chime_high', se_wrong: 'buzzer' }
};

// 分岐点を通過時
function onBranchPass(branchId, direction) {
    const branch = CORAL_MAZE_SOUNDS[branchId];
    if (branch) {
        if (direction === branch.correct) {
            playSE(branch.se_correct);  // 「キララ〜ン」
        } else {
            playSE(branch.se_wrong);    // 「ブブー」
        }
    }
}
```

### 10.7 ギガント移動（外海マップ）

```javascript
// グローバル変数
let gigantStepCounter = 0;
let gigantPosition = { x: 150, y: 180 };  // 初期位置

// 移動ごとにカウント
function onPlayerMove() {
    if (gameProgress.storyFlags.gigantAppeared && currentMapId === 'area5_ocean') {
        gigantStepCounter++;

        if (gigantStepCounter >= 100) {
            gigantStepCounter = 0;
            moveGigant();
        }
    }
}

// ギガント移動処理
function moveGigant() {
    const directions = [
        { dx: 10, dy: 0 },
        { dx: -10, dy: 0 },
        { dx: 0, dy: 10 },
        { dx: 0, dy: -10 }
    ];
    const dir = directions[Math.floor(Math.random() * 4)];

    gigantPosition.x = (gigantPosition.x + dir.dx + 200) % 200;
    gigantPosition.y = (gigantPosition.y + dir.dy + 200) % 200;
}
```

### 10.8 巡回兵（監獄島）

```javascript
// NPCに patrol 属性を追加
{
    id: 'guard_1',
    type: 'patrol',
    patrolPath: [
        { x: 10, y: 15 },
        { x: 10, y: 20 },
        { x: 15, y: 20 },
        { x: 15, y: 15 }
    ],
    patrolSpeed: 1,  // 1歩/秒
    onContact: {
        type: 'battle',
        enemies: ['prisonGuard', 'prisonGuard'],
        noEscape: true,
        message: '見つかった！看守が襲いかかってきた！'
    }
}

// 巡回兵の移動処理（ゲームループ内）
function updatePatrolNpcs() {
    npcs.filter(n => n.type === 'patrol').forEach(npc => {
        // パスに沿って移動
        // プレイヤーと接触したら戦闘開始
    });
}
```

---

## 11. NPC・イベント定義

### 11.1 港町ポルティア

```javascript
// 町長（船入手イベント）
{
    id: 'npc_portia_elder',
    name: '町長',
    sprite: '👴',
    x: 15, y: 10,
    dialog: [
        {
            condition: '!shipObtained && hasItem("極光の宝珠")',
            lines: [
                'おぉ、その輝きは極光の宝珠！',
                'ついにこの時が来たか。',
                '造船所に眠る「リヴァイアサン号」は、',
                'かつて勇者が使った伝説の船じゃ。',
                '宝珠の力で封印を解き、海へ出るがよい！'
            ],
            action: 'giveItem(121); setFlag("shipObtained", true);'
        },
        {
            condition: 'shipObtained && !allTearsCollected',
            lines: [
                '海には3つの島がある。',
                'それぞれに「海神の涙」が眠っておる。',
                '3つ揃えて祭壇に捧げれば、',
                '海底への道が開かれるじゃろう。'
            ]
        }
    ]
}

// セレン（ギガント出現イベント）
{
    id: 'npc_seren_portia',
    name: 'セレン',
    sprite: '🔮',
    x: 20, y: 15,
    condition: 'inParty("seren")',  // パーティにセレンがいる場合のみ表示
    dialog: [
        {
            condition: '!gigantAppeared && albidaDefeated',
            lines: [
                '……何か、巨大な気配を感じます。',
                '南東の海域に……生きている島？',
                'とても大きな生き物のようです……'
            ],
            action: 'setFlag("gigantAppeared", true);'
        }
    ]
}
```

### 11.2 海神の祭壇

```javascript
// 祭壇（三至宝イベント）
{
    id: 'altar_crystal',
    type: 'object',
    sprite: '💎',
    x: 7, y: 7,
    dialog: [
        {
            condition: 'tearBlueObtained && tearRedObtained && tearGreenObtained && !allTearsCollected',
            lines: [
                '3つの涙を祭壇に捧げますか？'
            ],
            choices: [
                {
                    text: 'はい',
                    action: `
                        removeItem(400);
                        removeItem(401);
                        removeItem(402);
                        setFlag("allTearsCollected", true);
                        flashScreen("white", 2000);
                        showMessage("3つの涙が共鳴し、海に巨大な渦が発生した！");
                    `
                },
                { text: 'いいえ' }
            ]
        },
        {
            condition: 'allTearsCollected',
            lines: [
                '祭壇は静かに輝いている……',
                '渦潮の先に、海底都市への道が開かれた。'
            ]
        },
        {
            condition: '!tearBlueObtained || !tearRedObtained || !tearGreenObtained',
            lines: [
                '古代の文字が刻まれている……',
                '「3つの涙を揃えし者よ、',
                '　海神の眠る地への道を授けよう」'
            ]
        }
    ]
}
```

---

## 12. 実装チェックリスト

### Phase 1: データ追加（コードのみ）

- [ ] monsters に area5Monsters を追加
- [ ] bossSkills に area5BossSkills を追加
- [ ] items に area5Items を追加
- [ ] encounterTables に area5EncounterTables を追加
- [ ] shopItemsByArea に area5 ショップを追加
- [ ] gameProgress.storyFlags に area5 フラグを追加

### Phase 2: システム実装

- [ ] 船システム（vehicle, 乗降処理）
- [ ] 酸素システム（oxygen, ダメージ処理）
- [ ] 潮流タイル処理
- [ ] 胃液タイル処理
- [ ] 魔法封印エリア判定
- [ ] ギガント移動処理

### Phase 3: マップ接続

- [ ] portal_room → town_portia ワープ追加
- [ ] town_portia ⇔ area5_ocean 接続
- [ ] area5_ocean → 各島への上陸ワープ
- [ ] sea_god_altar → atlantis_ruins 渦潮ワープ

### Phase 4: イベント実装

- [ ] 船入手イベント（町長会話）
- [ ] アルビダ戦（出航直後）
- [ ] ギガント出現イベント（セレン会話）
- [ ] 三至宝イベント（祭壇）
- [ ] リヴァイアサン戦後イベント

### Phase 5: ボス配置

- [ ] アルビダ（外海イベント）
- [ ] セイレーンクイーン（coral_maze）
- [ ] バルバロイ（prison_isle）
- [ ] パラサイト（gigant_interior）
- [ ] リヴァイアサン（atlantis_ruins）

### Phase 6: テスト

- [ ] 通しプレイテスト（ポルティア→アトランティア）
- [ ] 各ボス戦バランステスト
- [ ] セーブ・ロード互換性テスト
- [ ] 既存エリア（area1-4）回帰テスト

---

## 更新履歴

- 2025-01-25: 最終仕様書初版作成
