const socket = io();

// DOM Elements
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
const chatLog = document.getElementById('chatLog');

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

window.simulateComment = function(commentText) {
    commentText = commentText || '¡Hola Alelí!';
    console.log('[Dashboard] Simulando comentario:', commentText);
    socket.emit('simulateComment', {
        comment: commentText,
        nickname: 'Seguidor Fan',
        uniqueId: 'fan_aleli'
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
    if (state.recentChats && state.recentChats.length > 0) {
        renderChatLog(state.recentChats);
    }
});

if (connectBtn) {
    connectBtn.addEventListener('click', function() {
        const username = usernameInput ? usernameInput.value.trim() : '';
        if (!username) return alert('Por favor, ingresa un usuario de TikTok');
        if (statusBadge) {
            statusBadge.className = 'badge status-connecting';
            statusBadge.textContent = 'Conectando...';
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
        statusBadge.textContent = '🟢 Conectado (@' + username + ')';
        if (connectBtn) connectBtn.classList.add('hidden');
        if (disconnectBtn) disconnectBtn.classList.remove('hidden');
    } else {
        statusBadge.className = 'badge status-disconnected';
        statusBadge.textContent = '⚪ Desconectado';
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
        if (confirm('¿Estás seguro de que quieres poner el contador a 0?')) {
            socket.emit('resetCounter');
        }
    });
}

socket.on('counterReset', function(data) {
    if (currentCoinsEl) currentCoinsEl.textContent = data.coins;
    if (giftsLog) giftsLog.innerHTML = '<li class="empty">Aún no se han recibido regalos en esta sesión 🌸</li>';
});

socket.on('giftReceived', function(data) {
    if (currentCoinsEl) currentCoinsEl.textContent = data.totalCoins;
    addGiftToLog(data.gift);
});

socket.on('chatMessage', function(chat) {
    addChatToLog(chat);
});

function addGiftToLog(gift) {
    if (!giftsLog) return;
    const emptyMsg = giftsLog.querySelector('.empty');
    if (emptyMsg) emptyMsg.remove();

    const li = document.createElement('li');
    li.innerHTML = '<span><strong style="color: #ff4c8e;">' + escapeHtml(gift.nickname) + '</strong> (@' + escapeHtml(gift.uniqueId) + ') envió <strong>' + gift.giftCount + 'x ' + escapeHtml(gift.giftName) + '</strong></span>' +
        '<span style="color: #ff477e; font-weight: 800; background: #fff0f5; padding: 4px 12px; border-radius: 15px; border: 1px solid #ffcde2;">+' + gift.coins + ' 🪙 <small style="color: #885870; font-weight: 500;">(' + gift.timestamp + ')</small></span>';
    giftsLog.insertBefore(li, giftsLog.firstChild);
}

function renderGiftsLog(gifts) {
    if (!giftsLog) return;
    giftsLog.innerHTML = '';
    gifts.forEach(function(gift) { addGiftToLog(gift); });
}

function addChatToLog(chat) {
    if (!chatLog) return;
    const emptyMsg = chatLog.querySelector('.empty');
    if (emptyMsg) emptyMsg.remove();

    const li = document.createElement('li');
    li.innerHTML = '<div class="chat-user-header">' +
        '<span class="chat-user-name">' + escapeHtml(chat.nickname) + '</span>' +
        '<span class="chat-user-handle">(@' + escapeHtml(chat.uniqueId) + ')</span>' +
        '<small style="color: #94a3b8; margin-left: auto;">' + chat.timestamp + '</small>' +
        '</div>' +
        '<div class="chat-text">' + escapeHtml(chat.comment) + '</div>';
    chatLog.insertBefore(li, chatLog.firstChild);

    // Limit chat history to 30 items
    while (chatLog.children.length > 30) {
        chatLog.removeChild(chatLog.lastChild);
    }
}

function renderChatLog(chats) {
    if (!chatLog) return;
    chatLog.innerHTML = '';
    chats.forEach(function(chat) { addChatToLog(chat); });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

if (copyUrlBtn && obsUrlInput) {
    copyUrlBtn.addEventListener('click', function() {
        obsUrlInput.select();
        document.execCommand('copy');
        copyUrlBtn.textContent = '¡Copiado!';
        setTimeout(function() { copyUrlBtn.textContent = '📋 Copiar'; }, 2000);
    });
}
