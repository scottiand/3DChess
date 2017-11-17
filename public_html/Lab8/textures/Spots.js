/* 
 * Scotti Anderson
 * Create spotted pattern
 */

function Spots(gS, nR)
{
    if (gS > 6 || gS < 3) {
        console.log("Grid size must be between 3 and 6!");
        gS = 6;
    }
    
    
    this.gridSize = Math.pow(2, gS);
    
    this.width = this.gridSize * this.gridSize;    // width (# of pixels) of the texture
    this.height = this.width;   // height (# of pixels) of the texture
    this.numRows = nR;   // number of spots in a row
    this.numCols = nR;   // number of spots in a column
    this.makeSpots();
    this.init();
}

Spots.prototype.makeSpots = function() {
    this.texels = new Uint8Array(4 * this.width * this.height);
    
    var size = this.width/this.numRows; // The size of each gris space
    //console.log("size: " + size); 
    
    for (var i = 0; i < this.width; i++) // for each pixel
    {
        for (var j = 0; j < this.height; j++)
        {
             //Find which grid space the pixel is in
            var gridX = Math.floor(i/(size));
            //console.log("i: " + i);
            //console.log("j: " + j);
            var gridY = Math.floor(j/(size));
            //console.log("grid: (" + gridX + "," + gridY + ")");
            
            //Find the center of the current grid space
            var centerX = (gridX * size) + (size/2);
            var centerY = (gridY * size) + (size/2);
            //console.log("center: (" + centerX + "," + centerY + ")");
            
            //Find the distance between the current point (i,j) and the center of the current grid space
            var distance = Math.sqrt((centerX - i)*(centerX - i) + ((centerY - j)*(centerY - j)));
            //console.log("distance= " + distance);
            
            // If the point is close enough, set the color to white
            var c = distance <= (size/3) ? 255 : 0;
            var k = 4 * (i * this.width + j);
            this.texels[k] = c;
            this.texels[k + 1] = c;
            this.texels[k + 2] = c;
            this.texels[k + 3] = 255;
        }
    }
    
};

Spots.prototype.init = function() {
 
    this.texID = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texID);

    // loads the texture onto the GPU
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, this.texels);

    // Set parameters
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
};

Spots.prototype.activate = function () {
    // GL provides 32 texture registers; the first of these is gl.TEXTURE0.
    gl.activeTexture(gl.TEXTURE0); // activate texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, this.texID);
    gl.uniform1i(uTexture, 0);     // associate uTexture in shader with texture unit 0
};
