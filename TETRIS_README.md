# Hand-Controlled Tetris

A Tetris game controlled by hand gestures using MediaPipe and OpenCV.

## Current Gestures

1. **Tilt hand left** → Move piece left
2. **Tilt hand right** → Move piece right  
3. **Both tilts together** → Rotate piece
4. **No hand visible** → Fast drop

## Setup

```bash
pip install -r tetris_requirements.txt
python tetris_mediapipe.py
```

## Game Features

- Classic Tetris gameplay
- Hand gesture control via webcam
- Score tracking
- Increasing difficulty over time
- Next piece preview

## To Improve

### Better Gestures (Our Big Movement System)
- [ ] BACKHAND → Move right
- [ ] FRONTHAND → Move left
- [ ] FIST ROTATION → Rotate piece
- [ ] PUSH AWAY → Pause game
- [ ] CHEF KISS → Save high score

### Game Enhancements
- [ ] Better visual feedback for gestures
- [ ] Sound effects
- [ ] Pause functionality
- [ ] High score tracking
- [ ] Gesture calibration

### Agent Integration
- [ ] Voice commands for game control
- [ ] AI suggestions for best moves
- [ ] Automated gameplay recording
- [ ] Performance analytics

## Notes

Based on tutorials by:
- Tech With Tim (Tetris logic)
- Murtaza's Workshop (Hand tracking)

This is our starting point for the larger gesture-controlled board system!
