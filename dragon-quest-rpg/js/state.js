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
    inventory: []
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
        iceQueen: false
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
        auroraOrbObtained: false
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
    typingSpeed: 50
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
    phase: 'start', // start, command, target, message, result, end
    commandIndex: 0,
    spellIndex: 0,
    showSpells: false,
    itemIndex: 0,
    showItems: false,
    turn: 0, // 0: player, 1: enemy
    partyIndex: 0,
    messages: []
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

export function getStoryFlag(flag) { return gameProgress.storyFlags[flag]; }
export function isBossDefeated(boss) { return gameProgress.bossDefeated[boss]; }

setupPlayerProxy();
