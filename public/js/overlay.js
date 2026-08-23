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
const keywordUser = document.getElementById('keyword-user');
const keywordComment = document.getElementById('keyword-comment');

let alertTimeout = null;
let keywordTimeout = null;

// Web Audio API Chime Synthesizer for OBS
let audioCtx = null;

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

    if (alertDonor) alertDonor.textContent = gift.nickname || gift.uniqueId || 'Donador';
    if (alertGift) alertGift.textContent = gift.giftName || 'Regalo';
    if (alertCount) alertCount.textContent = gift.giftCount || 1;
    if (alertCoins) alertCoins.textContent = gift.coins || 1;

    // Trigger visual particles & audio chime
    spawnPetals();
    playCuteChime();

    // Show alert
    bigGiftAlert.classList.remove('hidden');

    if (alertTimeout) clearTimeout(alertTimeout);

    alertTimeout = setTimeout(function() {
        bigGiftAlert.classList.add('hidden');
    }, 6000);
}

function showKeywordAlert(data) {
    if (!keywordAlert) return;

    if (keywordUser) keywordUser.textContent = data.nickname || data.uniqueId || 'Usuario';
    if (keywordComment) keywordComment.textContent = '\"' + (data.comment || 'Aleli') + '\"';

    spawnPetals();
    playCuteChime();

    keywordAlert.classList.remove('hidden');

    if (keywordTimeout) clearTimeout(keywordTimeout);

    keywordTimeout = setTimeout(function() {
        keywordAlert.classList.add('hidden');
    }, 5000);
}