
var pieceShapes = {};

pieceShapes.pawnModel = new PawnModel();
pieceShapes.rookModel = new RookModel();
pieceShapes.knightModel = new KnightModel();
pieceShapes.bishopModel = new BishopModel();
pieceShapes.kingModel = new KingModel();
pieceShapes.queenModel = new QueenModel();


function PawnModel () {

}

PawnModel.prototype.draw = function () {
    stack.push();

    stack.multiply(scalem(0.3,0.5,0.3));
    stack.multiply(translate(0,1,0));
    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    Shapes.drawPrimitive(Shapes.cube);

    stack.pop();
};

function RookModel () {

}

RookModel.prototype.draw = function () {
    stack.push();

    stack.multiply(scalem(0.5,1,0.5));
    stack.multiply(translate(0,1,0));
    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    Shapes.drawPrimitive(Shapes.cube);

    stack.pop();
};

function KnightModel () {

}

KnightModel.prototype.draw = function () {
    stack.push();

    stack.multiply(scalem(0.5,2,0.5));
    //stack.multiply(translate(0,0.5,0));
    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    Shapes.drawPrimitive(Shapes.cone);

    stack.pop();
};

function BishopModel () {

}

BishopModel.prototype.draw = function () {
    stack.push();

    stack.multiply(scalem(0.5,1,0.5));
    stack.multiply(translate(0,1,0));
    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    Shapes.drawPrimitive(Shapes.cylinder);

    stack.pop();
};

function KingModel () {

}

KingModel.prototype.draw = function () {
    stack.push();

    stack.multiply(scalem(0.5,1.5,0.5));
    stack.multiply(translate(0,1,0));
    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    Shapes.drawPrimitive(Shapes.cylinder);

    stack.pop();
};

function QueenModel () {

}

QueenModel.prototype.draw = function () {
    stack.push();

    stack.multiply(scalem(0.5,1.5,0.5));
    stack.multiply(translate(0,1,0));
    gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
    Shapes.drawPrimitive(Shapes.cube);

    stack.pop();
}