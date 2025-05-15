#!/usr/bin/env python3
"""
Simple WebSocket server for hand tracking integration
"""

import asyncio
import json
from datetime import datetime

# Use the websockets library
import websockets

class GestureServer:
    def __init__(self):
        self.clients = set()
        self.gesture_count = 0
        
    async def handle_websocket(self, websocket, path):
        """Handle WebSocket connections"""
        self.clients.add(websocket)
        print(f"Client connected. Total clients: {len(self.clients)}")
        
        try:
            async for message in websocket:
                data = json.loads(message)
                response = self.process_gesture(data)
                
                # Send response back to client
                await websocket.send(json.dumps(response))
                
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.clients.remove(websocket)
            print(f"Client disconnected. Total clients: {len(self.clients)}")
    
    def process_gesture(self, data):
        """Process incoming gesture data"""
        self.gesture_count += 1
        gesture = data.get('gesture', 'unknown')
        timestamp = datetime.now().strftime('%H:%M:%S')
        
        # Simulate different responses based on gesture
        responses = {
            'thumbs_up': f"Running tests... ✓ All tests passed!",
            'peace_sign': f"Git commit created: 'Update at {timestamp}'",
            'wave': f"Next suggestion: Add error handling to main function",
            'point': f"This function processes gesture input from the webcam",
            'fist': f"Emergency stop activated! All processes halted."
        }
        
        result = responses.get(gesture, f"Unknown gesture: {gesture}")
        
        print(f"[{timestamp}] Gesture {self.gesture_count}: {gesture}")
        print(f"  → {result}")
        
        return {
            'type': 'result',
            'gesture': gesture,
            'result': result,
            'count': self.gesture_count,
            'timestamp': timestamp
        }
    
    async def start(self):
        """Start the WebSocket server"""
        print("Starting Hand Tracking → Python Agent Bridge")
        print("Server: ws://localhost:8765")
        print("\nTo use:")
        print("1. Run this server")
        print("2. Open index_with_agent.html in your browser")
        print("3. Make hand gestures!")
        print("\nGestures:")
        print("👍 Thumbs up = Run tests")
        print("✌️ Peace sign = Commit code")
        print("👋 Wave = Next suggestion")
        print("👆 Point = Explain code")
        print("✊ Fist = Emergency stop")
        print("\nWaiting for connections...")
        
        async with websockets.serve(self.handle_websocket, "localhost", 8765):
            await asyncio.Future()  # Run forever

if __name__ == "__main__":
    server = GestureServer()
    asyncio.run(server.start())
