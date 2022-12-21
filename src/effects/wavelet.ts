import * as glutil from 'glutil';


export function wavelet_5_3(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  dest: WebGLFramebuffer | null,
  resolution: [number, number],
  clip: [number, number],
  axis: number,
) {
  const vs = `#version 300 es
    in vec2 position;
    void main(void) {
      gl_Position = vec4(position, 0, 1);
    }
  `;
  const fs = `#version 300 es
    precision mediump float;
    uniform sampler2D src;
    uniform vec2 resolution;
    uniform vec2 clip;
    uniform int axis;
    out vec4 outColor;

    vec2 uv(ivec2 pixel) {
      return (vec2(pixel) + vec2(0.5)) / resolution;
    }

    vec3 high(ivec2 center, ivec2 direction) {
      return texture(src, uv(center)).xyz
        - 0.5 * (
          texture(src, uv(center - direction)).xyz +
          texture(src, uv(center + direction)).xyz
        )
      ;
    }
    vec3 low(ivec2 center, ivec2 direction) {
      return 0.75 * texture(src, uv(center)).xyz
        + 0.25 * (
          texture(src, uv(center - direction)).xyz +
          texture(src, uv(center + direction)).xyz
        )
        - 0.125 * (
          texture(src, uv(center - 2*direction)).xyz +
          texture(src, uv(center + 2*direction)).xyz
        )
      ;
    }

    //TODO: mirror index around clip

    void main(){
      if (clip.x <= gl_FragCoord.x  || clip.y <= gl_FragCoord.y) {
        outColor = texture(src, uv(ivec2(gl_FragCoord.xy)));
        return;
      }
      int length_low = (int(resolution[axis]) + 1) / 2;
      int length_high = int(resolution[axis]) - length_low;
      bool is_low = int(gl_FragCoord[axis]) < length_low;
      ivec2 direction = ivec2(0);
      direction[axis] = 1;
      ivec2 center = ivec2(gl_FragCoord.xy);

      if (is_low) {
        center[axis] = center[axis] * 2;
        outColor = vec4(low(center, direction), 1.0);
      } else {
        center[axis] = (center[axis] - length_low) * 2 + 1;
        outColor = vec4(high(center, direction)*0.5 + vec3(0.5), 1.0);
      }
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
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, src);
  gl.uniform1i(context.getUniformLocation(program, "src"), 0);
  gl.uniform2fv(context.getUniformLocation(program, "resolution"), resolution);
  gl.uniform2fv(context.getUniformLocation(program, "clip"), clip);
  gl.uniform1i(context.getUniformLocation(program, "axis"), axis);

  context.drawArrays(context.TRIANGLE_FAN, 0, 4);

  /* unbind */
  context.bindBuffer(context.ARRAY_BUFFER, dest);
  context.bindTexture(gl.TEXTURE_2D, null);
}


export function waveletInverse_5_3(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  dest: WebGLFramebuffer | null,
  resolution: [number, number],
  clip: [number, number],
  axis: number,
) {
  const vs = `#version 300 es
    in vec2 position;
    void main(void) {
      gl_Position = vec4(position, 0, 1);
    }
  `;
  const fs = `#version 300 es
    precision mediump float;
    uniform sampler2D src;
    uniform vec2 resolution;
    uniform vec2 clip;
    uniform int axis;
    out vec4 outColor;

    vec2 uv(ivec2 pixel) {
      return (vec2(pixel) + vec2(0.5)) / resolution;
    }

    vec3 low(ivec2 index) {
      index[axis] = index[axis] / 2;
      return texture(src, uv(index)).xyz;
    }
    vec3 high(ivec2 index) {
      int length_low = (int(clip[axis]) + 1) / 2;
      index[axis] = index[axis] / 2 + length_low;
      return (texture(src, uv(index)).xyz - vec3(0.5)) * 2.0;
    }
    vec3 extractEven(ivec2 index, ivec2 direction) {
      return low(index)
        - 0.25 * (
          high(index - direction) +
          high(index + direction)
        )
      ;
    }
    vec3 extractOdd(ivec2 index, ivec2 direction) {
      return 0.75 * high(index)
        + 0.5 * (
          low(index - direction) +
          low(index + direction)
        )
        - 0.125 * (
          high(index - 2*direction) +
          high(index + 2*direction)
        )
      ;
    }

    //TODO: mirror index around clip

    void main() {
      if (clip.x <= gl_FragCoord.x  || clip.y <= gl_FragCoord.y) {
        outColor = texture(src, uv(ivec2(gl_FragCoord.xy)));
        return;
      }
      ivec2 index = ivec2(gl_FragCoord.xy);
      ivec2 direction = ivec2(0);
      direction[axis] = 1;

      outColor = vec4(
        mix(
          extractEven(index, direction),
          extractOdd(index, direction),
          bvec3((index[axis] & 1) == 1)
        ),
        1.0
      );
    }
  `;
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
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, src);
  gl.uniform1i(context.getUniformLocation(program, "src"), 0);
  gl.uniform2fv(context.getUniformLocation(program, "resolution"), resolution);
  gl.uniform2fv(context.getUniformLocation(program, "clip"), clip);
  gl.uniform1i(context.getUniformLocation(program, "axis"), axis);

  context.drawArrays(context.TRIANGLE_FAN, 0, 4);

  /* unbind */
  context.bindBuffer(context.ARRAY_BUFFER, dest);
  context.bindTexture(gl.TEXTURE_2D, null);
}
