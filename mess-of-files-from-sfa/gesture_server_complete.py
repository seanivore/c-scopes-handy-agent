#!/usr/bin/env python3
"""
Web server bridge between hand tracking and agent - with HTML serving
"""

from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import subprocess
import os

app = Flask(__name__)
CORS(app)  # Allow browser to connect

# HTML content embedded in the server
HTML_CONTENT = '''
<!DOCTYPE html>
<html>
<head>
    <title>Gesture to Agent Bridge</title>
    <script src="https://unpkg.com/@mediapipe/hands/hands.js"></script>
    <script src="https://unpkg.com/@mediapipe/camera_utils/camera_utils.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        #videoElement { width: 320px; height: 240px; border: 2px solid #333; }
        #status { margin: 10px 0; font-weight: bold; }
        #holdIndicator { height: 20px; background: #f0f0f0; margin: 10px 0; }
        #holdProgress { height: 100%; background: #4CAF50; width: 0%; transition: width 0.1s; }
        #log { background: #f0f0f0; padding: 10px; height: 200px; overflow-y: auto; }
        .gesture { background: #4CAF50; color: white; padding: 5px 10px; margin: 5px; display: inline-block; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>Hand Gesture → Python Agent Bridge</h1>
    
    <video id="videoElement" autoplay></video>
    <div id="status">Initializing camera...</div>
    <div id="holdIndicator"><div id="holdProgress"></div></div>
    
    <h3>Detected Gestures:</h3>
    <div id="log"></div>
    
    <h3>How it works:</h3>
    <ul>
        <li>👍 Thumbs up = Run tests</li>
        <li>✌️ Peace sign = Commit code</li>
        <li>👋 Open hand = Next suggestion</li>
        <li>☝️ Pointing = Explain code</li>
        <li>🤏 Pinch = Refactor</li>
    </ul>

    <script>
        const videoElement = document.getElementById('videoElement');
        const statusElement = document.getElementById('status');
        const logElement = document.getElementById('log');
        const holdProgress = document.getElementById('holdProgress');
        
        // Hand tracking setup
        const hands = new Hands({
            locateFile: (file) => {
                return `https://unpkg.com/@mediapipe/hands/${file}`;
            }
        });
        
        hands.setOptions({
            selfieMode: true,
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5
        });
        
        // Gesture detection
        function detectGesture(landmarks) {
            // Simple gesture detection based on finger positions
            const thumbTip = landmarks[4];
            const thumbBase = landmarks[2];
            const indexTip = landmarks[8];
            const middleTip = landmarks[12];
            const ringTip = landmarks[16];
            const pinkyTip = landmarks[20];
            
            // Thumbs up: thumb up, other fingers down
            if (thumbTip.y < thumbBase.y && 
                indexTip.y > landmarks[6].y &&
                middleTip.y > landmarks[10].y) {
                return 'thumbs_up';
            }
            
            // Peace sign: index and middle up
            if (indexTip.y < landmarks[6].y &&
                middleTip.y < landmarks[10].y &&
                ringTip.y > landmarks[14].y) {
                return 'peace_sign';
            }
            
            // Open hand: all fingers extended
            if (indexTip.y < landmarks[6].y &&
                middleTip.y < landmarks[10].y &&
                ringTip.y < landmarks[14].y &&
                pinkyTip.y < landmarks[18].y) {
                return 'wave';
            }
            
            // Pointing: just index extended
            if (indexTip.y < landmarks[6].y &&
                middleTip.y > landmarks[10].y &&
                ringTip.y > landmarks[14].y) {
                return 'point';
            }
            
            // Pinch: thumb and index close
            const distance = Math.sqrt(
                Math.pow(thumbTip.x - indexTip.x, 2) + 
                Math.pow(thumbTip.y - indexTip.y, 2)
            );
            if (distance < 0.05) {
                return 'pinch';
            }
            
            return null;
        }
        
        let lastGesture = null;
        let gestureCount = 0;
        let gestureHoldTime = 0;
        const GESTURE_THRESHOLD = 500; // milliseconds to hold gesture
        
        hands.onResults((results) => {
            if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
                const gesture = detectGesture(results.multiHandLandmarks[0]);
                
                if (gesture === lastGesture && gesture !== null) {
                    // Same gesture, increase hold time
                    gestureHoldTime += 33; // ~30fps
                    
                    // If held long enough, trigger it
                    if (gestureHoldTime >= GESTURE_THRESHOLD) {
                        gestureCount++;
                        
                        // Log gesture
                        const gestureDiv = document.createElement('div');
                        gestureDiv.className = 'gesture';
                        gestureDiv.textContent = `${gesture} (#${gestureCount})`;
                        logElement.appendChild(gestureDiv);
                        logElement.scrollTop = logElement.scrollHeight;
                        
                        // Send to Python backend
                        sendToPython(gesture);
                        
                        // Reset hold time to prevent multiple triggers
                        gestureHoldTime = -1000; // Negative to add cooldown
                    }
                    
                    // Update progress bar
                    const progress = Math.min(100, (gestureHoldTime / GESTURE_THRESHOLD) * 100);
                    holdProgress.style.width = progress + '%';
                } else {
                    // Different gesture or no gesture, reset
                    lastGesture = gesture;
                    gestureHoldTime = 0;
                    holdProgress.style.width = '0%';
                }
            } else {
                // No hand detected, reset
                lastGesture = null;
                gestureHoldTime = 0;
                holdProgress.style.width = '0%';
            }
        });
        
        // Camera setup
        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({image: videoElement});
            },
            width: 320,
            height: 240
        });
        
        camera.start().then(() => {
            statusElement.textContent = 'Camera ready! Show hand gestures';
        }).catch(err => {
            statusElement.textContent = 'Camera error: ' + err;
        });
        
        // Send gesture to Python server
        function sendToPython(gesture) {
            fetch('/gesture', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({gesture: gesture})
            })
            .then(response => response.json())
            .then(data => {
                console.log('Server response:', data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    </script>
</body>
</html>
'''

class GestureHandler:
    def __init__(self):
        self.gesture_count = 0
        
    def handle_gesture(self, gesture_type):
        """Process gesture and return action result"""
        self.gesture_count += 1
        print(f"Gesture {self.gesture_count}: {gesture_type}")
        
        actions = {
            'thumbs_up': self.run_tests,
            'peace_sign': self.make_commit,
            'wave': self.next_suggestion,
            'point': self.explain_code,
            'pinch': self.refactor
        }
        
        if gesture_type in actions:
            return actions[gesture_type]()
        return f"Unknown gesture: {gesture_type}"
    
    def run_tests(self):
        """Actually run tests"""
        try:
            result = subprocess.run(['python', '-m', 'pytest'], 
                                  capture_output=True, text=True)
            return f"Tests: {'PASSED' if result.returncode == 0 else 'FAILED'}"
        except:
            return "No tests found - would create some!"
    
    def make_commit(self):
        """Create a git commit"""
        try:
            # Check if there are changes
            status = subprocess.run(['git', 'status', '--porcelain'], 
                                  capture_output=True, text=True)
            if status.stdout.strip():
                subprocess.run(['git', 'add', '.'])
                subprocess.run(['git', 'commit', '-m', 'Gesture commit'])
                return "Created commit!"
            return "No changes to commit"
        except:
            return "Git not initialized"
    
    def next_suggestion(self):
        """Give code suggestions"""
        suggestions = [
            "Add type hints to functions",
            "Extract magic numbers to constants",
            "Add error handling",
            "Write unit tests",
            "Improve variable names"
        ]
        import random
        return random.choice(suggestions)
    
    def explain_code(self):
        """Explain current code context"""
        return "Would explain code at cursor position"
    
    def refactor(self):
        """Suggest refactoring"""
        return "Would analyze and refactor selected code"

handler = GestureHandler()

@app.route('/gesture', methods=['POST'])
def receive_gesture():
    data = request.json
    gesture = data.get('gesture')
    
    if gesture:
        result = handler.handle_gesture(gesture)
        return jsonify({
            'status': 'success',
            'gesture': gesture,
            'result': result,
            'count': handler.gesture_count
        })
    
    return jsonify({'status': 'error', 'message': 'No gesture provided'})

@app.route('/')
def index():
    return render_template_string(HTML_CONTENT)

if __name__ == '__main__':
    print("Starting Gesture Bridge Server...")
    print("Open http://localhost:8080 in your browser")
    print("The camera will ask for permission")
    app.run(debug=True, port=8080, host='0.0.0.0')
