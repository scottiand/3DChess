/* 
 * Scotti Anderson and Carlos Luevanos
 * Functions to assist with chess-related activities
 */

function boardMatrix() {
    this.grid = [];
    for (var i = 0; i < 8; i++) {
        this.grid[i] = [];
        for (var j = 0; j < 8; j++) {
            this.grid[i][j] = 0;
        }
    }
}




function boardColorMatrix() {
    this.grid = [];
    for (var i = 0; i < 8; i++) {
       this.grid[i] = [];
       for (var j = 0; j < 8; j++) {
           if (i % 2 === 0) {
               if (j % 2 === 0){
                   this.grid[i][j] = vec4(0,0,0,1);
               } else {
                   this.grid[i][j] = vec4(1,1,1,1);
               }
           } else {
               if (!(j % 2 === 0)){
                   this.grid[i][j] = vec4(0,0,0,1);
               }  else {
                   this.grid[i][j] = vec4(1,1,1,1);
               }
           }

       }
   }
   return this.grid;
   console.log(this.grid);
}

boardMatrix.prototype.get = function (letter, number) {
    if (letter < 0 || letter > 7) {
        console.log("Letter out of range:" + letter, + ", " + number);
        letter = 0;
    }// Check that the value is in range
    if (number < 0 || number > 7) {
        console.log("Number out of range:" + letter, + ", " + number);
        number = 0;
    }// Check that the value is in range
    return this.grid[letter][number];
};

boardMatrix.prototype.set = function (value, letter, number) {
    if (letter < 0 || letter > 7) {
        console.log("Letter out of range:" + letter);
        letter = 0;
    }// Check that the value is in range
    if (number < 0 || number > 7) {
        console.log("Letter out of range:" + number);
        number = 0;
    }// Check that the value is in range
    this.grid[letter][number] = value;
};

boardMatrix.prototype.remove = function (letter, number) {
    this.set(0,letter,number);
};

function letterToNumber(letter) {
    switch (letter) {
        case 'a':
        case 'A':
            return 0;
        case 'b':
        case 'B':
            return 1;
        case 'c':
        case 'C':
            return 2;
        case 'd':
        case 'D':
            return 3;
            break;
        case 'e':
        case 'E':
            return 4;
        case 'f':
        case 'F':
            return 5;
        case 'g':
        case 'G':
            return 6;
        case 'h':
        case 'H':
            return 7;
        default:
            console.log("Invalid letter: " + letter);
            return 8;
    }
}

function isInRange(value) {
    return (value >= 0 && value <= 7);
}

function isEnemy(board, letter, number, isWhite) {
    if (board.isOccupied(letter, number)) {
        return !board.get(letter, number).isWhite === isWhite;
    }
}

function isFriend(board, letter, number, isWhite) {
    if (board.isOccupied(letter, number)) {
        return board.get(letter, number).isWhite === isWhite;
    }
}

