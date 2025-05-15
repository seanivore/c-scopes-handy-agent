#!/bin/bash
# Quick setup script for the hand tracking agent

echo "🤚 Hand Tracking + Agent Bridge Setup"
echo "===================================="

# Check if websockets is installed
python -c "import websockets" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing websockets..."
    pip install websockets
fi

# Start servers in background
echo "Starting gesture server..."
python gesture_server.py &
GESTURE_PID=$!

echo "Starting web server..."
python3 -m http.server 8000 &
WEB_PID=$!

echo ""
echo "✅ Servers running!"
echo "Open in browser: http://localhost:8000/index_with_agent.html"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait and cleanup on exit
trap "kill $GESTURE_PID $WEB_PID 2>/dev/null" EXIT
wait
