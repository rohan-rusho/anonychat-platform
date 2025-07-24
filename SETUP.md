# Quick Setup Guide - AnonyChat

## 🚀 Quick Start (If Node.js is already installed)

If you already have Node.js installed, follow these steps:

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open your browser and visit:
# http://localhost:3000
```

## 📦 Full Setup Instructions

### Step 1: Install Node.js

**Option A: Download from Official Website**
1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS (Long Term Support) version
3. Run the installer and follow the prompts
4. Restart your terminal/command prompt

**Option B: Using Package Manager**

Windows (using Chocolatey):
```powershell
choco install nodejs
```

Windows (using Winget):
```powershell
winget install OpenJS.NodeJS
```

macOS (using Homebrew):
```bash
brew install node
```

### Step 2: Verify Installation

Open a new terminal/command prompt and run:
```bash
node --version
npm --version
```

You should see version numbers for both commands.

### Step 3: Set Up the Project

1. **Navigate to the project folder**
   ```bash
   cd omgl
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Go to: `http://localhost:3000`

## 🌐 Alternative Deployment Options

### Option 1: Online Development Environment

Use online platforms that don't require local Node.js installation:

**Replit (Recommended for beginners):**
1. Go to [replit.com](https://replit.com)
2. Create a new Repl
3. Choose "Node.js" template
4. Upload your project files
5. Run the server

**CodeSandbox:**
1. Go to [codesandbox.io](https://codesandbox.io)
2. Create new sandbox
3. Choose "Node.js" template
4. Upload your files
5. The server will start automatically

**Glitch:**
1. Go to [glitch.com](https://glitch.com)
2. Create new project
3. Choose "Node.js" starter
4. Replace files with your project
5. Project will auto-deploy

### Option 2: Free Hosting Platforms

Deploy directly to free hosting without local setup:

**Railway:**
1. Connect your GitHub repository
2. Deploy automatically
3. Get a public URL

**Render:**
1. Connect repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Deploy automatically

**Heroku:**
1. Create Heroku app
2. Connect GitHub repository
3. Deploy from Git

## 🔧 Troubleshooting

### Common Issues

**1. Node.js not found**
- Restart your terminal after installation
- Check if Node.js is in your PATH
- Try reinstalling Node.js

**2. Permission errors (macOS/Linux)**
```bash
sudo npm install
```

**3. Port already in use**
```bash
# Kill process using port 3000
npx kill-port 3000
```

**4. Dependencies installation fails**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Browser Requirements

- **Chrome** (recommended): Version 60+
- **Firefox**: Version 55+
- **Safari**: Version 11+
- **Edge**: Version 79+

WebRTC features require HTTPS in production and getUserMedia permissions.

## 📱 Mobile Testing

For mobile testing:
1. Find your computer's IP address
2. Start the server
3. On your mobile device, visit: `http://YOUR_IP:3000`
4. Ensure both devices are on the same network

## 🔒 Production Deployment

### Environment Setup

1. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

2. **Update production settings**
   ```env
   NODE_ENV=production
   PORT=3000
   SESSION_SECRET=your-secure-secret-here
   ```

### Security Checklist

- [ ] Enable HTTPS
- [ ] Set secure session secret
- [ ] Configure CORS for your domain
- [ ] Set up rate limiting
- [ ] Enable logging and monitoring

### Performance Optimization

- Use PM2 for process management
- Set up reverse proxy (nginx)
- Enable gzip compression
- Configure CDN for static files

## 📞 Need Help?

1. **Check the console** for error messages
2. **Verify Node.js installation** with `node --version`
3. **Check if port 3000 is available**
4. **Try a different browser**
5. **Check firewall settings**

## 🎯 Next Steps

Once the server is running:

1. **Homepage**: Choose text or video chat
2. **Add interests**: Optional for better matching
3. **Start chatting**: Click the big blue button
4. **Safety first**: Use report feature if needed

---

**Quick Links:**
- [Full README](README.md) - Complete documentation
- [Node.js Download](https://nodejs.org/) - Official Node.js installer
- [Replit Template](https://replit.com/) - Online development environment
