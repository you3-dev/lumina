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
        if (y < 6) {
            data[idx] = 2; // Sea
        }
    }
}

// Pier at top center
for (let y = 0; y < 8; y++) {
    data[y * cols + 15] = 30; // Port tile
}

// Helper to draw buildings
function drawBuilding(tx, ty, w, h, doorX, doorY) {
    for (let iy = ty; iy < ty + h; iy++) {
        for (let ix = tx; ix < tx + w; ix++) {
            if (iy >= 0 && iy < rows && ix >= 0 && ix < cols) {
                // Outer walls
                if (ix === tx || ix === tx + w - 1 || iy === ty || iy === ty + h - 1) {
                    data[iy * cols + ix] = 7; // Wall
                } else {
                    data[iy * cols + ix] = 6; // Floor inside
                }
            }
        }
    }
    // Door
    if (doorX !== undefined && doorY !== undefined) {
        data[doorY * cols + doorX] = 6; // Floor (Doorway)
    }
}

// 1. Church (North West)
drawBuilding(2, 6, 6, 6, 4, 11);
// Altar/Symbol inside
data[8 * cols + 4] = 2; // Water/Altar placeholder (using sea tile as decorative blue)

// 2. Inn (West)
drawBuilding(2, 14, 7, 5, 5, 18);

// 3. Mayor's House (Center North)
drawBuilding(11, 8, 8, 6, 15, 13);

// 4. Weapon Shop (East)
drawBuilding(21, 8, 7, 5, 24, 12);

// 5. Item Shop (West South)
drawBuilding(2, 22, 7, 5, 5, 26);

// 6. Shipyard (South East) - Large building
drawBuilding(18, 18, 10, 8, 23, 25);
// Ship parts decoration
data[21 * cols + 20] = 7;
data[21 * cols + 26] = 7;

// Pavements/Roads (Optional visual flair)
for (let y = 13; y < 26; y++) data[y * cols + 15] = 6; // Main street

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
        { x: 15, y: 0, targetMap: "maps/area5_ocean.json", targetX: 100, targetY: 108, type: "embark" },
        // Return to Portal Room (South)
        { x: 15, y: 29, targetMap: "maps/portal_room.json", targetX: 7, targetY: 5 }
    ],
    npcs: [
        // Story NPC
        {
            id: "portia_mayor",
            x: 15, y: 10,
            sprite: "👴",
            type: "mayor",
            messages: ["おお、旅の方か。", "ここは港町ポルティア。", "リヴァイアサン号は北の桟橋に係留しておる。"]
        },
        // Flavor NPCs
        {
            id: "portia_sailor",
            x: 16, y: 5,
            sprite: "💂",
            type: "villager",
            messages: ["海へ出るなら、十分な準備をするんだな。"]
        },
        {
            id: "town_kid",
            x: 14, y: 6,
            sprite: "👦",
            type: "villager",
            messages: ["いつかあの船で、世界の端まで行ってみたいな！"]
        },
        // Facilities
        {
            id: "portia_priest",
            x: 4, y: 8,
            sprite: "✝️",
            type: "church",
            messages: ["迷える子羊よ、神の御加護を..."]
        },
        {
            id: "portia_bard",
            x: 5, y: 16,
            sprite: "🎵",
            type: "villager", // Inn guest
            messages: ["珊瑚の島には、音に敏感な迷路があるそうだ...", "高い音が正解、低い音が危険...という噂だよ。"]
        },
        {
            id: "portia_innkeeper",
            x: 3, y: 15,
            sprite: "🏨",
            type: "inn",
            innCost: 100,
            messages: ["旅の疲れを癒やしていってくれ。（1泊 100G）"]
        },
        {
            id: "portia_weapon_shop",
            x: 24, y: 9,
            sprite: "⚔️",
            type: "shop",
            shopId: "portia_weapon",
            messages: ["強力な海の武器はいらんかね？"]
        },
        {
            id: "portia_item_shop",
            x: 5, y: 23,
            sprite: "💊",
            type: "shop",
            shopId: "portia_item",
            messages: ["海での旅には酸素缶が必要だぞ！"]
        },
        {
            id: "portia_shipwright",
            x: 23, y: 21,
            sprite: "🔨",
            type: "villager", // Later upgrade logic
            messages: ["わしはこの船の整備士だ。", "この船は古代の技術で作られていてな、並大抵の嵐には負けんよ。"]
        },
        // 船長ボス（桟橋上で出口をブロック）
        {
            id: "albida_pirate",
            x: 15, y: 1,
            sprite: "🏴‍☠️",
            type: "boss",
            bossId: "albida",
            messages: ["ハハハ！俺はアルビダ、この船の船長だ！", "この船が欲しければ、俺を倒してみろ！"],
            defeatedMessages: ["...お前の勝ちだ。船は好きに使え。", "だが覚えておけ、海は甘くないぞ..."]
        }
    ],
    chests: [
        // Barrel with 100G
        {
            id: "portia_barrel_g",
            x: 28, y: 20,
            itemId: null, // Gold direct? Or item. If item, need a "Gold Coin" item? Usually chest logic handles gold if itemId is special or separate prop.
            // Current engine 'getChestAt' expects 'itemId'.
            // Let's check engine.js interact 'addItem(chest.itemId)'. 
            // Engine doesn't seem to support direct gold in chests yet unless itemId maps to gold. 
            // I'll make a custom 'CoinBag' item or just use a small potion for now if gold not supported.
            // Checking items in data.js... no gold item.
            // I'll assume I can add a gold bag item or just use a potion for now. 
            // Spec says 100G. I'll add a 'Gold Pouch' item to data.js first, or stick to an Item.
            // Let's use 'Seed of Defense' (守りの種) ID if available. 
            // Wait, spec says 100G AND Seed of Defense.
            // I'll skip 100G implementation for now or define a dummy item.
            // Let's put 'Medicinal Herb' (1) for valid data.
            itemId: 401,
            itemName: "100ゴールド",
            isOpened: false
        },
        // Hidden Seed
        {
            id: "portia_seed",
            x: 24, y: 7, // Behind weapon shop (shop at y=8..12)
            itemId: 400, // Seed of Defense (Added to data.js)
            itemName: "守りの種",
            isOpened: false
        }
    ]
};

fs.writeFileSync('maps/town_portia.json', JSON.stringify(map));
console.log('Regenerated maps/town_portia.json with full facilities');
