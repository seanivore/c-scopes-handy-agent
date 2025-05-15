# Natural Gesture Tetris

A collaboration project enhancing Alan's (@collidingscopes) vision-controlled Tetris with natural hand gestures that don't rely on finger tracking.

## About

This project builds on top of the original Tetris hand tracking game by adding a new gesture control system that uses whole-hand movements instead of individual finger tracking. The philosophy: natural gestures that AI vision can reliably track - no counting fingers, just clear hand positions and movements.

## Original Creator

All credit for the core Tetris implementation goes to Alan (@collidingscopes):
- Original repo: [collidingscopes/tetris](https://github.com/collidingscopes/tetris)
- Play online: [https://collidingscopes.github.io/tetris](https://collidingscopes.github.io/tetris)

## Natural Gesture System

Our enhancement adds:
- 🫸 **Hand swipes** for left/right movement
- 🤌 **Hand rotation** (like turning a doorknob) to rotate pieces  
- 🫳 **Palm-down gesture** for fast drop
- 👋 **Wave gesture** to pause (planned)

No finger counting or individual finger tracking - just natural hand movements!

## Files

- `index.html` - Main game with natural gesture integration
- `natural_hand_controls.js` - Natural hand gesture control system  
- `test_gestures.html` - Test page for gesture debugging
- `docs/VISION_UI_TETRIS/` - Original Tetris implementation by Alan

## Key Differences from Original

### Original (Alan's) Hand Controls:
- Uses individual finger tracking
- Index finger pointing for rotation
- Fist gesture for drop
- Subtle hand tilts for movement

### Natural Gesture System (Our Enhancement):
- **No finger tracking** - whole hand movements only
- Hand swipes for left/right movement 
- Hand rotation (like turning a doorknob) for piece rotation
- Palm-down position for fast drop
- Larger motion thresholds for reliable detection

## Vision

This is a starting point for exploring how gesture interfaces can work with AI agents (SFA - Single File Agents). Future ideas:
- Gesture-controlled agent switching
- Visual debugging through eye tracking
- AR code review with live overlays
- Body language as code input

## Setup

1. **Local Server Required**: Due to browser security restrictions, you need to run this on a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```

2. Open your browser to `http://localhost:8000`
3. Click on `index.html`
4. Click "START GAME" - camera activates automatically
5. Allow camera access when prompted
6. Use clear hand movements (no finger tracking) to control the game

## Browser Requirements

- Modern browser with WebRTC support (Chrome, Edge, Firefox)
- Webcam/camera access
- For best performance: Chrome or Edge recommended

## Development

To test gestures independently:
1. Open `test_gestures.html`
2. Click "Start Natural Gestures"
3. Watch the console for gesture detection

## Contact

- Sean: [presenting.august.style](http://presenting.august.style)
- Alan: [@measure_plan](https://x.com/measure_plan)