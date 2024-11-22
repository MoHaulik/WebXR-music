// Opsætning af scene, kamera og renderer
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

let camera = new THREE.PerspectiveCamera(
    70, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.z = 5;

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

// Tilføj kontrol for desktop visning
let controls = new THREE.OrbitControls(camera, renderer.domElement);

// Håndter vinduesændringer
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Opret pulserende cirkler
let circles = [];
let numCircles = 5;

for (let i = 1; i <= numCircles; i++) {
    let geometry = new THREE.CircleGeometry(i * 0.5, 64);
    let material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        wireframe: true
    });
    let circle = new THREE.Mesh(geometry, material);
    circle.rotation.x = Math.PI / 2;
    scene.add(circle);
    circles.push(circle);
}

// Opret partikelsky
let particleCount = 1000;
let particles = new THREE.BufferGeometry();
let positions = [];

for (let i = 0; i < particleCount; i++) {
    positions.push(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
    );
}

particles.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
);

let particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1
});

let particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

// Web Audio API - mikrofoninput
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let analyser = audioContext.createAnalyser();
analyser.fftSize = 256;

navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
    let source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
}).catch(function(err) {
    console.error('Mikrofonadgang blev nægtet.', err);
});

let dataArray = new Uint8Array(analyser.frequencyBinCount);

// Animationssløfe
function animate() {
    renderer.setAnimationLoop(animate);

    // Hent lyddata
    analyser.getByteFrequencyData(dataArray);

    let avgFrequency = dataArray.reduce((a, b) => a + b) / dataArray.length;
    avgFrequency /= 255; // Normaliser til 0-1

    // Opdater cirkler
    circles.forEach((circle, index) => {
        let scale = 1 + avgFrequency * (index + 1);
        circle.scale.set(scale, scale, scale);
        circle.material.color.setHSL(avgFrequency, 1, 0.5);
    });

    // Opdater partikler
    particleSystem.rotation.y += 0.001;
    particleMaterial.size = 0.1 + avgFrequency * 0.5;

    controls.update();
    renderer.render(scene, camera);
}

animate();
