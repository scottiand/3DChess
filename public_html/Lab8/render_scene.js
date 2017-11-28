// Scotti Anderson

var canvas;       // HTML 5 canvas
var gl;           // webgl graphics context
var vPosition;    // shader variable attrib location for vertices 
var vColor;       // shader variable attrib location for color
var vNormal;      // shader variable attrib location for normal
var vTexCoords;   // shader variable attrib location for texCoord
var uColor;       // shader uniform variable location for color
var uProjection;  //  shader uniform variable for projection matrix
var uModel_view;  //  shader uniform variable for model-view matrix
var uTexture;  //  shader uniform variable for texture
var uColorMode;   // shader uniform variable for color mode
var lighting;     // lighting object
var program;      // program object for WebGL

//var phong;

// Textures
var checkerboard;
var imageTextures;
var adele;
var spots;
var beyonce;
var spotlight;



// Chess Stuff
var board;

var camera = new Camera(); 
var stack = new MatrixStack();

// function modelDownloaded (model) {
//     // The model has finished loading for model "model". We can now load its geometries into our "phong" program:
//     model.loadIntoProgram (phong); // Load this model into our "phong" program.
// }
// function texturesDownloaded (model) {
//     // The textures (which are images) have finished downloading.
//     render (); // Just draw again.
// }

window.onload = function init()
{   
    //set Event Handlers
    setKeyEventHandler();
    setMouseEventHandler();

    
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.309, 0.505, 0.74, 1.0);

    // phong = new PhongProgram (gl, function () {
    //     // Done loading program. Load models now:
    //     Shapes.pawn.grab ("Models/CenteredPawn.dae", modelDownloaded, texturesDownloaded); // Download the model "May".
    // });

    gl.enable(gl.DEPTH_TEST);

    shaderSetup();

    Shapes.initShapes();  // create the primitive and other shapes    
    initTextures();
    board = new Board();
    board.print();
    
    render();
};

function initTextures() {
    checkerboard = new Checkerboard();
    imageTexture = new ImageTexture("textures/test.jpg");
    adele = new ImageTexture("textures/adele.jpg");
    beyonce = new ImageTexture("textures/beyonce512.jpg");
    spots = new Spots(6,20);
    spotlight = new Spots(3,1);
}

/**
 *  Load shaders, attach shaders to program, obtain handles for 
 *  the attribute and uniform variables.
 * @return {undefined}
 */
function shaderSetup() {
    //  Load shaders
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    lighting = new Lighting();
    lighting.setUp();

    // get handles for shader attribute variables. 
    // We will need these in setting up buffers.
    vPosition = gl.getAttribLocation(program, "vPosition");
    vColor = gl.getAttribLocation(program, "vColor"); // we won't use vertex here
    vNormal = gl.getAttribLocation(program, "vNormal"); 
    vTexCoords = gl.getAttribLocation(program, "vTexCoords");
    // colors but we keep it in for possible use later.

   
    // get handles for shader uniform variables: 
    uColor = gl.getUniformLocation(program, "uColor");  // uniform color
    uProjection = gl.getUniformLocation(program, "uProjection"); // projection matrix
    uModel_view = gl.getUniformLocation(program, "uModel_view");  // model-view matrix
    uTexture = gl.getUniformLocation(program, "uTexture");  // texture
    uColorMode = gl.getUniformLocation(program, "uColorMode"); // Color Mode
}

function render()
{
    //var t = new Board();
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var projMat = camera.calcProjectionMat();   // Projection matrix  
    gl.uniformMatrix4fv(uProjection, false, flatten(projMat));
    
    var viewMat = camera.calcViewMat();   // View matrix

    stack.clear();
    stack.multiply(viewMat); 
    
//    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
//    Shapes.axis.draw();

    //transform the light's position into CCS from WCS, then set the uniform lighting variable. 
    gl.uniform4fv(uLight_position, mult(viewMat, lighting.light_position));

    stack.clear(); //reclear stack because of some weird stack pushing issue in train.js
    stack.multiply(viewMat);
    
    stack.push();

    //draw LightCube
    stack.push();
    stack.multiply(translate(lighting.light_position[0], lighting.light_position[1], lighting.light_position[2]));
    stack.multiply(scalem(0.1, 0.1, 0.1));
    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    gl.uniform4fv(uColor, vec4(0, 0, 0, 1));  // set color to black
    Shapes.drawPrimitive(Shapes.cube);

    stack.pop();


        //Chessboard stuff
    stack.push();
    gl.uniform1f(uColorMode,1);
    board.drawBoard();//chessboard
    stack.pop();

    // if (phong && phong.isReady ()) {
    //     phong.use (); // Tell GL to use the 'phong' program now.
    //     phong.setProjection (camera.calcProjectionMat ()); // Send projection matrix to the GPU program "phong".
    //
    //     // Set up lighting:
    //     //phong.setGlobalAmbientIntensity (vec4 (.2, .2, .2, 1)); // Scene-wide ambient light intensity, by RGB (can tweak red separately, for example).
    //
    //     // Light angle/position stuff:
    //     //var angle = parseFloat (document.getElementById ("lightSlider").value) * Math.PI * 2 / 360; // Light 0's angle.
    //    // var lightPosition = vec4 (24 * Math.cos (angle), 10, 24 * Math.sin (angle), 1); // Calculate a vec4 position for the light.
    //    // var lightPositionPrime = mult (viewMat, lightPosition); // Transform light into camera coordinates (required by "phong" program).
    //
    //     //phong.setLightCount (1); // Send light source count (max. is 16, but you can change it in the shader) to the GPU program.
    //
    //     // Send light 0's parameters to the shader (the first argument of each of these tells "phong" to change light 0):
    //   //  phong.setLightPosition (0, lightPositionPrime); // Send light 0's position.
    //     //phong.setLightDiffuse (0, lightColor); // Send light 0's diffuse intensity, by RGB (so you can tweak each channel, R, G, and B, separately if you want).
    //     //phong.setLightSpecular (0, vec3 (.25, .25, .25)); // Send light 0's specular intensity, by RGB.
    //
    //     // Transformations:
    //     var mat = mult (viewMat, rotateX (90), scalem (1, 1, 1)); // Make a modelview matrix.
    //     phong.setModelView (mat); // Send it to the GPU program.
    //
    //     Shapes.pawn.drawInProgram (phong); // Draw the model in the "phong" program!
    //
    //
    // }
}

