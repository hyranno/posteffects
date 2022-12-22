import * as glutil from 'glutil';

export function nop(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  resolution: [number, number],
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
    out vec4 outColor;

    vec2 uv(ivec2 pixel) {
      return (vec2(pixel) + vec2(0.5)) / resolution;
    }

    void main(){
      outColor = texture(src, uv(ivec2(gl_FragCoord.xy)));
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
  gl.uniform2fv(context.getUniformLocation(program, "resolution"), resolution);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, src);
  gl.uniform1i(context.getUniformLocation(program, "src"), 0);

  /* draw call */
  context.drawArrays(context.TRIANGLE_FAN, 0, 4);

  /* unbind */
  context.bindBuffer(context.ARRAY_BUFFER, null);
  context.bindTexture(gl.TEXTURE_2D, null);
}
