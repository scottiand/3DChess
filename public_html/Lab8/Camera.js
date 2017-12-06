/*
Programmed by Daniel Koenig and Ariel Todoki for Lab 4 in Professor Orr's CSS-445 Computer Graphics Course
*/

/**
 * Contains all of the parameters needed for controlling the camera.
 * @return {Camera}
 */
function Camera() {

    this.fov = 60;           // Field-of-view in Y direction angle (in degrees)
    this.zNear = 0.1;        // camera's far plane
    this.zFar = 500;         // camera's near plane

// Camera *initial* location and orientation parameters
    this.eye_start = vec4([0, 5, -25, 1]); // initial camera location (needed for reseting)
    //this.eye_start = vec4([0, 22.373147843792395, 11.849028599265363, 1]);
    this.VPN = vec4([0, 0.1, -1, 0]);  // used to initialize uvn
    this.VUP = vec4([0, 1, 0, 0]);  // used to initialize uvn

// Current camera location and orientation parameters
    this.eye = vec4(this.eye_start);     // camera location
    this.viewRotation;  // rotational part of matrix that transforms between World and Camera coord   

    this.calcUVN();  // initializes viewRotation
}

/**
 * Reset the camera location and orientation
 * @return none
 */
Camera.prototype.reset = function () {
    this.eye = vec4(this.eye_start);
    this.calcUVN();
};

/**
 * Calculate the *initial* viewRotation matrix of camera
 * based on VPN and VUP
 * @return none
 */
Camera.prototype.calcUVN = function () {
    var n = vec4(normalize(this.VPN, true));
    var u_nonNormalized = vec4(cross(this.VUP, n), 0);
    var u = vec4(normalize(u_nonNormalized, true));
    var v_nonNormalized = vec4(cross(n, u), 0);
    var v = vec4(normalize(v_nonNormalized, true));


    this.viewRotation = mat4(u, v, n, vec4(0, 0, 0, 1));
    this.viewRotation.matrix = true;
};

/**
 * Calculate the camera's view matrix given the 
 * current eye and viewRotation.
 * @return view matrix (mat4)
 */
Camera.prototype.calcViewMat = function () {
    //create a translation matrix that holds the negated values of the current eye position. 
    var eyeTranslate = mat4(
        vec4(1, 0, 0, -1 * this.eye[0]),
        vec4(0, 1, 0, -1 * this.eye[1]),
        vec4(0, 0, 1, -1 * this.eye[2]),
        vec4(0, 0, 0, 1));

 
    mv = mult(this.viewRotation, eyeTranslate); //multiply eyeTranslate by viewRotation.
    mv.matrix = true;

    return mv;
};

/** 
 * Calculate the camera's projection matrix. Here we 
 * use a perspective projection.
 * @return the projection matrix
 */
Camera.prototype.calcProjectionMat = function () {
    aspect = canvas.width / canvas.height;
    return perspective(this.fov, aspect, this.zNear, this.zFar);
};

/**
 * Update the camera's eye and viewRotation matrices 
 * based on the user's mouse actions.
 * @return none
 */
Camera.prototype.motion = function () {

    switch (mouseState.action) {
        case mouseState.actionChoice.TUMBLE:  // left mouse button
            // amount of rotation around axes 
            var dy = -0.05 * mouseState.delx;  // angle around y due to mouse drag along x
            var dx = -0.05 * mouseState.dely;  // angle around x due to mouse drag along y

            var ry = rotateY(10 * dy);  // rotation matrix around y
            var rx = rotateX(10 * dx);  // rotation matrix around x

            this.tumble(rx, ry);   
            mouseState.startx = mouseState.x;
            mouseState.starty = mouseState.y;
            break;
        case mouseState.actionChoice.TRACK:  // PAN   - right mouse button
            // var dx = -0.05 * mouseState.delx; // amount to pan along x
            // var dy = 0.05 * mouseState.dely;  // amount to pan along y
            ////scale the change in x by the u-vector to orient change in the camera's current x-axis, 
            //and scale the change in y by the v-vector to orient change in the camera's current y-axis, 
            //then add both changes together and add the resulting vector to the current eye position. 
            // this.eye = add(this.eye, add(scale(dx, this.viewRotation[0]), scale(dy, this.viewRotation[1])));
            // mouseState.startx = mouseState.x;
            // mouseState.starty = mouseState.y;
            break;
        case mouseState.actionChoice.DOLLY:   // middle mouse button
             var dx = 0.05 * mouseState.delx;  // amount to move backward/forward
             var dy = 0.05 * mouseState.dely;
            ////scale the change in X & Y by the n-vector to orient the change in the camera's current z, 
            //then add the result to the current eye position. 
             this.eye = add(this.eye, scale((-dx + -dy), this.viewRotation[2])); //negate dx and dy for more natural movement
             mouseState.startx = mouseState.x;
             mouseState.starty = mouseState.y;
            break;
        default:
            console.log("unknown action: " + mouseState.action);
    }
    render();
};

/**
 * Rotate about the world coordinate system about y (left/right mouse drag) and/or 
 * about a line parallel to the camera's x-axis and going through the WCS origin 
 * (up/down mouse drag).
 * @param {mat4} rx  rotation matrix around x
 * @param {mat4} ry  rotation matrix around y
 * @return none
 */
Camera.prototype.tumble = function (rx, ry) {
    tumblePoint = vec4(0, 0, 0, 1);
    var view = this.calcViewMat();  // current view matrix
    camera_tumblePoint = mult(view, tumblePoint); //tumble point in the CCS. Used for x-axis tumbling. 

    //matrix to tumble around the x-axis. This happens in the CCS. 
    var B = mult(translate(camera_tumblePoint[0], camera_tumblePoint[1], camera_tumblePoint[2]),
        mult(rx, translate(-1 * camera_tumblePoint[0], -1 * camera_tumblePoint[1], -1 * camera_tumblePoint[2])));
    //matrix to tumble around the y-axis. This happens in the WCS. 
    var A = mult(translate(tumblePoint[0], tumblePoint[1], tumblePoint[2]), 
        mult(ry, translate(-1 * tumblePoint[0], -1 * tumblePoint[1], -1 * tumblePoint[2])));
    //create a new view matrix by multiplying B by the product of multiplying A by view. 
    view = mult(B, mult(view, A));

    //create a new viewRotation matrix by extracting the new u, v, and n vectors from the new viewMatrix (view). 
    this.viewRotation = mat4( 
        vec4(view[0][0], view[0][1], view[0][2], 0),
        vec4(view[1][0], view[1][1], view[1][2], 0),
        vec4(view[2][0], view[2][1], view[2][2], 0),
        vec4(0, 0, 0, 1)
    );

        
    var rotInverse = transpose(this.viewRotation); //transpose viewRotation to get its inverse
    //multiply view by rotInverse to get a matrix with the negated eye coords in the last column.
    var eye_negated = mult(rotInverse, view);
    //pull out the eye coords from eye_negated and negate them to make them positive.
    this.eye = vec4(-1 * eye_negated[0][3], -1 * eye_negated[1][3], -1 * eye_negated[2][3], 1);     
};

Camera.prototype.keyAction = function (key) {
    var alpha = 180.0;  // used to control the amount of a turn during the flythrough
   // switch (key) {     // different keys should be used because these do things in browser
        // case 'E':  // turn right
        //     console.log("turn right");
        //     this.viewRotation = mult(rotateY(-alpha), this.viewRotation);
        //     break;
        // case 'W':   // turn left
        //     console.log("turn left");
        //     this.viewRotation = mult(rotateY(alpha), this.viewRotation);
        //     break;
        // case 'S':  // turn up
        //     console.log(" turn up");
        //     this.viewRotation = mult(rotateX(alpha), this.viewRotation);
        //     break;
        // case 'D':  // turn down
        //     console.log("turn down");
        //     this.viewRotation = mult(rotateX(-alpha), this.viewRotation);
        //     break;
        // case 'X':  // bank right
        //     console.log("bank right");
        //     this.viewRotation = mult(rotateZ(-alpha), this.viewRotation);
        //     break;
        // case 'C':  // bank left
        //     console.log("bank left");
        //     this.viewRotation = mult(rotateZ(alpha), this.viewRotation);
           // break;
        // case 'Q':  // move forward
        //     console.log("move forward");
        //     this.eye = subtract(this.eye, this.viewRotation[2]); //subtract the n vector from eye position.
        //     break;
        // case 'A':  //  move backward
        //     console.log("move backward");
        //     this.eye = add(this.eye, this.viewRotation[2]); //subtract the n vector from eye position.
        //     break;
       // case 'R':  //  reset
            //console.log("reset");
         //   this.reset();
            //break;
    //}
};