const fs = require('fs');

const cols = 30;
const rows = 30;
const data = new Array(cols * rows).fill(6); // Floor default

// Draw Layout
for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
        const idx = y * cols + x;

        // Borders
        if (x === 0 || x === cols - 1 || y === 29) {
            data[idx] = 7; // Wall
        }
        // Sea at top
        if (y < 5) {
            data[idx] = 2; // Sea
        }
    }
}

// Pier at top center
for (let y = 0; y < 6; y++) {
    data[y * cols + 15] = 30; // Port tile
}

// Buildings
function drawRect(tx, ty, w, h, tile) {
    for (let iy = ty; iy < ty + h; iy++) {
        for (let ix = tx; ix < tx + w; ix++) {
            if (iy >= 0 && iy < rows && ix >= 0 && ix < cols) {
                data[iy * cols + ix] = tile;
            }
        }
    }
}

// Inn (Left)
drawRect(4, 10, 6, 5, 7); // Wall
drawRect(5, 14, 1, 1, 6); // Door

// Shop (Right)
drawRect(20, 10, 6, 5, 7);
drawRect(21, 14, 1, 1, 6);

// Mayor's House (Center back)
drawRect(12, 12, 6, 6, 7);
drawRect(15, 17, 1, 1, 6); // Door

const map = {
    mapId: "town_portia",
    name: "港町ポルティア",
    cols: cols,
    rows: rows,
    tileSize: 32,
    isOutdoor: true,
    data: data,
    warps: [
        // Embark to Ocean
        { x: 15, y: 0, targetMap: "maps/area5_ocean.json", targetX: 100, targetY: 106, type: "embark" },
        // Return to Portal Room (South)
        { x: 15, y: 29, targetMap: "maps/portal_room.json", targetX: 7, targetY: 5 }
    ],
    npcs: [
        {
            id: "portia_mayor",
            x: 15,
            y: 15,
            sprite: "👴",
            type: "mayor",
            messages: ["おお、旅の方か。", "ここは港町ポルティア。", "リヴァイアサン号は北の桟橋に係留しておる。"]
        },
        {
            id: "portia_sailor",
            x: 16,
            y: 5,
            sprite: "💂",
            type: "villager",
            messages: ["海へ出るなら、十分な準備をするんだな。"]
        }
    ],
    chests: []
};

fs.writeFileSync('maps/town_portia.json', JSON.stringify(map));
console.log('Created maps/town_portia.json');
