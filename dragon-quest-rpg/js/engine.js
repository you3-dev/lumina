import {
    gameMode, party, partyData, currentMap, currentMapId, currentMapPath, maps,
    setGameMode, isTransitioning, setIsTransitioning,
    mapLoadState, tileSize, canvasWidth, canvasHeight,
    player, setCurrentMap, setCurrentMapId, setCurrentMapPath,
    setCameraX, setCameraY, stepsSinceLastBattle, setStepsSinceLastBattle,
    pushedIceBlocks, dialog, titleMenuIndex, setTitleMenuIndex, titleMenuActive, setTitleMenuActive,
    hasSaveData, setHasSaveData, gameProgress, hasItem, addItem, removeItem, getStoryFlag,
    inn, church, shop, menu, partyJoinConfirm, battle, createPartyMember, updateActualStats, resetGameProgress, setupPlayerProxy,
    ruraState, lastTown, spellFlash
} from './state.js';
import {
    MODE, WALKABLE_TILES, TILE, SAVE_KEY,
    ENCOUNTER_TILES, SAFE_STEPS, ENCOUNTER_RATE_PER_STEP, MAX_ENCOUNTER_RATE
} from './constants.js';
import { expTable, spells, items, encounterTables, encounterTableFallback, shopItemsByArea } from './data.js';
import { startBattle } from './battle.js';
import { SE, BGM, initAudio, toggleSound } from './sound.js';

export function getReviveCost(member) {
    return member.level * 20;
}

export function getCureCost() {
    return 10;
}

export function getAlivePartyMembers() {
    return party.filter(m => m.hp > 0);
}

export function getDeadPartyMembers() {
    return party.filter(m => !m.isAlive || m.hp <= 0);
}

// パーティ全員のHP/MPを全回復し、戦闘不能も復活させる
export function restoreAll() {
    party.forEach(member => {
        member.hp = member.maxHp;
        member.mp = member.maxMp;
        member.isAlive = true;
        member.status = { sleep: 0, poison: 0, blind: 0 };
    });
}

// 特定のメンバーを復活させる（HP半分または全回復）
export function reviveMember(member, fullHp = false) {
    if (!member) return false;
    member.hp = fullHp ? member.maxHp : Math.floor(member.maxHp / 2);
    member.isAlive = true;
    member.status = { sleep: 0, poison: 0, blind: 0 };
    return true;
}

export function updateMemberActualStats(member) {
    // member.actualAtk = ...
}

export function checkLevelUp(member, callback) {
    // level up logic
}

export function checkMemberLevelUp(member, callback) {
    if (member.level < expTable.length - 1 && member.exp >= expTable[member.level + 1]) {
        member.level++;
        // ... stats up ...
        updateMemberActualStats(member);
        // ... level up msg ...
        SE.levelUp();
        checkMemberLevelUp(member, callback);
    } else {
        callback();
    }
}

export async function loadMapFromDatabase(mapPath) {
    try {
        const response = await fetch(mapPath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const mapData = await response.json();
        return mapData;
    } catch (error) {
        console.error(`Map load error (${mapPath}):`, error);
        throw error;
    }
}

export function isMapPath(target) {
    return target.startsWith('maps/') || target.endsWith('.json');
}

export function getMapPathFromId(mapId) {
    if (mapId === 'maouRoom') return 'maps/maou_room.json';
    return `maps/${mapId}.json`;
}

export function getMapIdFromPath(mapPath) {
    const match = mapPath.match(/maps\/(.+)\.json/);
    if (match) {
        const id = match[1].replace('_', '');
        return id === 'maou_room' ? 'maouRoom' : id;
    }
    return mapPath;
}

export async function performWarp(targetMap, targetX, targetY, force = false) {
    if (isTransitioning && !force) return;

    const isNew = isMapPath(targetMap);
    const targetPath = isNew ? targetMap : getMapPathFromId(targetMap);
    const targetId = isNew ? getMapIdFromPath(targetMap) : targetMap;

    if (maps[targetId] && maps[targetId]._isExternal) {
        performLegacyWarp(targetId, targetX, targetY);
        return;
    }

    setIsTransitioning(true);
    mapLoadState.loading = true;
    const fadeOverlay = document.getElementById('fadeOverlay');
    if (fadeOverlay) fadeOverlay.classList.add('active');

    try {
        await new Promise(resolve => setTimeout(resolve, 300));
        const mapData = await loadMapFromDatabase(targetPath);
        mapData._isExternal = true;
        maps[mapData.mapId] = mapData;

        setCurrentMapId(mapData.mapId);
        setCurrentMapPath(targetPath);
        setCurrentMap(mapData);
        player.x = targetX;
        player.y = targetY;

        const mapNameEl = document.getElementById('mapName');
        if (mapNameEl) mapNameEl.textContent = currentMap.name;

        updateCamera();
        saveGame();

        if (currentMap.encounterRate <= 0) {
            setStepsSinceLastBattle(0);
        }

        setTimeout(() => {
            if (fadeOverlay) fadeOverlay.classList.remove('active');
            setIsTransitioning(false);
            mapLoadState.loading = false;
        }, 300);

    } catch (e) {
        console.error('Warp error:', e);
        setIsTransitioning(false);
        mapLoadState.loading = false;
    }
}

export function performLegacyWarp(targetMapId, targetX, targetY) {
    // simplified legacy warp
    const mapData = maps[targetMapId];
    if (!mapData) return;

    setCurrentMapId(targetMapId);
    setCurrentMap(mapData);
    player.x = targetX;
    player.y = targetY;

    const mapNameEl = document.getElementById('mapName');
    if (mapNameEl) mapNameEl.textContent = currentMap.name;

    updateCamera();
    saveGame();
}

export function updateCamera() {
    if (!currentMap) return;
    const mapCols = currentMap.cols || currentMap.width || 0;
    const mapRows = currentMap.rows || currentMap.height || 0;

    let targetX = player.x * tileSize - canvasWidth / 2 + tileSize / 2;
    let targetY = player.y * tileSize - canvasHeight / 2 + tileSize / 2;

    const mapPxWidth = mapCols * tileSize;
    const mapPxHeight = mapRows * tileSize;

    if (!currentMap.isLooping) {
        targetX = Math.max(0, Math.min(targetX, mapPxWidth - canvasWidth));
        targetY = Math.max(0, Math.min(targetY, mapPxHeight - canvasHeight));
    }

    setCameraX(targetX);
    setCameraY(targetY);
}

export function movePlayer(dir) {
    if (partyData.moving || isTransitioning) return;

    player.direction = dir;
    let dx = 0, dy = 0;
    if (dir === 'up') dy = -1;
    else if (dir === 'down') dy = 1;
    else if (dir === 'left') dx = -1;
    else if (dir === 'right') dx = 1;

    const nextX = player.x + dx;
    const nextY = player.y + dy;

    if (canMoveTo(nextX, nextY)) {
        partyData.prevX = player.x;
        partyData.prevY = player.y;
        partyData.moving = true;
        partyData.moveDir = dir;
        partyData.moveProgress = 0;
        partyData.nextX = nextX;
        partyData.nextY = nextY;
    }
}

export function canMoveTo(x, y) {
    if (!currentMap) return false;
    const mapCols = currentMap.cols || currentMap.width || 0;
    const mapRows = currentMap.rows || currentMap.height || 0;

    let checkX = x;
    let checkY = y;

    if (currentMap.isLooping) {
        checkX = (x % mapCols + mapCols) % mapCols;
        checkY = (y % mapRows + mapRows) % mapRows;
    } else {
        if (checkX < 0 || checkY < 0 || checkX >= mapCols || checkY >= mapRows) return false;
    }

    let tile;
    if (Array.isArray(currentMap.data[0])) {
        // 2D Array
        tile = currentMap.data[checkY][checkX];
    } else {
        // 1D Array
        tile = currentMap.data[checkY * mapCols + checkX];
    }

    if (partyData.vehicle === 'ship') {
        const shipWalkable = [TILE.SEA, TILE.SHALLOW, TILE.PORT];
        if (!shipWalkable.includes(tile)) return false;
    } else {
        if (!WALKABLE_TILES.includes(tile)) return false;
        if (tile === TILE.SEA) return false; // Can't walk on sea
    }

    if (isNpcBlocking(checkX, checkY)) return false;
    if (isChestBlocking(checkX, checkY)) return false;
    if (isIceBlockBlocking(checkX, checkY)) return false;

    return true;
}

export function isNpcBlocking(x, y) {
    if (!currentMap || !currentMap.npcs) return false;
    return currentMap.npcs.some(npc => npc.x === x && npc.y === y);
}

export function isChestBlocking(x, y) {
    if (!currentMap || !currentMap.chests) return false;
    return currentMap.chests.some(chest => chest.x === x && chest.y === y && !chest.isOpened);
}

export function isIceBlockBlocking(x, y) {
    if (!pushedIceBlocks || !pushedIceBlocks[currentMapId]) return false;
    return pushedIceBlocks[currentMapId].some(block => block.x === x && block.y === y);
}

export function updatePlayerMovement(delta) {
    if (!partyData.moving) return;

    const speedMultiplier = partyData.vehicle === 'ship' ? 1.5 : 1.0;
    partyData.moveProgress += delta * 0.01 * speedMultiplier; // speed
    if (partyData.moveProgress >= 1) {
        // Normalize coordinates if looping
        const mapCols = currentMap.cols || currentMap.width || 0;
        const mapRows = currentMap.rows || currentMap.height || 0;

        if (currentMap.isLooping) {
            player.x = (partyData.nextX % mapCols + mapCols) % mapCols;
            player.y = (partyData.nextY % mapRows + mapRows) % mapRows;
        } else {
            player.x = partyData.nextX;
            player.y = partyData.nextY;
        }

        partyData.moving = false;
        partyData.moveProgress = 0;

        checkWarp(player.x, player.y);
        if (gameMode === MODE.FIELD) {
            checkRandomEncounter();
        }
        checkOxygen();
        checkCurrent();
        checkAcidDamage();
        checkCoralMazeSound();
        checkGuardCollision();
        updateGigant();
        partyData.totalSteps++;
    }
    updateCamera();
}

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
    const tile = getTileAt(player.x, player.y);
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

function checkOxygen() {
    const tile = getTileAt(player.x, player.y);
    if (tile === TILE.BUBBLE) {
        partyData.oxygen = 100;
        SE.confirm(); // Recovery sound
        return;
    }

    if (currentMap.isUnderwater) {
        partyData.oxygen = Math.max(0, partyData.oxygen - 1);
        if (partyData.oxygen === 0) {
            // Damage
            player.hp = Math.max(1, player.hp - Math.floor(player.maxHp * 0.1)); // 10% damage
            SE.damage();
        }
    } else {
        partyData.oxygen = 100;
    }
}

export function checkWarp(x, y) {
    if (!currentMap || !currentMap.warps) return;
    const warp = currentMap.warps.find(w => w.x === x && w.y === y);
    // Standard step warps (no type or type='step')
    if (warp && (!warp.type || warp.type === 'step')) {
        // Check for Flag Requirement
        if (warp.requiresFlag && !getStoryFlag(warp.requiresFlag)) {
            return;
        }

        performWarp(warp.targetMap, warp.targetX, warp.targetY);
    }
}

export function checkCurrent() {
    const tile = getTileAt(player.x, player.y);
    let dx = 0, dy = 0;
    if (tile === TILE.CURRENT_UP) dy = -1;
    else if (tile === TILE.CURRENT_DOWN) dy = 1;
    else if (tile === TILE.CURRENT_LEFT) dx = -1;
    else if (tile === TILE.CURRENT_RIGHT) dx = 1;

    if (dx !== 0 || dy !== 0) {
        const nextX = player.x + dx;
        const nextY = player.y + dy;
        if (canMoveTo(nextX, nextY)) {
            // Automatic movement like ice floor
            partyData.moving = true;
            partyData.nextX = nextX;
            partyData.nextY = nextY;
            partyData.moveProgress = 0;
        }
    }
}

function checkAcidDamage() {
    const tile = getTileAt(player.x, player.y);
    if (tile === TILE.ACID) {
        player.hp = Math.max(1, player.hp - 15);
        SE.damage();
    }
}

function checkCoralMazeSound() {
    if (currentMapId !== 'coral_maze') return;

    // Example: Siren at (10, 5)
    const goalX = 10, goalY = 5;
    const prevDist = Math.abs(partyData.prevX - goalX) + Math.abs(partyData.prevY - goalY);
    const currDist = Math.abs(player.x - goalX) + Math.abs(player.y - goalY);

    if (currDist < prevDist) {
        SE.confirm(); // High pitch/Confirm
    } else if (currDist > prevDist) {
        SE.cancel(); // Low pitch/Cancel
    }
}

function checkGuardCollision() {
    const npc = getNpcAt(player.x, player.y);
    if (npc && npc.type === 'guard') {
        startBattle('prison_guard');
    }
}

export function getTileAt(x, y) {
    if (!currentMap) return null;
    const mapCols = currentMap.cols || currentMap.width || 0;
    const mapRows = currentMap.rows || currentMap.height || 0;
    let cx = x, cy = y;
    if (currentMap.isLooping) {
        cx = (x % mapCols + mapCols) % mapCols;
        cy = (y % mapRows + mapRows) % mapRows;
    }
    if (Array.isArray(currentMap.data[0])) return currentMap.data[cy][cx];
    return currentMap.data[cy * mapCols + cx];
}

export function checkInteractionWarp(x, y) {
    if (!currentMap || !currentMap.warps) return false;
    const warp = currentMap.warps.find(w => w.x === x && w.y === y);

    if (warp) {
        // Landing: Ship -> Land Map
        if (warp.type === 'landing') {
            if (partyData.vehicle === 'ship') {
                // Check for Flag Requirement
                if (warp.requiresFlag && !getStoryFlag(warp.requiresFlag)) {
                    if (warp.requiresFlag === 'allTearsObtained') {
                        startDialog([
                            "渦の中へ入ろうとしたが、強力な結界に弾き返された！",
                            "３つの「海神の涙」が必要なようだ……。"
                        ]);
                    }
                    return false;
                }
                SE.confirm();
                partyData.vehicle = 'none';
                performWarp(warp.targetMap, warp.targetX, warp.targetY);
                return true;
            }
        }
        // Embarking: Land -> Ship Map
        else if (warp.type === 'embark') {
            // Must have ship key/whistle
            if (partyData.vehicle === 'none' && hasItem(121)) {
                SE.confirm();
                partyData.vehicle = 'ship';
                performWarp(warp.targetMap, warp.targetX, warp.targetY);

                // Albida Event Trigger
                if (currentMapId === 'town_portia' && !gameProgress.bossDefeated.albida) {
                    dialog.pendingBattleMonsterId = 'albida';
                    startDialog([
                        "船を出した！",
                        "……む？！ 前方に海賊船が現れた！",
                        "アルビダ「ヒャッハー！ この海を通したくば、身ぐるみを置いていきな！」"
                    ]);
                } else {
                    startDialog(["船を出した！"]);
                }
                return true;
            }
        }
    }
    return false;
}

export function updateGigant() {
    if (!currentMap || currentMap.mapId !== 'area5_ocean') return;

    // Gigant moves every 50 steps
    // Total steps can be estimated from state.
    const steps = stepsSinceLastBattle; // This resets on battle, let's use something more persistent?
    // Actually, let's use a simpler heuristic: frame-based or just persistent steps.
    // For now, let's just use gameProgress.storyFlags.gigantPos or similar.

    // Simple implementation: Change Gigant warp location based on steps
    const gigantWarp = currentMap.warps.find(w => w.targetMap === 'maps/gigant_interior.json');
    if (!gigantWarp) return;

    // Positions: (14, 103), (180, 20), (50, 150)
    const positions = [
        { x: 14, y: 103 },
        { x: 180, y: 20 },
        { x: 50, y: 150 }
    ];

    // We need a persistent step counter. Let's add one to partyData if not exists.
    if (partyData.totalSteps === undefined) partyData.totalSteps = 0;
    partyData.totalSteps++;

    const posIndex = Math.floor(partyData.totalSteps / 100) % positions.length;
    const targetPos = positions[posIndex];

    if (gigantWarp.x !== targetPos.x || gigantWarp.y !== targetPos.y) {
        // Remove old port tile, add new one
        const oldX = gigantWarp.x;
        const oldY = gigantWarp.y;

        // Find 1D index
        const cols = currentMap.cols;
        currentMap.data[oldY * cols + oldX] = 5; // SEA

        // Update warp
        gigantWarp.x = targetPos.x;
        gigantWarp.y = targetPos.y;

        // Set new port tile
        currentMap.data[targetPos.y * cols + targetPos.x] = 30; // PORT
    }
}

export function updateNPCs(delta) {
    if (!currentMap || !currentMap.npcs) return;
    currentMap.npcs.forEach(npc => {
        // NPC move logic
    });
}

export function startDialog(messages) {
    dialog.active = true;
    dialog.messages = Array.isArray(messages) ? messages : [messages];
    dialog.currentIndex = 0;
    dialog.displayedText = '';
    dialog.charIndex = 0;
    dialog.isTyping = true;
    typeNextChar();
}

// ダイアログ（コールバック付き）
export function startDialogWithCallback(messages, onComplete) {
    dialog.active = true;
    dialog.messages = Array.isArray(messages) ? messages : [messages];
    dialog.currentIndex = 0;
    dialog.displayedText = '';
    dialog.charIndex = 0;
    dialog.isTyping = true;
    dialog.onComplete = onComplete;  // コールバックを保存
    typeNextChar();
}

// ルーラ用：利用可能な拠点リストを取得
export function getAvailableRuraLocations() {
    // エリア3クリア後は全拠点移動可能
    if (gameProgress.storyFlags.area3Completed) {
        return gameProgress.visitedLocations;
    }
    // エリア3クリア前でエリア3にいる場合、エリア3の拠点のみ返す
    if (currentMap.area === 'area3') {
        return gameProgress.visitedLocations.filter(loc => loc.area === 'area3');
    }
    // それ以外は全拠点（エリア3以外）
    return gameProgress.visitedLocations.filter(loc => loc.area !== 'area3');
}

// リレミト用：ダンジョン入口情報を取得
export function getLastEntrance() {
    return gameProgress.lastEntrance;
}

// リレミト用：ダンジョン進入前の位置を記憶
export function recordDungeonEntrance(prevMapData, prevX, prevY, prevMapPath) {
    // 屋外から屋内/ダンジョンへ移動した場合のみ記憶
    if (prevMapData && prevMapData.isOutdoor === true) {
        gameProgress.lastEntrance = {
            mapId: prevMapData.mapId,
            mapPath: prevMapPath,
            x: prevX,
            y: prevY,
            name: prevMapData.name
        };
    }
}

export function typeNextChar() {
    if (!dialog.active) return;
    const currentMessage = dialog.messages[dialog.currentIndex];
    if (dialog.charIndex < currentMessage.length) {
        dialog.displayedText += currentMessage[dialog.charIndex];
        dialog.charIndex++;
        setTimeout(typeNextChar, dialog.typingSpeed);
    } else {
        dialog.isTyping = false;
    }
}

export function advanceDialog() {
    if (!dialog.active) return;
    if (dialog.isTyping) {
        dialog.displayedText = dialog.messages[dialog.currentIndex];
        dialog.charIndex = dialog.messages[dialog.currentIndex].length;
        dialog.isTyping = false;
    } else if (dialog.currentIndex < dialog.messages.length - 1) {
        dialog.currentIndex++;
        dialog.displayedText = '';
        dialog.charIndex = 0;
        dialog.isTyping = true;
        typeNextChar();
    } else {
        closeDialog();
    }
}

export function closeDialog() {
    const pendingBossId = dialog.pendingBattleMonsterId;
    const pendingAction = dialog.pendingAction;
    dialog.active = false;
    dialog.messages = [];
    dialog.currentIndex = 0;
    dialog.displayedText = '';
    dialog.pendingBattleMonsterId = null;
    dialog.pendingAction = null;

    if (pendingBossId) {
        startBattle(pendingBossId);
    } else if (pendingAction) {
        if (pendingAction.type === 'shop') {
            openShop(pendingAction.id);
        } else if (pendingAction.type === 'inn') {
            openInn(pendingAction.cost || 10);
        } else if (pendingAction.type === 'church') {
            openChurch();
        }
    }
}

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

// インベントリをアイテムID順に整理
export function organizeInventory() {
    player.inventory.sort((a, b) => a.id - b.id);
}

// アイテムアクション実行
export function executeItemAction() {
    if (player.inventory.length === 0) return;

    // validItemsからアイテムを取得（表示と同じフィルタリング）
    const validItems = player.inventory.filter(slot => items[slot.id]);
    if (validItems.length === 0) return;

    const slot = validItems[menu.itemCursor];
    if (!slot) return;
    const selectedItemId = slot.id;
    const selectedItem = items[selectedItemId];
    if (!selectedItem) return;

    const isEquipment = (selectedItem.type === 'weapon' || selectedItem.type === 'armor');

    switch (menu.itemActionIndex) {
        case 0: // つかう or そうびする
            if (isEquipment) {
                // パーティが複数いる場合は装備対象を選択
                if (party.length > 1) {
                    menu.selectingEquipMember = true;
                    menu.targetMemberCursor = 0;
                    menu.showItemAction = false;
                } else {
                    // 装備する（1人の場合は直接）
                    const result = equipItem(selectedItemId);
                    closeMenu();
                    if (result) {
                        startDialog([`${selectedItem.name}を そうびした！`]);
                    } else {
                        startDialog([`${player.name}は ${selectedItem.name}を そうびできない！`]);
                    }
                }
            } else {
                // 使う - 対象選択が必要なアイテムかチェック
                const needsTarget = (selectedItem.type === 'heal' || selectedItem.type === 'cure');
                if (needsTarget && party.length > 1) {
                    menu.selectingItemMember = true;
                    menu.targetMemberCursor = 0;
                    menu.showItemAction = false;
                } else {
                    useItem(selectedItemId);
                }
            }
            break;

        case 1: // すてる
            removeItem(selectedItemId, 1);
            // カーソル位置調整（有効なアイテム数でチェック）
            {
                const validItems = player.inventory.filter(slot => items[slot.id]);
                if (menu.itemCursor >= validItems.length && menu.itemCursor > 0) {
                    menu.itemCursor--;
                }
            }
            menu.showItemAction = false;
            if (player.inventory.length === 0) {
                closeMenu();
                startDialog([`${selectedItem.name}を すてた。`]);
            }
            break;

        case 2: // せいとん
            organizeInventory();
            menu.itemCursor = 0;
            menu.showItemAction = false;
            break;

        case 3: // やめる
            menu.showItemAction = false;
            break;
    }
}

// 装備対象メンバー確定
export function confirmEquipMember() {
    // validItemsからアイテムを取得（表示と同じフィルタリング）
    const validItems = player.inventory.filter(slot => items[slot.id]);
    const slot = validItems[menu.itemCursor];
    if (!slot) return;
    const selectedItemId = slot.id;
    const selectedItem = items[selectedItemId];
    if (!selectedItem) return;

    const targetMember = party[menu.targetMemberCursor];
    const result = equipItem(selectedItemId, targetMember);
    menu.selectingEquipMember = false;
    closeMenu();

    if (result) {
        startDialog([`${targetMember.name}は ${selectedItem.name}を そうびした！`]);
    } else {
        startDialog([`${targetMember.name}は ${selectedItem.name}を そうびできない！`]);
    }
}

// アイテム使用対象メンバー確定
export function confirmItemMember() {
    // validItemsからアイテムを取得（表示と同じフィルタリング）
    const validItems = player.inventory.filter(slot => items[slot.id]);
    const slot = validItems[menu.itemCursor];
    if (!slot) return;
    const selectedItemId = slot.id;
    const selectedItem = items[selectedItemId];
    if (!selectedItem) return;

    const targetMember = party[menu.targetMemberCursor];
    menu.selectingItemMember = false;
    useItem(selectedItemId, targetMember);
}

export function openShop(shopId) {
    shop.active = true;
    shop.id = shopId;
    shop.phase = 'buy';
    setGameMode(MODE.SHOP);
}

export function openInn(cost) {
    inn.active = true;
    inn.cost = cost;
    setGameMode(MODE.INN);
}

export function closeInn() {
    inn.active = false;
    setGameMode(MODE.FIELD);
}

export function openChurch() {
    church.active = true;
    church.phase = 'menu';
    setGameMode(MODE.CHURCH);
}

export function closeChurch() {
    church.active = false;
    church.phase = 'menu';
    setGameMode(MODE.FIELD);
}

// 宿屋利用確定
export function confirmInn() {
    if (inn.selectedIndex === 0) {
        // はい
        if (player.gold >= inn.cost) {
            player.gold -= inn.cost;
            closeInn();
            // 暗転演出
            const fadeOverlay = document.getElementById('fadeOverlay');
            if (fadeOverlay) {
                fadeOverlay.classList.add('active');
                setTimeout(() => {
                    // パーティ全員のHP/MP全回復＋戦闘不能復活
                    restoreAll();
                    saveGame();
                    setTimeout(() => {
                        fadeOverlay.classList.remove('active');
                        SE.inn(); // 宿屋回復SE
                        startDialog(['ゆっくり おやすみください...', 'おはようございます！', 'みんなの HPとMPが かいふくしました！']);
                    }, 500);
                }, 500);
            } else {
                // fadeOverlayがない場合は即座に回復
                restoreAll();
                saveGame();
                SE.inn();
                startDialog(['ゆっくり おやすみください...', 'おはようございます！', 'みんなの HPとMPが かいふくしました！']);
            }
        } else {
            closeInn();
            startDialog(['お金が たりないようです...']);
        }
    } else {
        // いいえ
        closeInn();
        startDialog(['またのお越しを おまちしております。']);
    }
}

// 教会メニューの選択肢に応じた処理
export function selectChurchMenu() {
    switch (church.menuIndex) {
        case 0: // いきかえらせる
            const deadMembers = getDeadPartyMembers();
            if (deadMembers.length === 0) {
                startDialog(['おお、みなさん ご無事のようですね。', 'いきかえらせる ひつようは ありません。']);
                closeChurch();
            } else {
                church.phase = 'selectMember';
                church.selectedMember = party.findIndex(m => !m.isAlive || m.hp <= 0);
            }
            break;
        case 1: // どくのちりょう
            const poisonedMembers = party.filter(m => m.status && m.status.poison > 0);
            if (poisonedMembers.length === 0) {
                startDialog(['どくに おかされている方は いらっしゃいませんね。']);
                closeChurch();
            } else {
                church.phase = 'selectMember';
                church.selectedMember = party.findIndex(m => m.status && m.status.poison > 0);
            }
            break;
        case 2: // おいのりをする（セーブ）
            saveGame();
            SE.save(); // セーブ音
            startDialog(['おいのりを ささげました。', 'ぼうけんのしょに きろくしました。']);
            closeChurch();
            break;
        case 3: // やめる
            startDialog(['また いつでも おこしください。']);
            closeChurch();
            break;
    }
}

// メンバー選択の決定
export function confirmChurchMember() {
    const member = party[church.selectedMember];
    if (!member) {
        closeChurch();
        return;
    }

    if (church.menuIndex === 0) {
        // 復活の確認
        if (member.isAlive && member.hp > 0) {
            // 生きているメンバーを選んだ
            startDialog([`${member.name} は たおれていません。`]);
            church.phase = 'menu';
        } else {
            const cost = getReviveCost(member);
            church.phase = 'confirm';
            // 確認メッセージは描画で表示
        }
    } else if (church.menuIndex === 1) {
        // 毒治療の確認
        if (!member.status || member.status.poison <= 0) {
            startDialog([`${member.name} は どくに おかされていません。`]);
            church.phase = 'menu';
        } else {
            church.phase = 'confirm';
        }
    }
}

// 復活・治療の最終確認
export function confirmChurchAction() {
    const member = party[church.selectedMember];
    if (!member) {
        closeChurch();
        return;
    }

    if (church.confirmIndex === 0) {
        // はい
        if (church.menuIndex === 0) {
            // 復活
            const cost = getReviveCost(member);
            if (partyData.gold >= cost) {
                partyData.gold -= cost;
                reviveMember(member, true); // 全回復で復活
                saveGame();
                SE.revive(); // 復活SE
                startDialog([`${member.name} は いきかえった！`]);
            } else {
                startDialog(['お金が たりないようです...']);
            }
        } else if (church.menuIndex === 1) {
            // 毒治療
            const cost = getCureCost();
            if (partyData.gold >= cost) {
                partyData.gold -= cost;
                member.status.poison = 0;
                saveGame();
                startDialog([`${member.name} の どくを なおしました！`]);
            } else {
                startDialog(['お金が たりないようです...']);
            }
        }
    } else {
        // いいえ
        startDialog(['そうですか...']);
    }
    closeChurch();
}

// アイテム使用
export function useItem(itemId, targetMember = null) {
    const item = items[itemId];
    if (!item) return false;

    // 装備アイテムは使用できない（装備するを選ぶ必要がある）
    if (item.type === 'weapon' || item.type === 'armor') {
        return false;
    }

    // ターゲットが指定されていない場合はプレイヤー
    const target = targetMember || player;
    let message = '';
    let success = false;

    switch (item.type) {
        case 'heal':
            // HP回復アイテム
            // 戦闘不能者には使用できない
            if (!target.isAlive || target.hp <= 0) {
                message = `${target.name}は たおれている！`;
            } else if (target.hp >= target.maxHp) {
                message = `${target.name}の HPは まんたんだ！`;
            } else {
                const healAmount = Math.min(item.value, target.maxHp - target.hp);
                target.hp += healAmount;
                message = `${target.name}に ${item.name}を使った！\nHPが ${healAmount} 回復した！`;
                success = true;
            }
            break;

        case 'revive':
            // 世界樹の葉：戦闘不能から復活
            if (target.isAlive && target.hp > 0) {
                message = `${target.name}は たおれていない！`;
            } else {
                reviveMember(target, true); // HP全回復で復活
                message = `${target.name}に ${item.name}を使った！\n${target.name}は いきかえった！`;
                success = true;
                saveGame();
            }
            break;

        case 'cure':
            // 状態異常回復（毒など）
            if (target.status && target.status.poison > 0) {
                target.status.poison = 0;
                message = `${target.name}に ${item.name}を使った！\n毒が 治った！`;
                success = true;
            } else {
                message = `${target.name}は 毒に かかっていない！`;
            }
            break;

        case 'holy':
            // 聖水：しばらくエンカウントしない効果
            message = `${item.name}を使った！\nしばらく 魔物が よりつかない！`;
            setStepsSinceLastBattle(-10); // 歩数をマイナスにしてエンカウント回避
            success = true;
            break;

        case 'escape':
            // キメラのつばさ：町に戻る
            if (currentMap.type === 'town' || currentMap.type === 'castle') {
                message = 'ここでは 使えない！';
            } else {
                // アイテム消費
                removeItem(itemId, 1);
                {
                    const validItems = player.inventory.filter(slot => items[slot.id]);
                    if (menu.itemCursor >= validItems.length && menu.itemCursor > 0) {
                        menu.itemCursor--;
                    }
                }
                // メニューを閉じてダイアログ表示、完了後にワープ
                closeMenu();
                startDialogWithCallback(
                    [`${item.name}を使った！`, `${lastTown.name}に 飛んでいく...`],
                    () => {
                        performWarp(lastTown.mapPath, lastTown.x, lastTown.y);
                    }
                );
                return true;
            }
            break;

        case 'key':
            // 鍵：フィールドでは使えない
            message = 'ここでは 使えない！';
            break;

        default:
            message = 'ここでは 使えない！';
            break;
    }

    // 使用成功時、インベントリから削除
    if (success) {
        removeItem(itemId, 1);
        // カーソル位置調整（有効なアイテム数でチェック）
        const validItems = player.inventory.filter(slot => items[slot.id]);
        if (menu.itemCursor >= validItems.length && menu.itemCursor > 0) {
            menu.itemCursor--;
        }
    }

    // メニューを閉じてダイアログ表示
    closeMenu();
    startDialog(message.split('\n'));
    return success;
}

// フィールドで呪文を使用
export function useSpellInField() {
    const caster = party[menu.memberCursor] || party[0];
    if (caster.spells.length === 0) return;

    // 戦闘不能チェック
    if (!caster.isAlive || caster.hp <= 0) {
        closeMenu();
        startDialog([`${caster.name}は たおれている！`]);
        return;
    }

    const spellId = caster.spells[menu.spellCursor];
    const spell = spells[spellId];
    if (!spell) return;

    // MP不足チェック
    if (caster.mp < spell.mp) {
        closeMenu();
        startDialog(['MPが 足りない！']);
        return;
    }

    // 呪文タイプ別処理
    if (spell.type === 'heal') {
        // 回復呪文 - パーティがいる場合は対象選択
        if (party.length > 1) {
            menu.selectingMember = true;
            menu.targetMemberCursor = 0;
        } else {
            // ソロプレイ時は自分に使う
            if (caster.hp >= caster.maxHp) {
                closeMenu();
                startDialog(['HPは まんたんだ！']);
                return;
            }

            caster.mp -= spell.mp;
            const healAmount = Math.min(spell.power, caster.maxHp - caster.hp);
            caster.hp += healAmount;

            closeMenu();
            startDialog([
                `${caster.name}は ${spell.name}を となえた！`,
                `HPが ${healAmount} 回復した！`
            ]);
        }

    } else if (spell.type === 'warp') {
        // ルーラ（拠点ワープ）
        useRura();

    } else if (spell.type === 'escape') {
        // リレミト（ダンジョン脱出）
        useRiremito();

    } else if (spell.type === 'revive') {
        // ザオラル（復活呪文）- フィールドで使用
        const deadMembers = getDeadPartyMembers();
        if (deadMembers.length === 0) {
            closeMenu();
            startDialog(['だれも たおれていない！']);
            return;
        }
        // パーティが複数なら対象選択
        if (party.length > 1) {
            menu.selectingMember = true;
            menu.targetMemberCursor = party.findIndex(m => !m.isAlive || m.hp <= 0);
        } else {
            closeMenu();
            startDialog(['だれも たおれていない！']);
        }

    } else {
        closeMenu();
        startDialog(['ここでは 使えない！']);
    }
}

// フィールドで呪文を対象に使用
export function executeFieldSpellOnTarget() {
    const caster = party[menu.memberCursor] || party[0];
    const target = party[menu.targetMemberCursor];
    if (!target) {
        menu.selectingMember = false;
        return;
    }

    const spellId = caster.spells[menu.spellCursor];
    const spell = spells[spellId];
    if (!spell) {
        menu.selectingMember = false;
        return;
    }

    // 回復呪文の処理
    if (spell.type === 'heal') {
        // 戦闘不能者には回復呪文は効かない
        if (!target.isAlive || target.hp <= 0) {
            menu.selectingMember = false;
            closeMenu();
            startDialog([`${target.name}は たおれている！`]);
            return;
        }
        if (target.hp >= target.maxHp) {
            menu.selectingMember = false;
            closeMenu();
            startDialog([`${target.name}の HPは まんたんだ！`]);
            return;
        }

        caster.mp -= spell.mp;
        const healAmount = Math.min(spell.power, target.maxHp - target.hp);
        target.hp += healAmount;

        menu.selectingMember = false;
        closeMenu();

        if (caster === target) {
            startDialog([
                `${caster.name}は ${spell.name}を となえた！`,
                `HPが ${healAmount} 回復した！`
            ]);
        } else {
            startDialog([
                `${caster.name}は ${spell.name}を となえた！`,
                `${target.name}の HPが ${healAmount} 回復した！`
            ]);
        }
    } else if (spell.type === 'revive') {
        // 復活呪文（ザオラル）の処理
        if (target.isAlive && target.hp > 0) {
            menu.selectingMember = false;
            closeMenu();
            startDialog([`${target.name}は たおれていない！`]);
            return;
        }

        caster.mp -= spell.mp;
        menu.selectingMember = false;
        closeMenu();

        // 50%の成功率
        const successRate = spell.successRate || 0.5;
        if (Math.random() < successRate) {
            reviveMember(target, false); // HP半分で復活
            saveGame();
            startDialog([
                `${caster.name}は ${spell.name}を となえた！`,
                `${target.name}は いきかえった！`
            ]);
        } else {
            startDialog([
                `${caster.name}は ${spell.name}を となえた！`,
                `しかし ${target.name}は いきかえらなかった...`
            ]);
        }
    }
}

// ルーラを使用（拠点選択UIを表示）
export function useRura() {
    const caster = party[menu.memberCursor] || party[0];
    const spell = spells.rura;

    // 天井判定：屋内では使えない
    if (currentMap.isOutdoor === false) {
        caster.mp -= spell.mp;
        closeMenu();
        startDialog([
            `${caster.name}は ${spell.name}を となえた！`,
            'しかし 天井に 頭を ぶつけてしまった！'
        ]);
        return;
    }

    // エリア制限対応：利用可能な拠点を取得
    const availableLocations = getAvailableRuraLocations();

    // 訪問済み拠点がない場合
    if (availableLocations.length === 0) {
        closeMenu();
        if (currentMap.area === 'area3') {
            startDialog(['この大陸では まだ どこにも 行ったことがない！']);
        } else {
            startDialog(['まだ どこにも 行ったことがない！']);
        }
        return;
    }

    // 拠点選択UIを表示（詠唱者を記憶）
    ruraState.active = true;
    ruraState.cursor = 0;
    ruraState.casterIndex = menu.memberCursor;
    menu.mode = 'rura'; // メニューモードをruraに変更
}

// ルーラ実行（拠点を選択して移動）
export async function executeRura(locationIndex) {
    const spell = spells.rura;

    // エリア制限対応：利用可能な拠点から選択
    const availableLocations = getAvailableRuraLocations();
    const location = availableLocations[locationIndex];
    if (!location) return;

    const caster = party[ruraState.casterIndex] || party[0];
    caster.mp -= spell.mp;
    ruraState.active = false;
    menu.mode = 'status'; // メニューモードを元に戻す

    // ルーラ演出（白フラッシュ）
    await playRuraAnimation();

    // ダイアログを表示してワープ
    startDialogWithCallback(
        [`${location.displayName}へ 向かって 飛び立った！`],
        () => {
            const mapPath = `maps/${location.mapId}.json`;
            performWarp(mapPath, location.arrivalX, location.arrivalY);
        }
    );
}

// ルーラ演出
export async function playRuraAnimation() {
    return new Promise(resolve => {
        // 白フラッシュ
        spellFlash.active = true;
        spellFlash.color = 'rgba(100, 200, 255, 0.8)';
        spellFlash.alpha = 1.0;

        setTimeout(() => {
            spellFlash.active = false;
            resolve();
        }, 500);
    });
}

// リレミトを使用（ダンジョン脱出）
export function useRiremito() {
    const caster = party[menu.memberCursor] || party[0];
    const spell = spells.riremito;

    // フィールドでは使えない
    if (currentMap.isOutdoor === true) {
        closeMenu();
        startDialog([
            `${caster.name}は ${spell.name}を となえた！`,
            'しかし ここでは 意味がない！'
        ]);
        return;
    }

    // ダンジョン入口情報がない場合
    const entrance = getLastEntrance();
    if (!entrance) {
        closeMenu();
        startDialog(['脱出先が 見つからない！']);
        return;
    }

    caster.mp -= spell.mp;
    closeMenu();

    // リレミト演出（白フラッシュ）
    playRiremitoAnimation().then(() => {
        startDialogWithCallback(
            [`${caster.name}は 呪文を となえて 脱出した！`],
            () => {
                performWarp(entrance.mapPath, entrance.x, entrance.y);
            }
        );
    });
}

// リレミト演出
export async function playRiremitoAnimation() {
    return new Promise(resolve => {
        spellFlash.active = true;
        spellFlash.color = 'rgba(200, 200, 255, 0.8)';
        spellFlash.alpha = 1.0;

        setTimeout(() => {
            spellFlash.active = false;
            resolve();
        }, 400);
    });
}

// ルーラ選択をキャンセル
export function cancelRuraSelection() {
    ruraState.active = false;
    menu.mode = 'spells'; // メニューモードを呪文リストに戻す
}

// 装備アイテムを装備する
export function equipItem(itemId, member = null) {
    const item = items[itemId];
    if (!item) return false;

    // 指定されたメンバーまたはデフォルトはplayer
    const target = member || player;

    // 装備可能かチェック
    if (item.equippable && !item.equippable.includes(target.job)) {
        return false; // このジョブは装備できない
    }

    if (item.type === 'weapon') {
        // 現在の武器をインベントリに戻す（初期装備でない場合）
        if (target.equipment.weapon && target.equipment.weapon !== 10) {
            addItem(target.equipment.weapon, 1);
        }
        // 新しい武器を装備
        target.equipment.weapon = itemId;
        // インベントリから削除
        removeItem(itemId, 1);
    } else if (item.type === 'armor') {
        // 現在の防具をインベントリに戻す（初期装備でない場合）
        if (target.equipment.armor && target.equipment.armor !== 20) {
            addItem(target.equipment.armor, 1);
        }
        // 新しい防具を装備
        target.equipment.armor = itemId;
        // インベントリから削除
        removeItem(itemId, 1);
    }
    // 装備変更後、ステータスを再計算
    updateActualStats(target);
    return true;
}

export function cancelTargetSelection() {
    battle.isSelectingTarget = false;
    battle.pendingAction = null;
    battle.message = '';
}

export function cancelAllySelection() {
    battle.isSelectingAlly = false;
    battle.pendingAction = null;
    battle.showSpells = true;
    battle.message = '';
}

// ショップのアイテムリストを取得
export function getShopItems() {
    return shopItemsByArea[shop.id] || shopItemsByArea.default;
}

// 売却可能なアイテムリストを作成（装備中のものは除外）
export function updateSellableItems() {
    shop.sellableItems = player.inventory.filter(slot => {
        const item = items[slot.id];
        // 価格が0のアイテム（伝説の剣など）は売れない
        if (!item || item.price === 0) return false;
        return true;
    });
}

// ショップを閉じる
export function closeShop() {
    shop.active = false;
    startDialog(['またのお越しを おまちしております。']);
}

// ショップ入力処理（完全版）
export function handleShopInput(action) {
    // メニューモード（かう/うる/やめる）
    if (shop.mode === 'menu') {
        if (action === 'up') {
            shop.menuIndex = Math.max(0, shop.menuIndex - 1);
        } else if (action === 'down') {
            shop.menuIndex = Math.min(2, shop.menuIndex + 1);
        } else if (action === 'confirm') {
            if (shop.menuIndex === 0) {
                // かう
                shop.mode = 'buy';
                shop.phase = 'list';
                shop.selectedIndex = 0;
            } else if (shop.menuIndex === 1) {
                // うる
                updateSellableItems();
                shop.mode = 'sell';
                shop.phase = 'list';
                shop.selectedIndex = 0;
            } else {
                // やめる
                closeShop();
            }
        } else if (action === 'cancel') {
            closeShop();
        }
        return;
    }

    // 購入モード
    if (shop.mode === 'buy') {
        if (shop.phase === 'list') {
            if (action === 'up') {
                shop.selectedIndex = Math.max(0, shop.selectedIndex - 1);
            } else if (action === 'down') {
                shop.selectedIndex = Math.min(getShopItems().length - 1, shop.selectedIndex + 1);
            } else if (action === 'confirm') {
                const itemId = getShopItems()[shop.selectedIndex];
                const item = items[itemId];
                if (player.gold >= item.price) {
                    shop.selectedItem = item;
                    shop.phase = 'confirm';
                    shop.confirmIndex = 0;
                }
            } else if (action === 'cancel') {
                shop.mode = 'menu';
                shop.menuIndex = 0;
            }
        } else if (shop.phase === 'confirm') {
            if (action === 'left') {
                shop.confirmIndex = 0;
            } else if (action === 'right') {
                shop.confirmIndex = 1;
            } else if (action === 'confirm') {
                if (shop.confirmIndex === 0) {
                    // 購入
                    SE.buy(); // 購入SE
                    player.gold -= shop.selectedItem.price;
                    addItem(shop.selectedItem.id, 1);
                    shop.phase = 'equip';
                    shop.equipIndex = 0;
                } else {
                    shop.phase = 'list';
                }
            } else if (action === 'cancel') {
                shop.phase = 'list';
            }
        } else if (shop.phase === 'equip') {
            if (action === 'left') {
                shop.equipIndex = 0;
            } else if (action === 'right') {
                shop.equipIndex = 1;
            } else if (action === 'confirm') {
                if (shop.equipIndex === 0) {
                    equipItem(shop.selectedItem.id);
                }
                saveGame();
                shop.phase = 'list';
            } else if (action === 'cancel') {
                saveGame();
                shop.phase = 'list';
            }
        }
        return;
    }

    // 売却モード
    if (shop.mode === 'sell') {
        if (shop.phase === 'list') {
            if (action === 'up') {
                shop.selectedIndex = Math.max(0, shop.selectedIndex - 1);
            } else if (action === 'down') {
                shop.selectedIndex = Math.min(Math.max(0, shop.sellableItems.length - 1), shop.selectedIndex + 1);
            } else if (action === 'confirm') {
                if (shop.sellableItems.length > 0) {
                    const slot = shop.sellableItems[shop.selectedIndex];
                    shop.selectedItem = items[slot.id];
                    shop.phase = 'confirm';
                    shop.confirmIndex = 0;
                }
            } else if (action === 'cancel') {
                shop.mode = 'menu';
                shop.menuIndex = 1;
            }
        } else if (shop.phase === 'confirm') {
            if (action === 'left') {
                shop.confirmIndex = 0;
            } else if (action === 'right') {
                shop.confirmIndex = 1;
            } else if (action === 'confirm') {
                if (shop.confirmIndex === 0) {
                    // 売却実行
                    const sellPrice = Math.floor(shop.selectedItem.price / 2);
                    player.gold += sellPrice;
                    // インベントリから削除
                    removeItem(shop.selectedItem.id, 1);
                    shop.phase = 'sold';
                } else {
                    shop.phase = 'list';
                }
            } else if (action === 'cancel') {
                shop.phase = 'list';
            }
        } else if (shop.phase === 'sold') {
            // 売却完了メッセージ後
            if (action === 'confirm' || action === 'cancel') {
                updateSellableItems();
                shop.selectedIndex = Math.min(shop.selectedIndex, Math.max(0, shop.sellableItems.length - 1));
                shop.phase = 'list';
                saveGame();
            }
        }
    }
}

export function getFrontPosition() {
    let fx = player.x, fy = player.y;
    switch (player.direction) {
        case 'up': fy--; break;
        case 'down': fy++; break;
        case 'left': fx--; break;
        case 'right': fx++; break;
    }
    return { x: fx, y: fy };
}

export function getNpcAt(x, y) {
    if (!currentMap || !currentMap.npcs) return null;
    return currentMap.npcs.find(npc => npc.x === x && npc.y === y);
}

export function getChestAt(x, y) {
    if (!currentMap || !currentMap.chests) return null;
    return currentMap.chests.find(chest => chest.x === x && chest.y === y);
}

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

export function interact() {
    // Basic interaction
    let front = getFrontPosition();

    // Normalize if looping
    if (currentMap && currentMap.isLooping) {
        const mapCols = currentMap.cols || currentMap.width || 0;
        const mapRows = currentMap.rows || currentMap.height || 0;
        front.x = (front.x % mapCols + mapCols) % mapCols;
        front.y = (front.y % mapRows + mapRows) % mapRows;
    }

    const npc = getNpcAt(front.x, front.y);
    if (npc) {
        let messages = npc.messages;

        // Handle bosses or special NPC clearing messages
        if (npc.defeatFlag && gameProgress.bossDefeated[npc.defeatFlag]) {
            messages = npc.clearedMessages || messages;
        }

        // Area 5 Transition Event (Snow Elder)
        if (npc.id === 'snow_elder' && gameProgress.bossDefeated.iceQueen) {
            messages = [
                "氷の女王を倒したか！実に見事な戦いぶりであった。",
                "しかし、世界にはまだ未知なる脅威がある。",
                "城の「時空の間」から、北の海へと繋がる扉が開かれた。",
                "まずはそこへ向かい、「港町ポルティア」を目指すのじゃ。"
            ];
            gameProgress.storyFlags.area4Completed = true;
        }

        // Area 5 Ship Event (Portia Mayor)
        if (npc.id === 'portia_mayor') {
            if (!hasItem(121)) { // ship_key
                addItem(121);
                messages = [
                    "おお、旅の方か。",
                    "世界を救うために旅をしておるとな？感心なことじゃ。",
                    "それなら、わしの船「リヴァイアサン号」を使うといい。",
                    "この『船の呼び笛』を持っていれば、外海からいつでも船を呼べるぞ。",
                    "北の桟橋から海へ出られるはずじゃ。"
                ];
                SE.fanfare();
            }
        }

        if ((npc.isBoss || npc.type === 'boss') && npc.bossId) {
            dialog.pendingBattleMonsterId = npc.bossId;
        }

        // Altar Event
        if (npc.isAltar) {
            if (getStoryFlag('tearOfBlueObtained') && getStoryFlag('tearOfRedObtained') && getStoryFlag('tearOfGreenObtained')) {
                startDialog([
                    "3つの涙を祭壇に捧げた！",
                    "不思議な光が天に向かって立ち昇る……！",
                    "遥か彼方の海で、巨大な渦を覆っていた結界が消滅した！"
                ]);
                gameProgress.storyFlags.allTearsObtained = true;
                SE.fanfare();
            } else {
                startDialog(["3つの大粒の涙を揃えて捧げねばならぬ..."]);
            }
            return;
        }

        if (npc.type === 'shop') {
            dialog.pendingAction = { type: 'shop', id: npc.shopId };
        } else if (npc.type === 'inn') {
            dialog.pendingAction = { type: 'inn', cost: npc.innCost || 10 };
        } else if (npc.type === 'church') {
            dialog.pendingAction = { type: 'church' };
        }

        startDialog(messages);
        return;
    }

    const chest = getChestAt(front.x, front.y);
    if (chest) {
        openChest(chest);
        // Special quest item flags
        if (chest.itemId === 124 && chest.isOpened) {
            gameProgress.storyFlags.tearOfGreenObtained = true;
        }
        return;
    }

    // Vehicle Interaction
    if (currentMap) {
        // Check for Interaction Warps (Landing/Embarking) first
        if (checkInteractionWarp(front.x, front.y)) {
            return;
        }

        let tile;
        const mapCols = currentMap.cols || currentMap.width || 0;
        if (Array.isArray(currentMap.data[0])) {
            tile = currentMap.data[front.y][front.x];
        } else {
            tile = currentMap.data[front.y * mapCols + front.x];
        }

        // Board Ship
        if (partyData.vehicle === 'none') {
            // Check tile type for boarding (SEA or PORT)
            if (tile === TILE.SEA || tile === TILE.PORT) {
                if (hasItem(121)) { // ship_key
                    SE.confirm();
                    partyData.vehicle = 'ship';
                    startDialog([
                        "船の呼び笛を吹いた！",
                        "どこからともなく船が流れてきた。",
                        "船に乗り込んだ！"
                    ]);

                    player.x = front.x;
                    player.y = front.y;
                    updateCamera();
                    return;
                } else {
                    startDialog(["船が必要だが、持っていない。"]);
                    return;
                }
            }
        }
        // Disembark Ship
        else if (partyData.vehicle === 'ship') {
            if (WALKABLE_TILES.includes(tile) && tile !== TILE.SEA) {
                SE.confirm();
                partyData.vehicle = 'none';
                startDialog(["陸に上がった。"]);

                player.x = front.x;
                player.y = front.y;
                updateCamera();
                return;
            }
        }
    }
}
export function saveGame() {
    const saveData = {
        party: party, // Save full party array
        partyData: {
            x: player.x,
            y: player.y,
            gold: partyData.gold,
            inventory: partyData.inventory,
            vehicle: partyData.vehicle,
            oxygen: partyData.oxygen,
            totalSteps: partyData.totalSteps,
            direction: player.direction // Save direction
        },
        currentMapId,
        currentMapPath, // Save map path for external maps
        gameProgress
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

export async function loadGame() {
    const json = localStorage.getItem(SAVE_KEY);
    if (!json) return false;
    try {
        const data = JSON.parse(json);

        // 1. Restore Party
        if (data.party && Array.isArray(data.party)) {
            party.length = 0;
            // Re-assign party members. Note: Classes/Methods if any are lost, but current implementation uses plain objects mostly.
            // If we had classes, we would need hydration.
            data.party.forEach(m => party.push(m));
            Object.assign(player, party[0]);

            // Re-setup proxy if needed (setupPlayerProxy is in state.js but not exported or used in app.js init?)
            // engine.js imports player from state.js. state.js exports player.
            // app.js sets up proxy. app.js needs to know player changed? 
            // Actually Object.assign updates the properties of the existing player object, so proxy should still work if it wraps the same object.
        } else if (data.player) {
            // Fallback for old save
            Object.assign(player, data.player);
        }

        // 2. Restore Party Data
        Object.assign(partyData, data.partyData);
        if (!partyData.vehicle) partyData.vehicle = 'none';
        if (typeof partyData.oxygen === 'undefined') partyData.oxygen = 100;
        if (typeof partyData.totalSteps === 'undefined') partyData.totalSteps = 0;
        if (data.partyData && data.partyData.direction) player.direction = data.partyData.direction;

        // 3. Restore Progress
        if (data.gameProgress) {
            // Recursive merge or just valid assignment
            // Deep merge might be safer for nested objects if structure changed, but assignment is usually ok for simple structure
            Object.assign(gameProgress, data.gameProgress);
            // Specifically for sub-objects if they are missing in default but present in save
            if (data.gameProgress.bossDefeated) gameProgress.bossDefeated = data.gameProgress.bossDefeated;
            if (data.gameProgress.storyFlags) gameProgress.storyFlags = data.gameProgress.storyFlags;
            if (data.gameProgress.quests) gameProgress.quests = data.gameProgress.quests;
        }

        // 4. Restore Map
        // Update current map path first so performWarp knows what to load
        if (data.currentMapPath) {
            setCurrentMapPath(data.currentMapPath);
        }

        const mapId = data.currentMapId || 'field';
        setCurrentMapId(mapId);

        setHasSaveData(true);

        // Restore Player Proxy to ensure x,y sync works after property updates
        setupPlayerProxy();

        // Wait for warp to finish (loading map, placing player)
        // Pass force=true to bypass the guard since we are already in a transition flow
        await performWarp(mapId, player.x, player.y, true);

        // NOW we can switch mode
        setGameMode(MODE.FIELD);

        // Force update of direction after warp (warp might reset it)
        if (data.partyData && data.partyData.direction) {
            player.direction = data.partyData.direction;
        }

        return true;
    } catch (e) {
        console.error("Load failed", e);
        return false;
    }
}

export function resetGame() {
    localStorage.removeItem(SAVE_KEY);
    window.location.reload();
}

export async function selectTitleMenuItem() {
    // Already in transition?
    if (isTransitioning) return;

    if (!titleMenuActive) {
        // This shouldn't really happen if listeners are correct, but safe guard
        const titleScreen = document.getElementById('titleScreen');
        if (titleScreen) titleScreen.click();
        return;
    }

    // Start transition
    setIsTransitioning(true);

    // Fade out
    const fadeOverlay = document.getElementById('fadeOverlay');
    if (fadeOverlay) fadeOverlay.classList.add('active');

    // Wait for fade
    await new Promise(resolve => setTimeout(resolve, 400));

    // Hide title screen DOM
    const titleScreen = document.getElementById('titleScreen');
    if (titleScreen) titleScreen.classList.add('hidden');

    // Load or Reset
    if (hasSaveData && titleMenuIndex === 0) {
        // Continue
        await loadGame();
    } else {
        // New Game
        localStorage.removeItem(SAVE_KEY);
        await resetGameState();
    }

    // Refresh HUD info
    const mapNameEl = document.getElementById('mapName');
    if (mapNameEl) mapNameEl.textContent = currentMap?.name || 'フィールド';

    // Start BGM
    if (BGM.getBgmTypeForMap) {
        BGM.play(BGM.getBgmTypeForMap(currentMap));
    }

    // Ensure camera and size are correct
    updateCamera();

    // Small delay before fade in
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fade in
    if (fadeOverlay) fadeOverlay.classList.remove('active');
    setIsTransitioning(false);
}

export async function resetGameState() {
    // 1. Reset Party (Hero only)
    party.length = 0;
    const hero = createPartyMember({
        id: 'hero',
        name: 'ゆうしゃ',
        job: 'hero',
        sprite: '🦸',
        hp: 50,
        maxHp: 50,
        mp: 20,
        maxMp: 20,
        baseAtk: 10,
        baseDef: 5,
        speed: 6,
        level: 1,
        exp: 0,
        spells: ['hoimi', 'mera'],
        equipment: {
            weapon: 10,  // こんぼう
            armor: 20    // たびびとのふく
        }
    });
    party.push(hero);
    // Note: player in state.js should point to party[0]. 
    // We already have Object.assign/reference logic in state.js usually.
    // Let's ensure the local reference is correct if we had one, but we use 'player' from state.js.
    setupPlayerProxy();

    // 2. Reset Party Data
    partyData.x = 3;
    partyData.y = 3;
    partyData.direction = 'down';
    partyData.moving = false;
    partyData.gold = 50;
    partyData.inventory = [{ id: 1, quantity: 3 }]; // Start with 3 herbs

    // 3. Reset progress
    resetGameProgress();
    updateActualStats();

    // 4. Set Initial Map
    setCurrentMapId('field');
    setCurrentMapPath('maps/field.json');

    // 5. Load the map
    setGameMode(MODE.FIELD);
    // Use force=true to bypass transition guard during initial game start
    await performWarp('field', 3, 3, true);
}

export function startNewGame() {
    // This is now effectively replaced by selectTitleMenuItem calling resetGameState.
    // For compatibility if called elsewhere:
    resetGameState();
}

export function createDebugSave() {
    console.log("Creating Debug Save Data...");

    // 1. Reset Game Progress & Flags
    // We want to be post-Area 4 (Ice Queen defeated), pre-Elder talk.
    gameProgress.bossDefeated.midBoss = true;
    gameProgress.bossDefeated.maou = true;
    gameProgress.bossDefeated.quicksandBoss = true;
    gameProgress.bossDefeated.banditKing = true;
    gameProgress.bossDefeated.pyramidGuardian = true;
    gameProgress.bossDefeated.desertGuardian = true;
    gameProgress.bossDefeated.shadowGuardian = true;
    gameProgress.bossDefeated.wedgeGuardian_north = true;
    gameProgress.bossDefeated.wedgeGuardian_east = true;
    gameProgress.bossDefeated.wedgeGuardian_south = true;
    gameProgress.bossDefeated.wedgeGuardian_west = true;
    gameProgress.bossDefeated.libraryGuardian = true;
    gameProgress.bossDefeated.iceGolem = true;
    gameProgress.bossDefeated.iceQueen = true;
    // frostWyrm is often optional or post, but let's assume defeated for "cleared" feel or leave false if strict.
    // User said "Area 4 cleared". Usually Ice Queen is the main boss.
    gameProgress.bossDefeated.frostWyrm = true;

    // Story Flags
    gameProgress.storyFlags.reportedMidBossDefeat = true;
    gameProgress.storyFlags.portalRoomUnlocked = true;
    gameProgress.storyFlags.bazaarUnlocked = true;
    gameProgress.storyFlags.desertPortalUnlocked = true;
    gameProgress.storyFlags.desertCastleUnlocked = true;
    gameProgress.storyFlags.mageJoined = true;
    gameProgress.storyFlags.serenJoined = true;
    gameProgress.storyFlags.ancientCastleUnlocked = true;
    gameProgress.storyFlags.area3Entered = true;
    gameProgress.storyFlags.area3SealActivated = true;
    gameProgress.storyFlags.shadowGuardianDefeated = true;
    gameProgress.storyFlags.area3Completed = true;
    gameProgress.storyFlags.ancientSpellReceived = true;
    gameProgress.storyFlags.northPathOpened = true;
    gameProgress.storyFlags.area4Entered = true;
    gameProgress.storyFlags.iceGolemDefeated = true;
    gameProgress.storyFlags.frozenLakeCleared = true;
    gameProgress.storyFlags.torchPuzzleCleared = true;
    gameProgress.storyFlags.memoryPuzzleCleared = true;
    gameProgress.storyFlags.sunFlameObtained = true;
    gameProgress.storyFlags.glacioJoined = true;
    gameProgress.storyFlags.iceQueenDefeated = true;
    // Not yet spoken to elder for Area 5 transition
    gameProgress.storyFlags.area4Completed = false;

    // 2. Setup Party
    party.length = 0; // Clear existing

    // Helper to create member
    const createMember = (id, name, job, sprite, lv, hp, mp, atk, def, spd, spellsList, equip) => ({
        id, name, job, sprite,
        level: lv, exp: expTable[lv],
        hp, maxHp: hp, mp, maxMp: mp,
        baseAtk: atk, baseDef: def, speed: spd,
        spells: spellsList,
        equipment: equip,
        actualAtk: atk + 50, // simplified calc
        actualDef: def + 40,
        status: { sleep: 0, poison: 0, blind: 0 },
        isAlive: true
    });

    // Hero Lv 40
    party.push(createMember('hero', 'ゆうしゃ', 'hero', '🦸', 40, 280, 120, 140, 100, 90,
        ['hoimi', 'mera', 'behoimi', 'gira', 'rukani', 'raiden', 'behomazun'],
        { weapon: 71, armor: 81 })); // Blizzard Sword, Blizzard Mail

    // Mage Lv 38
    party.push(createMember('mage', '魔法使い', 'mage', '🧙', 38, 200, 220, 80, 70, 85,
        ['mera', 'hyado', 'gira', 'manusa', 'mahoton', 'begirama', 'hyados', 'merami', 'baikiruto'],
        { weapon: 73, armor: 83 })); // Diamond Rod, Crystal Robe

    // Seren Lv 36
    party.push(createMember('seren', 'セレン', 'seer', '🔮', 36, 180, 180, 70, 65, 110,
        ['bagi', 'rukani', 'piorimu', 'hoimi', 'bagima', 'rariho'],
        { weapon: 73, armor: 82 })); // Diamond Rod, Snow Robe

    // Glacio Lv 40
    party.push(createMember('glacio', 'グラシオ', 'iceKnight', '⚔️', 40, 320, 60, 160, 140, 70,
        ['iceSlash', 'frostArmor'],
        { weapon: 130, armor: 201 })); // Trident, Dragon Scale Armor (Area 5 item? Maybe simplify to Area 4 gear: 74, 81)

    // Fix Glacio gear to Area 4 high end
    party[3].equipment = { weapon: 74, armor: 81 }; // Ice Halberd, Blizzard Mail


    // 3. Set Location & Party Data
    const startX = 10;
    const startY = 6;
    const startDir = 'up';
    const startMapId = 'snow_village';
    const startMapPath = 'maps/snow_village.json';

    setCurrentMapId(startMapId);
    setCurrentMapPath(startMapPath);
    player.x = startX;
    player.y = startY;
    player.direction = startDir;
    partyData.x = startX;
    partyData.y = startY;
    partyData.vehicle = 'none';
    partyData.gold = 10000;
    partyData.inventory = [
        { id: 1, quantity: 10 },
        { id: 4, quantity: 5 },
        { id: 9, quantity: 5 }
    ];

    // Construct save data explicitly to ensure correct format
    const saveData = {
        party: party,
        partyData: {
            x: startX,
            y: startY,
            direction: startDir,
            gold: partyData.gold,
            inventory: partyData.inventory,
            vehicle: partyData.vehicle,
            oxygen: 100,
            totalSteps: 0
        },
        currentMapId: startMapId,
        currentMapPath: startMapPath,
        gameProgress: gameProgress
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    alert("デバッグセーブデータを作成しました。\n雪原の村の村長前から開始します。");
    location.reload();
}

/**
 * Check if save data exists in localStorage
 */
export function checkSaveData() {
    const savedData = localStorage.getItem(SAVE_KEY);
    const exists = savedData !== null;
    setHasSaveData(exists);
    return exists;
}

/**
 * Update the visual selection state of title menu items
 */
export function updateTitleMenuSelection() {
    const titleMenu = document.querySelector('.title-menu');
    if (!titleMenu) return;

    const items = titleMenu.querySelectorAll('.menu-item');
    items.forEach((item, index) => {
        if (item.style.display !== 'none') {
            // Logic to determine if this item corresponds to the current titleMenuIndex
            // If hasSaveData is false, the first visible item (New Game) is at index 1, but should match titleMenuIndex 0
            const actualIndex = hasSaveData ? index : index - 1;
            item.classList.toggle('selected', actualIndex === titleMenuIndex);
        }
    });
}

/**
 * Initialize Title Screen
 */
export function initTitleScreen() {
    checkSaveData();

    const menuContinue = document.getElementById('menu-continue');
    const menuNewGame = document.getElementById('menu-newgame');
    const pressStart = document.getElementById('pressStart');
    const titleScreen = document.getElementById('titleScreen');
    const titleMenu = document.querySelector('.title-menu');

    // Show/Hide "Continue"
    if (menuContinue) {
        menuContinue.style.display = (hasSaveData) ? 'flex' : 'none';

        // Add Listener (if not already added via some global logic, but here for restoration)
        // We use onclick to avoid multiple bindings if initTitleScreen is called multiple times
        menuContinue.onclick = (e) => {
            e.stopPropagation();
            initAudio();
            if (gameMode === MODE.TITLE) {
                setTitleMenuIndex(0);
                updateTitleMenuSelection();
                selectTitleMenuItem();
            }
        };
    }

    if (menuNewGame) {
        menuNewGame.style.display = 'flex';
        menuNewGame.onclick = (e) => {
            e.stopPropagation();
            initAudio();
            if (gameMode === MODE.TITLE) {
                setTitleMenuIndex(hasSaveData ? 1 : 0);
                updateTitleMenuSelection();
                selectTitleMenuItem();
            }
        };
    }

    if (titleScreen) {
        titleScreen.onclick = (e) => {
            initAudio();
            if (gameMode === MODE.TITLE && !titleMenuActive) {
                // Activate Menu (Remove "Press Start")
                setTitleMenuActive(true);
                if (pressStart) pressStart.style.display = 'none';
                if (titleMenu) titleMenu.classList.add('active');
                updateTitleMenuSelection();
                // Play title BGM
                BGM.play('title');
            }
        };
    }

    // Reset Menu State
    setTitleMenuIndex(0);
    setTitleMenuActive(false);

    if (pressStart) pressStart.style.display = 'block';
    if (titleMenu) titleMenu.classList.remove('active');

    updateTitleMenuSelection();
}
