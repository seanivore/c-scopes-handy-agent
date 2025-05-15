# Hand Tracking + Python Agent Bridge

A collaboration project that connects [collidingScopes' Three.js hand tracking](https://github.com/collidingScopes/threejs-handtracking-101) with Python development agents.

## What It Does

Use hand gestures to control development tools:
- 👍 **Thumbs up** = Run tests
- ✌️ **Peace sign** = Create git commit
- 👋 **Wave** = Get next code suggestion
- 👉 **Point** = Explain code
- ✊ **Fist** = Emergency stop
- 👏 **Clap** = Smack the sphere (coming soon!)

## Setup

1. Install dependencies:
```bash
pip install websockets
```

2. Start the gesture server:
```bash
python gesture_server.py
```

3. In another terminal, start the web server:
```bash
python3 -m http.server 8000
```

4. Open in browser:
```
http://localhost:8000/index_with_agent.html
```

## How It Works

1. MediaPipe detects hand landmarks from webcam
2. JavaScript detects gestures (with 500ms hold time)
3. WebSocket sends gestures to Python server
4. Python agent executes actual development commands
5. Results display back in the browser

## Files

- `index_with_agent.html` - Enhanced version with gesture detection
- `gesture_server.py` - WebSocket server that connects to agents
- `vision_command_agent.py` - Actual development automation
- `hand_physics_update.js` - Fun physics additions (WIP)

## Original Credits

Hand tracking visualization by [@measure_plan](https://twitter.com/measure_plan)
- Original repo: https://github.com/collidingScopes/threejs-handtracking-101

## Collaboration

This project demonstrates how computer vision (hand tracking) can be combined with AI agents for gesture-controlled development workflows.
