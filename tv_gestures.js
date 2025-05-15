// Large-Scale TV Gesture Detection
// Big movements for couch distance!

const TVGestures = {
    // Gesture history for detecting movements
    handHistory: [],
    historySize: 10,
    
    // Add hand position to history
    updateHistory: function(landmarks) {
        const palmBase = landmarks[0];
        const now = Date.now();
        
        this.handHistory.push({
            x: palmBase.x,
            y: palmBase.y,
            time: now,
            fingers: this.countExtendedFingers(landmarks)
        });
        
        // Keep history size limited
        if (this.handHistory.length > this.historySize) {
            this.handHistory.shift();
        }
    },
    
    // Count extended fingers (but we mostly ignore for big gestures)
    countExtendedFingers: function(landmarks) {
        let count = 0;
        const fingerTips = [4, 8, 12, 16, 20];
        const fingerBases = [2, 6, 10, 14, 18];
        
        for (let i = 0; i < 5; i++) {
            if (landmarks[fingerTips[i]].y < landmarks[fingerBases[i]].y) {
                count++;
            }
        }
        return count;
    },
    
    // Detect backhand swipe (right movement)
    detectBackhand: function() {
        if (this.handHistory.length < 5) return null;
        
        const recent = this.handHistory.slice(-5);
        const start = recent[0];
        const end = recent[recent.length - 1];
        
        const deltaX = end.x - start.x;
        const deltaTime = end.time - start.time;
        const velocity = Math.abs(deltaX) / deltaTime * 1000;
        
        // Big movement to the right
        if (deltaX > 0.15 && velocity > 300) {
            return {
                type: 'backhand',
                velocity: velocity,
                distance: deltaX
            };
        }
        return null;
    },
    
    // Detect fronthand slap (left movement)
    detectFronthand: function() {
        if (this.handHistory.length < 5) return null;
        
        const recent = this.handHistory.slice(-5);
        const start = recent[0];
        const end = recent[recent.length - 1];
        
        const deltaX = end.x - start.x;
        const deltaTime = end.time - start.time;
        const velocity = Math.abs(deltaX) / deltaTime * 1000;
        
        // Big movement to the left
        if (deltaX < -0.15 && velocity > 300) {
            return {
                type: 'fronthand',
                velocity: velocity,
                distance: Math.abs(deltaX)
            };
        }
        return null;
    },
    
    // Detect push away (forward movement)
    detectPushAway: function(landmarks) {
        if (this.handHistory.length < 7) return null;
        
        const recent = this.handHistory.slice(-7);
        const start = recent[0];
        const end = recent[recent.length - 1];
        
        // Check if palm is facing forward (using wrist and middle finger base)
        const wrist = landmarks[0];
        const middleBase = landmarks[9];
        const isPalmForward = middleBase.z < wrist.z;
        
        // Look for forward push motion (hand gets smaller = moving away)
        const startSize = this.getHandSize(landmarks);
        const endSize = this.getHandSize(landmarks);
        const sizeRatio = endSize / startSize;
        
        if (isPalmForward && sizeRatio < 0.8 && recent[0].y < 0.6) {
            return {
                type: 'pushAway',
                distance: startSize - endSize
            };
        }
        return null;
    },
    
    // Detect zoom gestures (two hands)
    detectZoom: function(leftLandmarks, rightLandmarks) {
        if (!leftLandmarks || !rightLandmarks) return null;
        
        // Get palm centers
        const leftPalm = leftLandmarks[0];
        const rightPalm = rightLandmarks[0];
        
        const distance = Math.sqrt(
            Math.pow(leftPalm.x - rightPalm.x, 2) +
            Math.pow(leftPalm.y - rightPalm.y, 2)
        );
        
        if (!this.lastHandDistance) {
            this.lastHandDistance = distance;
            return null;
        }
        
        const deltaDistance = distance - this.lastHandDistance;
        this.lastHandDistance = distance;
        
        // Zoom out (hands coming together)
        if (deltaDistance < -0.02) {
            return {
                type: 'zoomOut',
                scale: 1 + deltaDistance
            };
        }
        
        // Zoom in (hands spreading apart)
        if (deltaDistance > 0.02) {
            return {
                type: 'zoomIn',
                scale: 1 + deltaDistance
            };
        }
        
        return null;
    },
    
    // Detect rotation (basketball palm)
    detectRotation: function(landmarks) {
        // Check if hand is in "palming" position
        const fingerSpread = this.getFingerSpread(landmarks);
        
        if (fingerSpread > 0.15) { // Fingers spread wide
            if (!this.rotationStartAngle) {
                this.rotationStartAngle = this.getHandAngle(landmarks);
                return null;
            }
            
            const currentAngle = this.getHandAngle(landmarks);
            const deltaAngle = currentAngle - this.rotationStartAngle;
            
            if (Math.abs(deltaAngle) > 0.1) {
                return {
                    type: 'rotate',
                    angle: deltaAngle,
                    degrees: deltaAngle * (180 / Math.PI)
                };
            }
        } else {
            this.rotationStartAngle = null;
        }
        
        return null;
    },
    
    // Helper: Get hand size (for push detection)
    getHandSize: function(landmarks) {
        const thumb = landmarks[4];
        const pinky = landmarks[20];
        return Math.sqrt(
            Math.pow(thumb.x - pinky.x, 2) +
            Math.pow(thumb.y - pinky.y, 2)
        );
    },
    
    // Helper: Get finger spread (for rotation detection)
    getFingerSpread: function(landmarks) {
        const index = landmarks[8];
        const pinky = landmarks[20];
        return Math.abs(index.x - pinky.x);
    },
    
    // Helper: Get hand angle
    getHandAngle: function(landmarks) {
        const wrist = landmarks[0];
        const middle = landmarks[12];
        return Math.atan2(middle.y - wrist.y, middle.x - wrist.x);
    },
    
    // Main detection function
    detectGestures: function(landmarks, leftLandmarks, rightLandmarks) {
        const gestures = [];
        
        // Update history first
        if (landmarks) {
            this.updateHistory(landmarks);
            
            // Single hand gestures
            const backhand = this.detectBackhand();
            if (backhand) gestures.push(backhand);
            
            const fronthand = this.detectFronthand();
            if (fronthand) gestures.push(fronthand);
            
            const pushAway = this.detectPushAway(landmarks);
            if (pushAway) gestures.push(pushAway);
            
            const rotation = this.detectRotation(landmarks);
            if (rotation) gestures.push(rotation);
        }
        
        // Two hand gestures
        if (leftLandmarks && rightLandmarks) {
            const zoom = this.detectZoom(leftLandmarks, rightLandmarks);
            if (zoom) gestures.push(zoom);
        }
        
        return gestures;
    }
};

// Context-aware gesture handler
const ContextHandler = {
    // Z-layer priorities
    layers: {
        UI_CONTROLS: 100,
        MODALS: 75,
        SELECTED_OBJECTS: 50,
        CANVAS: 25,
        BACKGROUND: 0
    },
    
    // Get highest priority action for gesture
    getContextAction: function(gesture, uiState) {
        const actions = [];
        
        // Check each layer for possible actions
        if (gesture.type === 'backhand') {
            // Check for submit button
            if (uiState.hasSubmitButton) {
                actions.push({
                    priority: this.layers.UI_CONTROLS,
                    action: 'submit'
                });
            }
            
            // Check for selected object
            if (uiState.selectedObject) {
                actions.push({
                    priority: this.layers.SELECTED_OBJECTS,
                    action: 'moveRight'
                });
            }
            
            // Default navigation
            actions.push({
                priority: this.layers.BACKGROUND,
                action: 'navigateLeft'
            });
        }
        
        // Sort by priority and return highest
        actions.sort((a, b) => b.priority - a.priority);
        return actions[0].action;
    }
};
