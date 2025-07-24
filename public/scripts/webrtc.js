// WebRTC functionality for video chat
class WebRTCManager {
    constructor() {
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.socket = null;
        this.isInitiator = false;
        this.chatData = null;

        // ICE servers configuration
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                // You can add TURN servers here for better connectivity
                // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
            ]
        };

        this.init();
    }

    async init() {
        try {
            // Get chat data from sessionStorage
            this.chatData = JSON.parse(sessionStorage.getItem('chatData') || '{}');
            this.isInitiator = this.chatData.isInitiator || false;

            console.log('WebRTC Manager initialized. Is initiator:', this.isInitiator);
            console.log('Chat data:', this.chatData);

        } catch (error) {
            console.error('Error initializing WebRTC manager:', error);
        }
    }

    setSocket(socket) {
        this.socket = socket;
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('video_offer', async (data) => {
            console.log('Received video offer:', data);
            try {
                await this.handleVideoOffer(data.offer);
            } catch (error) {
                console.error('Error handling video offer:', error);
            }
        });

        this.socket.on('video_answer', async (data) => {
            console.log('Received video answer:', data);
            try {
                await this.handleVideoAnswer(data.answer);
            } catch (error) {
                console.error('Error handling video answer:', error);
            }
        });

        this.socket.on('ice_candidate', async (data) => {
            console.log('Received ICE candidate:', data);
            try {
                await this.handleIceCandidate(data.candidate);
            } catch (error) {
                console.error('Error handling ICE candidate:', error);
            }
        });
    }

    async startVideoChat() {
        try {
            console.log('Starting audio/video chat...');
            console.log('🎤 Mode:', this.chatData?.chatType || 'video');

            // Get user media based on chat type
            await this.getUserMedia();

            // Create peer connection
            this.createPeerConnection();

            // Add local stream to peer connection
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
            }

            // If initiator, create and send offer
            if (this.isInitiator) {
                await this.createAndSendOffer();
            }

            return true;
        } catch (error) {
            console.error('Error starting audio/video chat:', error);
            throw error;
        }
    } async getUserMedia() {
        try {
            console.log('Getting user media for LIVE audio/video streaming...');
            console.log('🎤 All audio/video is LIVE - no recording or storage');

            const chatType = this.chatData?.chatType || 'video';

            // Configure constraints based on chat type
            let constraints;

            if (chatType === 'audio') {
                // Audio-only mode
                constraints = {
                    video: false,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 48000,
                        channelCount: 2
                    }
                };
                console.log('🎤 Audio-only mode enabled');
            } else {
                // Video mode (includes audio)
                constraints = {
                    video: {
                        width: { ideal: 1280, max: 1920 },
                        height: { ideal: 720, max: 1080 },
                        frameRate: { ideal: 30, max: 60 }
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 48000,
                        channelCount: 2
                    }
                };
                console.log('🎥 Video + audio mode enabled');
            } this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Display local video
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = this.localStream;
                localVideo.muted = true; // Always mute local video to prevent feedback
            }

            console.log('Got user media successfully');
            return this.localStream;

        } catch (error) {
            console.error('Error getting user media:', error);

            // Try with lower quality if high quality fails
            try {
                console.log('Trying with lower quality...');
                const fallbackConstraints = {
                    video: { width: 640, height: 480 },
                    audio: true
                };
                this.localStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);

                const localVideo = document.getElementById('localVideo');
                if (localVideo) {
                    localVideo.srcObject = this.localStream;
                    localVideo.muted = true;
                }

                return this.localStream;
            } catch (fallbackError) {
                console.error('Fallback getUserMedia also failed:', fallbackError);
                throw fallbackError;
            }
        }
    }

    createPeerConnection() {
        console.log('Creating peer connection...');

        this.peerConnection = new RTCPeerConnection(this.iceServers);

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.socket) {
                console.log('Sending ICE candidate:', event.candidate);
                this.socket.emit('ice_candidate', { candidate: event.candidate });
            }
        };

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            console.log('Received remote track:', event);

            if (event.streams && event.streams[0]) {
                this.remoteStream = event.streams[0];
                const partnerVideo = document.getElementById('partnerVideo');
                if (partnerVideo) {
                    partnerVideo.srcObject = this.remoteStream;
                }
            }
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection.connectionState);

            switch (this.peerConnection.connectionState) {
                case 'connected':
                    console.log('WebRTC connection established');
                    this.onConnectionEstablished();
                    break;
                case 'disconnected':
                case 'failed':
                    console.log('WebRTC connection lost');
                    this.onConnectionLost();
                    break;
                case 'closed':
                    console.log('WebRTC connection closed');
                    break;
            }
        };

        // Handle ICE connection state changes
        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', this.peerConnection.iceConnectionState);
        };
    }

    async createAndSendOffer() {
        try {
            console.log('Creating offer...');

            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            console.log('Sending offer...');
            this.socket.emit('video_offer', { offer });

        } catch (error) {
            console.error('Error creating/sending offer:', error);
            throw error;
        }
    }

    async handleVideoOffer(offer) {
        try {
            console.log('Handling video offer...');

            // Create peer connection if not exists
            if (!this.peerConnection) {
                await this.startVideoChat();
            }

            await this.peerConnection.setRemoteDescription(offer);

            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            console.log('Sending answer...');
            this.socket.emit('video_answer', { answer });

        } catch (error) {
            console.error('Error handling video offer:', error);
            throw error;
        }
    }

    async handleVideoAnswer(answer) {
        try {
            console.log('Handling video answer...');
            await this.peerConnection.setRemoteDescription(answer);
        } catch (error) {
            console.error('Error handling video answer:', error);
            throw error;
        }
    }

    async handleIceCandidate(candidate) {
        try {
            if (this.peerConnection && this.peerConnection.remoteDescription) {
                await this.peerConnection.addIceCandidate(candidate);
            } else {
                console.log('Peer connection not ready for ICE candidate');
            }
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    }

    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;

                const toggleBtn = document.getElementById('toggleVideoBtn');
                if (toggleBtn) {
                    const icon = toggleBtn.querySelector('span');
                    if (icon) {
                        icon.textContent = videoTrack.enabled ? '📹' : '📹❌';
                    }
                    toggleBtn.classList.toggle('muted', !videoTrack.enabled);
                }

                console.log('Video', videoTrack.enabled ? 'enabled' : 'disabled');
                return videoTrack.enabled;
            }
        }
        return false;
    }

    toggleAudio() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;

                const toggleBtn = document.getElementById('toggleAudioBtn');
                if (toggleBtn) {
                    const icon = toggleBtn.querySelector('span');
                    if (icon) {
                        icon.textContent = audioTrack.enabled ? '🎤' : '🎤❌';
                    }
                    toggleBtn.classList.toggle('muted', !audioTrack.enabled);
                }

                console.log('Audio', audioTrack.enabled ? 'enabled' : 'disabled');
                return audioTrack.enabled;
            }
        }
        return false;
    }

    stopVideoChat() {
        console.log('Stopping video chat...');

        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
            });
            this.localStream = null;
        }

        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Clear video elements
        const localVideo = document.getElementById('localVideo');
        const partnerVideo = document.getElementById('partnerVideo');

        if (localVideo) localVideo.srcObject = null;
        if (partnerVideo) partnerVideo.srcObject = null;

        this.remoteStream = null;
    }

    onConnectionEstablished() {
        // Override this method in chat.js to handle connection established
        console.log('WebRTC connection established - override this method');
    }

    onConnectionLost() {
        // Override this method in chat.js to handle connection lost
        console.log('WebRTC connection lost - override this method');
    }

    // Get connection statistics
    async getStats() {
        if (!this.peerConnection) return null;

        try {
            const stats = await this.peerConnection.getStats();
            const report = {};

            stats.forEach(stat => {
                if (stat.type === 'inbound-rtp' || stat.type === 'outbound-rtp') {
                    report[stat.type] = {
                        bytesReceived: stat.bytesReceived,
                        bytesSent: stat.bytesSent,
                        packetsReceived: stat.packetsReceived,
                        packetsSent: stat.packetsSent,
                        timestamp: stat.timestamp
                    };
                }
            });

            return report;
        } catch (error) {
            console.error('Error getting WebRTC stats:', error);
            return null;
        }
    }

    // Check if WebRTC is supported
    static isSupported() {
        return !!(navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia &&
            window.RTCPeerConnection);
    }

    // Check if camera/microphone are available
    static async checkMediaDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(device => device.kind === 'videoinput');
            const hasMicrophone = devices.some(device => device.kind === 'audioinput');

            return { hasCamera, hasMicrophone };
        } catch (error) {
            console.error('Error checking media devices:', error);
            return { hasCamera: false, hasMicrophone: false };
        }
    }
}

// Export for use in other modules
window.WebRTCManager = WebRTCManager;
