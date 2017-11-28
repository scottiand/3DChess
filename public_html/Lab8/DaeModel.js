// Ruvim Kondratyev 
// November 2017 
// Professor Orr's Computer Graphics 
// Lab 8: Final Project 

// DaeModel 
// 
// A class for VERY basic importing of a character rig in the COLLADA (.DAE) format. 
// 

function DaeModel () { 
	this.images = {}; // HashMap like: images["id"] = new Image (); 
	this.materialEffects = {}; 
	this.materialDefines = {}; 
	this.geometries = {}; 
	this.controllers = {}; 
	this.mtlDefault = null; 
	this.modelURL = ""; // The URL from which this DAE was loaded. Useful for later determining where to get relative-path images from. 
} 

DaeModel.prototype.grab = function (dae_url, onloadcallback, onimagesloaded) { 
	var me = this; 
	var http = typeof (XMLHttpRequest) != "undefined" ? new XMLHttpRequest () : new ActiveXObject ("Microsoft.XMLHTTP"); 
	http.open ("GET", dae_url); 
	http.onreadystatechange = function () { 
		if (http.readyState != 4) return; 
		if (http.status == 200) { 
			var xdoc = http.responseXML; 
			// Debug: 
			window.h1 = http; 
			window.x1 = xdoc; 
			// Load model: 
			me.modelURL = dae_url; 
			// me.loadImages (xdoc, xdoc.getElementsByTagName ("library_images"), onimagesloaded);
			// me.loadEffects (xdoc, xdoc.getElementsByTagName ("library_effects"));
			// me.loadMaterials (xdoc, xdoc.getElementsByTagName ("library_materials"));
			// me.loadGeometries (xdoc, xdoc.getElementsByTagName ("library_geometries"));
			// me.loadControllers (xdoc, xdoc.getElementsByTagName ("library_controllers"));
			if (typeof (onloadcallback) == "function") 
				onloadcallback (me); 
		} else { 
			console.log ("Error loading DAE file at " + dae_url + "\nHTTP Status Code: " + http.status); 
		} 
	}; 
	http.send (); 
	return this; 
}; 

DaeModel.prototype.loadIntoProgram = function (phongProgram) { 
	phongProgram.use (); 
	for (var id in this.geometries) { 
		var geo = this.geometries[id]; 
		var geoID = this.modelURL + "#" + id; 
		phongProgram.initBuffers (geoID, geo); 
	} 
}; 
DaeModel.prototype.drawInProgram = function (phongProgram) { 
	for (var id in this.geometries) { 
		var geo = this.geometries[id]; 
		var geoID = this.modelURL + "#" + id; 
		phongProgram.loadMaterialProperties (geo.material); 
		phongProgram.drawBuffers (geoID); // Leave out parameter 2, so that it uses the default of triangles. 
	} 
}; 

DaeModel.prototype.getMaterial = function (materialID) { 
	return this.materialEffects[this.materialDefines[materialID].effect.split ("#") [1]]; 
}; 

DaeModel.Source = function () { 
	this.data = null; 
	this.params = null; 
	this.count = 0; 
	this.stride = 0; 
}; 
DaeModel.Source.prototype.getAttribute = function (index, parts) { 
	var idx = index * this.stride; 
	var result = new Float32Array (parts.length); 
	for (var i = 0; i < parts.length; i++) { 
		var number = parseFloat (parts[i]); 
		if (number == parts[i]) { 
			// Provided in 'parts' was just a number string; use that ... 
			result[i] = number; 
			continue; 
		} 
		var calledFor = parts[i].toUpperCase (); 
		for (var j = 0; j < this.params.length; j++) { 
			var pName = this.params[j].name; 
			if (pName.toUpperCase () == calledFor) { 
				result[i] = this.data[idx + j]; 
			} 
		} // end for 
	} 
	return result; 
}; 
DaeModel.getSource = function (xDoc, source_uri) { 
	var id = source_uri.split ("#") [1]; 
	if (id) { 
		var srcElem = xDoc.getElementById (id); 
		if (srcElem.tagName == "source") { 
			var result = new this.Source (); 
			var tech_comm = srcElem.getElementsByTagName ("technique_common") [0]; 
			if (!tech_comm) { 
				console.log ("DaeModel::getSource (): <technique_common> was not found inside node <" + srcElem.tagName + ">"); 
				return null; 
			} 
			var accessor = tech_comm.getElementsByTagName ("accessor") [0]; 
			if (!accessor) { 
				console.log ("DaeModel::getSource (): <accessor> was not found inside node <" + srcElem.tagName + ">"); 
				return null; 
			} 
			var source = xDoc.getElementById ((accessor.getAttribute ("source") + "").split ("#") [1]); 
			if (!source) { 
				console.log ("DaeModel::getSource (): source [" + accessor.getAttribute ("source") + 
					"] was not found; this is for <" + srcElem.tagName + "> [" + source_uri + "]"); 
				return null; 
			} 
			var data = null; 
			if (source.tagName == "float_array") 
				data = DaeModel.makeFloatArray (source.textContent); 
			else if (source.tagName == "int_array") 
				data = DaeModel.makeIntArray (source.textContent); 
			else { 
				console.log ("DaeModel::getSource (): Unsupported (unimplemented) data type found: <" + source.tagName + "> [" + 
					accessor.getAttribute ("source") + "]"); 
				return null; 
			} 
			result.data = data; 
			result.params = []; // Set params to be an array. 
			result.count = parseInt (accessor.getAttribute ("count")); 
			result.stride = parseInt (accessor.getAttribute ("stride")); 
			var paramNodes = accessor.getElementsByTagName ("param"); 
			for (var i = 0; i < paramNodes.length; i++) { 
				var node = paramNodes[i]; 
				result.params.push ({ 
					name: node.getAttribute ("name"), 
					type: node.getAttribute ("type") 
				}); 
			} 
			return result; 
		} else { 
			var inputs = srcElem.getElementsByTagName ("input"); 
			if (inputs.length == 0) { 
				console.log ("DaeModel::getSource (): Could not find any <input>s inside <" + srcElem.tagName + "> [" + source_uri + "]"); 
				return null; 
			} 
			var input = inputs[0]; 
			var s = input.getAttribute ("source"); 
			return this.getSource (xDoc, s); 
		} 
	} else { 
		console.log ("DaeModel::getSource (): URI type not yet supported: [" + source_uri + "]"); 
		return null; 
	} 
}; 

DaeModel.prototype.loadImages = function (xDoc, xImageLibraries, onloadcallback) { 
	var modelURL = this.modelURL; 
	var tmp = modelURL.split ("/"); 
	tmp.pop (); 
	var baseURL = tmp.join ("/"); 
	var progress = { 
		loaded: 0, 
		total: 0 
	}; 
	for (var i = 0; i < xImageLibraries.length; i++) { 
		var library = xImageLibraries[i]; 
		var entries = library.getElementsByTagName ("image"); 
		for (var j = 0; j < entries.length; j++) { 
			var entry = entries[j]; 
			var id = entry.getAttribute ("id"); 
			var name = entry.getAttribute ("name"); 
			var urlNode = entry.getElementsByTagName ("init_from") [0]; 
			if (urlNode) { 
				var me = this; 
				(function () { 
					var url = urlNode.textContent; 
					if (url.charAt (0) != "/" && !url.startsWith ("http:") && !url.startsWith ("https:") && 
							!url.startsWith ("data:") && 
							!url.startsWith ("file:") && 
							url.charAt (1) != ":") { 
						// This might be a path relative to where the DAE file is; convert it to something we can download: 
						url = baseURL + "/" + url; 
					} 
					var info = me.images[id] = { 
						what: "image", 
						name: name, 
						ready: false, 
						src: url, 
						img: new Image (), 
						ready: false 
					}; 
					progress.total++; 
					info.img.src = ""; 
					info.img.onload = function () { 
						info.ready = true; 
						progress.loaded++; 
						if (progress.loaded == progress.total && typeof (onloadcallback) == "function") 
							onloadcallback (me); 
					}; 
					info.img.src = url; 
				}) (); 
			} else { 
				console.log ("DaeModel::loadImages (): Could not find an <init_from> inside <" + entry.tagName + "> #" + id); 
			} 
		} 
	} 
}; 

DaeModel.parsePhongEffect = function (xDoc, daeImages, fxParams, fxXmlNode) { 
	if (!fxXmlNode) return null; 
	var value; 
	if (value = fxXmlNode.getElementsByTagName ("float") [0]) { 
		return DaeModel.makeFloatArray (value.textContent.trim ()) [0]; // Just return the float value as a number. 
	} else if (value = fxXmlNode.getElementsByTagName ("color") [0]) { 
		var result = DaeModel.makeFloatArray (value.textContent.trim ()); 
		result.what = "color"; 
		return result; 
	} else if (value = fxXmlNode.getElementsByTagName ("texture") [0]) { 
		var texture = value.getAttribute ("texture"); 
		// var texCoord = value.getAttribute ("texcoord"); // Not sure what the 'texcoord' attribute here is, but we'll just leave it for a future implementation. 
		var obj = fxParams[texture]; 
		// COLLADA is a bit complicated with finding the texture, so we have to traverse a chain of things before we get to the actual image: 
		while (obj && !obj.imgId) { 
			obj = fxParams[obj.srcId]; 
		} 
		// Check if we found the image or not: 
		if (!obj || !daeImages[obj.imgId]) { 
			// Not found. 
			var params = []; 
			for (var p in fxParams) params.push (p); 
			console.log ("DaeModel::parsePhongEffect (): Texture image not found; texture attribute: " + texture + "; available parameters: " + params); 
			return null; 
		} 
		// Return the image: 
		return daeImages[obj.imgId]; 
	} 
}; 
DaeModel.prototype.loadEffects = function (xDoc, xEffectLibraries) { 
	for (var i = 0; i < xEffectLibraries.length; i++) { 
		var library = xEffectLibraries[i]; 
		var entries = library.getElementsByTagName ("effect"); 
		for (var j = 0; j < entries.length; j++) { 
			var entry = entries[j]; 
			var id = entry.getAttribute ("id"); 
			var common = entry.getElementsByTagName ("profile_COMMON") [0]; 
			if (common) { 
				var params = {}; 
				var paramNodes = common.getElementsByTagName ("newparam"); 
				for (var ip = 0; ip < paramNodes.length; ip++) { 
					var pNode = paramNodes[ip]; 
					var sid = pNode.getAttribute ("sid"); 
					var surf = pNode.getElementsByTagName ("surface") [0]; 
					var samp = pNode.getElementsByTagName ("sampler2D") [0]; 
					if (surf) { 
						params[sid] = { 
							what: "surface", 
							type: surf.getAttribute ("type"), 
							imgId: (surf.getElementsByTagName ("init_from") [0] || {}).textContent, 
							debugXmlNode: surf 
						}; 
					} else if (samp) { 
						params[sid] = { 
							what: "sampler2D", 
							srcId: (samp.getElementsByTagName ("source") [0] || {}).textContent, 
							debugXmlNode: samp 
						}; 
					} else console.log ("DaeModel::loadEffects (): No recognized parameters found inside <profile_COMMON> in <" + entry.tagName + "> #" + id); 
				} 
				window.debug_fx_params = params; 
				var techNodes = common.getElementsByTagName ("technique"); 
				for (var it = 0; it < techNodes.length; it++) { 
					var tNode = techNodes[it]; 
					var phongNode = tNode.getElementsByTagName ("phong") [0]; 
					if (phongNode) { 
						var ambient = DaeModel.parsePhongEffect (xDoc, this.images, params, phongNode.getElementsByTagName ("ambient") [0]); 
						var diffuse = DaeModel.parsePhongEffect (xDoc, this.images, params, phongNode.getElementsByTagName ("diffuse") [0]); 
						var specular = DaeModel.parsePhongEffect (xDoc, this.images, params, phongNode.getElementsByTagName ("specular") [0]); 
						var shininess = DaeModel.parsePhongEffect (xDoc, this.images, params, phongNode.getElementsByTagName ("shininess") [0]); 
						// Note this is going to overwrite materialEffects[id] 
						this.materialEffects[id] = { 
							ambient: ambient, 
							diffuse: diffuse, 
							specular: specular, 
							shininess: shininess 
						}; 
					} else { 
						console.log ("DaeModel::loadEffects (): Could not find a <phong> in <" + entry.tagName + "> #" + id); 
					} 
				} 
			} else { 
				console.log ("DaeModel::loadEffects (): Could not find an <profile_COMMON> inside <" + entry.tagName + "> #" + id); 
			} 
		} 
	} 
}; 
DaeModel.prototype.loadMaterials = function (xDoc, xMaterialLibraries) { 
	for (var i = 0; i < xMaterialLibraries.length; i++) { 
		var library = xMaterialLibraries[i]; 
		var mtlNodes = library.getElementsByTagName ("material"); 
		for (var j = 0; j < mtlNodes.length; j++) { 
			var entry = mtlNodes[j]; 
			var id = entry.getAttribute ("id"); 
			var name = entry.getAttribute ("name"); 
			var effects = entry.getElementsByTagName ("instance_effect"); 
			var effect0 = effects[0]; 
			if (effect0) { 
				this.materialDefines[id] = { 
					name: name, 
					effect: effect0.getAttribute ("url") 
				}; 
			} else { 
				console.log ("DaeModel::loadMaterials (): Could not find an <instance_effect> inside <" + entry.tagName + "> #" + id); 
			} 
		} 
	} 
}; 
DaeModel.prototype.loadGeometries = function (xDoc, xGeometryLibraries) { 
	for (var i = 0; i < xGeometryLibraries.length; i++) { 
		var library = xGeometryLibraries[i]; 
		for (var j = 0; j < library.childNodes.length; j++) { 
			var entry = library.childNodes[j]; 
			if (!entry || typeof (entry.getAttribute) != "function") 
				continue; 
			var id = entry.getAttribute ("id"); 
			if (entry.tagName == "geometry") { 
				var mesh = entry.getElementsByTagName ("mesh") [0]; 
				if (mesh) { 
					var primitive = { 
						vertices: [], 
						normals: [], 
						texCoords: [] 
					}; // We'll be creating a primitive. 
					// Just parsing the <mesh> should be OK for importing simple objects from Blender 2.78C. 
					// As per the COLLADA 1.4 specification, the <mesh> can have "0 or more" of <polylist>, <lines>, etc.; 
					// So, technically we should be using a 'for' loop to iterate through all the <polylist> children ... 
					// But I'll leave that for a future improvement. 
					var polylist = mesh.getElementsByTagName ("polylist") [0]; 
					// We will only support the <polylist> for now; later, we can add <polygons>, <triangles>, <lines>, etc., but for now it's simple. 
					// Actually, <triangles> is pretty similar to <polylist>, but with all the polygon sizes as 3. Let's do that too: 
					var shape = polylist; 
					var sType = "polylist"; 
					if (!shape) { 
						shape = mesh.getElementsByTagName ("triangles") [0]; 
						sType = "triangles"; 
					} 
					if (shape) { 
						// Load material: 
						var materialID = shape.getAttribute ("material"); 
							primitive.materialID = materialID; 
							if (materialID) { 
								primitive.material = this.getMaterial (materialID); 
							} else primitive.material = this.mtlDefault; // Load default material. 
						// Get some information about the <polylist>: 
						var polyCount = shape.getAttribute ("count"); 
						var vertexCountsPerPoly = shape.getElementsByTagName ("vcount") [0]; 
						var polyVertexIndices = shape.getElementsByTagName ("p") [0]; 
						// Find all the <input> tags inside this <polylist> (i.e., where are we getting the attribute data from?): 
						var inputs = shape.getElementsByTagName ("input"); 
						var maxOffset = 0; // Let's see what number the offsets go up to (which will be our "stride" for the <p> element here ...). 
						var inputData = { 
							vertex: null, 
							normal: null, 
							texCoord: null 
						}; 
						window.debug_i = inputData; 
						// Find the <input>s that we recognize, and also find what's the maximum "offset": 
						for (var ofsIdx = 0; ofsIdx < inputs.length; ofsIdx++) { 
							var offset = parseInt (inputs[ofsIdx].getAttribute ("offset")); 
							var set = parseInt (inputs[ofsIdx].getAttribute ("set")); 
							var source = inputs[ofsIdx].getAttribute ("source"); 
							var type = inputs[ofsIdx].getAttribute ("semantic"); 
							var data = { offset: offset, source: DaeModel.getSource (xDoc, source) }; 
							if (type == "VERTEX") { 
								inputData.vertex = data; 
							} else if (type == "NORMAL") { 
								inputData.normal = data; 
							} else if (type == "TEXCOORD") { 
								inputData.texCoord = data; 
							} 
							if (offset > maxOffset) 
								maxOffset = offset; 
						} 
						if (!inputData.vertex) 
							throw "DaeModel::loadGeometries (): the input data must specify vertex positions"; 
						if (!inputData.normal) 
							primitive.normals = null; 
						if (!inputData.texCoord) 
							primitive.texCoords = null; 
						// TODO: These 'if' statements below are empty; for the future, implement the cases where <vcount> and <p> are missing. 
						// They are optional elements as per the COLLADA 1.4 specification, so they *may* be missing depending on what software exported this DAE. 
						var vCounts, pIndex; 
						if (!vertexCountsPerPoly) { 
							// Fill this with all 3s (triangles)? 
							if (sType == "triangles") { 
								vCounts = new Int32Array (polyCount); 
								for (var iPoly = 0; iPoly < polyCount; iPoly++) { 
									vCounts[iPoly] = 3; 
								} 
							} else vCounts = null; 
						} else vCounts = DaeModel.makeIntArray (vertexCountsPerPoly.textContent); 
						if (!polyVertexIndices) { 
							// Fill this with indices 0 to polyCount? 
							pIndex = null; 
						} else pIndex = DaeModel.makeIntArray (polyVertexIndices.textContent); 
						// Now we load the vertices, normals, and texture coordinates (actual data): 
						if (vCounts && pIndex) { 
							var strideVtx = maxOffset + 1; // This is what we need the max (offset) for. 
							var idx = 0; 
							var iVtx = 0; 
							for (var iPoly = 0; iPoly < vCounts.length; iPoly++) { 
								var vCount = vCounts[iPoly]; 
								for (iVtx = 0; iVtx < vCount && iVtx < 3; iVtx++) { // We cap the maximum vertex count to 3; for simplicity; COLLADA does support polygons though. 
									// Grab indices: 
									var vIndex = pIndex[idx + iVtx * strideVtx + inputData.vertex.offset]; 
									var nIndex = inputData.normal ? pIndex[idx + iVtx * strideVtx + inputData.normal.offset] : 0; 
									var tIndex = inputData.texCoord ? pIndex[idx + iVtx * strideVtx + inputData.texCoord.offset] : 0; 
									// Grab the data: 
									var vData = inputData.vertex.source.getAttribute (vIndex, ["x", "y", "z", 1]); 
									var nData = inputData.normal ? inputData.normal.source.getAttribute (nIndex, ["x", "y", "z"]) : null; 
									var tData = inputData.texCoord ? inputData.texCoord.source.getAttribute (tIndex, ["s", "t"]) : null; 
									// Add the data to our primitive's buffer: 
									primitive.vertices.push (vData); 
									if (nData) 
										primitive.normals.push (nData); 
									if (tData) 
										primitive.texCoords.push (tData); 
								} 
								idx += vCount * strideVtx; 
							} 
						} else { 
							// One or both of the above is not found; 
							// my guess is that this would mean we would 
							// go use the <input>s' data in order from 
							// 0 to N, but I'll leave that for later 
							// to implement. 
						} 
					} else { 
						console.log ("DaeModel::loadGeometries (): <polylist> element not found; probably this <mesh> (inside geometry [#" + id + "]) " + 
							"uses a different feature of COLLADA than what we implement."); 
					} 
				} else { 
					// Then look for either <convex_mesh> or <spline>; 
					// leave this for future expansion, for now. 
					console.log ("DaeModel::loadGeometries (): <mesh> element not found; probably this model uses a different feature of COLLADA than what we implement. " + 
						"Geometry [#" + id + "]. " + 
						"Please try simplifying your export settings. "); 
				} 
				primitive.numVertices = primitive.vertices.length; 
				primitive.numTriangles = primitive.numVertices / 3; 
				this.geometries[id] = primitive; 
			} 
		} 
	} 
}; 
DaeModel.prototype.setDefaultMaterial = function (material) { 
	this.mtlDefault = material; 
	for (var geo in this.geometries) { 
		if (!geo.material) geo.material = mtlDefault; 
	} 
}; 
DaeModel.prototype.loadControllers = function (xDoc, xControllerLibraries) { 
	
}; 

// Static methods: 
DaeModel.makeIntArray = function (source_dae_data) { 
	return new Int32Array (source_dae_data.trim ().split (/[ \t\r\n]+/g)); 
}; 
DaeModel.makeFloatArray = function (source_dae_data) { 
	return new Float32Array (source_dae_data.trim ().split (/[ \t\r\n]+/g)); 
}; 

