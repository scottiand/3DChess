/* 
 * Ariel Todoki and Sophia Anderson (Ariel independently wrote Cylinder.js)
 * Lab #2
 * Due: September 13, 2017
 */
/*
    Normals code added by Daniel Koenig and Scotti Anderson
    Orr Lab #5
*/

///// CYLINDER DEFINTION
/////
///// Cylinder is defined to be centered at the origin of the coordinate reference system. 
///// Cylinder faces are lying in the XZ plane, Y=-1 and Y=1, radius = 1
///// Cylinder height = 2
///// slice variable indicates the number of "pizza slices" for the cylinder faces

///// Always use the Right Hand Rule to generate vertex sequence. We want outward facing normals.

//x is user input for the number of slices
function Cylinder(x) {
    var slice = x;

    this.name = "cylinder";

    this.numTriangles = slice * 4;
    this.numVertices = this.numTriangles * 3;
    this.radius = 1;

    this.vertices = [];
    this.colors = [];
    this.normals = [];
    this.texCoords = [];
    
    var numTex = 3;
    
    //Declare angle per slice in radians
    var angle = (2 * Math.PI) / slice;
    
    //Push all vertices and colors to corresponding arrays
    for (var i = 0; i < slice; i++) {

        //cylinder bottom face vertices
        var bVertex1 = vec4(Math.cos(angle * i) * this.radius, -1, Math.sin(angle * i) * this.radius, 1);
        var bVertex2 = vec4(Math.cos(angle * (i + 1)) * this.radius, -1, Math.sin(angle * (i + 1)) * this.radius, 1);
        
        this.vertices.push(vec4(0, -1, 0, 1));
        this.vertices.push(bVertex2);
        this.vertices.push(bVertex1);

        this.normals.push(vec4(0, -1, 0, 0));
        this.normals.push(vec4(0, -1, 0, 0));
        this.normals.push(vec4(0, -1, 0, 0));
        
        this.texCoords.push(vec2(0.5,0.5));
        this.texCoords.push(vec2(0.5+(Math.cos(angle*(i+1))*0.5),0.5+(Math.sin(angle*(i+1))*0.5)));
        this.texCoords.push(vec2(0.5+(Math.cos(angle*i)*0.5),0.5+(Math.sin(angle*i)*0.5)));

        //cylinder top face vertices
        var tVertex1= vec4(Math.cos(angle * i) * this.radius, 1, Math.sin(angle * i) * this.radius, 1);
        var tVertex2= vec4(Math.cos(angle * (i + 1)) * this.radius, 1, Math.sin(angle * (i + 1)) * this.radius, 1);
        
        this.vertices.push(vec4(0, 1, 0, 1));
        this.vertices.push(tVertex1);
        this.vertices.push(tVertex2);

        this.normals.push(normalize(vec4(0, 1, 0, 0)));
        this.normals.push(normalize(vec4(0, 1, 0, 0)));
        this.normals.push(normalize(vec4(0, 1, 0, 0)));
        
        this.texCoords.push(vec2(0.5,0.5));
        this.texCoords.push(vec2(0.5+(Math.cos(angle*i)*0.5),0.5+(Math.sin(angle*i)*0.5)));
        this.texCoords.push(vec2(0.5+(Math.cos(angle*(i+1))*0.5),0.5+(Math.sin(angle*(i+1))*0.5)));
        
        // Declare color variables
        var c1 = vec4(1.0, 0.0, 1.0, 1.0); //magenta
        var c2 = vec4(1.0, 1.0, 1.0, 1.0); //white
        var c3 = vec4(1.0, 0.0, 0.0, 1.0); //red
        
        //cylinder face colors (alternating colors)
        if (i % 2 !== 0) {
            for (var n = 0; n < 6; n++) {
                this.colors.push(c1);
            }

        } else {
            for (var n = 0; n < 6; n++) {
                this.colors.push(c2); 
            }
        }

        //cylinder body (top face to bottom face) vertices
        this.vertices.push(tVertex2);
        this.vertices.push(tVertex1);
        this.vertices.push(bVertex1);

        this.normals.push(normalize(vec4(tVertex2[0], 0, tVertex2[2], 0)));
        this.normals.push(normalize(vec4(tVertex1[0], 0, tVertex1[2], 0)));
        this.normals.push(normalize(vec4(bVertex1[0], 0, bVertex1[2], 0)));
        
        this.texCoords.push(vec2((i+1)/slice*numTex,1));
        this.texCoords.push(vec2(i/slice*numTex,1));
        this.texCoords.push(vec2(i/slice*numTex,0));

        //cylinder body (top face to bottom face) colors
        for (var m = 0; m < 3; m++){
            this.colors.push(c2);
        } 

        //cylinder body (bottom face to top face) vertices
        this.vertices.push(bVertex1);
        this.vertices.push(bVertex2);
        this.vertices.push(tVertex2);

        this.normals.push(normalize(vec4(bVertex1[0], 0, bVertex1[2], 0)));
        this.normals.push(normalize(vec4(bVertex2[0], 0, bVertex2[2], 0)));
        this.normals.push(normalize(vec4(tVertex2[0], 0, tVertex2[2], 0)));
        
        this.texCoords.push(vec2((i)/slice*numTex,0));
        this.texCoords.push(vec2((i+1)/slice*numTex,0));
        this.texCoords.push(vec2((i+1)/slice*numTex,1));
        
        //cylinder body (bottom face to top face) colors
        for (var m = 0; m < 3; m++){
            this.colors.push(c3);
        } 
        

    }



}
