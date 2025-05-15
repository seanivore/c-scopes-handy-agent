/**
 * natural_hand_controls.js
 * Natural hand gestures for Tetris - no finger tracking!
 */

// Configuration for natural hand gestures
const gestureConfig = {
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

// Natural gesture states
let currentGesture = null;
let gestureStartTime = 0;
let rotationStartAngle = null;

// Expose tracking state globally
window.gestureTrackingState = {
    started: false
};

/**
 * Initialize natural hand controls (no finger tracking)
 */
function initNaturalHandControls() {
    console.log('Initializing natural hand controls...');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera not supported");
        alert("Camera access is required for this game. Please ensure your browser supports camera access.");
        return;
    }

    // Load MediaPipe if needed
    if (window.Hands) {
        setupNaturalGestures();
    } else {
        // MediaPipe scripts should already be loaded from main page
        console.log('Waiting for MediaPipe to load...');
        setTimeout(() => {
            if (window.Hands) {
                setupNaturalGestures();
            } else {
                loadMediaPipeScripts().then(() => {
                    setupNaturalGestures();
                });
            }
        }, 1000);
    }

    // Add toggle button
    addGestureToggle();
}

/**
 * Set up MediaPipe for natural gestures
 */
function setupNaturalGestures() {
    // Create video element
    videoElement = document.createElement('video');
    videoElement.id = 'gesture-video';
    videoElement.style.cssText = `
        position: absolute;
        right: 20px;
        bottom: 20px;
        width: 320px;
        height: 240px;
        border: 3px solid #33ccff;
        border-radius: 10px;
        display: none;
        z-index: 150;
        transform: scaleX(-1);
    `;
    videoElement.autoplay = true;
    videoElement.playsInline = true;  // Important for mobile
    document.body.appendChild(videoElement);

    // Create canvas for visualization
    const canvas = document.createElement('canvas');
    canvas.id = 'gesture-canvas';
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
    hands.onResults(handleGestureResults);
}

/**
 * Add toggle button for natural gestures
 */
function addGestureToggle() {
    // Check if button already exists
    if (document.getElementById('gesture-button')) {
        return;
    }

    const button = document.createElement('button');
    button.id = 'gesture-button';
    button.className = 'button';
    button.innerHTML = '🤌';  // Hand gesture emoji
    button.title = 'Natural Hand Controls';
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
        background: linear-gradient(145deg, #33ccff, #0099cc);
        color: #fff;
        border: 2px solid #0099cc;
        transition: all 0.3s ease;
    `;

    // Add glow style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes gesture-glow {
            0%, 100% {
                box-shadow: 0 0 5px rgba(51, 204, 255, 0.5);
            }
            50% {
                box-shadow: 0 0 20px rgba(51, 204, 255, 0.8), 0 0 30px rgba(51, 204, 255, 0.5);
            }
        }
        
        #gesture-button {
            animation: gesture-glow 2s ease-in-out infinite;
        }
        
        #gesture-button:hover {
            animation: none;
            transform: scale(1.05);
            box-shadow: 0 0 25px rgba(51, 204, 255, 0.8);
        }
        
        #gesture-button.active {
            background: linear-gradient(145deg, #00ff99, #33ccff);
            border-color: #00ff99;
            animation: none;
            box-shadow: 0 0 15px rgba(0, 255, 153, 0.5);
        }
    `;
    document.head.appendChild(style);

    button.addEventListener('click', toggleGestures);

    const buttonContainer = document.getElementById('button-container');
    if (buttonContainer) {
        buttonContainer.appendChild(button);
    }

    // Update controls display
    updateControlsDisplay();
}

/**
 * Toggle natural gestures on/off
 */
function toggleGestures() {
    console.log('Toggle gestures clicked, trackingStarted:', trackingStarted);

    const button = document.getElementById('gesture-button');

    if (trackingStarted) {
        gestureConfig.enabled = !gestureConfig.enabled;

        // Toggle visibility
        videoElement.style.display = gestureConfig.enabled ? 'block' : 'none';
        document.getElementById('gesture-canvas').style.display =
            gestureConfig.enabled ? 'block' : 'none';

        // Update button state
        if (button) {
            if (gestureConfig.enabled) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }

        updateControlsDisplay();
        return;
    }

    // Start tracking
    if (camera) {
        console.log('Starting camera...');

        // Show prompt for user
        const promptDiv = document.createElement('div');
        promptDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #33ccff;
            z-index: 1000;
            text-align: center;
        `;
        promptDiv.innerHTML = '<h3>Camera Access Required</h3><p>Please allow camera access when prompted by your browser.</p>';
        document.body.appendChild(promptDiv);

        camera.start()
            .then(() => {
                console.log('Camera started successfully');
                trackingStarted = true;
                window.gestureTrackingState.started = true;  // Update global state
                gestureConfig.enabled = true;
                videoElement.style.display = 'block';
                document.getElementById('gesture-canvas').style.display = 'block';

                // Update button state
                if (button) {
                    button.classList.add('active');
                }

                updateControlsDisplay();

                // Remove prompt
                if (promptDiv.parentNode) {
                    promptDiv.parentNode.removeChild(promptDiv);
                }
            })
            .catch(error => {
                console.error('Camera error:', error);
                promptDiv.innerHTML = `<h3>Camera Access Denied</h3><p>${error.message}</p><button onclick="this.parentElement.remove()">OK</button>`;
            });
    } else {
        console.error('Camera not initialized');
    }
}

/**
 * Update controls display for natural gestures
 */
function updateControlsDisplay() {
    const controlsElement = document.getElementById('controls');
    if (!controlsElement) return;

    if (gestureConfig.enabled) {
        controlsElement.innerHTML = `
            Natural Hand Controls:<br>
            🫸 Swipe: Move left/right<br>
            🤌 Rotate hand: Rotate piece<br>
            🫳 Palm down: Drop piece<br>
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
 * Handle natural gesture results
 */
function handleGestureResults(results) {
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
    drawGestures(landmarks);
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
 * Detect swipe gestures (left/right movement)
 */
function detectSwipe() {
    if (gestureHistory.length < 5) return;

    const now = Date.now();
    if (now - lastGestureTime < gestureConfig.cooldownTime) return;

    const recent = gestureHistory.slice(-5);
    const start = recent[0];
    const end = recent[recent.length - 1];

    const deltaX = end.x - start.x;
    const deltaTime = end.time - start.time;
    const velocity = Math.abs(deltaX) / deltaTime * 1000;

    // Natural swipe detection
    if (Math.abs(deltaX) > gestureConfig.swipeThreshold &&
        velocity > gestureConfig.swipeSpeed) {

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
    if (Math.abs(deltaAngle) > gestureConfig.rotateThreshold) {
        if (window.rotatePiece) {
            window.rotatePiece();
            lastGestureTime = Date.now();
        }

        // Reset rotation tracking
        rotationStartAngle = angle;
    }
}

/**
 * Detect palm-down drop gesture
 */
function detectDrop() {
    if (gestureHistory.length < 10) return;

    const recent = gestureHistory.slice(-10);
    const palmMovingDown = recent.every((entry, i) => {
        if (i === 0) return true;
        return entry.y > recent[i - 1].y;
    });

    if (palmMovingDown) {
        if (!currentGesture) {
            currentGesture = 'drop';
            gestureStartTime = Date.now();
        } else if (currentGesture === 'drop') {
            const holdTime = Date.now() - gestureStartTime;

            if (holdTime > gestureConfig.dropGestureTime) {
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
 * Visualize natural gestures
 */
function drawGestures(landmarks) {
    const canvas = document.getElementById('gesture-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw hand outline with clear lines for natural gestures
    ctx.strokeStyle = '#33ccff';
    ctx.lineWidth = 3;

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
    const canvas = document.getElementById('gesture-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

/**
 * Load MediaPipe scripts dynamically
 */
function loadMediaPipeScripts() {
    return new Promise((resolve) => {
        const script1 = document.createElement('script');
        script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
        script1.crossOrigin = 'anonymous';

        const script2 = document.createElement('script');
        script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
        script2.crossOrigin = 'anonymous';

        const script3 = document.createElement('script');
        script3.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
        script3.crossOrigin = 'anonymous';

        document.body.appendChild(script1);
        document.body.appendChild(script2);

        script3.onload = () => {
            console.log('MediaPipe scripts loaded');
            resolve();
        };

        document.body.appendChild(script3);
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initNaturalHandControls();
});

// Export for use
window.initNaturalHandControls = initNaturalHandControls;
