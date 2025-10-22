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

    // Startup diagnostic: log Havok availability
    try {
        console.log('main.js: startup - window.havokInstance:', !!window.havokInstance, 'window.HK:', !!window.HK, 'BABYLON.HavokPlugin:', typeof BABYLON.HavokPlugin === 'function');
    } catch (e) {
        console.warn('main.js: unable to read Havok globals during startup check:', e);
    }

    // Cámara inicial: FollowCamera configurada desde el inicio. Asignaremos el lockedTarget cuando cargue el playerRoot.
    const camera = new BABYLON.FollowCamera("camera", new BABYLON.Vector3(0, 3, -10), scene);
    camera.heightOffset = 10.0;
    camera.radius = 10.0;
    camera.rotationOffset = 0.2; // rotación alrededor del objetivo
    camera.cameraAcceleration = 0.05;
    camera.maxCameraSpeed = 20;

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

    // Cargar Yeti local y crear un TransformNode raíz para controlar movimiento/rotación
    let player = null; // el mesh principal (si se necesita)
    let playerRoot = null; // TransformNode que moveremos
    // Collider físico que representará al jugador (mesh dinámico con impostor)
    let playerCollider = null;
    try {
        const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "assets/model/", "Yeti.gltf", scene);
        if (result && result.meshes && result.meshes.length) {
            // Crear un nodo raíz vacío en la escena
            playerRoot = new BABYLON.TransformNode("playerRoot", scene);

            // Parentar todos los meshes importados al root y ajustar transformaciones relativas
            result.meshes.forEach((m) => {
                m.parent = playerRoot;
            });

            // Opcional: escoger un mesh representativo como referencia
            player = result.meshes[0];
            playerRoot.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
            playerRoot.position = new BABYLON.Vector3(0, 0, 5);
            console.log("Yeti cargado y parentado a playerRoot desde assets/model/Yeti.gltf");

            // Ya cargado el playerRoot; configuramos la cámara FollowCamera para que lo siga.
            console.log("Yeti cargado y listo — la cámara seguirá al jugador cuando se mueva.");
            // Asignar lockedTarget y ajustar parámetros
            try {
                camera.lockedTarget = playerRoot;
                camera.radius = 15.0;
                camera.heightOffset = 7.0;
                camera.cameraAcceleration = 0.05;
                camera.maxCameraSpeed = 20;
            } catch (e) {
                console.warn('No se pudo asignar lockedTarget a la cámara:', e);
            }
            // controller.root se asigna de forma segura en el bucle de render cuando controller exista
        }
    } catch (err) {
        console.error("No se pudo cargar el modelo Yeti desde assets/model/Yeti.gltf:", err);
    }

    // ----------------- Physics setup (refactored to match working example) -----------------
    // Usamos la versión simple: asumimos que la build ya provee BABYLON.HavokPlugin en el entorno
    let playerAgg = null;
    try {
        const hk = new BABYLON.HavokPlugin();
        scene.enablePhysics(new BABYLON.Vector3(0, -1, 0), hk);

        // Agregados físicos para objetos estáticos
        const sphereAgg = new BABYLON.PhysicsAggregate(sphere, BABYLON.PhysicsShapeType.SPHERE, { mass: 1 }, scene);
        const groundAgg = new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, { mass: 0 }, scene);
        const boxAgg = new BABYLON.PhysicsAggregate(box, BABYLON.PhysicsShapeType.BOX, { mass: 0 }, scene);
        const trunkAgg = new BABYLON.PhysicsAggregate(trunk, BABYLON.PhysicsShapeType.BOX, { mass: 0 }, scene);
        const foliageAgg = new BABYLON.PhysicsAggregate(foliage, BABYLON.PhysicsShapeType.SPHERE, { mass: 0 }, scene);

    // Crear el collider del jugador como aggregate dinámico si el modelo ya existe
        if (playerRoot) {
            playerCollider = BABYLON.MeshBuilder.CreateBox('playerCollider', { height: 2, width: 1, depth: 1 }, scene);
            playerCollider.isVisible = false;
            playerCollider.position = playerRoot.position.clone();
            playerAgg = new BABYLON.PhysicsAggregate(playerCollider, BABYLON.PhysicsShapeType.BOX, { mass: 1 }, scene);
            playerCollider._physicsAggregate = playerAgg;
            // Parent the visual root to the physical collider so the Yeti follows the physics body (matches example)
            try {
                playerRoot.parent = playerCollider;
                console.log('playerCollider and playerAgg created; playerRoot parented to collider');
            } catch (e) {
                console.warn('Could not parent playerRoot to playerCollider:', e);
            }
        }

        // Debug: log aggregates/masks if available
        try {
            console.log('Aggregates created: groundAgg.shape?', !!groundAgg.shape, 'boxAgg.shape?', !!boxAgg.shape, 'sphereAgg.shape?', !!sphereAgg.shape, 'playerAgg?', !!playerAgg);
        } catch (e) { /* ignore */ }

        // Filtros de colisión: definimos grupos claros y máscaras para que el player colisione con box, sphere y tree
        const FILTER_PLAYER = 1;
        const FILTER_GROUND = 2;
        const FILTER_OBSTACLE = 4;

        if (groundAgg.shape) {
            groundAgg.shape.filterMembershipMask = FILTER_GROUND;
            groundAgg.shape.filterCollideMask = FILTER_PLAYER | FILTER_OBSTACLE;
        }
        if (boxAgg.shape) {
            boxAgg.shape.filterMembershipMask = FILTER_OBSTACLE;
            boxAgg.shape.filterCollideMask = FILTER_PLAYER | FILTER_GROUND;
        }
        if (sphereAgg.shape) {
            sphereAgg.shape.filterMembershipMask = FILTER_OBSTACLE;
            sphereAgg.shape.filterCollideMask = FILTER_PLAYER | FILTER_GROUND;
        }
        if (trunkAgg.shape) {
            trunkAgg.shape.filterMembershipMask = FILTER_OBSTACLE;
            trunkAgg.shape.filterCollideMask = FILTER_PLAYER | FILTER_GROUND;
        }
        if (foliageAgg.shape) {
            foliageAgg.shape.filterMembershipMask = FILTER_OBSTACLE;
            foliageAgg.shape.filterCollideMask = FILTER_PLAYER | FILTER_GROUND;
        }

        if (playerAgg && playerAgg.shape) {
            playerAgg.shape.filterMembershipMask = FILTER_PLAYER;
            playerAgg.shape.filterCollideMask = FILTER_GROUND | FILTER_OBSTACLE;
            console.log('Collision masks set: playerAgg:', playerAgg.shape.filterMembershipMask, playerAgg.shape.filterCollideMask);
        }

    } catch (e) {
        console.warn('No se pudo inicializar Havok de forma simple, manteniendo comportamiento previo:', e);
    }

    // --- Movimiento WASD (más cercano al ejemplo funcional usando fuerzas) ---
    const inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, evt => inputMap[evt.sourceEvent.key.toLowerCase()] = true));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, evt => inputMap[evt.sourceEvent.key.toLowerCase()] = false));

    scene.onBeforeRenderObservable.add(() => {
        const forceMagnitude = 2;
        const direction = new BABYLON.Vector3(0, 0, 0);

        if (inputMap['w']) direction.z -= 1;
        if (inputMap['s']) direction.z += 1;
        if (inputMap['a']) direction.x -= 1;
        if (inputMap['d']) direction.x += 1;

        if (!direction.equals(BABYLON.Vector3.Zero())) {
            console.log('Input direction detected:', direction.asArray ? direction.asArray() : direction);
            direction.normalize().scaleInPlace(forceMagnitude);
            // Preferir usar el aggregate del jugador (Havok) si existe
            if (typeof playerAgg !== 'undefined' && playerAgg && playerAgg.body) {
                try {
                    // Obtener centro del cuerpo
                    let center = null;
                    if (typeof playerAgg.body.getObjectCenterWorld === 'function') {
                        center = playerAgg.body.getObjectCenterWorld();
                    } else if (typeof playerAgg.body.getObjectCenterWorldToRef === 'function') {
                        const tmp = new BABYLON.Vector3(0, 0, 0);
                        playerAgg.body.getObjectCenterWorldToRef(tmp);
                        center = { x: tmp.x, y: tmp.y, z: tmp.z };
                    }
                    if (center && typeof playerAgg.body.applyForce === 'function') {
                        playerAgg.body.applyForce(direction, center);
                        console.log('Applied applyForce on playerAgg.body at', center, 'force:', direction);
                    } else if (center && typeof playerAgg.body.applyImpulse === 'function') {
                        playerAgg.body.applyImpulse(direction, center);
                        console.log('Applied applyImpulse on playerAgg.body at', center, 'impulse:', direction);
                    } else {
                        console.warn('No force/impulse method found on playerAgg.body (center):', center);
                    }
                } catch (e) {
                    console.warn('Error aplicando fuerza al aggregate del jugador:', e);
                }
            } else if (playerCollider && playerCollider.physicsImpostor) {
                // Fallback a PhysicsImpostor (Cannon)
                try {
                    playerCollider.physicsImpostor.applyForce(direction, playerCollider.getAbsolutePosition());
                    console.log('Applied applyForce on physicsImpostor at', playerCollider.getAbsolutePosition(), 'force:', direction);
                } catch (e) { /* ignore */ }
            } else if (playerCollider) {
                // Fallback simple: mover ligeramente la posición
                playerCollider.position.addInPlace(direction.scale(0.01));
                console.log('No physics engine available; moved collider position directly');
            }
        }
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
