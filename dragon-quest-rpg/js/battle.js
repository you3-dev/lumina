/**
 * Battle System
 */
import { battle, party, partyData, gameMode, setGameMode, gameProgress } from './state.js';
import { MODE } from './constants.js';
import { monsters, encounterTables, encounterTableFallback } from './data.js';
import { SE, BGM } from './sound.js';
import { getAlivePartyMembers, checkLevelUp } from './engine.js';

export function generateEnemyGroup(encounterTable) {
    const table = encounterTables[encounterTable] || encounterTables[encounterTableFallback[encounterTable]] || encounterTables.field;
    const count = 1 + Math.floor(Math.random() * 3); // 1-3 enemies
    const enemies = [];
    for (let i = 0; i < count; i++) {
        const monsterId = table[Math.floor(Math.random() * table.length)];
        const monster = JSON.parse(JSON.stringify(monsters[monsterId]));
        monster.hp = monster.maxHp = monster.hp;
        monster.isAlive = true;
        enemies.push(monster);
    }
    return enemies;
}

export function startBattle(monsterTypeOrTable) {
    battle.active = true;
    battle.phase = 'start';
    battle.turn = 0;
    battle.partyIndex = 0;
    battle.messages = [];
    battle.isSelectingTarget = false;
    battle.isSelectingAlly = false;

    if (monsters[monsterTypeOrTable]) {
        // Single designated monster
        battle.enemies = [JSON.parse(JSON.stringify(monsters[monsterTypeOrTable]))];
    } else {
        // Table based
        battle.enemies = generateEnemyGroup(monsterTypeOrTable);
    }

    setGameMode(MODE.BATTLE);
    SE.encounter();
    BGM.play('battle');
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
    if (boss && boss.name === 'リヴァイアサン') { // Check by name or add ID to monster data
        gameProgress.bossDefeated.leviathan = true;
        // saveGame(); // call save via engine or app? For now just set flag.
    }

    // Calc Exp & Gold
    let totalExp = 0;
    let totalGold = 0;
    battle.enemies.forEach(e => {
        totalExp += e.exp;
        totalGold += e.gold;
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
    // ... game over logic ...
}

export function endBattle(result) {
    battle.active = false;
    setGameMode(MODE.FIELD);
    // ... reset state ...
    BGM.play('field'); // simplified
}
