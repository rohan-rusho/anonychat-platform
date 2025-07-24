<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# AnonyChat Development Instructions

This is a real-time anonymous chat platform built with Node.js, Express, Socket.IO, and WebRTC. When working on this project, please follow these guidelines:

## Project Architecture

- **Backend**: Node.js + Express.js server with Socket.IO for real-time communication
- **Frontend**: Vanilla HTML/CSS/JavaScript with WebRTC for video chat
- **Real-time**: Socket.IO for chat messaging and WebRTC signaling
- **Design**: Dark theme, mobile-first responsive design

## Code Style Guidelines

### JavaScript
- Use ES6+ features (async/await, arrow functions, destructuring)
- Follow consistent naming conventions (camelCase for variables and functions)
- Add comprehensive error handling with try-catch blocks
- Include JSDoc comments for complex functions
- Use modern DOM APIs (addEventListener, querySelector, etc.)

### CSS
- Use CSS custom properties (variables) defined in :root
- Follow BEM-like naming conventions for classes
- Mobile-first responsive design with CSS Grid and Flexbox
- Dark theme color scheme
- Smooth transitions and animations

### HTML
- Semantic HTML5 elements
- Accessible form labels and ARIA attributes
- Meta tags for responsive design
- Structured navigation and content hierarchy

## Security Considerations

- Always sanitize user input to prevent XSS attacks
- Use proper CORS configuration
- Implement rate limiting for API endpoints
- Never log or store user messages
- Use HTTPS in production
- Validate all socket events and data

## WebRTC Implementation

- Handle getUserMedia errors gracefully with fallbacks
- Implement proper ICE candidate handling
- Use STUN/TURN servers for NAT traversal
- Provide user controls for camera/microphone
- Handle connection state changes

## Socket.IO Events

Current events implemented:
- `join_queue` - User requests to join matchmaking
- `partner_found` - Match found, connection established
- `send_message` - Send text message
- `receive_message` - Receive text message
- `typing` / `stopped_typing` - Typing indicators
- `video_offer` / `video_answer` - WebRTC signaling
- `ice_candidate` - WebRTC ICE candidates
- `disconnect_user` - User disconnects
- `report_user` - Report inappropriate behavior

## Feature Implementation

### Chat Matching System
- Random matching with optional interest-based filtering
- Queue management for waiting users
- Room creation and management
- Connection cleanup on disconnect

### Safety Features
- Profanity filtering system
- User reporting mechanism
- Auto-ban system for repeated offenders
- Anonymous session management

### UI/UX Patterns
- Toast notifications for user feedback
- Modal dialogs for confirmations
- Loading states and progress indicators
- Responsive mobile-first design
- Intuitive controls and navigation

## Testing Considerations

- Test WebRTC functionality across different browsers
- Verify mobile responsiveness on various screen sizes
- Test socket connections with multiple concurrent users
- Validate form inputs and error handling
- Check accessibility with screen readers

## Performance Optimization

- Minimize DOM manipulation and use efficient selectors
- Implement connection pooling and cleanup
- Use event delegation for dynamic content
- Optimize video stream quality based on connection
- Implement proper memory management for WebRTC

## Browser Compatibility

- Target modern browsers with WebRTC support
- Provide graceful degradation for older browsers
- Test across Chrome, Firefox, Safari, and Edge
- Handle mobile browser differences (iOS Safari, Chrome Mobile)

When implementing new features, maintain consistency with existing patterns and always consider user privacy and safety first.
