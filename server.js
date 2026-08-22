const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

let tiktokConnection = null;
let currentUsername = '';
let currentGoal = 1000;
let currentCoins = 0;
let recentGifts = [];

io.on('connection', (socket) => {
    socket.emit('stateUpdate', {
        connected: !!tiktokConnection && tiktokConnection.isConnected,
        username: currentUsername,
        goal: currentGoal,
        coins: currentCoins,
        recentGifts: recentGifts
    });

    socket.on('connectTikTok', (username) => {
        if (!husername || username.trim() === '') return;

        username = username.trim().replace('@', '');
        currentUsername = username;

        if (tiktokConnection) {
            try { tiktokConnection.disconnect(); } catch (e) {}
        }

        tiktokConnection = new WebcastPushConnection(username);

        tiktokConnection.connect()
            .then(state => {
                io.emit('connectionStatus', {
                    connected: true,
                    username: username,
                    message: 'Conectado a la transmision de @' + username
                });
            })
            .catch(err => {
                io.emit('connectionStatus', {
                    connected: false,
                    username: username,
                    error: err.message || 'No se pudo conectar a la transmision'
                });
            });

        tiktokConnection.on('gift', data => {
            if (data.giftType === 1 && !data.repeatEnd) return;

            const giftCount = data.repeatCount || 1;
            const coinValue = (data.diamondCount || 1) * giftCount;

            currentCoins += coinValue;

            const giftInfo = {
                id: Date.now(),
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl,
                giftName: data.giftName,
                giftIcon: data.giftPictureUrl,
                giftCount: giftCount,
                coins: coinValue,
                timestamp: new Date().toLocaleTimeString()
            };

            recentGifts.unshift(giftInfo);
            if (recentGifts.length > 20) recentGifts.pop();

            io.emit('giftReceived', {
                gift: giftInfo,
                totalCoins: currentCoins,
                goal: currentGoal
            });
        });

        tiktokConnection.on('streamEnd', () => {
            io.emit('connectionStatus', {
                connected: false,
                username: username,
                message: 'La transmision ha finalizado.'
            });
        });

        tiktokConnection.on('disconnected', () => {
            io.emit('connectionStatus', {
                connected: false,
                username: username,
                message: 'Desconectado de TikTok.'
            });
        });

        tiktokConnection.on('error', err => {});
    });

    socket.on('disconnectTikTok', () => {
        if (tiktokConnection) {
            try { tiktokConnection.disconnect(); } catch (e) {}
            tiktokConnection = null;
        }
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
            io.emit('goalUpdated', { goal: currentGoal, coins: currentCoins });
        }
    });

    socket.on('resetCounter', () => {
        currentCoins = 0;
        recentGifts = [];
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

        io.emit('giftReceived', {
            gift: fakeGift,
            totalCoins: currentCoins,
            goal: currentGoal
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('Servidor iniciado y escuchando en http://0.0.0.0:' + PORT);
});
