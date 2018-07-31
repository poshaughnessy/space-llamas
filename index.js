const canvas = document.getElementById('renderCanvas');

const engine = new BABYLON.Engine(canvas, true);

function createScene() {

    // Create the scene space
    const scene = new BABYLON.Scene(engine);

    scene.ambientColor = new BABYLON.Color3(0, 0, 0);
    scene.clearColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    // Add a camera to the scene and attach it to the canvas
    const camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 2, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Add lights to the scene
    const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 1, 0), scene);
    const light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(0, 1, -1), scene);

    // This is where you create and manipulate meshes
    const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', {diameter: 0.5}, scene);

    /*
    const spaceScale = 10.0;
    const space = BABYLON.Mesh.CreateCylinder("space", 10 * spaceScale, 0, 6 * spaceScale, 20, 20, scene);

    // Set the sky background
    const starfieldPT = new BABYLON.StarfieldProceduralTexture("starfieldPT", 512, scene);
    const starfieldMaterial = new BABYLON.StandardMaterial("starfield", scene);
    starfieldMaterial.diffuseTexture = starfieldPT;
    starfieldMaterial.diffuseTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    starfieldMaterial.backFaceCulling = false;
    starfieldPT.beta = 0.1;

    space.material = starfieldMaterial;
    */

    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    const text1 = new BABYLON.GUI.TextBlock();
    text1.text = "Space LLamas";
    text1.color = "#edd615";
    text1.fontSize = 24;

    gui.addControl(text1); 

    return scene;

};

const scene = createScene();

engine.runRenderLoop(function () {
    scene.render();
});

window.addEventListener('resize', function () {
    engine.resize();
});

// Nordic Thingy input

const thingy = new Thingy({logEnabled: true});

async function connectInput() {
    try {
        const success = await thingy.connect();

        if (success) {

            console.log('thingy', thingy);

            const newLedConfiguration = {
                mode: 'breathe',
                color: 'red',
                intensity: 50,
                delay: 1000,
            }
            
            await thingy.led.write(newLedConfiguration);  

            //await thingy.absoluteorientation.startNotifications();
        } else {
            console.log('Unable to connect to Thingy, is Web Bluetooth supported?');
        }

    } catch(error) {
        console.error('Error connecting to Nordic Thingy', error);
    }
}

const btnConnect = document.getElementById('connectInput');
btnConnect.addEventListener('click', connectInput);
