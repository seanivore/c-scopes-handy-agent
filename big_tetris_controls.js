/**
 * bigHandControls.js
 * BIG ITALIAN GESTURES for Tetris - no tiny finger stuff!
 */

// Configuration for BIG gestures
const bigGestureConfig = {
    enabled: false,
    swipeThreshold: 0.2,        // How far to swipe
    swipeSpeed: 300,            // Minimum pixels/sec
    rotateThreshold: 45,        // Degrees to trigger rotation
    dropGestureTime: 500,       // Hold time for drop gesture
    cooldownTime: 200,          // Between gestures
    sensitivity: 1.5
};

// Gesture tracking state
let gestureHistory = [];
let lastGestureTime = 0;
let videoElement = null;
let hands = null;
let camera = null;
let trackingStarted = false;

// Big gesture states
let currentGesture = null;
let gestureStartTime = 0;
let rotationStartAngle = null;

/**
 * Initialize BIG hand controls
 */
function initBigHandControls() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera not supported");
        return;
    }
    
    // Load MediaPipe if needed
    if (window.Hands) {
        setupBigGestures();
    } else {
        loadMediaPipeScripts().then(() => {
            setupBigGestures();
        });
    }
    
    // Add toggle button
    addBigGestureToggle();
}

/**
 * Set up MediaPipe for BIG gestures
 */
function setupBigGestures() {
    // Create video element
    videoElement = document.createElement('video');
    videoElement.id = 'big-gesture-video';
    videoElement.style.cssText = `
        position: absolute;
        right: 20px;
        bottom: 20px;
        width: 320px;
        height: 240px;
        border: 3px solid #ffcc00;
        border-radius: 10px;
        display: none;
        z-index: 150;
        transform: scaleX(-1);
    `;
    document.body.appendChild(videoElement);
    
    // Create canvas for visualization
    const canvas = document.createElement('canvas');
    canvas.id = 'big-gesture-canvas';
    canvas.width = 320;
    canvas.height = 240;
    canvas.style.cssText = `
        position: absolute;
        right: 20px;
        bottom: 20px;
        z-index: 151;
        pointer-events: none;
        transform: scaleX(-1);
    `;
    document.body.appendChild(canvas);
    
    // Initialize MediaPipe
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });
    
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
    });
    
    // Set up camera
    camera = new Camera(videoElement, {
        onFrame: async () => {
            if (bigGestureConfig.enabled) {
                await hands.send({ image: videoElement });
            }
        },
        width: 320,
        height: 240
    });
    
    // Handle results
    hands.onResults(handleBigGestureResults);
}

/**
 * Add toggle button for BIG gestures
 */
function addBigGestureToggle() {
    const button = document.createElement('button');
    button.id = 'big-gesture-button';
    button.className = 'button';
    button.innerHTML = '🤌';  // Italian gesture emoji!
    button.title = 'BIG Hand Controls';
    button.style.cssText = `
        position: absolute;
        left: 25px;
        top: 45px;
        z-index: 100;
        border-radius: 50%;
        font-size: 24px;
        width: 48px;
        height: 48px;
        padding: 0;
    `;
    
    button.addEventListener('click', toggleBigGestures);
    
    document.getElementById('button-container').appendChild(button);
    
    // Update controls display
    updateBigControlsDisplay();
}

/**
 * Toggle BIG gestures on/off
 */
function toggleBigGestures() {
    if (trackingStarted) {
        bigGestureConfig.enabled = !bigGestureConfig.enabled;
        
        // Toggle visibility
        videoElement.style.display = bigGestureConfig.enabled ? 'block' : 'none';
        document.getElementById('big-gesture-canvas').style.display = 
            bigGestureConfig.enabled ? 'block' : 'none';
            
        updateBigControlsDisplay();
        return;
    }
    
    // Start tracking
    if (camera) {
        camera.start()
            .then(() => {
                trackingStarted = true;
                bigGestureConfig.enabled = true;
                videoElement.style.display = 'block';
                document.getElementById('big-gesture-canvas').style.display = 'block';
                updateBigControlsDisplay();
            })
            .catch(error => {
                console.error('Camera error:', error);
            });
    }
}

/**
 * Update controls display for BIG gestures
 */
function updateBigControlsDisplay() {
    const controlsElement = document.getElementById('controls');
    if (!controlsElement) return;
    
    if (bigGestureConfig.enabled) {
        controlsElement.innerHTML = `
            BIG Hand Controls:<br>
            🫸 Swipe: Move left/right<br>
            🤌 Rotate hand: Rotate piece<br>
            🫳 Two hands down: Drop piece<br>
            👋 Wave: Pause game
        `;
    } else {
        controlsElement.innerHTML = `
            Controls:<br>
            ← → : Move left/right<br>
            ↑ : Rotate<br>
            ↓ : Move down<br>
            Space : Drop
        `;
    }
}

/**
 * Handle BIG gesture results
 */
function handleBigGestureResults(results) {
    if (!results.multiHandLandmarks || !results.multiHandLandmarks[0]) {
        currentGesture = null;
        rotationStartAngle = null;
        clearVisualization();
        return;
    }
    
    const landmarks = results.multiHandLandmarks[0];
    updateGestureHistory(landmarks);
    
    // Detect and handle BIG gestures
    detectSwipe();
    detectRotation(landmarks);
    detectDrop();
    
    // Visualize
    drawBigGestures(landmarks);
}

/**
 * Update gesture history for tracking movement
 */
function updateGestureHistory(landmarks) {
    const now = Date.now();
    const palmBase = landmarks[0];
    
    gestureHistory.push({
        time: now,
        x: palmBase.x,
        y: palmBase.y,
        landmarks: landmarks
    });
    
    // Keep history limited
    if (gestureHistory.length > 20) {
        gestureHistory.shift();
    }
}

/**
 * Detect BIG swipe gestures (left/right movement)
 */
function detectSwipe() {
    if (gestureHistory.length < 5) return;
    
    const now = Date.now();
    if (now - lastGestureTime < bigGestureConfig.cooldownTime) return;
    
    const recent = gestureHistory.slice(-5);
    const start = recent[0];
    const end = recent[recent.length - 1];
    
    const deltaX = end.x - start.x;
    const deltaTime = end.time - start.time;
    const velocity = Math.abs(deltaX) / deltaTime * 1000;
    
    // BIG swipe detection
    if (Math.abs(deltaX) > bigGestureConfig.swipeThreshold && 
        velocity > bigGestureConfig.swipeSpeed) {
        
        if (deltaX > 0) {
            // Swipe right = move piece right
            if (window.movePiece) {
                window.movePiece(1, 0);
                lastGestureTime = now;
            }
        } else {
            // Swipe left = move piece left
            if (window.movePiece) {
                window.movePiece(-1, 0);
                lastGestureTime = now;
            }
        }
        
        // Clear history after swipe
        gestureHistory = [];
    }
}

/**
 * Detect hand rotation (like turning a doorknob)
 */
function detectRotation(landmarks) {
    // Use angle between wrist and middle finger
    const wrist = landmarks[0];
    const middleTip = landmarks[12];
    
    const angle = Math.atan2(middleTip.y - wrist.y, middleTip.x - wrist.x) * 180 / Math.PI;
    
    if (rotationStartAngle === null) {
        rotationStartAngle = angle;
        return;
    }
    
    const deltaAngle = angle - rotationStartAngle;
    
    // Check for significant rotation
    if (Math.abs(deltaAngle) > bigGestureConfig.rotateThreshold) {
        if (window.rotatePiece) {
            window.rotatePiece();
            lastGestureTime = Date.now();
        }
        
        // Reset rotation tracking
        rotationStartAngle = angle;
    }
}

/**
 * Detect two-hands-down drop gesture
 */
function detectDrop() {
    if (gestureHistory.length < 10) return;
    
    const recent = gestureHistory.slice(-10);
    const palmMovingDown = recent.every((entry, i) => {
        if (i === 0) return true;
        return entry.y > recent[i-1].y;
    });
    
    if (palmMovingDown) {
        if (!currentGesture) {
            currentGesture = 'drop';
            gestureStartTime = Date.now();
        } else if (currentGesture === 'drop') {
            const holdTime = Date.now() - gestureStartTime;
            
            if (holdTime > bigGestureConfig.dropGestureTime) {
                if (window.dropPiece) {
                    window.dropPiece();
                    lastGestureTime = Date.now();
                }
                
                // Reset
                currentGesture = null;
                gestureHistory = [];
            }
        }
    } else {
        if (currentGesture === 'drop') {
            currentGesture = null;
        }
    }
}

/**
 * Visualize BIG gestures
 */
function drawBigGestures(landmarks) {
    const canvas = document.getElementById('big-gesture-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw hand outline with THICK lines for BIG gestures
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 4;
    
    // Just draw palm connections for cleaner look
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 9], [9, 13], [13, 17], [17, 0]
    ];
    
    ctx.beginPath();
    for (const [i, j] of connections) {
        const start = landmarks[i];
        const end = landmarks[j];
        
        ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
        ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
    }
    ctx.stroke();
    
    // Draw palm center BIG
    const palm = landmarks[0];
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.arc(palm.x * canvas.width, palm.y * canvas.height, 10, 0, 2 * Math.PI);
    ctx.fill();
    
    // Show gesture feedback
    if (currentGesture) {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(currentGesture.toUpperCase(), 10, 30);
    }
}

/**
 * Clear visualization
 */
function clearVisualization() {
    const canvas = document.getElementById('big-gesture-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initBigHandControls();
});

// Export for use
window.initBigHandControls = initBigHandControls;
