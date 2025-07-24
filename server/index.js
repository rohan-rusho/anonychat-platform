const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Queue system for matchmaking - NO DATA PERSISTENCE
// All data is temporary and stored only in memory during session
let waitingUsers = [];
let activeConnections = new Map();
let reportedUsers = []; // Temporary reports only, not stored permanently

// Socket handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join matchmaking queue
    socket.on('join_queue', (data) => {
        const { chatType, interests } = data;
        const user = {
            id: socket.id,
            chatType,
            interests: interests || [],
            joinTime: Date.now()
        };

        // Try to find a match
        const match = findMatch(user);

        if (match) {
            // Remove matched user from waiting queue
            waitingUsers = waitingUsers.filter(u => u.id !== match.id);

            // Create room for both users
            const roomId = `room_${socket.id}_${match.id}`;

            socket.join(roomId);
            io.sockets.sockets.get(match.id)?.join(roomId);

            // Store active connection
            activeConnections.set(socket.id, { partnerId: match.id, roomId, chatType });
            activeConnections.set(match.id, { partnerId: socket.id, roomId, chatType });

            // Notify both users
            socket.emit('partner_found', {
                partnerId: match.id,
                roomId,
                chatType,
                isInitiator: true
            });

            io.to(match.id).emit('partner_found', {
                partnerId: socket.id,
                roomId,
                chatType,
                isInitiator: false
            });

            console.log(`Match found: ${socket.id} <-> ${match.id}`);
        } else {
            // Add to waiting queue
            waitingUsers.push(user);
            socket.emit('waiting_for_partner');
            console.log(`User ${socket.id} added to queue`);
        }
    });

    // Handle text messages
    socket.on('send_message', (data) => {
        const connection = activeConnections.get(socket.id);
        if (connection) {
            const { message, timestamp } = data;

            // Basic profanity filter (you can enhance this)
            const filteredMessage = filterProfanity(message);

            io.to(connection.partnerId).emit('receive_message', {
                message: filteredMessage,
                timestamp,
                senderId: socket.id
            });
        }
    });

    // Handle typing indicators
    socket.on('typing', () => {
        const connection = activeConnections.get(socket.id);
        if (connection) {
            io.to(connection.partnerId).emit('partner_typing');
        }
    });

    socket.on('stopped_typing', () => {
        const connection = activeConnections.get(socket.id);
        if (connection) {
            io.to(connection.partnerId).emit('partner_stopped_typing');
        }
    });

    // WebRTC signaling
    socket.on('video_offer', (data) => {
        const connection = activeConnections.get(socket.id);
        if (connection) {
            io.to(connection.partnerId).emit('video_offer', {
                offer: data.offer,
                from: socket.id
            });
        }
    });

    socket.on('video_answer', (data) => {
        const connection = activeConnections.get(socket.id);
        if (connection) {
            io.to(connection.partnerId).emit('video_answer', {
                answer: data.answer,
                from: socket.id
            });
        }
    });

    socket.on('ice_candidate', (data) => {
        const connection = activeConnections.get(socket.id);
        if (connection) {
            io.to(connection.partnerId).emit('ice_candidate', {
                candidate: data.candidate,
                from: socket.id
            });
        }
    });

    // Handle disconnect/skip
    socket.on('disconnect_user', () => {
        handleDisconnection(socket.id);
    });

    // Handle user reports
    socket.on('report_user', (data) => {
        const connection = activeConnections.get(socket.id);
        if (connection) {
            const report = {
                reporterId: socket.id,
                reportedUserId: connection.partnerId,
                reason: data.reason,
                message: data.message,
                timestamp: Date.now(),
                sessionId: connection.roomId
            };

            reportedUsers.push(report);
            console.log('User reported:', report);

            socket.emit('report_submitted');

            // Auto-disconnect reported user after multiple reports
            const reportsCount = reportedUsers.filter(r => r.reportedUserId === connection.partnerId).length;
            if (reportsCount >= 3) {
                io.to(connection.partnerId).emit('banned', { reason: 'Multiple reports' });
                handleDisconnection(connection.partnerId);
            }
        }
    });

    // Handle socket disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        handleDisconnection(socket.id);
    });
});

// Helper functions
function findMatch(user) {
    // Simple matching logic - can be enhanced with interests
    for (let waitingUser of waitingUsers) {
        if (waitingUser.chatType === user.chatType) {
            // If interests are provided, try to match them
            if (user.interests.length > 0 && waitingUser.interests.length > 0) {
                const commonInterests = user.interests.filter(interest =>
                    waitingUser.interests.includes(interest)
                );
                if (commonInterests.length > 0) {
                    return waitingUser;
                }
            } else {
                return waitingUser;
            }
        }
    }

    // If no interest match found, return any user with same chat type
    return waitingUsers.find(u => u.chatType === user.chatType);
}

function handleDisconnection(userId) {
    const connection = activeConnections.get(userId);

    if (connection) {
        // Notify partner
        io.to(connection.partnerId).emit('partner_disconnected');

        // Clean up both connections
        activeConnections.delete(userId);
        activeConnections.delete(connection.partnerId);

        // Remove from rooms
        const userSocket = io.sockets.sockets.get(userId);
        const partnerSocket = io.sockets.sockets.get(connection.partnerId);

        if (userSocket) userSocket.leave(connection.roomId);
        if (partnerSocket) partnerSocket.leave(connection.roomId);
    }

    // Remove from waiting queue
    waitingUsers = waitingUsers.filter(u => u.id !== userId);
}

function filterProfanity(message) {
    // Basic profanity filter - you can enhance this with a proper library
    const badWords = ['spam', 'scam', 'hate']; // Add more words as needed
    let filteredMessage = message;

    badWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filteredMessage = filteredMessage.replace(regex, '*'.repeat(word.length));
    });

    return filteredMessage;
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/chat.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/terms.html'));
});

app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/report.html'));
});

// API endpoints
app.get('/api/reports', (req, res) => {
    res.json({
        totalReports: reportedUsers.length,
        recentReports: reportedUsers.slice(-10)
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to start chatting`);
});
