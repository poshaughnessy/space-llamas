var canvas = document.getElementById('renderCanvas');

var engine = new BABYLON.Engine(canvas, true);

var createScene = function () {

    // Create the scene space
    var scene = new BABYLON.Scene(engine);

    scene.ambientColor = new BABYLON.Color3(0, 0, 0);
    scene.clearColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    // Add a camera to the scene and attach it to the canvas
    var camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 2, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Add lights to the scene
    var light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 1, 0), scene);
    var light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(0, 1, -1), scene);

    // This is where you create and manipulate meshes
    var sphere = BABYLON.MeshBuilder.CreateSphere('sphere', {diameter: 0.5}, scene);

    /*
    var spaceScale = 10.0;
    var space = BABYLON.Mesh.CreateCylinder("space", 10 * spaceScale, 0, 6 * spaceScale, 20, 20, scene);

    // Set the sky background
    var starfieldPT = new BABYLON.StarfieldProceduralTexture("starfieldPT", 512, scene);
    var starfieldMaterial = new BABYLON.StandardMaterial("starfield", scene);
    starfieldMaterial.diffuseTexture = starfieldPT;
    starfieldMaterial.diffuseTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    starfieldMaterial.backFaceCulling = false;
    starfieldPT.beta = 0.1;

    space.material = starfieldMaterial;
    */

    var gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    var text1 = new BABYLON.GUI.TextBlock();
    text1.text = "Space LLamas";
    text1.color = "#edd615";
    text1.fontSize = 24;

    gui.addControl(text1); 

    return scene;

};

var scene = createScene();

engine.runRenderLoop(function () {
    scene.render();
});


window.addEventListener('resize', function () {
    engine.resize();
});
