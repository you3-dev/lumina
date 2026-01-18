const fs = require('fs');

// --- 1. Coral Village ---
const coralVillage = {
    mapId: "coral_village",
    name: "珊瑚の村",
    cols: 20,
    rows: 20,
    tileSize: 32,
    isOutdoor: true,
    data: new Array(400).fill(0), // Grass
    warps: [
        // Exit to Ocean (Embark)
        { x: 10, y: 19, targetMap: "maps/area5_ocean.json", targetX: 45, targetY: 34, type: "embark" },
        // Entrance to Maze
        { x: 10, y: 0, targetMap: "maps/coral_maze.json", targetX: 10, targetY: 29 }
    ],
    npcs: [
        { id: "coral_singer", x: 10, y: 10, sprite: "🧜‍♀️", type: "villager", messages: ["北の迷宮にはセイレーン様がいるわ。"] },
        { id: "coral_fish", x: 5, y: 15, sprite: "🐠", type: "villager", messages: ["ぷくぷく..."] }
    ],
    chests: []
};
// Add some water decoration
for (let i = 0; i < 400; i++) {
    if (i % 20 === 0 || i % 20 === 19 || Math.floor(i / 20) === 19) coralVillage.data[i] = 31; // Shallow
}
coralVillage.data[19 * 20 + 10] = 30; // Port

// --- 2. Coral Maze ---
const coralMaze = {
    mapId: "coral_maze",
    name: "珊瑚の迷宮",
    cols: 21,
    rows: 30,
    tileSize: 32,
    isOutdoor: false,
    type: "dungeon",
    data: new Array(21 * 30).fill(6), // Floor
    warps: [
        { x: 10, y: 29, targetMap: "maps/coral_village.json", targetX: 10, targetY: 1 }
    ],
    npcs: [
        {
            id: "siren_boss",
            x: 10, y: 5,
            sprite: "🧜‍♀️",
            type: "boss",
            bossId: "siren",
            messages: ["私の歌声を聴きに来たの...？", "なら、永遠に眠らせてあげる！"],
            isBoss: true
        }
    ],
    chests: [
        { id: "coral_chest1", x: 2, y: 2, itemId: 120, itemName: "人魚の鱗", isOpened: false }
    ]
};
// Simple walls
for (let i = 0; i < coralMaze.data.length; i++) {
    const x = i % 21;
    const y = Math.floor(i / 21);
    if (x === 0 || x === 20 || y === 0 || y === 29) coralMaze.data[i] = 7;
}

// --- 3. Prison Isle ---
const prisonIsle = {
    mapId: "prison_isle",
    name: "監獄島",
    cols: 30,
    rows: 30,
    tileSize: 32,
    isOutdoor: false, // Dark ambiance
    sealSpells: true,
    type: "dungeon",
    data: new Array(900).fill(7), // Wall default
    warps: [
        // Exit
        { x: 15, y: 29, targetMap: "maps/area5_ocean.json", targetX: 160, targetY: 171, type: "embark" }
    ],
    npcs: [
        {
            id: "kraken_boss",
            x: 15, y: 5,
            sprite: "🦑",
            type: "boss",
            bossId: "kraken",
            messages: ["グルルル...", "海を汚す者は許さん！"],
            isBoss: true
        }
    ],
    chests: []
};
// Carve rooms
function carveRect(map, x, y, w, h, tile) {
    for (let r = y; r < y + h; r++) {
        for (let c = x; c < x + w; c++) {
            map.data[r * map.cols + c] = tile;
        }
    }
}
carveRect(prisonIsle, 10, 10, 10, 20, 6); // Main Hall
carveRect(prisonIsle, 5, 5, 20, 5, 6); // Boss Room
prisonIsle.data[29 * 30 + 15] = 30; // Port exit

// --- 4. Atlantis Ruins ---
const atlantis = {
    mapId: "atlantis_ruins",
    name: "海底都市アトランティア",
    cols: 40,
    rows: 40,
    tileSize: 32,
    isOutdoor: false,
    isUnderwater: true, // Special flag for effect
    type: "dungeon",
    data: new Array(1600).fill(17), // Underworld Floor style
    warps: [
        // Exit to Ocean (Surface)
        { x: 20, y: 38, targetMap: "maps/area5_ocean.json", targetX: 100, targetY: 102, type: "warp" }
    ],
    npcs: [
        {
            id: "leviathan_boss",
            x: 20, y: 5,
            sprite: "🐉",
            type: "boss",
            bossId: "leviathan",
            messages: ["我はリヴァイアサン...", "真の勇者か、試させてもらおう。"],
            isBoss: true
        }
    ],
    chests: []
};

// Add some bubble tiles in Atlantis
for (let i = 0; i < 5; i++) {
    const rx = 10 + Math.floor(Math.random() * 20);
    const ry = 10 + Math.floor(Math.random() * 20);
    atlantis.data[ry * 40 + rx] = 32; // TILE.BUBBLE
}

// Write Files
fs.writeFileSync('maps/coral_village.json', JSON.stringify(coralVillage));
fs.writeFileSync('maps/coral_maze.json', JSON.stringify(coralMaze));
fs.writeFileSync('maps/prison_isle.json', JSON.stringify(prisonIsle));
fs.writeFileSync('maps/atlantis_ruins.json', JSON.stringify(atlantis));

console.log('Generated sub-area maps.');
