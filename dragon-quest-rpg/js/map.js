/**
 * World Map System
 */
import { MODE } from './constants.js';
import { gameMode, setGameMode, currentMap, player } from './state.js';

// DOM elements
const worldMapOverlay = document.getElementById('worldMapOverlay');
const worldMapCanvas = document.getElementById('worldMapCanvas');
const worldMapCtx = worldMapCanvas ? worldMapCanvas.getContext('2d') : null;
const worldMapTitle = document.getElementById('worldMapTitle');

// Offscreen canvas for terrain rendering
let worldMapOffscreen = null;
let worldMapOffscreenCtx = null;

// Map display state
let worldMapAnimationId = null;
let playerBlinkState = true;

// World map color settings
const WORLD_MAP_COLORS = {
    0: '#44aa44', // 草原/平地
    1: '#886644', // 山/岩場
    2: '#2244aa', // 海/水域
    3: '#ffffff', // 城
    4: '#ffffff', // 街/建物
    5: '#8866aa', // 階段
    6: '#996633', // 床（ダンジョン）
    7: '#555555', // 壁
    8: '#6a4aaa', // 旅の扉（紫）
    9: '#8866aa', // 上り階段
    10: '#664488', // 下り階段
    // 砂漠タイル
    11: '#d4a559', // 砂漠
    12: '#44aa66', // オアシス
    13: '#c4a040', // ピラミッド
    14: '#b89050', // 流砂
    // 地底タイル
    17: '#2a1a3a', // 地底床 - 暗い紫
    18: '#0a0a1a', // 地底壁 - ほぼ黒
    20: '#ffffff', // 地底の街 - 白（ワールドマップで目立つ）
    // エリア4: 氷雪タイル
    21: '#a8d8ea', // 氷床 - 水色
    22: '#6a8fa8', // 氷壁 - 暗い水色
    24: '#c8e8f8', // 氷の道 - 明るい水色
    25: '#e8f4fc', // 雪原 - ほぼ白
    28: '#ffff88'  // 圧力スイッチ - 黄色（目立つ）
};

// Viewport settings for large maps
let worldMapViewport = {
    usePartialView: false,
    viewSize: 100,      // 部分表示時の表示範囲（タイル数）
    offsetX: 0,
    offsetY: 0,
    tileSize: 4
};

export function openWorldMap() {
    if (gameMode === MODE.BATTLE || gameMode === MODE.TITLE || gameMode === MODE.ENDING) {
        return;
    }

    const previousMode = gameMode;
    setGameMode(MODE.MAP_VIEW);

    // マップタイトルを設定
    if (worldMapTitle) {
        worldMapTitle.textContent = currentMap.name || 'ワールドマップ';
    }

    // オーバーレイを表示
    if (worldMapOverlay) {
        worldMapOverlay.classList.add('active');
    }

    // 地図を描画
    renderWorldMap();

    // 点滅アニメーション開始
    startPlayerMarkerAnimation();
}

export function closeWorldMap() {
    setGameMode(MODE.FIELD);
    if (worldMapOverlay) {
        worldMapOverlay.classList.remove('active');
    }

    // アニメーション停止
    if (worldMapAnimationId) {
        clearTimeout(worldMapAnimationId);
        worldMapAnimationId = null;
    }
}

export function renderWorldMap() {
    if (!currentMap || !worldMapCanvas || !worldMapCtx) return;

    const mapData = currentMap.data;
    const rows = currentMap.rows;
    const cols = currentMap.cols;

    // 表示サイズを計算（最大サイズを設定）
    const maxWidth = Math.min(window.innerWidth * 0.7, 500);
    const maxHeight = Math.min(window.innerHeight * 0.5, 400);

    // 広大マップ判定（100x100以上は部分表示モード）
    const isLargeMap = cols > 100 || rows > 100;
    worldMapViewport.usePartialView = isLargeMap;

    let displayCols, displayRows, tileSize;

    if (isLargeMap) {
        // 広大マップ: プレイヤー周辺のみ表示
        const viewSize = worldMapViewport.viewSize;
        displayCols = Math.min(cols, viewSize);
        displayRows = Math.min(rows, viewSize);

        // プレイヤーを中心にオフセット計算
        worldMapViewport.offsetX = Math.max(0, Math.min(cols - displayCols, player.x - Math.floor(displayCols / 2)));
        worldMapViewport.offsetY = Math.max(0, Math.min(rows - displayRows, player.y - Math.floor(displayRows / 2)));

        // タイルサイズ計算（最小1px）
        const tileW = Math.floor(maxWidth / displayCols);
        const tileH = Math.floor(maxHeight / displayRows);
        tileSize = Math.max(1, Math.min(tileW, tileH, 6));
    } else {
        // 通常マップ: 全体表示
        displayCols = cols;
        displayRows = rows;
        worldMapViewport.offsetX = 0;
        worldMapViewport.offsetY = 0;

        // タイルサイズを自動計算（最小1px、大きいマップは縮小）
        const tileW = Math.floor(maxWidth / cols);
        const tileH = Math.floor(maxHeight / rows);
        tileSize = Math.max(1, Math.min(tileW, tileH, 10));
    }

    worldMapViewport.tileSize = tileSize;

    const canvasW = displayCols * tileSize;
    const canvasH = displayRows * tileSize;

    // キャンバスサイズを設定
    worldMapCanvas.width = canvasW;
    worldMapCanvas.height = canvasH;

    // オフスクリーンキャンバスを作成（地形を一度だけ描画）
    worldMapOffscreen = document.createElement('canvas');
    worldMapOffscreen.width = canvasW;
    worldMapOffscreen.height = canvasH;
    worldMapOffscreenCtx = worldMapOffscreen.getContext('2d');

    // 地形を描画（表示範囲のみ）
    const startCol = worldMapViewport.offsetX;
    const startRow = worldMapViewport.offsetY;
    const endCol = startCol + displayCols;
    const endRow = startRow + displayRows;

    for (let row = startRow; row < endRow && row < rows; row++) {
        for (let col = startCol; col < endCol && col < cols; col++) {
            const tile = mapData[row][col];
            const color = WORLD_MAP_COLORS[tile] || '#333333';
            worldMapOffscreenCtx.fillStyle = color;
            const drawX = (col - startCol) * tileSize;
            const drawY = (row - startRow) * tileSize;
            worldMapOffscreenCtx.fillRect(drawX, drawY, tileSize, tileSize);
        }
    }

    // グリッド線（小さいマップかつタイルが4px以上の場合のみ）
    if (displayCols <= 30 && displayRows <= 30 && tileSize >= 4) {
        worldMapOffscreenCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        worldMapOffscreenCtx.lineWidth = 0.5;
        for (let row = 0; row <= displayRows; row++) {
            worldMapOffscreenCtx.beginPath();
            worldMapOffscreenCtx.moveTo(0, row * tileSize);
            worldMapOffscreenCtx.lineTo(canvasW, row * tileSize);
            worldMapOffscreenCtx.stroke();
        }
        for (let col = 0; col <= displayCols; col++) {
            worldMapOffscreenCtx.beginPath();
            worldMapOffscreenCtx.moveTo(col * tileSize, 0);
            worldMapOffscreenCtx.lineTo(col * tileSize, canvasH);
            worldMapOffscreenCtx.stroke();
        }
    }

    // 広大マップの場合、表示範囲の境界を示す枠を描画
    if (isLargeMap) {
        worldMapOffscreenCtx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        worldMapOffscreenCtx.lineWidth = 2;
        worldMapOffscreenCtx.strokeRect(1, 1, canvasW - 2, canvasH - 2);

        // マップ全体での位置を示すミニマップ（右上に小さく）
        const miniSize = 50;
        const miniTileW = miniSize / cols;
        const miniTileH = miniSize / rows;
        const miniX = canvasW - miniSize - 5;
        const miniY = 5;

        // ミニマップ背景
        worldMapOffscreenCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        worldMapOffscreenCtx.fillRect(miniX - 2, miniY - 2, miniSize + 4, miniSize + 4);

        // ミニマップ上の現在表示範囲
        worldMapOffscreenCtx.fillStyle = 'rgba(100, 100, 100, 0.8)';
        worldMapOffscreenCtx.fillRect(miniX, miniY, miniSize, miniSize);

        worldMapOffscreenCtx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        worldMapOffscreenCtx.fillRect(
            miniX + startCol * miniTileW,
            miniY + startRow * miniTileH,
            displayCols * miniTileW,
            displayRows * miniTileH
        );

        // プレイヤー位置（赤点）
        worldMapOffscreenCtx.fillStyle = '#ff3333';
        worldMapOffscreenCtx.beginPath();
        worldMapOffscreenCtx.arc(
            miniX + player.x * miniTileW,
            miniY + player.y * miniTileH,
            2, 0, Math.PI * 2
        );
        worldMapOffscreenCtx.fill();
    }

    // オフスクリーンから転送
    worldMapCtx.drawImage(worldMapOffscreen, 0, 0);
}

function startPlayerMarkerAnimation() {
    if (!worldMapCanvas || !worldMapCtx) return;

    const tileSize = worldMapViewport.tileSize;

    function animateMarker() {
        // オフスクリーンを再描画
        if (worldMapOffscreen) {
            worldMapCtx.drawImage(worldMapOffscreen, 0, 0);
        }

        // プレイヤー位置を描画（点滅）- 部分表示モード対応
        if (playerBlinkState) {
            // 部分表示の場合はオフセットを考慮
            const displayX = player.x - worldMapViewport.offsetX;
            const displayY = player.y - worldMapViewport.offsetY;

            // 表示範囲内にいる場合のみ描画
            const cols = worldMapViewport.usePartialView ? worldMapViewport.viewSize : currentMap.cols;
            const rows = worldMapViewport.usePartialView ? worldMapViewport.viewSize : currentMap.rows;

            if (displayX >= 0 && displayX < cols && displayY >= 0 && displayY < rows) {
                const px = displayX * tileSize + tileSize / 2;
                const py = displayY * tileSize + tileSize / 2;
                const radius = Math.max(2, tileSize * 0.6);

                // 外側の光彩
                worldMapCtx.beginPath();
                worldMapCtx.arc(px, py, radius + 2, 0, Math.PI * 2);
                worldMapCtx.fillStyle = 'rgba(255, 100, 100, 0.5)';
                worldMapCtx.fill();

                // 中心のマーカー
                worldMapCtx.beginPath();
                worldMapCtx.arc(px, py, radius, 0, Math.PI * 2);
                worldMapCtx.fillStyle = '#ff3333';
                worldMapCtx.fill();
                worldMapCtx.strokeStyle = '#ffffff';
                worldMapCtx.lineWidth = 1;
                worldMapCtx.stroke();
            }
        }

        playerBlinkState = !playerBlinkState;

        if (gameMode === MODE.MAP_VIEW) {
            worldMapAnimationId = setTimeout(() => {
                requestAnimationFrame(animateMarker);
            }, 400); // 400msごとに点滅
        }
    }

    animateMarker();
}

export function updateMapPinVisibility() {
    const mapPinBtn = document.getElementById('mapPinBtn');
    if (!mapPinBtn || !currentMap) return;

    // フィールドタイプのマップでのみ📍を表示
    const showPin = currentMap.type === 'field' || currentMap.cols >= 20 || currentMap.rows >= 20;
    if (showPin) {
        mapPinBtn.classList.remove('hidden');
    } else {
        mapPinBtn.classList.add('hidden');
    }
}

// Setup world map overlay click event
if (worldMapOverlay) {
    worldMapOverlay.addEventListener('click', () => {
        if (gameMode === MODE.MAP_VIEW) {
            closeWorldMap();
        }
    });
}
