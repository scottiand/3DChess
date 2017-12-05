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
var uModel_viewColor;
var uProjectionColor;
var uTexture;  //  shader uniform variable for texture
var uColorMode;   // shader uniform variable for color mode
var lighting;     // lighting object
var program;      // program object for WebGL
var programColor; //program object for our color shader
var pickingColor;
var vColorPos;

var shaderCheck;

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
    board.moveCamera();
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
    programColor = initShaders(gl, "vertexShader-Color", "fragmentShader-Color");
    gl.useProgram(program);
    shaderCheck = true;

    lighting = new Lighting();
    lighting.setUp();

    // get handles for shader attribute variables. 
    // We will need these in setting up buffers.
    vPosition = gl.getAttribLocation(program, "vPosition");
    vColorPos = gl.getAttribLocation(programColor, "vColorPos");

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

    pickingColor = gl.getUniformLocation(programColor,"pickingColor");
    uModel_viewColor = gl.getUniformLocation(programColor, "uModel_viewColor");
    uProjectionColor = gl.getUniformLocation(programColor, "uProjectionColor");



}

function render() {

    updateHTML();

    gl.useProgram(program);
    shaderCheck = true;
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var projMat = camera.calcProjectionMat();   // Projection matrix
    gl.uniformMatrix4fv(uProjection, false, flatten(projMat));

    var viewMat = camera.calcViewMat();   // View matrix

    stack.clear();
    stack.multiply(viewMat);

    //transform the light's position into CCS from WCS, then set the uniform lighting variable. 
    gl.uniform4fv(uLight_position, mult(viewMat, lighting.light_position));

    stack.clear(); //reclear stack because of some weird stack pushing issue in train.js
    stack.multiply(viewMat);
    gl.uniform1f(uColorMode,1);
    board.draw();//chessboard

}

function updateHTML(){
    if (board.whiteTurn) {
        document.getElementById("turnMarker").innerText = "White Turn";
    } else {
        document.getElementById("turnMarker").innerText = "Black Turn";
    }
    if (board.isCheckmate) {
        document.getElementById("checkMarker").innerText = "Checkmate!";
    } else {
        if (board.isInCheck(board.whiteTurn)) {
            document.getElementById("checkMarker").innerText = "Check!";
        } else {
            document.getElementById("checkMarker").innerText = "";
        }
    }
}

function newGame () {
    board = new Board();
    render();
}

function renderColor () {
    gl.useProgram(programColor);
    shaderCheck = false;
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var projMat = camera.calcProjectionMat();   // Projection matrix
    gl.uniformMatrix4fv(uProjectionColor, false, flatten(projMat));

    var viewMat = camera.calcViewMat();   // View matrix

    stack.clear();
    stack.multiply(viewMat);

    stack.clear(); //reclear stack because of some weird stack pushing issue in train.js
    stack.multiply(viewMat);

    board.drawColor();//chessboard

}

