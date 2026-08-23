const socket = io();

// DOM Elements
const coinsVal = document.getElementById('coins-val');
const goalVal = document.getElementById('goal-val');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const particlesContainer = document.getElementById('particles-container');

// Super Big Alert Elements
const bigGiftAlert = document.getElementById('big-gift-alert');
const alertDonor = document.getElementById('alert-donor');
const alertGift = document.getElementById('alert-gift');
const alertCount = document.getElementById('alert-count');
const alertCoins = document.getElementById('alert-coins');
const alertImg = document.getElementById('alert-img');

// Keyword Alert Elements
const keywordAlert = document.getElementById('keyword-alert');
const keywordTag = document.getElementById('keyword-tag');
const keywordTitle = document.getElementById('keyword-title');
const keywordMsg = document.getElementById('keyword-msg');
const audioUnlockHint = document.getElementById('audio-unlock-hint');

let alertTimeout = null;
let keywordTimeout = null;
let audioUnlocked = false;

// Web Audio API Chime Synthesizer for OBS
let audioCtx = null;

function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        if (audioUnlockHint) {
            audioUnlockHint.classList.add('hidden');
        }
        console.log('🔊 Audio desbloqueado con éxito');
    } catch (e) {
        console.warn('Error al desbloquear audio:', e);
    }
}

// Desbloqueo al hacer clic en cualquier parte de la pantalla
window.addEventListener('click', unlockAudio);
window.addEventListener('keydown', unlockAudio);
window.addEventListener('touchstart', unlockAudio);
if (audioUnlockHint) {
    audioUnlockHint.addEventListener('click', unlockAudio);
}

function playCuteChime() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Cute chime)
        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + (i * 0.08));

            gain.gain.setValueAtTime(0, audioCtx.currentTime + (i * 0.08));
            gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + (i * 0.08) + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (i * 0.08) + 0.5);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(audioCtx.currentTime + (i * 0.08));
            osc.stop(audioCtx.currentTime + (i * 0.08) + 0.55);
        });
    } catch (e) {
        console.warn('Audio note error:', e);
    }
}

// Reproductor de Voz Femenina Auténtica (Audio Stream del Servidor)
function playFemaleVoice(audioUrl, fallbackText) {
    unlockAudio();
    const url = audioUrl || ('/api/tts?text=' + encodeURIComponent(fallbackText || 'Hola'));
    
    console.log('🎙️ Reproduciendo voz femenina desde:', url);
    try {
        const audio = new Audio(url);
        audio.volume = 1.0;
        audio.play().then(() => {
            console.log('✅ Voz femenina reproducida con éxito');
        }).catch(err => {
            console.warn('Audio play bloqueado por el navegador (requiere un clic):', err);
        });
    } catch (e) {
        console.error('Error al reproducir audio:', e);
    }
}

// Particle explosion
function spawnPetals() {
    if (!particlesContainer) return;
    const icons = ['🌸', '💖', '✨', '🌹', '🪙', '✨', '🌸', '💫'];
    for (let i = 0; i < 20; i++) {
        const span = document.createElement('span');
        span.className = 'petal-particle';
        span.textContent = icons[Math.floor(Math.random() * icons.length)];
        span.style.left = (Math.random() * 85 + 5) + '%';
        span.style.top = (Math.random() * 50 + 20) + '%';
        span.style.animationDelay = (Math.random() * 0.3) + 's';
        span.style.fontSize = (Math.random() * 18 + 22) + 'px';
        particlesContainer.appendChild(span);

        setTimeout(() => span.remove(), 3200);
    }
}

// Sockets Listeners
socket.on('connect', function() {
    console.log('✅ Overlay conectado al servidor Socket.io');
});

socket.on('stateUpdate', function(state) {
    console.log('Overlay stateUpdate:', state);
    updateGoalUI(state.coins, state.goal, false);
});

socket.on('goalUpdated', function(data) {
    console.log('Overlay goalUpdated:', data);
    updateGoalUI(data.coins, data.goal, true);
});

socket.on('counterReset', function(data) {
    console.log('Overlay counterReset:', data);
    updateGoalUI(data.coins, data.goal, false);
});

socket.on('giftReceived', function(data) {
    console.log('🎁 Overlay giftReceived:', data);
    updateGoalUI(data.totalCoins, data.goal, true);
    if (data.gift) {
        showSuperBigAlert(data.gift);
    }
});

socket.on('keywordAlert', function(data) {
    console.log('🌸 Overlay keywordAlert recibido:', data);
    showKeywordAlert(data);
});

function updateGoalUI(coins, goal, shouldBump) {
    coins = parseInt(coins, 10) || 0;
    goal = parseInt(goal, 10) || 1000;

    if (coinsVal) {
        coinsVal.textContent = coins;
        if (shouldBump) {
            coinsVal.classList.remove('bump');
            void coinsVal.offsetWidth; // Reflow
            coinsVal.classList.add('bump');
            setTimeout(() => coinsVal.classList.remove('bump'), 450);
        }
    }

    if (goalVal) {
        goalVal.textContent = goal;
    }

    const rawPercentage = (coins / goal) * 100;
    const clampedPercentage = Math.min(Math.max(rawPercentage, 0), 100);

    // Make sure bar is at least 4% visible so 1 coin is immediately noticeable
    const displayBarWidth = coins > 0 ? Math.max(4, clampedPercentage) : 0;

    if (progressBar) {
        progressBar.style.width = displayBarWidth + '%';
    }

    if (progressPercent) {
        if (clampedPercentage === 0) {
            progressPercent.textContent = '0%';
        } else if (clampedPercentage < 10) {
            progressPercent.textContent = clampedPercentage.toFixed(1) + '%';
        } else {
            progressPercent.textContent = Math.round(clampedPercentage) + '%';
        }
    }
}

function showSuperBigAlert(gift) {
    if (!bigGiftAlert) return;

    const donorName = gift.nickname || gift.uniqueId || 'Donador';
    const giftName = gift.giftName || 'Regalo';
    const giftCount = gift.giftCount || 1;
    const coins = gift.coins || 1;

    if (alertDonor) alertDonor.textContent = donorName;
    if (alertGift) alertGift.textContent = giftName;
    if (alertCount) alertCount.textContent = giftCount;
    if (alertCoins) alertCoins.textContent = coins;

    // Trigger visual particles & audio chime
    spawnPetals();
    playCuteChime();

    // Reproducir voz femenina real
    playFemaleVoice(gift.audioUrl, '¡Muchísimas gracias ' + donorName + ' por enviar ' + giftCount + ' ' + giftName + '!');

    // Show alert
    bigGiftAlert.classList.remove('hidden');

    if (alertTimeout) clearTimeout(alertTimeout);

    alertTimeout = setTimeout(function() {
        bigGiftAlert.classList.add('hidden');
    }, 6500);
}

function showKeywordAlert(data) {
    if (!keywordAlert) return;

    const user = data.nickname || data.uniqueId || 'Amigo';
    if (keywordTag) keywordTag.textContent = data.tag || '🌸 ¡HOLA! 🌸';
    if (keywordTitle) keywordTitle.textContent = data.title || ('¡Hola ' + user + '! 🌸🐰💖');
    if (keywordMsg) keywordMsg.textContent = data.message || '¡Gracias por participar en el en vivo! ✨';

    spawnPetals();
    playCuteChime();

    // Reproducir voz femenina real
    playFemaleVoice(data.audioUrl, data.voiceText || ('¡Hola ' + user + '! Alelí te manda un abrazo gigante.'));

    keywordAlert.classList.remove('hidden');

    if (keywordTimeout) clearTimeout(keywordTimeout);

    keywordTimeout = setTimeout(function() {
        keywordAlert.classList.add('hidden');
    }, 6000);
}