import * as THREE from "three";
//import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene : THREE.Scene = new THREE.Scene();
const camera : THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

const renderer : THREE.WebGLRenderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const geometry : THREE.SphereGeometry = new THREE.SphereGeometry(32, 64, 32);
const textureLoader : THREE.TextureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(
    "../earth_atmos_2048.jpg",
    function () {
        console.log("Loaded Successfully");
    },
    undefined,
    function (err) {
        console.error("An error occurred", err);
    });
const material : THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
    map: texture,
});
const mesh : THREE.Mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const light = new THREE.PointLight(0xffffff, 10000);
light.position.set(50, 50, 50);
scene.add(light);

camera.position.z = 64;

// mouse control
let isDragging = false;
let previousMousePosition = { x : 0, y : 0 };

document.addEventListener("mousedown", function(event) {
    isDragging = true;
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
    };
});

document.addEventListener("mousemove", function(event) {
    if (!isDragging) return;

    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;

    let modifier = 1;
    if (mesh.rotation.x > Math.PI || mesh.rotation.x < -Math.PI) {
        modifier = -1;
    }

    mesh.rotation.x += deltaY * 0.005 * modifier;
    mesh.rotation.y += deltaX * 0.005;

    console.log("Mouse Rotation: ", mesh.rotation.x);

    previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
    };
});

document.addEventListener("mouseup", function() {
    isDragging = false;
});

// get latitute and longitude
const raycaster : THREE.Raycaster = new THREE.Raycaster();
const mouse : THREE.Vector2 = new THREE.Vector2();
document.addEventListener("click", (event) => {
    // convert screen coordinates to NDC
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (event.clientY / window.innerHeight) * 2 - 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(mesh);

    if (intersects.length > 0 && intersects[0].uv) {
        const uv : THREE.Vector2 = intersects[0].uv;
        const lon = (0.5 - uv.x) * 360; // Convert U to longitude
        const lat = (0.5 - uv.y) * 180; // Convert V to latitude 
        console.log(`Clicked at Latitude: ${lat.toFixed(2)}, Longitude: ${lon.toFixed(2)}`)
    }
});

// Create marker (small red sphere)
const markerGeometry = new THREE.SphereGeometry(1, 16, 16);
const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const marker = new THREE.Mesh(markerGeometry, markerMaterial);
mesh.add(marker);

// Function to convert lat/lon to 3D position
function latLonToPosition(lat: number, lon: number, radius: number) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const vec : THREE.Vector3 = new THREE.Vector3(
        (radius + 0.5) * Math.sin(phi) * Math.cos(theta),
        (radius + 0.5) * Math.cos(phi),
        (radius + 0.5) * Math.sin(phi) * Math.sin(theta)
    );
    console.log(vec);
    return vec;
}

// Function to update marker position
function updateMarker(lat: number, lon: number) {
    const pos = latLonToPosition(lat, lon, 32);
    marker.position.set(pos.x, pos.y, pos.z);
    marker.lookAt(mesh.position);
}

// Add input fields
const inputDiv = document.createElement("div");
inputDiv.style.position = "absolute";
inputDiv.style.top = "10px";
inputDiv.style.left = "10px";
inputDiv.style.color = "white";
inputDiv.innerHTML = `
    <input type="number" id="latInput" placeholder="Latitude (-90 to 90)" step="0.01">
    <input type="number" id="lonInput" placeholder="Longitude (-180 to 180)" step="0.01">
    <button id="setMarker">Set Marker</button>
`;
document.body.appendChild(inputDiv);

// Handle input event
document.getElementById("setMarker")!.addEventListener("click", () => {
    const lat = parseFloat((document.getElementById("latInput") as HTMLInputElement).value);
    const lon = parseFloat((document.getElementById("lonInput") as HTMLInputElement).value);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        updateMarker(lat, lon);
    } else {
        alert("Please enter valid latitude and longitude values!");
    }
});


function animate() {
    renderer.render(scene, camera);
    //mesh.rotation.y += 0.01;
}

renderer.setAnimationLoop(animate);

//main()
