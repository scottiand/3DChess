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
    this.visualScenes = {};
    this.nodeLibrary = {};
    this.nodesByName = {};
    this.matrixCache = { count: 0, matrix: [mat4 ()], invBind: [mat4 ()], index: {/* holds maps of [Bone ID]->[index into 'matrix' array] */} };
    this.mtlDefault = null;
    this.modelURL = ""; // The URL from which this DAE was loaded. Useful for later determining where to get relative-path images from.
}

DaeModel.prototype.grab = function (dae_url, onloadcallback, onimagesloaded, opt_useJsArrays, opt_useVec4normals) {
    var me = this;
    var http = typeof (XMLHttpRequest) != "undefined" ? new XMLHttpRequest () : new ActiveXObject ("Microsoft.XMLHTTP");
    http.overrideMimeType('application/xml');
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
            me.loadImages (xdoc, xdoc.getElementsByTagName ("library_images"), onimagesloaded);
            me.loadEffects (xdoc, xdoc.getElementsByTagName ("library_effects"));
            me.loadMaterials (xdoc, xdoc.getElementsByTagName ("library_materials"));
            me.loadGeometries (xdoc, xdoc.getElementsByTagName ("library_geometries"), opt_useJsArrays, opt_useVec4normals);
            me.loadControllers (xdoc, xdoc.getElementsByTagName ("library_controllers"));
            me.loadVisualScenes (xdoc, xdoc.getElementsByTagName ("library_visual_scenes"));
            me.initBoneArray (); // Creates mappings for which matrix goes to which bone.
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
    for (var id in this.geometries) {
        var geo = this.geometries[id];
        var geoID = this.modelURL + "#" + id;
        for (var i = 0; i < geo.length; i++) {
            phongProgram.initGeometryBuffers (geoID + "[" + i + "]", geo[i]);
        }
    }
    for (var id in this.controllers) {
        var controller = this.controllers[id];
        var ctrlID = this.modelURL + "#" + id;
        var geoPlainID = controller.geometry_source.substring (1);
        var geo = this.geometries[geoPlainID];
        var totalVertices = 0;
        for (var j in geo) totalVertices += geo[j].numVertices;
        var flatArrays = DaeModel.prepareFlatWeightArrays (controller, totalVertices, this.matrixCache);
        phongProgram.initWeightBuffers (ctrlID, flatArrays.index, flatArrays.weight);
    }
};
DaeModel.prototype.drawInProgram = function (phongProgram) {
    phongProgram.setMatrixMode (PhongProgram.MM_MODELVIEW); // Just use modelview; no bones.
    for (var id in this.geometries) {
        var geo = this.geometries[id];
        var geoID = this.modelURL + "#" + id;
        this.__drawGeometry (phongProgram, geoID, geo);
    }
};
DaeModel.prototype.__drawGeometry = function (phongProgram, geoID, geo, opt_override_material) {
    for (var i = 0; i < geo.length; i++) {
        if (opt_override_material) phongProgram.loadMaterialProperties (opt_override_material);
        else phongProgram.loadMaterialProperties (geo[i].material);
        phongProgram.drawBuffers (geoID + "[" + i + "]"); // Leave out parameter 2, so that it uses the default of triangles.
    }
};
DaeModel.prototype.__findMaterial = function (targetMaterial, opt_debug_params) {
    var mtl = null;
    if (targetMaterial) {
        if (targetMaterial.charAt (0) == '#') {
            mtl = this.getMaterial (targetMaterial.substring (1));
            if (!mtl) {
                console.log ("DaeModel::__drawObject (): Node with ID [" + opt_debug_params.id + "] has item [" +
                    opt_debug_params.i + "] that has an <instance_material> that " +
                    "refers to material URL [" + targetMaterial + "] that was not found");
            }
        } else console.log ("DaeModel::__drawObject (): Node with ID [" + opt_debug_params.id + "] has item [" +
            opt_debug_params.i + "] that has an <instance_material> that " +
            "refers to an unsupported material URL [" + targetMaterial + "]");
    }
    return mtl;
};
DaeModel.prototype.__drawObject = function (phongProgram, sceneNode, sceneRoot) {
    var id = sceneNode.attr.id;
    var mv = this.matrixCache.matrix[this.matrixCache.index[id]];
    // Draw anything in the draw list:
    for (var i = 0; i < sceneNode.list.length; i++) {
        var item = sceneNode.list[i];
        if (item.type == "controller") {
            if (item.url.charAt (0) == '#') {
                var targetController = item.url.substring (1);
                if (!this.controllers[targetController]) {
                    console.log ("DaeModel::__drawObject (): Node with ID [" + id + "] has item [" + i + "] that refers to a controller with URL [" + item.url +
                        "], but this controller was not found");
                    continue;
                }
                var controllerUniqueID = this.modelURL + "#" + targetController;
                var controller = this.controllers[targetController];
                var geometryID;
                if (controller.geometry_source.charAt (0) == '#') {
                    geometryID = controller.geometry_source.substring (1);
                    if (!this.geometries[geometryID]) {
                        console.log ("DaeModel::__drawObject (): Controller [" + item.url + "] refers to a geometry [" + controller.geometry_source +
                            "], but this geometry was not found");
                        continue;
                    }
                } else console.log ("DaeModel::__drawObject (): Controller [" + item.url + "] uses an unsupported geometry URL [" + controller.geometry_source + "]");
                var geometry = this.geometries[geometryID];
                var mtl = this.__findMaterial (item.targetMaterial, {id:id, i:i});
                this.__copyInvBindMatrix (controller, sceneRoot, this.matrixCache);
                this.__sendInvBindToShader (phongProgram, this.matrixCache);
                phongProgram.setMatrixMode (PhongProgram.MM_SKELETON); // Allow skeleton mode.
                phongProgram.useWeightBuffer (controllerUniqueID); // Select weight attrib array.
                this.__drawGeometry (phongProgram, this.modelURL + "#" + geometryID, geometry, mtl);
            } else console.log ("DaeModel::__drawObject (): Node with ID [" + id + "] has item [" + i + "] that refers to a controller with unsupported URL: [" + item.url + "]");
        } else if (item.type == "geometry") {
            if (item.url.charAt (0) == '#') {
                var target = item.url.substring (1);
                if (!this.geometries[target]) {
                    console.log ("DaeModel::__drawObject (): Node with ID [" + id + "] has item [" + i + "] that refers to a geometry with URL [" + item.url +
                        "], but this geometry was not found");
                }
                var mtl = this.__findMaterial (item.targetMaterial, {id:id, i:i});
                phongProgram.setBoneMatrix (0, mv); // Send modelview to bone 0.
                phongProgram.setMatrixMode (PhongProgram.MM_BONE_0); // Use bone 0 for transforms.
                this.__drawGeometry (phongProgram, this.modelURL + "#" + target, this.geometries[target], mtl);
            } else console.log ("DaeModel::__drawObject (): Node with ID [" + id + "] has item [" + i + "] that refers to a geometry with unsupported URL: [" + item.url + "]");
        }
    }
    // Draw child nodes:
    for (var name in sceneNode) {
        if (name == "attr") continue;
        if (name == "list") continue;
        if (name == "debug") continue;
        var obj = sceneNode[name];
        this.__drawObject (phongProgram, obj, sceneRoot);
    }
};
DaeModel.prototype.drawVisualScene = function (phongProgram, modelViewMatrix, sceneName) {
    var scene = this.visualScenes[sceneName];
    if (!modelViewMatrix) modelViewMatrix = mat4 (); // Use identity.
    this.__calcSkeletonMatrix (modelViewMatrix, scene, this.matrixCache); // Calculate all bones.
    this.__sendBonesToShader (phongProgram, this.matrixCache);
    this.__drawObject (phongProgram, scene, scene); // Draw the scene.
};
DaeModel.prototype.drawAllScenes = function (phongProgram, modelViewMatrix) {
    for (var name in this.visualScenes) {
        this.drawVisualScene (phongProgram, modelViewMatrix, name);
    }
};

DaeModel.IDENTITY = mat4 ();
DaeModel.prototype.getMaterial = function (materialID) {
    return this.materialEffects[this.materialDefines[materialID].effect.split ("#") [1]];
};

DaeModel.prototype.initBoneArray = function () {
    for (var name in this.visualScenes) {
        this.__buildBoneArray (this.visualScenes[name], this.matrixCache);
    }
};
DaeModel.prototype.__buildBoneArray = function (sceneNode, saveMatrixTo) {
    var id = sceneNode.attr.id;
    var idx = saveMatrixTo.index[id];
    if (typeof (idx) != "number") {
        idx = saveMatrixTo.count;
        saveMatrixTo.index[id] = idx;
        saveMatrixTo.count++;
    }
    // Now do the child nodes:
    for (var name in sceneNode) {
        if (name == "attr") continue; // Don't do "attr" (which is a reserved name for our importer).
        if (name == "list") continue; // "list" is also a reserved name.
        if (name == "debug") continue;
        this.__buildBoneArray (sceneNode[name], saveMatrixTo);
    }
};
DaeModel.prototype.__calcSkeletonMatrix = function (modelViewMatrix, sceneNode, saveMatrixTo) {
    var mat = mult (modelViewMatrix, sceneNode.attr.matrix);
    var id = sceneNode.attr.id;
    var idx = saveMatrixTo.index[id];
    if (typeof (idx) != "number") throw "DaeModel::__calcSkeletonMatrix (): saveMatrixTo[" + id + "] is not a number. " +
    (saveMatrixTo.matrix.length > 1 ? "" : "Hint: did you remember to call initBoneArray ()?");
    saveMatrixTo.matrix[idx] = mat;
    // Now do the child nodes:
    for (var name in sceneNode) {
        if (name == "attr") continue; // Don't do "attr" (which is a reserved name for our importer).
        if (name == "list") continue; // "list" is also a reserved name.
        if (name == "debug") continue;
        this.__calcSkeletonMatrix (mat, sceneNode[name], saveMatrixTo);
    }
};
DaeModel.prototype.__copyInvBindMatrix = function (controller, sceneNode, saveMatrixTo) {
    var id = sceneNode.attr.id;
    var idx = saveMatrixTo.index[id];
    if (typeof (idx) != "number") throw "DaeModel::__copyInvBindMatrix (): saveMatrixTo[" + id + "] is not a number. " +
    (saveMatrixTo.matrix.length > 1 ? "" : "Hint: did you remember to call initBoneArray ()?");
    saveMatrixTo.invBind[idx] = controller.invBindMats[id] || DaeModel.IDENTITY;
    // Now child nodes:
    for (var name in sceneNode) {
        if (name == "attr") continue;
        if (name == "list") continue;
        if (name == "debug") continue;
        this.__copyInvBindMatrix (controller, sceneNode[name], saveMatrixTo);
    }
};
DaeModel.prototype.__sendBonesToShader = function (phongProgram, boneData) {
    if (boneData.count > phongProgram.u_bones.length)
        throw "DaeModel::__sendBonesToShader (): Number of bones exceeded; bones given: " + boneData.count + "; " +
        "bones allowed: " + phongProgram.u_bones.length + ". Consider upping the limit in the shader program.";
    // Send all the matrices to the GPU:
    for (var i = 0; i < boneData.count; i++) {
        phongProgram.setBoneMatrix (i, boneData.matrix[i]);
        // phongProgram.setBoneMatrix (i, DaeModel.IDENTITY);
    }
};

DaeModel.prototype.__sendInvBindToShader = function (phongProgram, boneData) {
    if (boneData.count > phongProgram.u_bones.length)
        throw "DaeModel::__sendInvBindToShader (): Number of bones exceeded; bones given: " + boneData.count + "; " +
        "bones allowed: " + phongProgram.u_bones.length + ". Consider upping the limit in the shader program.";
    // Send all the matrices to the GPU:
    for (var i = 0; i < boneData.count; i++) {
        phongProgram.setInvBindMatrix (i, boneData.invBind[i]);
    }
};

DaeModel.prepareFlatWeightArrays = function (controller, numVertices, boneData) {
    // var numVertices = controller.weights[controller.weights.length - 1].vertex + 1;
    var flat_boneIndexes = new Float32Array (4 * numVertices);
    var flat_boneWeights = new Float32Array (4 * numVertices);
    var v = 0;
    var w = 0;
    for (var i = 0; i < controller.weights.length; i++) {
        var weight = controller.weights[i];
        // If the weight is (almost) zero, skip it (who knows, maybe some software will export it with zero weights included?):
        if (weight.weight < 1e-4) continue; // It won't be noticeable anyway.
        // Check if we're still grabbing weights for that same vertex as before:
        if (weight.vertex != v) {
            // This is the next vertex; reset the component index 'w':
            v = weight.vertex;
            w = 0;
        }
        // Check to make sure that the component is not out of bounds (not >= 4):
        if (w >= 4) {
            // If it is out of bounds, choose a weight to replace:
            var to_replace = 4;
            for (var j = 0; j < 4 && to_replace == 4; j++) {
                if (flat_boneWeights[4 * v + j] > weight.weight) continue; // If this weight is not as important as that weight, don't replace with this weight.
                to_replace = j;
            }
            if (to_replace == 4) continue; // No more room for more influences. Can only do 4 influences maximum per vertex.
            // Otherwise, replace it!:
            w = to_replace; // So now we'll save over some less-important influence.
        }
        // Save the weight:
        flat_boneIndexes[4 * v + w] = boneData.index[weight.jointName];
        flat_boneWeights[4 * v + w] = weight.weight;
        w++; // Increment the component number.
    }
    return {
        index: flat_boneIndexes,
        weight: flat_boneWeights
    };
};

DaeModel.Source = function () {
    this.data = null;
    this.params = null;
    this.count = 0;
    this.stride = 0;
};
DaeModel.Source.prototype.getAttribute = function (index, parts, opt_part_size, opt_attribute_use_js_array) {
    var part_size = opt_part_size || 1; // How many numbers is one part that you grab?
    var idx = index * this.stride;
    var result = (this.data.length > 0 && typeof (this.data[0]) == "number" && !opt_attribute_use_js_array) ?
        new Float32Array (parts.length * part_size) : new Array (parts.length * part_size);
    var c = 0;
    for (var i = 0; i < parts.length; i++) {
        var number = parseFloat (parts[i]);
        if (number == parts[i]) {
            // Provided in 'parts' was just a number string; use that ...
            for (var k = 0; k < part_size; k++, c++)
                result[c] = number;
            continue;
        }
        var calledFor = parts[i].toUpperCase ();
        for (var j = 0; j < this.params.length; j++) {
            var pName = this.params[j].name;
            if (pName.toUpperCase () == calledFor) {
                for (var k = 0; k < part_size; k++, c++)
                    result[c] = this.data[idx + j + k];
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
            else if (source.tagName == "Name_array")
                data = DaeModel.makeStringArray (source.textContent);
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
            var result = [];
            for (var i = 0; i < inputs.length; i++) {
                var input = inputs[0];
                var s = input.getAttribute ("source");
                var source = this.getSource (xDoc, s);
                if (!source) return null;
                if (Array.isArray (source))
                    for (var j = 0; j < source.length; j++)
                        result.push (source[j]);
                else {
                    source.semantic = input.getAttribute ("semantic").toUpperCase ();
                    result.push (source);
                }
            }
            return result.length == 1 ? result[0] : result;
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
                            onloadcallback (me, info);
                    };
                    info.img.src = url;
                }) ();
            } else {
                console.log ("DaeModel::loadImages (): Could not find an <init_from> inside <" + entry.tagName + "> #" + id);
            }
        }
    }
};

DaeModel.nameTrue = {
    "TRUE": true,
    "1": true
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
        var wrapU = ((value.getElementsByTagName ("wrapU") [0] || {}).textContent || "TRUE").toUpperCase () in DaeModel.nameTrue;
        var wrapV = ((value.getElementsByTagName ("wrapV") [0] || {}).textContent || "TRUE").toUpperCase () in DaeModel.nameTrue;
        var result = {
            wrapU: wrapU,
            wrapV: wrapV
        };
        // var texCoord = value.getAttribute ("texcoord"); // Not sure what the 'texcoord' attribute here is, but we'll just leave it for a future implementation.
        var obj = fxParams[texture];
        // COLLADA is a bit complicated with finding the texture, so we have to traverse a chain of things before we get to the actual image:
        while (obj && !obj.imgId) {
            obj = fxParams[obj.srcId]; // Blender tends to export a Russian doll type of thing, where you have to find the texture.
        }
        if (!obj) {
            result.src = daeImages[texture]; // Maya tends to export a direct texture ID, so be prepared for that.
            return result;
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
        result.src = daeImages[obj.imgId];
        return result;
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
                for (var it = 0; it < techNodes.length && it < 1 /* Maximum is 1 <technique> per <profile_COMMON> */; it++) {
                    var tNode = techNodes[it];
                    var phongNode = tNode.getElementsByTagName ("phong") [0];
                    if (!phongNode) {
                        phongNode = tNode.getElementsByTagName ("blinn") [0]; // Some people use a Blinn material, which is basically the same thing to our code.
                    }
                    if (!phongNode) {
                        phongNode = tNode.getElementsByTagName ("lambert") [0]; // Lambert is pretty similar too, so whatever.
                    }
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
DaeModel.prototype.loadGeometries = function (xDoc, xGeometryLibraries, opt_useJsArrays, opt_useVec4normals) {
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
                    var primitives = [];
                    // Just parsing the <mesh> should be OK for importing simple objects from Blender 2.78C.
                    // As per the COLLADA 1.4 specification, the <mesh> can have "0 or more" of <polylist>, <lines>, etc.;
                    var allShapes = [];
                    var polylist = Array.prototype.slice.call (mesh.getElementsByTagName ("polylist"));
                    allShapes = allShapes.concat (polylist);
                    // We will only support the <polylist> for now; later, we can add <polygons>, <triangles>, <lines>, etc., but for now it's simple.
                    // Actually, <triangles> is pretty similar to <polylist>, but with all the polygon sizes as 3. Let's do that too:
                    allShapes = allShapes.concat (Array.prototype.slice.call (mesh.getElementsByTagName ("triangles")));
                    for (var iShape = 0; iShape < allShapes.length; iShape++) {
                        var shape = allShapes[iShape];
                        var sType = shape.tagName;
                        var primitive = {
                            vertices: [],
                            normals: [],
                            texCoords: []
                        }; // We'll be creating a primitive.
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
                        var inputData = {
                            vertex: null,
                            normal: null,
                            texCoord: null
                        };
                        window.debug_i = inputData;
                        var scanInputs = function (inputs, inputData) {
                            var maxOffset = 0;
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
                            return maxOffset;
                        };
                        scanInputs (mesh.getElementsByTagName ("input"), inputData);
                        var maxOffset = scanInputs (shape.getElementsByTagName ("input"), inputData);
                        if (!inputData.vertex)
                            throw "DaeModel::loadGeometries (): the input data must specify vertex positions";
                        if (!inputData.normal)
                            primitive.normals = null;
                        else if (isNaN (inputData.normal.offset))
                            inputData.normal.offset = inputData.vertex.offset;
                        if (!inputData.texCoord)
                            primitive.texCoords = null;
                        else if (isNaN (inputData.texCoord.offset))
                            inputData.texCoord.offset = inputData.vertex.offset;
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
                                    var vData = inputData.vertex.source.getAttribute (vIndex, ["x", "y", "z", 1], 1, opt_useJsArrays);
                                    var nData = inputData.normal ? inputData.normal.source.getAttribute (nIndex, ["x", "y", "z"], 1, opt_useJsArrays) : null;
                                    var tData = inputData.texCoord ? inputData.texCoord.source.getAttribute (tIndex, ["s", "t"], 1, opt_useJsArrays) : null;
                                    // Add the data to our primitive's buffer:
                                    if (opt_useVec4normals) nData.push (0);
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
                        primitive.numVertices = primitive.vertices.length;
                        primitive.numTriangles = primitive.numVertices / 3;
                        primitives.push (primitive);
                    }
                    // else {
                    // console.log ("DaeModel::loadGeometries (): <polylist> element not found; probably this <mesh> (inside geometry [#" + id + "]) " +
                    // "uses a different feature of COLLADA than what we implement.");
                    // }
                } else {
                    // Then look for either <convex_mesh> or <spline>;
                    // leave this for future expansion, for now.
                    console.log ("DaeModel::loadGeometries (): <mesh> element not found; probably this model uses a different feature of COLLADA than what we implement. " +
                        "Geometry [#" + id + "]. " +
                        "Please try simplifying your export settings. ");
                }
                this.geometries[id] = primitives;
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
    for (var i = 0; i < xControllerLibraries.length; i++) {
        var ctrlLib = xControllerLibraries[i];
        var controllers = ctrlLib.getElementsByTagName ("controller");
        for (var j = 0; j < controllers.length; j++) {
            var controller = controllers[j];
            var result = {
                bind_shape_matrix: null,
                invBindMats: {},
                weights: null,
                geometry_source: "",
                controller_name: controller.getAttribute ("name")
            };
            // A controller can have one <skin> or <morph> child; we will only support <skin>, for simplicify. Later we can add <morph> support, in the future.
            var skins = controller.getElementsByTagName ("skin");
            var skin = skins.length > 0 ? skins[0] : null; // There should be no more than 1 <skin>, so selecting just [0] should be fine.
            if (skin) {
                var bind_shape_matrix = skin.getElementsByTagName ("bind_shape_matrix") [0];
                if (!bind_shape_matrix) {
                    console.log ("DaeModel::loadControllers (): Could not find <bind_shape_matrix> inside <skin> inside <controller> [#" + controller.getAttribute ("id") + "];");
                    continue;
                }
                result.bind_shape_matrix = DaeModel.makeFloatArray (bind_shape_matrix.textContent);
                result.geometry_source = skin.getAttribute ("source");
                // Joints:
                var jointSources = {
                    joint: null,
                    invBind: null
                };
                var weightSources = {
                    joint: null,
                    weight: null
                };
                var read_inputs = function (inputs, dest_sources) {
                    var max_offset = 0;
                    for (var iSource = 0; iSource < inputs.length; iSource++) {
                        var s = inputs[iSource].getAttribute ("semantic");
                        if (s != "JOINT" && s != "WEIGHT" && s != "INV_BIND_MATRIX") {
                            console.log ("DaeModel::loadControllers (): Unrecognized input semantic: [" + s + "], in controller [#" + controller.getAttribute ("id") + "]");
                            continue;
                        }
                        var source = DaeModel.getSource (xDoc, inputs[iSource].getAttribute ("source"));
                        if (s == "JOINT")
                            dest_sources.joint = source;
                        else if (s == "INV_BIND_MATRIX")
                            dest_sources.invBind = source;
                        else if (s == "WEIGHT")
                            dest_sources.weight = source;
                        if (inputs[iSource].hasAttribute ("offset")) {
                            var offset = parseInt (inputs[iSource].getAttribute ("offset"));
                            source.offset = offset;
                            if (offset > max_offset)
                                max_offset = offset;
                        }
                    }
                    return max_offset;
                };
                var joints = skin.getElementsByTagName ("joints") [0]; // COLLADA spec: <skin> MUST have exactly 1 <joints> child; so hopefully it's there ...
                // We'll still check this though, in case it's an invalid COLLADA model:
                if (!joints) {
                    console.log ("DaeModel::loadControllers (): <skin> element MUST have exactly 1 <joints> child; had none. In controller [#" +
                        controller.getAttribute ("id") + "];");
                    continue;
                }
                var jointInputs = joints.getElementsByTagName ("input");
                read_inputs (jointInputs, jointSources);
                if (jointSources.invBind) {
                    for (var i = 0; i < jointSources.invBind.count; i++) {
                        // Assign this bone name the inverse bind matrix:
                        result.invBindMats[jointSources.joint.getAttribute (i, ["joint"])] =
                            DaeModel.makeMatrixFromFloat16x16 (jointSources.invBind.getAttribute (i, ["transform"], 16));
                    }
                } else {
                    for (var i = 0; i < jointSources.joint.count; i++) result.invBindMats[jointSources.joint.getAttribute (i, ["joint"])] = DaeModel.IDENTITY;
                }
                // Weights:
                var vertex_weights = skin.getElementsByTagName ("vertex_weights") [0];
                if (!vertex_weights) {
                    console.log ("DaeModel::loadControllers (): <skin> element MUST have exactly 1 <vertex_weights> child; had none. In controller [#" +
                        controller.getAttribute ("id") + "];");
                    continue;
                }
                var count = parseInt (vertex_weights.getAttribute ("count"));
                var weightInputs = vertex_weights.getElementsByTagName ("input");
                var max_offset = read_inputs (weightInputs, weightSources);
                var vStride = max_offset + 1;
                var vertexCountPerPoly = vertex_weights.getElementsByTagName ("vcount") [0];
                var polyVertexIndices = vertex_weights.getElementsByTagName ("v") [0];
                var vCount, pIndex;
                if (!vertexCountPerPoly) {
                    vCount = new Int32Array (count);
                    for (var iCount = 0; iCount < count; iCount++)
                        vCount[iCount] = 1; // Default is 1 bone per vertex.
                } else vCount = DaeModel.makeIntArray (vertexCountPerPoly.textContent);
                if (!polyVertexIndices) {
                    console.log ("DaeModel::loadControllers (): Could not find any <p> children under <vertex_weights> in controller [#" +
                        controller.getAttribute ("id") + "]");
                    pIndex = null;
                } else pIndex = DaeModel.makeIntArray (polyVertexIndices.textContent);
                if (vCount && pIndex) {
                    result.weights = [];
                    var vIndex = 0;
                    var vSoFar = 0;
                    for (var iIndex = 0; iIndex < pIndex.length; iIndex += vStride) {
                        var ofJoint = weightSources.joint.offset || 0; // JOINT is a required INPUT, so it better be present.
                        var ofWeight = weightSources.weight ? (weightSources.weight.offset || ofJoint + 1) : -1; // Weight is an optional input.
                        var idxJoint = pIndex[iIndex + ofJoint];
                        var idxWeight = ofWeight < 0 ? -1 : pIndex[iIndex + ofWeight];
                        var atJointName = weightSources.joint.getAttribute (idxJoint, ["joint"]) [0];
                        var atInvBind = jointSources.invBind ? jointSources.invBind.getAttribute (idxJoint, ["transform"], 16) : null;
                        var atWeight = idxWeight < 0 ? 1 : weightSources.weight.getAttribute (idxWeight, ["weight"]) [0];
                        result.weights.push ({
                            jointName: atJointName,
                            invBindIndex: idxJoint,
                            invBind: atInvBind,
                            weight: atWeight,
                            vertex: vIndex // Which vertex this joint/weight is controlling. So, 0 through N_vertices.
                        });
                        // Increment vIndex if needed:
                        vSoFar++;
                        if (vSoFar >= vCount[vIndex]) {
                            vSoFar = 0;
                            vIndex++;
                        }
                    }
                    this.controllers[controller.getAttribute ("id")] = result;
                }
            } else {
                console.log ("DaeModel::loadControllers (): Could not find a <skin> element inside controller [#" + controller.getAttribute ("id") + "];");
            }
        }
    }
};
DaeModel.prototype.loadVisualScenes = function (xDoc, xVisualSceneLibraries) {
    for (var i = 0; i < xVisualSceneLibraries.length; i++) {
        var scnLibrary = xVisualSceneLibraries[i];
        var scenes = scnLibrary.getElementsByTagName ("visual_scene");
        for (var iScene = 0; iScene < scenes.length; iScene++) {
            var xScene = scenes[iScene];
            var sceneID = xScene.getAttribute ("id");
            var scene = { attr: { id: sceneID, name: xScene.getAttribute ("name"), matrix: mat4 () }, list: [] };
            this.nodeLibrary[sceneID] = scene;
            DaeModel.loadNode (xDoc, xScene, scene, this);
            this.visualScenes[scene.attr.name] = scene;
        }
    }
};

// Getters:
DaeModel.prototype.getGeometry = function (geometry_url) {
    if (geometry_url.charAt (0) == '#') {
        return this.geometries[geometry_url.substring (1)];
    } else console.log ("DaeModel::getGeometry (): Unsupported geometry URL (" + geometry_url + "); consider starting it with a '#' to reference an ID. ");
};

// Static methods:
DaeModel.transformationElements = { // Transformations supported by COLLADA 1.4:
    lookat: true, matrix: true, rotate: true, scale: true, skew: true, translate: true
};
DaeModel.loadNode = function (xDoc, xParent, loadInto, model) {
    loadInto.debug = xParent;
    for (var i = 0; i < xParent.childNodes.length; i++) {
        var xChild = xParent.childNodes[i];
        if (xChild.nodeType == Element.ELEMENT_NODE) {
            // This is a child element. For example, <translate>, <node>, etc.
            if (xChild.tagName in DaeModel.transformationElements) {
                // This is a transformation.
                var numbers = DaeModel.makeFloatArray (xChild.textContent);
                var m;
                var a;
                var t;
                switch (xChild.tagName) {
                    case "lookat":
                    {
                        var eye = numbers.slice (0, 3);
                        var interest = numbers.slice (3, 6);
                        var up = numbers.slice (6, 9);
                        loadInto.attr.matrix = mult (loadInto.attr.matrix, lookAt (eye, interest, up));
                    }
                        break;
                    case "matrix":
                        m = [
                            numbers.slice (0, 4),
                            numbers.slice (4, 8),
                            numbers.slice (8, 12),
                            numbers.slice (12, 16)
                        ];
                        m.matrix = true;
                        loadInto.attr.matrix = mult (loadInto.attr.matrix, m);
                        break;
                    case "rotate":
                        loadInto.attr.matrix = mult (loadInto.attr.matrix, rotate.apply (null, [numbers[3]].concat (Array.prototype.slice.call (numbers).slice (0, 3))));
                        break;
                    case "scale":
                        loadInto.attr.matrix = mult (loadInto.attr.matrix, scalem.apply (null, numbers));
                        break;
                    case "skew":
                        // Ruvim: I'm not completely sure that this is the right way to <skew>, but ...:
                        a = [ [Math.tan (numbers[0]) * numbers[1]],
                            [Math.tan (numbers[0]) * numbers[2]],
                            [Math.tan (numbers[0]) * numbers[3]] ];
                        t = [ [numbers[4], numbers[5], numbers[6]] ];
                        a.matrix = t.matrix = true;
                        m = add (mat4 (), mult (a, t));
                        loadInto.attr.matrix = mult (loadInto.attr.matrix, m);
                        break;
                    case "translate":
                        loadInto.attr.matrix = mult (loadInto.attr.matrix, translate.apply (null, numbers));
                        break;
                }
            } else if (xChild.tagName == "node") {
                // This is a sub-node.
                var childID = xChild.getAttribute ("id");
                var childName = xChild.getAttribute ("name");
                var childSid = xChild.getAttribute ("sid");
                var childType = xChild.getAttribute ("type");
                var childObject = { attr: { id: childID, name: childName, sid: childSid, type: childType, matrix: mat4 () }, list: [] };
                loadInto[childName] = childObject;
                model.nodeLibrary[childID] = childObject;
                model.nodesByName[childName] = childObject;
                DaeModel.loadNode (xDoc, xChild, childObject, model);
            } else if (xChild.tagName == "instance_controller") {
                var url = xChild.getAttribute ("url");
                if (url.charAt (0) == '#') {
                    var obj = {
                        type: "controller",
                        url: url,
                        skeleton: [], // <skeleton> bone references;
                        targetMaterial: ""
                    };
                    var skel = xChild.getElementsByTagName ("skeleton");
                    for (var iSkel = 0; iSkel < skel.length; iSkel++) {
                        obj.skeleton.push (skel[iSkel].textContent);
                    }
                    var mtl = xChild.getElementsByTagName ("instance_material") [0];
                    if (mtl) obj.targetMaterial = mtl.getAttribute ("target");
                    loadInto.list.push (obj);
                } else console.log ("DaeModel::loadNode (): <instance_controller> unsupported URL type: [" + url + "]");
            } else if (xChild.tagName == "instance_geometry") {
                var url = xChild.getAttribute ("url");
                if (url.charAt (0) == '#') {
                    var obj = {
                        type: "geometry",
                        url: url,
                        targetMaterial: ""
                    };
                    var mtl = xChild.getElementsByTagName ("instance_material") [0];
                    if (mtl) obj.targetMaterial = mtl.getAttribute ("target");
                    loadInto.list.push (obj);
                } else console.log ("DaeModel::loadNode (): <instance_geometry> unsupported URL type: [" + url + "]");
            }
        } else if (xChild.nodeType == Element.TEXT_NODE) {
            // Do nothing. This 'if' branch is just an example of how to check if it's a text node. Just for future reference.
        }
    }
    return loadInto;
};
DaeModel.makeIntArray = function (source_dae_data) {
    return new Int32Array (source_dae_data.trim ().split (/[ \t\r\n]+/g));
};
DaeModel.makeFloatArray = function (source_dae_data) {
    return new Float32Array (source_dae_data.trim ().split (/[ \t\r\n]+/g));
};
DaeModel.makeStringArray = function (source_dae_data) {
    return source_dae_data.trim ().split (/[ \t\r\n]+/);
};

DaeModel.makeMatrixFromFloat16x16 = function (source_float_array) {
    var a = Array.prototype.slice.call (source_float_array);
    var m = [
        a.slice (0, 4),
        a.slice (4, 8),
        a.slice (8, 12),
        a.slice (12, 16)
    ];
    m.matrix = true;
    return m;
}; 

