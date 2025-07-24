// Chat page functionality
// 🔒 PRIVACY FIRST: All data stored locally on user's device only
// 🎤 Live audio/video streaming - NO recording or server storage
// 📱 User preferences and session data stored in browser's local storage
class ChatManager {
    constructor() {
        this.socket = null;
        this.webrtc = null;
        this.chatData = null;
        this.partnerId = null;
        this.roomId = null;
        this.chatType = null;
        this.isConnected = false;
        this.typingTimer = null;
        this.messageHistory = []; // Temporary in-memory only, not persisted

        this.init();
    }

    async init() {
        try {
            // Get chat data from sessionStorage (local device only)
            this.chatData = JSON.parse(sessionStorage.getItem('chatData') || '{}');

            // Load user preferences from local storage
            this.loadUserPreferences();

            if (!this.chatData.partnerId) {
                this.showError('No chat session found. Redirecting to home...');
                setTimeout(() => window.location.href = '/', 2000);
                return;
            }

            this.partnerId = this.chatData.partnerId;
            this.roomId = this.chatData.roomId;
            this.chatType = this.chatData.chatType;

            console.log('🔒 Chat Manager initialized with local data only:', this.chatData);
            console.log('🎤 Live audio mode - no recording or server storage');

            this.setupUI();
            this.setupEventListeners();
            this.connectSocket();

            // Initialize WebRTC for video/audio chat
            if (this.chatType === 'video' || this.chatType === 'audio') {
                await this.initializeWebRTC();
            }

        } catch (error) {
            console.error('Error initializing chat manager:', error);
            this.showError('Failed to initialize chat. Please try again.');
        }
    }

    // Load user preferences from local storage only
    loadUserPreferences() {
        const preferences = localStorage.getItem('anonyChat_preferences');
        if (preferences) {
            try {
                this.userPreferences = JSON.parse(preferences);
                console.log('🔒 User preferences loaded from device storage');
            } catch (error) {
                this.userPreferences = this.getDefaultPreferences();
            }
        } else {
            this.userPreferences = this.getDefaultPreferences();
        }
    }

    // Default user preferences (stored locally only)
    getDefaultPreferences() {
        return {
            audioEnabled: true,
            videoEnabled: true,
            autoJoinAudio: true,
            audioQuality: 'high',
            privacyMode: true, // Always maintain privacy
            notifications: true
        };
    }

    // Save preferences to local storage
    saveUserPreferences() {
        try {
            localStorage.setItem('anonyChat_preferences', JSON.stringify(this.userPreferences));
            console.log('🔒 User preferences saved to device storage');
        } catch (error) {
            console.warn('Could not save preferences to local storage:', error);
        }
    }

    setupUI() {
        // Show/hide sections based on chat type
        const videoSection = document.getElementById('videoSection');
        const textSection = document.getElementById('textSection');

        if (this.chatType === 'video') {
            if (videoSection) videoSection.style.display = 'block';
            if (textSection) {
                textSection.style.flex = '0 0 300px';
                textSection.style.borderTop = '1px solid var(--border-color)';
            }
        } else if (this.chatType === 'audio') {
            // Audio-only mode: show audio controls but hide video elements
            if (videoSection) {
                videoSection.style.display = 'block';
                // Hide video elements, show audio controls only
                const videos = videoSection.querySelectorAll('video');
                videos.forEach(video => video.style.display = 'none');

                // Add audio indicator
                const audioIndicator = document.createElement('div');
                audioIndicator.className = 'audio-mode-indicator';
                audioIndicator.innerHTML = `
                    <div style="text-align: center; padding: 2rem; background: var(--bg-tertiary); border-radius: var(--radius-lg);">
                        <span style="font-size: 4rem;">🎤</span>
                        <h3>Audio Chat Mode</h3>
                        <p>Voice-only conversation - no video</p>
                    </div>
                `;
                videoSection.appendChild(audioIndicator);
            }
            if (textSection) {
                textSection.style.flex = '0 0 300px';
                textSection.style.borderTop = '1px solid var(--border-color)';
            }
        } else {
            if (videoSection) videoSection.style.display = 'none';
            if (textSection) textSection.style.flex = '1';
        }

        // Update status
        this.updateStatus('connecting', 'Connecting...');

        // Show waiting message
        this.showConnectionMessage('waiting');
    } setupEventListeners() {
        // Message input and send
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');

        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            messageInput.addEventListener('input', () => {
                this.handleTyping();
            });

            messageInput.addEventListener('focus', () => {
                this.scrollToBottom();
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Control buttons
        const nextBtn = document.getElementById('nextBtn');
        const stopBtn = document.getElementById('stopBtn');
        const reportBtn = document.getElementById('reportBtn');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.findNewPartner());
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopChat());
        }

        if (reportBtn) {
            reportBtn.addEventListener('click', () => this.showReportModal());
        }

        // Video controls
        const toggleVideoBtn = document.getElementById('toggleVideoBtn');
        const toggleAudioBtn = document.getElementById('toggleAudioBtn');

        if (toggleVideoBtn) {
            toggleVideoBtn.addEventListener('click', () => {
                if (this.webrtc) {
                    this.webrtc.toggleVideo();
                }
            });
        }

        if (toggleAudioBtn) {
            toggleAudioBtn.addEventListener('click', () => {
                if (this.webrtc) {
                    this.webrtc.toggleAudio();
                }
            });
        }

        // Modal handlers
        this.setupModalHandlers();

        // Retry button
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.findNewPartner());
        }
    }

    setupModalHandlers() {
        // Report modal
        const reportModal = document.getElementById('reportModal');
        const cancelReport = document.getElementById('cancelReport');
        const reportForm = document.getElementById('reportForm');

        if (cancelReport) {
            cancelReport.addEventListener('click', () => {
                if (reportModal) reportModal.classList.remove('active');
            });
        }

        if (reportForm) {
            reportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitReport();
            });
        }

        // Confirm modal
        const confirmModal = document.getElementById('confirmModal');
        const confirmCancel = document.getElementById('confirmCancel');
        const confirmOk = document.getElementById('confirmOk');

        if (confirmCancel) {
            confirmCancel.addEventListener('click', () => {
                if (confirmModal) confirmModal.classList.remove('active');
            });
        }

        if (confirmOk) {
            confirmOk.addEventListener('click', () => {
                if (confirmModal) confirmModal.classList.remove('active');
                if (this.pendingAction) {
                    this.pendingAction();
                    this.pendingAction = null;
                }
            });
        }
    }

    connectSocket() {
        try {
            this.socket = io();

            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.updateStatus('waiting', 'Connected - Waiting for partner...');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.updateStatus('disconnected', 'Disconnected');
                this.isConnected = false;
                this.showConnectionMessage('disconnected');
            });

            this.socket.on('partner_found', (data) => {
                console.log('Partner connected:', data);
                this.handlePartnerConnected(data);
            });

            this.socket.on('partner_disconnected', () => {
                console.log('Partner disconnected');
                this.handlePartnerDisconnected();
            });

            this.socket.on('receive_message', (data) => {
                this.receiveMessage(data);
            });

            this.socket.on('partner_typing', () => {
                this.showTypingIndicator();
            });

            this.socket.on('partner_stopped_typing', () => {
                this.hideTypingIndicator();
            });

            this.socket.on('report_submitted', () => {
                this.showSuccess('Report submitted successfully');
                const reportModal = document.getElementById('reportModal');
                if (reportModal) reportModal.classList.remove('active');
            });

            this.socket.on('banned', (data) => {
                this.showError(`You have been banned: ${data.reason}`);
                setTimeout(() => window.location.href = '/', 3000);
            });

            // Set up WebRTC socket if needed
            if (this.webrtc) {
                this.webrtc.setSocket(this.socket);
            }

        } catch (error) {
            console.error('Socket connection error:', error);
            this.showError('Failed to connect to server');
        }
    }

    async initializeWebRTC() {
        if (!WebRTCManager.isSupported()) {
            this.showError('WebRTC is not supported in your browser. Please use a modern browser for video chat.');
            return;
        }

        try {
            this.webrtc = new WebRTCManager();

            // Override connection event handlers
            this.webrtc.onConnectionEstablished = () => {
                console.log('WebRTC connection established');
                this.showSuccess('Video connection established');
            };

            this.webrtc.onConnectionLost = () => {
                console.log('WebRTC connection lost');
                this.showError('Video connection lost');
            };

            // Set socket when available
            if (this.socket) {
                this.webrtc.setSocket(this.socket);
            }

        } catch (error) {
            console.error('Error initializing WebRTC:', error);
            this.showError('Failed to initialize video chat');
        }
    }

    handlePartnerConnected(data) {
        this.isConnected = true;
        this.updateStatus('connected', 'Connected with stranger');
        this.showConnectionMessage('connected');

        // Start video/audio if needed
        if ((this.chatType === 'video' || this.chatType === 'audio') && this.webrtc) {
            this.webrtc.startVideoChat().catch(error => {
                console.error('Error starting media chat:', error);
                const mediaType = this.chatType === 'audio' ? 'audio' : 'video';
                this.showError(`Failed to start ${mediaType}. You can still use text chat.`);
            });
        }

        // Clear waiting message and show welcome
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <h3>🎉 You're now connected!</h3>
                    <p>Say hello to your new chat partner</p>
                </div>
            `;
        }

        // Focus message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.focus();
        }
    }

    handlePartnerDisconnected() {
        this.isConnected = false;
        this.updateStatus('disconnected', 'Partner disconnected');
        this.showConnectionMessage('disconnected');

        // Stop video if active
        if (this.webrtc) {
            this.webrtc.stopVideoChat();
        }

        // Add disconnection message
        this.addSystemMessage('Your partner has disconnected');

        // Hide typing indicator
        this.hideTypingIndicator();
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput || !this.isConnected) return;

        const message = messageInput.value.trim();
        if (!message) return;

        // Validate message length
        if (message.length > 500) {
            this.showError('Message is too long. Please keep it under 500 characters.');
            return;
        }

        const messageData = {
            message: message,
            timestamp: Date.now()
        };

        // Send to server
        this.socket.emit('send_message', messageData);

        // Add to UI
        this.addMessage(message, 'sent', messageData.timestamp);

        // Clear input
        messageInput.value = '';

        // Stop typing
        this.socket.emit('stopped_typing');

        // Update send button state
        this.updateSendButton();

        console.log('Message sent:', message);
    }

    receiveMessage(data) {
        const { message, timestamp } = data;
        this.addMessage(message, 'received', timestamp);

        // Hide typing indicator
        this.hideTypingIndicator();

        console.log('Message received:', message);
    }

    addMessage(message, type, timestamp) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        // Remove welcome message if it exists
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;

        const time = new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageElement.innerHTML = `
            <div class="message-content">${this.sanitizeHTML(message)}</div>
            <div class="message-time">${time}</div>
        `;

        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();

        // Add to history
        this.messageHistory.push({ message, type, timestamp });

        // Limit history size
        if (this.messageHistory.length > 100) {
            this.messageHistory = this.messageHistory.slice(-50);
        }
    }

    addSystemMessage(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'system-message';
        messageElement.style.cssText = `
            text-align: center;
            color: var(--text-muted);
            font-style: italic;
            margin: var(--spacing-md) 0;
            padding: var(--spacing-sm);
            background-color: var(--bg-secondary);
            border-radius: var(--radius-md);
        `;
        messageElement.textContent = message;

        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    handleTyping() {
        if (!this.isConnected) return;

        // Send typing indicator
        this.socket.emit('typing');

        // Clear existing timer
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }

        // Set timer to stop typing after 3 seconds
        this.typingTimer = setTimeout(() => {
            this.socket.emit('stopped_typing');
        }, 3000);

        this.updateSendButton();
    }

    showTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.style.display = 'flex';
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
        }
    }

    updateSendButton() {
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');

        if (sendBtn && messageInput) {
            const hasText = messageInput.value.trim().length > 0;
            sendBtn.disabled = !hasText || !this.isConnected;
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    updateStatus(status, text) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');

        if (statusDot) {
            statusDot.className = `status-dot ${status}`;
        }

        if (statusText) {
            statusText.textContent = text;
        }
    }

    showConnectionMessage(type) {
        // Hide all connection messages
        document.querySelectorAll('.connection-message').forEach(msg => {
            msg.classList.remove('active');
        });

        // Show specific message
        const message = document.getElementById(`${type}Message`);
        if (message) {
            message.classList.add('active');
        }
    }

    findNewPartner() {
        this.showConfirm(
            'Find New Partner',
            'Are you sure you want to find a new chat partner? This will end your current conversation.',
            () => {
                this.disconnectAndFindNew();
            }
        );
    }

    stopChat() {
        this.showConfirm(
            'End Chat',
            'Are you sure you want to end the chat and return to the home page?',
            () => {
                this.endChat();
            }
        );
    }

    disconnectAndFindNew() {
        // Disconnect current chat
        if (this.socket) {
            this.socket.emit('disconnect_user');
        }

        // Stop video
        if (this.webrtc) {
            this.webrtc.stopVideoChat();
        }

        // Reset UI
        this.isConnected = false;
        this.updateStatus('waiting', 'Looking for new partner...');
        this.showConnectionMessage('waiting');

        // Clear messages
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <h3>Looking for a new partner...</h3>
                    <p>Please wait while we find someone new for you to chat with</p>
                </div>
            `;
        }

        // Clear video elements
        const localVideo = document.getElementById('localVideo');
        const partnerVideo = document.getElementById('partnerVideo');
        if (localVideo) localVideo.srcObject = null;
        if (partnerVideo) partnerVideo.srcObject = null;

        // Join queue again
        setTimeout(() => {
            if (this.socket) {
                this.socket.emit('join_queue', {
                    chatType: this.chatType,
                    interests: this.chatData.interests || []
                });
            }
        }, 1000);
    }

    endChat() {
        // Disconnect
        if (this.socket) {
            this.socket.emit('disconnect_user');
            this.socket.disconnect();
        }

        // Stop video
        if (this.webrtc) {
            this.webrtc.stopVideoChat();
        }

        // Clear session data
        sessionStorage.removeItem('chatData');

        // Redirect to home
        window.location.href = '/';
    }

    showReportModal() {
        const reportModal = document.getElementById('reportModal');
        if (reportModal) {
            reportModal.classList.add('active');

            // Pre-fill session ID if available
            const sessionIdInput = document.getElementById('sessionId');
            if (sessionIdInput && this.roomId) {
                sessionIdInput.value = this.roomId;
            }
        }
    }

    submitReport() {
        const reportReason = document.getElementById('reportReason');
        const reportMessage = document.getElementById('reportMessage');

        if (!reportReason || !reportReason.value) {
            this.showError('Please select a reason for the report');
            return;
        }

        const reportData = {
            reason: reportReason.value,
            message: reportMessage ? reportMessage.value : '',
            sessionId: this.roomId,
            timestamp: Date.now()
        };

        this.socket.emit('report_user', reportData);
        console.log('Report submitted:', reportData);
    }

    showConfirm(title, message, onConfirm) {
        const confirmModal = document.getElementById('confirmModal');
        const confirmTitle = document.getElementById('confirmTitle');
        const confirmMessage = document.getElementById('confirmMessage');

        if (confirmTitle) confirmTitle.textContent = title;
        if (confirmMessage) confirmMessage.textContent = message;

        this.pendingAction = onConfirm;

        if (confirmModal) {
            confirmModal.classList.add('active');
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const bgColor = type === 'error' ? 'var(--danger)' : 'var(--success)';
        const icon = type === 'error' ? '⚠️' : '✅';

        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${bgColor};
            color: white;
            padding: 1rem;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;

        toast.innerHTML = `
            <span>${icon}</span>
            <span>${this.sanitizeHTML(message)}</span>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: auto;
                padding: 0;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            ">×</button>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, type === 'error' ? 5000 : 3000);
    }

    sanitizeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Cleanup method
    cleanup() {
        if (this.socket) {
            this.socket.disconnect();
        }

        if (this.webrtc) {
            this.webrtc.stopVideoChat();
        }

        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }
    }
}

// Initialize chat manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const chatManager = new ChatManager();

    // Make globally accessible for debugging
    window.chatManager = chatManager;

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        chatManager.cleanup();
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('Chat page hidden');
        } else {
            console.log('Chat page visible');
            // Update send button state when page becomes visible
            chatManager.updateSendButton();
        }
    });
});
