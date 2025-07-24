// Main page functionality
class MainPage {
    constructor() {
        this.socket = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.connectSocket();
    }

    setupEventListeners() {
        const startChatBtn = document.getElementById('startChatBtn');
        const cancelSearchBtn = document.getElementById('cancelSearch');
        const interestsInput = document.getElementById('interests');

        if (startChatBtn) {
            startChatBtn.addEventListener('click', () => this.startChat());
        }

        if (cancelSearchBtn) {
            cancelSearchBtn.addEventListener('click', () => this.cancelSearch());
        }

        // Handle Enter key in interests input
        if (interestsInput) {
            interestsInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.startChat();
                }
            });
        }

        // Handle chat mode selection
        document.querySelectorAll('input[name="chatMode"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateChatModeSelection();
            });
        });
    }

    connectSocket() {
        try {
            this.socket = io();

            this.socket.on('connect', () => {
                console.log('Connected to server');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.hideLoadingModal();
            });

            this.socket.on('waiting_for_partner', () => {
                console.log('Waiting for partner...');
                this.showLoadingModal();
            });

            this.socket.on('partner_found', (data) => {
                console.log('Partner found!', data);
                this.hideLoadingModal();
                this.redirectToChat(data);
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                this.hideLoadingModal();
                this.showError('Connection failed. Please check your internet connection and try again.');
            });

        } catch (error) {
            console.error('Socket initialization error:', error);
            this.showError('Failed to initialize connection. Please refresh the page.');
        }
    }

    updateChatModeSelection() {
        const selectedMode = document.querySelector('input[name="chatMode"]:checked');
        if (selectedMode) {
            console.log('Chat mode selected:', selectedMode.value);
            // You can add visual feedback here if needed
        }
    }

    startChat() {
        const chatMode = document.querySelector('input[name="chatMode"]:checked');
        const interestsInput = document.getElementById('interests');

        if (!chatMode) {
            this.showError('Please select a chat mode (Text, Audio, or Video).');
            return;
        }

        const chatType = chatMode.value;
        const interestsText = interestsInput ? interestsInput.value.trim() : '';
        const interests = interestsText ?
            interestsText.split(',').map(i => i.trim().toLowerCase()).filter(i => i.length > 0) :
            [];

        // Validate interests length
        if (interests.length > 10) {
            this.showError('Please limit your interests to 10 or fewer.');
            return;
        }

        console.log(`🎤 Selected chat type: ${chatType}`);
        console.log('🔒 All data will be stored locally on your device only');

        // Request media permissions for audio/video chat
        if (chatType === 'video' || chatType === 'audio') {
            this.requestMediaPermissions(chatType)
                .then(() => {
                    this.joinQueue(chatType, interests);
                })
                .catch((error) => {
                    console.error('Media permission error:', error);
                    const mediaType = chatType === 'audio' ? 'microphone' : 'camera/microphone';
                    this.showError(`${mediaType} access is required for ${chatType} chat. Please allow access and try again.`);
                });
        } else {
            this.joinQueue(chatType, interests);
        }
    }

    async requestMediaPermissions(chatType) {
        try {
            let constraints;

            if (chatType === 'audio') {
                constraints = {
                    video: false,
                    audio: true
                };
                console.log('🎤 Requesting microphone access for audio chat');
            } else if (chatType === 'video') {
                constraints = {
                    video: true,
                    audio: true
                };
                console.log('🎥 Requesting camera/microphone access for video chat');
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            // Stop the stream immediately - we just needed to get permission
            stream.getTracks().forEach(track => track.stop());
            console.log('✅ Media permissions granted');
            return Promise.resolve();
        } catch (error) {
            console.error('❌ Media permission denied:', error);
            return Promise.reject(error);
        }
    } joinQueue(chatType, interests) {
        if (!this.socket || !this.socket.connected) {
            this.showError('Connection lost. Please refresh the page and try again.');
            return;
        }

        this.showLoadingModal();

        this.socket.emit('join_queue', {
            chatType,
            interests
        });

        console.log(`Joining queue: ${chatType} chat with interests:`, interests);
    }

    cancelSearch() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.hideLoadingModal();
        console.log('Search cancelled');
    }

    redirectToChat(data) {
        // Store chat data in sessionStorage for the chat page
        sessionStorage.setItem('chatData', JSON.stringify({
            partnerId: data.partnerId,
            roomId: data.roomId,
            chatType: data.chatType,
            isInitiator: data.isInitiator,
            timestamp: Date.now()
        }));

        // Redirect to chat page
        window.location.href = '/chat';
    }

    showLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showError(message) {
        // Create and show error toast
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">⚠️</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add toast styles if not already present
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .error-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background-color: var(--danger);
                    color: white;
                    padding: 1rem;
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-lg);
                    z-index: 1001;
                    max-width: 400px;
                    animation: slideIn 0.3s ease-out;
                }
                
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .toast-message {
                    flex: 1;
                }
                
                .toast-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .toast-close:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Similar to showError but with success styling
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: var(--success);
            color: white;
            padding: 1rem;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;

        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">✅</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }
}

// Utility functions
function formatInterests(interests) {
    if (!interests || interests.length === 0) return 'No specific interests';
    return interests.join(', ');
}

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Initialize the main page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const mainPage = new MainPage();

    // Make mainPage globally accessible for debugging
    window.mainPage = mainPage;
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page is now hidden');
    } else {
        console.log('Page is now visible');
        // Optionally reconnect socket if disconnected
        if (window.mainPage && (!window.mainPage.socket || !window.mainPage.socket.connected)) {
            console.log('Reconnecting socket...');
            window.mainPage.connectSocket();
        }
    }
});

// Handle beforeunload to clean up socket connection
window.addEventListener('beforeunload', () => {
    if (window.mainPage && window.mainPage.socket) {
        window.mainPage.socket.disconnect();
    }
});
