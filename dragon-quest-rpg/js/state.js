/**
 * Game State Management
 */
import { items, spells } from './data.js';
import { MODE, MAX_STACK_SIZE, TILE } from './constants.js';

export let gameMode = MODE.TITLE;
export let titleMenuIndex = 0;
export let titleMenuActive = false;
export let hasSaveData = false;
export let debugToggleCount = 0;
export let soundToggleListenerAdded = false;

export let canvasWidth = 800;
export let canvasHeight = 600;
export let tileSize = 32;
export let cameraX = 0;
export let cameraY = 0;

export const maps = {}; // Map Cache
export let currentMapId = 'field';
export let currentMapPath = 'maps/field.json';
export let currentMap = null;
export let isTransitioning = false;
export const mapLoadState = { loading: false };

// エンカウントシステム
export let stepsSinceLastBattle = 0;
export const SAFE_STEPS = 5;
export const ENCOUNTER_RATE_PER_STEP = 0.02;
export const MAX_ENCOUNTER_RATE = 0.95;

// パーティ配列（最大4人）
export const MAX_PARTY_SIZE = 4;
export const party = [];

// 勇者（初期メンバー）
party.push({
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
        weapon: 10,
        armor: 20
    },
    actualAtk: 10,
    actualDef: 5,
    status: {
        sleep: 0,
        poison: 0,
        blind: 0
    },
    isAlive: true
});

export let player = party[0];

export const partyData = {
    x: 3,
    y: 3,
    direction: 'down',
    moving: false,
    moveDelay: 120,
    gold: 0,
    inventory: [],
    vehicle: 'none', // none, ship
    oxygen: 100,
    totalSteps: 0
};

// 互換性維持のためのプロキシ設定
export function setupPlayerProxy() {
    Object.defineProperties(player, {
        x: {
            get: () => partyData.x,
            set: (v) => { partyData.x = v; },
            configurable: true
        },
        y: {
            get: () => partyData.y,
            set: (v) => { partyData.y = v; },
            configurable: true
        },
        direction: {
            get: () => partyData.direction,
            set: (v) => { partyData.direction = v; },
            configurable: true
        },
        inventory: {
            get: () => partyData.inventory,
            configurable: true
        },
        gold: {
            get: () => partyData.gold,
            set: (v) => { partyData.gold = v; },
            configurable: true
        }
    });
}

/**
 * Game Progress
 */
export const gameProgress = {
    bossDefeated: {
        midBoss: false,
        maou: false,
        quicksandBoss: false,
        banditKing: false,
        pyramidGuardian: false,
        desertGuardian: false,
        shadowGuardian: false,
        wedgeGuardian_north: false,
        wedgeGuardian_east: false,
        wedgeGuardian_south: false,
        wedgeGuardian_west: false,
        libraryGuardian: false,
        iceGolem: false,
        iceQueen: false,
        siren: false,
        kraken: false,
        leviathan: false,
        albida: false
    },
    storyFlags: {
        reportedMidBossDefeat: false,
        portalRoomUnlocked: false,
        bazaarUnlocked: false,
        desertPortalUnlocked: false,
        desertCastleUnlocked: false,
        mageJoined: false,
        serenJoined: false,
        ancientCastleUnlocked: false,
        area3Entered: false,
        area3SealActivated: false,
        shadowGuardianDefeated: false,
        area3Completed: false,
        ancientSpellReceived: false,
        northPathOpened: false,
        area4Entered: false,
        iceGolemDefeated: false,
        frozenLakeCleared: false,
        torchPuzzleCleared: false,
        memoryPuzzleCleared: false,
        sunFlameObtained: false,
        glacioJoined: false,
        iceQueenDefeated: false,
        frostWyrmDefeated: false,
        area4Completed: false,
        auroraOrbObtained: false,
        tearOfBlueObtained: false,
        tearOfRedObtained: false,
        tearOfGreenObtained: false,
        atlantisBarrierCleared: false,
        allTearsObtained: false,
        area5Completed: false
    },
    quests: {
        waterShortage: { started: false, bossDefeated: false, itemObtained: false, completed: false },
        passportRecovery: { started: false, bossDefeated: false, completed: false },
        royalCrest: { started: false, bossDefeated: false, itemObtained: false, completed: false },
        serenJoin: { stage1_met: false, stage2_helped: false, stage3_completed: false, joined: false },
        glacioJoin: { met: false, iceGolemDefeated: false, joined: false },
        wedges: { wedge_north: false, wedge_east: false, wedge_south: false, wedge_west: false, allCollected: false }
    },
    areas: {},
    openedPassages: {},
    visitedLocations: [],
    lastEntrance: null
};

/**
 * Helper Functions
 */
export function isStackable(itemId) {
    const item = items[itemId];
    if (!item) return false;
    return item.type !== 'weapon' && item.type !== 'armor';
}

export function addItem(itemId, quantity = 1) {
    const item = items[itemId];
    if (!item) return false;

    if (item.type === 'gold') {
        partyData.gold += item.value;
        return true;
    }

    if (isStackable(itemId)) {
        const existing = partyData.inventory.find(slot => slot.id === itemId);
        if (existing) {
            existing.quantity = Math.min(existing.quantity + quantity, MAX_STACK_SIZE);
        } else {
            partyData.inventory.push({ id: itemId, quantity: quantity });
        }
    } else {
        for (let i = 0; i < quantity; i++) {
            partyData.inventory.push({ id: itemId, quantity: 1 });
        }
    }
    return true;
}

export function removeItem(itemId, quantity = 1) {
    const index = partyData.inventory.findIndex(slot => slot.id === itemId);
    if (index === -1) return false;

    const slot = partyData.inventory[index];
    slot.quantity -= quantity;

    if (slot.quantity <= 0) {
        partyData.inventory.splice(index, 1);
    }
    return true;
}

export function getItemCount(itemId) {
    const slot = partyData.inventory.find(slot => slot.id === itemId);
    return slot ? slot.quantity : 0;
}

export function hasItem(itemId, quantity = 1) {
    return getItemCount(itemId) >= quantity;
}

// Experience Table
export const MAX_LEVEL = 99;
export const expTable = [];
let totalExp = 0;
for (let i = 0; i <= MAX_LEVEL; i++) {
    expTable[i] = totalExp;
    totalExp += Math.floor(10 * Math.pow(1.15, i));
}

export function setGameMode(mode) { gameMode = mode; }
export function setTitleMenuIndex(index) { titleMenuIndex = index; }
export function setTitleMenuActive(active) { titleMenuActive = active; }
export function setHasSaveData(has) { hasSaveData = has; }

export function createPartyMember(config) {
    return {
        id: config.id || 'hero',
        name: config.name || 'ゆうしゃ',
        job: config.job || 'hero',
        sprite: config.sprite || '🧙',
        hp: config.hp || 50,
        maxHp: config.maxHp || 50,
        mp: config.mp || 20,
        maxMp: config.maxMp || 20,
        baseAtk: config.baseAtk || 10,
        baseDef: config.baseDef || 5,
        speed: config.speed || 6,
        level: config.level || 1,
        exp: config.exp || 0,
        spells: config.spells || [],
        equipment: config.equipment || { weapon: null, armor: null },
        actualAtk: config.baseAtk || 10,
        actualDef: config.baseDef || 5,
        status: { sleep: 0, poison: 0, blind: 0 },
        isAlive: true
    };
}

export function updateMemberActualStats(member) {
    const weapon = items[member.equipment?.weapon];
    const armor = items[member.equipment?.armor];
    member.actualAtk = member.baseAtk + (weapon ? weapon.value : 0);
    member.actualDef = member.baseDef + (armor ? armor.value : 0);
}

export function updateActualStats(member = null) {
    if (member) {
        updateMemberActualStats(member);
    } else {
        party.forEach(m => updateMemberActualStats(m));
    }
}

export function resetGameProgress() {
    gameProgress.bossDefeated.midBoss = false;
    gameProgress.bossDefeated.maou = false;
    gameProgress.bossDefeated.quicksandBoss = false;
    gameProgress.bossDefeated.banditKing = false;
    gameProgress.bossDefeated.pyramidGuardian = false;
    gameProgress.bossDefeated.desertGuardian = false;
    gameProgress.bossDefeated.shadowGuardian = false;
    gameProgress.bossDefeated.wedgeGuardian_north = false;
    gameProgress.bossDefeated.wedgeGuardian_east = false;
    gameProgress.bossDefeated.wedgeGuardian_south = false;
    gameProgress.bossDefeated.wedgeGuardian_west = false;
    gameProgress.bossDefeated.libraryGuardian = false;
    gameProgress.storyFlags.reportedMidBossDefeat = false;
    gameProgress.storyFlags.portalRoomUnlocked = false;
    gameProgress.storyFlags.mageJoined = false;
    gameProgress.storyFlags.ancientCastleUnlocked = false;
    gameProgress.storyFlags.area3Entered = false;
    gameProgress.storyFlags.area3SealActivated = false;
    gameProgress.storyFlags.shadowGuardianDefeated = false;
    gameProgress.storyFlags.area3Completed = false;
    gameProgress.storyFlags.ancientSpellReceived = false;
    gameProgress.bossDefeated.iceGolem = false;
    gameProgress.bossDefeated.iceQueen = false;
    gameProgress.storyFlags.northPathOpened = false;
    gameProgress.storyFlags.area4Entered = false;
    gameProgress.storyFlags.iceGolemDefeated = false;
    gameProgress.storyFlags.frozenLakeCleared = false;
    gameProgress.storyFlags.torchPuzzleCleared = false;
    gameProgress.storyFlags.memoryPuzzleCleared = false;
    gameProgress.storyFlags.sunFlameObtained = false;
    gameProgress.storyFlags.glacioJoined = false;
    gameProgress.storyFlags.iceQueenDefeated = false;
    gameProgress.storyFlags.frostWyrmDefeated = false;
    gameProgress.storyFlags.area4Completed = false;
    gameProgress.storyFlags.auroraOrbObtained = false;
    Object.keys(gameProgress.quests).forEach(questName => {
        Object.keys(gameProgress.quests[questName]).forEach(flag => {
            gameProgress.quests[questName][flag] = false;
        });
    });
    gameProgress.areas = {};
    gameProgress.openedPassages = {};
    gameProgress.visitedLocations = [];
}



export const menu = {
    active: false,
    mode: 'status', // status, spells, items, map
    memberCursor: 0,
    spellCursor: 0,
    itemCursor: 0,
    targetMemberCursor: 0,
    selectingMember: false,
    selectingEquipMember: false,
    selectingItemMember: false,
    showItemAction: false,
    itemActionIndex: 0
};

export const dialog = {
    active: false,
    messages: [],
    currentIndex: 0,
    displayedText: '',
    charIndex: 0,
    isTyping: false,
    typingSpeed: 50,
    pendingBattleMonsterId: null,
    pendingAction: null
};

export const inn = {
    active: false,
    cost: 10,
    selectedIndex: 0
};

export const church = {
    active: false,
    phase: 'menu', // menu, selectMember, confirm
    menuIndex: 0,
    selectedMember: 0,
    cost: 0
};

export const shop = {
    active: false,
    phase: 'buy', // buy, sell, confirm
    menuIndex: 0,
    selectedItem: null,
    inventoryCursor: 0
};

export const battle = {
    active: false,
    enemies: [],
    selectedEnemyIndex: 0,
    currentEnemyIndex: 0,      // 敵ターン中の処理対象
    targetIndex: 0,            // プレイヤーのターゲット選択
    isSelectingTarget: false,  // ターゲット選択モード
    phase: 'start', // start, command, target, message, result, end
    commandIndex: 0,
    spellIndex: 0,
    showSpells: false,
    itemIndex: 0,
    itemCursor: 0,             // アイテムカーソル位置
    showItems: false,
    turn: 0, // 0: player, 1: enemy
    partyIndex: 0,
    currentPartyIndex: 0,      // 現在コマンド入力中のメンバー
    isSelectingAlly: false,    // 味方選択モード
    allyTargetIndex: 0,        // 味方ターゲット
    message: '',               // 現在のメッセージ（単数）
    messages: [],              // メッセージキュー
    messageQueue: [],          // メッセージキュー（別名）
    flashCount: 0,             // フラッシュアニメーション
    fadeAlpha: 0,              // フェードイン効果
    buffs: { attackUp: 0, defenseUp: 0, speedUp: 0 }  // バフ状態
};

export const switchStates = {};
export const pushedIceBlocks = {};

export function setCameraX(val) { cameraX = val; }
export function setCameraY(val) { cameraY = val; }
export function setTileSize(val) { tileSize = val; }
export function setCanvasWidth(val) { canvasWidth = val; }
export function setCanvasHeight(val) { canvasHeight = val; }
export function setCurrentMap(val) { currentMap = val; }
export function setCurrentMapId(val) { currentMapId = val; }
export function setIsTransitioning(val) { isTransitioning = val; }
export function setStepsSinceLastBattle(val) { stepsSinceLastBattle = val; }
export function setCurrentMapPath(val) { currentMapPath = val; }

export const spellFlash = { active: false, color: '', alpha: 0 };
export const screenShake = { active: false, intensity: 0, duration: 0 };
export const endingState = {
    active: false,
    phase: 'none', // none, start, staffroll, theend
    fadeAlpha: 0,
    messages: [],
    messageIndex: 0
};
export const partyJoinConfirm = {
    active: false,
    selectedIndex: 0,
    memberConfig: null
};
export const ruraSelection = {
    active: false,
    selectedIndex: 0,
    locations: []
};

// ルーラ用状態（メニュー操作用）
export const ruraState = {
    active: false,
    cursor: 0,
    casterIndex: 0
};

// 最後に訪れた町（キメラのつばさ用）
export const lastTown = {
    mapPath: 'maps/town.json',
    x: 9,
    y: 9,
    name: 'アルカディアの街'
};

export function getStoryFlag(flag) {
    if (flag === 'allTearsObtained') {
        return gameProgress.storyFlags.tearOfBlueObtained &&
            gameProgress.storyFlags.tearOfRedObtained &&
            gameProgress.storyFlags.tearOfGreenObtained;
    }
    return gameProgress.storyFlags[flag];
}
export function isBossDefeated(boss) { return gameProgress.bossDefeated[boss]; }

setupPlayerProxy();
