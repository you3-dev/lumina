/**
 * Input Handling
 */
import { MODE } from './constants.js';
import {
    gameMode, setGameMode, isTransitioning, menu, dialog, battle,
    inn, church, shop, partyData, player, party, currentMap,
    titleMenuIndex, setTitleMenuIndex,
    canvasWidth, canvasHeight, tileSize
} from './state.js';
import { SE, initAudio } from './sound.js';
import {
    movePlayer as engineMovePlayer, updateCamera, interact, advanceDialog,
    updateTitleMenuSelection, selectTitleMenuItem,
    openMenu, closeMenu, closeInn, closeChurch, closeDialog,
    cancelTargetSelection, cancelAllySelection, handleShopInput,
    startDialog,
    confirmEquipMember, confirmItemMember, executeItemAction,
    useSpellInField, executeFieldSpellOnTarget
} from './engine.js';
import { openWorldMap } from './map.js';
import { items } from './data.js';

const keys = {};

// 連続移動用の変数
let moveInterval = null;
let currentMoveDirection = { dx: 0, dy: 0 };
const CONTINUOUS_MOVE_DELAY = 150;  // 連続移動の間隔（ミリ秒）

// ズーム防止用の変数
let lastTouchEnd = 0;

export function setupInputs() {
    window.addEventListener('keydown', (e) => {
        initAudio();
        keys[e.key] = true;
        handleKeyDown(e);
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    // Touch controls
    setupDpadButton('dpad-up', 0, -1);
    setupDpadButton('dpad-down', 0, 1);
    setupDpadButton('dpad-left', -1, 0);
    setupDpadButton('dpad-right', 1, 0);

    setupActionButton('btn-a', onActionA);
    setupActionButton('btn-b', onActionB);

    // Map pin button
    const mapPinBtn = document.getElementById('mapPinBtn');
    if (mapPinBtn) {
        mapPinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (gameMode === MODE.FIELD || gameMode === MODE.MENU || gameMode === MODE.DIALOG) {
                openWorldMap();
            }
        });
    }

    // Canvas tap events
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.addEventListener('click', (e) => {
            initAudio();
            handleCanvasTap(e.clientX, e.clientY);
        });

        canvas.addEventListener('touchend', (e) => {
            initAudio();
            if (e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                if (handleCanvasTap(touch.clientX, touch.clientY)) {
                    e.preventDefault();
                }
            }
        }, { passive: false });
    }

    // ダブルタップによるズームを防止
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // ピンチズームを防止（2本指タッチ）
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // gestureイベント（Safari）を防止
    document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('gesturechange', (e) => {
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('gestureend', (e) => {
        e.preventDefault();
    }, { passive: false });

    // 右クリックメニューを無効化
    document.addEventListener('contextmenu', (e) => e.preventDefault());
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
    let dx = 0, dy = 0;
    if (dir === 'up') dy = -1;
    else if (dir === 'down') dy = 1;
    else if (dir === 'left') dx = -1;
    else if (dir === 'right') dx = 1;
    else if (typeof dir === 'object') {
        dx = dir.dx || dir.x || 0;
        dy = dir.dy || dir.y || 0;
    }

    if (dx !== 0) engineMovePlayer(dx > 0 ? 'right' : 'left');
    else if (dy !== 0) engineMovePlayer(dy > 0 ? 'down' : 'up');
}

function handleCanvasTap(clientX, clientY) {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return false;

    // キャンバス上の座標に変換
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const tapX = (clientX - rect.left) * scaleX;
    const tapY = (clientY - rect.top) * scaleY;

    // メニューが開いていて、ステータスか呪文タブの場合のみ処理
    if (!menu.active) return false;
    if (menu.mode !== 'status' && menu.mode !== 'spells') return false;
    if (party.length <= 1) return false;  // 仲間がいない場合は不要
    if (menu.selectingMember) return false;  // 呪文対象選択モード中は不処理

    // メニュー座標を計算（renderer.jsのdrawMenuと同じ計算）
    const menuWidth = canvasWidth * 0.85;
    const menuHeight = canvasHeight * 0.75;
    const menuX = (canvasWidth - menuWidth) / 2;
    const menuY = (canvasHeight - menuHeight) / 2;
    const contentY = menuY + 10 + tileSize * 0.7;
    const lineHeight = tileSize * 0.5;

    // メンバーリスト領域（呪文タブの左側）
    const memberListX = menuX + 15;
    const memberListY = contentY + 5;
    const memberListWidth = menuWidth * 0.28;

    // タップがメンバーリスト領域内かチェック
    if (tapX >= memberListX - 5 && tapX <= memberListX + memberListWidth + 5) {
        for (let idx = 0; idx < party.length; idx++) {
            const itemTop = memberListY + idx * lineHeight * 0.9 - 3;
            const itemBottom = itemTop + lineHeight * 0.85;
            if (tapY >= itemTop && tapY <= itemBottom) {
                menu.memberCursor = idx;
                if (menu.mode === 'spells') {
                    menu.spellCursor = 0;  // 呪文カーソルもリセット
                }
                return true;
            }
        }
    }
    return false;
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
            if (menu.selectingEquipMember) {
                // 装備対象メンバー選択モード
                switch (e.key) {
                    case 'ArrowUp': case 'w': case 'W':
                        menu.targetMemberCursor = (menu.targetMemberCursor + party.length - 1) % party.length;
                        break;
                    case 'ArrowDown': case 's': case 'S':
                        menu.targetMemberCursor = (menu.targetMemberCursor + 1) % party.length;
                        break;
                    case 'Enter': case ' ': case 'z': case 'Z':
                        confirmEquipMember();
                        break;
                    case 'Escape': case 'x': case 'b': case 'B':
                        menu.selectingEquipMember = false;
                        menu.showItemAction = true;
                        break;
                }
            } else if (menu.selectingItemMember) {
                // アイテム使用対象メンバー選択モード
                switch (e.key) {
                    case 'ArrowUp': case 'w': case 'W':
                        menu.targetMemberCursor = (menu.targetMemberCursor + party.length - 1) % party.length;
                        break;
                    case 'ArrowDown': case 's': case 'S':
                        menu.targetMemberCursor = (menu.targetMemberCursor + 1) % party.length;
                        break;
                    case 'Enter': case ' ': case 'z': case 'Z':
                        confirmItemMember();
                        break;
                    case 'Escape': case 'x': case 'b': case 'B':
                        menu.selectingItemMember = false;
                        menu.showItemAction = true;
                        break;
                }
            } else if (menu.showItemAction) {
                // アイテムアクションサブメニュー操作
                switch (e.key) {
                    case 'ArrowUp': case 'w': case 'W':
                        menu.itemActionIndex = (menu.itemActionIndex + 3) % 4;
                        break;
                    case 'ArrowDown': case 's': case 'S':
                        menu.itemActionIndex = (menu.itemActionIndex + 1) % 4;
                        break;
                    case 'Enter': case ' ': case 'z': case 'Z':
                        executeItemAction();
                        break;
                    case 'Escape': case 'x': case 'b': case 'B':
                        menu.showItemAction = false;
                        break;
                }
            } else if (menu.mode === 'items' && player.inventory.length > 0) {
                // アイテムリスト操作（有効なアイテムのみカウント）
                const validItems = player.inventory.filter(slot => items[slot.id]);
                if (validItems.length === 0) return;
                switch (e.key) {
                    case 'ArrowUp': case 'w': case 'W':
                        menu.itemCursor = (menu.itemCursor + validItems.length - 1) % validItems.length;
                        break;
                    case 'ArrowDown': case 's': case 'S':
                        menu.itemCursor = (menu.itemCursor + 1) % validItems.length;
                        break;
                    case 'ArrowLeft': case 'a': case 'A':
                        menu.mode = 'spells';
                        menu.spellCursor = 0;
                        break;
                    case 'ArrowRight': case 'd': case 'D':
                        menu.mode = 'map';
                        break;
                    case 'Enter': case ' ': case 'z': case 'Z':
                        menu.showItemAction = true;
                        menu.itemActionIndex = 0;
                        break;
                    case 'Escape': case 'x': case 'b': case 'B':
                        closeMenu();
                        break;
                }
            } else if (menu.mode === 'spells') {
                const selectedMember = party[menu.memberCursor] || party[0];
                if (menu.selectingMember) {
                    // 呪文対象選択モード
                    switch (e.key) {
                        case 'ArrowUp': case 'w': case 'W':
                            menu.targetMemberCursor = (menu.targetMemberCursor + party.length - 1) % party.length;
                            break;
                        case 'ArrowDown': case 's': case 'S':
                            menu.targetMemberCursor = (menu.targetMemberCursor + 1) % party.length;
                            break;
                        case 'Enter': case ' ': case 'z': case 'Z':
                            executeFieldSpellOnTarget();
                            break;
                        case 'Escape': case 'x': case 'b': case 'B':
                            menu.selectingMember = false;
                            break;
                    }
                } else if (selectedMember.spells.length > 0) {
                    // 呪文リスト操作
                    switch (e.key) {
                        case 'ArrowUp': case 'w': case 'W':
                            menu.spellCursor = (menu.spellCursor + selectedMember.spells.length - 1) % selectedMember.spells.length;
                            break;
                        case 'ArrowDown': case 's': case 'S':
                            menu.spellCursor = (menu.spellCursor + 1) % selectedMember.spells.length;
                            break;
                        case 'ArrowLeft': case 'a': case 'A':
                            if (party.length > 1) {
                                menu.memberCursor = (menu.memberCursor + party.length - 1) % party.length;
                                menu.spellCursor = 0;
                            } else {
                                menu.mode = 'status';
                            }
                            break;
                        case 'ArrowRight': case 'd': case 'D':
                            if (party.length > 1) {
                                menu.memberCursor = (menu.memberCursor + 1) % party.length;
                                menu.spellCursor = 0;
                            } else {
                                menu.mode = 'items';
                                menu.itemCursor = 0;
                            }
                            break;
                        case 'Enter': case ' ': case 'z': case 'Z':
                            useSpellInField();
                            break;
                        case 'Escape': case 'x': case 'b': case 'B':
                            closeMenu();
                            break;
                    }
                } else {
                    // 呪文がない場合はタブ切り替え
                    switch (e.key) {
                        case 'ArrowLeft': case 'a': case 'A':
                            if (party.length > 1) {
                                menu.memberCursor = (menu.memberCursor + party.length - 1) % party.length;
                                menu.spellCursor = 0;
                            } else {
                                menu.mode = 'status';
                            }
                            break;
                        case 'ArrowRight': case 'd': case 'D':
                            if (party.length > 1) {
                                menu.memberCursor = (menu.memberCursor + 1) % party.length;
                                menu.spellCursor = 0;
                            } else {
                                menu.mode = 'items';
                                menu.itemCursor = 0;
                            }
                            break;
                        case 'Escape': case 'x': case 'b': case 'B':
                            closeMenu();
                            break;
                    }
                }
            } else if (menu.mode === 'map') {
                // ちずタブ
                switch (e.key) {
                    case 'ArrowLeft': case 'a': case 'A':
                        menu.mode = 'items';
                        menu.itemCursor = 0;
                        break;
                    case 'ArrowRight': case 'd': case 'D':
                        menu.mode = 'status';
                        break;
                    case 'Enter': case ' ': case 'z': case 'Z':
                        closeMenu();
                        openWorldMap();
                        break;
                    case 'Escape': case 'x': case 'b': case 'B':
                        closeMenu();
                        break;
                }
            } else if (menu.mode === 'status') {
                // ステータスモード（パーティメンバー選択可能）
                switch (e.key) {
                    case 'ArrowUp': case 'w': case 'W':
                        if (party.length > 1) {
                            menu.memberCursor = (menu.memberCursor + party.length - 1) % party.length;
                        }
                        break;
                    case 'ArrowDown': case 's': case 'S':
                        if (party.length > 1) {
                            menu.memberCursor = (menu.memberCursor + 1) % party.length;
                        }
                        break;
                    case 'ArrowLeft': case 'a': case 'A':
                        menu.mode = 'map';
                        break;
                    case 'ArrowRight': case 'd': case 'D':
                        menu.mode = 'spells';
                        menu.spellCursor = 0;
                        break;
                    case 'Escape': case 'x': case 'b': case 'B':
                        closeMenu();
                        break;
                }
            } else {
                // タブ切り替えモード（アイテム・呪文がない場合）
                switch (e.key) {
                    case 'ArrowLeft': case 'a': case 'A':
                        if (menu.mode === 'spells') {
                            menu.mode = 'status';
                        } else if (menu.mode === 'items') {
                            menu.mode = 'spells';
                            menu.spellCursor = 0;
                        }
                        break;
                    case 'ArrowRight': case 'd': case 'D':
                        if (menu.mode === 'spells') {
                            menu.mode = 'items';
                            menu.itemCursor = 0;
                        } else if (menu.mode === 'items') {
                            menu.mode = 'map';
                        }
                        break;
                    case 'Escape': case 'x': case 'b': case 'B':
                        closeMenu();
                        break;
                }
            }
            e.preventDefault();
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

// 連続移動の開始
function startContinuousMove(dx, dy) {
    // 既存のインターバルをクリア
    if (moveInterval) {
        clearInterval(moveInterval);
        moveInterval = null;
    }
    currentMoveDirection = { dx, dy };
    movePlayer({ dx, dy });  // 即座に1回移動
    moveInterval = setInterval(() => {
        if (gameMode === MODE.FIELD && !isTransitioning && !dialog.active &&
            !menu.active && !inn.active && !shop.active) {
            movePlayer(currentMoveDirection);
        }
    }, CONTINUOUS_MOVE_DELAY);
}

// 連続移動の停止
function stopContinuousMove() {
    if (moveInterval) {
        clearInterval(moveInterval);
        moveInterval = null;
    }
    currentMoveDirection = { dx: 0, dy: 0 };
}

// D-padボタンのセットアップ
function setupDpadButton(id, dx, dy) {
    const btn = document.getElementById(id);
    if (!btn) return;

    const handlePress = (e) => {
        e.preventDefault();
        initAudio();
        if (isTransitioning || dialog.active) return;
        btn.classList.add('pressed');
        // 連続移動を開始
        startContinuousMove(dx, dy);
    };
    const handleRelease = () => {
        btn.classList.remove('pressed');
        stopContinuousMove();
    };
    btn.addEventListener('touchstart', handlePress, { passive: false });
    btn.addEventListener('touchend', handleRelease);
    btn.addEventListener('mousedown', handlePress);
    btn.addEventListener('mouseup', handleRelease);
    btn.addEventListener('mouseleave', handleRelease);
}

// アクションボタンのセットアップ
function setupActionButton(id, callback) {
    const btn = document.getElementById(id);
    if (!btn) return;

    const handlePress = (e) => {
        e.preventDefault();
        initAudio();
        btn.classList.add('pressed');
        callback();
    };
    const handleRelease = () => {
        btn.classList.remove('pressed');
    };
    btn.addEventListener('touchstart', handlePress, { passive: false });
    btn.addEventListener('touchend', handleRelease);
    btn.addEventListener('mousedown', handlePress);
    btn.addEventListener('mouseup', handleRelease);
    btn.addEventListener('mouseleave', handleRelease);
}

function handleButton(btn) {
    if (btn === 'A') {
        onActionA();
    } else if (btn === 'B') {
        onActionB();
    }
}

function onActionA() {
    if (isTransitioning) return;

    if (gameMode === MODE.FIELD) {
        if (dialog.active) {
            advanceDialog();
        } else if (menu.active) {
            // メニュー操作は後で実装
        } else {
            interact();
        }
    }
}

function onActionB() {
    if (isTransitioning) return;

    // ルーラ選択中 - キャンセル
    if (gameMode === MODE.FIELD && menu.active && menu.mode === 'rura') {
        cancelTargetSelection();
        return;
    }
    // バトル中 - 味方選択キャンセル
    if (gameMode === MODE.BATTLE && battle.isSelectingAlly) {
        cancelAllySelection();
        return;
    }
    if (gameMode === MODE.BATTLE && battle.showSpells) {
        battle.showSpells = false;
    } else if (gameMode === MODE.BATTLE && battle.showItems) {
        battle.showItems = false;
    } else if (shop.active) {
        handleShopInput('cancel');
    } else if (inn.active) {
        closeInn();
        startDialog(['またのお越しを おまちしております。']);
    } else if (church.active) {
        if (church.phase === 'confirm') {
            church.phase = 'selectMember';
        } else if (church.phase === 'selectMember') {
            church.phase = 'menu';
        } else {
            closeChurch();
            startDialog(['また いつでも おこしください。']);
        }
    } else if (dialog.active) {
        closeDialog();
    } else if (menu.active) {
        if (menu.selectingMember) {
            // 呪文対象選択モード - キャンセル
            menu.selectingMember = false;
        } else if (menu.selectingEquipMember) {
            menu.selectingEquipMember = false;
            menu.showItemAction = true;
        } else if (menu.selectingItemMember) {
            menu.selectingItemMember = false;
            menu.showItemAction = true;
        } else if (menu.showItemAction) {
            menu.showItemAction = false;
        } else {
            closeMenu();
        }
    } else {
        openMenu();
    }
}
