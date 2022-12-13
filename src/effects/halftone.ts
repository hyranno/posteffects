import * as glutil from 'glutil';

export function halftone(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  resolution: [number, number],
  tileSize: number,
  requantizationScale: [number, number, number, number],
  offset: [number, number],
  angle: number,
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
    uniform float tileSize;
    uniform vec4 requantizationScale;
    uniform vec2 offset;
    uniform float angle;
    out vec4 outColor;
    void main(){
      vec2 uv = gl_FragCoord.xy / resolution;
      vec4 color = texture(src, uv);
      mat2 dcm = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
      vec2 lCoord = mod(dcm*(gl_FragCoord.xy + offset), tileSize) / tileSize - vec2(0.5);
      vec4 pattern = sqrt(lCoord.x*lCoord.x + lCoord.y*lCoord.y) * requantizationScale;
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
  gl.uniform1f(context.getUniformLocation(program, "tileSize"), tileSize);
  gl.uniform4fv(context.getUniformLocation(program, "requantizationScale"), [0.25, 0.25, 0.25, 1.0]);
  gl.uniform2fv(context.getUniformLocation(program, "offset"), [3.0, 5.0]);
  gl.uniform1f(context.getUniformLocation(program, "angle"), angle);

  context.drawArrays(context.TRIANGLE_FAN, 0, 4);

  /* unbind */
  context.bindBuffer(context.ARRAY_BUFFER, null);
  context.bindTexture(gl.TEXTURE_2D, null);
}
