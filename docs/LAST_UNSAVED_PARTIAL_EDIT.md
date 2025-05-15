/**
 * natural_pose_controls.js
 * Natural full-body gestures for Tetris - using pose tracking!
 */

// Configuration for natural pose gestures
const gestureConfig = {
    enabled: false,
    swipeThreshold: 0.1,        // How far to swipe
    swipeSpeed: 200,            // Minimum pixels/sec
    rotateThreshold: 30,        // Degrees to trigger rotation
    dropGestureTime: 500,       // Hold time for drop gesture
    cooldownTime: 200,          // Between gestures
    sensitivity: 1.5
};

// Gesture tracking state
let gestureHistory = [];
let lastGestureTime = 0;
let videoElement = null;
let pose = null;
// Change from handCamera to poseCamera
let poseCamera = null;
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
 * Initialize natural pose controls (whole body tracking)
 */
function initNaturalPoseControls() {
    console.log('Initializing natural pose controls...');

    // More robust camera support check
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera not supported by browser or permissions denied");
        
        // Create a prominent error overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #ff3366;
            z-index: 9999;
            text-align: center;
            max-width: 90%;
            font-family: Arial, sans-serif;
        `;
        errorOverlay.innerHTML = `
            <h3 style="color:#ff3366;">Camera Access Required</h3>
            <p>This game requires camera access to detect body movements.</p>
            <p>Your browser doesn't support camera access or permission was denied.</p>
            <p style="font-weight:bold;">Please check:</p>
            <ul style="text-align:left;">
                <li>Camera permissions in your browser settings</li>
                <li>That your device has a working camera</li>
                <li>Try using Chrome or Edge for best compatibility</li>
            </ul>
            <button id="retry-camera" style="
                padding: 8px 16px;
                background: #33ccff;
                border: none;
                border-radius: 5px;
                margin-top: 10px;
                cursor: pointer;
            ">Retry Camera Access</button>
        `;
        document.body.appendChild(errorOverlay);
        
        // Add retry button functionality
        setTimeout(() => {
            document.getElementById('retry-camera')?.addEventListener('click', () => {
                errorOverlay.remove();
                requestCameraExplicitly();
            });
        }, 100);
        
        return;
    }

    // More robust MediaPipe loading
    console.log('Checking MediaPipe availability...');
    console.log('Camera available?', typeof Camera !== 'undefined');
    console.log('Pose available?', typeof Pose !== 'undefined');

    if (typeof Pose !== 'undefined' && typeof Camera !== 'undefined') {
        console.log('MediaPipe libraries already loaded, setting up gestures');
        setupNaturalGestures();
    } else {
        console.log('MediaPipe not fully loaded, waiting...');

        // Use a more robust polling approach
        let attempts = 0;
        const checkMediaPipe = () => {
            attempts++;
            console.log(`MediaPipe load attempt ${attempts}/10`);
            console.log('Camera available?', typeof Camera !== 'undefined');
            console.log('Pose available?', typeof Pose !== 'undefined');

            if (typeof Pose !== 'undefined' && typeof Camera !== 'undefined') {
                console.log('MediaPipe loaded after waiting, setting up gestures');
                setupNaturalGestures();
            } else if (attempts < 10) {
                setTimeout(checkMediaPipe, 500); // Check again in 500ms
            } else {
                console.error('MediaPipe failed to load after multiple attempts');
                loadMediaPipeScripts().then(() => {
                    console.log('Manually loaded MediaPipe, setting up gestures');
                    setupNaturalGestures();
                }).catch(error => {
                    console.error('Failed to manually load MediaPipe:', error);
                });
            }
        };

        setTimeout(checkMediaPipe, 100);
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

    // Initialize MediaPipe with error handling
    console.log('Initializing MediaPipe Pose...');
    try {
        pose = new Pose({
            locateFile: (file) => {
                console.log(`Loading MediaPipe file: ${file}`);
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });
        console.log('MediaPipe Pose initialized successfully');
    } catch (error) {
        console.error('Error initializing MediaPipe Pose:', error);
        alert('Error initializing pose tracking. Please try refreshing the page.');
        return;
    }

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    // Set up camera
    // Add debug logging
    console.log('Setting up pose camera with MediaPipe');
    try {
        poseCamera = new Camera(videoElement, {
            onFrame: async () => {
                if (gestureConfig.enabled) {
                    await pose.send({ image: videoElement });
                }
            },
            width: 320,
            height: 240
        });
        console.log('Pose camera initialized successfully');
    } catch (error) {
        console.error('Error initializing pose camera:', error);
    }

    // Handle results
    pose.onResults(handlePoseResults);
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
// Fix toggle gestures to be more direct
function toggleGestures() {
        console.log('Toggle gestures clicked, trackingStarted:', trackingStarted);

        // Always request camera explicitly first
if (typeof requestCameraExplicitly === 'function') {
console.log('Explicitly requesting camera from toggle button');
            requestCameraExplicitly();
return; // Let the explicit request handle everything
}

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
    if (poseCamera) {
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

        console.log('Attempting to start pose camera...');
        poseCamera.start()
            .then(() => {
                console.log('Pose camera started successfully');
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
                console.error('Detailed camera start error:', error);
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
            Full Body Gesture Controls:<br>
            🫸 RIGHT ARM MOVEMENT: Move right<br>
            🫷 LEFT ARM MOVEMENT: Move left<br>
            🤚 FOREARM ROTATION: Rotate piece<br>
            🫳 ARM DOWN: Drop piece<br>
            👋 WAVE ARMS: Pause game
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
function handlePoseResults(results) {
    if (!results.poseLandmarks) {
        currentGesture = null;
        rotationStartAngle = null;
        clearVisualization();
        return;
    }

    const landmarks = results.poseLandmarks;
    updateGestureHistory(landmarks);

    // Detect and handle BIG gestures using the new full-body tracking
    detectBigGestures(landmarks);

    // Visualize
    drawPose(landmarks, results);
}

/**
 * Update gesture history for tracking movement
 */
function updateGestureHistory(landmarks) {
    const now = Date.now();
    
    // Use the right wrist as our main reference point
    const rightWrist = landmarks[16]; // Right wrist landmark

    if (!rightWrist) return; // Skip if wrist not visible

    gestureHistory.push({
        time: now,
        x: rightWrist.x,
        y: rightWrist.y,
        z: rightWrist.z || 0,
        landmarks: landmarks
    });

    // Keep history limited
    if (gestureHistory.length > 20) {
        gestureHistory.shift();
    }
}

/**
 * Detect arm-based gestures using key reference points
 * This is based on the "big gestures" vision described in GESTURE_UI.md
 */
function detectBigGestures(landmarks) {
    // We're focusing on these key points:
    // - Shoulder (not available in hand tracking, using wrist as reference)
    // - Elbow (not directly available, using palm direction)
    // - Wrist (landmark[0])
    // - Palm position and orientation
    
    // Get wrist position (our main reference point)
    const wrist = landmarks[0];
    
    // Get palm direction using middle finger MCP
    const middleMCP = landmarks[9];
    
    // Calculate palm direction vector (approximating forearm direction)
    const palmDirectionX = middleMCP.x - wrist.x;
    const palmDirectionY = middleMCP.y - wrist.y;
    
    // Log palm orientation for debugging
    console.log(`Palm direction: ${palmDirectionX.toFixed(2)}, ${palmDirectionY.toFixed(2)}`);
    
    // Detect BACKHAND (Move Right) - hand moving right with palm facing left
    if (gestureHistory.length >= 5) {
        const recent = gestureHistory.slice(-5);
        const start = recent[0];
        const end = recent[recent.length - 1];
        
        const deltaX = end.x - start.x;
        const deltaTime = end.time - start.time;
        const velocity = Math.abs(deltaX) / deltaTime * 1000;
        
        // Check for significant horizontal movement with sufficient speed
        if (Math.abs(deltaX) > gestureConfig.swipeThreshold * 1.5 && 
            velocity > gestureConfig.swipeSpeed) {
            
            // BACKHAND (palm facing away from motion direction)
            if (deltaX > 0 && palmDirectionX < 0) {
                // Backhand swipe right - CONFIRMATION action
                if (window.movePiece) {
                    console.log('BACKHAND RIGHT detected - moving piece right');
                    window.movePiece(1, 0);
                    lastGestureTime = Date.now();
                }
            } 
            // FRONTHAND (palm facing motion direction)
            else if (deltaX < 0 && palmDirectionX > 0) {
                // Fronthand swipe left - move left action
                if (window.movePiece) {
                    console.log('FRONTHAND LEFT detected - moving piece left');
                    window.movePiece(-1, 0);
                    lastGestureTime = Date.now();
                }
            }
            
            // Clear history after gesture
            gestureHistory = [];
        }
    }
    
    // Detect ROTATION gesture (hand twist with fingers wide)
    // This is your "fingers wide, palm forward, hand twist" concept
    const thumb = landmarks[4];
    const indexTip = landmarks[8];
    const pinkyTip = landmarks[20];
    
    // Check if fingers are spread wide (distance between index and pinky)
    const fingerSpread = Math.sqrt(
        Math.pow(indexTip.x - pinkyTip.x, 2) + 
        Math.pow(indexTip.y - pinkyTip.y, 2)
    );
    
    // If fingers are spread wide, detect rotation
    if (fingerSpread > 0.15) { // Threshold for spread fingers
        // Use original rotation detection with the spread fingers check
        if (rotationStartAngle === null) {
            rotationStartAngle = Math.atan2(middleMCP.y - wrist.y, middleMCP.x - wrist.x) * 180 / Math.PI;
            console.log('Starting rotation detection with fingers spread');
            return;
        }
        
        const currentAngle = Math.atan2(middleMCP.y - wrist.y, middleMCP.x - wrist.x) * 180 / Math.PI;
        const deltaAngle = currentAngle - rotationStartAngle;
        
        // Detect significant rotation with spread fingers
        if (Math.abs(deltaAngle) > gestureConfig.rotateThreshold) {
            if (window.rotatePiece) {
                console.log('HAND TWIST detected - rotating piece');
                window.rotatePiece();
                lastGestureTime = Date.now();
            }
            
            // Reset rotation tracking
            rotationStartAngle = currentAngle;
        }
    } else {
        // Reset rotation tracking if fingers are no longer spread
        rotationStartAngle = null;
    }
    
    // Detect PALM DOWN gesture (open palm facing down)
    // This corresponds to your palm-down gesture for fast drop
    if (gestureHistory.length >= 8) {
        const recent = gestureHistory.slice(-8);
        
        // Check if palm is facing downward (negative Y in landmark space)
        const isPalmDown = palmDirectionY < -0.1;
        
        // Check if hand is moving downward
        const isMovingDown = recent.every((entry, i) => {
            if (i === 0) return true;
            return entry.y > recent[i - 1].y - 0.005; // Allow slight upward movement for stability
        });
        
        if (isPalmDown && isMovingDown) {
            if (!currentGesture || currentGesture !== 'palm-down') {
                currentGesture = 'palm-down';
                gestureStartTime = Date.now();
                console.log('PALM DOWN gesture started');
            } else if (currentGesture === 'palm-down') {
                const holdTime = Date.now() - gestureStartTime;
                
                if (holdTime > gestureConfig.dropGestureTime) {
                    if (window.dropPiece) {
                        console.log('PALM DOWN completed - dropping piece');
                        window.dropPiece();
                        lastGestureTime = Date.now();
                    }
                    
                    // Reset
                    currentGesture = null;
                    gestureHistory = [];
                }
            }
        } else if (currentGesture === 'palm-down') {
            currentGesture = null;
        }
    }
    
    // Detect WAVE gesture to pause/unpause game
    if (gestureHistory.length >= 10) {
        const recent = gestureHistory.slice(-10);
        let waveCount = 0;
        let lastDeltaX = 0;
        
        // Count direction changes in recent history
        for (let i = 1; i < recent.length; i++) {
            const deltaX = recent[i].x - recent[i-1].x;
            if (Math.abs(deltaX) > 0.02) { // Threshold for significant movement
                if (lastDeltaX * deltaX < 0) { // Direction changed
                    waveCount++;
                }
                lastDeltaX = deltaX;
            }
        }
        
        // If we detected several direction changes, consider it a wave
        if (waveCount >= 3 && Date.now() - lastGestureTime > 1000) {
            console.log('WAVE gesture detected - toggling pause');
            if (window.togglePause && typeof window.togglePause === 'function') {
                window.togglePause();
                lastGestureTime = Date.now();
                gestureHistory = [];
            }
        }
    }
}

/**
 * Draw pose landmarks and connections
 */
function drawPose(landmarks, results) {
    const canvas = document.getElementById('gesture-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the pose landmarks
    if (!landmarks) return;
    
    // Define the key landmarks we care about for our gestures
    const rightShoulder = landmarks[12];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    
    // Draw right arm (primary control arm)
    if (rightShoulder && rightElbow && rightWrist) {
        // Draw arm segments with thick lines
        ctx.strokeStyle = '#33ccff'; // Cyan blue
        ctx.lineWidth = 6;
        
        // Upper arm
        ctx.beginPath();
        ctx.moveTo(rightShoulder.x * canvas.width, rightShoulder.y * canvas.height);
        ctx.lineTo(rightElbow.x * canvas.width, rightElbow.y * canvas.height);
        ctx.stroke();
        
        // Forearm (with different color for better visibility)
        ctx.strokeStyle = '#00ff99'; // Green
        ctx.beginPath();
        ctx.moveTo(rightElbow.x * canvas.width, rightElbow.y * canvas.height);
        ctx.lineTo(rightWrist.x * canvas.width, rightWrist.y * canvas.height);
        ctx.stroke();
        
        // Draw joints with circles
        ctx.fillStyle = '#ff3366'; // Red
        
        // Shoulder
        ctx.beginPath();
        ctx.arc(rightShoulder.x * canvas.width, rightShoulder.y * canvas.height, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Elbow - slightly larger
        ctx.fillStyle = '#ffcc00'; // Yellow
        ctx.beginPath();
        ctx.arc(rightElbow.x * canvas.width, rightElbow.y * canvas.height, 10, 0, 2 * Math.PI);
        ctx.fill();
        
        // Wrist - largest as it's the most important reference point
        ctx.fillStyle = '#ff9900'; // Orange
        ctx.beginPath();
        ctx.arc(rightWrist.x * canvas.width, rightWrist.y * canvas.height, 12, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Draw left arm with slightly thinner lines
    if (leftShoulder && leftElbow && leftWrist) {
        ctx.strokeStyle = '#9966ff'; // Purple
        ctx.lineWidth = 4;
        
        // Upper arm
        ctx.beginPath();
        ctx.moveTo(leftShoulder.x * canvas.width, leftShoulder.y * canvas.height);
        ctx.lineTo(leftElbow.x * canvas.width, leftElbow.y * canvas.height);
        ctx.stroke();
        
        // Forearm
        ctx.beginPath();
        ctx.moveTo(leftElbow.x * canvas.width, leftElbow.y * canvas.height);
        ctx.lineTo(leftWrist.x * canvas.width, leftWrist.y * canvas.height);
        ctx.stroke();
        
        // Draw joints
        ctx.fillStyle = '#9966ff'; // Purple
        
        // Shoulder
        ctx.beginPath();
        ctx.arc(leftShoulder.x * canvas.width, leftShoulder.y * canvas.height, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Elbow
        ctx.beginPath();
        ctx.arc(leftElbow.x * canvas.width, leftElbow.y * canvas.height, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Wrist
        ctx.beginPath();
        ctx.arc(leftWrist.x * canvas.width, leftWrist.y * canvas.height, 10, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Draw torso connecting shoulders if both visible
    if (leftShoulder && rightShoulder) {
        ctx.strokeStyle = '#cccccc'; // Gray
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(leftShoulder.x * canvas.width, leftShoulder.y * canvas.height);
        ctx.lineTo(rightShoulder.x * canvas.width, rightShoulder.y * canvas.height);
        ctx.stroke();
    }
    
    // Show current gesture if active
    if (currentGesture) {
        ctx.fillStyle = '#00ff00'; // Bright green
        ctx.font = 'bold 24px Arial';
        ctx.fillText(currentGesture.toUpperCase(), 10, 30);
    }
    
    // Show angles for debugging (optional)
    if (rightElbow && rightShoulder && rightWrist) {
        const forearmAngle = Math.atan2(
            rightWrist.y - rightElbow.y,
            rightWrist.x - rightElbow.x
        ) * 180 / Math.PI;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText(`Arm Angle: ${forearmAngle.toFixed(1)}°`, 10, canvas.height - 10);
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
 * Request camera access explicitly
 */
function requestCameraExplicitly() {
    console.log('Explicitly requesting camera access');
    
    // Create an overlay to show camera status
    const statusOverlay = document.createElement('div');
    statusOverlay.id = 'camera-status-overlay';
    statusOverlay.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        max-width: 400px;
        font-size: 12px;
        border: 1px solid #33ccff;
    `;
    statusOverlay.innerHTML = 'Requesting camera access...';
    document.body.appendChild(statusOverlay);
    
    // First check if the API exists
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusOverlay.innerHTML = 'ERROR: Your browser does not support camera access.<br>Try using Chrome or Edge.';
        console.error('Camera API not available');
        return;
    }
    
    // Try to directly access the camera with plain getUserMedia
    navigator.mediaDevices.getUserMedia({ 
        video: {
            width: { ideal: 320 },
            height: { ideal: 240 }
        }
    })
    .then(stream => {
        statusOverlay.innerHTML = 'Camera access GRANTED! Initializing pose tracking...';
        
        // Check if we're already using a video element
        let existingVideo = document.getElementById('gesture-video');
        
        if (!existingVideo || !existingVideo.srcObject) {
            // If videoElement exists but has no stream
            if (videoElement && !videoElement.srcObject) {
                console.log('Connecting stream to existing video element');
                videoElement.srcObject = stream;
                videoElement.style.display = 'block';
            } else {
                console.log('Creating new video element for camera');
                // Create a temporary video to verify the camera works
                const tempVideo = document.createElement('video');
                tempVideo.id = 'debug-video';
                tempVideo.style.cssText = `
                    position: absolute;
                    right: 20px;
                    bottom: 20px;
                    width: 320px;
                    height: 240px;
                    border: 3px solid #ff3366;
                    border-radius: 10px;
                    display: block;
                    z-index: 9999;
                    transform: scaleX(-1);
                `;
                tempVideo.autoplay = true;
                tempVideo.playsInline = true;
                tempVideo.muted = true;
                tempVideo.srcObject = stream;
                document.body.appendChild(tempVideo);
            }
            
            // Now try to properly initialize pose tracking
            setTimeout(() => {
                statusOverlay.innerHTML = 'Camera accessible! Now initializing pose tracking...';
                console.log('Camera access successful, setting up pose tracking');
                
                // Try to kick-start the process again
                if (typeof initNaturalPoseControls === 'function') {
                    try {
                        initNaturalPoseControls();
                        statusOverlay.innerHTML += '<br>Pose tracking initialized!';
                    } catch (error) {
                        statusOverlay.innerHTML += `<br>Error initializing tracking: ${error.message}`;
                        console.error('Error initializing pose controls:', error);
                    }
                } else {
                    statusOverlay.innerHTML += '<br>Pose tracking function not available!';
                }
            }, 1000);
        } else {
            statusOverlay.innerHTML = 'Camera already connected to video element.';
        }
    })
    .catch(error => {
        statusOverlay.innerHTML = `Camera access DENIED: ${error.message}<br>The game requires camera access to detect body movements.<br><button id="retry-camera-btn" style="margin-top:10px;padding:5px 10px;background:#33ccff;border:none;border-radius:4px;cursor:pointer;">Try Again</button>`;
        console.error('Camera permission error:', error);
        
        // Add retry button functionality
        setTimeout(() => {
            document.getElementById('retry-camera-btn')?.addEventListener('click', () => {
                statusOverlay.remove();
                requestCameraExplicitly();
            });
        }, 100);
    });
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

        // Load Pose instead of Hands
        const script3 = document.createElement('script');
        script3.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
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

// Initialize on load with error handling
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing natural pose controls');
    try {
        initNaturalPoseControls();
        console.log('Natural pose controls initialized successfully');
    } catch (error) {
        console.error('Error initializing natural pose controls:', error);
    }
});

// Export for use
window.initNaturalPoseControls = initNaturalPoseControls;