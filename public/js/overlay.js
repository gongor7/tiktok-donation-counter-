const socket = io();


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

socket.on('stateUpdate', function(state) {
    updateGoalUI(state.coins, state.goal);
});

socket.on('goalUpdated', function(data) {
    updateGoalUI(data.coins, data.goal);
});

socket.on('counterReset', function(data) {
    updateGoalUI(data.coins, data.goal);
});

socket.on('giftReceived', function(data) {
    updateGoalUI(data.totalCoins, data.goal);
    showGiftPopup(data.gift);
});

function updateGoalUI(coins, goal) {
    coins = parseInt(coins, 10) || 0;
    goal = parseInt(goal, 10) || 1000;
    coinsVal.textContent = coins;
    goalVal.textContent = goal;

    let percentage = Math.min(Math.round((coins / goal) * 100), 100);
    progressBar.style.width = percentage + '%';
    progressPercent.textContent = percentage + '%';
}


function showGiftPopup(gift) {
    popupDonor.textContent = gift.nickname || gift.uniqueId;
    popupCount.textContent = gift.giftCount;
    popupGift.textContent = gift.giftName;
    popupCoins.textContent = gift.coins;

    giftPopup.classList.remove('hidden');

    if (popupTimeout) clearTimeout(popupTimeout);

    popupTimeout = setTimeout(function() {
        giftPopup.classList.add('hidden');
    }, 4000);
}