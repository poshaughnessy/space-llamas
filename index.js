const canvas = document.getElementById('renderCanvas');
const btnConnect = document.getElementById('connectInput');

const engine = new BABYLON.Engine(canvas, true);

let cube,
    guiText;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function createScene() {

    // Create the scene space
    const scene = new BABYLON.Scene(engine);

    scene.ambientColor = new BABYLON.Color3(0, 0, 0);
    scene.clearColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    // Add a camera to the scene and attach it to the canvas
    const camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 5, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Add lights to the scene
    const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 1, 0), scene);
    const light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(0, 1, -1), scene);

    // This is where you create and manipulate meshes
    cube = BABYLON.MeshBuilder.CreateBox('box', 0.5, scene);

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

    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');

    guiText = new BABYLON.GUI.TextBlock();
    guiText.text = 'Space LLamas';
    guiText.color = '#edd615';
    guiText.fontSize = 24;

    gui.addControl(guiText); 

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

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function onOrientation(data) {
    
    const {roll, pitch, yaw} = data.detail;

    //console.log('roll, pitch, yaw', roll, pitch, yaw);

    cube.rotation = new BABYLON.Vector3(degreesToRadians(roll), 
        degreesToRadians(pitch), degreesToRadians(yaw));

    //cube.addRotation(0, -Math.PI/2, 0);
    
}

async function connectInput() {
    try {
        const success = await thingy.connect();

        if (success) {

            console.log('thingy', thingy);

            guiText.text = 'Connected';
            btnConnect.disabled = 'disabled';
            btnConnect.innerText = 'Connected';

            const newLedConfiguration = {
                mode: 'breathe',
                color: 'red',
                intensity: 50,
                delay: 1000,
            };
            
            await thingy.led.write(newLedConfiguration);  

            await thingy.eulerorientation.start();

            await thingy.addEventListener('eulerorientation', onOrientation);

        } else {
            console.log('Unable to connect to Thingy, is Web Bluetooth supported?');
        }

    } catch(error) {
        console.error('Error connecting to Nordic Thingy', error);
    }
}

btnConnect.addEventListener('click', connectInput);
