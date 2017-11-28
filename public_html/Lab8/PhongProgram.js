// Ruvim Kondratyev 
// Computer Graphics Class 
// Fall 2017 
// Willamette University 
// Professor Genevieve Orr 

// Very useful online references: 
// https://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html
// https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html

function PhongProgram (gl, opt_onmaterialload) { 
	var me = this; 
	this.gl = gl; 
	this.id = PhongProgram.prototype.nextMaterialID; 
	{ 
		// Increment, so that the next material's ID is greater: 
		PhongProgram.prototype.nextMaterialID++; 
	} 
	this.materialName = "Phong"; 
	this.buffers = new Object (); // HashMap [String uniqueID] --> Object { vertex, normal, texCoord }; 
	this.textures = new Object (); // Let's make this a HashMap of type [String imageURL] --> Object { texID: [GL texture ID] }; 
	this.programReady = false; 
	this.onmaterialload = opt_onmaterialload; 
	this.loadShaders ("shaders/skeleton.txt", "shaders/phong.txt"); 
} 

PhongProgram.prototype.nextMaterialID = 57; 

// The uniqueID has to be unique!! 
// It may help to prepend the model's name to it, like "Person2#Geometry8", etc., since 
// what if multiple models have a Geometry8? 
PhongProgram.prototype.initBuffers = function (uniqueID, geometryData) { 
	if (this.buffers[uniqueID]) { 
		// A buffer with this ID already exists; try to get the developer to be better at using unique IDs: 
		throw "Error: PhongProgram::initBuffers (): Non-unique string [" + uniqueID + "] passed as the ID. A buffer with this ID already exists. " + 
		"This may be caused by multiple 3D models using the same ID. Consider prepending the model's name to all the IDs; for example, " + 
		"Bob#Geometry1 rather than just Geometry1, as multiple models may have the same geometry IDs. "; 
	} 
	var gl = this.gl; 
	var buf = this.buffers[uniqueID] = { 
		vertex: gl.createBuffer (), 
		normal: gl.createBuffer (), 
		texCoord: (geometryData.texCoords && geometryData.texCoords.length > 0) ? gl.createBuffer () : null, 
		boneIdx: gl.createBuffer (), 
		boneWt: gl.createBuffer (), 
		numVertices: geometryData.vertices.length 
	}; 
	var flat_vertices = PhongProgram.makeFloatArray (geometryData.vertices); 
	var flat_normals = PhongProgram.makeFloatArray (geometryData.normals); 
	var flat_texCoords = PhongProgram.makeFloatArray (geometryData.texCoords); 
	var flat_boneIndexes, flat_boneWeights; 
	if (!geometryData.boneIndexes) { 
		flat_boneIndexes = new Float32Array (flat_vertices.length); // All 0s. 
	} else flat_boneIndexes = PhongProgram.makeFloatArray (geometryData.boneIndexes); 
	if (!geometryData.boneWeights) { 
		flat_boneWeights = new Float32Array (flat_vertices.length); // All 0s. 
	} else flat_boneWeights = PhongProgram.makeFloatArray (geometryData.boneWeights); 
	buf.debug = [flat_vertices, flat_normals, flat_texCoords, flat_boneIndexes, flat_boneWeights]; 
	// Vertex buffer: 
	gl.bindBuffer (gl.ARRAY_BUFFER, buf.vertex); 
	gl.bufferData (gl.ARRAY_BUFFER, flat_vertices, gl.STATIC_DRAW); 
	// Normal buffer: 
	gl.bindBuffer (gl.ARRAY_BUFFER, buf.normal); 
	gl.bufferData (gl.ARRAY_BUFFER, flat_normals, gl.STATIC_DRAW); 
	// Texture coordinate buffer: 
	if (buf.texCoord) { 
		gl.bindBuffer (gl.ARRAY_BUFFER, buf.texCoord); 
		gl.bufferData (gl.ARRAY_BUFFER, flat_texCoords, gl.STATIC_DRAW); 
	} 
	// Bone index data: 
	gl.bindBuffer (gl.ARRAY_BUFFER, buf.boneIdx); 
	gl.bufferData (gl.ARRAY_BUFFER, flat_boneIndexes, gl.STATIC_DRAW); 
	// Bone weight data: 
	gl.bindBuffer (gl.ARRAY_BUFFER, buf.boneWt); 
	gl.bufferData (gl.ARRAY_BUFFER, flat_boneWeights, gl.STATIC_DRAW); 
	// Just in case, so some other code doesn't ruin our last-bound buffer accidentally, let's bind a NULL buffer: 
	gl.bindBuffer (gl.ARRAY_BUFFER, null); 
}; 

PhongProgram.prototype.drawBuffers = function (uniqueID, opt_drawFunction) { 
	var gl = this.gl; 
	var buf = this.buffers[uniqueID]; 
	
	if (!buf) return; // Not ready yet? 
	
	gl.bindBuffer (gl.ARRAY_BUFFER, buf.vertex); 
	gl.vertexAttribPointer (this.a_vertex, 4, gl.FLOAT, false, 0, 0); 
	gl.bindBuffer (gl.ARRAY_BUFFER, buf.normal); 
	gl.vertexAttribPointer (this.a_normal, 3, gl.FLOAT, false, 0, 0); 
	
	if (buf.texCoord) { 
		gl.bindBuffer (gl.ARRAY_BUFFER, buf.texCoord); 
		gl.enableVertexAttribArray (this.a_tex); 
		gl.vertexAttribPointer (this.a_tex, 2, gl.FLOAT, false, 0, 0); 
	} else { 
		gl.disableVertexAttribArray (this.a_tex); 
		gl.vertexAttrib2fv (this.a_tex, vec2 (0, 0)); // Set texture coordinates to a constant value. 
	} 
	
	(opt_drawFunction || PhongProgram.drawTriangles) (gl, 0, buf.numVertices); 
	
	// Bind NULL, for the same reason as we bound NULL at the end of initBuffers (): 
	gl.bindBuffer (gl.ARRAY_BUFFER, null); 
}; 

PhongProgram.drawTriangles = function (gl, startIndex, numVertices) { 
	// Draw triangles: 
	gl.drawArrays (gl.TRIANGLES, startIndex, numVertices); 
}; 

PhongProgram.ZERO4 = vec4 (0, 0, 0, 0); 

PhongProgram.flatten = function (arr) { 
	var result = []; 
	if (!arr) return result; 
	for (var i = 0; i < arr.length; i++) { 
		if (typeof (arr[i]) == "number") { 
			result.push (arr[i]); 
		} else if (typeof (arr[i]) == "object") { 
			result = result.concat (PhongProgram.flatten (arr[i])); 
		} else { 
			console.log ("PhongProgram::flatten (): Array has non-number, non-object elements."); 
		} 
	} 
	return result; 
}; 
PhongProgram.makeFloatArray = function (arr) { 
	return new Float32Array (PhongProgram.flatten (arr)); 
}; 

PhongProgram.prototype.__enableAttributeArrays = function () { 
	var gl = this.gl; 
	// Just enable all the attributes as arrays: 
	gl.enableVertexAttribArray (this.a_vertex); 
	// gl.enableVertexAttribArray (this.a_boneIdx); 
	// gl.enableVertexAttribArray (this.a_boneWt); 
	gl.enableVertexAttribArray (this.a_normal); 
	gl.enableVertexAttribArray (this.a_tex); 
}; 

PhongProgram.prototype.__getSkeletonShaderLocations = function () { 
	// Convention: use underscores and all lowercase for vertex shader variable names ... 
	var gl = this.gl; 
	// Camera matrices: 
	this.u_projection = gl.getUniformLocation (this.program, "u_projection"); 
	this.u_model_view = gl.getUniformLocation (this.program, "u_model_view"); 
	// Bone matrices: 
	this.u_bones = []; 
	for (var i = 0; i < 48; i++) { 
		this.u_bones[i] = gl.getUniformLocation (this.program, "u_bones[" + i + "]"); 
	} 
	// Vertex attributes: 
	this.a_vertex = gl.getAttribLocation (this.program, "a_vertex"); 
	// this.a_boneIdx = gl.getAttribLocation (this.program, "a_boneIdx"); 
	// this.a_boneWt = gl.getAttribLocation (this.program, "a_boneWt"); 
	this.a_normal = gl.getAttribLocation (this.program, "a_normal"); 
	this.a_tex = gl.getAttribLocation (this.program, "a_tex"); 
}; 
PhongProgram.prototype.__getMaterialShaderLocations = function () { 
	// Convention: use Java-like names for material shader variable names ... 
	var gl = this.gl; 
	// Material properties: 
	// Ambient: 
	this.uAmbient_usingTexture = gl.getUniformLocation (this.program, "uAmbient.usingTexture"); 
	this.uAmbient_color = gl.getUniformLocation (this.program, "uAmbient.color"); 
	this.uAmbient_texture = gl.getUniformLocation (this.program, "uAmbient.texture"); 
	// Diffuse: 
	this.uDiffuse_usingTexture = gl.getUniformLocation (this.program, "uDiffuse.usingTexture"); 
	this.uDiffuse_color = gl.getUniformLocation (this.program, "uDiffuse.color"); 
	this.uDiffuse_texture = gl.getUniformLocation (this.program, "uDiffuse.texture"); 
	// Specular: 
	this.uSpecular_usingTexture = gl.getUniformLocation (this.program, "uSpecular.usingTexture"); 
	this.uSpecular_color = gl.getUniformLocation (this.program, "uSpecular.color"); 
	this.uSpecular_texture = gl.getUniformLocation (this.program, "uSpecular.texture"); 
	this.uShininess = gl.getUniformLocation (this.program, "uShininess"); 
	// Light properties: 
	// Ambient: 
	this.uIntensityAmbient = gl.getUniformLocation (this.program, "uIntensityAmbient"); 
	this.uLightCount = gl.getUniformLocation (this.program, "uLightCount"); 
	this.uLights = []; 
	for (var i = 0; i < 16; i++) { 
		this.uLights[i] = { 
			position: gl.getUniformLocation (this.program, "uLights[" + i + "].position"), 
			rgbDiffuse: gl.getUniformLocation (this.program, "uLights[" + i + "].rgbDiffuse"), 
			rgbSpecular: gl.getUniformLocation (this.program, "uLights[" + i + "].rgbSpecular") 
		}; 
	} 
}; 

PhongProgram.prototype.__loadDummyTexturesToSupressWarningsOnTexturelessGeometries = function () { 
	var gl = this.gl; 
	var img = new Uint8Array ([255, 0, 0, 255]); 
	var tex = gl.createTexture (); 
	gl.bindTexture (gl.TEXTURE_2D, tex); 
	gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, img); 
	// Response to this issue: https://github.com/melonjs/melonJS/issues/827
	for (var i = 0; i < 4; i++) { // 4, or whatever other max. textures 
		gl.activeTexture (gl["TEXTURE" + i]); 
		gl.bindTexture (gl.TEXTURE_2D, tex); 
	} 
}; 

PhongProgram.prototype.__getLocations = function () { 
	this.__getSkeletonShaderLocations (); 
	this.__getMaterialShaderLocations (); 
	this.__enableAttributeArrays (); 
}; 

PhongProgram.prototype.isReady = function () { 
	return this.programReady; 
}; 

PhongProgram.prototype.getProgram = function () { 
	return this.program; 
}; 

PhongProgram.prototype.loadShaders = function (vertex_shader_url, fragment_shader_url) { 
	var me = this; 
	var gl = this.gl; 
	var progress = { loaded: 0, total: 2 }; 
	var ie = typeof (XMLHttpRequest) == "undefined"; 
	var xhr1 = ie ? new ActiveXObject ("Microsoft.XMLHTTP") : new XMLHttpRequest (); 
	var xhr2 = ie ? new ActiveXObject ("Microsoft.XMLHTTP") : new XMLHttpRequest (); 
	var done = function () { 
		me.program = gl.createProgram (); 
		gl.attachShader (me.program, me.vertexShader); 
		gl.attachShader (me.program, me.fragmentShader); 
		gl.linkProgram (me.program); 
		var success = gl.getProgramParameter (me.program, gl.LINK_STATUS); 
		if (!success) { 
			throw "Error linking program (vertex " + vertex_shader_url + ", fragment " + fragment_shader_url + "): \n" + gl.getProgramInfoLog (me.program); 
		} 
		me.__getLocations (); 
		me.__loadDummyTexturesToSupressWarningsOnTexturelessGeometries (); 
		me.programReady = true; 
		if (typeof (me.onmaterialload) == "function") 
			me.onmaterialload (me); 
		delete me.onmaterialload; 
	}; 
	xhr1.open ("GET", vertex_shader_url); 
	xhr2.open ("GET", fragment_shader_url); 
	xhr1.onreadystatechange = function () { 
		if (this.readyState != 4) return; 
		if (this.status == 200) { 
			var shader = gl.createShader (gl.VERTEX_SHADER); 
			gl.shaderSource (shader, this.responseText); 
			gl.compileShader (shader); 
			var success = gl.getShaderParameter (shader, gl.COMPILE_STATUS); 
			if (!success) { 
				throw "Error compiling vertex shader (material " + vertex_shader_url + "): \n" + gl.getShaderInfoLog (shader); 
			} 
			me.vertexShader = shader; 
			progress.loaded++; 
			if (progress.loaded == progress.total) 
				done (); 
		} else { 
			console.log ("Problem loading " + vertex_shader_url + "; status: " + this.status); 
		} 
	}; 
	xhr2.onreadystatechange = function () { 
		if (this.readyState != 4) return; 
		if (this.status == 200) { 
			var shader = gl.createShader (gl.FRAGMENT_SHADER); 
			var source = this.responseText; 
			gl.shaderSource (shader, source); 
			gl.compileShader (shader); 
			var success = gl.getShaderParameter (shader, gl.COMPILE_STATUS); 
			if (!success) { 
				throw "Error compiling fragment shader (material " + fragment_shader_url + "): \n" + gl.getShaderInfoLog (shader); 
			} 
			me.fragmentShader = shader; 
			progress.loaded++; 
			if (progress.loaded == progress.total) 
				done (); 
		} else { 
			console.log ("Problem loading " + fragment_shader_url + "; status: " + this.status); 
		} 
	}; 
	xhr1.send (); 
	xhr2.send (); 
}; 

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
////////////////////////////////// Geometry methods: ////////////////////////////////////////////////////////////////////////// 
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 

PhongProgram.prototype.setProjection = function (matrix) { 
	gl.uniformMatrix4fv (this.u_projection, false, PhongProgram.makeFloatArray (transpose (matrix))); 
}; 
PhongProgram.prototype.setModelView = function (matrix) { 
	gl.uniformMatrix4fv (this.u_model_view, false, PhongProgram.makeFloatArray (transpose (matrix))); 
}; 

PhongProgram.prototype.loadSkeleton = function (skeleton) { 
	// TODO: Calculate bone matrices, and then send them to the GPU. 
}; 

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
////////////////////////////////// Material methods: ////////////////////////////////////////////////////////////////////////// 
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 

PhongProgram.prototype.hasTexture = function (url) { 
	return typeof (this.textures[url]) == "object"; // Or != null, or whatever. 
}; 
PhongProgram.prototype.addTexture = function (url, img) { 
	var gl = this.gl; 
	var texID = gl.createTexture (); 
	// Load texture: 
	gl.bindTexture (gl.TEXTURE_2D, texID); 
	gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); 
	gl.generateMipmap (gl.TEXTURE_2D); 
	// Set parameters: 
	gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR); 
	gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); 
	// Save this texture ID to our program object: 
	this.textures[url] = { texID: texID }; 
}; 

PhongProgram.prototype.use = function () { 
	this.gl.useProgram (this.program); 
}; 

PhongProgram.prototype.__isTexture = function (obj) { 
	return typeof (obj) != "undefined" && (typeof (obj.url) == "string" || typeof (obj.src) == "string") && typeof (obj.ready) == "boolean"; 
}; 
PhongProgram.prototype.__setTexture = function (texSamplerLocation, texIndex, obj) { 
	var gl = this.gl; 
	if (!obj.ready) return; // Can't set texture that hasn't loaded yet. 
	if (!this.hasTexture (obj.url || obj.src)) this.addTexture (obj.url || obj.src, obj.img || obj); 
	gl.activeTexture (gl["TEXTURE" + texIndex]); 
	gl.bindTexture (gl.TEXTURE_2D, this.textures[obj.url || obj.src].texID); 
	gl.uniform1i (texSamplerLocation, texIndex); 
}; 
PhongProgram.prototype.__setColor = function (colorLocation, obj) { 
	if (typeof (obj) != "object") { 
		console.log ("PhongProgram::__setColor (): Provided parameter 2 is not an object. Parameter: " + obj); 
	} else if (obj.length != 4 && obj.length != 3) { 
		console.log ("PhongProgram::__setColor (): Provided parameter 2 is not of length 3 or 4. Parameter: " + obj); 
	} else if (typeof (obj[0]) != "number" || typeof (obj[1]) != "number" || typeof (obj[2]) != "number" || (obj.length == 4 && typeof (obj[3]) != "number")) { 
		console.log ("PhongProgram::__setColor (): Provided parameter 2 has elements that are not numbers. Parameter: " + obj); 
	} else if (obj[0] < 0 || obj[0] > 1 || obj[1] < 0 || obj[1] > 1 || obj[2] < 0 || obj[2] > 1 || 
			   (obj.length == 4 && (obj[3] < 0 || obj[3] > 1))) { 
		console.log ("PhongProgram::__setColor (): Provided parameter 2 has elements that are out of range (allowed: 0.0 to 1.0). Parameter: " + obj); 
	} else { 
		// All good! Send this to the GPU: 
		var color = obj.length == 4 ? obj : new Float32Array ([obj[0], obj[1], obj[2], 1]); 
		this.gl.uniform4fv (colorLocation, color); 
	} 
}; 

PhongProgram.prototype.setAmbient = function (obj) { 
	var usingTex = this.__isTexture (obj); 
	this.gl.uniform1i (this.uAmbient_usingTexture, usingTex ? 1 : 0); 
	if (usingTex) this.__setTexture (this.uAmbient_texture, 0, obj); 
	else this.__setColor (this.uAmbient_color, obj); 
}; 
PhongProgram.prototype.setDiffuse = function (obj) { 
	var usingTex = this.__isTexture (obj); 
	this.gl.uniform1i (this.uDiffuse_usingTexture, usingTex ? 1 : 0); 
	if (usingTex) this.__setTexture (this.uDiffuse_texture, 1, obj); 
	else this.__setColor (this.uDiffuse_color, obj); 
}; 
PhongProgram.prototype.setSpecular = function (obj) { 
	var usingTex = this.__isTexture (obj); 
	this.gl.uniform1i (this.uSpecular_usingTexture, usingTex ? 1 : 0); 
	if (usingTex) this.__setTexture (this.uSpecular_texture, 2, obj); 
	else this.__setColor (this.uSpecular_color, obj); 
}; 
PhongProgram.prototype.setShininess = function (shininess) { 
	if (typeof (shininess) != "number") { 
		console.log ("PhongProgram::setShininess (): The provided shininess is not a number! Shininess: " + shininess); 
		return; 
	} 
	this.gl.uniform1f (this.uShininess, shininess); 
}; 

PhongProgram.prototype.setGlobalAmbientIntensity = function (rgbIntensity) { 
	var obj = rgbIntensity; 
	if (typeof (obj) != "object") { 
		console.log ("PhongProgram::setGlobalAmbientIntensity (): Provided parameter is not an object. Parameter: " + obj); 
	} else if (obj.length != 4 && obj.length != 3) { 
		console.log ("PhongProgram::setGlobalAmbientIntensity (): Provided parameter is not of length 3 or 4. Parameter: " + obj); 
	} else if (typeof (obj[0]) != "number" || typeof (obj[1]) != "number" || typeof (obj[2]) != "number" || (obj.length == 4 && typeof (obj[3]) != "number")) { 
		console.log ("PhongProgram::setGlobalAmbientIntensity (): Provided parameter has elements that are not numbers. Parameter: " + obj); 
	} else if (obj[0] < 0 || obj[0] > 1 || obj[1] < 0 || obj[1] > 1 || obj[2] < 0 || obj[2] > 1 || 
			   (obj.length == 4 && (obj[3] < 0 || obj[3] > 1))) { 
		console.log ("PhongProgram::setGlobalAmbientIntensity (): Provided parameter has elements that are out of range (allowed: 0.0 to 1.0). Parameter: " + obj); 
	} else { 
		this.gl.uniform4fv (this.uIntensityAmbient, rgbIntensity); 
	} 
}; 

PhongProgram.prototype.setLightCount = function (count) { 
	if (typeof (count) != "number") { 
		console.log ("PhongProgram::setLightCount (): Count parameter is not a number: " + count); 
		return; 
	} 
	this.gl.uniform1i (this.uLightCount, count); 
}; 

PhongProgram.prototype.setLightPosition = function (index, position) { 
	var obj = position; 
	if (typeof (obj) == "object" && obj.length == 4) { 
		obj = [obj[0], obj[1], obj[2]]; // Truncate this to a vec3 if it's a vec4 input. 
	} 
	if (typeof (obj) != "object") { 
		console.log ("PhongProgram::setLightPosition (): Provided parameter is not an object. Parameter: " + obj); 
	} else if (obj.length != 3) { 
		console.log ("PhongProgram::setLightPosition (): Provided parameter is not of length 3. Parameter: " + obj); 
	} else if (typeof (obj[0]) != "number" || typeof (obj[1]) != "number" || typeof (obj[2]) != "number" || (obj.length == 4 && typeof (obj[3]) != "number")) { 
		console.log ("PhongProgram::setLightPosition (): Provided parameter has elements that are not numbers. Parameter: " + obj); 
	} else { 
		this.gl.uniform3fv (this.uLights[index].position, obj); 
	} 
}; 
PhongProgram.prototype.setLightDiffuse = function (index, rgbDiffuse) { 
	var obj = rgbDiffuse; 
	if (typeof (obj) != "object") { 
		console.log ("PhongProgram::setLightDiffuse (): Provided parameter is not an object. Parameter: " + obj); 
	} else if (obj.length != 3) { 
		console.log ("PhongProgram::setLightDiffuse (): Provided parameter is not of length 3. Parameter: " + obj); 
	} else if (typeof (obj[0]) != "number" || typeof (obj[1]) != "number" || typeof (obj[2]) != "number" || (obj.length == 4 && typeof (obj[3]) != "number")) { 
		console.log ("PhongProgram::setLightDiffuse (): Provided parameter has elements that are not numbers. Parameter: " + obj); 
	} else if (obj[0] < 0 || obj[0] > 1 || obj[1] < 0 || obj[1] > 1 || obj[2] < 0 || obj[2] > 1 || 
			   (obj.length == 4 && (obj[3] < 0 || obj[3] > 1))) { 
		console.log ("PhongProgram::setLightDiffuse (): Provided parameter has elements that are out of range (allowed: 0.0 to 1.0). Parameter: " + obj); 
	} else { 
		this.gl.uniform3fv (this.uLights[index].rgbDiffuse, rgbDiffuse); 
	} 
}; 
PhongProgram.prototype.setLightSpecular = function (index, rgbSpecular) { 
	var obj = rgbSpecular; 
	if (typeof (obj) != "object") { 
		console.log ("PhongProgram::setLightSpecular (): Provided parameter is not an object. Parameter: " + obj); 
	} else if (obj.length != 3) { 
		console.log ("PhongProgram::setLightSpecular (): Provided parameter is not of length 3. Parameter: " + obj); 
	} else if (typeof (obj[0]) != "number" || typeof (obj[1]) != "number" || typeof (obj[2]) != "number" || (obj.length == 4 && typeof (obj[3]) != "number")) { 
		console.log ("PhongProgram::setLightSpecular (): Provided parameter has elements that are not numbers. Parameter: " + obj); 
	} else if (obj[0] < 0 || obj[0] > 1 || obj[1] < 0 || obj[1] > 1 || obj[2] < 0 || obj[2] > 1 || 
			   (obj.length == 4 && (obj[3] < 0 || obj[3] > 1))) { 
		console.log ("PhongProgram::setLightSpecular (): Provided parameter has elements that are out of range (allowed: 0.0 to 1.0). Parameter: " + obj); 
	} else { 
		this.gl.uniform3fv (this.uLights[index].rgbSpecular, rgbSpecular); 
	} 
}; 

PhongProgram.BLACK = vec4 (0, 0, 0, 1); // A constant for BLACK color, useful in loadMaterialProperties () for undefined things. 
PhongProgram.prototype.loadMaterialProperties = function (material) { 
	if (!this.isReady ()) return; // Can't load things into a program that's not ready yet. 
	if (!material) { 
		console.log ("PhongProgram::loadMaterialProperties (): Material is null or undefined; setting all colors to black."); 
		console.log ("Hint: If you're using DaeModel and loading a material-less model, use DaeModel::setDefaultMaterial (). "); 
		this.setAmbient (PhongProgram.BLACK); 
		this.setDiffuse (PhongProgram.BLACK); 
		this.setSpecular (PhongProgram.BLACK); 
		return; 
	} 
	if (material.ambient) this.setAmbient (material.ambient); 
	else { 
		var arr = []; 
		for (var i in material) arr.push (i); 
		console.log ("PhongProgram::loadMaterialProperties (): Material's ambient property undefined; defaulting to black. Material: " + material + "; Properties: " + arr); 
		this.setAmbient (PhongProgram.BLACK); 
	} 
	if (material.diffuse) this.setDiffuse (material.diffuse); 
	else { 
		var arr = []; 
		for (var i in material) arr.push (i); 
		console.log ("PhongProgram::loadMaterialProperties (): Material's diffuse property undefined; defaulting to black. Material: " + material + "; Properties: " + arr); 
		this.setDiffuse (PhongProgram.BLACK); 
	} 
	if (material.specular) { 
		this.setSpecular (material.specular); 
		this.setShininess (material.shininess); 
	} else { 
		// Log that we'll use default: 
		var arr = []; 
		for (var i in material) arr.push (i); 
		console.log ("PhongProgram::loadMaterialProperties (): Material's specular property undefined; defaulting to black. Material: " + material + "; Properties: " + arr); 
		// Load the default: 
		this.setSpecular (PhongProgram.BLACK); 
		this.setShininess (1); 
	} 
}; 

