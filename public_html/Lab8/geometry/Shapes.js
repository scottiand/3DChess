/** Build and Draw Primitive Shapes
 * 
 * Global Variables:
 *   gl: the webgl graphics context.
 *   vPosition: shader variable location for vertex position attribute
 *   vColor: shader variable location for color attribute
 *   vNormal: shader variable location for normal attribute 
 */

var Shapes = {};   // set up Shapes namespace

//var defaultMaterial = {
//    ambient: vec3 (.5, .5, 0),
//    diffuse: vec3 (.5, .5, 0),
//    specular: vec3 (0, 0, 0),
//    shininess: 1
//};

Shapes.cube = new Cube();  
Shapes.axis = new Axis();
Shapes.cylinder = new Cylinder(60);
Shapes.disk = new Disk(60);
Shapes.cone = new Cone(60);
Shapes.train = new Train();
Shapes.pawn = new DaeModel();


Shapes.initShapes = function () {
    Shapes.initBuffers(Shapes.cube);
    Shapes.initBuffers(Shapes.cylinder);
    Shapes.initBuffers(Shapes.disk);
    Shapes.initBuffers(Shapes.cone);
    Shapes.pawn.grab("Models/CenteredPawn.dae", function (dae) {

        for (var i in dae.geometries) {
            for (var j = 0; j < dae.geometries[i].length; j++) {

                Shapes.initBuffers (dae.geometries[i][j]); // Initialize GL buffers.
            }
        }
        dae.ready = true; // Set ready flag, so we know we can draw this now.
        render (); // Redraw.
    },null,true);
   // Shapes.pawn.setDefaultMaterial(defaultMaterial);
//    Shapes.axis.initBuffer();
};


Shapes.initBuffers = function (primitive) {

    // SET UP ARRAY BUFFER FOR VERTICES 
    ////////////////////////////////////////////////////////////
    primitive.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, primitive.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(primitive.vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null); // done with this buffer


    // SET UP ARRAY BUFFER FOR VERTEX COLORS 
    ////////////////////////////////////////////////////////////
    //primitive.colorBuffer = gl.createBuffer();
    //gl.bindBuffer(gl.ARRAY_BUFFER, primitive.colorBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, flatten(primitive.colors), gl.STATIC_DRAW);
    //gl.bindBuffer(gl.ARRAY_BUFFER, null); // done with this buffer

    // SET UP ARRAY BUFFER FOR VERTEX NORMALS 
    ////////////////////////////////////////////////////////////
    primitive.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, primitive.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(primitive.normals), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null); // done with this buffer

    // SET UP ARRAY BUFFER FOR VERTEX TEXCOORDS 
    ////////////////////////////////////////////////////////////
    //primitive.texBuffer = gl.createBuffer();
    //gl.bindBuffer(gl.ARRAY_BUFFER, primitive.texBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, flatten(primitive.texCoords), gl.STATIC_DRAW);
    //gl.bindBuffer(gl.ARRAY_BUFFER, null); // done with this buffer

};

Shapes.drawPrimitive = function (primitive) {

    gl.bindBuffer(gl.ARRAY_BUFFER, primitive.vertexBuffer);
    gl.enableVertexAttribArray(vPosition);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

    //gl.bindBuffer(gl.ARRAY_BUFFER, primitive.colorBuffer);
    //gl.enableVertexAttribArray(vColor);
    //gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, primitive.normalBuffer);
    gl.enableVertexAttribArray(vNormal);
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    
    //gl.bindBuffer(gl.ARRAY_BUFFER, primitive.texBuffer);
    //gl.enableVertexAttribArray(vTexCoords);
    //gl.vertexAttribPointer(vTexCoords, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, primitive.numVertices);

    gl.disableVertexAttribArray(vPosition);
    //gl.disableVertexAttribArray(vColor);
    gl.disableVertexAttribArray(vNormal);
    //gl.disableVertexAttribArray(vTexCoords);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};


