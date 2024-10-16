import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

//Const options
const options = {
    selection: "FACE"
}

// Setup the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x222230);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Create a new scene
const scene = new THREE.Scene();

// Setup scene lighting
const light = new THREE.DirectionalLight();
light.intensity = 2;
light.position.set(2, 5, 10);
light.castShadow = true;
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.1));

// Setup camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(-5, 5, 12);
camera.layers.enable(1);
controls.target.set(-1, 2, 0);
controls.update();

// Render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// ========= END SCENE SETUP =========

const floorGeometry = new THREE.PlaneGeometry(25, 20);
const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2);
const material = new THREE.MeshLambertMaterial({
    vertexColors: true
});

let colors = [];

for (let i = 0; i < boxGeometry.attributes.position.count; i++) {
    colors.push(1, 1, 1); // Color inicial (blanco) para cada vértice
}
boxGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

colors = [];
for (let i = 0; i < cylinderGeometry.attributes.position.count; i++) {
    colors.push(1, 1, 1); // Color inicial (blanco) para cada vértice
}
cylinderGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));


const floorMesh = new THREE.Mesh(
    floorGeometry,
    new THREE.MeshLambertMaterial({ color: 0xffffff })
);
floorMesh.rotation.x = - Math.PI / 2.0;
floorMesh.name = 'Floor';
floorMesh.receiveShadow = true;
scene.add(floorMesh);

function createMesh(geometry, material, x, y, z, name, layer) {
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.position.set(x, y, z);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.layers.set(layer);
    return mesh;
}

const cylinders = new THREE.Group();
cylinders.add(createMesh(cylinderGeometry, material, 3, 1, 0, 'Cylinder A', 0));
cylinders.add(createMesh(cylinderGeometry, material, 4.2, 1, 0, 'Cylinder B', 0))
cylinders.add(createMesh(cylinderGeometry, material, 3.6, 3, 0, 'Cylinder C', 0));
scene.add(cylinders);

const boxes = new THREE.Group();
boxes.add(createMesh(boxGeometry, material, -1, 1, 0, 'Box A', 0));
boxes.add(createMesh(boxGeometry, material, -4, 1, 0, 'Box B', 0))
boxes.add(createMesh(boxGeometry, material, -2.5, 3, 0, 'Box C', 0));
scene.add(boxes);

animate();

// ========= END SCENE SETUP =========

const raycaster = new THREE.Raycaster();

document.addEventListener('mousedown', onMouseDown);

function onMouseDown(event) {
    const coords = new THREE.Vector2(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -((event.clientY / renderer.domElement.clientHeight) * 2 - 1),
    );

    raycaster.setFromCamera(coords, camera);

    const intersections = raycaster.intersectObjects(scene.children, true);
    if (intersections.length > 0) {

        const newColor = new THREE.Color(Math.random(), Math.random(), Math.random());

        const intersection = intersections[0];
        console.log(intersection.face);
        const selectedObject = intersections[0].object;

        console.log(`${selectedObject.name} was clicked!`);





        if (options.selection === "OBJ") {
            changeObjColor(selectedObject, newColor);
        } else {
            changeFaceColor(selectedObject, intersection.face, newColor);
        }

    }
}

function getAdjacentFaceIndexes(selectedFace, indices) {


    // Los tres vértices del triángulo seleccionado
    const selectedVertices = [selectedFace.a, selectedFace.b, selectedFace.c];

    // Buscar los triángulos adyacentes
    for (let i = 0; i < indices.length; i += 3) {
        const currentFaceI = [indices[i], indices[i + 1], indices[i + 2]];

        // Contar cuántos vértices comparte el triángulo actual con el triángulo seleccionado
        const sharedVertices = currentFaceI.filter(vertex => selectedVertices.includes(vertex));

        // Si comparten dos vértices, es el triángulo adyacente
        if (sharedVertices.length === 2) {
            // El triángulo adyacente es el que comparte dos vértices con el seleccionado
            // El tercer vértice será el que no se comparte
            return currentFaceI;
        }
    }

    return null; // No se encontró un triángulo adyacente
}


function changeFaceColor(object, face, newColor) {

    const geometry = object.geometry.clone();

    if (geometry.attributes.color) {
        // Obtener los índices de los vértices de la cara clicada
        const faceIndices = [face.a, face.b, face.c];  // Los índices de los tres vértices de la cara

        //All the vertexs in the face
        const indices = geometry.index.array;

        const adjacentVertexIndex = getAdjacentFaceIndexes(face, indices);

        const vertexIndexes = faceIndices.concat(adjacentVertexIndex);

        // Cambiar el color de los vértices de la cara
        vertexIndexes.forEach(i => {
            geometry.attributes.color.setXYZ(i, newColor.r, newColor.g, newColor.b);
        });

        // Marcar los colores como actualizados
        //geometry.attributes.color.needsUpdate = true;
        object.geometry = geometry;
    } else {
        console.log("La geometría no tiene colores por vértice.");
    }

}

function changeObjColor(object, newColor) {
    object.material.color = newColor;
}

document.addEventListener('keydown', (event) => {
    if (event.key === "x") {
        //Select FACES
        options.selection = "FACES"
        console.log(options)

    } else if (event.key === "o") {
        //Select Objects
        options.selection = "OBJ"
    }
});