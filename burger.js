"use strict";

var gl;
var canvas;

var points = [];
var colors = [];
var normals = [];
var texcoords = [];

var wallPoints = 6;
var burgerPoints = 0;
var topBunPoints = 0;
var lettucePoints = 0;
var tomatoPoints = 0;
var cheesePoints = 0;
var pattyPoints = 0;
var bottomBunPoints = 0;
var program; 

let bunColorVec = vec4(0.957, 0.643, 0.377, 1.000);
const pattyColorVec = vec4(0.35, 0.17, 0.05, 1.00);

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var cheese = true;
var tomato = true;
var patty = true;
var lettuce = true;
var bigBurgerMode = false;

var numPtsCirc = 50;
var axis = 1;
var theta = [0, 0, 0];
var currentHeight = 0;
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
var AmbientLight = vec3(.3, .3, .3);
var LightColor1 = vec3(1.0, 0.5, 0.5);
var LightPosition1 = vec4(15.0, 1.0, 10.0, 1.0); // in world coordinates
var LightPosition2 = vec4(-15.0, 1.0, 10.0, 1.0);
var LightColor2 = vec3(1.0, 0.5, 0.5);
var Shininess = 200;

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

function quad(a, b, c, d, color, y1, y2, l)
{
    var vertices = [
        vec4(-l/2, y1,  l/2, 1.0),
        vec4(-l/2,  y2,  l/2, 1.0),
        vec4( l/2,  y2,  l/2, 1.0),
        vec4( l/2, y1,  l/2, 1.0),
        vec4(-l/2, y1, -l/2, 1.0),
        vec4(-l/2,  y2, -l/2, 1.0),
        vec4( l/2,  y2, -l/2, 1.0),
        vec4( l/2, y1, -l/2, 1.0)
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
        colors.push(vertexColors[color]);

	var n = normalize(cross(subtract(vertices[b], vertices[a]),
				subtract(vertices[c], vertices[a])));
	normals.push(n);
	texcoords.push(texCoord[tindices[i]]);
    }
}

function addCylinder(centerX, centerY, radius, numRadialPoints, bottomZ, height, topColorVec, wallColorVec) {
    let vertices = [];
    let numCylPoints = 0;
    // Setting top layer
    for (let i=0; i<360; i+=(360/numRadialPoints)) {
        let x = vec4(centerX+(radius*(Math.cos(radians(i)))), bottomZ, centerY+(radius*(Math.sin(radians(i)))), 1.00);
        vertices.push(x);
    }
    // Setting bottom layer
    for (let i=0; i<360; i+=360/numRadialPoints) {
        let x = vec4(centerX+(radius*(Math.cos(radians(i)))), bottomZ+height, centerY+(radius*(Math.sin(radians(i)))), 1.00);
        vertices.push(x);
    }
    // Setting center point for bottom and top
    vertices.push(vec4(centerX, bottomZ, centerY, 1.00));
    vertices.push(vec4(centerX, bottomZ+height, centerY, 1.00));
    // Adding outer wall of cylinder
    for (let i=0; i<numRadialPoints-1; i++) {
        points.push(vertices[i]);
        points.push(vertices[i+1]);
        points.push(vertices[i+numRadialPoints+1]);
        points.push(vertices[i]);
        points.push(vertices[i+numRadialPoints]);
        points.push(vertices[i+numRadialPoints+1]);
        let norm = normalize(cross(subtract(vertices[i+numRadialPoints+1], vertices[i]), subtract(vertices[i+1], vertices[i])));
        for (let k=0; k<6; k++) {
            normals.push(norm);
            texcoords.push(vec2(0, 0));
            colors.push(wallColorVec);
            numCylPoints++;
        }
    }
    points.push(vertices[numRadialPoints-1]);
    points.push(vertices[0]);
    points.push(vertices[numRadialPoints]);
    points.push(vertices[numRadialPoints-1]);
    points.push(vertices[(2*numRadialPoints)-1]);
    points.push(vertices[numRadialPoints]);
    let norm = normalize(cross(subtract(vertices[numRadialPoints], vertices[numRadialPoints-1]), subtract(vertices[0], vertices[numRadialPoints-1])));
    for (let k=0; k<6; k++) {
        normals.push(norm);
        texcoords.push(vec2(0, 0));
        colors.push(wallColorVec);
        numCylPoints++;
    }
    // Adding top circle
    for (let i=0; i<numRadialPoints-1; i++) {
        points.push(vertices[2*numRadialPoints+1]);
        points.push(vertices[numRadialPoints+i]);
        points.push(vertices[numRadialPoints+i+1]);
        norm = normalize(cross(subtract(vertices[numRadialPoints+i], vertices[2*numRadialPoints+1]), subtract(vertices[numRadialPoints+i+1], vertices[2*numRadialPoints+1])));
        for (let k=0; k<3; k++) {
            normals.push(norm);
            texcoords.push(vec2(0, 0));
            colors.push(topColorVec);
            numCylPoints++;
        }
    }
    points.push(vertices[2*numRadialPoints+1]);
    points.push(vertices[2*numRadialPoints-1]);
    points.push(vertices[numRadialPoints]);
    norm = normalize(cross(subtract(vertices[2*numRadialPoints-1], vertices[2*numRadialPoints+1]), subtract(vertices[numRadialPoints], vertices[2*numRadialPoints+1])));
    for (let k=0; k<3; k++) {
        normals.push(norm);
        texcoords.push(vec2(0, 0));
        colors.push(topColorVec);
        numCylPoints++;
    }
}

function calc_cylinder_points(numRadialPoints) {
    return numRadialPoints * 9;
}

function drawCyl(startX,startY,height,offset,radius,color) {
    const angle = 2 * Math.PI / numPtsCirc;

    //repeated to properly draw elements of cyllinder
    // top
    for (let i = 0; i < numPtsCirc; i++) {
        var inc = angle * i;
        var x = startX + radius * Math.cos(inc);
        var y = startY + radius * Math.sin(inc);
        colors.push(color);
        var n = vec3(0,1,0);
	    normals.push(n);
        texcoords.push(vec2(x, height-offset));
        // var n = normalize(cross(subtract(vertices[b], vertices[a]),
		// 		subtract(vertices[c], vertices[a])));
	    // normals.push(n);
        points.push(vec4(x, height-offset, y, 1.0));
    }
    // base
    for (let i = 0; i < numPtsCirc; i++) {
        var inc = angle * i;
        var x = startX + radius * Math.cos(inc);
        var y = startY + radius * Math.sin(inc);
        colors.push(color);
        var n = vec3(0,-1,0);
	    normals.push(n);
        texcoords.push(vec2(x, height));
        points.push(vec4(x, height,y, 1.0));
    }

    // column
    for (let i = 0; i < numPtsCirc*2; i++) {
        var inc = angle * i;
        var x = startX + radius * Math.cos(inc);
        var y = startY + radius * Math.sin(inc);
        colors.push(color);
        colors.push(color);
        var n = normalize(vec3(x-startX,y-startY,1));
	    normals.push(n);
        normals.push(n);
        texcoords.push(vec2(x, height-offset));
        texcoords.push(vec2(x, height));
        points.push(vec4(x, height-offset, y, 1.0));
        points.push(vec4(x, height, y, 1.0));
    }
}

function build_top_bun() {
    // This is a substitute for a hemisphere
    // Hemispheres are rediculously hard to draw
    // drawCyl(0,0,currentHeight+0.25,0.25,0.75,vec4(.9569,.6431,.3765,1));
    // startX,startY,height,offset,radius,color
    const layers = 50;
    const radialPoints = 100;
    draw_hemisphere(layers, radialPoints, 0, 0, currentHeight, 0.75, bunColorVec);
    // topBunPoints += 6*numPtsCirc;
    // burgerPoints += 6*numPtsCirc;
    const hemispherePoints = calc_hemisphere_points(layers, radialPoints);
    topBunPoints += hemispherePoints;
    burgerPoints += hemispherePoints;
}

// TODO: add an option to "squish" the height of the hemisphere
function draw_hemisphere(totalLayers, numRadialPoints, centerX, centerY, bottomZ, radius, color) {
    console.log("Drawing hemisphere");
    for (let band=0; band<totalLayers-2; band++) {
        draw_hemisphere_layer(band, totalLayers, numRadialPoints, centerX, centerY, bottomZ, radius, color);
    }
}

function draw_hemisphere_layer(currentLayer, totalLayers, numRadialPoints, centerX, centerY, bottomZ, radius, color) {

    // Get bottom horizontal band height
    var bottomRowZ = bottomZ + (radius * Math.sin(Math.PI/2 * currentLayer/totalLayers));

    // Get bottom horizontal band radius
    const bottomRowRad = Math.sqrt((radius*radius)-((bottomRowZ-bottomZ)*(bottomRowZ-bottomZ)));

    // Get top horizontal band height
    var topRowZ = bottomZ + (radius * Math.sin(Math.PI/2 * (currentLayer+1)/totalLayers));

    // Get top horizontal band radius
    const topRowRad = Math.sqrt((radius*radius)-((topRowZ-bottomZ)*(topRowZ-bottomZ)));

    //we do a little flattening
    bottomRowZ = bottomZ + 0.7*(radius * Math.sin(Math.PI/2 * currentLayer/totalLayers));
    topRowZ = bottomZ + 0.7*(radius * Math.sin(Math.PI/2 * (currentLayer+1)/totalLayers));

    // Generate all rectangles around band
    for (let i=0; i<numRadialPoints; i++) {

        // Calculate the coordinates of the quadrilateral to be shaded
        const bottomLeft = vec4(
            (centerX + (bottomRowRad * Math.sin(2*Math.PI*i/numRadialPoints))),
            bottomRowZ,
            (centerY + (bottomRowRad * Math.cos(2*Math.PI*i/numRadialPoints))),
            1.00);
        const bottomRight = vec4(
            (centerX + (bottomRowRad * Math.sin(2*Math.PI*((i+1)%numRadialPoints)/numRadialPoints))),
            bottomRowZ,
            (centerY + (bottomRowRad * Math.cos(2*Math.PI*((i+1)%numRadialPoints)/numRadialPoints))),
            1.00);
        const topLeft = vec4(
            (centerX + (topRowRad * Math.sin(2*Math.PI*i/numRadialPoints))),
            topRowZ,
            (centerY + (topRowRad * Math.cos(2*Math.PI*i/numRadialPoints))),
            1.00);
        const topRight = vec4(
            (centerX + (topRowRad * Math.sin(2*Math.PI*((i+1)%numRadialPoints)/numRadialPoints))),
            topRowZ,
            (centerY + (topRowRad * Math.cos(2*Math.PI*((i+1)%numRadialPoints)/numRadialPoints))),
            1.00);

        // Calculate normal vector to the quadrilateral
        const normal = normalize(cross(subtract(bottomRight, bottomLeft),
                                    subtract(topLeft, bottomLeft)));

        // Push the points to the points array
        var pIn=[bottomLeft,bottomRight,topLeft,topRight];
        var texIn=[];
        var addOrder=[0,1,3,0,2,3];
       
        for(let i=0;i<4;i++){
        	texIn.push(vec2(pIn[i][0],pIn[i][1]));
        }
        
        // Push the points to arrays
        for (let k=0; k<6; k++) {
        	points.push(pIn[addOrder[k]]);
        	texcoords.push(texIn[addOrder[k]]);
            colors.push(color);
            normals.push(normal);
        }

    }

    
}

function calc_hemisphere_points(totalLayers, numRadialPoints) {
    return (6*numRadialPoints*(totalLayers-2));// + (3*numRadialPoints);
}

function draw_hemisphere_cap(totalLayers, numRadialPoints, centerX, centerY, bottomZ, radius, color) {

    // Get horizontal band height
    const bandZ = bottomZ + (radius * Math.sin(Math.PI/2 * (totalLayers-1)/totalLayers));

    // Get top of hemisphere
    const topPoint = vec4(centerX, centerY, bottomZ+radius, 1.00);

    // Generate the cap to the hemisphere
    for (let i=0; i<numRadialPoints; i++) {
        const bottomLeft = vec4(
            (centerX + (radius * Math.sin(2*Math.PI*(numRadialPoints-1)/numRadialPoints))),
            (centerY + (radius * Math.cos(2*Math.PI*(numRadialPoints-1)/numRadialPoints))),
            bandZ,
            1.00);
        const bottomRight = vec4(
            (centerX + (radius * Math.sin(2*Math.PI*0/numRadialPoints))),
            (centerY + (radius * Math.cos(2*Math.PI*0/numRadialPoints))),
            bandZ,
            1.00);
        // Calculate normal vector to the quadrilateral
        const normal = normalize(cross(subtract(bottomLeft, bottomRight),
                                    subtract(bottomLeft, topPoint)));
            
        // Push all points to the points vector
        points.push(bottomLeft);
        points.push(bottomRight);
        points.push(topPoint);

        // Push color to colors vector
        // Push normal to normals vector
        for (let k=0; k<3; k++) {
            colors.push(color);
            normals.push(normal);
            texcoords.push(vec2(0,0));
        }
    }
}

function build_lettuce() {
    if(lettuce) {
        console.log("Building lettuce");
        const red = vec4(0.0, 0.9, 0.0, 1.0);
        const numRadialPoints = 20;
        const height = .05;
        addCylinder(.2, .2, .2, numRadialPoints, currentHeight, height, red, red);
        addCylinder(-.3, -.3, .2, numRadialPoints, currentHeight, height, red, red);
        addCylinder(.4, -.4, .2, numRadialPoints, currentHeight, height, red, red);
        
        currentHeight += height;
        lettucePoints+=36;
        burgerPoints+=3*calc_cylinder_points(numRadialPoints);
    }
}

function build_cheese() {
    if(cheese) {
        console.log("Building change");
        const length = 1.28;
        quad(1, 0, 3, 2, 2,currentHeight,currentHeight+0.0625,length);
        quad(2, 3, 7, 6, 2,currentHeight,currentHeight+0.0625,length);
        quad(3, 0, 4, 7, 2,currentHeight,currentHeight+0.0625,length);
        quad(6, 5, 1, 2, 2,currentHeight,currentHeight+0.0625,length);
        quad(4, 5, 6, 7, 2,currentHeight,currentHeight+0.0625,length);
        quad(5, 4, 0, 1, 2,currentHeight,currentHeight+0.0625,length);
        currentHeight += 0.0625;
        cheesePoints+=36;
        burgerPoints+=36;
    } 
}

function build_tomato() {
    console.log(tomato)
    if(tomato) {
        console.log("Building tomato");
        const red = vec4(0.9, 0.0, 0.0, 1.0);
        const numRadialPoints = 100;
        const height = 0.1;
        // drawCyl(0,0,currentHeight,-0.125,0.65,vec4(0.9,0,0,1));
        addCylinder(0, 0, 0.65, numRadialPoints, currentHeight, height, red, red);
        currentHeight += height;
        const numPoints = calc_cylinder_points(numRadialPoints);
        tomatoPoints += numPoints;
        burgerPoints += numPoints;
    } 
}

function build_patty() {
    if(patty) {
        console.log("Building patty");
        // drawCyl(0,0,currentHeight,-0.25,0.75,vec4(0.9,0.35,0.05,1));
        let numRadialPoints = 100;
        let height = 0.15;
        addCylinder(0, 0, 0.75, numRadialPoints, currentHeight, height, pattyColorVec, pattyColorVec);
        currentHeight += height;
        const numPoints = calc_cylinder_points(numRadialPoints);
        pattyPoints += numPoints;
        burgerPoints += numPoints;
    } 
    console.log("patty: " + pattyPoints + " burger now: "+ burgerPoints);
}

function build_bottom_bun() {
    // drawCyl(0,0,currentHeight,-0.25,0.75,vec4(.9569,.6431,.3765,1));
    // currentHeight += 0.25;
    // bottomBunPoints += 6*numPtsCirc;
    // burgerPoints += 6*numPtsCirc;
    console.log("Building bottom bun");
    let numRadialPoints = 100   ;
    addCylinder(0, 0, 0.80, numRadialPoints, currentHeight, 0.2, bunColorVec, bunColorVec);
    currentHeight += 0.2;
    const numPoints = calc_cylinder_points(numRadialPoints);
    pattyPoints += numPoints;
    burgerPoints += numPoints;
}

function build_burger() {
    console.log("Building burger");
    currentHeight = -0.5;
    build_bottom_bun();
    build_patty();
    build_cheese();
    build_tomato();
    build_lettuce();
    build_top_bun();
}

function wall()
{
    console.log(`Big Burger Mode: ${bigBurgerMode}`);
    var vertices = [
        vec4(-5.0, -2.5, -5.0, 1.0),
        vec4( 5.0, -2.5, -5.0, 1.0),
        vec4( 5.0,  2.5, -5.0, 1.0),
        vec4(-5.0,  2.5, -5.0, 1.0),
    ];
    if (bigBurgerMode) {
        vertices = [
            vec4(-150, -75, -5, 1),
            vec4( 150, -75, -5, 1),
            vec4( 150,  75, -5, 1),
            vec4(-150,  75, -5, 1),
        ];
    }

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
    // console.log(points)
}

function resetBurger() {
    points = [];
    normals = [];
    colors = [];
    texcoords = [];

    wallPoints = 6;
    burgerPoints = 0;
    topBunPoints = 0;
    lettucePoints = 0;
    tomatoPoints = 0;
    cheesePoints = 0;
    pattyPoints = 0;
    bottomBunPoints = 0;
    build_burger();
    wall();
    console.log("points in Normals = " + normals[normals.length-1] + " and total points in vertex is " + points.length);
}

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert("WebGL 2.0 isn't available"); }

    

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.5, 0.5, 1.0);

    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

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

    texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height/2.0, 0,
		  gl.RGBA, gl.UNSIGNED_BYTE, null);
    // Mipmapping seems to cause problems in at least some cases
    // gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap1"), 0);

    

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

    var image = new Image();
    image.src = "bun.png";
    // var image = document.getElementById("texImage");


    var texture2 = gl.createTexture();
    // This is necessary to get the texture right side up
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap2"), 0);
    


    var pattyCheckbox = document.getElementById("pattyB");
    
    if (pattyCheckbox.checked) {
        patty = true;
    } else {
        patty = false;
    }
    pattyCheckbox.onchange = function(event) {
        // patty = !patty;
        if (pattyCheckbox.checked) {
            patty = true;
        } else {
            patty = false;
        }
	    resetBurger();
    };

    var cheeseCheckbox = document.getElementById("cheeseB");
    if (cheeseCheckbox.checked) {
        cheese = true;
    } else {
        cheese = false;
    }

    cheeseCheckbox.onchange = function(event) {
        // cheese = !cheese;
        if (cheeseCheckbox.checked) {
            cheese = true;
        } else {
            cheese = false;
        }
        resetBurger();
    };

    var lettuceCheckbox = document.getElementById("lettuceB");
    if (lettuceCheckbox.checked) {
        lettuce = true;
    } else {
        lettuce = false;
    }

    lettuceCheckbox.onchange = function(event) {
        // lettuce = !lettuce;
        if (lettuceCheckbox.checked) {
            lettuce = true;
        } else {
            lettuce = false;
        }
	    resetBurger();
    };

    var tomatoCheckbox = document.getElementById("tomatoB");
    if (tomatoCheckbox.checked) {
        console.log("tomato true");
        tomato = true;
    } else {
        console.log("tomato false");
        tomato = false;
    }
    tomatoCheckbox.onchange = function(event) {
        // tomato = !tomato;
        if (tomatoCheckbox.checked) {
            console.log("tomato true");
            tomato = true;
        } else {
            console.log("tomato false");
            tomato = false;
        }
	    resetBurger();
    };

    var bigBurgerCheckbox = document.getElementById("bigBurgerB");
    if (bigBurgerCheckbox.checked) {
        console.log("big burger mode activated");
        bigBurgerMode = true;
    } else {
        console.log("big burger mode in waiting");
        bigBurgerMode = false;
    }
    bigBurgerCheckbox.onchange = function(event) {
        if (bigBurgerCheckbox.checked) {
            console.log("big burger mode activated");
            bigBurgerMode = true;
        } else {
            console.log("big burger mode in waiting");
            bigBurgerMode = false;
        }
	    resetBurger();
    };
    build_burger();
    wall();

    render();
};

// frustum? i hardley knew em
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
	gl.drawArrays(gl.LINE_LOOP, burgerPoints, wallPoints);
    }

    // console.log(burgerPoints);
    ModelView = mult(ModelView,
    		     mult(translate(trans[0], trans[1], trans[2]),
    			  mult(rotateZ(theta[2]),
    			       mult(rotateY(theta[1]),
    				    rotateX(theta[0])))));
    Normal = transpose(inverse(ModelView));

    gl.uniformMatrix4fv(ModelViewMatrixLoc, false, flatten(ModelView));
    gl.uniformMatrix4fv(NormalMatrixLoc, false, flatten(Normal));

    gl.drawArrays(gl.TRIANGLES, 0, burgerPoints);
    // gl.drawArrays(gl.TRIANGLES, 0, burgerPoints);
    // gl.drawArrays(gl.TRIANGLES, 0,bottomBunPoints);
    // gl.drawArrays(gl.TRIANGLES, bottomBunPoints, pattyPoints);
    // gl.drawArrays(gl.TRIANGLES, bottomBunPoints+pattyPoints, tomatoPoints);
    // gl.drawArrays(gl.TRIANGLES, bottomBunPoints+pattyPoints+tomatoPoints, cheesePoints);
    // gl.drawArrays(gl.TRIANGLES, bottomBunPoints+pattyPoints+tomatoPoints+cheesePoints, lettucePoints);
    // gl.drawArrays(gl.TRIANGLES, bottomBunPoints+pattyPoints+tomatoPoints+cheesePoints+lettucePoints, topBunPoints);

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
	
	gl.drawArrays(gl.TRIANGLES, burgerPoints, wallPoints);
    
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
	    
        gl.drawArrays(gl.TRIANGLES, 0, burgerPoints-topBunPoints);
        // gl.drawArrays(gl.TRIANGLE_FAN, 0, burgerPoints);
        // gl.drawArrays(gl.TRIANGLES, 0,bottomBunPoints);
        // gl.drawArrays(gl.TRIANGLES, bottomBunPoints, pattyPoints);
        // gl.drawArrays(gl.TRIANGLES, bottomBunPoints+pattyPoints, tomatoPoints);
        // gl.drawArrays(gl.TRIANGLES, bottomBunPoints+pattyPoints+tomatoPoints, cheesePoints);
        // gl.drawArrays(gl.TRIANGLES, bottomBunPoints+pattyPoints+tomatoPoints+cheesePoints, lettucePoints);
        // gl.drawArrays(gl.TRIANGLES, bottomBunPoints+pattyPoints+tomatoPoints+cheesePoints+lettucePoints, topBunPoints);
            
	    gl.uniform1f(TextureOnLoc, 2.0);

        gl.drawArrays(gl.TRIANGLES, burgerPoints-topBunPoints, topBunPoints);
	}
    }
    
    theta[axis] += 1.0;
    phi += 0.01;
    trans = [radius*Math.cos(phi), 0, radius*Math.sin(phi)];

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

    requestAnimationFrame(render);
}
