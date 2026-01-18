/**
 * Sound System (SE + BGM)
 */

export const SOUND_SETTING_KEY = 'dragonQuestSoundEnabled';
export let audioCtx = null;
export let soundEnabled = localStorage.getItem(SOUND_SETTING_KEY) !== 'false';
export let seEnabled = soundEnabled;
export let seVolume = 0.5;
export let bgmEnabled = soundEnabled;
export let bgmVolume = 0.3;
export let audioInitialized = false;
let audioUnlocked = false;

const audioBufferCache = {};

export function initAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    try {
        const buffer = audioCtx.createBuffer(1, 1, 22050);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);
    } catch (e) { }

    audioInitialized = true;
}

async function loadAudioBuffer(filename) {
    if (audioBufferCache[filename]) return audioBufferCache[filename];
    try {
        const response = await fetch(`se/${filename}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioBufferCache[filename] = audioBuffer;
        return audioBuffer;
    } catch (e) {
        return null;
    }
}

function playAudioBuffer(buffer, volume, loop = false) {
    if (!buffer || !audioCtx) return null;
    const source = audioCtx.createBufferSource();
    const gainNode = audioCtx.createGain();
    source.buffer = buffer;
    source.loop = loop;
    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    source.start(0);
    return { source, gainNode };
}

export function playSE(filename) {
    if (!seEnabled || !audioCtx) return;
    if (audioBufferCache[filename]) {
        playAudioBuffer(audioBufferCache[filename], seVolume);
    } else {
        loadAudioBuffer(filename).then(buffer => {
            if (buffer) playAudioBuffer(buffer, seVolume);
        });
    }
}

function createOscillator(type, frequency, duration, volume = seVolume * 0.6) {
    if (!audioCtx || !seEnabled) return null;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    return { osc, gain };
}

export const SE = {
    attack: () => playSE('battle-attack.mp3'),
    critical: () => playSE('battle-attack-critical.mp3'),
    damage: () => playSE('battle-damage.mp3'),
    miss: () => {
        if (!audioCtx || !seEnabled) return;
        const t = audioCtx.currentTime;
        const osc = createOscillator('sine', 400, 0.15, seVolume * 0.3);
        if (osc) {
            osc.osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
            osc.osc.start(t);
            osc.osc.stop(t + 0.15);
        }
    },
    magicAttack: () => playSE('battle-spell-attack.mp3'),
    heal: () => playSE('battle-spell-cure.mp3'),
    buff: () => {
        if (!audioCtx || !seEnabled) return;
        const t = audioCtx.currentTime;
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, i) => {
            const osc = createOscillator('triangle', freq, 0.2, seVolume * 0.4);
            if (osc) {
                osc.osc.start(t + i * 0.06);
                osc.osc.stop(t + i * 0.06 + 0.2);
            }
        });
    },
    debuff: () => {
        if (!audioCtx || !seEnabled) return;
        const t = audioCtx.currentTime;
        const osc = createOscillator('triangle', 600, 0.25, seVolume * 0.4);
        if (osc) {
            osc.osc.frequency.exponentialRampToValueAtTime(200, t + 0.25);
            osc.osc.start(t);
            osc.osc.stop(t + 0.25);
        }
    },
    victory: () => playSE('battle-victory-intro.mp3'),
    defeat: () => {
        if (!audioCtx || !seEnabled) return;
        const t = audioCtx.currentTime;
        const melody = [
            { freq: 392, time: 0, dur: 0.3 },
            { freq: 349, time: 0.3, dur: 0.3 },
            { freq: 294, time: 0.6, dur: 0.5 }
        ];
        melody.forEach(note => {
            const osc = createOscillator('triangle', note.freq, note.dur, seVolume * 0.4);
            if (osc) {
                osc.osc.start(t + note.time);
                osc.osc.stop(t + note.time + note.dur);
            }
        });
    },
    escape: () => playSE('battle-escape.mp3'),
    cursor: () => {
        if (!audioCtx || !seEnabled) return;
        const t = audioCtx.currentTime;
        const osc = createOscillator('square', 880, 0.05, seVolume * 0.2);
        if (osc) {
            osc.osc.start(t);
            osc.osc.stop(t + 0.05);
        }
    },
    confirm: () => {
        if (!audioCtx || !seEnabled) return;
        const t = audioCtx.currentTime;
        const osc1 = createOscillator('square', 880, 0.08, seVolume * 0.3);
        if (osc1) {
            osc1.osc.start(t);
            osc1.osc.stop(t + 0.08);
        }
        const osc2 = createOscillator('square', 1320, 0.1, seVolume * 0.3);
        if (osc2) {
            osc2.osc.start(t + 0.08);
            osc2.osc.stop(t + 0.18);
        }
    },
    cancel: () => {
        if (!audioCtx || !seEnabled) return;
        const t = audioCtx.currentTime;
        const osc = createOscillator('square', 440, 0.1, seVolume * 0.3);
        if (osc) {
            osc.osc.frequency.exponentialRampToValueAtTime(220, t + 0.1);
            osc.osc.start(t);
            osc.osc.stop(t + 0.1);
        }
    },
    chest: () => {
        if (!audioCtx || !seEnabled) return;
        const t = audioCtx.currentTime;
        const melody = [
            { freq: 392, time: 0, dur: 0.15 },
            { freq: 494, time: 0.12, dur: 0.15 },
            { freq: 587, time: 0.24, dur: 0.15 },
            { freq: 784, time: 0.36, dur: 0.4 }
        ];
        melody.forEach(note => {
            const osc = createOscillator('square', note.freq, note.dur, seVolume * 0.35);
            if (osc) {
                osc.osc.start(t + note.time);
                osc.osc.stop(t + note.time + note.dur);
            }
        });
    },
    levelUp: () => playSE('levelup.mp3'),
    stairs: () => {
        if (!audioCtx || !seEnabled) return;
        const t = audioCtx.currentTime;
        const osc = createOscillator('triangle', 440, 0.15, seVolume * 0.3);
        if (osc) {
            osc.osc.frequency.exponentialRampToValueAtTime(660, t + 0.15);
            osc.osc.start(t);
            osc.osc.stop(t + 0.15);
        }
    },
    door: () => {
        if (!audioCtx || !seEnabled) return;
        const t = audioCtx.currentTime;
        const osc = createOscillator('sawtooth', 100, 0.25, seVolume * 0.2);
        if (osc) {
            osc.osc.frequency.setValueAtTime(100, t);
            osc.osc.frequency.linearRampToValueAtTime(150, t + 0.1);
            osc.osc.frequency.linearRampToValueAtTime(80, t + 0.25);
            osc.osc.start(t);
            osc.osc.stop(t + 0.25);
        }
    },
    encounter: () => playSE('encounter.mp3'),
    save: () => {
        if (!audioCtx || !seEnabled) return;
        const t = audioCtx.currentTime;
        const notes = [523, 659, 784];
        notes.forEach((freq, i) => {
            const osc = createOscillator('sine', freq, 0.25, seVolume * 0.3);
            if (osc) {
                osc.osc.start(t + i * 0.1);
                osc.osc.stop(t + i * 0.1 + 0.25);
            }
        });
    },
    inn: () => playSE('inn.mp3'),
    buy: () => {
        if (!audioCtx || !seEnabled) return;
        const t = audioCtx.currentTime;
        const osc1 = createOscillator('triangle', 1200, 0.08, seVolume * 0.35);
        if (osc1) {
            osc1.osc.start(t);
            osc1.osc.stop(t + 0.08);
        }
        const osc2 = createOscillator('triangle', 1600, 0.1, seVolume * 0.3);
        if (osc2) {
            osc2.osc.start(t + 0.05);
            osc2.osc.stop(t + 0.15);
        }
    },
    revive: () => playSE('battle-spell-cure.mp3')
};

export const BGM = {
    current: null,
    currentType: null,
    fadingOut: false,
    files: {
        title: 'title.mp3',
        field: 'field.mp3',
        town: 'town.mp3',
        castle: 'castle.mp3',
        dungeon: 'dungeon.mp3',
        bossDungeon: 'boss-dungeon.mp3',
        battle: 'battle.mp3',
        bossBattle: 'boss-battle.mp3',
        victory: 'battle-victory.mp3',
        ending: 'ending.mp3'
    },
    source: null,
    gainNode: null,
    buffer: null,
    startTime: 0,
    pauseTime: 0,
    isPlaying: false,

    play: function (type) {
        if (!bgmEnabled || !audioCtx) return;
        if (this.currentType === type && this.isPlaying) return;
        this.stop();
        const file = this.files[type];
        if (!file) return;
        this.currentType = type;
        loadAudioBuffer(file).then(buffer => {
            if (buffer && this.currentType === type) {
                this.buffer = buffer;
                this._startPlayback(0);
            }
        }).catch(e => { });
    },

    _startPlayback: function (offset) {
        if (!this.buffer || !audioCtx) return;
        this.source = audioCtx.createBufferSource();
        this.gainNode = audioCtx.createGain();
        this.source.buffer = this.buffer;
        this.source.loop = true;
        this.gainNode.gain.value = bgmVolume;
        this.source.connect(this.gainNode);
        this.gainNode.connect(audioCtx.destination);
        this.source.start(0, offset);
        this.startTime = audioCtx.currentTime - offset;
        this.isPlaying = true;
    },

    stop: function () {
        if (this.source) {
            try { this.source.stop(); } catch (e) { }
            this.source = null;
        }
        this.gainNode = null;
        this.buffer = null;
        this.currentType = null;
        this.isPlaying = false;
        this.pauseTime = 0;
    },

    pause: function () {
        if (this.source && this.isPlaying) {
            this.pauseTime = (audioCtx.currentTime - this.startTime) % this.buffer.duration;
            try { this.source.stop(); } catch (e) { }
            this.source = null;
            this.isPlaying = false;
        }
    },

    resume: function () {
        if (this.buffer && !this.isPlaying && bgmEnabled) {
            this._startPlayback(this.pauseTime);
        }
    },

    setVolume: function (vol) {
        bgmVolume = vol;
        if (this.gainNode) {
            this.gainNode.gain.value = vol;
        }
    },

    getBgmTypeForMap: function (mapData) {
        if (!mapData) return 'field';
        const mapType = mapData.type;
        if (mapData.mapId && (
            mapData.mapId.includes('maou') ||
            mapData.mapId.includes('boss') ||
            mapData.mapId === 'area3_castle_b2'
        )) {
            return 'bossDungeon';
        }
        switch (mapType) {
            case 'field': return 'field';
            case 'town': return 'town';
            case 'castle': return 'castle';
            case 'dungeon': return 'dungeon';
            default: return 'field';
        }
    }
};

export function toggleSound() {
    soundEnabled = !soundEnabled;
    seEnabled = soundEnabled;
    bgmEnabled = soundEnabled;
    localStorage.setItem(SOUND_SETTING_KEY, soundEnabled);
    updateSoundToggleIcon();

    if (soundEnabled) {
        const titleScreen = document.getElementById('titleScreen');
        if (titleScreen && !titleScreen.classList.contains('hidden')) {
            BGM.play('title');
        }
    } else {
        BGM.stop();
    }
}

export function updateSoundToggleIcon() {
    const toggleBtn = document.getElementById('soundToggle');
    if (toggleBtn) {
        toggleBtn.textContent = soundEnabled ? '🔊' : '🔇';
        toggleBtn.classList.toggle('muted', !soundEnabled);
    }
}
