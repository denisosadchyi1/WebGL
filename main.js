// import { numToRad } from "./Utils/numToRad";

let gl; // The webgl context.
let surface; // surface model
let shaderProgram; // shader program
let rotateBall; // object for rotate the view by mouse.

function numToRad(angle) {
  return (angle * Math.PI) / 180;
}

const R = 1;
const m = 1;
const n = 1;

const x = (r, B) => r * Math.cos(B);
const y = (r, B) => r * Math.sin(B);
const z = (r) => m * Math.cos((n * Math.PI * r) / R);

// initialize Model
function Model(name) {
  this.name = name;
  this.buffer = gl.createBuffer();
  this.count = 0;

  this.BufferData = function (vertices) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

    this.count = vertices.length / 3;
  };

  this.Draw = function () {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.vertexAttribPointer(
      shaderProgram.iAttribVertex,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(shaderProgram.iAttribVertex);

    gl.drawArrays(gl.LINE_STRIP, 0, this.count);
  };
}

function ShaderProgram(name, program) {
  this.name = name;
  this.prog = program;

  // attribute variable in the shader program.
  this.iAttribVertex = -1;
  // uniform specifying a color for the primitive.
  this.iColor = -1;
  // uniform matrix representing the combined transformation.
  this.iModelViewProjectionMatrix = -1;

  this.Use = function () {
    gl.useProgram(this.prog);
  };
}

// Draws a colored cube, along with a set of coordinate axes.
function draw() {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

  /* Set the values of the projection transformation */
  let projection = m4.perspective(Math.PI / 2, aspect, 1, 2000);

  /* Get the view matrix from the ratator object.*/
  let modelView = rotateBall.getViewMatrix();

  let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
  let translateToPointZero = m4.translation(0, 0, -10);

  let accum0 = m4.multiply(rotateToPointZero, modelView);
  let accum1 = m4.multiply(translateToPointZero, accum0);

  /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
  let modelViewProjection = m4.multiply(projection, accum1);

  gl.uniformMatrix4fv(
    shaderProgram.iModelViewProjectionMatrix,
    false,
    modelViewProjection
  );

  /* Draw the six faces of a cube, with different colors. */
  gl.uniform4fv(shaderProgram.iColor, [0, 1, 1, 1]);

  surface.Draw();
}

function CreateSurfaceData() {
  let vertexCircles = [];

  for (let r = 0; r <= 7; r += Math.PI / 8) {
    let vertexCircle = [];
    for (let B = 0; B <= 2 * Math.PI; B += Math.PI / 50) {
      vertexCircle.push([x(r, B), y(r, B), z(r)]);
    }
    vertexCircles.push(vertexCircle);
  }

  let vertixLines = vertexCircles[0].map((col, i) =>
    vertexCircles.map((row) => row[i])
  );

  vertixLines = vertixLines.map((vertexLine) => [
    ...vertexLine,
    ...vertexLine.slice().reverse(),
  ]);
  vertexCircles = vertexCircles.map((vertexCircle) => [
    ...vertexCircle,
    ...vertexCircle.slice().reverse(),
  ]);

  return [...vertixLines.flat(Infinity), ...vertexCircles.flat(Infinity)];
}
/* Initialize the WebGL context. Called from init() */
function initGL() {
  let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

  shaderProgram = new ShaderProgram("Basic", prog);
  shaderProgram.Use();

  shaderProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
  shaderProgram.iModelViewProjectionMatrix = gl.getUniformLocation(
    prog,
    "ModelViewProjectionMatrix"
  );
  shaderProgram.iColor = gl.getUniformLocation(prog, "color");

  surface = new Model("Surface");
  surface.BufferData(CreateSurfaceData());

  gl.enable(gl.DEPTH_TEST);
}

/* Creates a program for use in the WebGL context gl */
function createProgram(gl, vShader, fShader) {
  let vsh = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vsh, vShader);
  gl.compileShader(vsh);
  if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
    throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
  }
  let fsh = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fsh, fShader);
  gl.compileShader(fsh);
  if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
    throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
  }
  let prog = gl.createProgram();
  gl.attachShader(prog, vsh);
  gl.attachShader(prog, fsh);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
  }
  return prog;
}

/**
 * initialization function that will be called when the page has loaded
 */
function init() {
  let canvas;
  try {
    canvas = document.getElementById("webglcanvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
      // Check condition support WebGL
      throw "Your browser does not support WebGL, pls check version of your browser and support WebGL";
    }
  } catch (e) {
    document.getElementById("canvas-holder").innerHTML =
      "<p>Could'nt get a WebGL context :(</p>";
    return;
  }
  try {
    initGL(); // Check condition initialize the WebGL context
  } catch (e) {
    document.getElementById("canvas-holder").innerHTML =
      "<p>Could'nt initialize the WebGL context :( </p>";
    return;
  }

  rotateBall = new TrackballRotator(canvas, draw, 0);

  draw();
}
