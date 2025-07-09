import * as THREE from "three";
import gsap from "gsap";
import GUI from "lil-gui";
import Stats from "three/examples/jsm/libs/stats.module.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import fireflieVertexShader from "./shaders/fireflie/vertex.glsl";
import fireflieFragmentShader from "./shaders/fireflie/fragment.glsl";
import portalVertexShader from "./shaders/portal/vertex.glsl";
import portalFragmentShader from "./shaders/portal/fragment.glsl";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader, GLTFLoader, Timer } from "three/examples/jsm/Addons.js";

/**
 * Set up GUI
 */

const debugObject = {
  clearColor: "#191b1f",
  portalColorStart: "#383838",
  portalColorEnd: "#b4b4fe",
};

const gui = new GUI();

/**
 * Set up stats.js
 */
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

/**
 * Loaders
 */
const loadingBar = document.querySelector(".loading-bar") as HTMLDivElement;

const loadingManager = new THREE.LoadingManager();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader);

const textureLoader = new THREE.TextureLoader(loadingManager);

loadingManager.onProgress = (_, itemsLoaded, itemsTotal) => {
  const progress = itemsLoaded / itemsTotal;

  const loadingAnimation = gsap.to(loadingBar, {
    duration: 0.5,
    scaleX: progress,
    ease: "power2.inOut",
  });

  if (progress === 1) {
    loadingAnimation.eventCallback("onComplete", () => {
      const completedSequence = gsap.timeline();

      completedSequence.to(loadingBar, {
        duration: 0.3,
        delay: 0.3,
        opacity: 0,
        ease: "power2.inOut",
        onComplete: () => {
          loadingBar.style.display = "none";
        },
      });

      completedSequence.to(overlay.material.uniforms.uAlpha, {
        duration: 1,
        value: 0,
        delay: 0.3,
        ease: "linear",
        onComplete: () => {
          overlay.material.dispose();
          scene.remove(overlay);
        },
      });
    });
  }
};

/**
 * Set up scene
 */

const scene = new THREE.Scene();

/**
 * Set up canvas
 */

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

/**
 * Set up debug object
 */

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

/**
 * Camera
 */

// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(8, 8, -8);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;

/**
 * Renderer
 */

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  powerPreference: "high-performance",
  antialias: true,
});
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(debugObject.clearColor);

/**
 * Overlay
 */

const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uAlpha: new THREE.Uniform(1.0),
  },
  vertexShader: `

    void main() {
      gl_Position = vec4(position, 1.0);
  
    }
  `,
  fragmentShader: `
    uniform float uAlpha;

    void main() {
      gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
    }
  `,
  transparent: true,
  // wireframe: true,
});
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);

scene.add(overlay);

/**
 * Models
 */

const testBoxGeometry = new THREE.BoxGeometry(10, 0.5, 10);
const testBoxMaterial = new THREE.MeshBasicMaterial({
  color: debugObject.clearColor,
});
const testBox = new THREE.Mesh(testBoxGeometry, testBoxMaterial);
testBox.position.set(0, -0.25, -0.2);
scene.add(testBox);

const gltf = await gltfLoader.loadAsync("/models/baked/portal.glb");
const texture = textureLoader.load("/models/baked/baking-final.jpg");
texture.flipY = false;
texture.colorSpace = THREE.SRGBColorSpace;

const bakedMesh = ["Plane003"];

const bakedMaterial = new THREE.MeshBasicMaterial({
  map: texture,
});
const pointLightMeshes = ["Cube012", "Cube015"];

const pointLightMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffe5,
});

const portalMeshes = ["Circle"];

const portalMaterial = new THREE.ShaderMaterial({
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,

  uniforms: {
    uTime: new THREE.Uniform(0),
    uColorStart: new THREE.Uniform(new THREE.Color(debugObject.portalColorStart)),
    uColorEnd: new THREE.Uniform(new THREE.Color(debugObject.portalColorEnd)),
  },

  transparent: true,
  side: THREE.DoubleSide,
});

gltf.scene.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    if (bakedMesh.includes(child.name)) {
      child.material = bakedMaterial;
    }

    if (pointLightMeshes.includes(child.name)) {
      child.material = pointLightMaterial;
    }

    if (portalMeshes.includes(child.name)) {
      child.material = portalMaterial;
    }
  }
});

gltf.scene.scale.set(2.5, 2.5, 2.5);
gltf.scene.rotation.y = Math.PI * 0.5;
scene.add(gltf.scene);

/**
 * Fireflies
 */

// Geometry

const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 50;
const firefliesPositions = new Float32Array(firefliesCount * 3);
const firefliesScale = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
  // Random position
  firefliesPositions[i * 3] = (Math.random() - 0.5) * 10;
  firefliesPositions[i * 3 + 1] = Math.random() * 5;
  firefliesPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;

  // Initialize animation progress
  firefliesScale[i] = Math.random();
}

firefliesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(firefliesPositions, 3)
);

firefliesGeometry.setAttribute(
  "aScale",
  new THREE.BufferAttribute(firefliesScale, 1)
);

// Material
const firefliesMaterial = new CustomShaderMaterial<typeof THREE.PointsMaterial>(
  {
    // CSM
    baseMaterial: THREE.PointsMaterial,
    vertexShader: fireflieVertexShader,
    fragmentShader: fireflieFragmentShader,

    uniforms: {
      uTime: new THREE.Uniform(0),
    },

    // PointsMaterial
    size: 0.1,
    sizeAttenuation: true,
    color: 0xffd700,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }
);

// Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/**
 * Tweaks
 */

gui.addColor(debugObject, "clearColor").onChange(() => {
  renderer.setClearColor(debugObject.clearColor);
  testBoxMaterial.color.set(debugObject.clearColor);
});

gui.addColor(debugObject, "portalColorStart").onChange(() => {
  portalMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart);
});

gui.addColor(debugObject, "portalColorEnd").onChange(() => {
  portalMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd);
});

/**
 * Animation loop
 */

const timer = new Timer();

const tick = () => {
  stats.begin();

  timer.update();
  const elapsedTime = timer.getElapsed();
  // const deltaTime = timer.getDelta();

  // update controls to enable damping
  controls.update();

  // animations

  // uniforms
  firefliesMaterial.uniforms.uTime.value = elapsedTime;
  portalMaterial.uniforms.uTime.value = elapsedTime;

  // render
  renderer.render(scene, camera);

  stats.end();

  // request next frame
  window.requestAnimationFrame(tick);
};

tick();

/**
 * Handle window resize
 */

function handleResize() {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

/**
 * Usar el evento 'resize' de visualViewport para móviles
 */

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", handleResize);
} else {
  window.addEventListener("resize", handleResize);
}
