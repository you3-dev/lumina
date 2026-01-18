const fs = require('fs');

const mapData = {
    "mapId": "area5_ocean",
    "name": "広大なる外海",
    "cols": 200,
    "rows": 200,
    "tileSize": 32,
    "isLooping": true,
    "defaultTile": 5, // TILE.SEA
    "data": new Array(200 * 200).fill(5), // Fill with sea
    "npcs": [],
    "chests": [],
    "warps": [
        { "x": 100, "y": 105, "targetMap": "town_portia", "targetX": 15, "targetY": 29 }
    ],
    "encounterRate": 0.05,
    "bgm": "field"
};

// Add some islands for visual verification
function addIsland(x, y, w, h) {
    for (let r = y; r < y + h; r++) {
        for (let c = x; c < x + w; c++) {
            if (r >= 0 && r < 200 && c >= 0 && c < 200) {
                mapData.data[r * 200 + c] = 1; // TILE.GRASS
            }
        }
    }
}

addIsland(10, 10, 5, 5); // Northwest
addIsland(180, 180, 8, 8); // Southeast (Wrap check target)
addIsland(95, 95, 10, 10); // Center

fs.writeFileSync('area5_ocean.json', JSON.stringify(mapData));
console.log('Generated area5_ocean.json');
