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
        if ('speechSynthesis' in window) {
            window.speechSynthesis.resume();
        }
        if (audioUnlockHint) {
            audioUnlockHint.classList.add('hidden');
        }
        console.log('🔊 Audio y Voz desbloqueados con éxito');
    } catch (e) {
        console.warn('Error al desbloquear audio:', e);
    }
}

// Desbloqueo al hacer clic en cualquier parte de la ventana
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

// Text-To-Speech (Voz de Mujer Dulce con doble sistema Cloud + Local)
let availableVoices = [];

function loadVoices() {
    if ('speechSynthesis' in window) {
        availableVoices = window.speechSynthesis.getVoices();
    }
}

if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

function getSweetFemaleVoice() {
    if (!availableVoices || availableVoices.length === 0) {
        loadVoices();
    }
    const voices = availableVoices || [];
    if (voices.length === 0) return null;

    const spanishVoices = voices.filter(v => v.lang.startsWith('es') || v.lang.includes('es_') || v.lang.includes('es-'));

    // Lista prioritaria de voces femeninas dulces
    const preferredFemaleNames = [
        'sabina', 'paulina', 'helena', 'laura', 'sofia', 'monica', 
        'penelope', 'lupe', 'mia', 'camila', 'paloma', 'elena', 
        'lucia', 'valeria', 'google español', 'female', 'mujer', 'zira'
    ];

    for (const name of preferredFemaleNames) {
        const found = spanishVoices.find(v => v.name.toLowerCase().includes(name));
        if (found) return found;
    }

    const maleNames = ['male', 'hombre', 'raul', 'jorge', 'pablo', 'david', 'enrique', 'carlos', 'mateo'];
    const nonMaleSpanish = spanishVoices.find(v => !maleNames.some(m => v.name.toLowerCase().includes(m)));
    if (nonMaleSpanish) return nonMaleSpanish;

    return spanishVoices[0] || voices[0];
}

function speakFemaleVoice(text) {
    if (!text) return;
    unlockAudio();

    // Limpiar emojis y caracteres especiales para que la voz suene limpia y dulce
    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '').trim();
    if (!cleanText) return;

    console.log('🎙️ Reproduciendo voz dulce:', cleanText);

    // 1. Intentar voz de chica con Cloud TTS
    try {
        const ttsUrl = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=es-ES&client=tw-ob&q=' + encodeURIComponent(cleanText);
        const cloudAudio = new Audio(ttsUrl);
        cloudAudio.volume = 1.0;

        const playPromise = cloudAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('✅ Voz femenina Cloud reproducida exitosamente');
            }).catch(err => {
                console.warn('Cloud TTS restringido por navegador, usando voz local:', err);
                fallbackLocalSpeech(cleanText);
            });
            return;
        }
    } catch (e) {
        console.warn('Error en Cloud TTS, cambiando a síntesis local:', e);
    }

    // 2. Fallback con Web Speech API local
    fallbackLocalSpeech(cleanText);
}

function fallbackLocalSpeech(cleanText) {
    if (!('speechSynthesis' in window)) return;
    try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-MX';
        utterance.rate = 1.05;
        utterance.pitch = 1.35; // Tono más agudo, dulce y femenino
        utterance.volume = 1.0;

        const sweetVoice = getSweetFemaleVoice();
        if (sweetVoice) {
            utterance.voice = sweetVoice;
            utterance.lang = sweetVoice.lang;
        }

        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.error('Error en síntesis local:', e);
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

    // Lectura con voz de mujer dulce
    const giftVoice = '¡Muchísimas gracias ' + donorName + ' por enviar ' + giftCount + ' ' + giftName + '!';
    speakFemaleVoice(giftVoice);

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

    // LEER EN VOZ ALTA DULCE
    const voiceMsg = data.voiceText || ('¡Hola ' + user + '! Alelí te manda un abrazo gigante.');
    speakFemaleVoice(voiceMsg);

    keywordAlert.classList.remove('hidden');

    if (keywordTimeout) clearTimeout(keywordTimeout);

    keywordTimeout = setTimeout(function() {
        keywordAlert.classList.add('hidden');
    }, 6000);
}