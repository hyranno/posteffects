import * as glutil from 'glutil';

export function filter1dVec3(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  resolution: [number, number],
  kernel: [number, number, number][],
  direction: [number, number],
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
    uniform int kernelSize;
    uniform vec3[256] kernel;
    uniform vec2 direction;
    out vec4 outColor;
    void main(){
      vec3 res = vec3(0);
      for (int i=0; i<kernelSize; i++) {
        vec2 uv = (gl_FragCoord.xy + (float(i) - float(kernelSize)/2.0) * direction) / resolution;
        res += kernel[i] * texture(src, uv).xyz;
      }
      outColor = vec4(res, 1);
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
  gl.uniform1i(context.getUniformLocation(program, "kernelSize"), kernel.length);
  kernel.forEach((v,i) =>
    gl.uniform3fv(context.getUniformLocation(program, "kernel["+i+"]"), new Float32Array(v))
  );
  gl.uniform2fv(context.getUniformLocation(program, "direction"), new Float32Array(direction));

  context.drawArrays(context.TRIANGLE_FAN, 0, 4);

  /* unbind */
  context.bindBuffer(context.ARRAY_BUFFER, null);
  context.bindTexture(gl.TEXTURE_2D, null);
}
