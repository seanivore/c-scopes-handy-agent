// Natural Human Gesture Detection
// Big, expressive movements that actually work!

const HumanGestures = {
    // Gesture detection parameters
    gestureHistory: [],
    maxHistoryLength: 20,
    
    // Update gesture history
    updateHistory: function(landmarks, handedness = 'Right') {
        const now = Date.now();
        
        // Key landmark positions
        const palmBase = landmarks[0];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        
        this.gestureHistory.push({
            time: now,
            handedness: handedness,
            palmBase: { x: palmBase.x, y: palmBase.y, z: palmBase.z },
            indexTip: { x: indexTip.x, y: indexTip.y },
            middleTip: { x: middleTip.x, y: middleTip.y },
            landmarks: landmarks
        });
        
        // Limit history
        if (this.gestureHistory.length > this.maxHistoryLength) {
            this.gestureHistory.shift();
        }
    },
    
    // WIPE FOREHEAD - Close action
    detectWipeForehead: function() {
        if (this.gestureHistory.length < 10) return null;
        
        const recent = this.gestureHistory.slice(-10);
        const start = recent[0];
        const end = recent[recent.length - 1];
        
        // Hand should start high (forehead level)
        const startAtForehead = start.palmBase.y < 0.35;
        
        // Move horizontally
        const horizontalMovement = Math.abs(end.palmBase.x - start.palmBase.x) > 0.2;
        
        // Slight upward arc
        const upwardMotion = end.palmBase.y < start.palmBase.y;
        
        if (startAtForehead && horizontalMovement && upwardMotion) {
            return {
                type: 'wipeForehead',
                direction: end.palmBase.x > start.palmBase.x ? 'right' : 'left',
                confidence: 0.9
            };
        }
        return null;
    },
    
    // HANDS OVER EYES - Sleep/screen off
    detectHandsOverEyes: function(leftLandmarks, rightLandmarks) {
        if (!leftLandmarks || !rightLandmarks) return null;
        
        const leftPalm = leftLandmarks[0];
        const rightPalm = rightLandmarks[0];
        
        // Both hands at eye level
        const atEyeLevel = leftPalm.y > 0.2 && leftPalm.y < 0.4 &&
                          rightPalm.y > 0.2 && rightPalm.y < 0.4;
        
        // Hands covering eye region (center of screen)
        const coveringEyes = leftPalm.x < 0.45 && rightPalm.x > 0.55;
        
        // Palms facing camera (z coordinate)
        const palmsFacingCamera = leftLandmarks[12].z < leftLandmarks[0].z &&
                                 rightLandmarks[12].z < rightLandmarks[0].z;
        
        if (atEyeLevel && coveringEyes && palmsFacingCamera) {
            return {
                type: 'handsOverEyes',
                confidence: 0.95
            };
        }
        return null;
    },
    
    // MASK PULL-OFF - Mute (then volume with fingers)
    detectMaskPullOff: function() {
        if (this.gestureHistory.length < 8) return null;
        
        const recent = this.gestureHistory.slice(-8);
        const start = recent[0];
        const end = recent[recent.length - 1];
        
        // Start at chin level
        const startAtChin = start.palmBase.y > 0.55 && start.palmBase.y < 0.7;
        
        // Pull downward
        const pullDown = end.palmBase.y > start.palmBase.y + 0.1;
        
        // Hand moving away from face (z getting more negative)
        const movingAway = end.palmBase.z < start.palmBase.z;
        
        if (startAtChin && pullDown && movingAway) {
            // Check for immediate finger count after gesture
            const fingerCount = this.countExtendedFingers(recent[recent.length - 1].landmarks);
            
            return {
                type: 'maskPullOff',
                volumeLevel: fingerCount,
                confidence: 0.85
            };
        }
        return null;
    },
    
    // TWO-HAND ELEVATOR - Scroll up/down
    detectTwoHandElevator: function(leftLandmarks, rightLandmarks) {
        if (!leftLandmarks || !rightLandmarks || this.gestureHistory.length < 5) return null;
        
        // Get current and past positions
        const currentLeft = leftLandmarks[0];
        const currentRight = rightLandmarks[0];
        
        // Find previous positions (about 5 frames ago)
        const history = this.gestureHistory.slice(-5);
        const pastEntry = history[0];
        
        if (!pastEntry) return null;
        
        // Calculate vertical movement
        const leftMovement = currentLeft.y - pastEntry.palmBase.y;
        const rightMovement = currentRight.y - pastEntry.palmBase.y;
        
        // Both hands moving in same direction
        const sameDirection = Math.sign(leftMovement) === Math.sign(rightMovement);
        const significantMovement = Math.abs(leftMovement) > 0.05 && Math.abs(rightMovement) > 0.05;
        
        // Hands roughly parallel
        const parallel = Math.abs(currentLeft.y - currentRight.y) < 0.1;
        
        if (sameDirection && significantMovement && parallel) {
            return {
                type: 'twoHandElevator',
                direction: leftMovement > 0 ? 'down' : 'up',
                speed: Math.abs(leftMovement + rightMovement) / 2,
                confidence: 0.9
            };
        }
        return null;
    },
    
    // FACE PALM - Undo action
    detectFacePalm: function() {
        if (this.gestureHistory.length < 15) return null;
        
        const recent = this.gestureHistory.slice(-15);
        const current = recent[recent.length - 1];
        
        // Palm at face level
        const atFaceLevel = current.palmBase.y > 0.3 && current.palmBase.y < 0.5;
        const centerX = current.palmBase.x > 0.4 && current.palmBase.x < 0.6;
        
        // Hand has been still for a bit
        const wasStill = recent.slice(-5).every(entry => {
            const dx = Math.abs(entry.palmBase.x - current.palmBase.x);
            const dy = Math.abs(entry.palmBase.y - current.palmBase.y);
            return dx < 0.02 && dy < 0.02;
        });
        
        // Palm facing inward (toward face)
        const palmFacingIn = current.landmarks[0].z > current.landmarks[12].z;
        
        if (atFaceLevel && centerX && wasStill && palmFacingIn) {
            return {
                type: 'facePalm',
                confidence: 0.85
            };
        }
        return null;
    },
    
    // ITALIAN CHEF KISS - Save/favorite
    detectChefKiss: function() {
        if (this.gestureHistory.length < 12) return null;
        
        const recent = this.gestureHistory.slice(-12);
        
        // Phase 1: Fingers together (pinch gesture)
        const startPhase = recent.slice(0, 4);
        const fingersTogether = startPhase.some(entry => {
            const thumb = entry.landmarks[4];
            const index = entry.landmarks[8];
            const distance = Math.sqrt(
                Math.pow(thumb.x - index.x, 2) + 
                Math.pow(thumb.y - index.y, 2)
            );
            return distance < 0.05;
        });
        
        // Phase 2: Move to mouth level
        const midPhase = recent.slice(4, 8);
        const atMouthLevel = midPhase.some(entry => {
            return entry.palmBase.y > 0.4 && entry.palmBase.y < 0.55;
        });
        
        // Phase 3: Flick away
        const endPhase = recent.slice(8);
        const flickAway = endPhase[endPhase.length - 1].palmBase.x - 
                         endPhase[0].palmBase.x > 0.1;
        
        if (fingersTogether && atMouthLevel && flickAway) {
            return {
                type: 'chefKiss',
                confidence: 0.8
            };
        }
        return null;
    },
    
    // Helper: Count extended fingers
    countExtendedFingers: function(landmarks) {
        let count = 0;
        const tips = [4, 8, 12, 16, 20];
        const bases = [2, 6, 10, 14, 18];
        
        for (let i = 0; i < 5; i++) {
            if (landmarks[tips[i]].y < landmarks[bases[i]].y - 0.05) {
                count++;
            }
        }
        return count;
    },
    
    // Main detection function
    detect: function(results) {
        const gestures = [];
        
        // Update history with primary hand
        if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
            const handedness = results.multiHandedness[0].label;
            this.updateHistory(results.multiHandLandmarks[0], handedness);
            
            // Single hand gestures
            const wipeForehead = this.detectWipeForehead();
            if (wipeForehead) gestures.push(wipeForehead);
            
            const maskPullOff = this.detectMaskPullOff();
            if (maskPullOff) gestures.push(maskPullOff);
            
            const facePalm = this.detectFacePalm();
            if (facePalm) gestures.push(facePalm);
            
            const chefKiss = this.detectChefKiss();
            if (chefKiss) gestures.push(chefKiss);
        }
        
        // Two hand gestures
        if (results.multiHandLandmarks && results.multiHandLandmarks.length >= 2) {
            const leftIdx = results.multiHandedness[0].label === 'Left' ? 0 : 1;
            const rightIdx = 1 - leftIdx;
            
            const handsOverEyes = this.detectHandsOverEyes(
                results.multiHandLandmarks[leftIdx],
                results.multiHandLandmarks[rightIdx]
            );
            if (handsOverEyes) gestures.push(handsOverEyes);
            
            const elevator = this.detectTwoHandElevator(
                results.multiHandLandmarks[leftIdx],
                results.multiHandLandmarks[rightIdx]
            );
            if (elevator) gestures.push(elevator);
        }
        
        return gestures;
    }
};

// Example usage for different contexts
const ActionMapper = {
    mapGestureToAction: function(gesture, context) {
        switch (gesture.type) {
            case 'wipeForehead':
                if (context.hasModal) return 'closeModal';
                if (context.hasActiveWindow) return 'closeWindow';
                return 'exitApp';
                
            case 'handsOverEyes':
                return 'sleepDisplay';
                
            case 'maskPullOff':
                return {
                    action: 'mute',
                    volume: gesture.volumeLevel
                };
                
            case 'twoHandElevator':
                return {
                    action: 'scroll',
                    direction: gesture.direction,
                    speed: gesture.speed
                };
                
            case 'facePalm':
                return 'undo';
                
            case 'chefKiss':
                return 'save';
                
            default:
                return null;
        }
    }
};
