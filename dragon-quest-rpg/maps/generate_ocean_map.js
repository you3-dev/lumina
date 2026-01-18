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
// Range: y=103..107 (height 5)
drawIsland(98, 103, 5, 5);
data[107 * cols + 100] = 30; // Port tile at South Edge (100, 107)

// 2. Coral Island (North West)
// Range: y=28..33 (height 6)
drawIsland(43, 28, 6, 6);
data[33 * cols + 45] = 30; // Port at South Edge (45, 33)

// 3. Prison Isle (South East)
// Range: y=165..170 (height 6)
drawIsland(158, 165, 6, 6);
data[170 * cols + 160] = 30; // Port at South Edge (160, 170)

// 4. Atlantis (Center)
data[100 * cols + 100] = 14;

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
        // Landing at Portia (at Port Tile)
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
            targetX: 20, targetY: 40,
            type: "landing"
        }
    ],
    encounterRate: 0.05,
    bgm: "field"
};

fs.writeFileSync('maps/area5_ocean.json', JSON.stringify(map));
console.log('Regenerated maps/area5_ocean.json');
