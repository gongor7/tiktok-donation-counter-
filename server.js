const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const tlc = require('tiktok-live-connector');

// Constructor universal compatible con cualquier versión de tiktok-live-connector (v1.x y v2.x)
function getTikTokConnectionClass() {
    if (typeof tlc.TikTokLiveConnection === 'function') return tlc.TikTokLiveConnection;
    if (typeof tlc.WebcastPushConnection === 'function') return tlc.WebcastPushConnection;
    if (typeof tlc === 'function') return tlc;
    if (tlc.default) {
        if (typeof tlc.default.TikTokLiveConnection === 'function') return tlc.default.TikTokLiveConnection;
        if (typeof tlc.default.WebcastPushConnection === 'function') return tlc.default.WebcastPushConnection;
        if (typeof tlc.default === 'function') return tlc.default;
    }
    throw new Error('No se encontró el constructor de TikTok Live en la librería.');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

// Endpoint de Voz de Mujer Dulce en Español
app.get('/api/tts', (req, res) => {
    const text = req.query.text || 'Hola';
    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '').trim();
    const url = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=es&q=' + encodeURIComponent(cleanText);

    https.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    }, (proxyRes) => {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        proxyRes.pipe(res);
    }).on('error', (err) => {
        console.error('Error al generar TTS femenino:', err.message);
        res.status(500).send('Error');
    });
});

let tiktokConnection = null;
let currentUsername = 'aleli_paz';
let currentGoal = 1000;
let currentCoins = 0;
let recentGifts = [];
let recentChats = [];
let ttsEnabled = true;

io.on('connection', (socket) => {
    console.log('⚡ Nuevo cliente WebSocket conectado:', socket.id);

    socket.emit('stateUpdate', {
        connected: Boolean(tiktokConnection && tiktokConnection.isConnected),
        username: currentUsername,
        goal: currentGoal,
        coins: currentCoins,
        recentGifts: recentGifts,
        recentChats: recentChats,
        ttsEnabled: ttsEnabled
    });

    socket.on('toggleVoice', (isEnabled) => {
        ttsEnabled = Boolean(isEnabled);
        console.log('🎙️ [CONFIG] Estado de Voz en Vivo TTS:', ttsEnabled ? 'ENCENDIDA' : 'APAGADA');
        io.emit('ttsToggled', ttsEnabled);
    });

    socket.on('connectTikTok', (data) => {
        let username = typeof data === 'string' ? data : (data && data.username);
        if (!username || username.trim() === '') return;

        username = username.trim().replace('@', '');
        currentUsername = username;

        if (tiktokConnection) {
            try { tiktokConnection.disconnect(); } catch (e) {}
            tiktokConnection = null;
        }

        console.log('🔄 Conectando en directo a TikTok Live de @' + username + '...');

        try {
            const ConnectionClass = getTikTokConnectionClass();
            tiktokConnection = new ConnectionClass(username, {});
        } catch (e) {
            console.error('❌ Error al instanciar conexión de TikTok:', e);
            io.emit('connectionStatus', {
                connected: false,
                username: username,
                error: e.message || 'Error al inicializar la conexión.'
            });
            return;
        }

        tiktokConnection.connect()
            .then(state => {
                const rId = (state && state.roomId) || (tiktokConnection && tiktokConnection.roomId) || 'Activo';
                console.log('✅ ¡CONECTADO CON ÉXITO A TIKTOK LIVE DE @' + username + '! (RoomId: ' + rId + ')');
                io.emit('connectionStatus', {
                    connected: true,
                    username: username,
                    message: 'Conectado a la transmisión de @' + username
                });
            })
            .catch(err => {
                console.error('❌ Error al conectar a TikTok Live:', err.message || err);
                io.emit('connectionStatus', {
                    connected: false,
                    username: username,
                    error: err.message || 'No se pudo conectar. Verifica que el usuario esté transmitiendo EN VIVO.'
                });
            });

        tiktokConnection.on('gift', data => {
            // Manejar regalos individuales y fin de combos
            if (data.giftType === 1 && data.repeatEnd === 0) return;

            const giftCount = data.repeatCount || data.comboCount || (data.gift && data.gift.repeat_count) || 1;
            const unitCoins = data.diamondCount || (data.gift && data.gift.diamondCount) || 1;
            const coinValue = unitCoins * giftCount;

            currentCoins += coinValue;

            const nick = (data.user && data.user.nickname) || data.nickname || data.uniqueId || 'Donador';
            const handle = (data.user && (data.user.displayId || data.user.uniqueId)) || data.uniqueId || nick;
            const gName = data.giftName || (data.gift && data.gift.name) || data.describe || 'Regalo';

            const giftInfo = {
                id: Date.now(),
                uniqueId: handle,
                nickname: nick,
                profilePictureUrl: (data.user && data.user.avatarThumb && data.user.avatarThumb.urlList && data.user.avatarThumb.urlList[0]) || '',
                giftName: gName,
                giftIcon: (data.gift && data.gift.image && data.gift.image.urlList && data.gift.image.urlList[0]) || '',
                giftCount: giftCount,
                coins: coinValue,
                voiceText: '¡Muchísimas gracias ' + nick + ' por enviar ' + giftCount + ' ' + gName + '!',
                audioUrl: '/api/tts?text=' + encodeURIComponent('¡Muchísimas gracias ' + nick + ' por enviar ' + giftCount + ' ' + gName + '!'),
                timestamp: new Date().toLocaleTimeString()
            };

            recentGifts.unshift(giftInfo);
            if (recentGifts.length > 20) recentGifts.pop();

            console.log('🎁 [TIKTOK LIVE REGALO RECIBIDO]:', giftInfo.nickname, 'envió', giftCount + 'x', giftInfo.giftName, '(+' + coinValue + ' monedas). Total:', currentCoins);

            io.emit('giftReceived', {
                gift: giftInfo,
                totalCoins: currentCoins,
                goal: currentGoal
            });
        });

        // Capturar comentarios del chat en vivo
        tiktokConnection.on('chat', data => {
            const comment = data.comment || data.content || '';
            const nick = (data.user && data.user.nickname) || data.nickname || data.uniqueId || 'Usuario';
            const handle = (data.user && (data.user.displayId || data.user.uniqueId)) || data.uniqueId || nick;

            const chatObj = {
                id: Date.now(),
                nickname: nick,
                uniqueId: handle,
                comment: comment,
                timestamp: new Date().toLocaleTimeString()
            };

            recentChats.unshift(chatObj);
            if (recentChats.length > 30) recentChats.pop();

            console.log('💬 [CHAT LIVE]:', nick, '(@' + handle + '):', comment);
            io.emit('chatMessage', chatObj);

            // Detección de palabras clave
            const lower = comment.toLowerCase();
            if (lower.includes('aleli') || lower.includes('alelí')) {
                const voiceMsg = '¡Hola ' + nick + '! Alelí te manda un abrazo gigante.';
                console.log('🌸 [TRIGGER ALELÍ DETECTADO]:', nick);
                io.emit('keywordAlert', {
                    type: 'aleli',
                    tag: '🌸 ¡HOLA! 🌸',
                    title: '¡Hola ' + nick + '! 🌸🐰💖',
                    message: '¡Gracias por saludar a Alelí! ✨',
                    voiceText: voiceMsg,
                    audioUrl: '/api/tts?text=' + encodeURIComponent(voiceMsg),
                    nickname: nick,
                    uniqueId: handle,
                    comment: comment,
                    timestamp: chatObj.timestamp
                });
            } else if (lower.includes('prueba') || lower.includes('test')) {
                const voiceMsg = '¡Hiciste la prueba ' + nick + '! El chat en vivo funciona perfecto.';
                console.log('🧪 [TRIGGER PRUEBA DETECTADO]:', nick);
                io.emit('keywordAlert', {
                    type: 'prueba',
                    tag: '🧪 ¡PRUEBA EXITOSA! 🧪',
                    title: '¡Hiciste la prueba ' + nick + '! ✨🎉',
                    message: '¡El sistema de chat en vivo funciona perfecto! 💖',
                    voiceText: voiceMsg,
                    audioUrl: '/api/tts?text=' + encodeURIComponent(voiceMsg),
                    nickname: nick,
                    uniqueId: handle,
                    comment: comment,
                    timestamp: chatObj.timestamp
                });
            }
        });

        tiktokConnection.on('streamEnd', () => {
            console.log('⚠️ La transmisión de TikTok Live finalizó.');
            io.emit('connectionStatus', {
                connected: false,
                username: username,
                message: 'La transmisión ha finalizado.'
            });
        });

        tiktokConnection.on('disconnected', () => {
            console.log('🔌 Desconectado de TikTok Live.');
            io.emit('connectionStatus', {
                connected: false,
                username: username,
                message: 'Desconectado de TikTok.'
            });
        });

        tiktokConnection.on('error', err => {
            console.error('⚠️ Advertencia en TikTok connection:', err.message || err);
        });
    });

    socket.on('disconnectTikTok', () => {
        if (tiktokConnection) {
            try { tiktokConnection.disconnect(); } catch (e) {}
            tiktokConnection = null;
        }
        console.log('🔌 Desconectado manualmente por el usuario.');
        io.emit('connectionStatus', {
            connected: false,
            username: currentUsername,
            message: 'Desconectado por el usuario.'
        });
    });

    socket.on('updateGoal', (newGoal) => {
        const parsed = parseInt(newGoal, 10);
        if (!isNaN(parsed) && parsed > 0) {
            currentGoal = parsed;
            console.log('🎯 Nueva meta establecida:', currentGoal);
            io.emit('goalUpdated', { goal: currentGoal, coins: currentCoins });
        }
    });

    socket.on('resetCounter', () => {
        currentCoins = 0;
        recentGifts = [];
        console.log('🔄 Contador reseteado a 0.');
        io.emit('counterReset', { coins: currentCoins, goal: currentGoal });
    });

    socket.on('simulateGift', (data) => {
        const giftCount = parseInt(data.count, 10) || 1;
        const coinValue = (parseInt(data.coins, 10) || 1) * giftCount;
        currentCoins += coinValue;

        const fakeGift = {
            id: Date.now(),
            uniqueId: 'DonantePrueba',
            nickname: data.nickname || 'Donador de Prueba',
            profilePictureUrl: '',
            giftName: data.giftName || 'Rosa',
            giftIcon: '',
            giftCount: giftCount,
            coins: coinValue,
            voiceText: '¡Muchísimas gracias ' + (data.nickname || 'Donador de Prueba') + ' por enviar ' + giftCount + ' ' + (data.giftName || 'Rosa') + '!',
            audioUrl: '/api/tts?text=' + encodeURIComponent('¡Muchísimas gracias ' + (data.nickname || 'Donador de Prueba') + ' por enviar ' + giftCount + ' ' + (data.giftName || 'Rosa') + '!'),
            timestamp: new Date().toLocaleTimeString()
        };

        recentGifts.unshift(fakeGift);
        if (recentGifts.length > 20) recentGifts.pop();

        console.log('🧪 [SIMULACION REGALO]:', fakeGift.giftName, '(+' + coinValue + ' monedas). Total:', currentCoins);

        io.emit('giftReceived', {
            gift: fakeGift,
            totalCoins: currentCoins,
            goal: currentGoal
        });
    });

    socket.on('simulateComment', (data) => {
        const comment = data.comment || '¡Hola Alelí!';
        const nick = data.nickname || 'Seguidor Fan';
        const handle = data.uniqueId || 'fan_aleli';

        const chatObj = {
            id: Date.now(),
            nickname: nick,
            uniqueId: handle,
            comment: comment,
            timestamp: new Date().toLocaleTimeString()
        };

        recentChats.unshift(chatObj);
        if (recentChats.length > 30) recentChats.pop();

        console.log('🧪 [SIMULACION CHAT]:', nick, ':', comment);
        io.emit('chatMessage', chatObj);

        const lower = comment.toLowerCase();
        if (lower.includes('aleli') || lower.includes('alelí')) {
            const voiceMsg = '¡Hola ' + nick + '! Alelí te manda un abrazo gigante.';
            io.emit('keywordAlert', {
                type: 'aleli',
                tag: '🌸 ¡HOLA! 🌸',
                title: '¡Hola ' + nick + '! 🌸🐰💖',
                message: '¡Gracias por saludar a Alelí! ✨',
                voiceText: voiceMsg,
                audioUrl: '/api/tts?text=' + encodeURIComponent(voiceMsg),
                nickname: nick,
                uniqueId: handle,
                comment: comment,
                timestamp: chatObj.timestamp
            });
        } else if (lower.includes('prueba') || lower.includes('test')) {
            const voiceMsg = '¡Hiciste la prueba ' + nick + '! El chat en vivo funciona perfecto.';
            io.emit('keywordAlert', {
                type: 'prueba',
                tag: '🧪 ¡PRUEBA EXITOSA! 🧪',
                title: '¡Hiciste la prueba ' + nick + '! ✨🎉',
                message: '¡El sistema de chat en vivo funciona perfecto! 💖',
                voiceText: voiceMsg,
                audioUrl: '/api/tts?text=' + encodeURIComponent(voiceMsg),
                nickname: nick,
                uniqueId: handle,
                comment: comment,
                timestamp: chatObj.timestamp
            });
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('==================================================');
    console.log('🌸 Servidor iniciado en http://localhost:' + PORT);
    console.log('💻 Panel de Control:   http://localhost:' + PORT);
    console.log('🎥 Overlay para OBS:    http://localhost:' + PORT + '/overlay.html');
    console.log('==================================================');
});
