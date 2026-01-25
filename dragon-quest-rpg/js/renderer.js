/**
 * Rendering Engine
 */
import { TILE, MAP_TILE_COLORS, DEFAULT_TILE_COLORS, MODE } from './constants.js';
import {
    currentMap, cameraX, cameraY, tileSize, canvasWidth, canvasHeight,
    player, party, partyData, dialog, menu, inn, church, shop, battle,
    partyJoinConfirm, ruraSelection, ruraState, endingState, spellFlash,
    switchStates, pushedIceBlocks, gameMode
} from './state.js';
import { items, spells, expTable } from './data.js';
import { getStoryFlag, isBossDefeated } from './state.js';
import { getReviveCost, getCureCost, getAvailableRuraLocations, getAlivePartyMembers } from './engine.js';

let ctx = null;

export function setContext(context) {
    ctx = context;
}

// 状態異常定義
const STATUS_EFFECTS = {
    sleep: { name: '眠り', icon: '💤', badge: '眠', duration: { min: 2, max: 3 } },
    poison: { name: '毒', icon: '☠️', badge: '毒', damageRate: 0.1 },
    blind: { name: '幻惑', icon: '💫', badge: '幻', hitRateModifier: 0.5 },
    silence: { name: '沈黙', icon: '🔇', badge: '黙', duration: { min: 3, max: 5 } }
};

// 状態異常バッジを取得
function getStatusBadges(target) {
    let badges = [];
    if (target.status && target.status.sleep > 0) badges.push(STATUS_EFFECTS.sleep.badge);
    if (target.status && target.status.poison > 0) badges.push(STATUS_EFFECTS.poison.badge);
    if (target.status && target.status.blind > 0) badges.push(STATUS_EFFECTS.blind.badge);
    return badges.length > 0 ? '（' + badges.join('') + '）' : '';
}

// バフ状態のバッジを取得
function getBuffBadges() {
    if (!battle.active) return '';
    let badges = [];
    if (battle.buffs.attackUp > 0) badges.push('攻↑' + (battle.buffs.attackUp > 1 ? '×2' : ''));
    if (battle.buffs.defenseUp > 0) badges.push('守↑' + (battle.buffs.defenseUp > 1 ? '×2' : ''));
    return badges.length > 0 ? '(' + badges.join(' ') + ')' : '';
}

// 現在コマンド入力中のパーティメンバーを取得
function getCurrentPartyMember() {
    return party[battle.currentPartyIndex] || party[0];
}

export function getNpcEffectivePosition(npc) {
    let x = npc.x;
    let y = npc.y;

    if (npc.type === 'portal_guard' && getStoryFlag('portalRoomUnlocked')) {
        x = npc.x + 1;
    } else if (npc.type === 'desert_guard' && isBossDefeated('desertGuardian')) {
        x = npc.x + 1;
    }
    return { x, y };
}

export function drawIceBlocks() {
    if (!currentMap) return;
    const blocks = pushedIceBlocks[currentMap.id];
    if (!blocks) return;
    const mapCols = currentMap.cols || currentMap.width || 0;
    const mapRows = currentMap.rows || currentMap.height || 0;

    for (const block of blocks) {
        const pos = getLoopAdjustedScreenPos(block.x, block.y, mapCols, mapRows);
        const screenX = pos.x;
        const screenY = pos.y;

        if (screenX < -tileSize || screenX > canvasWidth || screenY < -tileSize || screenY > canvasHeight) continue;

        ctx.fillStyle = '#88c8e8';
        ctx.fillRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(screenX + 4, screenY + 4, tileSize * 0.3, tileSize * 0.2);
        ctx.strokeStyle = '#5898b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
        ctx.font = `${tileSize * 0.5}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('❄', screenX + tileSize / 2, screenY + tileSize / 2);
    }
}

export function drawMap() {
    if (!ctx || !currentMap || tileSize <= 0) return;

    const mapCols = currentMap.cols || currentMap.width || 0;
    const mapRows = currentMap.rows || currentMap.height || 0;

    const startCol = Math.floor(cameraX / tileSize);
    const startRow = Math.floor(cameraY / tileSize);
    const endCol = startCol + Math.ceil(canvasWidth / tileSize) + 1;
    const endRow = startRow + Math.ceil(canvasHeight / tileSize) + 1;

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            let tile;
            let checkCol = col;
            let checkRow = row;

            if (currentMap.isLooping) {
                checkCol = (col % mapCols + mapCols) % mapCols;
                checkRow = (row % mapRows + mapRows) % mapRows;
            } else {
                if (checkCol < 0 || checkRow < 0 || checkCol >= mapCols || checkRow >= mapRows) continue;
            }

            if (Array.isArray(currentMap.data[0])) {
                tile = currentMap.data[checkRow][checkCol];
            } else {
                tile = currentMap.data[checkRow * mapCols + checkCol];
            }

            const screenX = col * tileSize - cameraX;
            const screenY = row * tileSize - cameraY;
            ctx.fillStyle = getTileColor(tile);
            ctx.fillRect(screenX, screenY, tileSize + 1, tileSize + 1);
            drawTileDecoration(tile, screenX, screenY, checkCol, checkRow);
        }
    }

    // Underworld darkness
    if (currentMap.isUnderworld && currentMap.darknessLevel) {
        ctx.fillStyle = `rgba(0, 0, 20, ${currentMap.darknessLevel})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const playerScreenX = (player.x - cameraX) * tileSize + tileSize / 2;
        const playerScreenY = (player.y - cameraY) * tileSize + tileSize / 2;
        const lightRadius = tileSize * 4;

        ctx.globalCompositeOperation = 'destination-out';
        const gradient = ctx.createRadialGradient(
            playerScreenX, playerScreenY, 0,
            playerScreenX, playerScreenY, lightRadius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(playerScreenX, playerScreenY, lightRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    // Underwater effect
    if (currentMap.isUnderwater) {
        ctx.fillStyle = 'rgba(0, 50, 150, 0.4)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Caustics / Ripple effect (Simplified)
        ctx.save();
        ctx.globalAlpha = 0.1 + Math.sin(Date.now() / 1000) * 0.05;
        ctx.fillStyle = '#88ccff';
        // Draw some random wave lines or just overlay
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
    }
}

function getLoopAdjustedScreenPos(mapX, mapY, mapCols, mapRows) {
    let screenX = mapX * tileSize - cameraX;
    let screenY = mapY * tileSize - cameraY;

    if (currentMap.isLooping) {
        const mapPxWidth = mapCols * tileSize;
        const mapPxHeight = mapRows * tileSize;

        // Adjust for X wrapping
        if (screenX < -mapPxWidth / 2) screenX += mapPxWidth;
        else if (screenX > mapPxWidth / 2) screenX -= mapPxWidth;

        // Adjust for Y wrapping
        if (screenY < -mapPxHeight / 2) screenY += mapPxHeight;
        else if (screenY > mapPxHeight / 2) screenY -= mapPxHeight;
    }
    return { x: screenX, y: screenY };
}



export function getTileColor(tile) {
    if (!currentMap) return DEFAULT_TILE_COLORS[tile] || '#000';
    const mapColors = MAP_TILE_COLORS[currentMap.type];
    if (mapColors && mapColors[tile] !== undefined) return mapColors[tile];
    return DEFAULT_TILE_COLORS[tile] || '#000';
}

export function drawTileDecoration(tile, x, y, col, row) {
    ctx.save();
    ctx.font = `${tileSize * 0.7}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (tile === TILE.GRASS) {
        const seed = (col * 7 + row * 13) % 100;
        if (seed < 25) {
            ctx.font = `${tileSize * 0.3}px serif`;
            ctx.fillText('🌿', x + tileSize * 0.5, y + tileSize * 0.5);
        }
    } else if (tile === TILE.MOUNTAIN) {
        ctx.fillText('⛰️', x + tileSize / 2, y + tileSize / 2);
    } else if (tile === TILE.SEA) {
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.4)';
        ctx.lineWidth = 2;
        const waveOffset = (Date.now() / 500) % (Math.PI * 2);
        for (let i = 0; i < 3; i++) {
            const waveY = y + tileSize * (0.3 + i * 0.25);
            ctx.beginPath();
            ctx.moveTo(x, waveY);
            for (let wx = 0; wx <= tileSize; wx += 4) {
                ctx.lineTo(x + wx, waveY + Math.sin(waveOffset + wx * 0.1 + i) * 2);
            }
            ctx.stroke();
        }
    } else if (tile === TILE.CASTLE) {
        ctx.fillText('🏰', x + tileSize / 2, y + tileSize / 2);
    } else if (tile === TILE.TOWN) {
        ctx.fillText('🏘️', x + tileSize / 2, y + tileSize / 2);
    } else if (tile === TILE.UNDERWORLD_TOWN) {
        ctx.fillText('🏘️', x + tileSize / 2, y + tileSize / 2);
    } else if (tile === TILE.STAIRS) {
        ctx.fillText('🪜', x + tileSize / 2, y + tileSize / 2);
    } else if (tile === TILE.FLOOR) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
    } else if (tile === TILE.WALL) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x, y + tileSize - 4, tileSize, 4);
    } else if (tile === TILE.PORTAL) {
        const time = Date.now() / 500;
        ctx.save();
        ctx.translate(x + tileSize / 2, y + tileSize / 2);
        ctx.rotate(time % (Math.PI * 2));
        ctx.font = `${tileSize * 0.8}px serif`;
        ctx.fillText('🌀', 0, 0);
        ctx.restore();
    } else if (tile === TILE.STAIRS_UP) {
        ctx.fillText('⬆️', x + tileSize / 2, y + tileSize / 2);
    } else if (tile === TILE.STAIRS_DOWN) {
        ctx.fillText('⬇️', x + tileSize / 2, y + tileSize / 2);
    } else if (tile === TILE.ICE_FLOOR) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * tileSize * 0.3, y + tileSize * 0.2);
            ctx.lineTo(x + tileSize * 0.2 + i * tileSize * 0.3, y + tileSize * 0.8);
            ctx.stroke();
        }
    } else if (tile === TILE.ICE_WALL) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x + 2, y + 2, tileSize * 0.4, tileSize * 0.3);
        ctx.font = `${tileSize * 0.5}px serif`;
        ctx.fillText('🧊', x + tileSize / 2, y + tileSize / 2);
    } else if (tile === TILE.ICE_HOLE) {
        ctx.fillStyle = 'rgba(0, 30, 60, 0.5)';
        ctx.beginPath();
        ctx.ellipse(x + tileSize / 2, y + tileSize / 2, tileSize * 0.35, tileSize * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `${tileSize * 0.4}px serif`;
        ctx.fillText('⚠️', x + tileSize / 2, y + tileSize / 2);
    } else if (tile === TILE.SNOW) {
        const seed = (col * 11 + row * 17) % 100;
        if (seed < 30) {
            ctx.font = `${tileSize * 0.25}px serif`;
            ctx.fillText('❄', x + tileSize * 0.3, y + tileSize * 0.3);
        }
    } else if (tile === TILE.TORCH) {
        const flicker = Math.sin(Date.now() / 100) * 0.15 + 0.85;
        ctx.font = `${tileSize * 0.6 * flicker}px serif`;
        ctx.fillText('🕯️', x + tileSize / 2, y + tileSize / 2);
    } else if (tile === TILE.ICE_ALTAR) {
        ctx.font = `${tileSize * 0.6}px serif`;
        ctx.fillText('🔮', x + tileSize / 2, y + tileSize / 2);
    } else if (tile === TILE.ICE_SWITCH) {
        const isPressed = switchStates[currentMap?.id]?.[`switch_${col}_${row}`];
        ctx.fillStyle = isPressed ? 'rgba(100, 255, 100, 0.3)' : 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(x + tileSize / 2, y + tileSize / 2, tileSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isPressed ? '#4a8' : '#888';
        ctx.lineWidth = 2;
        ctx.stroke();
    } else if (tile === TILE.BUBBLE) {
        ctx.font = `${tileSize * 0.6}px serif`;
        ctx.fillText('🫧', x + tileSize / 2, y + tileSize / 2);
    } else if (tile === TILE.CURRENT_UP || tile === TILE.CURRENT_DOWN || tile === TILE.CURRENT_LEFT || tile === TILE.CURRENT_RIGHT) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = `${tileSize * 0.5}px serif`;
        let arrow = '↑';
        if (tile === TILE.CURRENT_DOWN) arrow = '↓';
        if (tile === TILE.CURRENT_LEFT) arrow = '←';
        if (tile === TILE.CURRENT_RIGHT) arrow = '→';
        ctx.fillText(arrow, x + tileSize / 2, y + tileSize / 2);
    }
    ctx.restore();
}

export function drawChests() {
    if (!currentMap || !currentMap.chests) return;
    const mapCols = currentMap.cols || currentMap.width || 0;
    const mapRows = currentMap.rows || currentMap.height || 0;

    for (const chest of currentMap.chests) {
        const pos = getLoopAdjustedScreenPos(chest.x, chest.y, mapCols, mapRows);
        const screenX = pos.x;
        const screenY = pos.y;

        if (screenX < -tileSize || screenX > canvasWidth || screenY < -tileSize || screenY > canvasHeight) continue;
        ctx.font = `${tileSize * 0.7}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(chest.isOpened ? '📦' : '🎁', screenX + tileSize / 2, screenY + tileSize / 2);
    }
}

export function drawNPCs() {
    if (!currentMap || !currentMap.npcs) return;
    const mapCols = currentMap.cols || currentMap.width || 0;
    const mapRows = currentMap.rows || currentMap.height || 0;

    ctx.font = `${tileSize * 0.7}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const npc of currentMap.npcs) {
        const pos = getNpcEffectivePosition(npc);
        const screenPos = getLoopAdjustedScreenPos(pos.x, pos.y, mapCols, mapRows);
        const screenX = screenPos.x;
        const screenY = screenPos.y;

        if (screenX < -tileSize || screenX > canvasWidth || screenY < -tileSize || screenY > canvasHeight) continue;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize / 2, screenY + tileSize * 0.9, tileSize * 0.3, tileSize * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(npc.sprite, screenX + tileSize / 2, screenY + tileSize / 2);
    }
}

export function drawPlayer() {
    let drawX = player.x;
    let drawY = player.y;

    if (partyData.moving) {
        drawX = player.x + (partyData.nextX - player.x) * partyData.moveProgress;
        drawY = player.y + (partyData.nextY - player.y) * partyData.moveProgress;
    }

    const screenX = drawX * tileSize - cameraX;
    const screenY = drawY * tileSize - cameraY;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(screenX + tileSize / 2, screenY + tileSize * 0.9, tileSize * 0.35, tileSize * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(screenX + tileSize * 0.25, screenY + tileSize * 0.2, tileSize * 0.5, tileSize * 0.6);
    ctx.fillStyle = '#000';
    if (player.direction !== 'up') {
        ctx.fillRect(screenX + tileSize * 0.35, screenY + tileSize * 0.35, tileSize * 0.08, tileSize * 0.08);
        ctx.fillRect(screenX + tileSize * 0.55, screenY + tileSize * 0.35, tileSize * 0.08, tileSize * 0.08);
    }
    ctx.font = `${tileSize * 0.4}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('⚔️', screenX + tileSize / 2, screenY + tileSize * 0.15);
}

export function drawWindow(x, y, w, h) {
    ctx.fillStyle = 'rgba(0, 0, 50, 0.95)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);
}

export function wrapText(text, maxWidth, font) {
    ctx.font = font;
    const words = [];
    let currentWord = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (/[\u3000-\u9FFF\uFF00-\uFFEF]/.test(char)) {
            if (currentWord) { words.push(currentWord); currentWord = ''; }
            words.push(char);
        } else if (char === ' ') {
            if (currentWord) { words.push(currentWord); currentWord = ''; }
        } else {
            currentWord += char;
        }
    }
    if (currentWord) words.push(currentWord);

    const lines = [];
    let currentLine = '';
    for (const word of words) {
        const testLine = currentLine + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [''];
}

export function drawMessageWindow() {
    if (!dialog.active) return;
    const padding = 20;
    const textPadding = 20;
    const windowX = padding;
    const windowWidth = canvasWidth - padding * 2;
    const maxTextWidth = windowWidth - textPadding * 2;

    const fontSize = Math.floor(tileSize * 0.42);
    const lineHeight = fontSize * 1.4;
    const font = `${fontSize}px sans-serif`;

    const lines = wrapText(dialog.displayedText, maxTextWidth, font);
    const minLines = 2;
    const numLines = Math.max(minLines, lines.length);
    const windowHeight = textPadding * 2 + lineHeight * numLines + 10;
    const windowY = canvasHeight - windowHeight - 180;

    drawWindow(windowX, windowY, windowWidth, windowHeight);

    ctx.fillStyle = '#fff';
    ctx.font = font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], windowX + textPadding, windowY + textPadding + i * lineHeight);
    }
}

export function drawMenu() {
    if (!menu.active) return;
    const menuWidth = canvasWidth * 0.85;
    const menuHeight = canvasHeight * 0.75;
    const menuX = (canvasWidth - menuWidth) / 2;
    const menuY = (canvasHeight - menuHeight) / 2;

    drawWindow(menuX, menuY, menuWidth, menuHeight);

    const tabY = menuY + 10;
    ctx.font = `${tileSize * 0.32}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.fillStyle = menu.mode === 'status' ? '#ffd700' : 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('つよさ', menuX + menuWidth * 0.125, tabY);
    ctx.fillStyle = menu.mode === 'spells' ? '#ffd700' : 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('じゅもん', menuX + menuWidth * 0.375, tabY);
    ctx.fillStyle = menu.mode === 'items' ? '#ffd700' : 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('もちもの', menuX + menuWidth * 0.625, tabY);
    ctx.fillStyle = menu.mode === 'map' ? '#ffd700' : 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('ちず', menuX + menuWidth * 0.875, tabY);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(menuX + 15, tabY + tileSize * 0.5);
    ctx.lineTo(menuX + menuWidth - 15, tabY + tileSize * 0.5);
    ctx.stroke();

    const contentY = tabY + tileSize * 0.7;
    const lineHeight = tileSize * 0.5;

    if (menu.mode === 'status') {
        const selectedMember = party[menu.memberCursor] || party[0];
        const col1X = menuX + 20;
        const col2X = menuX + menuWidth * 0.6;
        let y = contentY + 10;

        ctx.font = `${tileSize * 0.4}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(selectedMember.name, col1X, y);
        ctx.fillStyle = '#fff';
        ctx.fillText(`Lv ${selectedMember.level}`, col2X, y);
        y += lineHeight;

        ctx.fillText(`HP ${selectedMember.hp}/${selectedMember.maxHp}`, col1X, y);
        y += lineHeight;
        ctx.fillText(`MP ${selectedMember.mp}/${selectedMember.maxMp}`, col1X, y);
        y += lineHeight * 1.5;

        ctx.fillText(`こうげき力 ${selectedMember.actualAtk}`, col1X, y);
        y += lineHeight;
        ctx.fillText(`しゅび力 ${selectedMember.actualDef}`, col1X, y);
        y += lineHeight * 1.5;

        ctx.fillText(`ゴールド ${partyData.gold} G`, col1X, y);
    } else if (menu.mode === 'items') {
        const itemStartY = contentY + 10;
        const validItems = player.inventory.filter(slot => items[slot.id]);

        if (validItems.length === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.textAlign = 'center';
            ctx.fillText('アイテムをもっていない', menuX + menuWidth / 2, itemStartY);
        } else {
            ctx.textAlign = 'left';
            validItems.forEach((slot, i) => {
                const item = items[slot.id];
                const y = itemStartY + i * lineHeight;
                const isSelected = (i === menu.itemCursor);
                ctx.fillStyle = isSelected ? '#ffd700' : '#fff';
                const cursor = isSelected ? '▶' : '・';
                ctx.fillText(`${cursor}${item.name}${slot.quantity > 1 ? ' x' + slot.quantity : ''}`, menuX + 30, y);
            });
        }
    } else if (menu.mode === 'spells') {
        const spellStartY = contentY + 10;
        const selectedMember = party[menu.memberCursor] || party[0];

        if (selectedMember.spells.length === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.textAlign = 'center';
            ctx.fillText('じゅもんを覚えていない', menuX + menuWidth / 2, spellStartY);
        } else {
            ctx.textAlign = 'left';
            selectedMember.spells.forEach((spellId, i) => {
                const spell = spells[spellId];
                const y = spellStartY + i * lineHeight;
                const isSelected = (i === menu.spellCursor);
                ctx.fillStyle = isSelected ? '#ffd700' : '#fff';
                const cursor = isSelected ? '▶' : '・';
                ctx.fillText(`${cursor}${spell.name}`, menuX + 30, y);
                ctx.fillStyle = selectedMember.mp >= spell.mp ? '#88f' : '#f44';
                ctx.fillText(`${spell.mp}MP`, menuX + menuWidth - 80, y);
            });
        }
    } else if (menu.mode === 'map') {
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('Aボタンで地図を開く', menuX + menuWidth / 2, contentY + tileSize);
    }
}

export function drawInn() {
    if (!inn.active) return;
    const windowWidth = canvasWidth * 0.8;
    const windowHeight = tileSize * 3.5;
    const windowX = (canvasWidth - windowWidth) / 2;
    const windowY = (canvasHeight - windowHeight) / 2;

    drawWindow(windowX, windowY, windowWidth, windowHeight);

    ctx.fillStyle = '#fff';
    ctx.font = `${tileSize * 0.45}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillText(`おとまりですか？（${inn.cost}ゴールド）`, windowX + 20, windowY + 20);

    const choiceY = windowY + tileSize * 1.5;
    const choices = ['はい', 'いいえ'];

    choices.forEach((choice, i) => {
        const choiceX = windowX + 40 + i * tileSize * 2.5;
        if (i === inn.selectedIndex) {
            ctx.fillStyle = '#ffd700';
            ctx.fillText('▶', choiceX - tileSize * 0.5, choiceY);
        }
        ctx.fillStyle = '#fff';
        ctx.fillText(choice, choiceX, choiceY);
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = `${tileSize * 0.35}px sans-serif`;
    ctx.fillText(`所持金: ${partyData.gold} G`, windowX + 20, windowY + windowHeight - tileSize * 0.6);
}

export function drawChurch() {
    if (!church.active) return;
    const windowWidth = canvasWidth * 0.85;
    const windowHeight = tileSize * 5;
    const windowX = (canvasWidth - windowWidth) / 2;
    const windowY = (canvasHeight - windowHeight) / 2;

    drawWindow(windowX, windowY, windowWidth, windowHeight);

    ctx.fillStyle = '#fff';
    ctx.font = `${tileSize * 0.4}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (church.phase === 'menu') {
        ctx.fillText('どのような ご用件ですか？', windowX + 20, windowY + 20);
        const menuItems = ['いきかえらせる', 'どくのちりょう', 'おいのりをする', 'やめる'];
        menuItems.forEach((item, i) => {
            const y = windowY + tileSize * 1.5 + i * tileSize * 0.7;
            if (i === church.menuIndex) {
                ctx.fillStyle = '#ffd700';
                ctx.fillText('▶', windowX + 25, y);
            }
            ctx.fillStyle = '#fff';
            ctx.fillText(item, windowX + 50, y);
        });
    } else if (church.phase === 'selectMember') {
        // ... member selection ...
    }
}

export function drawShop() {
    if (!shop.active) return;
    const windowWidth = canvasWidth * 0.9;
    const windowHeight = canvasHeight * 0.75;
    const windowX = (canvasWidth - windowWidth) / 2;
    const windowY = (canvasHeight - windowHeight) / 2;

    drawWindow(windowX, windowY, windowWidth, windowHeight);

    ctx.fillStyle = '#ffd700';
    ctx.font = `${tileSize * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('⚔️ ぶきぼうぐや 🛡️', canvasWidth / 2, windowY + 15);
}

export function drawBattle() {
    if (!battle.active) return;

    // バトル背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // フェードイン演出
    if (battle.fadeAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${battle.fadeAlpha})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 呪文フラッシュ演出
    if (spellFlash.active && spellFlash.alpha > 0) {
        const baseColor = spellFlash.color.replace(/[\d.]+\)$/, `${spellFlash.alpha})`);
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 複数モンスター表示
    if (battle.enemies && battle.enemies.length > 0) {
        const enemyCount = battle.enemies.length;
        const spacing = canvasWidth / (enemyCount + 1);
        const spriteSize = enemyCount === 1 ? tileSize * 4 : tileSize * (3 - enemyCount * 0.3);

        battle.enemies.forEach((enemy, idx) => {
            const x = spacing * (idx + 1);
            const y = canvasHeight * 0.35;

            // 死亡している敵は薄く表示
            const isDead = enemy.currentHp <= 0;
            if (isDead) {
                ctx.globalAlpha = 0.3;
            }

            // モンスタースプライト
            ctx.font = `${spriteSize}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 色違いモンスター対応（hueRotateフィルタ）
            if (enemy.hueRotate) {
                ctx.save();
                ctx.filter = `hue-rotate(${enemy.hueRotate}deg)`;
                ctx.fillText(enemy.sprite, x, y);
                ctx.restore();
            } else {
                ctx.fillText(enemy.sprite, x, y);
            }

            // ターゲット選択中のカーソル表示
            if (battle.isSelectingTarget && idx === battle.targetIndex && !isDead) {
                ctx.fillStyle = '#ffd700';
                ctx.font = `${tileSize * 0.8}px serif`;
                ctx.fillText('👆', x, y - spriteSize / 2 - tileSize * 0.3);
            }

            // モンスター名（各敵のスプライトの下に個別表示、奇数・偶数でY座標をずらす）
            const nameYOffset = idx % 2 === 0 ? 0 : tileSize * 0.5;
            const nameY = y + spriteSize / 2 + tileSize * 0.4 + nameYOffset;
            ctx.fillStyle = isDead ? '#888' : '#fff';
            ctx.font = `${tileSize * 0.35}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
            ctx.fillText(enemy.displayName, x, nameY);

            // 倒した表示（HPは非表示で緊張感を演出）
            if (isDead && (battle.phase === 'command' || battle.phase === 'target')) {
                ctx.fillStyle = '#888';
                ctx.font = `${tileSize * 0.3}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
                ctx.fillText('倒した', x, nameY + tileSize * 0.4);
            }

            // 状態異常バッジを名前の下に表示
            if (!isDead) {
                const enemyStatusBadge = getStatusBadges(enemy);
                if (enemyStatusBadge) {
                    ctx.fillStyle = '#f88';
                    ctx.font = `${tileSize * 0.3}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
                    ctx.fillText(enemyStatusBadge, x, nameY + tileSize * 0.4);
                }
            }

            ctx.globalAlpha = 1.0;
        });
    }

    // パーティステータスウィンドウ
    const aliveMembers = getAlivePartyMembers();
    const memberCount = party.length;
    const memberRowH = tileSize * 0.9;
    const statusW = canvasWidth * 0.85;
    const statusH = Math.max(tileSize * 2.5, 20 + memberRowH * memberCount);
    const statusX = 10;
    const statusY = 10;
    drawWindow(statusX, statusY, statusW, statusH);

    ctx.font = `${tileSize * 0.35}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // 各パーティメンバーのステータス表示
    party.forEach((member, idx) => {
        const rowY = statusY + 12 + idx * memberRowH;
        const isDead = !member.isAlive || member.hp <= 0;

        // コマンド入力中のメンバーをハイライト
        if (battle.phase === 'command' && idx === battle.currentPartyIndex) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
            ctx.fillRect(statusX + 5, rowY - 2, statusW - 10, memberRowH - 2);
        }

        // 味方選択中のカーソル表示
        if (battle.isSelectingAlly && idx === battle.allyTargetIndex) {
            ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
            ctx.fillRect(statusX + 5, rowY - 2, statusW - 10, memberRowH - 2);
            ctx.fillStyle = '#ffd700';
            ctx.font = `${tileSize * 0.4}px serif`;
            ctx.fillText('▶', statusX + 2, rowY);
        }

        // 戦闘不能は暗く表示
        ctx.fillStyle = isDead ? '#666' : '#fff';

        // 名前とレベル
        const nameText = `${member.name} Lv${member.level}`;
        ctx.fillText(nameText, statusX + 12, rowY);

        // HP/MP
        const hpColor = member.hp <= member.maxHp * 0.25 ? '#f44' : (member.hp <= member.maxHp * 0.5 ? '#ff0' : '#8f8');
        const mpColor = member.mp <= member.maxMp * 0.25 ? '#f88' : '#8cf';

        ctx.fillStyle = isDead ? '#444' : hpColor;
        ctx.fillText(`HP:${member.hp}/${member.maxHp}`, statusX + 12 + tileSize * 3.2, rowY);

        ctx.fillStyle = isDead ? '#444' : mpColor;
        ctx.fillText(`MP:${member.mp}/${member.maxMp}`, statusX + 12 + tileSize * 5.5, rowY);

        // 状態異常バッジ
        const memberBadge = getStatusBadges(member);
        if (memberBadge && !isDead) {
            ctx.fillStyle = '#f88';
            ctx.fillText(memberBadge, statusX + statusW - 50, rowY);
        }
    });

    // バフ状態バッジ（パーティ全体）
    const buffBadges = getBuffBadges();
    if (buffBadges) {
        ctx.fillStyle = '#8f8';
        ctx.font = `${tileSize * 0.3}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
        ctx.fillText(buffBadges, statusX + statusW - 80, statusY + statusH - 18);
    }

    // メッセージウィンドウ
    const msgPadding = 15;
    const msgWindowWidth = canvasWidth - 20;
    const msgMaxTextWidth = msgWindowWidth - msgPadding * 2;
    const msgFontSize = Math.floor(tileSize * 0.42);
    const msgLineHeight = msgFontSize * 1.4;
    const msgFont = `${msgFontSize}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;

    // 折り返し行数に応じてウィンドウ高さを調整
    const msgLines = wrapText(battle.message || '', msgMaxTextWidth, msgFont);
    const msgNumLines = Math.max(2, msgLines.length);
    const msgH = msgPadding * 2 + msgLineHeight * msgNumLines;
    const msgY = canvasHeight - msgH - 180;
    drawWindow(10, msgY, msgWindowWidth, msgH);

    ctx.fillStyle = '#fff';
    ctx.font = msgFont;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let i = 0; i < msgLines.length; i++) {
        ctx.fillText(msgLines[i], 10 + msgPadding, msgY + msgPadding + i * msgLineHeight);
    }

    // コマンドウィンドウ
    if (battle.phase === 'command') {
        const cmdW = canvasWidth * 0.45;
        const cmdH = tileSize * 3.7;
        const cmdX = canvasWidth - cmdW - 10;
        const cmdY = canvasHeight - cmdH - 10;
        drawWindow(cmdX, cmdY, cmdW, cmdH);

        const commands = ['たたかう', 'じゅもん', 'どうぐ', 'にげる'];
        ctx.font = `${tileSize * 0.5}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;

        commands.forEach((cmd, i) => {
            const y = cmdY + 20 + i * tileSize * 0.7;
            if (i === battle.commandIndex) {
                ctx.fillStyle = '#ffd700';
                ctx.fillText('▶', cmdX + 15, y);
            }
            ctx.fillStyle = '#fff';
            ctx.fillText(cmd, cmdX + 40, y);
        });

        // 呪文サブメニュー（スクロール対応）
        if (battle.showSpells) {
            const currentMember = getCurrentPartyMember();
            const validSpells = currentMember.spells.filter(id => spells[id]);
            const maxVisibleSpells = 5; // 最大表示件数
            const spellW = cmdW * 1.1;
            const rowHeight = tileSize * 0.6;
            const visibleCount = Math.min(validSpells.length, maxVisibleSpells);
            const spellH = rowHeight * visibleCount + 40; // 上下余白含む
            const spellX = cmdX - spellW - 10;
            const spellY = cmdY;
            drawWindow(spellX, spellY, spellW, spellH);

            // スクロールオフセット計算（カーソルが常に表示範囲内になるよう調整）
            let scrollOffset = 0;
            if (validSpells.length > maxVisibleSpells) {
                // カーソルが下端を超えたらスクロール
                if (battle.spellIndex >= maxVisibleSpells) {
                    scrollOffset = Math.min(
                        battle.spellIndex - maxVisibleSpells + 1,
                        validSpells.length - maxVisibleSpells
                    );
                }
            }

            // 上矢印（スクロール可能な場合）
            if (scrollOffset > 0) {
                ctx.fillStyle = '#ffd700';
                ctx.font = `${tileSize * 0.35}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('▲', spellX + spellW / 2, spellY + 12);
                ctx.textAlign = 'left';
            }

            // 呪文リスト描画
            for (let i = 0; i < visibleCount; i++) {
                const spellIdx = i + scrollOffset;
                if (spellIdx >= validSpells.length) break;

                const spellId = validSpells[spellIdx];
                const spell = spells[spellId];
                const y = spellY + 22 + i * rowHeight;
                const canUse = currentMember.mp >= spell.mp;

                // 選択カーソル
                if (spellIdx === battle.spellIndex) {
                    ctx.fillStyle = canUse ? '#ffd700' : '#888';
                    ctx.fillText('▶', spellX + 10, y);
                }

                // 呪文名とMP（MP不足はグレーアウト）
                ctx.fillStyle = canUse ? '#fff' : '#555';
                ctx.font = `${tileSize * 0.4}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
                ctx.fillText(`${spell.name}`, spellX + 30, y);

                // MP消費量
                ctx.fillStyle = canUse ? '#8cf' : '#444';
                ctx.fillText(`${spell.mp}`, spellX + spellW - 40, y);
            }

            // 下矢印（スクロール可能な場合）
            if (scrollOffset + maxVisibleSpells < validSpells.length) {
                ctx.fillStyle = '#ffd700';
                ctx.font = `${tileSize * 0.35}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('▼', spellX + spellW / 2, spellY + spellH - 18);
                ctx.textAlign = 'left';
            }

            // 操作ガイド
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = `${tileSize * 0.25}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
            ctx.fillText('B:もどる', spellX + 10, spellY + spellH - 8);
        }

        // アイテムサブメニュー（スクロール対応）
        if (battle.showItems) {
            // 有効なアイテムのみフィルタリング（隙間防止）
            const validItems = player.inventory.filter(slot => items[slot.id]);
            const maxVisibleItems = 5; // 最大表示件数
            const itemW = cmdW * 1.3;
            const rowHeight = tileSize * 0.6;
            const visibleCount = Math.min(validItems.length, maxVisibleItems);
            const itemH = rowHeight * Math.max(1, visibleCount) + 40;
            const itemX = cmdX - itemW - 10;
            const itemY = cmdY;
            drawWindow(itemX, itemY, itemW, itemH);

            if (validItems.length === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.font = `${tileSize * 0.4}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
                ctx.fillText('どうぐがない', itemX + 20, itemY + 30);
            } else {
                // カーソルが有効範囲を超えないよう調整
                if (battle.itemCursor >= validItems.length) {
                    battle.itemCursor = Math.max(0, validItems.length - 1);
                }

                // スクロールオフセット計算
                let itemScrollOffset = 0;
                if (validItems.length > maxVisibleItems) {
                    if (battle.itemCursor >= maxVisibleItems) {
                        itemScrollOffset = Math.min(
                            battle.itemCursor - maxVisibleItems + 1,
                            validItems.length - maxVisibleItems
                        );
                    }
                }

                // 上矢印（スクロール可能な場合）
                if (itemScrollOffset > 0) {
                    ctx.fillStyle = '#ffd700';
                    ctx.textAlign = 'center';
                    ctx.fillText('▲', itemX + itemW / 2, itemY + 12);
                    ctx.textAlign = 'left';
                }

                for (let i = 0; i < visibleCount; i++) {
                    const itemIdx = i + itemScrollOffset;
                    if (itemIdx >= validItems.length) break;

                    const slot = validItems[itemIdx];
                    const item = items[slot.id];
                    const y = itemY + 22 + i * rowHeight;
                    const canUse = item.type !== 'weapon' && item.type !== 'armor';

                    // 選択カーソル
                    if (itemIdx === battle.itemCursor) {
                        ctx.fillStyle = canUse ? '#ffd700' : '#888';
                        ctx.fillText('▶', itemX + 10, y);
                    }

                    // アイテム名（装備品はグレーアウト）
                    ctx.fillStyle = canUse ? '#fff' : '#555';
                    ctx.font = `${tileSize * 0.4}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
                    let displayName = item.name;
                    if (slot.quantity > 1) {
                        displayName += ` x ${slot.quantity}`;
                    }
                    ctx.fillText(displayName, itemX + 30, y);

                    // タイプアイコン
                    if (item.type === 'weapon') {
                        ctx.fillText('⚔️', itemX + itemW - 40, y);
                    } else if (item.type === 'armor') {
                        ctx.fillText('🛡️', itemX + itemW - 40, y);
                    }
                }

                // 下矢印（スクロール可能な場合）
                if (itemScrollOffset + maxVisibleItems < validItems.length) {
                    ctx.fillStyle = '#ffd700';
                    ctx.textAlign = 'center';
                    ctx.fillText('▼', itemX + itemW / 2, itemY + itemH - 18);
                    ctx.textAlign = 'left';
                }
            }

            // 操作ガイド
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = `${tileSize * 0.25}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
            ctx.fillText('B:もどる', itemX + 10, itemY + itemH - 10);
        }
    }
}

export function drawPartyJoinConfirm() {
    if (!partyJoinConfirm.active) return;
    const windowWidth = canvasWidth * 0.7;
    const windowHeight = tileSize * 2.5;
    const windowX = (canvasWidth - windowWidth) / 2;
    const windowY = (canvasHeight - windowHeight) / 2;

    drawWindow(windowX, windowY, windowWidth, windowHeight);

    ctx.fillStyle = '#fff';
    ctx.font = `${tileSize * 0.45}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('仲間にしますか？', windowX + 20, windowY + 20);

    const choiceY = windowY + tileSize * 1.3;
    ['はい', 'いいえ'].forEach((choice, i) => {
        const choiceX = windowX + 40 + i * tileSize * 2.5;
        if (i === partyJoinConfirm.selectedIndex) {
            ctx.fillStyle = '#ffd700';
            ctx.fillText('▶', choiceX - tileSize * 0.5, choiceY);
        }
        ctx.fillStyle = '#fff';
        ctx.fillText(choice, choiceX, choiceY);
    });
}

export function drawRuraSelection() {
    if (!ruraState.active) return;

    // エリア制限対応：利用可能な拠点のみ表示
    const locations = getAvailableRuraLocations();
    if (locations.length === 0) return;

    // ウィンドウサイズ計算
    const lineHeight = tileSize * 0.5;
    const windowWidth = canvasWidth * 0.6;
    const windowHeight = lineHeight * (locations.length + 2) + 40;
    const windowX = (canvasWidth - windowWidth) / 2;
    const windowY = (canvasHeight - windowHeight) / 2;

    // ウィンドウ描画
    drawWindow(windowX, windowY, windowWidth, windowHeight);

    // タイトル
    ctx.font = `${tileSize * 0.35}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('どこへ いきますか？', canvasWidth / 2, windowY + 15);

    // 区切り線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(windowX + 20, windowY + 40);
    ctx.lineTo(windowX + windowWidth - 20, windowY + 40);
    ctx.stroke();

    // 拠点リスト
    ctx.textAlign = 'left';
    ctx.font = `${tileSize * 0.35}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
    const listStartY = windowY + 55;

    for (let i = 0; i < locations.length; i++) {
        const y = listStartY + i * lineHeight;

        // カーソル表示
        if (i === ruraState.cursor) {
            ctx.fillStyle = '#ffd700';
            ctx.fillText('▶', windowX + 25, y);
        }

        // 拠点名
        ctx.fillStyle = i === ruraState.cursor ? '#fff' : 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(locations[i].displayName, windowX + 50, y);
    }

    // 操作説明
    ctx.font = `${tileSize * 0.25}px 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('↑↓:選択  Enter:決定  Esc:キャンセル', canvasWidth / 2, windowY + windowHeight - 20);
}

export function drawEnding() {
    if (!endingState.active) return;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (endingState.phase === 'staffroll') {
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = `${tileSize * 0.5}px serif`;
        endingState.staffRoll.forEach((line, i) => {
            const y = canvasHeight - endingState.scrollProgress + i * 50;
            if (y > -50 && y < canvasHeight + 50) {
                ctx.fillText(line, canvasWidth / 2, y);
            }
        });
    } else if (endingState.phase === 'end') {
        ctx.fillStyle = '#cdf';
        ctx.font = `${tileSize * 1}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText('THE END', canvasWidth / 2, canvasHeight / 2);
    }
}
