const socket = io();

// DOM Elements
const coinsVal = document.getElementById('coins-val');
const goalVal = document.getElementById('goal-val');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');

const giftPopup = document.getElementById('gift-popup');
const popupDonor = document.getElementById('popup-donor');
const popupCount = document.getElementById('popup-count');
const popupGift = document.getElementById('popup-gift');
const popupCoins = document.getElementById('popup-coins');

let popupTimeout = null;

socket.on('connect', function() {
    console.log('✅ Overlay conectado al servidor Socket.io');
});

socket.on('stateUpdate', function(state) {
    console.log('Overlay stateUpdate recibido:', state);
    updateGoalUI(state.coins, state.goal);
});

socket.on('goalUpdated', function(data) {
    console.log('Overlay goalUpdated recibido:', data);
    updateGoalUI(data.coins, data.goal);
});

socket.on('counterReset', function(data) {
    console.log('Overlay counterReset recibido:', data);
    updateGoalUI(data.coins, data.goal);
});

socket.on('giftReceived', function(data) {
    console.log('🎁 Overlay giftReceived recibido:', data);
    updateGoalUI(data.totalCoins, data.goal);
    if (data.gift) {
        showGiftPopup(data.gift);
    }
});

function updateGoalUI(coins, goal) {
    coins = parseInt(coins, 10) || 0;
    goal = parseInt(goal, 10) || 1000;
    if (coinsVal) coinsVal.textContent = coins;
    if (goalVal) goalVal.textContent = goal;

    let percentage = Math.min(Math.round((coins / goal) * 100), 100);
    if (progressBar) progressBar.style.width = percentage + '%';
    if (progressPercent) progressPercent.textContent = percentage + '%';
}

function showGiftPopup(gift) {
    if (!giftPopup || !popupDonor || !popupCount || !popupGift || !popupCoins) return;

    popupDonor.textContent = gift.nickname || gift.uniqueId || 'Donador';
    popupCount.textContent = gift.giftCount || 1;
    popupGift.textContent = gift.giftName || 'Regalo';
    popupCoins.textContent = gift.coins || 1;

    giftPopup.classList.remove('hidden');

    if (popupTimeout) clearTimeout(popupTimeout);

    popupTimeout = setTimeout(function() {
        giftPopup.classList.add('hidden');
    }, 4500);
}