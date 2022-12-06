import type { Component } from 'solid-js';
import * as glutil from 'glutil';

const HalfToneLike: Component<{
  src: (HTMLCanvasElement | HTMLImageElement),
}> = (props) => {
  const vs = `#version 300 es
    in vec2 position;
    void main(void) {
      gl_Position = vec4(position, 0, 1);
    }
  `;
  const fs = `#version 300 es
    precision mediump float;
    uniform vec2 resolution;
    uniform sampler2D src;
    uniform float tileSize;
    uniform vec4 requantizationScale;
    uniform vec2 offset;
    uniform float angle;
    out vec4 outColor;
    void main(){
      vec2 uv = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y) / resolution;
      vec4 color = texture(src, uv);
      mat2 dcm = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
      vec2 lCoord = mod(dcm*(gl_FragCoord.xy + offset), tileSize) / tileSize - vec2(0.5);
      vec4 pattern = sqrt(lCoord.x*lCoord.x + lCoord.y*lCoord.y) * requantizationScale;
      vec4 requantized = requantizationScale * round((color + pattern) / requantizationScale);
      outColor = requantized;
    }
  `
  const canvas = document.createElement("canvas")!;
  canvas.width = props.src.width;
  canvas.height = props.src.height;
  const [context, program] = glutil.bindShader(canvas, vs, fs);
  const gl = context;

  const vertexPositions = [[+1.0, +1.0], [+1.0, -1.0], [-1.0, -1.0], [-1.0, +1.0]];
  const vertexBuffer = context.createBuffer();
  context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
  context.bufferData(context.ARRAY_BUFFER, new Float32Array(vertexPositions.flat()), context.STATIC_DRAW);
  context.bindBuffer(context.ARRAY_BUFFER, null);

  const srcTexture = context.createTexture()!;
  glutil.loadTexture(props.src, srcTexture, context);

  function drawCall() {
    context.useProgram(program);
    /* vertex */
    context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
    const location = context.getAttribLocation(program, 'position');
    context.enableVertexAttribArray(location);
    context.vertexAttribPointer(location, 2, context.FLOAT, false, 0, 0);
    /* fragment */
    const resolution = [props.src.width, props.src.height];
    const resolutionLocation = context.getUniformLocation(program, "resolution");
    gl.uniform2fv(resolutionLocation, resolution);
    const srcLocation = context.getUniformLocation(program, "src");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTexture);
    gl.uniform1i(srcLocation, 0);
    gl.uniform1f(
      context.getUniformLocation(program, "tileSize"),
      24.0
    );
    gl.uniform4fv(
      context.getUniformLocation(program, "requantizationScale"),
      [0.25, 0.25, 0.25, 1.0]
    );
    gl.uniform2fv(
      context.getUniformLocation(program, "offset"),
      [3.0, 5.0]
    );
    gl.uniform1f(
      context.getUniformLocation(program, "angle"),
      3.14 / 6.0
    );
    /* draw call */
    context.drawArrays(context.TRIANGLE_FAN, 0, 4);
    /* unbind */
    context.bindBuffer(context.ARRAY_BUFFER, null);
    context.bindTexture(gl.TEXTURE_2D, null);
  }
  drawCall();

  return (
    <div>
      {canvas}
    </div>
  );
};

export default HalfToneLike;
