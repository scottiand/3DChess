/* 
 * Ariel Todoki and Sophia Anderson (Sophia independently wrote Cone.js)
 * Lab #2
 * Due: September 13, 2017
 */
/*
    Normals code added by Daniel Koenig and Scotti Anderson
    Orr Lab #5
*/

//x is user input for the number of slices
function Cone(x) {
    var N = x;

    this.name = "Cone"; //shape name

    this.numTriangles = N * 2; // has twice the triangles of a disk
    this.numVertices = this.numTriangles * 3; //three verticies per triangle

    this.vertices = [];
    this.colors = [];
    this.normals = [];
    this.texCoords = [];

    for (var i = 0; i < N; i++)
    {
        var angle = (2 * Math.PI) / N; //angle of the triangle
        var height = 1; // height of the cone
        var radius = 1;
        
        //creating the verticies for the center, tip, and the varying triangle sides
        var center = vec4(0, 0, 0, 1.0);
        var point1 = vec4(Math.cos(i * angle), 0, Math.sin(i * angle), 1.0);
        var point2 = vec4(Math.cos((i + 1) * angle), 0, Math.sin((i + 1) * angle), 1.0);
        var tip = vec4(0, height, 0, 1.0);

        //Calculate normal for each face by making a vector whose x & z direction is oriented towards point1's x & z 
        //and whose y direction is oriented up at the reciprocal of the cone's side: 
        var faceNormal = normalize(vec4(point1[0], radius / height, point1[2], 0));

        //pushing all verticies for triangle on bottom of cone
        this.vertices.push(center);
        this.vertices.push(point1);
        this.vertices.push(point2);

        ///pushing all verticies for the triangle going to tip
        this.vertices.push(tip);
        this.vertices.push(point1);
        this.vertices.push(point2);

        //pushing colors for bottom of cone
        this.colors.push(vec4(1.0, 0, 0, 1.0));
        this.colors.push(vec4(1, .5, 0, 1.0));
        this.colors.push(vec4(1.0, 0, .5, 1.0));
        
        //pushing colors for side of cone
        this.colors.push(vec4(1.0, 0, 0, 1.0));
        this.colors.push(vec4(1, .5, 0, 1.0));
        this.colors.push(vec4(1.0, 0, .5, 1.0));

        //Push normals for bottom of cone: 
        this.normals.push(vec4(0, -1, 0, 0));
        this.normals.push(vec4(0, -1, 0, 0));
        this.normals.push(vec4(0, -1, 0, 0));

        //Push normals for side of cone: 
        this.normals.push(faceNormal);
        this.normals.push(faceNormal);
        this.normals.push(faceNormal);
        
        //push texCoords for bottom of cone
        this.texCoords.push(vec2(0.5,0.5));
        this.texCoords.push(vec2(0.5+(Math.cos(angle*i)*0.5),0.5+(Math.sin(angle*i)*0.5)));
        this.texCoords.push(vec2(0.5+(Math.cos(angle*(i+1))*0.5),0.5+(Math.sin(angle*(i+1))*0.5)));
        
        //push texCoords for sides of cone
        this.texCoords.push(vec2(0.5,0.5));
        this.texCoords.push(vec2(0.5+(Math.cos(angle*i)*0.5),0.5+(Math.sin(angle*i)*0.5)));
        this.texCoords.push(vec2(0.5+(Math.cos(angle*(i+1))*0.5),0.5+(Math.sin(angle*(i+1))*0.5)));
    }
}


