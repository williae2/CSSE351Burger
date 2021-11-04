"use strict";

var gl;
var canvas;

var points = [];
var colors = [];
var normals = [];
var texcoords = [];

var cubePoints = 36;
var wallPoints = 6;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var cheese = true;
var tomato = true;
var patty = true;
var lettuce = true;

var axis = 1;
var theta = [0, 0, 0];

var radius = 3;
var phi = Math.PI/2;
var trans = [radius*Math.cos(phi), 0, radius*Math.sin(phi)];

var altView = false;
var textureView = false;
var obj = true;

// parameterize the plane of reflection
var eye = vec3(0, 0, 5);
var eye2 = vec3(0, 0, -10-eye[2]);
var at = vec3 (0, 0, -5);
var up = vec3(0, 1, 0);
var ModelView = lookAt(eye, at, up);
var Normal = transpose(inverse(ModelView));
var Projection = mat4();
var Projection1 = perspective(90, 1, 1, 40);
var Projection2 = frustum(-5, 5, -2.5, 2.5, 10, 40);

//var AmbientLight = vec3(1.0, 1.0, 1.0);
var AmbientLight = vec3(1.0, 1.0, 1.0);
var LightColor1 = vec3(0.0, 0.0, 1.0);
var LightPosition1 = vec4(0.0, 0.0, 5.0, 1.0); // in world coordinates
var LightPosition2 = vec4(0.0, 0.0, -5.0, 1.0);
var LightColor2 = vec3(1.0, 0.0, 0.0);
var Shininess = 50;

var ModelViewMatrixLoc;
var NormalMatrixLoc;
var ProjectionMatrixLoc;

var LightPositionLoc1;
var LightPositionLoc2;


var AmbientOnLoc;
var DiffuseOnLoc;
var SpecularOnLoc;
var TextureOnLoc;

var textureCheckbox;

var framebuffer;
var texture;

var texSize = 64;

function quad(a, b, c, d)
{
    var vertices = [
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0),
        vec4( 0.5,  0.5,  0.5, 1.0),
        vec4( 0.5, -0.5,  0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4( 0.5,  0.5, -0.5, 1.0),
        vec4( 0.5, -0.5, -0.5, 1.0)
    ];

    var vertexColors = [
        vec4(0.0, 0.0, 0.0, 1.0),  // black
        vec4(1.0, 0.0, 0.0, 1.0),  // red
        vec4(1.0, 1.0, 0.0, 1.0),  // yellow
        vec4(0.0, 1.0, 0.0, 1.0),  // green
        vec4(0.0, 0.0, 1.0, 1.0),  // blue
        vec4(1.0, 0.0, 1.0, 1.0),  // magenta
        vec4(0.0, 1.0, 1.0, 1.0),  // cyan
        vec4(1.0, 1.0, 1.0, 1.0),  // white
    ];

    var texCoord = [
        vec2(0.0, 0.0),
	vec2(1.0, 0.0),
	vec2(1.0, 1.0),
	vec2(0.0, 1.0)
    ];

    var indices = [a, b, c, a, c, d];
    var tindices = [0, 1, 2, 0, 2, 3];

    for (var i=0; i<indices.length; ++i ) {
        points.push(vertices[indices[i]]);
        colors.push(vertexColors[a]);

	var n = normalize(cross(subtract(vertices[b], vertices[a]),
				subtract(vertices[c], vertices[a])));
	normals.push(n);
	texcoords.push(texCoord[tindices[i]]);
    }
}

function color_cube()
{
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function wall()
{
    var vertices = [
        vec4(-5.0, -2.5, -5.0, 1.0),
        vec4( 5.0, -2.5, -5.0, 1.0),
        vec4( 5.0,  2.5, -5.0, 1.0),
        vec4(-5.0,  2.5, -5.0, 1.0),
    ];

    var vertexColor = vec4(0.5, 0.5, 0.5, 1.0);

    var normal = vec3(0.0, 0.0, 1.0);

    var texCoord = [
        vec2(1.0, 0.0),
	vec2(0.0, 0.0),
	vec2(0.0, 1.0),
	vec2(1.0, 1.0)
    ];

    var indices = [0, 1, 3, 1, 2, 3];
    var tindices = [0, 1, 3, 1, 2, 3];

    for (var i=0; i<indices.length; ++i ) {
        points.push(vertices[indices[i]]);
        colors.push(vertexColor);
	normals.push(normal);
	texcoords.push(texCoord[tindices[i]]);
    }
}

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert("WebGL 2.0 isn't available"); }

    color_cube();
    wall();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.5, 0.5, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texcoords), gl.STATIC_DRAW);

    var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    ModelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    gl.uniformMatrix4fv(ModelViewMatrixLoc, false, flatten(ModelView));

    NormalMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");
    gl.uniformMatrix4fv(NormalMatrixLoc, false, flatten(Normal));

    ProjectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
    gl.uniformMatrix4fv(ProjectionMatrixLoc, false, flatten(Projection));

    var AmbientLightLoc = gl.getUniformLocation(program, "uAmbientLight");
    gl.uniform3fv(AmbientLightLoc, AmbientLight);

    var LightColorLoc1 = gl.getUniformLocation(program, "uLightColor[0]");
    gl.uniform3fv(LightColorLoc1, LightColor1);

    var LightColorLoc2 = gl.getUniformLocation(program, "uLightColor[1]");
    gl.uniform3fv(LightColorLoc2, LightColor2);

    LightPositionLoc1 = gl.getUniformLocation(program, "uLightPosition[0]");
    gl.uniform4fv(LightPositionLoc1, LightPosition1);

    
    LightPositionLoc2 = gl.getUniformLocation(program, "uLightPosition[1]");
    gl.uniform4fv(LightPositionLoc2, LightPosition2);

    var ShininessLoc = gl.getUniformLocation(program, "uShininess");
    gl.uniform1f(ShininessLoc, Shininess);

    AmbientOnLoc = gl.getUniformLocation(program, "uAmbientOn");
    DiffuseOnLoc = gl.getUniformLocation(program, "uDiffuseOn");
    SpecularOnLoc = gl.getUniformLocation(program, "uSpecularOn");
    TextureOnLoc = gl.getUniformLocation(program, "uTextureOn");

    gl.uniform1f(DiffuseOnLoc, 1.0);
    gl.uniform1f(SpecularOnLoc, 1.0);
    gl.uniform1f(AmbientOnLoc, 1.0);
    gl.uniform1f(TextureOnLoc, 1.0);

    texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height/2.0, 0,
		  gl.RGBA, gl.UNSIGNED_BYTE, null);
    // Mipmapping seems to cause problems in at least some cases
    // gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap"), 0);

    framebuffer = gl.createFramebuffer();
    framebuffer.width = canvas.width;
    framebuffer.height = canvas.height/2.0;
    framebuffer.texture = texture
    
    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width,
			   canvas.height/2.0);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
			    texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER,
    			       renderbuffer);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    


    var pattyCheckbox = document.getElementById("pattyB");
    if (pattyCheckbox.checked) {
        patty = true;
    } else {
        patty = false;
    }

    pattyCheckbox.onchange = function(event) {
	    render();
    };

    var cheeseCheckbox = document.getElementById("cheeseB");
    if (cheeseCheckbox.checked) {
        cheese = true;
    } else {
        cheese = false;
    }

    cheeseCheckbox.onchange = function(event) {
	    render();
    };

    var lettuceCheckbox = document.getElementById("lettuceB");
    if (lettuceCheckbox.checked) {
        lettuce = true;
    } else {
        lettuce = false;
    }

    lettuceCheckbox.onchange = function(event) {
	    render();
    };

    var tomatoCheckbox = document.getElementById("tomatoB");
    if (tomatoCheckbox.checked) {
        tomato = true;
    } else {
        tomato = false;
    }

    tomatoCheckbox.onchange = function(event) {
	    render();
    };

    var altViewCheckbox = document.getElementById("altViewOn");
    if (altViewCheckbox.checked) {
	altView = true;
    } else {
	altView = false;
    }

    altViewCheckbox.onchange = function(event) {
	if (altViewCheckbox.checked) {
	    altView = true;
	} else {
	    altView = false;
	}
    };

    var altViewTextureViewCheckbox = document.getElementById("altViewTextureViewOn");
    if (altViewTextureViewCheckbox.checked) {
	textureView = true;
    } else {
	textureView = false;
    }

    altViewTextureViewCheckbox.onchange = function(event) {
	if (altViewTextureViewCheckbox.checked) {
	    textureView = true;
	} else {
	    textureView = false;
	}
    };

    var objCheckbox = document.getElementById("objOn");
    if (objCheckbox.checked) {
	obj = true;
    } else {
	obj = false;
    }

    objCheckbox.onchange = function(event) {
	if (objCheckbox.checked) {
	    obj = true;
	} else {
	    obj = false;
	}
    };

    render();
};

function frustum(left, right, bottom, top, near, far)
{
    if (left >= right) { throw "frustum(): left and right not acceptable"; }
    if (bottom >= top) { throw "frustum(): bottom and top not acceptable"; }
    if (near >= far)   { throw "frustum(): near and far not acceptable"; }

    var w = right-left;
    var h = top-bottom;
    var d = far-near;

    var result = mat4();

    result[0][0] = 2.0*near/w;
    result[1][1] = 2.0*near/h;
    result[3][3] = 0;

    result[0][2] = (right+left)/w;
    result[1][2] = (top+bottom)/h;
    result[2][2] = -(far+near)/d;
    result[3][2] = -1.0;

    result[2][3] = -2.0*far*near/d;

    return result;
}

function render() {
    // Draw reflection into texture
    if (altView) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	if (textureView) {
	    gl.viewport(0, canvas.height/4, canvas.width, canvas.height/2);

	    ModelView = lookAt(eye2, vec3(eye2[0], eye2[1], -5.0), up);
	    Projection = frustum(-5.0+eye2[0], 5.0+eye2[0],
				 -2.5-eye2[1], 2.5-eye2[1],
	    	                 -5.0-eye2[2], 15.0-eye2[2]);
	} else {
	    gl.viewport(0, 0, canvas.width, canvas.height);
	    
	    ModelView = lookAt(eye2, vec3(eye2[0], eye2[1], -5.0), up);
	    Projection = Projection1;
	}
    } else {
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
				gl.TEXTURE_2D, texture, 0);

	gl.viewport(0, 0, canvas.width, canvas.height/2);

	ModelView = lookAt(eye2, vec3(eye2[0], eye2[1], -5.0), up);
	Projection = frustum(-5.0+eye2[0], 5.0+eye2[0],
			     -2.5-eye2[1], 2.5-eye2[1],
	                     -5.0-eye2[2], 15.0-eye2[2]);
    }

    Normal = transpose(inverse(ModelView));

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    gl.uniform4fv(LightPositionLoc1, mult(ModelView, LightPosition1));
    gl.uniform4fv(LightPositionLoc2, mult(ModelView, LightPosition2));
    gl.uniform1f(TextureOnLoc, 0.0);
    gl.uniformMatrix4fv(ProjectionMatrixLoc, false, flatten(Projection));
    gl.uniformMatrix4fv(ModelViewMatrixLoc, false, flatten(ModelView));
    gl.uniformMatrix4fv(NormalMatrixLoc, false, flatten(Normal));

    if (altView) {
	gl.drawArrays(gl.LINE_LOOP, cubePoints, wallPoints);
    }

    ModelView = mult(ModelView,
    		     mult(translate(trans[0], trans[1], trans[2]),
    			  mult(rotateZ(theta[2]),
    			       mult(rotateY(theta[1]),
    				    rotateX(theta[0])))));
    Normal = transpose(inverse(ModelView));

    gl.uniformMatrix4fv(ModelViewMatrixLoc, false, flatten(ModelView));
    gl.uniformMatrix4fv(NormalMatrixLoc, false, flatten(Normal));

    gl.drawArrays(gl.TRIANGLES, 0, cubePoints);

    // Draw scene
    if (!altView) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.1, 0.1, 0.1, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

	//ModelView = lookAt(eye, vec3(eye[0], eye[1], -5.0), up);
	ModelView = lookAt(eye, at, up);
	Projection = Projection1;
	Normal = transpose(inverse(ModelView));
	
    gl.uniform4fv(LightPositionLoc1, mult(ModelView, LightPosition1));
    gl.uniform4fv(LightPositionLoc2, mult(ModelView, LightPosition2));
    gl.uniform1f(TextureOnLoc, 1.0);
	gl.uniformMatrix4fv(ProjectionMatrixLoc, false, flatten(Projection));
	gl.uniformMatrix4fv(ModelViewMatrixLoc, false, flatten(ModelView));
	gl.uniformMatrix4fv(NormalMatrixLoc, false, flatten(Normal));
	
	gl.drawArrays(gl.TRIANGLES, cubePoints, wallPoints);
    
	if (obj) {
	    ModelView = mult(ModelView,
    			     mult(translate(trans[0], trans[1], trans[2]),
    				  mult(rotateZ(theta[2]),
    				       mult(rotateY(theta[1]),
    					    rotateX(theta[0])))));
	    Normal = transpose(inverse(ModelView));
	    
	    gl.uniform1f(TextureOnLoc, 0.0);
	    gl.uniformMatrix4fv(ModelViewMatrixLoc, false, flatten(ModelView));
	    gl.uniformMatrix4fv(NormalMatrixLoc, false, flatten(Normal));
	    
	    gl.drawArrays(gl.TRIANGLES, 0, cubePoints);
	}
    }
    
    theta[axis] += 1.0;
    phi += 0.01;
    trans = [radius*Math.cos(phi), 0, radius*Math.sin(phi)];

    requestAnimationFrame(render);
}