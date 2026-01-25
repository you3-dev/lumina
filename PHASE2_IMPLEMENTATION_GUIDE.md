# Phase 2: コア機能実装ガイド（詳細版）

## 🎯 目的
分割時に欠落した4つのコア機能を実装する。
このドキュメントは実装中に参照し、完了したら✅でマークする。

---

## 📋 実装対象の全体像

### 欠落しているコア機能（4個）

1. ❌ **メニュー機能** - openMenu() / closeMenu()
2. ❌ **宝箱機能** - openChest()
3. ❌ **エンカウント機能** - checkRandomEncounter()
4. ❌ **Bボタン処理** - onActionB()の完全実装

---

## 🗂️ ファイル構成計画

### 変更対象
- `dragon-quest-rpg/js/engine.js` - 3つの関数を追加
- `dragon-quest-rpg/js/input.js` - onActionB()を完全実装

### 新規作成
- なし（既存ファイルへの追加のみ）

---

## 📝 Step 1: openMenu / closeMenu の実装

### 元のコード位置
- `index_6c69ad3.html` 7384-7401行

### 実装先
- `dragon-quest-rpg/js/engine.js`

### 必要なimport確認
```javascript
// 既存のimportを確認
import { SE } from './sound.js';
import { menu, dialog, isTransitioning, gameMode, inn, partyJoinConfirm } from './state.js';
import { MODE } from './constants.js';
```

### 実装する関数
```javascript
export function openMenu() {
    if (dialog.active || isTransitioning || gameMode === MODE.BATTLE || inn.active || partyJoinConfirm.active) return;
    SE.confirm(); // メニュー開くSE
    menu.active = true;
    menu.mode = 'status'; // デフォルトでステータス画面
}

export function closeMenu() {
    SE.cancel(); // メニュー閉じるSE
    menu.active = false;
    menu.showItemAction = false;
    menu.itemActionIndex = 0;
    menu.selectingMember = false;
    menu.selectingEquipMember = false;
    menu.selectingItemMember = false;
    menu.memberCursor = 0;
    menu.targetMemberCursor = 0;
}
```

### チェックリスト
- [ ] engine.jsに必要なimportがあるか確認
- [ ] openMenu関数を実装
- [ ] closeMenu関数を実装
- [ ] export宣言を追加

---

## 📝 Step 2: openChest の実装

### 元のコード位置
- `index_6c69ad3.html` 7364-7382行

### 実装先
- `dragon-quest-rpg/js/engine.js`

### 必要なimport確認
```javascript
import { items } from './data.js';
import { currentMap, currentMapId, maps } from './state.js';
import { addItem } from './inventory.js';
import { saveGame } from './save.js';
```

### 実装する関数
```javascript
export function openChest(chest) {
    if (chest.isOpened) {
        startDialog(['宝箱は からっぽだ。']);
    } else {
        const item = items[chest.itemId];
        if (item) {
            SE.chest(); // 宝箱SE
            chest.isOpened = true;
            // mapsオブジェクトの宝箱も同期（セーブデータに反映させるため）
            if (maps[currentMapId] && maps[currentMapId].chests) {
                const mapChest = maps[currentMapId].chests.find(c => c.id === chest.id);
                if (mapChest) mapChest.isOpened = true;
            }
            addItem(item.id, 1);
            startDialog(['宝箱をあけた！', `${item.name} を手に入れた！`]);
            saveGame();
        }
    }
}
```

### チェックリスト
- [ ] engine.jsに必要なimportがあるか確認
- [ ] openChest関数を実装
- [ ] export宣言を追加

---

## 📝 Step 3: checkRandomEncounter の実装

### 元のコード位置
- `index_6c69ad3.html` 7207-7258行

### 実装先
- `dragon-quest-rpg/js/engine.js`

### 必要な定数確認
```javascript
// constants.jsに以下があるか確認
export const ENCOUNTER_TILES = [0, 11, 14, 25]; // 草原、砂漠、流砂、雪原
export const SAFE_STEPS = 5;
export const ENCOUNTER_RATE_PER_STEP = 0.02;
export const MAX_ENCOUNTER_RATE = 0.5;
```

### 必要なimport確認
```javascript
import { ENCOUNTER_TILES, SAFE_STEPS, ENCOUNTER_RATE_PER_STEP, MAX_ENCOUNTER_RATE } from './constants.js';
import { currentMap, player, stepsSinceLastBattle, setStepsSinceLastBattle } from './state.js';
import { encounterTables, encounterTableFallback } from './data.js';
import { startBattle } from './battle.js';
```

### 実装する関数
```javascript
export function checkRandomEncounter() {
    // 安全地帯ではエンカウントしない
    if (currentMap.isSafe === true) {
        // 安全地帯に入ったら歩数リセット
        if (stepsSinceLastBattle > 0) {
            setStepsSinceLastBattle(0);
        }
        return;
    }

    // encounterRate=0のマップもスキップ（isSafe未定義の旧マップ互換）
    if (currentMap.encounterRate <= 0) return;

    // エンカウントタイル以外はスキップ
    const tile = currentMap.data[player.y][player.x];
    if (!ENCOUNTER_TILES.includes(tile)) return;

    // 歩数カウント
    setStepsSinceLastBattle(stepsSinceLastBattle + 1);

    // 不感地帯の判定（safeSteps以下はエンカウントしない）
    if (stepsSinceLastBattle <= SAFE_STEPS) {
        return;
    }

    // 確率の計算（歩くほど上昇）
    const stepsOverSafe = stepsSinceLastBattle - SAFE_STEPS;
    const currentEncounterRate = Math.min(
        stepsOverSafe * ENCOUNTER_RATE_PER_STEP,
        MAX_ENCOUNTER_RATE
    );

    // エンカウント判定
    if (Math.random() < currentEncounterRate) {
        // エンカウントテーブルを選択（優先順位）
        // 1. マップに直接指定されたencounterTable
        // 2. mapIdベース
        // 3. typeベースのフォールバック
        const mapId = currentMap.mapId || '';
        let tableKey = currentMap.encounterTable || mapId;
        if (!encounterTables[tableKey]) {
            // mapIdで見つからなければtypeで探す
            tableKey = encounterTableFallback[currentMap.type] || 'field';
        }
        // tableKeyを渡してグループ生成
        startBattle(tableKey);
    }
}
```

### 実装箇所の追加
- `movePlayer` 関数内でプレイヤー移動後に呼び出す
- 元のコード 8871行の位置

### チェックリスト
- [ ] constants.jsにENCOUNTER_TILES等があるか確認（なければ追加）
- [ ] engine.jsに必要なimportがあるか確認
- [ ] checkRandomEncounter関数を実装
- [ ] movePlayer内で checkRandomEncounter() を呼び出す
- [ ] export宣言を追加

---

## 📝 Step 4: onActionB の完全実装

### 元のコード位置
- `index_6c69ad3.html` 11133-11186行

### 実装先
- `dragon-quest-rpg/js/input.js`

### 必要なimport追加
```javascript
import {
    closeDialog, closeInn, closeChurch, closeShop,
    cancelTargetSelection, cancelAllySelection,
    openMenu, closeMenu
} from './engine.js';
import { partyJoinConfirm } from './state.js';
```

### 実装する関数（完全版）
```javascript
function onActionB() {
    if (isTransitioning) return;

    // ルーラ選択中 - キャンセル
    if (gameMode === MODE.FIELD && menu.active && menu.mode === 'rura') {
        cancelTargetSelection();
        return;
    }
    // バトル中 - 味方選択キャンセル
    if (gameMode === MODE.BATTLE && battle.isSelectingAlly) {
        cancelAllySelection();
        return;
    }
    if (gameMode === MODE.BATTLE && battle.showSpells) {
        battle.showSpells = false;
    } else if (gameMode === MODE.BATTLE && battle.showItems) {
        battle.showItems = false;
    } else if (shop.active) {
        handleShopInput('cancel');
    } else if (inn.active) {
        closeInn();
        startDialog(['またのお越しを おまちしております。']);
    } else if (church.active) {
        if (church.phase === 'confirm') {
            church.phase = 'selectMember';
        } else if (church.phase === 'selectMember') {
            church.phase = 'menu';
        } else {
            closeChurch();
            startDialog(['また いつでも おこしください。']);
        }
    } else if (dialog.active) {
        closeDialog();
    } else if (menu.active) {
        if (menu.selectingMember) {
            // 呪文対象選択モード - キャンセル
            menu.selectingMember = false;
        } else if (menu.selectingEquipMember) {
            menu.selectingEquipMember = false;
            menu.showItemAction = true;
        } else if (menu.selectingItemMember) {
            menu.selectingItemMember = false;
            menu.showItemAction = true;
        } else if (menu.showItemAction) {
            menu.showItemAction = false;
        } else {
            closeMenu();
        }
    } else {
        openMenu();
    }
}
```

### チェックリスト
- [ ] input.jsに必要なimportを追加
- [ ] onActionB関数を完全実装
- [ ] engine.jsに closeDialog, closeInn, closeChurch 等があるか確認

---

## 🔍 Step 5: 依存関数の確認と実装

### engine.jsに存在すべき関数
以下の関数がengine.jsに存在するか確認し、なければ実装：

- [ ] `closeDialog()` - ダイアログを閉じる
- [ ] `closeInn()` - 宿屋を閉じる
- [ ] `closeChurch()` - 教会を閉じる
- [ ] `closeShop()` - 店を閉じる（handleShopInput経由で呼ばれる可能性）
- [ ] `cancelTargetSelection()` - ルーラ対象選択をキャンセル
- [ ] `cancelAllySelection()` - バトル中の味方選択をキャンセル
- [ ] `handleShopInput(action)` - 店の入力処理

### 確認コマンド
```bash
grep -n "function closeDialog\|export function closeDialog" dragon-quest-rpg/js/engine.js
grep -n "function closeInn\|export function closeInn" dragon-quest-rpg/js/engine.js
grep -n "function closeChurch\|export function closeChurch" dragon-quest-rpg/js/engine.js
grep -n "function cancelTargetSelection\|export function cancelTargetSelection" dragon-quest-rpg/js/engine.js
grep -n "function cancelAllySelection\|export function cancelAllySelection" dragon-quest-rpg/js/engine.js
grep -n "function handleShopInput\|export function handleShopInput" dragon-quest-rpg/js/engine.js
```

---

## 🧪 テスト計画

### メニュー機能
- [ ] Bボタン（xキー）でメニューが開く
- [ ] メニュー内でBボタンを押すと閉じる
- [ ] メニュー内のタブ切り替えが動作する

### 宝箱機能
- [ ] グランディア城の宝箱を開ける
- [ ] アイテム名が正しく表示される（「undefinedを手に入れた」が出ない）
- [ ] 開けた宝箱が空になる

### エンカウント機能
- [ ] フィールドで歩くと敵と遭遇する
- [ ] 5歩以内は遭遇しない
- [ ] 歩数に応じて遭遇率が上昇する

### Bボタン機能
- [ ] フィールドでBボタン → メニューが開く
- [ ] ダイアログ中にBボタン → ダイアログが閉じる
- [ ] 宿屋でBボタン → 宿屋が閉じる
- [ ] 教会でBボタン → 教会が閉じる

---

## 📊 進捗トラッキング

### 全体の進捗
- [ ] Step 1: openMenu / closeMenu 実装
- [ ] Step 2: openChest 実装
- [ ] Step 3: checkRandomEncounter 実装
- [ ] Step 4: onActionB 完全実装
- [ ] Step 5: 依存関数の確認
- [ ] テスト実施
- [ ] コミット作成

---

## 🚀 実装開始前の準備

### 必要な情報の収集
```bash
# constants.jsにENCOUNTER_TILES等があるか確認
grep -n "ENCOUNTER_TILES" dragon-quest-rpg/js/constants.js

# engine.jsの現在のexport一覧確認
grep "^export function" dragon-quest-rpg/js/engine.js

# data.jsにencounterTablesがあるか確認
grep -n "encounterTables\|encounterTableFallback" dragon-quest-rpg/js/data.js

# inventory.jsにaddItemがあるか確認
grep -n "export function addItem" dragon-quest-rpg/js/inventory.js

# save.jsにsaveGameがあるか確認
grep -n "export function saveGame" dragon-quest-rpg/js/save.js
```

---

## 🔄 実装開始

このガイドを参照しながら実装を進める。
完了したステップは✅でマークする。
