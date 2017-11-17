/* 
 * Scotti Anderson and Carlos Luevanos
 * The chess board, with methods to allow for players to take turns and manipulate the pieces
 */

function Board() {
    this.grid = new boardMatrix();
    this.whiteTurn = true;
    this.whiteTaken = [];
    this.blackTaken = [];
    
    for (var i = 0; i < 8; i++) { // Add Pieces to the board
        this.set(new Pawn(true, i, 1), i, 1);
        this.set(new Pawn(false, i, 6), i, 6);
    }
    //White pieces
    //Rooks
    this.set(new Rook(true,0,0),0,0);
    this.set(new Rook(true,7,0),7,0);
    //Knights
    this.set(new Knight(true,1,0),1,0);
    this.set(new Knight(true,6,0),6,0);
    //Bishops
    this.set(new Bishop(true,2,0),2,0);
    this.set(new Bishop(true,5,0),5,0);
    //Queen
    this.set(new Queen(true, 3,0),3,0);
    //King
    this.set(new King(true, 4, 0),4,0);
    
    //Black Pieces
    //Rooks
    this.set(new Rook(false,0,7),0,7);
    this.set(new Rook(false,7,7),7,7);
    //Knights
    this.set(new Knight(false,1,7),1,7);
    this.set(new Knight(false,6,7),6,7);
    //Bishops
    this.set(new Bishop(false,2,7),2,7);
    this.set(new Bishop(false,5,7),5,7);
    //Queen
    this.set(new Queen(false, 4,7),4,7);
    //King
    this.set(new King(false, 3, 7),3,7);
    
    
    this.print();
}

Board.prototype.get = function (letter, number) {
    return this.grid.get(letter, number);
};

Board.prototype.set = function (value, letter, number) {
    this.grid.set(value, letter, number);
};

Board.prototype.remove = function(letter, number) {
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
                toPrint += this.get(i,j) + ", ";
            }
        }
        toPrint += "\n";
    }
    console.log(toPrint);

};

Board.prototype.keyAction = function (key) {
    if (key === 13) { // When return is hit
        var entry = document.getElementById("textEntry").value; // Get the string fromt he entry
        console.log(entry);
        var strings = entry.split(" ",2);// Tokenize
        console.log(strings);
        var let1 = letterToNumber(strings[0].charAt(0)); // Extract values
        var num1 = parseInt(strings[0].charAt(1)) - 1;
        var let2 = letterToNumber(strings[1].charAt(0));
        var num2 = parseInt(strings[1].charAt(1)) - 1;
        this.makeMove(this.whiteTurn,let1,num1,let2,num2); // Take a turn
    }
};

Board.prototype.makeMove = function (isWhite, let1, num1, let2, num2) {
    if (isFriend(this, let1, num1, isWhite)) { // Test if the first spot contains the players piece
        var endLocs = this.get(let1, num1).canMove(this); // Get possible spaces
        var valid = false; // Test if the desired space is a possible space.
        for (var i = 0; i < endLocs.length; i++) {
            if (endLocs[i][0] === let2 && endLocs[i][1] === num2) {
                valid = true;
            }
        }
        if (valid) { // If the player's move is valid
            if (isEnemy(this, let2, num2, isWhite)) { 
                if (isWhite) {
                    this.blackTaken.push(this.get(let2, num2));
                } else {
                    this.whiteTaken.push(this.get(let2, num2));
                }
            }// Kill the enemy that is taken
            var movingPiece = this.get(let1, num1);
            this.set(movingPiece,let2,num2); // Move the piece
            movingPiece.move(let2, num2);
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


