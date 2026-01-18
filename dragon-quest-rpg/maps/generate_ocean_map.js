const fs = require('fs');

const cols = 200;
const rows = 200;
const data = new Array(cols * rows).fill(5); // 5 = SEA

function drawIsland(cx, cy, w, h) {
    for (let y = cy; y < cy + h; y++) {
        for (let x = cx; x < cx + w; x++) {
            if (y >= 0 && y < rows && x >= 0 && x < cols) {
                data[y * cols + x] = 1; // Grass
            }
        }
    }
}

// 1. Portia Island (Center)
drawIsland(98, 103, 5, 5);
data[107 * cols + 100] = 30; // Port tile at South Edge (100, 107)

// 2. Coral Island (North West)
drawIsland(43, 28, 6, 6);
data[33 * cols + 45] = 30; // Port at South Edge (45, 33)

// Add Currents around Coral Island to make it a puzzle
for (let x = 40; x < 52; x++) {
    data[35 * cols + x] = 34; // CURRENT_DOWN: push south, away from island
}
for (let y = 25; y < 35; y++) {
    data[y * cols + 40] = 35; // CURRENT_LEFT: push west
    data[y * cols + 52] = 36; // CURRENT_RIGHT: push east
}

// 3. Prison Isle (South East)
drawIsland(158, 165, 6, 6);
data[170 * cols + 160] = 30; // Port at South Edge (160, 170)

// 4. Gigant Island (West)
drawIsland(10, 95, 8, 8);
data[103 * cols + 14] = 30; // Port at (14, 103)

// 5. Atlantis (Center Whirlpool)
data[100 * cols + 100] = 14;

// 6. Sea God's Altar (North of Portia)
drawIsland(97, 75, 7, 7);
data[82 * cols + 100] = 30; // Port at (100, 82)

const map = {
    mapId: "area5_ocean",
    name: "広大なる外海",
    cols: cols,
    rows: rows,
    tileSize: 32,
    isLooping: true,
    defaultTile: 5,
    data: data,
    npcs: [],
    chests: [],
    warps: [
        // Landing at Portia
        {
            x: 100, y: 107,
            targetMap: "maps/town_portia.json",
            targetX: 15, targetY: 1,
            type: "landing"
        },
        // Landing at Coral Village
        {
            x: 45, y: 33,
            targetMap: "maps/coral_village.json",
            targetX: 10, targetY: 18,
            type: "landing"
        },
        // Landing at Prison Isle
        {
            x: 160, y: 170,
            targetMap: "maps/prison_isle.json",
            targetX: 15, targetY: 28,
            type: "landing"
        },
        // Landing at Gigant
        {
            x: 14, y: 103,
            targetMap: "maps/gigant_interior.json",
            targetX: 12, targetY: 23,
            type: "landing"
        },
        // Entering Atlantis (Whirlpool)
        {
            x: 100, y: 100,
            targetMap: "maps/atlantis_ruins.json",
            targetX: 20, targetY: 37,
            type: "landing",
            requiresFlag: "allTearsObtained" // Special logic in engine for this
        },
        // Landing at Sea God's Altar
        {
            x: 100, y: 82,
            targetMap: "maps/sea_god_altar.json",
            targetX: 7, targetY: 13,
            type: "landing"
        }
    ],
    encounterTable: "area5_ocean",
    encounterRate: 0.05,
    bgm: "field"
};

fs.writeFileSync('maps/area5_ocean.json', JSON.stringify(map));
console.log('Regenerated maps/area5_ocean.json with Gigant and Atlantis');
