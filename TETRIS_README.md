# Visual Gesture Controlled Tetris

A Tetris game controlled by natural hand gestures using MediaPipe and OpenCV - no finger tracking required!
  
## Project Structure

### Main Files
- `index.html` - Main game with natural gesture controls
- `natural_hand_controls.js` - Natural hand gesture control system (no finger tracking)
- `test_gestures.html` - Test page for debugging gestures

### Original Tetris Repository
- `docs/VISION_UI_TETRIS/` - Alan's original hand-controlled Tetris
- `docs/VISION_UI_TETRIS/README.md` - Original documentation

### Documentation
- `.claude/GESTURE_UI.md` - Gesture interface design principles
- `.claude/PRIME.md` - Project context and setup

## How It Works

This enhanced version uses natural hand gestures instead of finger tracking:

1. **🫸 Swipe left/right** → Move piece
2. **🤌 Rotate hand** → Rotate piece (like turning a doorknob)  
3. **🫳 Palm down** → Fast drop
4. **👋 Wave** → Pause game

## Setup

1. Start a local server:
   ```bash
   python -m http.server 8000
   # or
   npx http-server -p 8000
   ```

2. Open in browser: `http://localhost:8000`
3. Click `index.html`
4. Click "START GAME" - camera will activate automatically
5. Allow camera access when prompted
6. Use natural hand gestures to play!

## Key Features

- **No keyboard controls** - gesture-only gameplay
- **No finger tracking** - uses natural hand positions
- **Auto-starts camera** - seamless UX with fewer clicks
- **Responsive design** - works on different screen sizes

## Original Creator

Base Tetris implementation by Alan (@collidingscopes)
- GitHub: [collidingscopes/tetris](https://github.com/collidingscopes/tetris)
- Play original: [https://collidingscopes.github.io/tetris](https://collidingscopes.github.io/tetris)