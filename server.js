const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { TikTokLiveConnection, SignConfig } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

let tiktokConnection = null;
let currentUsername = '';
let currentApiKey = process.env.EULER_API_KEY || '';
let currentGoal = 1000;
let currentCoins = 0;
let recentGifts = [];

io.on('connection', (socket) => {
    socket.emit('stateUpdate', {
        connected: !!tiktokConnection && tiktokConnection.isConnected,
        username: currentUsername,
        apiKey: currentApiKey,
        goal: currentGoal,
        coins: currentCoins,
        recentGifts: recentGifts
    });

    socket.on('connectTikTok', (data) => {
        let username = typeof data === 'string' ? data : (data && data.username);
        let apiKey = data && data.apiKey ? data.apiKey.trim() : currentApiKey;

        if (!username || username.trim() === '') return;

        username = username.trim().replace('@', '');
        currentUsername = username;
        if (apiKey) currentApiKey = apiKey;

        if (tiktokConnection) {
            try { tiktokConnection.disconnect(); } catch (e) {}
            tiktokConnection = null;
        }

        if (apiKey) {
            SignConfig.apiKey = apiKey;
        }

        console.log('Intentando conectar a la transmision LIVE de @' + username + '...');
        tiktokConnection = new TikTokLiveConnection(username, {
            processInitialData: true,
            enableExtendedGiftInfo: true
        });

        tiktokConnection.connect()
            .then(state => {
                console.log('CONECTADO CON EXITO A TIKTOK LIVE DE @' + username + '! RoomId: ' + state.roomId);
                io.emit('connectionStatus', {
                    connected: true,
                    username: username,
                    message: 'Conectado a la transmision de @' + username
                });
            })
            .catch(err => {
                console.error('Error al conectar a TikTok Live:', err.message || err);
                io.emit('connectionStatus', {
                    connected: false,
                    username: username,
                    error: err.message || 'No se pudo conectar. Verifica que el usuario este transmitiendo EN VIVO.'
                });
            });

        tiktokConnection.on('gift', data => {
            if (data.giftType === 1 && !data.repeatEnd) return;

            const giftCount = data.repeatCount || 1;
            const coinValue = (data.diamondCount || 1) * giftCount;

            currentCoins += coinValue;

            const giftInfo = {
                id: Date.now(),
                uniqueId: data.uniqueId || (data.user && data.user.uniqueId) || 'Anonimo',
                nickname: data.nickname || (data.user && data.user.nickname) || data.uniqueId || 'Donador',
                profilePictureUrl: data.profilePictureUrl || (data.user && data.user.profilePictureUrl) || '',
                giftName: data.giftName || (data.giftDetails && data.giftDetails.giftName) || 'Regalo',
                giftIcon: data.giftPictureUrl || '',
                giftCount: giftCount,
                coins: coinValue,
                timestamp: new Date().toLocaleTimeString()
            };

            recentGifts.unshift(giftInfo);
            if (recentGifts.length > 20) recentGifts.pop();

            console.log('[TIKTOK LIVE REGALO RECIBIDO]:', giftInfo.nickname, 'envio', giftCount + 'x', giftInfo.giftName, '(+', coinValue, 'monedas). Total:', currentCoins);

            io.emit('giftReceived', {
                gift: giftInfo,
                totalCoins: currentCoins,
                goal: currentGoal
            });
        });

        tiktokConnection.on('streamEnd', () => {
            console.log('La transmision de TikTok Live finalizo.');
            io.emit('connectionStatus', {
                connected: false,
                username: username,
                message: 'La transmision ha finalizado.'
            });
        });

        tiktokConnection.on('disconnected', () => {
            console.log('Desconectado de TikTok Live.');
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
            console.log('Nueva meta establecida:', currentGoal);
            io.emit('goalUpdated', { goal: currentGoal, coins: currentCoins });
        }
    });

    socket.on('resetCounter', () => {
        currentCoins = 0;
        recentGifts = [];
        console.log('Contador reseteado a 0.');
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

        console.log('[SIMULACION REGALO]:', fakeGift.giftName, '(+', coinValue, 'monedas). Total:', currentCoins);

        io.emit('giftReceived', {
            gift: fakeGift,
            totalCoins: currentCoins,
            goal: currentGoal
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('==================================================');
    console.log('Servidor iniciado en http://localhost:' + PORT);
    console.log('Dashboard de Control: http://localhost:' + PORT);
    console.log('Overlay para OBS: http://localhost:' + PORT + '/overlay.html');
    console.log('==================================================');
});