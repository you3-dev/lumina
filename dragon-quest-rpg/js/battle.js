/**
 * Battle System
 */
import { battle, party, partyData, gameMode, setGameMode, gameProgress, currentMap, addItem } from './state.js';
import { MODE } from './constants.js';
import { monsters, encounterTables, encounterTableFallback, bossSkills } from './data.js';
import { SE, BGM } from './sound.js';
import { getAlivePartyMembers, checkLevelUp } from './engine.js';

export function generateEnemyGroup(encounterTable) {
    const table = encounterTables[encounterTable] || encounterTables[encounterTableFallback[encounterTable]] || encounterTables.field;
    if (!table) return [];
    const count = 1 + Math.floor(Math.random() * 3); // 1-3 enemies
    const monsterType = table[Math.floor(Math.random() * table.length)];
    const monsterData = monsters[monsterType];
    const suffixes = ['A', 'B', 'C'];
    const enemies = [];

    for (let i = 0; i < count; i++) {
        const suffix = suffixes[i];
        enemies.push({
            ...monsterData,
            id: `${monsterType}_${i}`,
            type: monsterType,
            displayName: count > 1 ? `${monsterData.name}${suffix}` : monsterData.name,
            currentHp: monsterData.hp,
            currentMp: monsterData.mp || 0,
            status: { sleep: 0, poison: 0, blind: 0 },
            index: i
        });
    }

    return enemies;
}

export function startBattle(monsterTypeOrTable) {
    battle.active = true;
    battle.phase = 'start';
    battle.turn = 0;
    battle.partyIndex = 0;
    battle.messages = ["魔物があらわれた！"];
    battle.isSelectingTarget = false;
    battle.isSelectingAlly = false;

    if (monsters[monsterTypeOrTable]) {
        // Single designated monster
        const monsterData = monsters[monsterTypeOrTable];
        battle.enemies = [{
            ...monsterData,
            id: `${monsterTypeOrTable}_0`,
            type: monsterTypeOrTable,
            displayName: monsterData.name,
            currentHp: monsterData.hp,
            currentMp: monsterData.mp || 0,
            status: { sleep: 0, poison: 0, blind: 0 },
            index: 0
        }];
    } else {
        // Table based
        battle.enemies = generateEnemyGroup(monsterTypeOrTable);
    }

    setGameMode(MODE.BATTLE);
    SE.encounter();
    BGM.play('battle');
}

export function updateBattle(delta) {
    if (!battle.active) return;

    if (battle.phase === 'playerMessage') {
        // Wait for player to press A
    } else if (battle.phase === 'monsterTurn') {
        processMonsterTurns();
    }
}

export function advanceBattlePhase() {
    if (battle.phase === 'start') {
        battle.phase = 'command';
    } else if (battle.phase === 'command') {
        // ... (handled by input.js when action selected)
    } else if (battle.phase === 'playerMessage') {
        if (checkBattleEnd()) return;
        battle.phase = 'monsterTurn';
    } else if (battle.phase === 'monsterMessage') {
        if (checkBattleEnd()) return;
        battle.phase = 'command';
    } else if (battle.phase === 'result') {
        endBattle();
    }
}

function processMonsterTurns() {
    const aliveEnemies = getAliveEnemies();
    if (aliveEnemies.length === 0) {
        battleWin();
        return;
    }

    const currentMonster = aliveEnemies[0]; // Simplified: 1 monster at a time
    executeMonsterAction(currentMonster);

    if (checkBattleEnd()) return;
    battle.phase = 'monsterMessage';
}

function executeMonsterAction(monster) {
    const numActions = monster.actions || 1;
    for (let i = 0; i < numActions; i++) {
        const aliveMembers = getAlivePartyMembers();
        if (aliveMembers.length === 0) break;

        const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];

        // AI Logic
        let action = 'attack';
        if (monster.skills && monster.skills.length > 0) {
            // weighted selection or specific logic
            if (monster.id === 'leviathan') {
                if (monster.hp < monster.maxHp * 0.3 && Math.random() < 0.5) action = 'behoma';
                else action = monster.skills[Math.floor(Math.random() * monster.skills.length)];
            } else {
                action = monster.skills[Math.floor(Math.random() * monster.skills.length)];
            }
        }

        if (action === 'attack') {
            const damage = Math.max(1, monster.atk - Math.floor(target.actualDef / 2));
            target.hp = Math.max(0, target.hp - damage);
            battle.messages.push(`${monster.name}のこうげき！`);
            battle.messages.push(`${target.name}に ${damage} のダメージ！`);
        } else {
            const skill = bossSkills[action];
            if (skill) {
                applySkillEffect(skill, monster, target);
            }
        }
    }
}

function applySkillEffect(skill, source, target) {
    battle.messages.push(`${source.name}は ${skill.name} をはなった！`);
    if (skill.type === 'attack') {
        let damage = skill.power;
        if (skill.target === 'all') {
            getAlivePartyMembers().forEach(m => {
                const d = Math.max(1, damage - Math.floor(m.actualDef / 4));
                m.hp = Math.max(0, m.hp - d);
                battle.messages.push(`${m.name}に ${d} のダメージ！`);
            });
        } else {
            const d = Math.max(1, damage - Math.floor(target.actualDef / 2));
            target.hp = Math.max(0, target.hp - d);
            battle.messages.push(`${target.name}に ${d} のダメージ！`);
        }
    } else if (skill.type === 'heal') {
        source.hp = Math.min(source.maxHp, source.hp + skill.power);
        battle.messages.push(`${source.name}のきずがかいふくした！`);
    } else if (skill.type === 'debuff') {
        battle.messages.push(`${target.name}はうごけなくなった！`);
        // simplified status effect
    }
    SE.damage();
}

export function getAliveEnemies() {
    return battle.enemies.filter(enemy => enemy.isAlive && enemy.hp > 0);
}

export function checkBattleEnd() {
    const aliveEnemies = getAliveEnemies();
    if (aliveEnemies.length === 0) {
        battleWin();
        return true;
    }
    const aliveMembers = getAlivePartyMembers();
    if (aliveMembers.length === 0) {
        battleLose();
        return true;
    }
    return false;
}

export function battleWin() {
    battle.phase = 'result';

    // Check for boss defeat
    const boss = battle.enemies.find(e => e.isBoss);
    if (boss && boss.id && gameProgress.bossDefeated.hasOwnProperty(boss.id)) {
        gameProgress.bossDefeated[boss.id] = true;
        // Area 5 Specific Drops
        if (boss.id === 'siren') {
            addItem(122);
            gameProgress.storyFlags.tearOfBlueObtained = true;
            battle.messages.push('青の涙をてにいれた！');
        } else if (boss.id === 'kraken') {
            addItem(123);
            gameProgress.storyFlags.tearOfRedObtained = true;
            battle.messages.push('赤の涙をてにいれた！');
        } else if (boss.id === 'leviathan') {
            addItem(125); // Sky Chart
            battle.messages.push('海神リヴァイアサンを倒した！');
            battle.messages.push('光の中から「天空の海図」が現れた！');
            battle.messages.push('この海図は、天空界への道を示しているようだ……。');
            gameProgress.storyFlags.area5Completed = true;
        }
    }

    // Calc Exp & Gold
    let totalExp = 0;
    let totalGold = 0;
    battle.enemies.forEach(e => {
        totalExp += e.exp || 0;
        totalGold += e.gold || 0;
    });

    party.forEach(member => {
        if (member.hp > 0) {
            member.exp += totalExp;
            checkLevelUp(member);
        }
    });
    partyData.gold += totalGold;

    battle.messages.push(`魔物たちをやっつけた！`);
    battle.messages.push(`${totalExp} ポイントの経験値をかくとく！`);
    battle.messages.push(`${totalGold} ゴールドをてにいれた！`);

    BGM.play('victory');
}

export function battleLose() {
    battle.phase = 'result';
    SE.defeat();
    battle.messages.push("全滅してしまった...");
}

export function endBattle() {
    battle.active = false;
    setGameMode(MODE.FIELD);
    BGM.play('field');
}

export function canUseSpellsInCurrentMap() {
    if (!currentMap) return true;
    if (currentMap.mapId === 'prison_isle' || currentMap.sealSpells) {
        return false;
    }
    return true;
}
