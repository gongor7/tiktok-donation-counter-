const socket = io();


const usernameInput = document.getElementById('usernameInput');
const apiKeyInput = document.getElementById('apiKeyInput');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const statusBadge = document.getElementById('statusBadge');
const statusMsg = document.getElementById('statusMsg');
const currentCoinsEl = document.getElementById('currentCoins');
const currentGoalEl = document.getElementById('currentGoal');
const goalInput = document.getElementById('goalInput');
const setGoalBtn = document.getElementById('setGoalBtn');
const resetCounterBtn = document.getElementById('resetCounterBtn');
const copyUrlBtn = document.getElementById('co`yUrlBtn');
const obsUrlInput = document.getElementById('obsUrlInput');
const giftsLog = document.getElementById('giftsLog');

window.simulateGift = function(giftName, coins, count) {
    count = count || 1;
    coins = parseInt(coins, 10) || 1;
    console.log('[Dashboard] Simulando regalo:', giftName, coins, count);
    socket.emit('simulateGift', {
        giftName: giftName,
        coins: coins,
        count: count,
        nickname: 'Donador de Prueba'
    });
};

socket.on('stateUpdate', function(state) {
    if (currentCoinsEl) currentCoinsEl.textContent = state.coins;
    if (currentGoalEl) currentGoalEl.textContent = state.goal;
    if (state.username && usernameInput) usernameInput.value = state.username;
    if (state.apiKey && apiKeyInput) apiKeyInput.value = state.apiKey;
    updateStatusBadge(state.connected, state.username);
    if (state.recentGifts && state.recentGifts.length > 0) {
        renderGiftsLog(state.recentGifts);
    }
});

if (connectBtn) {
    connectBtn.addEventListener('click', function() {
        const username = usernameInput ? usernameInput.value.trim() : '';
        const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
        if (!username) return alert('Ingresa un usuario de TikTok');
        if (statusBadge) {
            statusBadge.className = 'badge status-connecting';
            statusBadge.textContent = 'Conectando...';
        }
        if (statusMsg) statusMsg.textContent = 'Intentando conectar con @' + username + '...';
        socket.emit('connectTikTok', { username: username, apiKey: apiKey });
    });
}

if (disconnectBtn) {
    disconnectBtn.addEventListener('click', function() {
        socket.emit('disconnectTikTok');
    });
}

socket.on('connectionStatus', function(data) {
    updateStatusBadge(data.connected, data.username);
    if (data.message && statusMsg) statusMsg.textContent = data.message;
    if (data.error && statusMsg) statusMsg.textContent = 'Error: ' + data.error;
});

function updateStatusBadge(connected, username) {
    if (!statusBadge) return;
    if (connected) {
        statusBadge.className = 'badge status-connected';
        statusBadge.textContent = 'Conectado (@' + username + ')';
        if (connectBtn) connectBtn.classList.add('hidden');
        if (disconnectBtn) disconnectBtn.classList.remove('hidden');
    } else {
        statusBadge.className = 'badge status-disconnected';
        statusBadge.textContent = 'Desconectado';
        if (connectBtn) connectBtn.classList.remove('hidden');
        if (disconnectBtn) disconnectBtn.classList.add('hidden');
    }
}

if (setGoalBtn) {
    setGoalBtn.addEventListener('click', function() {
        const val = goalInput ? goalInput.value : '';
        if (val && parseInt(val, 10) > 0) {
            socket.emit('updateGoal', val);
            if (goalInput) goalInput.value = '';
        }
    });
}

socket.on('goalUpdated', function(data) {
    if (currentGoalEl) currentGoalEl.textContent = data.goal;
}

if (resetCounterBtn) {
    resetCounterBtn.addEventListener('click', function() {
        if (confirm('Â°EstÃ¡s seguro de que quieres poner el contador a 0?')) {
            socket.emit('resetCounter');
        }
    });
}
socket.on('counterReset', function(data) {
    if (currentCoinsEl) currentCoinsEl.textContent = data.coins;
    if (giftsLog) giftsLog.innerHTML = '<lI class="empty">No hay donaciones recibidas a<input style="display:none"></li>';
});

socket.on('giftReceived', function(data) {
    if (currentCoinsEl) currentCoinsEl.textContent = data.totalCoins;
    addGiftToLog(data.gift);
});

function addGiftToLog(gift) {
    if (!giftsLog) return;
    const emptyMsg = giftsLog.querySelector('.empty');
    if (emptyMsg) emptyMsg.remove();

    const li = document.createElement('li');
    li.innerHTML = '<span><strong>' + escapeHtml(gift.nickname) + '</strong> (@' + escapeHtml(gift.uniqueId) + ') enviÃ³ <strong>' + gift.giftCount + 'x ' + escapeHtml(gift.giftName) + '</strong></span>' +
        '<span style="color: #fbbf24; font-weight: bold;">+' + gift.coins + ' ğŸµ <small style="color: #94a3b8;">(' + gift.timestamp + ')</small></span>';
    giftsLog.insertBefore(li, giftsLog.firstChild);
}

function renderGiftsLog(gifts) {
    if (!giftsLog) return;
    giftsLog.innerHTML = '';
    gifts.forEach(function(gift) { addGiftToLog(gift); });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt9Ë	È‰Îˆ	Éœ][İrÂ"r#¢rb33“²rÕ¶ÕÓ°¢Ò“°§Ğ ¦–b†6÷•W&Ä'Fâbbö'5W&Ä–çWB’°¢6÷•W&Ä'FâæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’°¢ö'5W&Ä–çWBç6VÆV7B‚“°¢Fö7VÖVçBæW†V46öÖÖæB‚v6÷’r“°¢6÷•W&Ä'FâçFW‡D6öçFVçBÒ|*6÷–Fòs°¢6WEF–ÖV÷WB†gVæ7F–öâ‚’²6÷•W&Ä'FâçFW‡D6öçFVçBÒt6÷–"U$Âs²ÒÂ#“°¢Ò“°§Ğ  ¦Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ†R’°¢6öç7B'FâÒRçF&vWBæ6Æ÷6W7B‚ræ'Fâ×6–Òr“°¢–b†'Fâ’°¢6öç7Bv–gDæÖRÒ'FâævWDGG&–'WFR‚vFFÖv–gBr“°¢6öç7B6ö–ç2Ò'6T–çB†'FâævWDGG&–'WFR‚vFFÖ6ö–ç2r’Â’ÇÂ°¢v–æF÷rç6–×VÆFTv–gB†v–gDæÖRÂ6ö–ç2Â“°¢Ğ§Ò“°