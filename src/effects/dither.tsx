import type { Component } from 'solid-js';
import * as glutil from 'glutil';

const Dither: Component<{
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
    uniform int depth;
    uniform float requantizationScale;
    out vec4 outColor;
    void main(){
      vec2 uv = gl_FragCoord.xy / resolution;
      vec4 color = texture(src, uv);
      float tileSize = float(1 << depth); // pow(2.0, float(depth));
      vec2 lCoord = mod(gl_FragCoord.xy, tileSize);
      /* pattern when (depth == 2)
      0 8 2 a = 0 2 0 2 *4 + 0 0 2 2
      c 4 e 6   3 1 3 1      0 0 2 2
      3 b 1 9   0 2 0 2      3 3 1 1
      f 7 d 5   3 1 3 1      3 3 1 1
      */
      float pattern = 0.0;
      for (int d=0; d<depth; d++) {
        pattern += 4.0 * pattern + mod(2.0*float((int(lCoord.x) >> d) & 1) + 3.0*float((int(lCoord.y) >> d) & 1), 4.0);
      }
      pattern = pattern / (tileSize*tileSize) * requantizationScale ;
      vec4 requantized = requantizationScale * floor((color + pattern) / requantizationScale);
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
    gl.uniform1i(
      context.getUniformLocation(program, "depth"),
      3
    );
    gl.uniform1f(
      context.getUniformLocation(program, "requantizationScale"),
      64.0 / 256.0
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

export default Dither;
