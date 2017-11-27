/* 
 * Ariel Todoki and Anna Neshyba
 * Lab 3
 * Due: September 22, 2017
 */

function Train() {
    this.name = "train";

    this.fBodyHeight = 3;
    this.fBodyLength = 3.5;
    this.fCylinderHeight = 2;
    this.bBodyHeight = 3.5;
    this.bBodyLength = 5;
    this.bBodyWidth = 3.5;
    this.circleRadius = 0.5;
    this.wheelRadius = 1;
    this.wheelThick = 0.55;

    this.theta = 0;
    this.theta_inc = 5;
}

// Train moves forward in +Z direction
Train.prototype.rollForward = function () {
    this.theta += this.theta_inc;
};

// Train moves backward in -Z direction
Train.prototype.rollBackward = function () {
    this.theta -= this.theta_inc;
};

// Train re-centers on origin
Train.prototype.reset = function () {
    this.theta = 0;
};

Train.prototype.drawFront = function () {
    stack.push();

    //Draw front body cylinder
    stack.multiply(translate(0, (this.wheelRadius) + (this.bBodyHeight / 2), this.fBodyLength / 2));
    stack.multiply(scalem(this.fBodyHeight / 2, this.fBodyHeight / 2, this.fBodyLength / 2));
    stack.multiply(rotateX(90));

    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    gl.uniform4fv(uColor, vec4(1.0, 0.0, 0.0, 1.0));  // set color to red
    Shapes.drawPrimitive(Shapes.cylinder);    // draw body cylinder

    stack.pop();
    stack.push();

    //Draw front body cone
    stack.multiply(translate(0, (this.wheelRadius) + (this.bBodyHeight / 2), this.fBodyLength));
    stack.multiply(rotateX(-90));

    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    gl.uniform4fv(uColor, vec4(1.0, 1.0, 0.0, 1.0));  // set color to yellow
    Shapes.drawPrimitive(Shapes.cone); // draw front cone

    stack.pop();
    stack.push();

    //Draw front body upper cylinder
    stack.multiply(translate(0, (this.wheelRadius) + (this.bBodyHeight / 2) + (this.fBodyHeight / 2) + (this.fCylinderHeight / 2), (this.fBodyLength / 2) + this.circleRadius));
    stack.multiply(scalem(this.circleRadius, this.fCylinderHeight / 2, this.circleRadius));

    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    gl.uniform4fv(uColor, vec4(1.0, 0.0, 1.0, 1.0));  // set color to purple
    Shapes.drawPrimitive(Shapes.cylinder);    // draw front cylinder


    //Draw steam cone bottom
    stack.multiply(translate(0, this.fCylinderHeight - 0.5, 0));
    stack.multiply(scalem(this.circleRadius * 3, 1, this.circleRadius * 3));
    stack.multiply(rotateX(180));

    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    gl.uniform4fv(uColor, vec4(1.0, 1.0, 0.0, 1.0));  // set color to yellow
    Shapes.drawPrimitive(Shapes.cone); // draw bottom cone

    //Draw steam cone top
    stack.multiply(translate(0, -0.125, 0));
    stack.multiply(scalem(this.circleRadius * 2, this.circleRadius * 2, this.circleRadius * 2));

    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    gl.uniform4fv(uColor, vec4(1.0, 1.0, 1.0, 1.0));  // set color to yellow
    Shapes.drawPrimitive(Shapes.cone); // draw top cone

    stack.pop();
};

Train.prototype.drawBack = function () {
    stack.push();

    //Draw back body cube
    stack.multiply(translate(0, (this.bBodyHeight / 2) + (this.wheelRadius), this.bBodyLength / (-2)));
    stack.multiply(scalem(this.bBodyWidth / 2, this.bBodyHeight / 2, this.bBodyLength / 2));

    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    gl.uniform4fv(uColor, vec4(1.0, 0.0, 0.0, 1.0));  // set color to red
    Shapes.drawPrimitive(Shapes.cube); // draw back body cube

    stack.pop();
    stack.push();

    //Draw back body cylinder1
    stack.multiply(translate(0, (this.wheelRadius) + this.bBodyHeight + this.circleRadius, -(this.circleRadius * 3)));
    stack.multiply(scalem(this.circleRadius, this.circleRadius, this.circleRadius));

    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    gl.uniform4fv(uColor, vec4(1.0, 0.0, 1.0, 1.0));  // set color to purple
    Shapes.drawPrimitive(Shapes.cylinder); // draw cylinder1

    //Draw back body cylinder2
    stack.multiply(translate(0, 0, -(this.circleRadius * 8)));

    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    gl.uniform4fv(uColor, vec4(1.0, 0.0, 1.0, 1.0));  // set color to purple
    Shapes.drawPrimitive(Shapes.cylinder); // draw cylinder2

    stack.pop();
};

Train.prototype.drawWheel = function () {
    //Draws wheel on origin sitting on XZ plane
    stack.multiply(translate(0, this.wheelRadius, 0));
    stack.multiply(rotateX(-this.theta));
    stack.multiply(rotateZ(90));
    stack.multiply(scalem(this.wheelRadius, this.wheelThick / 2, this.wheelRadius));

    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    gl.uniform4fv(uColor, vec4(0.0, 1.0, 1.0, 1.0));  // set color to light blue
    Shapes.drawPrimitive(Shapes.cylinder); // draw cylinder wheel
};

Train.prototype.drawWheels = function () {
    stack.push();

    //Set translate for left wheels
    stack.multiply(translate(this.fBodyHeight / 2, (this.bBodyHeight - this.fBodyHeight) / 2, 0));
    stack.push();

    //Draw left wheel1
    stack.multiply(translate(0, 0, this.fBodyLength - this.wheelRadius));
    this.drawWheel();

    stack.pop();
    stack.push();

    //Draw left wheel2
    stack.multiply(translate(0, 0, -this.wheelRadius));
    this.drawWheel();

    stack.pop();
    stack.push();

    //Draw left wheel3
    stack.multiply(translate(0, 0, -this.bBodyLength + this.wheelRadius));
    this.drawWheel();

    stack.pop();
    stack.pop();
    stack.push();

    //Set translate for right wheels
    stack.multiply(translate(-this.fBodyHeight / 2, (this.bBodyHeight - this.fBodyHeight) / 2, 0));
    stack.push();

    //Draw right wheel1
    stack.multiply(translate(0, 0, this.fBodyLength - this.wheelRadius));
    this.drawWheel();

    stack.pop();
    stack.push();

    //Draw right wheel2
    stack.multiply(translate(0, 0, -this.wheelRadius));
    this.drawWheel();

    stack.pop();
    stack.push();

    //Draw right wheel3
    stack.multiply(translate(0, 0, -this.bBodyLength + this.wheelRadius));
    this.drawWheel();

    stack.pop();
    stack.pop();
};

Train.prototype.drawTrain = function () {

    stack.multiply(scalem(0.5, 0.5, 0.5)); //scale down entire model
    stack.push();

    var zLoc = 2 * Math.PI * this.theta / 360;
    stack.multiply(translate(0, 0, zLoc)); // move train forward or back

    this.drawFront();
    this.drawBack();
    this.drawWheels();

    stack.pop();
    stack.pop();
};