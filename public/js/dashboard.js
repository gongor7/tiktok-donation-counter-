const socket = io();


const usernameInput = document.getElementById('usernameInput');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const statusBadge = document.getElementById('statusBadge');
const statusMsg = document.getElementById('statusMsg');
const currentCoinsEl = document.getElementById('currentCoins');
const currentGoalEl = document.getElementById('currentGoal');
const goalInput = document.getElementById('goalInput');
const setGoalBtn = document.getElementById('setGoalBtn');
const resetCounterBtn = document.getElementById('resetCounterBtn');
const copyUrlBtn = document.getElementById('copyUrlBtn');
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
    updateStatusBadge(state.connected, state.username);
    if (state.recentGifts && state.recentGifts.length > 0) {
        renderGiftsLog(state.recentGifts);
    }
});

if (connectBtn) {
    connectBtn.addEventListener('click', function() {
        const username = usernameInput ? usernameInput.value.trim() : '';
        if (!username) return alert('Por favor, ingresa un usuario de TikTok');
        if (statusBadge) {
            statusBadge.className = 'badge status-connecting';
            statusBadge.textContent = 'â¦¬ Conectando...';
        }
        if (statusMsg) statusMsg.textContent = 'Intentando conectar con @' + username + '...';
        socket.emit('connectTikTok', { username: username });
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
        statusBadge.textContent = 'ğŸ§¡ Conectado (@' + username + ')';
        if (connectBtn) connectBtn.classList.add('hidden');
        if (disconnectBtn) disconnectBtn.classList.remove('hidden');
    } else {
        statusBadge.className = 'badge status-disconnected';
        statusBadge.textContent = 'âšª Desconectado';
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
});


if (resetCounterBtn) {
    resetCounterBtn.addEventListener('click', function() {
        if (confirm('Â¿EstÃ¡s seguro de que quieres poner el contador a 0?')) {
            socket.emit('resetCounter');
        }
    });
}

socket.on('counterReset', function(data) {
    if (currentCoinsEl) currentCoinsEl.textContent = data.coins;
    if (giftsLog) giftsLog.innerHTML = '<[I class="empty">AÃºn no se han recibido regalos en esta sesiÃ³n ğŸŒ¸</li>';
    if (giftsLog) giftsLog.innerHTML = '<li class="empty">AÃºn no se han recibido regalos en esta sesiÃ³n ğŸŒ¸</li>';
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
    li.innerHTML = '<span><strong style="color: #ff4c8e;">' + escapeHtml(gift.nickname) + '</strong> (@' + escapeHtml(gift.uniqueId) + ') enviÃ³ <strong>' + gift.giftCount + 'x ' + escapeHtml(gift.giftName) + '</strong></span>' +
        '<span style="color: #ff477e; font-weight: 800; background: #fff0f5; padding: 4px 12px; border-radius: 15px; border: 1px solid #ffcde2;">+' + gift.coins + ' ğŸµ <small style="color: #885870; font-weight: 500;">(' + gift.timestamp + ')</small></span>';
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
        return { '&': '&amp;', '<': '&lt;', '>': '&gt9Ë	È‰Îˆ	Éœ][İrÂ"r#¢rb33“²rÕ¶ÕÓ°¢Ò“°§Ğ  ¦–b†6÷•W&Ä'Fâbbö'5W&Ä–çWB’°¢6÷•W&Ä'FâæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’°¢ö'5W&Ä–çWBç6VÆV7B‚“°¢Fö7VÖVçBæW†V46öÖÖæB‚v6÷’r“°¢6÷•W&Ä'FâçFW‡D6öçFVçBÒ	ù+*6÷–Fòs°¢6WEF–ÖV÷WB†gVæ7F–öâ‚’²6÷•W&Ä'FâçFW‡D6öçFVçBÒ	ù8²6÷–"s²ÒÂ#“°¢Ò“°§Ğ 