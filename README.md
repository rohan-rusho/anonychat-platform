# AnonyChat - Anonymous Video & Text Chat Platform

A real-time anonymous chat platform that allows strangers to connect randomly via text and video chat, built with WebRTC, Socket.IO, and Node.js.

## 🚀 Features

### Core Functionality

- **Anonymous Text Chat**: Real-time messaging without registration
- **Video Chat**: WebRTC-powered peer-to-peer video communication
- **Random Matching**: Intelligent matchmaking system
- **Interest-Based Matching**: Optional matching based on shared interests
- **Cross-Platform**: Works on desktop and mobile devices

### Safety & Moderation

- **Report System**: Users can report inappropriate behavior
- **Profanity Filter**: Automatic filtering of inappropriate content
- **Auto-Ban System**: Automatic banning after multiple reports
- **Privacy First**: No message logging or personal data collection

### User Experience

- **Dark Theme**: Modern, eye-friendly dark mode interface
- **Responsive Design**: Mobile-first responsive layout
- **Real-time Status**: Connection status indicators
- **Typing Indicators**: See when your partner is typing
- **Easy Controls**: Intuitive chat controls and navigation

## 🛠️ Technology Stack

### Frontend

- **HTML5**: Modern semantic markup
- **CSS3**: Custom CSS with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Vanilla JavaScript with modern features
- **WebRTC**: Peer-to-peer video/audio communication
- **Socket.IO Client**: Real-time bidirectional communication

### Backend

- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **Socket.IO**: Real-time engine
- **CORS**: Cross-origin resource sharing

### Development Tools

- **NPM**: Package management
- **Environment Variables**: Configuration management

## 📁 Project Structure

```
omegle-clone/
├── public/                 # Frontend files
│   ├── index.html         # Homepage
│   ├── chat.html          # Chat interface
│   ├── terms.html         # Terms & Privacy
│   ├── report.html        # Report abuse page
│   ├── assets/
│   │   └── styles.css     # Main stylesheet
│   └── scripts/
│       ├── main.js        # Homepage functionality
│       ├── chat.js        # Chat page functionality
│       ├── webrtc.js      # WebRTC management
│       └── report.js      # Report functionality
├── server/
│   └── index.js           # Main server file
├── .env.example           # Environment variables template
├── package.json           # Project dependencies
└── README.md             # This file
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- NPM (v6 or higher)
- Modern web browser with WebRTC support

### Quick Start

1. **Clone or Download the Project**

   ```bash
   # If using git
   git clone <repository-url>
   cd omegle-clone
   
   # Or download and extract the files to your project folder
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env file with your configuration (optional for basic setup)
   ```

4. **Start the Server**

   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the Application**
   Open your browser and navigate to:

   ```
   http://localhost:3000
   ```

### Development Setup

For development with auto-restart:

1. **Install nodemon globally (optional)**

   ```bash
   npm install -g nodemon
   ```

2. **Run with nodemon**

   ```bash
   nodemon server/index.js
   ```

## 🌐 Deployment

### Local Development

The application runs on `http://localhost:3000` by default.

### Production Deployment

#### Option 1: Traditional Server

1. Install Node.js on your server
2. Upload project files
3. Install dependencies: `npm install --production`
4. Set environment variables
5. Start with PM2: `pm2 start server/index.js --name anony-chat`

#### Option 2: Platform as a Service (PaaS)

**Heroku:**

1. Create a Heroku app
2. Add Node.js buildpack
3. Deploy from Git
4. Set environment variables in Heroku dashboard

**Railway:**

1. Connect your GitHub repository
2. Deploy automatically
3. Configure environment variables

**Render:**

1. Connect repository
2. Set build command: `npm install`
3. Set start command: `npm start`

#### Option 3: Static + Serverless

**Frontend (Netlify/Vercel):**

- Deploy the `public` folder
- Update Socket.IO connection URL to point to your backend

**Backend (Railway/Heroku):**

- Deploy just the server code
- Ensure CORS is configured for your frontend domain

## ⚙️ Configuration

### Environment Variables

Key environment variables you can configure in `.env`:

```env
# Server
PORT=3000
NODE_ENV=production

# Security
SESSION_SECRET=your-secure-secret

# Features
ENABLE_VIDEO_CHAT=true
ENABLE_INTEREST_MATCHING=true
PROFANITY_FILTER_ENABLED=true

# Performance
MAX_CONNECTIONS=1000
MAX_CHAT_DURATION=3600000
```

### WebRTC Configuration

For better connectivity, especially in production, consider adding TURN servers:

```javascript
// In webrtc.js, update iceServers configuration
iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
        urls: 'turn:your-turn-server.com',
        username: 'username',
        credential: 'password'
    }
]
```

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Change default session secret
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for specific domains
- [ ] Set up rate limiting
- [ ] Add input validation and sanitization
- [ ] Configure CSP headers
- [ ] Set up monitoring and logging
- [ ] Regular security updates

### Privacy Features

- **No Registration**: Users don't need to provide personal information
- **No Message Logging**: Conversations are not stored
- **Anonymous Sessions**: Only temporary session IDs are used
- **WebRTC Encryption**: Video/audio streams are encrypted end-to-end

## 🎮 Usage

### For Users

1. **Visit the Homepage**
   - Choose between text or video chat
   - Optionally add interests for better matching
   - Click "Start Chatting"

2. **Chat Interface**
   - Send messages using the text input
   - Use video controls to toggle camera/microphone
   - Click "Next" to find a new partner
   - Use "Report" for inappropriate behavior

3. **Safety Features**
   - Report inappropriate users immediately
   - Don't share personal information
   - Use the "Stop" button to end chats safely

### For Developers

#### Adding New Features

1. **Backend (Socket Events)**

   ```javascript
   // In server/index.js
   socket.on('new_feature', (data) => {
       // Handle new feature
   });
   ```

2. **Frontend (UI Updates)**

   ```javascript
   // In appropriate script file
   socket.emit('new_feature', data);
   ```

#### Customizing the UI

- Edit `public/assets/styles.css` for styling changes
- Modify HTML files for layout changes
- Update JavaScript files for functionality changes

## 📊 Monitoring & Analytics

### Built-in Monitoring

The application includes basic logging:

- Connection events
- Chat sessions
- Report submissions
- Error tracking

### Adding Analytics

To add Google Analytics:

1. Add tracking code to HTML files
2. Track events in JavaScript:

   ```javascript
   gtag('event', 'chat_started', {
       'chat_type': 'video'
   });
   ```

## 🐛 Troubleshooting

### Common Issues

**1. WebRTC Connection Fails**

- Check browser permissions for camera/microphone
- Ensure HTTPS is used in production
- Configure TURN servers for NAT traversal

**2. Socket.IO Connection Issues**

- Verify server is running on correct port
- Check firewall settings
- Ensure WebSocket support is enabled

**3. CORS Errors**

- Update CORS configuration in server
- Check frontend-backend URL configuration

**4. High Memory Usage**

- Monitor active connections
- Implement connection cleanup
- Consider connection limits

### Debug Mode

Enable debug mode by setting `DEBUG_MODE=true` in your `.env` file.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines

- Follow existing code style
- Add comments for complex functionality
- Test on multiple browsers
- Consider mobile responsiveness
- Ensure security best practices

## 📞 Support

### Getting Help

1. Check this README for common issues
2. Review the code comments
3. Check browser console for errors
4. Test with different browsers/devices

### Reporting Issues

When reporting issues, please include:

- Browser and version
- Device type (desktop/mobile)
- Steps to reproduce
- Error messages (if any)
- Expected vs actual behavior

## 🚀 Roadmap

### Planned Features

- [ ] Group chat rooms
- [ ] Voice-only chat mode
- [ ] Location-based matching
- [ ] Chat history export
- [ ] Advanced moderation tools
- [ ] Mobile app versions
- [ ] Language translation
- [ ] Chat statistics dashboard

### Performance Improvements

- [ ] Database integration for persistent data
- [ ] Redis for session management
- [ ] CDN for static assets
- [ ] Load balancing for multiple servers
- [ ] Message compression
- [ ] Optimized video encoding

---

**Built with ❤️ for anonymous conversations and meaningful connections**
