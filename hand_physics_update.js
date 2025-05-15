// Add this to the existing code in index_with_agent.html
// Find the section where pinch distance is calculated and replace with:

// RIGHT HAND: Control sphere size (REVERSED - now intuitive!)
const thumbTip = landmarks[4];
const indexTip = landmarks[8];
const pinchDistance = calculateDistance(thumbTip, indexTip);

// REVERSED LOGIC - spreading hands makes it bigger!
if (pinchDistance < 0.05) {
    targetSphereSize = 2.0; // Pinched = BIG
} else if (pinchDistance > 0.25) {
    targetSphereSize = 0.2; // Spread = SMALL
} else {
    // Inverted linear mapping
    targetSphereSize = 2.0 - (pinchDistance - 0.05) * (2.0 - 0.2) / (0.25 - 0.05);
}

// Add this new function for hand clap detection
function detectHandClap(leftLandmarks, rightLandmarks) {
    if (!leftLandmarks || !rightLandmarks) return false;
    
    // Get palm centers (landmark 0)
    const leftPalm = leftLandmarks[0];
    const rightPalm = rightLandmarks[0];
    
    // Calculate distance between palms
    const palmDistance = Math.sqrt(
        Math.pow(leftPalm.x - rightPalm.x, 2) + 
        Math.pow(leftPalm.y - rightPalm.y, 2)
    );
    
    // If palms are close together, it's a clap!
    return palmDistance < 0.15;
}

// Add velocity tracking for the smack effect
let sphereVelocity = { x: 0, y: 0 };
let lastClapTime = 0;

// In the animate() function, add physics:
function animate() {
    requestAnimationFrame(animate);
    
    if (sphere) {
        // Apply velocity (with damping)
        sphere.position.x += sphereVelocity.x;
        sphere.position.y += sphereVelocity.y;
        sphereVelocity.x *= 0.95; // Damping
        sphereVelocity.y *= 0.95;
        
        // Bounce off walls
        if (Math.abs(sphere.position.x) > 5) {
            sphereVelocity.x *= -0.8;
            sphere.position.x = Math.sign(sphere.position.x) * 5;
        }
        if (Math.abs(sphere.position.y) > 3) {
            sphereVelocity.y *= -0.8;
            sphere.position.y = Math.sign(sphere.position.y) * 3;
        }
        
        // Original rotation
        sphere.rotation.x += 0.003;
        sphere.rotation.y += 0.008;
        
        // Rest of pulse effect...
    }
    
    renderer.render(scene, camera);
}

// In onResults, add clap detection:
if (results.multiHandLandmarks.length === 2) {
    const leftHand = results.multiHandedness[0].label === 'Left' ? 0 : 1;
    const rightHand = 1 - leftHand;
    
    if (detectHandClap(
        results.multiHandLandmarks[leftHand], 
        results.multiHandLandmarks[rightHand]
    )) {
        const currentTime = Date.now();
        if (currentTime - lastClapTime > 500) { // Cooldown
            // SMACK! Add random velocity
            sphereVelocity.x = (Math.random() - 0.5) * 0.5;
            sphereVelocity.y = (Math.random() - 0.5) * 0.5;
            
            // Flash the sphere color
            if (solidMesh && solidMesh.material) {
                solidMesh.material.color.setHex(0xFFFFFF);
                setTimeout(() => {
                    solidMesh.material.color.setHex(getRandomNeonColor());
                }, 100);
            }
            
            // Send clap gesture to Python
            sendGestureToPython('clap', 1.0, 2);
            
            lastClapTime = currentTime;
        }
    }
}
