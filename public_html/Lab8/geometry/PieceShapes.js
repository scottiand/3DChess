
var pieceShapes = {};

pieceShapes.pawnModel = new PawnModel();
pieceShapes.rookModel = new RookModel();
pieceShapes.knightModel = new KnightModel();
pieceShapes.bishopModel = new BishopModel();
pieceShapes.kingModel = new KingModel();
pieceShapes.queenModel = new QueenModel();

function PawnModel () {

}

PawnModel.prototype.draw = function (team) {
    stack.push();

    stack.multiply(translate(4.4,0,0));
    stack.multiply(rotateX(90));
    if (Shapes.pawn.ready) {
        for (var i in Shapes.pawn.geometries) {
            for (var j = 0; j < Shapes.pawn.geometries[i].length; j++) {
                gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
                Shapes.drawPrimitive(Shapes.pawn.geometries[i][j]);
            }
        }
    }

    stack.pop();
};

function RookModel () {

}

RookModel.prototype.draw = function (team) {
    stack.push();

    stack.multiply(translate(2.9,0,0));
    stack.multiply(rotateX(90));
    if (Shapes.rook.ready) {
        for (var i in Shapes.rook.geometries) {
            for (var j = 0; j < Shapes.rook.geometries[i].length; j++) {
                gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
                Shapes.drawPrimitive(Shapes.rook.geometries[i][j]);
            }
        }
    }

    stack.pop();
};

function KnightModel () {

}

KnightModel.prototype.draw = function (team) {
    stack.push();

    if (team) {
        stack.multiply(translate(0,0,-1.2));
        stack.multiply(rotateX(90));
        stack.multiply(rotateZ(-90));
    } else {
        stack.multiply(translate(0,0,1.2));
        stack.multiply(rotateX(90));
        stack.multiply(rotateZ(90));
    }
    if (Shapes.knight.ready) {
        for (var i in Shapes.knight.geometries) {
            for (var j = 0; j < Shapes.knight.geometries[i].length; j++) {
                gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
                Shapes.drawPrimitive(Shapes.knight.geometries[i][j]);
            }
        }
    }

    stack.pop();
};

function BishopModel () {

}

BishopModel.prototype.draw = function (team) {
    stack.push();

    stack.multiply(translate(-0.5,0,0));
    stack.multiply(rotateX(90));
    if (Shapes.bishop.ready) {
        for (var i in Shapes.bishop.geometries) {
            for (var j = 0; j < Shapes.bishop.geometries[i].length; j++) {
                gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
                Shapes.drawPrimitive(Shapes.bishop.geometries[i][j]);
            }
        }
    }

    stack.pop();
};

function KingModel () {

}

KingModel.prototype.draw = function (team) {
    stack.push();

    stack.multiply(translate(-4,0,0));
    stack.multiply(rotateX(90));
    if (Shapes.king.ready) {
        for (var i in Shapes.king.geometries) {
            for (var j = 0; j < Shapes.king.geometries[i].length; j++) {
                gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
                Shapes.drawPrimitive(Shapes.king.geometries[i][j]);
            }
        }
    }

    stack.pop();
};

function QueenModel () {

}

QueenModel.prototype.draw = function (team) {
    stack.push();

    stack.multiply(translate(-2.2,0,0));
    stack.multiply(rotateX(90));
    if (Shapes.queen.ready) {
        for (var i in Shapes.queen.geometries) {
            for (var j = 0; j < Shapes.queen.geometries[i].length; j++) {
                gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
                Shapes.drawPrimitive(Shapes.queen.geometries[i][j]);
            }
        }
    }

    stack.pop();
}