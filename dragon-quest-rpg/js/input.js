/**
 * Input Handling
 */
import { MODE } from './constants.js';
import {
    gameMode, setGameMode, isTransitioning, menu, dialog, battle,
    inn, church, shop, partyData, player, party, currentMap,
    titleMenuIndex, setTitleMenuIndex
} from './state.js';
import { SE, initAudio } from './sound.js';
import {
    movePlayer as engineMovePlayer, updateCamera, interact, advanceDialog,
    updateTitleMenuSelection, selectTitleMenuItem
} from './engine.js';

const keys = {};

export function setupInputs() {
    window.addEventListener('keydown', (e) => {
        initAudio();
        keys[e.key] = true;
        handleKeyDown(e);
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    // Touch controls... (simplified)
}

export function handleInput() {
    if (gameMode !== MODE.FIELD || dialog.active || menu.active || isTransitioning) return;
    if (partyData.moving) return;

    if (keys['ArrowUp'] || keys['w']) movePlayer('up');
    else if (keys['ArrowDown'] || keys['s']) movePlayer('down');
    else if (keys['ArrowLeft'] || keys['a']) movePlayer('left');
    else if (keys['ArrowRight'] || keys['d']) movePlayer('right');
}

function movePlayer(dir) {
    engineMovePlayer(dir);
}

function handleKeyDown(e) {
    if (isTransitioning) return;

    if (gameMode === MODE.TITLE) {
        if (e.key === 'ArrowUp' || e.key === 'w') {
            setTitleMenuIndex(Math.max(0, (titleMenuIndex || 0) - 1));
            updateTitleMenuSelection();
        } else if (e.key === 'ArrowDown' || e.key === 's') {
            setTitleMenuIndex(Math.min(1, (titleMenuIndex || 0) + 1));
            updateTitleMenuSelection();
        } else if (e.key === 'Enter' || e.key === ' ') {
            selectTitleMenuItem();
        }
    } else if (gameMode === MODE.FIELD) {
        if (dialog.active) {
            if (e.key === 'z' || e.key === 'Enter' || e.key === ' ') {
                advanceDialog();
            }
        } else if (menu.active) {
            // handleMenuInput(e.key);
        } else {
            if (e.key === 'z' || e.key === 'Enter' || e.key === ' ') {
                handleButton('A');
            } else if (e.key === 'x' || e.key === 'Escape') {
                handleButton('B');
            } else if (e.key === 'm') {
                setGameMode(MODE.MAP_VIEW);
            }
        }
    } else if (gameMode === MODE.SHOP || gameMode === MODE.INN || gameMode === MODE.CHURCH) {
        if (e.key === 'x' || e.key === 'Escape') {
            shop.active = false;
            inn.active = false;
            church.active = false;
            setGameMode(MODE.FIELD);
            SE.cancel();
        }
    }
}

function handleDpad(dir, pressed) {
    if (pressed) movePlayer(dir);
}

function handleButton(btn) {
    if (btn === 'A') {
        if (gameMode === MODE.FIELD) {
            if (dialog.active) {
                advanceDialog();
            } else if (menu.active) {
                // selectMenuItem();
            } else {
                interact();
            }
        }
    } else if (btn === 'B') {
        if (menu.active) {
            // closeMenu();
        }
    }
}
