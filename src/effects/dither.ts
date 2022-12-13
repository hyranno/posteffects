import * as glutil from 'glutil';

export function dither(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  resolution: [number, number],
  depth: number,
  requantizationScale: number,
) {
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
  let gl = context;
  let program = glutil.prepareProgram(context, vs, fs);

  const vertexPositions = [[+1.0, +1.0], [+1.0, -1.0], [-1.0, -1.0], [-1.0, +1.0]];
  const vertexBuffer = context.createBuffer();
  context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
  context.bufferData(context.ARRAY_BUFFER, new Float32Array(vertexPositions.flat()), context.STATIC_DRAW);
  context.bindBuffer(context.ARRAY_BUFFER, null);

  context.useProgram(program);
  /* vertex */
  context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
  const location = context.getAttribLocation(program, 'position');
  context.enableVertexAttribArray(location);
  context.vertexAttribPointer(location, 2, context.FLOAT, false, 0, 0);
  /* fragment */
  const resolutionLocation = context.getUniformLocation(program, "resolution");
  gl.uniform2fv(resolutionLocation, resolution);
  const srcLocation = context.getUniformLocation(program, "src");
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, src);
  gl.uniform1i(srcLocation, 0);
  gl.uniform1i(context.getUniformLocation(program, "depth"), depth);
  gl.uniform1f(context.getUniformLocation(program, "requantizationScale"), requantizationScale);

  context.drawArrays(context.TRIANGLE_FAN, 0, 4);

  /* unbind */
  context.bindBuffer(context.ARRAY_BUFFER, null);
  context.bindTexture(gl.TEXTURE_2D, null);
}
