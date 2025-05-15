Implementing Pose Model
If you want to try implementing the Pose model ourselves, we would need to:

Replace the MediaPipe Hands imports with MediaPipe Pose
Update the landmark references (shoulders = landmarks[11] and [12], elbows = [13] and [14], etc.)
Adjust the visualization to show arm positions

Here's a very basic example of what the code change would look like:
javascript// Instead of importing Hands
const pose = new Pose({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
});

// Update options
pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

// Adjust gesture detection to use shoulder, elbow, wrist landmarks
// Shoulder = landmarks[11] and [12]
// Elbow = landmarks[13] and [14]
// Wrist = landmarks[15] and [16]
The challenge is that this would be a major rewrite of the tracking system, and it would take significant testing to get right.
What do you recommend?
Given the complexity, sharing early with Alan and asking for his expertise on implementing arm tracking seems like the most pragmatic approach. He already has experience with the MediaPipe system and might even have already solved this problem in other projects.
What would you prefer to do?RetrySAi think we should do it up right! now that we have all the kinks figured out it feels like smooth sailingEditThat's the spirit! Let's go all-in and implement the full body pose tracking for better gesture detection. This will give us much more reliable tracking of those big Italian-style gestures you envisioned.
Let's replace the hand tracking with MediaPipe's Pose model:Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `/**
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
        console.error(\"Camera not supported by browser or permissions denied\");
        
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
            <h3 style=\"color:#ff3366;\">Camera Access Required</h3>
            <p>This game requires camera access to detect body movements.</p>
            <p>Your browser doesn't support camera access or permission was denied.</p>
            <p style=\"font-weight:bold;\">Please check:</p>
            <ul style=\"text-align:left;\">
                <li>Camera permissions in your browser settings</li>
                <li>That your device has a working camera</li>
                <li>Try using Chrome or Edge for best compatibility</li>
            </ul>
            <button id=\"retry-camera\" style=\"
                padding: 8px 16px;
                background: #33ccff;
                border: none;
                border-radius: 5px;
                margin-top: 10px;
                cursor: pointer;
            \">Retry Camera Access</button>
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
}`,
      `oldText`: `function requestCameraExplicitly() {
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
        statusOverlay.innerHTML = 'Camera access GRANTED! Initializing tracking...';
        
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
            
            // Now try to properly initialize hand tracking
            setTimeout(() => {
                statusOverlay.innerHTML = 'Camera accessible! Now initializing hand tracking...';
                console.log('Camera access successful, setting up hand tracking');
                
                // Try to kick-start the process again
                if (typeof initNaturalHandControls === 'function') {
                    try {
                        initNaturalHandControls();
                        statusOverlay.innerHTML += '<br>Hand tracking initialized!';
                    } catch (error) {
                        statusOverlay.innerHTML += `<br>Error initializing tracking: ${error.message}`;
                        console.error('Error reinitializing hand controls:', error);
                    }
                } else {
                    statusOverlay.innerHTML += '<br>Hand tracking function not available!';
                }
            }, 1000);
        } else {
            statusOverlay.innerHTML = 'Camera already connected to video element.';
        }
    })
    .catch(error => {
        statusOverlay.innerHTML = `Camera access DENIED: ${error.message}<br>The game requires camera access to detect hand gestures.<br><button id=\"retry-camera-btn\" style=\"margin-top:10px;padding:5px 10px;background:#33ccff;border:none;border-radius:4px;cursor:pointer;\">Try Again</button>`;
        console.error('Camera permission error:', error);
        
        // Add retry button functionality
        setTimeout(() => {
            document.getElementById('retry-camera-btn')?.addEventListener('click', () => {
                statusOverlay.remove();
                requestCameraExplicitly();
            });
        }, 100);
    });
}/**
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
let handCamera = null;
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

    // More robust camera support check
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error(\"Camera not supported by browser or permissions denied\");
        
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
            <h3 style=\"color:#ff3366;\">Camera Access Required</h3>
            <p>This game requires camera access to detect hand gestures.</p>
            <p>Your browser doesn't support camera access or permission was denied.</p>
            <p style=\"font-weight:bold;\">Please check:</p>
            <ul style=\"text-align:left;\">
                <li>Camera permissions in your browser settings</li>
                <li>That your device has a working camera</li>
                <li>Try using Chrome or Edge for best compatibility</li>
            </ul>
            <button id=\"retry-camera\" style=\"
                padding: 8px 16px;
                background: #33ccff;
                border: none;
                border-radius: 5px;
                margin-top: 10px;
                cursor: pointer;
            \">Retry Camera Access</button>
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
    console.log('Hands available?', typeof Hands !== 'undefined');

    if (typeof Hands !== 'undefined' && typeof Camera !== 'undefined') {
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
            console.log('Hands available?', typeof Hands !== 'undefined');

            if (typeof Hands !== 'undefined' && typeof Camera !== 'undefined') {
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
    console.log('Initializing MediaPipe Hands...');
    try {
        hands = new Hands({
            locateFile: (file) => {
                console.log(`Loading MediaPipe file: ${file}`);
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        console.log('MediaPipe Hands initialized successfully');
    } catch (error) {
        console.error('Error initializing MediaPipe Hands:', error);
        alert('Error initializing hand tracking. Please try refreshing the page.');
        return;
    }

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
    });

    // Set up camera
    // Add debug logging
    console.log('Setting up hand camera with MediaPipe');
    try {
        handCamera = new Camera(videoElement, {
            onFrame: async () => {
                if (gestureConfig.enabled) {
                    await hands.send({ image: videoElement });
                }
            },
            width: 320,
            height: 240
        });
        console.log('Hand camera initialized successfully');
    } catch (error) {
        console.error('Error initializing hand camera:', error);
    }

    // Handle results
    hands.onResults(handleGestureResults);
}`
    }
  ]
}Response```diff
Index: /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js
===================================================================
--- /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	original
+++ /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	modified
@@ -1,122 +1,15 @@
-function requestCameraExplicitly() {
-    console.log('Explicitly requesting camera access');
-    
-    // Create an overlay to show camera status
-    const statusOverlay = document.createElement('div');
-    statusOverlay.id = 'camera-status-overlay';
-    statusOverlay.style.cssText = `
-        position: fixed;
-        top: 10px;
-        left: 10px;
-        background: rgba(0, 0, 0, 0.8);
-        color: white;
-        padding: 10px;
-        border-radius: 5px;
-        z-index: 9999;
-        font-family: Arial, sans-serif;
-        max-width: 400px;
-        font-size: 12px;
-        border: 1px solid #33ccff;
-    `;
-    statusOverlay.innerHTML = 'Requesting camera access...';
-    document.body.appendChild(statusOverlay);
-    
-    // First check if the API exists
-    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
-        statusOverlay.innerHTML = 'ERROR: Your browser does not support camera access.<br>Try using Chrome or Edge.';
-        console.error('Camera API not available');
-        return;
-    }
-    
-    // Try to directly access the camera with plain getUserMedia
-    navigator.mediaDevices.getUserMedia({ 
-        video: {
-            width: { ideal: 320 },
-            height: { ideal: 240 }
-        }
-    })
-    .then(stream => {
-        statusOverlay.innerHTML = 'Camera access GRANTED! Initializing tracking...';
-        
-        // Check if we're already using a video element
-        let existingVideo = document.getElementById('gesture-video');
-        
-        if (!existingVideo || !existingVideo.srcObject) {
-            // If videoElement exists but has no stream
-            if (videoElement && !videoElement.srcObject) {
-                console.log('Connecting stream to existing video element');
-                videoElement.srcObject = stream;
-                videoElement.style.display = 'block';
-            } else {
-                console.log('Creating new video element for camera');
-                // Create a temporary video to verify the camera works
-                const tempVideo = document.createElement('video');
-                tempVideo.id = 'debug-video';
-                tempVideo.style.cssText = `
-                    position: absolute;
-                    right: 20px;
-                    bottom: 20px;
-                    width: 320px;
-                    height: 240px;
-                    border: 3px solid #ff3366;
-                    border-radius: 10px;
-                    display: block;
-                    z-index: 9999;
-                    transform: scaleX(-1);
-                `;
-                tempVideo.autoplay = true;
-                tempVideo.playsInline = true;
-                tempVideo.muted = true;
-                tempVideo.srcObject = stream;
-                document.body.appendChild(tempVideo);
-            }
-            
-            // Now try to properly initialize hand tracking
-            setTimeout(() => {
-                statusOverlay.innerHTML = 'Camera accessible! Now initializing hand tracking...';
-                console.log('Camera access successful, setting up hand tracking');
-                
-                // Try to kick-start the process again
-                if (typeof initNaturalHandControls === 'function') {
-                    try {
-                        initNaturalHandControls();
-                        statusOverlay.innerHTML += '<br>Hand tracking initialized!';
-                    } catch (error) {
-                        statusOverlay.innerHTML += `<br>Error initializing tracking: ${error.message}`;
-                        console.error('Error reinitializing hand controls:', error);
-                    }
-                } else {
-                    statusOverlay.innerHTML += '<br>Hand tracking function not available!';
-                }
-            }, 1000);
-        } else {
-            statusOverlay.innerHTML = 'Camera already connected to video element.';
-        }
-    })
-    .catch(error => {
-        statusOverlay.innerHTML = `Camera access DENIED: ${error.message}<br>The game requires camera access to detect hand gestures.<br><button id="retry-camera-btn" style="margin-top:10px;padding:5px 10px;background:#33ccff;border:none;border-radius:4px;cursor:pointer;">Try Again</button>`;
-        console.error('Camera permission error:', error);
-        
-        // Add retry button functionality
-        setTimeout(() => {
-            document.getElementById('retry-camera-btn')?.addEventListener('click', () => {
-                statusOverlay.remove();
-                requestCameraExplicitly();
-            });
-        }, 100);
-    });
-}/**
- * natural_hand_controls.js
- * Natural hand gestures for Tetris - no finger tracking!
+/**
+ * natural_pose_controls.js
+ * Natural full-body gestures for Tetris - using pose tracking!
  */
 
-// Configuration for natural hand gestures
+// Configuration for natural pose gestures
 const gestureConfig = {
     enabled: false,
-    swipeThreshold: 0.2,        // How far to swipe
-    swipeSpeed: 300,            // Minimum pixels/sec
-    rotateThreshold: 45,        // Degrees to trigger rotation
+    swipeThreshold: 0.1,        // How far to swipe
+    swipeSpeed: 200,            // Minimum pixels/sec
+    rotateThreshold: 30,        // Degrees to trigger rotation
     dropGestureTime: 500,       // Hold time for drop gesture
     cooldownTime: 200,          // Between gestures
     sensitivity: 1.5
 };
@@ -124,10 +17,11 @@
 // Gesture tracking state
 let gestureHistory = [];
 let lastGestureTime = 0;
 let videoElement = null;
-let hands = null;
-let handCamera = null;
+let pose = null;
+// Change from handCamera to poseCamera
+let poseCamera = null;
 let trackingStarted = false;
 
 // Natural gesture states
 let currentGesture = null;
@@ -139,12 +33,12 @@
     started: false
 };
 
 /**
- * Initialize natural hand controls (no finger tracking)
+ * Initialize natural pose controls (whole body tracking)
  */
-function initNaturalHandControls() {
-    console.log('Initializing natural hand controls...');
+function initNaturalPoseControls() {
+    console.log('Initializing natural pose controls...');
 
     // More robust camera support check
     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
         console.error("Camera not supported by browser or permissions denied");
@@ -167,9 +61,9 @@
             font-family: Arial, sans-serif;
         `;
         errorOverlay.innerHTML = `
             <h3 style="color:#ff3366;">Camera Access Required</h3>
-            <p>This game requires camera access to detect hand gestures.</p>
+            <p>This game requires camera access to detect body movements.</p>
             <p>Your browser doesn't support camera access or permission was denied.</p>
             <p style="font-weight:bold;">Please check:</p>
             <ul style="text-align:left;">
                 <li>Camera permissions in your browser settings</li>
@@ -200,11 +94,11 @@
 
     // More robust MediaPipe loading
     console.log('Checking MediaPipe availability...');
     console.log('Camera available?', typeof Camera !== 'undefined');
-    console.log('Hands available?', typeof Hands !== 'undefined');
+    console.log('Pose available?', typeof Pose !== 'undefined');
 
-    if (typeof Hands !== 'undefined' && typeof Camera !== 'undefined') {
+    if (typeof Pose !== 'undefined' && typeof Camera !== 'undefined') {
         console.log('MediaPipe libraries already loaded, setting up gestures');
         setupNaturalGestures();
     } else {
         console.log('MediaPipe not fully loaded, waiting...');
@@ -214,11 +108,11 @@
         const checkMediaPipe = () => {
             attempts++;
             console.log(`MediaPipe load attempt ${attempts}/10`);
             console.log('Camera available?', typeof Camera !== 'undefined');
-            console.log('Hands available?', typeof Hands !== 'undefined');
+            console.log('Pose available?', typeof Pose !== 'undefined');
 
-            if (typeof Hands !== 'undefined' && typeof Camera !== 'undefined') {
+            if (typeof Pose !== 'undefined' && typeof Camera !== 'undefined') {
                 console.log('MediaPipe loaded after waiting, setting up gestures');
                 setupNaturalGestures();
             } else if (attempts < 10) {
                 setTimeout(checkMediaPipe, 500); // Check again in 500ms
@@ -278,50 +172,52 @@
     `;
     document.body.appendChild(canvas);
 
     // Initialize MediaPipe with error handling
-    console.log('Initializing MediaPipe Hands...');
+    console.log('Initializing MediaPipe Pose...');
     try {
-        hands = new Hands({
+        pose = new Pose({
             locateFile: (file) => {
                 console.log(`Loading MediaPipe file: ${file}`);
-                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
+                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
             }
         });
-        console.log('MediaPipe Hands initialized successfully');
+        console.log('MediaPipe Pose initialized successfully');
     } catch (error) {
-        console.error('Error initializing MediaPipe Hands:', error);
-        alert('Error initializing hand tracking. Please try refreshing the page.');
+        console.error('Error initializing MediaPipe Pose:', error);
+        alert('Error initializing pose tracking. Please try refreshing the page.');
         return;
     }
 
-    hands.setOptions({
-        maxNumHands: 1,
+    pose.setOptions({
         modelComplexity: 1,
-        minDetectionConfidence: 0.7,
+        smoothLandmarks: true,
+        enableSegmentation: false,
+        smoothSegmentation: false,
+        minDetectionConfidence: 0.5,
         minTrackingConfidence: 0.5
     });
 
     // Set up camera
     // Add debug logging
-    console.log('Setting up hand camera with MediaPipe');
+    console.log('Setting up pose camera with MediaPipe');
     try {
-        handCamera = new Camera(videoElement, {
+        poseCamera = new Camera(videoElement, {
             onFrame: async () => {
                 if (gestureConfig.enabled) {
-                    await hands.send({ image: videoElement });
+                    await pose.send({ image: videoElement });
                 }
             },
             width: 320,
             height: 240
         });
-        console.log('Hand camera initialized successfully');
+        console.log('Pose camera initialized successfully');
     } catch (error) {
-        console.error('Error initializing hand camera:', error);
+        console.error('Error initializing pose camera:', error);
     }
 
     // Handle results
-    hands.onResults(handleGestureResults);
+    pose.onResults(handlePoseResults);
 }
 
 /**
  * Add toggle button for natural gestures
```

Now let's continue with adding the new pose handling functions and updating the remaining code:Eedit_fileRequest{
  `edits`: [
    {
      `newText`: `/**
 * Handle pose tracking results
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
        z: rightWrist.z,
        landmarks: landmarks
    });

    // Keep history limited
    if (gestureHistory.length > 20) {
        gestureHistory.shift();
    }
}

/**
 * Detect arm-based gestures using full body tracking
 * This implements the \"big gestures\" vision described in GESTURE_UI.md
 */
function detectBigGestures(landmarks) {
    if (gestureHistory.length < 5) return;
    
    // Key body landmarks
    const rightShoulder = landmarks[12];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    
    // Check if key landmarks are visible
    if (!rightShoulder || !rightElbow || !rightWrist) {
        console.log('Right arm landmarks not fully visible');
        return;
    }
    
    // Get recent wrist movement history
    const recent = gestureHistory.slice(-5);
    const start = recent[0];
    const end = recent[recent.length - 1];
    
    const deltaX = end.x - start.x;
    const deltaTime = end.time - start.time;
    const velocity = Math.abs(deltaX) / deltaTime * 1000;
    
    const now = Date.now();
    if (now - lastGestureTime < gestureConfig.cooldownTime) return;
    
    // Calculate arm angles
    // Forearm angle (elbow to wrist) relative to horizontal
    const rightForearmAngleX = Math.atan2(
        rightWrist.y - rightElbow.y,
        rightWrist.x - rightElbow.x
    ) * 180 / Math.PI;
    
    // Upper arm angle (shoulder to elbow) relative to vertical
    const rightUpperArmAngleY = Math.atan2(
        rightElbow.x - rightShoulder.x,
        rightElbow.y - rightShoulder.y
    ) * 180 / Math.PI;
    
    // Log arm angles for debugging
    console.log(`Right forearm angle: ${rightForearmAngleX.toFixed(1)}°, Upper arm: ${rightUpperArmAngleY.toFixed(1)}°`);
    
    // BACKHAND (Move Right) - arm moving right with palm facing left
    // Here we're assuming palm is facing away from motion when forearm is horizontal
    if (Math.abs(deltaX) > gestureConfig.swipeThreshold && 
        velocity > gestureConfig.swipeSpeed) {
        
        // Moving right (positive delta X)
        if (deltaX > 0) {
            // Check if arm is in BACKHAND position (forearm roughly horizontal)
            const isBackhandPosition = Math.abs(rightForearmAngleX) < 45; // Within 45° of horizontal
            
            if (isBackhandPosition) {
                console.log('BACKHAND RIGHT detected - moving piece right');
                if (window.movePiece) {
                    window.movePiece(1, 0);
                    lastGestureTime = now;
                }
            }
        }
        // Moving left (negative delta X)
        else if (deltaX < 0) {
            // Check if arm is in FRONTHAND position (forearm roughly horizontal)
            const isFronthandPosition = Math.abs(rightForearmAngleX) < 45; // Within 45° of horizontal
            
            if (isFronthandPosition) {
                console.log('FRONTHAND LEFT detected - moving piece left');
                if (window.movePiece) {
                    window.movePiece(-1, 0);
                    lastGestureTime = now;
                }
            }
        }
        
        // Clear history after gesture
        gestureHistory = [];
    }
    
    // ROTATION gesture - rotating forearm like turning a doorknob
    // Track forearm rotation over time
    if (rotationStartAngle === null) {
        rotationStartAngle = rightForearmAngleX;
        return;
    }
    
    const deltaAngle = rightForearmAngleX - rotationStartAngle;
    
    // Check for significant forearm rotation
    if (Math.abs(deltaAngle) > gestureConfig.rotateThreshold) {
        console.log(`ROTATION detected: ${deltaAngle.toFixed(1)}° change`);
        if (window.rotatePiece) {
            window.rotatePiece();
            lastGestureTime = now;
            rotationStartAngle = rightForearmAngleX; // Reset rotation tracking
        }
    }
    
    // PALM DOWN (Drop) - arm extended downward
    if (gestureHistory.length >= 8) {
        // Check if right arm is extended downward
        const isArmDown = rightElbow.y < rightShoulder.y && 
                          rightWrist.y < rightElbow.y && 
                          Math.abs(rightWrist.x - rightElbow.x) < 0.1; // Arm relatively straight down
        
        // Check if wrist is moving downward
        const isMovingDown = recent.slice(-3).every((entry, i, arr) => {
            if (i === 0) return true;
            return entry.y > arr[i-1].y - 0.005; // Allow slight upward movement for stability
        });
        
        if (isArmDown && isMovingDown) {
            if (!currentGesture || currentGesture !== 'palm-down') {
                currentGesture = 'palm-down';
                gestureStartTime = now;
                console.log('PALM DOWN gesture started');
            } else if (currentGesture === 'palm-down') {
                const holdTime = now - gestureStartTime;
                
                if (holdTime > gestureConfig.dropGestureTime) {
                    console.log('PALM DOWN completed - dropping piece');
                    if (window.dropPiece) {
                        window.dropPiece();
                        lastGestureTime = now;
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
    
    // WAVE gesture (both arms) - alternating side to side
    // Check if both arms are visible
    if (leftWrist && leftElbow && leftShoulder && 
        rightWrist && rightElbow && rightShoulder && 
        gestureHistory.length >= 10) {
        
        const recentWaveHistory = gestureHistory.slice(-10);
        let waveCount = 0;
        let lastDeltaX = 0;
        
        // Count direction changes in recent history
        for (let i = 1; i < recentWaveHistory.length; i++) {
            const deltaX = recentWaveHistory[i].x - recentWaveHistory[i-1].x;
            
            if (Math.abs(deltaX) > 0.02) { // Threshold for significant movement
                if (lastDeltaX * deltaX < 0) { // Direction changed
                    waveCount++;
                }
                lastDeltaX = deltaX;
            }
        }
        
        // If we detected several direction changes, consider it a wave
        if (waveCount >= 4 && now - lastGestureTime > 1000) {
            console.log('WAVE gesture detected - toggling pause');
            if (window.togglePause && typeof window.togglePause === 'function') {
                window.togglePause();
                lastGestureTime = now;
                gestureHistory = [];
            }
        }
    }
}`,
      `oldText`: `/**
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

    // Detect and handle BIG gestures using the new combined function
    detectBigGestures(landmarks);
`
    }
  ]
}RetryClaude hit the max length for a message and has paused its response. You can write Continue to keep the chat going.SAContinueEditLet's continue building our full-body gesture tracking system. I'll add the pose visualization function and update the remaining parts of the code:Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `/**
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
}`,
      `oldText`: `/**
 * Visualize natural gestures
 */
function drawGestures(landmarks) {
    const canvas = document.getElementById('gesture-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw palm hand landmarks with better visibility for whole-hand gestures
    // Highlight key points for big gestures: wrist, palm center, thumb
    ctx.strokeStyle = '#33ccff';
    ctx.lineWidth = 4; // Increased for better visibility

    // Draw palm outline for clearer visualization
    const palmPoints = [0, 5, 9, 13, 17, 0]; // Palm landmarks in order
    ctx.beginPath();
    
    // Create a single connected path for the palm 
    for (let i = 0; i < palmPoints.length; i++) {
        const point = landmarks[palmPoints[i]];
        if (i === 0) {
            ctx.moveTo(point.x * canvas.width, point.y * canvas.height);
        } else {
            ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
        }
    }
    
    ctx.stroke();
    
    // Draw arm approximation (from wrist outward)
    const wrist = landmarks[0];
    const midPalm = landmarks[9]; // Middle finger base as palm center reference
    
    // Calculate forearm direction (extending from wrist away from palm)
    const armDirectionX = wrist.x - midPalm.x;
    const armDirectionY = wrist.y - midPalm.y;
    const armLength = 0.25; // Length of the arm line
    
    // Draw forearm
    ctx.strokeStyle = '#ff9900'; // Different color for arm
    ctx.lineWidth = 6; // Thicker for arm
    ctx.beginPath();
    ctx.moveTo(wrist.x * canvas.width, wrist.y * canvas.height);
    ctx.lineTo(
        (wrist.x + armDirectionX * armLength) * canvas.width,
        (wrist.y + armDirectionY * armLength) * canvas.height
    );
    ctx.stroke();
    
    // Draw wrist point BIG
    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.arc(wrist.x * canvas.width, wrist.y * canvas.height, 12, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw palm center
    ctx.fillStyle = '#00ff99';
    ctx.beginPath();
    ctx.arc(midPalm.x * canvas.width, midPalm.y * canvas.height, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Highlight thumb for orientation reference
    const thumb = landmarks[4];
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(thumb.x * canvas.width, thumb.y * canvas.height, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Show gesture feedback
    if (currentGesture) {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(currentGesture.toUpperCase(), 10, 30);
    }
}`
    }
  ]
}Response```diff
Index: /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js
===================================================================
--- /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	original
+++ /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	modified
@@ -621,83 +621,132 @@
     }
 }
 
 /**
- * Visualize natural gestures
+ * Draw pose landmarks and connections
  */
-function drawGestures(landmarks) {
+function drawPose(landmarks, results) {
     const canvas = document.getElementById('gesture-canvas');
     if (!canvas) return;
 
     const ctx = canvas.getContext('2d');
     ctx.clearRect(0, 0, canvas.width, canvas.height);
-
-    // Draw palm hand landmarks with better visibility for whole-hand gestures
-    // Highlight key points for big gestures: wrist, palm center, thumb
-    ctx.strokeStyle = '#33ccff';
-    ctx.lineWidth = 4; // Increased for better visibility
-
-    // Draw palm outline for clearer visualization
-    const palmPoints = [0, 5, 9, 13, 17, 0]; // Palm landmarks in order
-    ctx.beginPath();
     
-    // Create a single connected path for the palm 
-    for (let i = 0; i < palmPoints.length; i++) {
-        const point = landmarks[palmPoints[i]];
-        if (i === 0) {
-            ctx.moveTo(point.x * canvas.width, point.y * canvas.height);
-        } else {
-            ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
-        }
-    }
+    // Draw the pose landmarks
+    if (!landmarks) return;
     
-    ctx.stroke();
+    // Define the key landmarks we care about for our gestures
+    const rightShoulder = landmarks[12];
+    const rightElbow = landmarks[14];
+    const rightWrist = landmarks[16];
+    const leftShoulder = landmarks[11];
+    const leftElbow = landmarks[13];
+    const leftWrist = landmarks[15];
     
-    // Draw arm approximation (from wrist outward)
-    const wrist = landmarks[0];
-    const midPalm = landmarks[9]; // Middle finger base as palm center reference
+    // Draw right arm (primary control arm)
+    if (rightShoulder && rightElbow && rightWrist) {
+        // Draw arm segments with thick lines
+        ctx.strokeStyle = '#33ccff'; // Cyan blue
+        ctx.lineWidth = 6;
+        
+        // Upper arm
+        ctx.beginPath();
+        ctx.moveTo(rightShoulder.x * canvas.width, rightShoulder.y * canvas.height);
+        ctx.lineTo(rightElbow.x * canvas.width, rightElbow.y * canvas.height);
+        ctx.stroke();
+        
+        // Forearm (with different color for better visibility)
+        ctx.strokeStyle = '#00ff99'; // Green
+        ctx.beginPath();
+        ctx.moveTo(rightElbow.x * canvas.width, rightElbow.y * canvas.height);
+        ctx.lineTo(rightWrist.x * canvas.width, rightWrist.y * canvas.height);
+        ctx.stroke();
+        
+        // Draw joints with circles
+        ctx.fillStyle = '#ff3366'; // Red
+        
+        // Shoulder
+        ctx.beginPath();
+        ctx.arc(rightShoulder.x * canvas.width, rightShoulder.y * canvas.height, 8, 0, 2 * Math.PI);
+        ctx.fill();
+        
+        // Elbow - slightly larger
+        ctx.fillStyle = '#ffcc00'; // Yellow
+        ctx.beginPath();
+        ctx.arc(rightElbow.x * canvas.width, rightElbow.y * canvas.height, 10, 0, 2 * Math.PI);
+        ctx.fill();
+        
+        // Wrist - largest as it's the most important reference point
+        ctx.fillStyle = '#ff9900'; // Orange
+        ctx.beginPath();
+        ctx.arc(rightWrist.x * canvas.width, rightWrist.y * canvas.height, 12, 0, 2 * Math.PI);
+        ctx.fill();
+    }
     
-    // Calculate forearm direction (extending from wrist away from palm)
-    const armDirectionX = wrist.x - midPalm.x;
-    const armDirectionY = wrist.y - midPalm.y;
-    const armLength = 0.25; // Length of the arm line
+    // Draw left arm with slightly thinner lines
+    if (leftShoulder && leftElbow && leftWrist) {
+        ctx.strokeStyle = '#9966ff'; // Purple
+        ctx.lineWidth = 4;
+        
+        // Upper arm
+        ctx.beginPath();
+        ctx.moveTo(leftShoulder.x * canvas.width, leftShoulder.y * canvas.height);
+        ctx.lineTo(leftElbow.x * canvas.width, leftElbow.y * canvas.height);
+        ctx.stroke();
+        
+        // Forearm
+        ctx.beginPath();
+        ctx.moveTo(leftElbow.x * canvas.width, leftElbow.y * canvas.height);
+        ctx.lineTo(leftWrist.x * canvas.width, leftWrist.y * canvas.height);
+        ctx.stroke();
+        
+        // Draw joints
+        ctx.fillStyle = '#9966ff'; // Purple
+        
+        // Shoulder
+        ctx.beginPath();
+        ctx.arc(leftShoulder.x * canvas.width, leftShoulder.y * canvas.height, 6, 0, 2 * Math.PI);
+        ctx.fill();
+        
+        // Elbow
+        ctx.beginPath();
+        ctx.arc(leftElbow.x * canvas.width, leftElbow.y * canvas.height, 8, 0, 2 * Math.PI);
+        ctx.fill();
+        
+        // Wrist
+        ctx.beginPath();
+        ctx.arc(leftWrist.x * canvas.width, leftWrist.y * canvas.height, 10, 0, 2 * Math.PI);
+        ctx.fill();
+    }
     
-    // Draw forearm
-    ctx.strokeStyle = '#ff9900'; // Different color for arm
-    ctx.lineWidth = 6; // Thicker for arm
-    ctx.beginPath();
-    ctx.moveTo(wrist.x * canvas.width, wrist.y * canvas.height);
-    ctx.lineTo(
-        (wrist.x + armDirectionX * armLength) * canvas.width,
-        (wrist.y + armDirectionY * armLength) * canvas.height
-    );
-    ctx.stroke();
+    // Draw torso connecting shoulders if both visible
+    if (leftShoulder && rightShoulder) {
+        ctx.strokeStyle = '#cccccc'; // Gray
+        ctx.lineWidth = 3;
+        ctx.beginPath();
+        ctx.moveTo(leftShoulder.x * canvas.width, leftShoulder.y * canvas.height);
+        ctx.lineTo(rightShoulder.x * canvas.width, rightShoulder.y * canvas.height);
+        ctx.stroke();
+    }
     
-    // Draw wrist point BIG
-    ctx.fillStyle = '#ff3366';
-    ctx.beginPath();
-    ctx.arc(wrist.x * canvas.width, wrist.y * canvas.height, 12, 0, 2 * Math.PI);
-    ctx.fill();
-    
-    // Draw palm center
-    ctx.fillStyle = '#00ff99';
-    ctx.beginPath();
-    ctx.arc(midPalm.x * canvas.width, midPalm.y * canvas.height, 8, 0, 2 * Math.PI);
-    ctx.fill();
-    
-    // Highlight thumb for orientation reference
-    const thumb = landmarks[4];
-    ctx.fillStyle = '#ffcc00';
-    ctx.beginPath();
-    ctx.arc(thumb.x * canvas.width, thumb.y * canvas.height, 8, 0, 2 * Math.PI);
-    ctx.fill();
-
-    // Show gesture feedback
+    // Show current gesture if active
     if (currentGesture) {
-        ctx.fillStyle = '#00ff00';
+        ctx.fillStyle = '#00ff00'; // Bright green
         ctx.font = 'bold 24px Arial';
         ctx.fillText(currentGesture.toUpperCase(), 10, 30);
     }
+    
+    // Show angles for debugging (optional)
+    if (rightElbow && rightShoulder && rightWrist) {
+        const forearmAngle = Math.atan2(
+            rightWrist.y - rightElbow.y,
+            rightWrist.x - rightElbow.x
+        ) * 180 / Math.PI;
+        
+        ctx.fillStyle = '#ffffff';
+        ctx.font = '12px monospace';
+        ctx.fillText(`Arm Angle: ${forearmAngle.toFixed(1)}°`, 10, canvas.height - 10);
+    }
 }
 
 /**
  * Clear visualization
```

Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `/**
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
        statusOverlay.innerHTML = `Camera access DENIED: ${error.message}<br>The game requires camera access to detect body movements.<br><button id=\"retry-camera-btn\" style=\"margin-top:10px;padding:5px 10px;background:#33ccff;border:none;border-radius:4px;cursor:pointer;\">Try Again</button>`;
        console.error('Camera permission error:', error);
        
        // Add retry button functionality
        setTimeout(() => {
            document.getElementById('retry-camera-btn')?.addEventListener('click', () => {
                statusOverlay.remove();
                requestCameraExplicitly();
            });
        }, 100);
    });
}`,
      `oldText`: `/**
 * Clear visualization
 */
function clearVisualization() {
    const canvas = document.getElementById('gesture-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}`
    }
  ]
}Response```diff
Index: /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js
===================================================================
--- /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	original
+++ /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	modified
@@ -759,8 +759,120 @@
     }
 }
 
 /**
+ * Request camera access explicitly
+ */
+function requestCameraExplicitly() {
+    console.log('Explicitly requesting camera access');
+    
+    // Create an overlay to show camera status
+    const statusOverlay = document.createElement('div');
+    statusOverlay.id = 'camera-status-overlay';
+    statusOverlay.style.cssText = `
+        position: fixed;
+        top: 10px;
+        left: 10px;
+        background: rgba(0, 0, 0, 0.8);
+        color: white;
+        padding: 10px;
+        border-radius: 5px;
+        z-index: 9999;
+        font-family: Arial, sans-serif;
+        max-width: 400px;
+        font-size: 12px;
+        border: 1px solid #33ccff;
+    `;
+    statusOverlay.innerHTML = 'Requesting camera access...';
+    document.body.appendChild(statusOverlay);
+    
+    // First check if the API exists
+    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
+        statusOverlay.innerHTML = 'ERROR: Your browser does not support camera access.<br>Try using Chrome or Edge.';
+        console.error('Camera API not available');
+        return;
+    }
+    
+    // Try to directly access the camera with plain getUserMedia
+    navigator.mediaDevices.getUserMedia({ 
+        video: {
+            width: { ideal: 320 },
+            height: { ideal: 240 }
+        }
+    })
+    .then(stream => {
+        statusOverlay.innerHTML = 'Camera access GRANTED! Initializing pose tracking...';
+        
+        // Check if we're already using a video element
+        let existingVideo = document.getElementById('gesture-video');
+        
+        if (!existingVideo || !existingVideo.srcObject) {
+            // If videoElement exists but has no stream
+            if (videoElement && !videoElement.srcObject) {
+                console.log('Connecting stream to existing video element');
+                videoElement.srcObject = stream;
+                videoElement.style.display = 'block';
+            } else {
+                console.log('Creating new video element for camera');
+                // Create a temporary video to verify the camera works
+                const tempVideo = document.createElement('video');
+                tempVideo.id = 'debug-video';
+                tempVideo.style.cssText = `
+                    position: absolute;
+                    right: 20px;
+                    bottom: 20px;
+                    width: 320px;
+                    height: 240px;
+                    border: 3px solid #ff3366;
+                    border-radius: 10px;
+                    display: block;
+                    z-index: 9999;
+                    transform: scaleX(-1);
+                `;
+                tempVideo.autoplay = true;
+                tempVideo.playsInline = true;
+                tempVideo.muted = true;
+                tempVideo.srcObject = stream;
+                document.body.appendChild(tempVideo);
+            }
+            
+            // Now try to properly initialize pose tracking
+            setTimeout(() => {
+                statusOverlay.innerHTML = 'Camera accessible! Now initializing pose tracking...';
+                console.log('Camera access successful, setting up pose tracking');
+                
+                // Try to kick-start the process again
+                if (typeof initNaturalPoseControls === 'function') {
+                    try {
+                        initNaturalPoseControls();
+                        statusOverlay.innerHTML += '<br>Pose tracking initialized!';
+                    } catch (error) {
+                        statusOverlay.innerHTML += `<br>Error initializing tracking: ${error.message}`;
+                        console.error('Error initializing pose controls:', error);
+                    }
+                } else {
+                    statusOverlay.innerHTML += '<br>Pose tracking function not available!';
+                }
+            }, 1000);
+        } else {
+            statusOverlay.innerHTML = 'Camera already connected to video element.';
+        }
+    })
+    .catch(error => {
+        statusOverlay.innerHTML = `Camera access DENIED: ${error.message}<br>The game requires camera access to detect body movements.<br><button id="retry-camera-btn" style="margin-top:10px;padding:5px 10px;background:#33ccff;border:none;border-radius:4px;cursor:pointer;">Try Again</button>`;
+        console.error('Camera permission error:', error);
+        
+        // Add retry button functionality
+        setTimeout(() => {
+            document.getElementById('retry-camera-btn')?.addEventListener('click', () => {
+                statusOverlay.remove();
+                requestCameraExplicitly();
+            });
+        }, 100);
+    });
+}
+
+/**
  * Load MediaPipe scripts dynamically
  */
 function loadMediaPipeScripts() {
     return new Promise((resolve) => {
```

Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `        const script1 = document.createElement('script');
        script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
        script1.crossOrigin = 'anonymous';

        const script2 = document.createElement('script');
        script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
        script2.crossOrigin = 'anonymous';

        // Load Pose instead of Hands
        const script3 = document.createElement('script');
        script3.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
        script3.crossOrigin = 'anonymous';`,
      `oldText`: `        const script1 = document.createElement('script');
        script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
        script1.crossOrigin = 'anonymous';

        const script2 = document.createElement('script');
        script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
        script2.crossOrigin = 'anonymous';

        const script3 = document.createElement('script');
        script3.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
        script3.crossOrigin = 'anonymous';`
    }
  ]
}Response```diff
Index: /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js
===================================================================
--- /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	original
+++ /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	modified
@@ -883,10 +883,11 @@
         const script2 = document.createElement('script');
         script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
         script2.crossOrigin = 'anonymous';
 
+        // Load Pose instead of Hands
         const script3 = document.createElement('script');
-        script3.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
+        script3.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
         script3.crossOrigin = 'anonymous';
 
         document.body.appendChild(script1);
         document.body.appendChild(script2);
```

Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `// Initialize on load with error handling
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
window.initNaturalPoseControls = initNaturalPoseControls;`,
      `oldText`: `// Initialize on load with error handling
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing natural hand controls');
    try {
        initNaturalHandControls();
        console.log('Natural hand controls initialized successfully');
    } catch (error) {
        console.error('Error initializing natural hand controls:', error);
    }
});

// Export for use
window.initNaturalHandControls = initNaturalHandControls;`
    }
  ]
}Response```diff
Index: /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js
===================================================================
--- /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	original
+++ /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	modified
@@ -902,15 +902,15 @@
 }
 
 // Initialize on load with error handling
 document.addEventListener('DOMContentLoaded', () => {
-    console.log('DOM loaded, initializing natural hand controls');
+    console.log('DOM loaded, initializing natural pose controls');
     try {
-        initNaturalHandControls();
-        console.log('Natural hand controls initialized successfully');
+        initNaturalPoseControls();
+        console.log('Natural pose controls initialized successfully');
     } catch (error) {
-        console.error('Error initializing natural hand controls:', error);
+        console.error('Error initializing natural pose controls:', error);
     }
 });
 
 // Export for use
-window.initNaturalHandControls = initNaturalHandControls;
+window.initNaturalPoseControls = initNaturalPoseControls;
```

Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `    if (gestureConfig.enabled) {
        controlsElement.innerHTML = `
            Full Body Gesture Controls:<br>
            🫸 RIGHT ARM MOVEMENT: Move right<br>
            🫷 LEFT ARM MOVEMENT: Move left<br>
            🤚 FOREARM ROTATION: Rotate piece<br>
            🫳 ARM DOWN: Drop piece<br>
            👋 WAVE ARMS: Pause game
        `;
    } else {`,
      `oldText`: `    if (gestureConfig.enabled) {
        controlsElement.innerHTML = `
            Natural Gesture Controls:<br>
            🫸 BACKHAND: Swipe right<br>
            🫷 FRONTHAND: Swipe left<br>
            🤌 FINGERS WIDE + TWIST: Rotate piece<br>
            🫳 PALM DOWN: Drop piece<br>
            👋 WAVE: Pause game
        `;
    } else {`
    }
  ]
}ResponseError: Could not find exact match for edit:
    if (gestureConfig.enabled) {
        controlsElement.innerHTML = `
            Natural Gesture Controls:<br>
            🫸 BACKHAND: Swipe right<br>
            🫷 FRONTHAND: Swipe left<br>
            🤌 FINGERS WIDE + TWIST: Rotate piece<br>
            🫳 PALM DOWN: Drop piece<br>
            👋 WAVE: Pause game
        `;
    } else {Let me try to find the correct section to edit:Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `/**
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
}`,
      `oldText`: `/**
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
}`
    }
  ]
}ResponseError: Could not find exact match for edit:
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
}Let's see what the current function looks like before editing:Rread_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`
}Response/**
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
    if (handCamera) {
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

        console.log('Attempting to start hand camera...');
        handCamera.start()
            .then(() => {
                console.log('Hand camera started successfully');
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
            Natural Gesture Controls:<br>
            🫸 BACKHAND: Swipe right<br>
            🫷 FRONTHAND: Swipe left<br>
            🤚 FINGERS WIDE + TWIST: Rotate piece<br>
            🫳 PALM DOWN: Drop piece<br>
            👋 WAVE: Pause game
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

    // Detect and handle BIG gestures using the new combined function
    detectBigGestures(landmarks);

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
Now I can see the entire updated file. Let's make the final changes to update the controls display and fix the camera reference:Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `    if (gestureConfig.enabled) {
        controlsElement.innerHTML = `
            Full Body Gesture Controls:<br>
            🫸 RIGHT ARM MOVEMENT: Move right<br>
            🫷 LEFT ARM MOVEMENT: Move left<br>
            🤚 FOREARM ROTATION: Rotate piece<br>
            🫳 ARM DOWN: Drop piece<br>
            👋 WAVE ARMS: Pause game
        `;
    } else {`,
      `oldText`: `    if (gestureConfig.enabled) {
        controlsElement.innerHTML = `
            Natural Gesture Controls:<br>
            🫸 BACKHAND: Swipe right<br>
            🫷 FRONTHAND: Swipe left<br>
            🤌 FINGERS WIDE + TWIST: Rotate piece<br>
            🫳 PALM DOWN: Drop piece<br>
            👋 WAVE: Pause game
        `;
    } else {`
    }
  ]
}ResponseError: Could not find exact match for edit:
    if (gestureConfig.enabled) {
        controlsElement.innerHTML = `
            Natural Gesture Controls:<br>
            🫸 BACKHAND: Swipe right<br>
            🫷 FRONTHAND: Swipe left<br>
            🤌 FINGERS WIDE + TWIST: Rotate piece<br>
            🫳 PALM DOWN: Drop piece<br>
            👋 WAVE: Pause game
        `;
    } else {Let's try a different approach:Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `function updateControlsDisplay() {
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
}`,
      `oldText`: `function updateControlsDisplay() {
    const controlsElement = document.getElementById('controls');
    if (!controlsElement) return;

    if (gestureConfig.enabled) {
        controlsElement.innerHTML = `
            Natural Gesture Controls:<br>
            🫸 BACKHAND: Swipe right<br>
            🫷 FRONTHAND: Swipe left<br>
            🤚 FINGERS WIDE + TWIST: Rotate piece<br>
            🫳 PALM DOWN: Drop piece<br>
            👋 WAVE: Pause game
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
}`
    }
  ]
}Response```diff
Index: /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js
===================================================================
--- /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	original
+++ /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	modified
@@ -391,14 +391,14 @@
     if (!controlsElement) return;
 
     if (gestureConfig.enabled) {
         controlsElement.innerHTML = `
-            Natural Gesture Controls:<br>
-            🫸 BACKHAND: Swipe right<br>
-            🫷 FRONTHAND: Swipe left<br>
-            🤚 FINGERS WIDE + TWIST: Rotate piece<br>
-            🫳 PALM DOWN: Drop piece<br>
-            👋 WAVE: Pause game
+            Full Body Gesture Controls:<br>
+            🫸 RIGHT ARM MOVEMENT: Move right<br>
+            🫷 LEFT ARM MOVEMENT: Move left<br>
+            🤚 FOREARM ROTATION: Rotate piece<br>
+            🫳 ARM DOWN: Drop piece<br>
+            👋 WAVE ARMS: Pause game
         `;
     } else {
         controlsElement.innerHTML = `
             Controls:<br>
```

Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `    // Start tracking
    if (poseCamera) {`,
      `oldText`: `    // Start tracking
    if (handCamera) {`
    }
  ]
}Response```diff
Index: /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js
===================================================================
--- /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	original
+++ /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	modified
@@ -328,9 +328,9 @@
             return;
         }
 
     // Start tracking
-    if (handCamera) {
+    if (poseCamera) {
         console.log('Starting camera...');
 
         // Show prompt for user
         const promptDiv = document.createElement('div');
```

Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `        console.log('Attempting to start pose camera...');
        poseCamera.start()`,
      `oldText`: `        console.log('Attempting to start hand camera...');
        handCamera.start()`
    }
  ]
}Response```diff
Index: /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js
===================================================================
--- /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	original
+++ /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	modified
@@ -349,10 +349,10 @@
         `;
         promptDiv.innerHTML = '<h3>Camera Access Required</h3><p>Please allow camera access when prompted by your browser.</p>';
         document.body.appendChild(promptDiv);
 
-        console.log('Attempting to start hand camera...');
-        handCamera.start()
+        console.log('Attempting to start pose camera...');
+        poseCamera.start()
             .then(() => {
                 console.log('Hand camera started successfully');
                 console.log('Camera started successfully');
                 trackingStarted = true;
```

Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `                console.log('Pose camera started successfully');`,
      `oldText`: `                console.log('Hand camera started successfully');`
    }
  ]
}Response```diff
Index: /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js
===================================================================
--- /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	original
+++ /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	modified
@@ -352,9 +352,9 @@
 
         console.log('Attempting to start pose camera...');
         poseCamera.start()
             .then(() => {
-                console.log('Hand camera started successfully');
+                console.log('Pose camera started successfully');
                 console.log('Camera started successfully');
                 trackingStarted = true;
                 window.gestureTrackingState.started = true;  // Update global state
                 gestureConfig.enabled = true;
```

Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `function handlePoseResults(results) {
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
}`,
      `oldText`: `function handleGestureResults(results) {
    if (!results.multiHandLandmarks || !results.multiHandLandmarks[0]) {
        currentGesture = null;
        rotationStartAngle = null;
        clearVisualization();
        return;
    }

    const landmarks = results.multiHandLandmarks[0];
    updateGestureHistory(landmarks);

    // Detect and handle BIG gestures using the new combined function
    detectBigGestures(landmarks);

    // Visualize
    drawGestures(landmarks);
}`
    }
  ]
}Response```diff
Index: /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js
===================================================================
--- /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	original
+++ /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	modified
@@ -412,24 +412,24 @@
 
 /**
  * Handle natural gesture results
  */
-function handleGestureResults(results) {
-    if (!results.multiHandLandmarks || !results.multiHandLandmarks[0]) {
+function handlePoseResults(results) {
+    if (!results.poseLandmarks) {
         currentGesture = null;
         rotationStartAngle = null;
         clearVisualization();
         return;
     }
 
-    const landmarks = results.multiHandLandmarks[0];
+    const landmarks = results.poseLandmarks;
     updateGestureHistory(landmarks);
 
-    // Detect and handle BIG gestures using the new combined function
+    // Detect and handle BIG gestures using the new full-body tracking
     detectBigGestures(landmarks);
 
     // Visualize
-    drawGestures(landmarks);
+    drawPose(landmarks, results);
 }
 
 /**
  * Update gesture history for tracking movement
```

Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `/**
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
}`,
      `oldText`: `/**
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
}`
    }
  ]
}Response```diff
Index: /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js
===================================================================
--- /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	original
+++ /Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js	modified
@@ -435,14 +435,19 @@
  * Update gesture history for tracking movement
  */
 function updateGestureHistory(landmarks) {
     const now = Date.now();
-    const palmBase = landmarks[0];
+    
+    // Use the right wrist as our main reference point
+    const rightWrist = landmarks[16]; // Right wrist landmark
 
+    if (!rightWrist) return; // Skip if wrist not visible
+
     gestureHistory.push({
         time: now,
-        x: palmBase.x,
-        y: palmBase.y,
+        x: rightWrist.x,
+        y: rightWrist.y,
+        z: rightWrist.z || 0,
         landmarks: landmarks
     });
 
     // Keep history limited
```

We've successfully implemented a complete transformation from hand tracking to full body pose tracking! Let's summarize what we've done:Rread_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/index.html`
}Response<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>Tetris with Natural Gestures</title>
    <link rel="stylesheet" href="docs/VISION_UI_TETRIS/styles.css">
    <style>
        /* Fix for Chrome height issue */
        html,
        body {
            position: fixed;
            overflow: hidden;
            width: 100%;
            height: 100vh;
            min-height: -webkit-fill-available;
            margin: 0;
            padding: 0;
        }

        #game-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            min-height: -webkit-fill-available;
            overflow: hidden;
        }

        /* Hide the original hand controls button */
        #hand-controls-button {
            display: none !important;
        }

        /* Natural gesture video styling */
        #gesture-video, #debug-video {
            border: 3px solid #33ccff !important;
            box-shadow: 0 0 20px rgba(51, 204, 255, 0.5);
            display: block !important;
        }

        #gesture-canvas {
            display: block !important;
        }

        /* Camera status overlay */
        #camera-status-overlay {
            position: fixed;
            top: 10px; 
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px; 
            z-index: 999;
            max-width: 80%;
            font-family: 'Courier New', monospace;
            border: 1px solid #33ccff;
        }

        /* Notification styling for gesture feedback */
        #fist-notification,
        #index-finger-notification {
            animation: pulse 1s infinite;
            font-family: 'Courier New', monospace;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        @keyframes pulse {
            0% {
                transform: scale(1);
            }

            50% {
                transform: scale(1.05);
            }

            100% {
                transform: scale(1);
            }
        }

        /* Camera prompt styling */
        .camera-prompt {
            background: rgba(51, 204, 255, 0.2);
            border: 2px solid #33ccff;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }

        .camera-prompt h3 {
            color: #33ccff;
            margin-bottom: 10px;
        }

        /* Fix for overlays on smaller screens */
        @media (max-height: 700px) {
            .frosted-glass-overlay {
                transform: translate(-50%, -50%) scale(0.9);
                max-height: 90vh;
                overflow-y: auto;
            }
        }
    </style>
</head>

<body>
    <div id="game-container">
        <div id="button-container">
            <button id="pause-button" class="button">⏯️</button>
            <button id="mute-button" class="button">🔊</button>
        </div>

        <div id="info-container">
            <div id="score-container">Score: <span id="score">0</span></div>
            <div id="high-score-container">High Score: <span id="high-score">0</span></div>
            <div id="level-container">Level: <span id="level">1</span></div>
        </div>

        <div id="controls">
            Natural Hand Controls:<br>
            🫸 Swipe: Move left/right<br>
            🤌 Rotate hand: Rotate piece<br>
            🫳 Palm down: Drop piece<br>
            👋 Wave: Pause game
        </div>

        <div id="start-screen" class="frosted-glass-overlay">
            <h1>TETRIS WITH NATURAL GESTURES</h1>

            <div class="camera-prompt">
                <h3>🎮 This version uses hand gestures only!</h3>
                <p>No keyboard or touch controls - just natural hand movements</p>
            </div>

            <!-- Natural Gesture controls explanation -->
            <div class="gesture-info">
                <h3>How to Play:</h3>
                <ul class="controls-list">
                    <li><strong>🫸 Swipe:</strong> Move piece left/right (whole hand movement)</li>
                    <li><strong>🤌 Rotate hand:</strong> Turn piece like opening a door</li>
                    <li><strong>🫳 Palm down:</strong> Drop piece fast</li>
                    <li><strong>👋 Wave:</strong> Pause the game</li>
                </ul>
                <p style="margin-top: 10px; font-style: italic;">No finger counting required - just natural hand positions!</p>
            </div>

            <!-- Camera Setup Info -->
            <div class="camera-prompt">
                <h3>To Start Playing:</h3>
                <p>Click START GAME and the camera will activate automatically!</p>
                <p style="margin-top: 10px; color: #33ccff;"><strong>Note:</strong> Camera permission is required - this game is gesture-only!</p>
            </div>

            <p>Clear lines to score points and level up!</p>
            <div class="level-selector">
                <label for="starting-level">Starting Level: </label>
                <select id="starting-level">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                </select>
            </div>
            <button id="start-button" class="button">START GAME</button>
            <button id="camera-test-button" class="button" style="margin-top: 10px; background-color: #33ccff;">TEST CAMERA</button>
        </div>

        <div id="next-piece-container">
            <div>NEXT PIECE</div>
            <canvas id="next-piece-canvas"></canvas>
        </div>

        <div id="pause-overlay" class="hidden frosted-glass-overlay">
            <p>PAUSED</p>
            <button id="play-button">▶️</button>
            <div class="level-selector">
                <label for="restarting-level1">Starting Level: </label>
                <select id="restarting-level1">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                </select>
            </div>
            <button id="restart-button1" class="button">New Game</button>
        </div>

        <div id="game-over" class="frosted-glass-overlay">
            <h1>Game Over</h1>
            <p>Your score: <span id="final-score">0</span></p>
            <p>High score: <span id="final-high-score">0</span></p>
            <div class="level-selector">
                <label for="restarting-level2">Starting Level: </label>
                <select id="restarting-level2">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                </select>
            </div>
            <button id="restart-button2" class="button">New Game</button>
        </div>
    </div>

    <!-- Load natural hand controls FIRST -->
    <!-- MediaPipe libraries -->
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
    
    <!-- Load natural hand controls AFTER MediaPipe libraries -->
    <script src="natural_hand_controls.js"></script>

    <!-- Core game scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>

    <!-- Original Tetris scripts -->
    <script src="docs/VISION_UI_TETRIS/deviceUtils.js"></script>
    <script src="docs/VISION_UI_TETRIS/uiAdapter.js"></script>
    <script src="docs/VISION_UI_TETRIS/touchControls.js"></script>
    <script src="docs/VISION_UI_TETRIS/sounds.js"></script>

    <!-- Main game logic -->
    <script src="docs/VISION_UI_TETRIS/main.js"></script>

    <script>
        // Wait for everything to load
        window.addEventListener('load', () => {
            console.log('Page loaded, setting up natural gestures');

            // Add test camera button handler
            document.getElementById('camera-test-button').addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Camera test button clicked');
                if (typeof requestCameraExplicitly === 'function') {
                    requestCameraExplicitly();
                } else {
                    alert('Camera test function not available');
                }
            });

            // Override the initHandControls function with better debugging
            window.initHandControls = function () {
                console.log('Overriding hand controls with natural gestures');
                // Log available functions to debug
                console.log('Natural hand controls function available?', 
                    typeof window.initNaturalHandControls === 'function');
                console.log('Current window functions:', 
                    Object.keys(window).filter(key => typeof window[key] === 'function' && 
                        key.toLowerCase().includes('hand')));
                
                if (typeof window.initNaturalHandControls === 'function') {
                    try {
                        window.initNaturalHandControls();
                        console.log('Natural hand controls initialized successfully from override');
                    } catch (error) {
                        console.error('Error initializing natural hand controls from override:', error);
                    }
                } else {
                    console.error('Natural hand controls not loaded - script might not be fully initialized');
                }
            };

            // Set up auto-activation of gestures
            setTimeout(() => {
                if (window.startGame) {
                    const originalStartGame = window.startGame;
                    window.startGame = function () {
                        console.log('Starting game with auto-gestures');
                        originalStartGame.call(this);

                        // Auto-activate gestures after game starts
                        setTimeout(() => {
                            const gestureButton = document.getElementById('gesture-button');
                            if (gestureButton && window.gestureTrackingState && !window.gestureTrackingState.started) {
                                console.log('Auto-clicking gesture button');
                                gestureButton.click();
                            } else {
                                console.log('Gesture button not found or already started');
                            }
                        }, 500);
                    };
                }

                // Same for play button (resume)
                if (window.playGame) {
                    const originalPlayGame = window.playGame;
                    window.playGame = function () {
                        originalPlayGame.call(this);

                        setTimeout(() => {
                            if (window.gestureTrackingState && !window.gestureTrackingState.started) {
                                const gestureButton = document.getElementById('gesture-button');
                                if (gestureButton) {
                                    gestureButton.click();
                                }
                            }
                        }, 100);
                    };
                }

                // And restart buttons
                if (window.restartGame1) {
                    const originalRestartGame1 = window.restartGame1;
                    window.restartGame1 = function () {
                        originalRestartGame1.call(this);

                        setTimeout(() => {
                            if (window.gestureTrackingState && !window.gestureTrackingState.started) {
                                const gestureButton = document.getElementById('gesture-button');
                                if (gestureButton) {
                                    gestureButton.click();
                                }
                            }
                        }, 500);
                    };
                }

                if (window.restartGame2) {
                    const originalRestartGame2 = window.restartGame2;
                    window.restartGame2 = function () {
                        originalRestartGame2.call(this);

                        setTimeout(() => {
                            if (window.gestureTrackingState && !window.gestureTrackingState.started) {
                                const gestureButton = document.getElementById('gesture-button');
                                if (gestureButton) {
                                    gestureButton.click();
                                }
                            }
                        }, 500);
                    };
                }

                // Disable keyboard controls
                if (window.handleKeyPress) {
                    window.removeEventListener('keydown', window.handleKeyPress);
                }

                // Add keyboard blocker
                window.addEventListener('keydown', (e) => {
                    if (!['F5', 'F12', 'F11'].includes(e.key)) {
                        e.preventDefault();
                    }
                });
            }, 1000);
        });
    </script>
</body>

</html>Eedit_fileRequest{
  `edits`: [
    {
      `newText`: `    <!-- MediaPipe libraries for Pose tracking -->
    <script src=\"https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js\" crossorigin=`
    }
  ]
}RetryClaude hit the max length for a message and has paused its response. You can write Continue to keep the chat going.SAContinueEditLet's finish updating the HTML file to use MediaPipe Pose instead of Hands:Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/index.html`,
  `edits`: [
    {
      `newText`: `    <!-- MediaPipe libraries for Pose tracking -->
    <script src=\"https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js\" crossorigin=\"anonymous\"></script>
    <script src=\"https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js\" crossorigin=\"anonymous\"></script>
    <script src=\"https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js\" crossorigin=\"anonymous\"></script>
    
    <!-- Load natural pose controls AFTER MediaPipe libraries -->
    <script src=\"natural_hand_controls.js\"></script>`,
      `oldText`: `    <!-- MediaPipe libraries -->
    <script src=\"https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js\" crossorigin=\"anonymous\"></script>
    <script src=\"https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js\" crossorigin=\"anonymous\"></script>
    <script src=\"https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js\" crossorigin=\"anonymous\"></script>
    
    <!-- Load natural hand controls AFTER MediaPipe libraries -->
    <script src=\"natural_hand_controls.js\"></script>`
    }
  ]
}Response```diff
Index: /Users/seanivore/Development/c-scopes-handy-agent/index.html
===================================================================
--- /Users/seanivore/Development/c-scopes-handy-agent/index.html	original
+++ /Users/seanivore/Development/c-scopes-handy-agent/index.html	modified
@@ -226,14 +226,14 @@
         </div>
     </div>
 
     <!-- Load natural hand controls FIRST -->
-    <!-- MediaPipe libraries -->
+    <!-- MediaPipe libraries for Pose tracking -->
     <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
     <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
-    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
+    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" crossorigin="anonymous"></script>
     
-    <!-- Load natural hand controls AFTER MediaPipe libraries -->
+    <!-- Load natural pose controls AFTER MediaPipe libraries -->
     <script src="natural_hand_controls.js"></script>
 
     <!-- Core game scripts -->
     <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/index.html`,
  `edits`: [
    {
      `newText`: `            <!-- Full Body Gesture controls explanation -->
            <div class=\"gesture-info\">
                <h3>How to Play:</h3>
                <ul class=\"controls-list\">
                    <li><strong>🫸 RIGHT ARM:</strong> Move arm right to move piece right</li>
                    <li><strong>🫷 LEFT ARM:</strong> Move arm left to move piece left</li>
                    <li><strong>🤚 ROTATE:</strong> Rotate forearm to rotate piece</li>
                    <li><strong>🫳 ARM DOWN:</strong> Extend arm down to drop piece</li>
                    <li><strong>👋 WAVE:</strong> Wave arms to pause the game</li>
                </ul>
                <p style=\"margin-top: 10px; font-style: italic;\">Full body tracking - use natural arm movements!</p>
            </div>`,
      `oldText`: `            <!-- Natural Gesture controls explanation -->
            <div class=\"gesture-info\">
                <h3>How to Play:</h3>
                <ul class=\"controls-list\">
                    <li><strong>🫸 Swipe:</strong> Move piece left/right (whole hand movement)</li>
                    <li><strong>🤌 Rotate hand:</strong> Turn piece like opening a door</li>
                    <li><strong>🫳 Palm down:</strong> Drop piece fast</li>
                    <li><strong>👋 Wave:</strong> Pause the game</li>
                </ul>
                <p style=\"margin-top: 10px; font-style: italic;\">No finger counting required - just natural hand positions!</p>
            </div>`
    }
  ]
}Response```diff
Index: /Users/seanivore/Development/c-scopes-handy-agent/index.html
===================================================================
--- /Users/seanivore/Development/c-scopes-handy-agent/index.html	original
+++ /Users/seanivore/Development/c-scopes-handy-agent/index.html	modified
@@ -137,18 +137,19 @@
                 <h3>🎮 This version uses hand gestures only!</h3>
                 <p>No keyboard or touch controls - just natural hand movements</p>
             </div>
 
-            <!-- Natural Gesture controls explanation -->
+            <!-- Full Body Gesture controls explanation -->
             <div class="gesture-info">
                 <h3>How to Play:</h3>
                 <ul class="controls-list">
-                    <li><strong>🫸 Swipe:</strong> Move piece left/right (whole hand movement)</li>
-                    <li><strong>🤌 Rotate hand:</strong> Turn piece like opening a door</li>
-                    <li><strong>🫳 Palm down:</strong> Drop piece fast</li>
-                    <li><strong>👋 Wave:</strong> Pause the game</li>
+                    <li><strong>🫸 RIGHT ARM:</strong> Move arm right to move piece right</li>
+                    <li><strong>🫷 LEFT ARM:</strong> Move arm left to move piece left</li>
+                    <li><strong>🤚 ROTATE:</strong> Rotate forearm to rotate piece</li>
+                    <li><strong>🫳 ARM DOWN:</strong> Extend arm down to drop piece</li>
+                    <li><strong>👋 WAVE:</strong> Wave arms to pause the game</li>
                 </ul>
-                <p style="margin-top: 10px; font-style: italic;">No finger counting required - just natural hand positions!</p>
+                <p style="margin-top: 10px; font-style: italic;">Full body tracking - use natural arm movements!</p>
             </div>
 
             <!-- Camera Setup Info -->
             <div class="camera-prompt">
```

Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/index.html`,
  `edits`: [
    {
      `newText`: `                <h3>🎮 This version uses full body tracking!</h3>
                <p>No keyboard or touch controls - just natural arm movements</p>`,
      `oldText`: `                <h3>🎮 This version uses hand gestures only!</h3>
                <p>No keyboard or touch controls - just natural hand movements</p>`
    }
  ]
}Response```diff
Index: /Users/seanivore/Development/c-scopes-handy-agent/index.html
===================================================================
--- /Users/seanivore/Development/c-scopes-handy-agent/index.html	original
+++ /Users/seanivore/Development/c-scopes-handy-agent/index.html	modified
@@ -133,10 +133,10 @@
         <div id="start-screen" class="frosted-glass-overlay">
             <h1>TETRIS WITH NATURAL GESTURES</h1>
 
             <div class="camera-prompt">
-                <h3>🎮 This version uses hand gestures only!</h3>
-                <p>No keyboard or touch controls - just natural hand movements</p>
+                <h3>🎮 This version uses full body tracking!</h3>
+                <p>No keyboard or touch controls - just natural arm movements</p>
             </div>
 
             <!-- Full Body Gesture controls explanation -->
             <div class="gesture-info">
```

Eedit_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `edits`: [
    {
      `newText`: `            // Update the title of the button to match new tracking approach
            button.title = 'Natural Pose Controls';

            // Update the emoji to represent body tracking
            button.innerHTML = '🧲';  // Person symbol emoji`,
      `oldText`: `            button.title = 'Natural Hand Controls';
            button.innerHTML = '🤌';  // Hand gesture emoji`
    }
  ]
}ResponseError: Could not find exact match for edit:
            button.title = 'Natural Hand Controls';
            button.innerHTML = '🤌';  // Hand gesture emojiRread_fileRequest{
  `path`: `/Users/seanivore/Development/c-scopes-handy-agent/natural_hand_controls.js`,
  `end_line`: `270`,
  `start_line`: `250`
}Response/**
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
