# Visual Gesture Controlled Tetris

A Tetris game controlled by hand gestures using MediaPipe and OpenCV.
  
## Tetris as a Starting Point 

  - Learn the system
  - Develop a development process 
  - Build it off the figjam type board 
  - Add it to the board later with rankings 
  - Alan already built the game we can use to start

## OG Tetris Repository & Files

[collidingScopes/tetris](./docs/VISION_UI_TETRIS)
[README.md](./docs/VISION_UI_TETRIS/README.md)

### Current Gestures

1. **Tilt hand left** → Move piece left
2. **Tilt hand right** → Move piece right  
3. **Both tilts together** → Rotate piece
4. **No hand visible** → Fast drop

### Gesture UI Updates 

These have been defined as context priming examples for the AI and can be found at the link below. When you hear "gesture" don't think iOS/OS gestures, think about an Italian person telling a story. We need big and natural for reliability and longevity.  

[Gesture Interface Design](./.claude/GESTURE_UI.md)

## Handy Tetris Updates 

[big_tetris_controls.js](./big_tetris_controls.js)

**NOTE: YOU WERE INTERRUPTED IN THE MIDDLE OF READING THE ORIGINAL TETRIS REPO FILES AND CREATING NEW FILES.**