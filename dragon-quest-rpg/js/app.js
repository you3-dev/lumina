/**
 * Main Application / Game Engine
 */
import {
    currentMap, currentMapId, gameMode, setGameMode,
    player, party, partyData, setupPlayerProxy,
    canvasWidth, canvasHeight, tileSize, cameraX, cameraY,
    maps, isTransitioning, stepsSinceLastBattle,
    gameProgress
} from './state.js';
import { MODE, VISIBLE_TILES, SAVE_KEY } from './constants.js';
import { setupInputs, handleInput } from './input.js';
import { performWarp, updateCamera, updatePlayerMovement, updateNPCs, createDebugSave, initTitleScreen } from './engine.js';
import * as renderer from './renderer.js';
import { updateSoundToggleIcon, toggleSound } from './sound.js';
import { updateBattle } from './battle.js';

import {
    setCanvasWidth, setCanvasHeight, setTileSize, setCameraX, setCameraY,
    setCurrentMap, setCurrentMapId, setIsTransitioning, setStepsSinceLastBattle
} from './state.js';

let lastTime = 0;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

renderer.setContext(ctx);

async function init() {
    window.addEventListener('resize', resize);
    resize();

    // Setup inputs
    setupInputs();

    // Initial state
    updateSoundToggleIcon();

    // Debug Save Trigger (Sound Toggle x20)
    let debugCount = 0;
    const soundBtn = document.getElementById('soundToggle');
    if (soundBtn) {
        soundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSound();
            debugCount++;
            if (debugCount >= 20) {
                debugCount = 0;
                createDebugSave();
            }
        });
    }

    // Start with title or field
    if (gameMode === MODE.TITLE) {
        initTitleScreen();
    } else {
        // Load initial map
        await performWarp(currentMapId, player.x, player.y);
    }

    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    if (gameMode === MODE.FIELD) {
        handleInput();
        updatePlayerMovement(deltaTime);
        updateNPCs(deltaTime);
    } else if (gameMode === MODE.BATTLE) {
        updateBattle(deltaTime);
    }
    // Battle update, transition update, etc.
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameMode === MODE.TITLE) {
        // drawTitle();
    } else if (gameMode === MODE.BATTLE) {
        renderer.drawBattle();
    } else if (gameMode === MODE.ENDING) {
        renderer.drawEnding();
    } else {
        renderer.drawMap();
        renderer.drawChests();
        renderer.drawIceBlocks();
        renderer.drawNPCs();
        renderer.drawPlayer();
        renderer.drawMessageWindow();
        renderer.drawMenu();
        renderer.drawInn();
        renderer.drawChurch();
        renderer.drawShop();
        renderer.drawPartyJoinConfirm();
        renderer.drawRuraSelection();
    }
}

function resize() {
    const container = canvas.parentElement;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;

    canvas.width = w;
    canvas.height = h;

    setCanvasWidth(w);
    setCanvasHeight(h);

    const ts = Math.ceil(w / VISIBLE_TILES);
    setTileSize(ts);

    updateCamera();
}

init();
