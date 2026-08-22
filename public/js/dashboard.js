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
        if (!username) return alert('Ingresa un usuario de TikTok');
        if (statusBadge) {
            statusBadge.className = 'badge status-connecting';
            statusBadge.textContent = 'Conectando...';
        }
        if (statusMsg) statusMsg.textContent = 'Intentando conectar con @' + username + '...';
        socket.emit('connectTikTok', username);
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
});

if (resetCounterBtn) {
    resetCounterBtn.addEventListener('click', function() {
        if (confirm('¡Estás seguro de que quieres poner el contador a 0?')) {
            socket.emit('resetCounter');
        }
    });
}

socket.on('counterReset', function(data) {
    if (currentCoinsEl) currentCoinsEl.textContent = data.coins;
    if (giftsLog) giftsLog.innerHTML = '<li class="empty">No hay donaciones recibidas aún.</li>';
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
    li.innerHTML = '<span><strong>' + escapeHtml(gift.nickname) + '</strong> (@' + escapeHtml(gift.uniqueId) + ') enviñ <strong>' + gift.giftCount + 'x ' + escapeHtml(gift.giftName) + '</strong></span>' +
        '<span style="color: #fbbf24; font-weight: bold;">+' + gift.coins + ' 🏵 <small style="color: #94a3b8;">(' + gift.timestamp + ')</small></span>';
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
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

if (copyUrlBtn && obsUrlInput) {
    copyUrlBtn.addEventListener('click', function() {
        obsUrlInput.select();
        document.execCommand('copy');
        copyUrlBtn.textContent = '¡Copiado!';
        setTimeout(function() { copyUrlBtn.textContent = 'Copiar URL'; }, 2000);
    });
}



document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-sim');
    if (btn) {
        const giftName = btn.getAttribute('data-gift');
        const coins = parseInt(btn.getAttribute('data-coins'), 10) || 1;
        window.simulateGift(giftName, coins, 1);
    }
});
