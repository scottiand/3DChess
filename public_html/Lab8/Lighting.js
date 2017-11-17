/*
    Keyboard controls added by Daniel Koenig and Scotti Anderson. 
    Orr Lab #5
*/

/* 
 * Contains the lighting and material  parameters and sets up 
 * uniform variables for these parameters. 
 * Note: If you want to use different material properties for different objects, you 
 * need to split these parameters into separate lighting and material parameterss (e.g. have a 
 * Lighting.js and a Material,js)  They are kept together here for simplicity.
 */

var uAmbient_product;
var uDiffuse_product;
var uSpecular_product;
var uLight_position;
var uShininess;

function Lighting() {
    // Important:  These light coordinates are in World Coordinates. 
    //             Before sending them to the vertex shader, we need 
    //             to convert to eye coordinates. This is done in the render method. 
    this.light_position = vec4(6, 8, 0, 1);

    // Light colors all set to white at the moment
    this.ambientColor = vec4(1.0,1.0,1.0,1.0);
    this.diffuseColor = vec4(1.0,1.0,1.0,1.0);
    this.specularColor = vec4(1.0,1.0,1.0,1.0);

    this.intensity = 1.0;

    // These are really material properties and belong with each individual object but
    // for now we will lump them in here and they will apply to all objects.
    this.ka = 0.2;
    this.kd = 1.0;
    this.ks = 0.8;
    this.shininess = 50.0;
}

Lighting.prototype.setUp = function () {
    var ambient_product = scale(this.ka * this.intensity, this.ambientColor);
    var diffuse_product = scale(this.kd * this.intensity, this.diffuseColor);
    var specular_product = scale(this.ks * this.intensity, this.specularColor);

    uAmbient_product = gl.getUniformLocation(program, "uAmbient_product")
    gl.uniform4fv(uAmbient_product, ambient_product);

    uDiffuse_product = gl.getUniformLocation(program, "uDiffuse_product")
    gl.uniform4fv(uDiffuse_product, diffuse_product);

    uSpecular_product = gl.getUniformLocation(program, "uSpecular_product")
    gl.uniform4fv(uSpecular_product, specular_product);

    uLight_position = gl.getUniformLocation(program, "uLight_position")
    gl.uniform4fv(uLight_position, this.light_position);

    uShininess = gl.getUniformLocation(program, "uShininess");
    gl.uniform1f(uShininess, this.shininess);
};

Lighting.prototype.keyAction = function (key) {
    alpha = 10;
    switch (key) {     // different keys should be used because these do things in browser
        case 'I':  // move light up
            console.log("move light up");
            this.light_position = add(this.light_position, vec4(0, .5, 0, 0));
            break;
        case 'K':   // move light down
            console.log("move light down");
            this.light_position = subtract(this.light_position, vec4(0, .5, 0, 0));
            break;
        case 'L':  // move light negatively in x-axis  
            console.log("move light negatively in x-axis");
            this.light_position = add(this.light_position, vec4(.5, 0, 0, 0));
            break;
        case 'J':  // move light positively in x-axis 
            console.log("move light  positively in x-axis");
            this.light_position = subtract(this.light_position, vec4(.5, 0, 0, 0));
            break;
        case 'M':  //  move light positively in z-axis
            console.log("move light positively in z-axis");
            this.light_position = add(this.light_position, vec4(0, 0, .5, 0));
            break;
        case 'U':  // move light negatively in z-axis 
            console.log("move light negatively in z-axis");
            this.light_position = subtract(this.light_position, vec4(0, 0, .5, 0));
            break;
        case 'O':  //  rotate light positively around y-axis
            console.log("rotate light positively around y-axis");
            this.light_position = mult(rotateY(alpha), this.light_position);
            break;
        case 'P':  // rotate light negatively around y-axis
            console.log("rotate light negatively around y-axis");
            this.light_position = mult(rotateY(-alpha), this.light_position);
            break;
    }
}

