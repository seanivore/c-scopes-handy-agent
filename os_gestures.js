// Standard OS Gesture Detection Library
// Based on iOS/macOS gesture recognizers

const OSGestures = {
    // Gesture state tracking
    lastPinchDistance: null,
    lastRotationAngle: null,
    swipeStartPos: null,
    swipeStartTime: null,
    tapCount: 0,
    lastTapTime: 0,
    
    // Pinch to Zoom (two hands)
    detectPinch: function(leftLandmarks, rightLandmarks) {
        if (!leftLandmarks || !rightLandmarks) return null;
        
        // Use index fingers from both hands
        const leftIndex = leftLandmarks[8];
        const rightIndex = rightLandmarks[8];
        
        const distance = Math.sqrt(
            Math.pow(leftIndex.x - rightIndex.x, 2) + 
            Math.pow(leftIndex.y - rightIndex.y, 2)
        );
        
        if (this.lastPinchDistance === null) {
            this.lastPinchDistance = distance;
            return null;
        }
        
        const scale = distance / this.lastPinchDistance;
        this.lastPinchDistance = distance;
        
        return {
            type: 'pinch',
            scale: scale,
            distance: distance
        };
    },
    
    // Rotation (two hands)
    detectRotation: function(leftLandmarks, rightLandmarks) {
        if (!leftLandmarks || !rightLandmarks) return null;
        
        const leftIndex = leftLandmarks[8];
        const rightIndex = rightLandmarks[8];
        
        // Calculate angle between hands
        const angle = Math.atan2(
            rightIndex.y - leftIndex.y,
            rightIndex.x - leftIndex.x
        );
        
        if (this.lastRotationAngle === null) {
            this.lastRotationAngle = angle;
            return null;
        }
        
        const rotation = angle - this.lastRotationAngle;
        this.lastRotationAngle = angle;
        
        return {
            type: 'rotate',
            angle: rotation,
            degrees: rotation * (180 / Math.PI)
        };
    },
    
    // Swipe (single hand)
    detectSwipe: function(landmarks) {
        const indexTip = landmarks[8];
        const currentTime = Date.now();
        
        if (!this.swipeStartPos) {
            this.swipeStartPos = { x: indexTip.x, y: indexTip.y };
            this.swipeStartTime = currentTime;
            return null;
        }
        
        const deltaX = indexTip.x - this.swipeStartPos.x;
        const deltaY = indexTip.y - this.swipeStartPos.y;
        const deltaTime = currentTime - this.swipeStartTime;
        
        // Check if movement is significant and fast enough
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const velocity = distance / deltaTime * 1000; // pixels per second
        
        if (distance > 0.2 && velocity > 500) {
            // Determine swipe direction
            let direction;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                direction = deltaX > 0 ? 'right' : 'left';
            } else {
                direction = deltaY > 0 ? 'down' : 'up';
            }
            
            // Reset
            this.swipeStartPos = null;
            this.swipeStartTime = null;
            
            return {
                type: 'swipe',
                direction: direction,
                velocity: velocity,
                distance: distance
            };
        }
        
        // Reset if gesture is too slow
        if (deltaTime > 500) {
            this.swipeStartPos = { x: indexTip.x, y: indexTip.y };
            this.swipeStartTime = currentTime;
        }
        
        return null;
    },
    
    // Tap (quick point)
    detectTap: function(landmarks) {
        const indexTip = landmarks[8];
        const currentTime = Date.now();
        
        // Check if index finger is extended (pointing)
        const isPointing = landmarks[8].y < landmarks[6].y &&
                          landmarks[12].y > landmarks[10].y;
        
        if (isPointing) {
            // Double tap detection
            if (currentTime - this.lastTapTime < 300) {
                this.tapCount++;
            } else {
                this.tapCount = 1;
            }
            
            this.lastTapTime = currentTime;
            
            return {
                type: 'tap',
                count: this.tapCount,
                position: { x: indexTip.x, y: indexTip.y }
            };
        }
        
        return null;
    },
    
    // Pan (drag with closed fist)
    detectPan: function(landmarks) {
        // Check if hand is in fist position
        const isFist = landmarks[8].y > landmarks[6].y &&
                      landmarks[12].y > landmarks[10].y &&
                      landmarks[16].y > landmarks[14].y;
        
        if (isFist) {
            const palmCenter = landmarks[0];
            
            if (!this.lastPanPosition) {
                this.lastPanPosition = { x: palmCenter.x, y: palmCenter.y };
                return null;
            }
            
            const deltaX = palmCenter.x - this.lastPanPosition.x;
            const deltaY = palmCenter.y - this.lastPanPosition.y;
            
            this.lastPanPosition = { x: palmCenter.x, y: palmCenter.y };
            
            return {
                type: 'pan',
                deltaX: deltaX,
                deltaY: deltaY,
                position: { x: palmCenter.x, y: palmCenter.y }
            };
        } else {
            this.lastPanPosition = null;
        }
        
        return null;
    },
    
    // Long Press (hold point for 1 second)
    detectLongPress: function(landmarks) {
        const isPointing = landmarks[8].y < landmarks[6].y &&
                          landmarks[12].y > landmarks[10].y;
        
        if (isPointing) {
            if (!this.longPressStart) {
                this.longPressStart = Date.now();
                this.longPressPosition = { x: landmarks[8].x, y: landmarks[8].y };
            }
            
            const holdTime = Date.now() - this.longPressStart;
            
            // Check if finger hasn't moved much
            const moved = Math.sqrt(
                Math.pow(landmarks[8].x - this.longPressPosition.x, 2) +
                Math.pow(landmarks[8].y - this.longPressPosition.y, 2)
            );
            
            if (moved > 0.05) {
                // Finger moved, reset
                this.longPressStart = null;
                return null;
            }
            
            if (holdTime > 1000) {
                // Long press detected
                this.longPressStart = null;
                return {
                    type: 'longPress',
                    duration: holdTime,
                    position: this.longPressPosition
                };
            }
        } else {
            this.longPressStart = null;
        }
        
        return null;
    },
    
    // Reset all gesture states
    reset: function() {
        this.lastPinchDistance = null;
        this.lastRotationAngle = null;
        this.swipeStartPos = null;
        this.swipeStartTime = null;
        this.tapCount = 0;
        this.lastTapTime = 0;
        this.lastPanPosition = null;
        this.longPressStart = null;
    }
};

// Usage in your hand tracking loop:
function processGestures(results) {
    const gestures = [];
    
    if (results.multiHandLandmarks) {
        // Single hand gestures
        if (results.multiHandLandmarks[0]) {
            const swipe = OSGestures.detectSwipe(results.multiHandLandmarks[0]);
            if (swipe) gestures.push(swipe);
            
            const tap = OSGestures.detectTap(results.multiHandLandmarks[0]);
            if (tap) gestures.push(tap);
            
            const pan = OSGestures.detectPan(results.multiHandLandmarks[0]);
            if (pan) gestures.push(pan);
            
            const longPress = OSGestures.detectLongPress(results.multiHandLandmarks[0]);
            if (longPress) gestures.push(longPress);
        }
        
        // Two hand gestures
        if (results.multiHandLandmarks.length >= 2) {
            const pinch = OSGestures.detectPinch(
                results.multiHandLandmarks[0],
                results.multiHandLandmarks[1]
            );
            if (pinch) gestures.push(pinch);
            
            const rotation = OSGestures.detectRotation(
                results.multiHandLandmarks[0],
                results.multiHandLandmarks[1]
            );
            if (rotation) gestures.push(rotation);
        }
    }
    
    return gestures;
}

// Example whiteboard controls:
const WhiteboardController = {
    elements: [],
    selectedElement: null,
    
    handleGesture: function(gesture) {
        switch (gesture.type) {
            case 'tap':
                if (gesture.count === 1) {
                    // Select element at position
                    this.selectElementAt(gesture.position);
                } else if (gesture.count === 2) {
                    // Create new element
                    this.createElement(gesture.position);
                }
                break;
                
            case 'pan':
                // Move selected element
                if (this.selectedElement) {
                    this.selectedElement.x += gesture.deltaX;
                    this.selectedElement.y += gesture.deltaY;
                }
                break;
                
            case 'pinch':
                // Scale selected element
                if (this.selectedElement) {
                    this.selectedElement.scale *= gesture.scale;
                }
                break;
                
            case 'rotate':
                // Rotate selected element
                if (this.selectedElement) {
                    this.selectedElement.rotation += gesture.degrees;
                }
                break;
                
            case 'swipe':
                // Navigate between screens
                if (gesture.direction === 'left') {
                    this.nextPage();
                } else if (gesture.direction === 'right') {
                    this.previousPage();
                }
                break;
                
            case 'longPress':
                // Context menu
                this.showContextMenu(gesture.position);
                break;
        }
    }
};
