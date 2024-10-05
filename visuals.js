// Import necessary modules from node_modules using relative paths
import * as THREE from "./node_modules/three/build/three.module.js";

async function createWindow() {
  // Create a video element and load the video
  const video = document.createElement("video");
  video.src = "/media/water.mp4";
  video.loop = true; // Loop the video
  video.muted = true; // Mute the video (required by browsers for autoplay)
  video.autoplay = true; // Autoplay the video
  video.play(); // Start playing the video

  // Create a VideoTexture using the video element
  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBFormat;

  // Set a brighter frame color and add emissive lighting to brighten it up
  const frameColor = 0xc4ffd5; // Brighter green (Spring Green)
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: frameColor, // Brighter green for the base color
    emissive: 0x00ff7f, // Brighter emissive green to enhance glow
    emissiveIntensity: 0.3, // Slightly increased emissive intensity for extra brightness
    roughness: 0.3, // Adjusted roughness for a polished wooden look
    metalness: 0.3, // Lower metalness to keep it looking more like wood
  });
  // Window dimensions (portrait)
  const frameThickness = 0.3;
  const frameWidth = 1.5;
  const frameHeight = 2.5;

  // Create window frame (4 sides)
  const frameTop = new THREE.Mesh(
    new THREE.BoxGeometry(frameWidth, frameThickness, frameThickness),
    woodMaterial
  );
  const frameBottom = frameTop.clone();
  const frameLeft = new THREE.Mesh(
    new THREE.BoxGeometry(frameThickness, frameHeight, frameThickness),
    woodMaterial
  );
  const frameRight = frameLeft.clone();

  // Position the frame parts
  frameTop.position.set(0, frameHeight / 2 - frameThickness / 2, 0); // Adjusted
  frameBottom.position.set(0, -frameHeight / 2 + frameThickness / 2, 0); // Adjusted
  frameLeft.position.set(-frameWidth / 2 + frameThickness / 2, 0, 0); // Adjusted
  frameRight.position.set(frameWidth / 2 - frameThickness / 2, 0, 0); // Adjusted

  // Group the frame
  const frame = new THREE.Group();
  frame.add(frameTop, frameBottom, frameLeft, frameRight);

  // Create the "mirror" pane with the video texture
  const mirrorMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture, // Set the video texture as the material
    toneMapped: false, // Prevent darkening due to tone mapping
  });

  // Create the mirror pane
  const mirrorGeometry = new THREE.BoxGeometry(
    frameWidth - frameThickness,
    frameHeight - frameThickness,
    frameThickness / 2
  );
  const mirrorPane = new THREE.Mesh(mirrorGeometry, mirrorMaterial);

  // Add the mirror to the frame
  const windowGroup = new THREE.Group();
  windowGroup.add(frame, mirrorPane);

  // Move the mirror to fit within the frame
  mirrorPane.position.set(0, 0, -frameThickness / 2);

  // Move to front of the scene
  windowGroup.position.z = 1;

  // Return the window (you can position/scale it in the scene)
  return windowGroup;
}

// Setup scene, camera, renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5f5f5); // White background

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Update the existing ambient light to be softer
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Softer ambient light
scene.add(ambientLight);

// Update directional light to create strong directional lighting
const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8); // Reduced intensity
directionalLight1.position.set(2, 5, 5).normalize(); // Adjust position to create better shadows
scene.add(directionalLight1);

// Add a second directional light to fill shadows from the other side
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight2.position.set(-2, 5, -5).normalize();
scene.add(directionalLight2);

// Create a plane geometry using PlaneGeometry (for colorful wobbles)
const geometry = new THREE.PlaneGeometry(10, 10, 100, 100);

// Generate vertex colors for the geometry
const colors = [];
const positionAttribute = geometry.attributes.position;
const color1 = new THREE.Color(0xfffa6e); // yellow
const color2 = new THREE.Color(0x0048ff); // blue
const color3 = new THREE.Color(0xc2ff9c); // green

for (let i = 0; i < positionAttribute.count; i++) {
  // Apply gradient-style colors
  if (i % 3 === 0) {
    colors.push(color1.r, color1.g, color1.b);
  } else if (i % 3 === 1) {
    colors.push(color2.r, color2.g, color2.b);
  } else {
    colors.push(color3.r, color3.g, color3.b);
  }
}

geometry.setAttribute(
  "color",
  new THREE.BufferAttribute(new Float32Array(colors), 3)
);

// Create a basic material with vertex colors enabled (for colorful wobbles)
const material = new THREE.MeshBasicMaterial({
  wireframe: false,
  vertexColors: true,
  side: THREE.DoubleSide,
});

const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// Add a blue border using WireframeGeometry to fill the whole page
const wireframeGeometry = new THREE.WireframeGeometry(geometry);
const wireframeMaterial = new THREE.LineBasicMaterial({
  color: 0x0000ff, // Blue border color
  linewidth: 2,
});
const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

// Scale the wireframe to make it cover the whole page
wireframe.scale.set(2, 2, 1); // Adjust the scaling factors as needed
scene.add(wireframe);

// Add the window to the scene
const windowGroup = await createWindow();
scene.add(windowGroup);

let cameraMaterial;

async function createCameraOverlay() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" }, // Use the front camera if available
  });

  const cameraVideo = document.createElement("video");
  cameraVideo.srcObject = stream;
  cameraVideo.play();

  // Wait for the video to load metadata (dimensions)
  await new Promise((resolve) => {
    cameraVideo.onloadedmetadata = () => {
      resolve();
    };
  });

  // Create a video texture from the camera video
  const cameraTexture = new THREE.VideoTexture(cameraVideo);
  cameraTexture.minFilter = THREE.LinearFilter;
  cameraTexture.magFilter = THREE.LinearFilter;
  cameraTexture.format = THREE.RGBFormat;

  // Get the aspect ratio of the camera feed
  const cameraAspect = cameraVideo.videoWidth / cameraVideo.videoHeight;
  const frameWidth = 1.5;
  const frameHeight = 2.5;
  const frameAspect = frameWidth / frameHeight;

  let overlayWidth, overlayHeight;
  let uvScaleX = 1;
  let uvScaleY = 1;

  // Scale the overlay to fit the frame dimensions and adjust UV mapping for cropping
  if (cameraAspect > frameAspect) {
    // Camera is wider than the frame, fit by height and crop the sides
    overlayHeight = frameHeight;
    overlayWidth = frameHeight * cameraAspect;
    uvScaleX = frameWidth / overlayWidth; // Scale UV horizontally
  } else {
    // Camera is taller than the frame, fit by width and crop the top/bottom
    overlayWidth = frameWidth;
    overlayHeight = frameWidth / cameraAspect;
    uvScaleY = frameHeight / overlayHeight; // Scale UV vertically
  }

  cameraMaterial = new THREE.ShaderMaterial({
    uniforms: {
      cameraTexture: { value: cameraTexture },
      opacity: { value: 0.2 },
      uvScaleX: { value: uvScaleX },
      uvScaleY: { value: uvScaleY },
      time: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      uniform float uvScaleX;
      uniform float uvScaleY;
  
      void main() {
        vUv = uv;
        vUv.x = vUv.x * uvScaleX + (1.0 - uvScaleX) / 2.0; // Center X
        vUv.y = vUv.y * uvScaleY + (1.0 - uvScaleY) / 2.0; // Center Y
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D cameraTexture;
      uniform float opacity;
      uniform float time;
      varying vec2 vUv;
  
      // Simple noise function
      float rand(vec2 co){
        return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453);
      }
  
      // Sobel kernel for edge detection
      vec3 sobelEdgeDetection(sampler2D tex, vec2 uv) {
        float texelSizeX = 1.0 / 512.0;
        float texelSizeY = 1.0 / 512.0;
  
        vec2 texOffset[9];
        texOffset[0] = vec2(-texelSizeX, texelSizeY); // Top-left
        texOffset[1] = vec2(0.0, texelSizeY);        // Top-center
        texOffset[2] = vec2(texelSizeX, texelSizeY);  // Top-right
        texOffset[3] = vec2(-texelSizeX, 0.0);        // Center-left
        texOffset[4] = vec2(0.0, 0.0);               // Center
        texOffset[5] = vec2(texelSizeX, 0.0);         // Center-right
        texOffset[6] = vec2(-texelSizeX, -texelSizeY);// Bottom-left
        texOffset[7] = vec2(0.0, -texelSizeY);        // Bottom-center
        texOffset[8] = vec2(texelSizeX, -texelSizeY); // Bottom-right
  
        float kernelX[9];
        kernelX[0] = -1.0; kernelX[1] = 0.0; kernelX[2] = 1.0;
        kernelX[3] = -2.0; kernelX[4] = 0.0; kernelX[5] = 2.0;
        kernelX[6] = -1.0; kernelX[7] = 0.0; kernelX[8] = 1.0;
  
        float kernelY[9];
        kernelY[0] = 1.0; kernelY[1] = 2.0; kernelY[2] = 1.0;
        kernelY[3] = 0.0; kernelY[4] = 0.0; kernelY[5] = 0.0;
        kernelY[6] = -1.0; kernelY[7] = -2.0; kernelY[8] = -1.0;
  
        float edgeX = 0.0;
        float edgeY = 0.0;
  
        for (int i = 0; i < 9; i++) {
          vec4 texColor = texture2D(tex, uv + texOffset[i]); // Renamed variable
          float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114)); // Grayscale
          edgeX += kernelX[i] * luminance;
          edgeY += kernelY[i] * luminance;
        }
  
        float edge = sqrt(edgeX * edgeX + edgeY * edgeY);
        return vec3(edge);
      }
  
      void main() {
        vec4 color = texture2D(cameraTexture, vUv);
  
        // Convert to grayscale (cartoon-style black and white)
        float grayscale = dot(color.rgb, vec3(0.299, 0.587, 0.114)); 
  
        // Apply noise for grainy effect
        float grain = rand(vUv * time * 10.0);
        grayscale = grayscale + grain * 0.3;
  
        // Posterization: Strongly limit gray shades to make it cartoony
        float posterizeLevels = 3.0; // Stronger cartoon effect
        grayscale = floor(grayscale * posterizeLevels) / posterizeLevels;
  
        // Apply Sobel edge detection for outlines
        vec3 edges = sobelEdgeDetection(cameraTexture, vUv);
        edges = smoothstep(0.2, 0.8, edges); // Sharpen edges
  
        // Combine grayscale with edges (inverted, for dark outlines)
        vec4 finalColor = vec4(vec3(grayscale) - edges, opacity);
        gl_FragColor = finalColor;
      }
    `,
    transparent: true,
  });

  const frameThickness = 0.3;

  // Create a plane to overlay the camera texture
  const overlayGeometry = new THREE.PlaneGeometry(frameWidth, frameHeight); // Fit the geometry to the frame exactly
  const overlay = new THREE.Mesh(overlayGeometry, cameraMaterial);
  overlay.position.set(0, 0, -frameThickness / 2 + 0.1); // Position on top of the video

  // Add the camera overlay on top of the video
  windowGroup.add(overlay);
}
await createCameraOverlay();

// Microphone input handling
let audioContext, analyser, dataArray;
async function getMicrophoneInput() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  analyser.fftSize = 256; // Size of the Fast Fourier Transform
  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
}

getMicrophoneInput();
// Animate and distort the plane to create the flowing effect
function animate() {
  requestAnimationFrame(animate);

  // Loop through each vertex and apply a sine wave distortion
  const time = Date.now() * 0.001;

  const position = geometry.attributes.position;

  // Get audio data if the microphone is active
  if (analyser) {
    analyser.getByteFrequencyData(dataArray);
    const audioLevel = dataArray.reduce((a, b) => a + b) / dataArray.length; // Average audio level

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      // Use audio level to influence the z value
      const z =
        Math.sin(x * 2 + time) * 0.5 +
        Math.sin(y * 2 + time) * 0.5 +
        audioLevel / 128;
      position.setZ(i, z);
    }
    position.needsUpdate = true;
  }

  // Update the time uniform for the grain effect
  cameraMaterial.uniforms.time.value += 0.5;

  renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
