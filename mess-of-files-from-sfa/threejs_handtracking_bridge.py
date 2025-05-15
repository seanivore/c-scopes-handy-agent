#!/usr/bin/env python3
"""
Integration with collidingScopes' Three.js hand tracking
Builds on: https://github.com/collidingScopes/threejs-handtracking-101
"""

import asyncio
import websockets
import json
from vision_command_agent_real import VisionCommandAgent

class HandTrackingBridge:
    """Bridge between Three.js hand tracking and Python agents"""
    
    def __init__(self):
        self.agent = VisionCommandAgent()
        self.clients = set()
        
    async def handle_gesture(self, websocket, path):
        """Handle incoming gesture data from Three.js frontend"""
        self.clients.add(websocket)
        try:
            async for message in websocket:
                data = json.loads(message)
                
                # Expected format from Three.js tracking
                if data.get('type') == 'gesture':
                    gesture = data.get('gesture')
                    confidence = data.get('confidence', 1.0)
                    hands = data.get('hands', 1)  # Support dual hand gestures
                    
                    print(f"Received: {gesture} (confidence: {confidence}, hands: {hands})")
                    
                    # Process through agent
                    if gesture == 'thumbs_up':
                        result = self.agent.thumbs_up()
                    elif gesture == 'peace_sign':
                        result = self.agent.peace_sign()
                    elif gesture == 'wave':
                        result = self.agent.wave()
                    elif gesture == 'point':
                        result = self.agent.point()
                    elif gesture == 'circle':
                        result = self.agent.circle()
                    else:
                        result = f"Unknown gesture: {gesture}"
                    
                    # Send result back
                    await websocket.send(json.dumps({
                        'type': 'result',
                        'gesture': gesture,
                        'result': result,
                        'success': True
                    }))
                    
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.clients.remove(websocket)
    
    async def start_server(self):
        """Start WebSocket server for Three.js integration"""
        print("Starting WebSocket bridge for Three.js hand tracking...")
        print("Connect from: https://github.com/collidingScopes/threejs-handtracking-101")
        print("WebSocket endpoint: ws://localhost:8765")
        
        async with websockets.serve(self.handle_gesture, "localhost", 8765):
            await asyncio.Future()  # Run forever

# Integration guide for collidingScopes' repo
INTEGRATION_CODE = """
// Add this to the Three.js hand tracking code
// Connect to Python agent bridge

const ws = new WebSocket('ws://localhost:8765');

ws.onopen = () => {
    console.log('Connected to Python agent bridge');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Agent result:', data.result);
    // Display result in UI
};

// In your gesture detection function:
function sendGestureToPython(gesture, confidence, numHands) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'gesture',
            gesture: gesture,
            confidence: confidence,
            hands: numHands
        }));
    }
}

// Example: When detecting thumbs up
if (detectThumbsUp(handLandmarks)) {
    sendGestureToPython('thumbs_up', 0.95, 1);
}
"""

if __name__ == "__main__":
    print("=== Three.js Hand Tracking + Python Agent Bridge ===")
    print("\nThis integrates with collidingScopes' hand tracking:")
    print("https://github.com/collidingScopes/threejs-handtracking-101")
    print("\nIntegration code:")
    print(INTEGRATION_CODE)
    print("\nStarting bridge server...")
    
    bridge = HandTrackingBridge()
    asyncio.run(bridge.start_server())
