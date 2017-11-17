/* 
 * Ariel Todoki and Sophia Anderson (worked together on Disk)
 * Lab #2
 * Due: September 13, 2017
 */
/*
    Normals code added by Daniel Koenig and Scotti Anderson
    Orr Lab #5
*/

///// DISK DEFINTION
/////
///// Disk is defined to be centered at the origin of the coordinate reference system. 
///// Disk size is assumed to be r=1, center (0,0,0).

///// Disk is lying in the XY plane
///// slice variable indicates the number of "pizza slices" for the cylinder faces

///// Always use the Right Hand Rule to generate vertex sequence. We want outward facing normals.

//x is user input for the number of slices
function Disk(x) {
    var slice = x;
    
    this.name = "disk";

    this.numTriangles = slice;
    this.numVertices = 3*this.numTriangles;
    this.radius = 1;

    this.vertices = [];
    this.colors = [];
    this.normals = [];
    this.texCoords = [];
    
    //Declare angle per slice in radians
    var angle = (2*Math.PI)/this.numTriangles;
    
    //Push all vertices and colors to corresponding arrays
    for (var i = 0; i < this.numTriangles; i++){
        
        //Disk triangle vertices added to vertices array
        this.vertices.push(vec4(0,0,0,1));
        this.vertices.push(vec4(Math.cos(angle*i)*this.radius,Math.sin(angle*i)*this.radius, 0,1));
        this.vertices.push(vec4(Math.cos(angle*(i+1))*this.radius,Math.sin(angle*(i+1))*this.radius, 0,1));
        
        //Disk colors added to colors array
        this.colors.push(vec4(1.0, 0.0, 1.0, 1.0)); //magenta
        this.colors.push(vec4(1.0, 1.0, 1.0, 1.0)); //white
        this.colors.push(vec4(1.0, 0.0, 0.0, 1.0)); //red

        //Disk normals added to normals array. 
        this.normals.push(vec4(0, 0, 1, 0));
        this.normals.push(vec4(0, 0, 1, 0));
        this.normals.push(vec4(0, 0, 1, 0));
        
        // Disk texCoords added to texCoords array
        this.texCoords.push(vec2(0.5,0.5));
        this.texCoords.push(vec2(0.5+(Math.cos(angle*i)*0.5),0.5+(Math.sin(angle*i)*0.5)));
        this.texCoords.push(vec2(0.5+(Math.cos(angle*(i+1))*0.5),0.5+(Math.sin(angle*(i+1))*0.5)));
    }
}

