/* 
 * Scotti Anderson and Carlos Luevanos
 * The chess board, with methods to allow for players to take turns and manipulate the pieces
 */

function Board() {
    this.grid = new boardMatrix();
    this.boardColorMat = new boardColorMatrix();
    this.whiteTurn = true;
    this.selected = null;
    this.whiteTaken = [];
    this.blackTaken = [];
    this.lightUp = []; //potential moves for pieces on the board
    this.isCheckmate = false;

    this.whiteTeam = [];
    this.blackTeam = [];

    // this.whiteTeam.push(new Queen(true, 1, 7));
    // this.whiteTeam.push(new Queen(true, 3, 6));
    // this.whiteTeam.push(new Knight(true, 1, 0));
    // this.whiteTeam.push(new King(true, 0, 0));
    //
    // this.whiteKing = this.whiteTeam[3];
    //
    // this.blackTeam.push(new King(false, 2, 3));
    //
    // this.blackKing = this.blackTeam[0];

    //White Team
    this.whiteTeam.push(new Rook(true, 0, 0));
    this.whiteTeam.push(new Knight(true, 1, 0));
    this.whiteTeam.push(new Bishop(true, 2, 0));
    this.whiteTeam.push(new Queen(true, 3, 0));
    this.whiteTeam.push(new King(true, 4, 0));
    this.whiteTeam.push(new Bishop(true, 5, 0));
    this.whiteTeam.push(new Knight(true, 6, 0));
    this.whiteTeam.push(new Rook(true, 7, 0));
    //Black Team
    this.blackTeam.push(new Rook(false, 0, 7));
    this.blackTeam.push(new Knight(false, 1, 7));
    this.blackTeam.push(new Bishop(false, 2, 7));
    this.blackTeam.push(new Queen(false, 4, 7));
    this.blackTeam.push(new King(false, 3, 7));
    this.blackTeam.push(new Bishop(false, 5, 7));
    this.blackTeam.push(new Knight(false, 6, 7));
    this.blackTeam.push(new Rook(false, 7, 7));

    this.whiteKing = this.whiteTeam[4];
    this.blackKing = this.blackTeam[4];

    for (var i = 0; i < 8; i++) {
        this.whiteTeam.push(new Pawn(true, i, 1));
        this.blackTeam.push(new Pawn(false, i, 6));
    }// Add pawns to both teams

     for (var i = 0; i < this.whiteTeam.length; i++) {
         this.set(this.whiteTeam[i]);
         this.set(this.blackTeam[i]);
    }//Add teams to the board
    //this.set(this.blackKing);
    //this.print();
    //this.moveCamera();
}

Board.prototype.get = function (letter, number) {
    return this.grid.get(letter, number);
};

Board.prototype.set = function (value) {
    console.log("value" + value);
    this.grid.set(value, value.letter, value.number);
};

Board.prototype.remove = function (letter, number) {
    this.grid.remove(letter, number);
};

Board.prototype.isOccupied = function (letter, number) {
    return (!(this.grid.get(letter, number) === 0));
};

Board.prototype.print = function () {
    var toPrint = "";
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            if (this.isOccupied(i, j)) {
                var piece = this.get(i, j);
                toPrint += piece.symbol() + ", ";
            } else {
                toPrint += this.get(i, j) + ", ";
            }
        }
        toPrint += "\n";
    }
    console.log(toPrint);

};

Board.prototype.keyAction = function (key) {
    if (key === 13) { // When return is hit
        var entry = document.getElementById("textEntry").value; // Get the string fromt he entry
        var strings = entry.split(" ", 1);// Tokenize
        var letter = letterToNumber(strings[0].charAt(0)); // Extract values
        var number = parseInt(strings[0].charAt(1)) - 1;
        //var letter = letterToNumber(strings[1].charAt(0));
        //var num = parseInt(strings[1].charAt(1)) - 1;

        if(this.selected === null){
            //select piece
            this.selectedPiece(letter,number);
        } else {
            //do what it did before
            this.makeMove(this.whiteTurn, this.selected.letter, this.selected.number, letter, number); // Take a turn

        }
    }
};

Board.prototype.makeMove = function (isWhite, let1, num1, let2, num2) {
    if (isFriend(this, let1, num1, isWhite)) { // Test if the first spot contains the players piece
        var piece = this.get(let1, num1);
        var endLocs = piece.canMove(this); // Get possible spaces
        var valid = false; // Test if the desired space is a possible space.
        for (var i = 0; i < endLocs.length; i++) {
            if (endLocs[i][0] === let2 && endLocs[i][1] === num2) {
                valid = true;
            }
        }
        //console.log("After initial validity test: " + valid);
        if (valid) {
            valid = !this.moveResultsInCheck(piece, let1, num1, let2, num2);
        }// Test if the king is in check
        //console.log("After check-based validity test: " + valid);
        if (valid) { // If the player's move is valid
            if (isEnemy(this, let2, num2, isWhite)) {
                var enemy = this.get(let2, num2);
                if (isWhite) {
                    var index = this.blackTeam.indexOf(enemy);
                    for (var i = index + 1; i < this.blackTeam.length; i++) {
                        this.blackTeam[i - 1] = this.blackTeam[i];
                    }
                    this.blackTeam.pop();// Remove from team
                    this.blackTaken.push(enemy);//Add to graveyard
                    //console.log(this.blackTeam);
                    //console.log(this.blackTaken);
                } else {
                    var index = this.whiteTeam.indexOf(enemy);
                    for (var i = index + 1; i < this.whiteTeam.length; i++) {
                        this.whiteTeam[i - 1] = this.whiteTeam[i];
                    }
                    this.whiteTeam.pop();// Remove from team
                    this.whiteTaken.push(enemy);
                    //console.log(this.whiteTeam);
                    //console.log(this.whiteTaken);
                }
            }// Kill the enemy that is taken
            var movingPiece = this.get(let1, num1);
            movingPiece.move(let2, num2);
            movingPiece = this.get(let1, num1); // If a pawn is replaced, we need to get the new piece
            this.set(movingPiece); // Move the piece
            this.remove(let1, num1); // remove the original
            this.print();
            this.whiteTurn = !this.whiteTurn;
            this.selected = null;
            this.lightUp = [];
            this.moveCamera();
            if (this.checkmate(this.whiteTurn)) {
                this.isCheckmate = true;
            }
        } else {
            console.log("Invalid Move! Cannot move there!");
        }
    } else {
        console.log("Invalid Move! Not your piece!");
    }
};

Board.prototype.copy = function () {
    var newBoard = new Board();
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            newBoard.remove(i, j);
            if (this.isOccupied(i, j)) {
                newBoard.set(this.get(i, j));
            }
        }
    }
    return newBoard;
};

Board.prototype.draw = function () {

    stack.push();
    stack.multiply(translate(7,0,-7));

    this.drawBoard();
    this.drawPieces();

    stack.pop();
};

Board.prototype.drawBoard = function () {

    stack.push();
    stack.multiply(scalem(1,0.25,1));
    for(var i = 0; i < this.boardColorMat.length; i++){
        for(var j = 0; j < this.boardColorMat.length; j++){
            stack.push();
            stack.multiply(translate(-i*2,0,j*2));
            gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
            if (this.selected != null && this.selected.letter === i && this.selected.number === j) {
                gl.uniform4fv(uColor, vec4(0, 1, 0, 1));
            } else {
                gl.uniform4fv(uColor,(this.boardColorMat[i][j]));
            }
            for(var k = 0; k < this.lightUp.length; k++){
                if(this.lightUp[k][0] === i && this.lightUp[k][1] === j) {
                    var piece = this.get(i,j);
                    if (piece === 0) {
                        gl.uniform4fv(uColor, vec4(0, 0, 1, 1));
                    } else {
                        gl.uniform4fv(uColor, vec4(1,0,0,1));
                    }

                }
            }

            Shapes.drawPrimitive(Shapes.cube); // cube
            stack.pop();

        }
    }
    stack.pop();
};

Board.prototype.drawPieces = function () {
    stack.push();
    stack.multiply(translate(0,0.2,0,1));

    for(var i = 0; i < this.boardColorMat.length; i++){
        for(var j = 0; j < this.boardColorMat.length; j++) {
            var piece = this.get(i,j);
            if (piece != 0) {
                stack.push();
                stack.multiply(translate(-i*2,0,j*2));
                gl.uniformMatrix4fv(uModel_view, false, flatten(stack.top()));
                if (piece.isWhite) {
                    gl.uniform4fv(uColor,whitePiece);
                } else {
                    gl.uniform4fv(uColor,blackPiece);
                }

                this.get(i,j).model.draw(piece.isWhite); // cube
                stack.pop();
            }

        }
    }
    stack.pop();
};

Board.prototype.drawColor = function () {
    stack.multiply(translate(7,0,-7));

    stack.push();
    stack.multiply(scalem(1,0.25,1));
    for(var i = 0; i < this.boardColorMat.length; i++){
        for(var j = 0; j < this.boardColorMat.length; j++){
            stack.push();
            stack.multiply(translate(-i*2,0,j*2));
            gl.uniformMatrix4fv(uModel_viewColor, false, flatten(stack.top()));
            gl.uniform4fv(pickingColor,vec4(i/256.0 ,j/256.0,0,1));
            Shapes.drawPrimitive(Shapes.cube); // cube
            stack.pop();
        }
    }
    stack.pop();


    stack.push();
    stack.multiply(translate(0,0.2,0,1));

    for(var i = 0; i < this.boardColorMat.length; i++){
        for(var j = 0; j < this.boardColorMat.length; j++) {
            var piece = this.get(i,j);
            if (piece != 0) {
                stack.push();
                stack.multiply(translate(-i*2,0,j*2));
                gl.uniformMatrix4fv(uModel_viewColor, false, flatten(stack.top()));
                gl.uniform4fv(pickingColor,vec4(i/256.0,j/256.0,0,1));

                this.get(i,j).model.draw(piece.isWhite); // cube
                stack.pop();
            }

        }
    }
    stack.pop();
};

Board.prototype.selectedPiece = function (letter,number) {
  var piece =  this.get(letter,number);

  if((piece !== 0) && piece.isWhite === this.whiteTurn){
    this.selected = piece;
    this.lightUp = piece.canMove(this);
    console.log(this.selected);
  }
};

Board.prototype.clickMove = function () {
    //this.drawColor();
    if (!this.isCheckmate) {
        renderColor();
        gl.flush();
        gl.finish();
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        var data = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
        var data = new Uint8Array(4);
        gl.readPixels(mouseState.x - mouseState.canvasPosition[0], (mouseState.canvasPosition[1] + gl.drawingBufferHeight) - mouseState.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
        var colorClicked = vec4();

        var letter = data[0];
        var number = data[1];
        if (letter <= 7 && number <= 7) {
            if (this.selected != null) {
                if (this.get(letter, number).isWhite === this.whiteTurn) {
                    this.lightUp = [];
                    this.selectedPiece(letter, number);
                } else {
                    this.makeMove(this.whiteTurn, this.selected.letter, this.selected.number, letter, number);
                }
            } else {
                this.selectedPiece(letter, number);
            }
        } else {
            this.selected = null;
            this.lightUp = [];
        }

        render();
    }
};

Board.prototype.moveCamera = function () {

        var yRot = 0;
        if (!this.whiteTurn) {
            yRot = 180;
        }
    setTimeout(function(){
        camera.reset();
        camera.tumble(rotateX(-45),rotateY(yRot));
        render();
    }, 500);

};

Board.prototype.promote = function (letter, number) {
    var piece = this.get(letter, number);
    console.log("piece" + piece);
    this.remove(letter, number);
    var index = this.whiteTeam.indexOf(piece);
    var newPiece = new Queen(piece.isWhite, piece.letter, piece.number);
    this.whiteTeam[index] = newPiece;
    console.log("newPiece" + newPiece.symbol());
    this.set(newPiece);
};

Board.prototype.checkmate = function (isWhite) {
    var checkmate = true;

    console.log("isInCheck" + this.isInCheck(isWhite));
    console.log("isWhite" + isWhite);
    if (this.isInCheck(isWhite)) {
        var friendTeam = isWhite ? this.whiteTeam : this.blackTeam;
        for (var i = 0; i < friendTeam.length; i++) {
            var piece = friendTeam[i];
            var moves = piece.canMove(this);
            for (var j = 0; j < moves.length; j++) {
                if (!this.moveResultsInCheck(piece, piece.letter, piece.number, moves[j][0], moves[j][1])) {
                    checkmate = false;
                    break;
                }
            }
        }
        return checkmate;
    } else {
        return false;
    }


};

Board.prototype.moveResultsInCheck = function (piece, let1, num1, let2, num2) {
    var valid = false;

    var enemyTeam = piece.isWhite ? this.blackTeam : this.whiteTeam;
    var friendKing = piece.isWhite ? this.whiteKing : this.blackKing;
    var testBoard = this.copy();
    console.log(testBoard);
    var enemyPiece = testBoard.get(let2, num2);
    var enemyIndex = enemyPiece === 0 ? -1 : enemyTeam.indexOf(enemyPiece);
    piece.letter = let2;
    piece.number = num2;
    testBoard.set(piece);
    testBoard.remove(let1, num1);
    var kingLoc = piece === friendKing ? vec2(let2, num2) : vec2(friendKing.letter, friendKing.number);
    for (var i = 0; i < enemyTeam.length; i++) {
        if (i != enemyIndex) {
            var moves = enemyTeam[i].canMove(testBoard);
            for (var j = 0; j < moves.length; j++) {
                if (moves[j][0] === kingLoc[0] && moves[j][1] === kingLoc[1]) {
                    valid = true;
                    //alert("You're in check!");
                }
            }
        }
    }//Test if this move puts the king in check
    piece.letter = let1;
    piece.number = num1;
    return valid;
};

Board.prototype.isInCheck = function (isWhite) {
    var enemyTeam = isWhite ? this.blackTeam : this.whiteTeam;
    var friendKing = isWhite ? this.whiteKing : this.blackKing;

    var kingLoc = vec2(friendKing.letter, friendKing.number);
    for (var i = 0; i < enemyTeam.length; i++) {
        var moves = enemyTeam[i].canMove(this);
        for (var j = 0; j < moves.length; j++) {
            if (moves[j][0] === kingLoc[0] && moves[j][1] === kingLoc[1]) {
                return true;
            }
        }
    }//Test if this move puts the king in check
    return false;
};