/* 
 * Scotti Anderson and Carlos Luevanos
 * The chess board, with methods to allow for players to take turns and manipulate the pieces
 */

function Board() {
    this.grid = new boardMatrix();
    this.boardColorMat = new boardColorMatrix();
    this.whiteTurn = true;
    this.whiteTaken = [];
    this.blackTaken = [];

    this.whiteTeam = [];
    this.blackTeam = [];

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

    //this.print();
}

Board.prototype.get = function (letter, number) {
    return this.grid.get(letter, number);
};

Board.prototype.set = function (value) {
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
        var strings = entry.split(" ", 2);// Tokenize
        var let1 = letterToNumber(strings[0].charAt(0)); // Extract values
        var num1 = parseInt(strings[0].charAt(1)) - 1;
        var let2 = letterToNumber(strings[1].charAt(0));
        var num2 = parseInt(strings[1].charAt(1)) - 1;
        this.makeMove(this.whiteTurn, let1, num1, let2, num2); // Take a turn
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
            var enemyTeam = isWhite ? this.blackTeam : this.whiteTeam;
            var friendKing = isWhite ? this.whiteKing : this.blackKing;
            var testBoard = this.copy();
            var enemyIndex = enemyTeam.indexOf(testBoard.get(let2,num2));
            piece.letter = let2;
            piece.number = num2;
            testBoard.set(piece);
            testBoard.remove(let1, num1);
            //console.log("testBoard:");
            //testBoard.print();
            var kingLoc = piece === friendKing ? vec2(let2, num2) : vec2(friendKing.letter, friendKing.number);
            for (var i = 0; i < enemyTeam.length; i++) {
                if (j != enemyIndex) {
                    var moves = enemyTeam[i].canMove(testBoard);
                    for (var j = 0; j < moves.length; j++) {
                        if (moves[j][0] === kingLoc[0] && moves[j][1] === kingLoc[1]) {
                            valid = false;
                        }
                    }
                }
            }//Test if this move puts the king in check
            piece.letter = let1;
            piece.number = num1;
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
            this.set(movingPiece); // Move the piece
            this.remove(let1, num1); // remove the original
            this.print();
            this.whiteTurn = !this.whiteTurn;
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
    gl.uniform1f(uColorMode,1);
    stack.push();
    stack.multiply(translate(8,0,-8));

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
            gl.uniform4fv(uColor,(this.boardColorMat[i][j]));
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
}


