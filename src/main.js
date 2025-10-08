const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = function () {
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

    // Suelo con textura
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseTexture = new BABYLON.Texture("https://images.unsplash.com/photo-1589496933738-f5c27bc146e3?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", scene);
    ground.material = groundMat;

    // Cubo con material metálico
    const box = BABYLON.MeshBuilder.CreateBox("box", {size: 2}, scene);
    box.position = new BABYLON.Vector3(-4, 1, 0);
    const metalMat = new BABYLON.StandardMaterial("metalMat", scene);
    metalMat.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    metalMat.specularColor = new BABYLON.Color3(1, 1, 1);
    metalMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    box.material = metalMat;

    // Esfera con textura de ladrillo
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2}, scene);
    sphere.position = new BABYLON.Vector3(0, 1, 0);
    const brickMat = new BABYLON.StandardMaterial("brickMat", scene);
    brickMat.diffuseTexture = new BABYLON.Texture("https://img.freepik.com/free-photo/background-made-from-bricks_23-2148742475.jpg", scene);
    sphere.material = brickMat;

    // Cilindro con material transparente
    const cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", {height: 3, diameter: 1.5}, scene);
    cylinder.position = new BABYLON.Vector3(4, 1.5, 0);
    const glassMat = new BABYLON.StandardMaterial("glassMat", scene);
    glassMat.diffuseColor = new BABYLON.Color3(0.5, 0.8, 1);
    glassMat.alpha = 0.5;
    cylinder.material = glassMat;

    // Cielo con textura HDR
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size: 1000}, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://assets.babylonjs.com/environments/environmentSpecular.env", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    // Árbol: tronco + copa
    const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", {height: 3, diameter: 0.5}, scene);
    trunk.position = new BABYLON.Vector3(2, 1.5, -3); // Altura centrada en el suelo

    const trunkMat = new BABYLON.StandardMaterial("trunkMat", scene);
    trunkMat.diffuseTexture = new BABYLON.Texture("https://cdn.pixabay.com/photo/2016/03/27/21/16/wood-1283720_1280.jpg", scene);
    trunk.material = trunkMat;

    const foliage = BABYLON.MeshBuilder.CreateSphere("foliage", {diameter: 2}, scene);
    foliage.position = new BABYLON.Vector3(2, 3.5, -3); // Encima del tronco

    const foliageMat = new BABYLON.StandardMaterial("foliageMat", scene);
    foliageMat.diffuseTexture = new BABYLON.Texture("https://cdn.pixabay.com/photo/2016/04/01/09/12/leaves-1303794_1280.jpg", scene);
    foliage.material = foliageMat;


    return scene;
};

const scene = createScene();
engine.runRenderLoop(() => {
    scene.render();
});
window.addEventListener("resize", () => {
    engine.resize();
});

export {};
