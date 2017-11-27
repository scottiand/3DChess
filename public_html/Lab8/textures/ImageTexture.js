/**
 * Load an imagefile. Set image parameters.
 * @param {type} imageFile
 * @return {ImageTexture}
 */
function ImageTexture(imageFile) {
    this.image = new Image();// Image is a Javascript class. Look it up to see what it is.
   // this.image.src = imageFile;  // Set the Image object's content to your image.
    
    this.texID = gl.createTexture();
    
    // What does the next texImage2D command do?  I was getting the error:
    //        "texture bound to texture unit 0 is not renderable. ..."
    // because the image was taking too long to load.  So, here we  create a 1x1 
    // pixel image which loads really fast so you don't trigger  an error if the full image has not loaded. 
    // Once the full image is loaded, it will replace this 1x1 image.
    gl.bindTexture(gl.TEXTURE_2D, this.texID);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([255, 0, 0, 255])); // red
              
    var that = this;  // note, read about closures to understand why we need this assignment

    // Loading the image can take time so you need to make sure the image is fully loaded
    // before creating a texture buffer on GPU
    this.image.onload = function () {   // "this" inside the onload function would refer to the window and not the ImageTexture

        
        gl.bindTexture(gl.TEXTURE_2D, that.texID);

        // Send image to texture buffer on GPU
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, that.image);

        // Set texture parameters.
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                gl.NEAREST_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // We call render here to insure that render is called *after* the image 
        // loaded. Try removing this to see what happens. It may depend on the 
        // speed of your computer.
        render();
    };    
    this.image.src = imageFile;
};

/**
 * Call this when you are ready to use the texture
 * @return {undefined}
 */
ImageTexture.prototype.activate = function () {
    // GL provides 32 texture registers; the first of these is gl.TEXTURE0.
    gl.activeTexture(gl.TEXTURE0); // activate texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, this.texID);
    gl.uniform1i(uTexture, 0);     // associate uTexture in shader with texture unit 0
};
