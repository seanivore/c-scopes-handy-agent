#!/usr/bin/env python3
"""
Web server bridge between hand tracking and agent
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os

app = Flask(__name__)
CORS(app)  # Allow browser to connect

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
    return """
    <h1>Gesture Agent Bridge</h1>
    <p>Server is running! Open hand_tracking_bridge.html in another tab.</p>
    <p>Gestures received: {}</p>
    """.format(handler.gesture_count)

if __name__ == '__main__':
    print("Starting Gesture Bridge Server...")
    print("Open hand_tracking_bridge.html in your browser")
    print("Server running at http://localhost:5000")
    app.run(debug=True, port=5000)
