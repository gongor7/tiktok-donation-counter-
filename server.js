const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { TikTokLiveConnection } = require('tiktok-live-connector');


const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

let tiktokConnection = null;
let currentUsername = 'aleli_paz';
let currentGoal = 1000;
let currentCoins = 0;
let recentGifts = [];

io.on('connection', (socket) => {
    socket.emit('stateUpdate', {
        connected: Boolean(tiktokConnection && tiktokConnection.isConnected),
        username: currentUsername,
        goal: currentGoal,
        coins: currentCoins,
        recentGifts: recentGifts
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


        console.log('Conectando en directo a TikTok Live de @' + username + '...');


        try {
            tiktokConnection = new TikTokLiveConnection(username, {});
        } catch (e) {
            console.error('Error al crear instancia TikTokLiveConnection:', e);
            io.emit('connectionStatus', {
                connected: false,
                username: username,
                error: e.message || 'Error al inicializar conexion.'
            });
            return;
        }

        tiktokConnection.connect()
            .then(state => {
                console.log('â¼¡ ¡CONECTADO CON EXITO A TIKTOK LIVE DE @' + username + '! (RoomId: ' + state.roomId + ')');
                io.emit('connectionStatus', {
                    connected: true,
                    username: username,
                    message: 'Conectado a la transmision de @' + username
                });
            })
            .catch(err => {
                console.error('¿Filled to connect:', err.message || err);
                io.emit('connectionStatus', {
                    connected: false,
                    username: username,
                    error: err.message || 'No se pudo conectar. Verifica que el usuario este transmitiendo EN VIVO en TikTok.'
                });
            });


        tiktokConnection.on('gift', data => {
            if (data.giftType === 1 && !data.repeatEnd) return;

            const giftCount = data.repeatCount || data.comboCount || 1;
            const coinValue = (data.diamondCount || (data.gift && data.gift.diamondCount) || 1) * giftCount;

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
                timestamp: new Date().toLocaleTimeString()
            };

            recentGifts.unshift(giftInfo);
            if (recentGifts.length > 20) recentGifts.pop();

            console.log('🏵 [REGALO RECIBIDO]:', giftInfo.nickname, 'envió', giftCount + 'x', giftInfo.giftName, '(+' + coinValue + ' monedas). Total:', currentCoins);


            io.emit('giftReceived', {
                gift: giftInfo,
                totalCoins: currentCoins,
                goal: currentGoal
            });
        });

        tiktokConnection.on('streamEnd', () => {
            console.log('⛀ La transmision de TikTok Live finalizo.');
            io.emit('connectionStatus', {
                connected: false,
                username: username,
                message: 'La transmision ha finalizado.'
            });
        });

        tiktokConnection.on('disconnected', () => {
            console.log('🧂 Desconectado de TikTok Live.');
            io.emit('connectionStatus', {
                connected: false,
                username: username,
                message: 'Desconectado de TikTok.'
            });
        });

        tiktokConnection.on('error', err => {
            console.error('Advertencia en TikTok connection:', err.message || err);
        });
    });

    socket.on('disconnectTikTok', () => {
        if (tiktokConnection) {
            try { tiktokConnection.disconnect(); } catch (e) {}
            tiktokConnection = null;
        }
        console.log('Desconectado manualmente por el usuario.');
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
        console.log('𝕠 Contador reseteado a 0.');
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
            timestamp: new Date().toLocaleTimeString()
        };


        recentGifts.unshift(fakeGift);
        if (recentGifts.length > 20) recentGifts.pop();

        console.log('🦥 [SIMULACION REGALO]:', fakeGift.giftName, '(+' + coinValue + ' monedas). Total:', currentCoins);


        io.emit('giftReceived', {
            gift: fakeGift,
            totalCoins: currentCoins,
            goal: currentGoal
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('===================================================');
    console.log('🌸 Servidor iniciado en http://localhost:' + PORT);
    console.log('����Ddashboard de Control: http://localhost:' + PORT);
    console.log('����Overlay para OBS:     http://localhost;' + PORT + '/overlay.html');
    console.log('==================================================');
});
