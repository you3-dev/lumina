import {
    party, partyData, currentMap, currentMapId, currentMapPath, maps,
    setGameMode, isTransitioning, setIsTransitioning,
    mapLoadState, SAVE_KEY, tileSize, canvasWidth, canvasHeight,
    player, setCurrentMap, setCurrentMapId, setCurrentMapPath,
    setCameraX, setCameraY, stepsSinceLastBattle, setStepsSinceLastBattle,
    pushedIceBlocks, dialog, titleMenuIndex, setTitleMenuIndex,
    hasSaveData, setHasSaveData, gameProgress, hasItem, addItem, getStoryFlag,
    inn, church, shop
} from './state.js';
import { MODE, WALKABLE_TILES, TILE } from './constants.js';
import { expTable, spells, items } from './data.js';
import { startBattle } from './battle.js';
import { SE, BGM } from './sound.js';

export function getReviveCost(member) {
    return member.level * 20;
}

export function getCureCost() {
    return 10;
}

export function getAlivePartyMembers() {
    return party.filter(m => m.hp > 0);
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

export async function performWarp(targetMap, targetX, targetY) {
    if (isTransitioning) return;

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

export function openChurch() {
    church.active = true;
    church.phase = 'menu';
    setGameMode(MODE.CHURCH);
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
    if (chest && !chest.isOpened) {
        chest.isOpened = true;
        startDialog([`${chest.itemName}をみつけた！`]);
        addItem(chest.itemId);
        // Special quest item flags
        if (chest.itemId === 124) {
            gameProgress.storyFlags.tearOfGreenObtained = true;
        }
        SE.chest();
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
        player: {
            level: player.level,
            exp: player.exp,
            hp: player.hp,
            maxHp: player.maxHp,
            mp: player.mp,
            maxMp: player.maxMp,
            spells: player.spells,
            equipment: player.equipment
        },
        partyData: {
            x: player.x,
            y: player.y,
            gold: partyData.gold,
            inventory: partyData.inventory,
            vehicle: partyData.vehicle,
            oxygen: partyData.oxygen,
            totalSteps: partyData.totalSteps
        },
        currentMapId,
        gameProgress
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

export function loadGame() {
    const json = localStorage.getItem(SAVE_KEY);
    if (!json) return false;
    try {
        const data = JSON.parse(json);

        // Restore Player
        Object.assign(player, data.player);

        // Restore Party Data
        Object.assign(partyData, data.partyData);
        // Ensure default values if old save
        if (!partyData.vehicle) partyData.vehicle = 'none';
        if (typeof partyData.oxygen === 'undefined') partyData.oxygen = 100;
        if (typeof partyData.totalSteps === 'undefined') partyData.totalSteps = 0;

        // Restore Map Info
        setCurrentMapId(data.currentMapId || 'field');

        // Restore Progress
        if (data.gameProgress) {
            Object.assign(gameProgress, data.gameProgress);
        }

        // Fix player position assignment
        if (data.partyData) {
            player.x = data.partyData.x;
            player.y = data.partyData.y;
        }

        setHasSaveData(true);
        setGameMode(MODE.FIELD);

        // We need to load the map data properly. 
        // performWarp handles loading, but loadGame is synchronous (mostly).
        // For now, we rely on the caller to start the game loop or scene.
        // In selectTitleMenuItem, we call loadGame() then startNewGame-like logic?
        // Actually selectTitleMenuItem calls loadGame(), if true, we need to transition.
        // Let's call performWarp to load map and place player.

        performWarp(currentMapId, player.x, player.y);

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

export function updateTitleMenuSelection() {
    const items = document.querySelectorAll('.title-menu .menu-item');
    items.forEach((item, i) => {
        item.classList.toggle('selected', i === titleMenuIndex);
    });
}

export function selectTitleMenuItem() {
    if (titleMenuIndex === 0 && hasSaveData) {
        loadGame();
    } else {
        startNewGame();
    }
}

export function startNewGame() {
    const titleScreen = document.getElementById('titleScreen');
    if (titleScreen) titleScreen.classList.add('hidden');
    setGameMode(MODE.FIELD);
    performWarp('field', 3, 3); // initial pos
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

    // 3. Set Location (Snow Village, in front of Elder)
    setCurrentMapId('snow_village');
    setCurrentMapPath('maps/snow_village.json');
    player.x = 10;
    player.y = 6;
    player.direction = 'up';
    partyData.x = 10;
    partyData.y = 6;
    partyData.vehicle = 'none';

    // 4. Save and Reload
    saveGame();
    alert("デバッグセーブデータを作成しました。\n雪原の村の村長前から開始します。");
    location.reload();
}
