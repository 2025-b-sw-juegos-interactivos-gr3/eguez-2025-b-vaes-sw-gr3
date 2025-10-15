const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

// Velocidad del jugador (editable desde otros módulos o la consola)
export let PLAYER_SPEED = 5; // unidades por segundo

// Helper para actualizar la velocidad en tiempo de ejecución
export function setPlayerSpeed(v) {
    PLAYER_SPEED = v;
}

/**
 * Crea la escena, carga recursos y configura la entrada WASD.
 * Retorna { scene, player }.
 */
async function createScene() {
    const scene = new BABYLON.Scene(engine);

    // Cámara
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, 15, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Luces
    const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.6;

    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(5, 10, 5);
    dirLight.intensity = 0.8;

    // Suelo
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseTexture = new BABYLON.Texture(
        "https://images.unsplash.com/photo-1589496933738-f5c27bc146e3?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        scene
    );
    ground.material = groundMat;

    // Cubo metálico
    const box = BABYLON.MeshBuilder.CreateBox("box", { size: 2 }, scene);
    box.position = new BABYLON.Vector3(-4, 1, 0);
    const metalMat = new BABYLON.StandardMaterial("metalMat", scene);
    metalMat.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    metalMat.specularColor = new BABYLON.Color3(1, 1, 1);
    metalMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    box.material = metalMat;

    // Esfera con ladrillo
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2 }, scene);
    sphere.position = new BABYLON.Vector3(0, 1, 0);
    const brickMat = new BABYLON.StandardMaterial("brickMat", scene);
    brickMat.diffuseTexture = new BABYLON.Texture("/assets/textures/brick.jpg", scene);
    sphere.material = brickMat;

    // Cilindro transparente
    const cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", { height: 3, diameter: 1.5 }, scene);
    cylinder.position = new BABYLON.Vector3(4, 1.5, 0);
    const glassMat = new BABYLON.StandardMaterial("glassMat", scene);
    glassMat.diffuseColor = new BABYLON.Color3(0.5, 0.8, 1);
    glassMat.alpha = 0.5;
    cylinder.material = glassMat;

    // Skybox
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://assets.babylonjs.com/environments/environmentSpecular.env", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    // Árbol
    const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", { height: 3, diameter: 0.5 }, scene);
    trunk.position = new BABYLON.Vector3(2, 1.5, -3);
    const trunkMat = new BABYLON.StandardMaterial("trunkMat", scene);
    trunkMat.diffuseTexture = new BABYLON.Texture("/assets/textures/wood.jpg", scene);
    trunk.material = trunkMat;

    const foliage = BABYLON.MeshBuilder.CreateSphere("foliage", { diameter: 2 }, scene);
    foliage.position = new BABYLON.Vector3(2, 3.5, -3);
    const foliageMat = new BABYLON.StandardMaterial("foliageMat", scene);
    foliageMat.diffuseTexture = new BABYLON.Texture("/assets/textures/leaves.jpg", scene);
    foliage.material = foliageMat;

    // Cargar Yeti local
    let player = null;
    try {
        const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "assets/model/", "Yeti.gltf", scene);
        if (result && result.meshes && result.meshes.length) {
            player = result.meshes[0];
            player.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
            player.position = new BABYLON.Vector3(0, 0, 5);
            console.log("Yeti cargado desde assets/model/Yeti.gltf");
        }
    } catch (err) {
        console.error("No se pudo cargar el modelo Yeti desde assets/model/Yeti.gltf:", err);
    }

    // Entrada WASD usando onKeyboardObservable
    const inputMap = {};
    scene.onKeyboardObservable.add((kbInfo) => {
        const key = kbInfo.event.key.toLowerCase();
        if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
            inputMap[key] = true;
        } else if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
            inputMap[key] = false;
        }
    });

    scene.registerBeforeRender(() => {
        if (!player) return;
        const dt = engine.getDeltaTime() / 1000; // segundos

        let forward = 0;
        let right = 0;
        if (inputMap['w']) forward += 1;
        if (inputMap['s']) forward -= 1;
        if (inputMap['a']) right -= 1;
        if (inputMap['d']) right += 1;

        if (forward !== 0 || right !== 0) {
            const dir = new BABYLON.Vector3(right, 0, forward);
            const len = dir.length();
            if (len > 0) {
                dir.scaleInPlace(1 / len);
                const delta = dir.scale(PLAYER_SPEED * dt);
                player.position.addInPlace(delta);
                const yaw = Math.atan2(dir.x, dir.z);
                player.rotation.y = yaw;
            }
        }

        // Mantener cámara apuntando al jugador
        if (player) camera.target = player.position;
    });

    return { scene, player };
}

async function main() {
    const { scene } = await createScene();
    engine.runRenderLoop(() => {
        scene.render();
    });

    window.addEventListener("resize", () => engine.resize());
}

main();

export {};
