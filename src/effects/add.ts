import * as glutil from 'glutil';

export function add(
  context: WebGL2RenderingContext,
  src0: WebGLTexture,
  src1: WebGLTexture,
  resolution: [number, number],
  coef: [number, number],
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
    uniform sampler2D src0;
    uniform sampler2D src1;
    uniform vec2 coef;
    out vec4 outColor;
    void main(){
      vec2 uv = gl_FragCoord.xy / resolution;
      vec3 color = clamp(coef.x*texture(src0, uv) + coef.y*texture(src1, uv), 0.0, 1.0).xyz;
      outColor = vec4(color, 1.0);
    }
  `
  let gl = context;
  let program = glutil.prepareProgram(context, vs, fs);

  const vertexPositions = [[+1.0, +1.0], [+1.0, -1.0], [-1.0, -1.0], [-1.0, +1.0]];
  const vertexBuffer = context.createBuffer();
  context.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  context.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions.flat()), gl.STATIC_DRAW);
  context.bindBuffer(gl.ARRAY_BUFFER, null);

  context.useProgram(program);
  /* vertex */
  context.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  const location = context.getAttribLocation(program, 'position');
  context.enableVertexAttribArray(location);
  context.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  /* fragment */
  context.uniform2fv(context.getUniformLocation(program, "resolution"), resolution);
  context.activeTexture(gl.TEXTURE0);
  context.bindTexture(gl.TEXTURE_2D, src0);
  context.uniform1i(context.getUniformLocation(program, "src0"), 0);
  context.activeTexture(gl.TEXTURE1);
  context.bindTexture(gl.TEXTURE_2D, src1);
  context.uniform1i(context.getUniformLocation(program, "src1"), 1);
  context.uniform2fv(context.getUniformLocation(program, "coef"), coef);

  context.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  /* unbind */
  context.bindBuffer(gl.ARRAY_BUFFER, null);
  context.bindTexture(gl.TEXTURE_2D, null);
  context.activeTexture(gl.TEXTURE0);
  context.bindTexture(gl.TEXTURE_2D, null);
}
