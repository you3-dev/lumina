/**
 * Game Constants
 */

export const VISIBLE_TILES = 10;
export const SAVE_KEY = 'dragonquest_rpg_save';

export const MODE = {
    TITLE: 'title',
    FIELD: 'field',
    BATTLE: 'battle',
    MENU: 'menu',
    INN: 'inn',
    SHOP: 'shop',
    DIALOG: 'dialog',
    ENDING: 'ending',
    MAP_VIEW: 'map_view'
};

export const TILE = {
    GRASS: 0,
    MOUNTAIN: 1,
    SEA: 2,
    CASTLE: 3,
    TOWN: 4,
    STAIRS: 5,
    FLOOR: 6,
    WALL: 7,
    PORTAL: 8,       // 旅の扉
    STAIRS_UP: 9,    // 上り階段
    STAIRS_DOWN: 10, // 下り階段
    SAND: 11,        // 砂漠
    OASIS: 12,       // オアシス
    PYRAMID: 13,     // ピラミッド入口
    QUICKSAND: 14,   // 流砂（ワープ用）
    HIDDEN_WALL: 15, // 隠し壁（調べると通路になる）
    HOLE: 16,             // 穴（地底へ落下）
    UNDERWORLD_FLOOR: 17, // 地底床
    UNDERWORLD_WALL: 18,  // 地底壁
    WEDGE_ALTAR: 19,      // 楔の祭壇
    UNDERWORLD_TOWN: 20,  // 地底の街（暗い背景）
    ICE_FLOOR: 21,        // 滑る氷床
    ICE_WALL: 22,         // 氷の壁（止まれる）
    ICE_HOLE: 23,         // 氷の穴（落ちると戻る）
    SNOW: 24,             // 雪原（通常歩行可能）
    ICE_CASTLE_FLOOR: 25, // 氷の城の床
    TORCH: 26,            // 燭台（灯火パズル用）
    ICE_ALTAR: 27,        // 氷の祭壇（記憶パズル用）
    ICE_SWITCH: 28,       // 圧力スイッチ
    ICE_BLOCK: 29         // 押せる氷ブロック
};

export const MAP_TILE_COLORS = {
    field: {
        [TILE.GRASS]: '#2d5a27',
        [TILE.MOUNTAIN]: '#6b4423',
        [TILE.SEA]: '#1a4a7a',
        [TILE.CASTLE]: '#2d5a27',
        [TILE.TOWN]: '#2d5a27',
        [TILE.STAIRS]: '#4a4a4a',
        [TILE.FLOOR]: '#8b7355',
        [TILE.WALL]: '#4a4a5a'
    },
    castle: {
        [TILE.FLOOR]: '#5a5a6a',
        [TILE.WALL]: '#3a3a4a',
        [TILE.STAIRS]: '#4a4a4a'
    },
    town: {
        [TILE.FLOOR]: '#a0a0a0',
        [TILE.WALL]: '#6a6a7a',
        [TILE.STAIRS]: '#4a4a4a'
    },
    dungeon: {
        [TILE.FLOOR]: '#4a4a3a',
        [TILE.WALL]: '#2a2a2a',
        [TILE.STAIRS]: '#5a5a4a'
    }
};

export const DEFAULT_TILE_COLORS = {
    [TILE.GRASS]: '#2d5a27',
    [TILE.MOUNTAIN]: '#6b4423',
    [TILE.SEA]: '#1a4a7a',
    [TILE.CASTLE]: '#2d5a27',
    [TILE.TOWN]: '#2d5a27',
    [TILE.STAIRS]: '#4a4a4a',
    [TILE.FLOOR]: '#8b7355',
    [TILE.WALL]: '#4a4a5a',
    [TILE.PORTAL]: '#6a2a8a',      // 旅の扉（紫）
    [TILE.STAIRS_UP]: '#5a5a4a',   // 上り階段
    [TILE.STAIRS_DOWN]: '#4a4a3a', // 下り階段
    [TILE.SAND]: '#d4a559',        // 砂漠（黄土色）
    [TILE.OASIS]: '#2d8a57',       // オアシス（緑）
    [TILE.PYRAMID]: '#c4a040',     // ピラミッド（金色）
    [TILE.QUICKSAND]: '#b89050',   // 流砂（暗い砂色）
    [TILE.HIDDEN_WALL]: '#2a2a2a', // 隠し壁（壁と同じ色）
    [TILE.HOLE]: '#1a0a1a',
    [TILE.UNDERWORLD_FLOOR]: '#2a1a2a',
    [TILE.UNDERWORLD_WALL]: '#0a0a0a',
    [TILE.WEDGE_ALTAR]: '#8a6a3a',
    [TILE.UNDERWORLD_TOWN]: '#2a1a2a',
    [TILE.ICE_FLOOR]: '#a8d8ea',       // 氷床（薄い水色）
    [TILE.ICE_WALL]: '#5a8aa8',        // 氷壁（濃い水色）
    [TILE.ICE_HOLE]: '#1a3a5a',        // 氷の穴（暗い青）
    [TILE.SNOW]: '#e8f0f8',            // 雪原（白に近い色）
    [TILE.ICE_CASTLE_FLOOR]: '#c8e0f0', // 氷の城床（明るい水色）
    [TILE.TORCH]: '#c8e0f0',           // 燭台（床と同色）
    [TILE.ICE_ALTAR]: '#88b8d8',       // 氷の祭壇（中間の水色）
    [TILE.ICE_SWITCH]: '#7898b8',      // スイッチ（やや暗い水色）
    [TILE.ICE_BLOCK]: '#6888a8'        // 氷ブロック（暗めの水色）
};

export const WALKABLE_TILES = [
    TILE.GRASS, TILE.CASTLE, TILE.TOWN, TILE.STAIRS, TILE.FLOOR, 
    TILE.PORTAL, TILE.STAIRS_UP, TILE.STAIRS_DOWN, TILE.SAND, 
    TILE.OASIS, TILE.PYRAMID, TILE.QUICKSAND, TILE.UNDERWORLD_FLOOR, 
    TILE.WEDGE_ALTAR, TILE.UNDERWORLD_TOWN, TILE.ICE_FLOOR, TILE.SNOW, 
    TILE.ICE_CASTLE_FLOOR, TILE.TORCH, TILE.ICE_ALTAR, TILE.ICE_SWITCH, TILE.ICE_HOLE
];

export const ENCOUNTER_TILES = [
    TILE.GRASS, TILE.FLOOR, TILE.SAND, TILE.UNDERWORLD_FLOOR, 
    TILE.ICE_FLOOR, TILE.SNOW, TILE.ICE_CASTLE_FLOOR
];

export const MAX_STACK_SIZE = 99;
export const ELEMENTS = ['fire', 'ice', 'lightning', 'wind', 'light'];
