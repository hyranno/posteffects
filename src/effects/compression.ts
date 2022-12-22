import * as glutil from 'glutil';
import {nop} from 'effects/nop';
import {wavelet_5_3, waveletInverse_5_3} from 'effects/wavelet';

function calcBase(minBase: number, rate: number, depth: number): number {
  return minBase + rate * depth;
}

function log_requantize(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  dest: WebGLFramebuffer | null,
  resolution: [number, number],
  clip: [number, number],
  base: number,
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
    uniform vec2 mask;
    uniform float base;
    out vec4 outColor;

    vec2 uv(ivec2 pixel) {
      return (vec2(pixel) + vec2(0.5)) / resolution;
    }

    void main(){
      if (
          clip.x <= gl_FragCoord.x ||
          clip.y <= gl_FragCoord.y ||
          (gl_FragCoord.x < mask.x  && gl_FragCoord.y < mask.y)
      ) {
        outColor = texture(src, uv(ivec2(gl_FragCoord.xy)));
        return;
      }

      float maxVal = 255.0;
      vec3 srcColor = texture(src, uv(ivec2(gl_FragCoord.xy))).xyz - vec3(0.5);
      vec3 resColor = sign(srcColor) * floor(log(abs(srcColor) * maxVal) / log(base)) / maxVal;

      outColor = vec4(
        resColor + vec3(0.5),
        1.0
      );
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
  gl.uniform2fv(context.getUniformLocation(program, "mask"), clip.map(v => Math.ceil(v/2)));
  gl.uniform1f(context.getUniformLocation(program, "base"), base);

  context.bindFramebuffer(gl.FRAMEBUFFER, dest);
  context.drawArrays(context.TRIANGLE_FAN, 0, 4);

  /* unbind */
  context.bindBuffer(context.ARRAY_BUFFER, null);
  context.bindTexture(gl.TEXTURE_2D, null);
}
function log_pow(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  dest: WebGLFramebuffer | null,
  resolution: [number, number],
  clip: [number, number],
  base: number,
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
    uniform vec2 mask;
    uniform float base;
    out vec4 outColor;

    vec2 uv(ivec2 pixel) {
      return (vec2(pixel) + vec2(0.5)) / resolution;
    }

    void main(){
      if (
          clip.x <= gl_FragCoord.x ||
          clip.y <= gl_FragCoord.y ||
          (gl_FragCoord.x < mask.x  && gl_FragCoord.y < mask.y)
      ) {
        outColor = texture(src, uv(ivec2(gl_FragCoord.xy)));
        return;
      }

      float maxVal = 255.0;
      vec3 srcColor = texture(src, uv(ivec2(gl_FragCoord.xy))).xyz - vec3(0.5);
      vec3 resColor = sign(srcColor) * pow(vec3(base), abs(srcColor) * maxVal) / maxVal;
      outColor = vec4(
        resColor + vec3(0.5),
        1.0
      );
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
  gl.uniform2fv(context.getUniformLocation(program, "mask"), clip.map(v => Math.ceil(v/2)));
  gl.uniform1f(context.getUniformLocation(program, "base"), base);

  context.bindFramebuffer(gl.FRAMEBUFFER, dest);
  context.drawArrays(context.TRIANGLE_FAN, 0, 4);

  /* unbind */
  context.bindBuffer(context.ARRAY_BUFFER, null);
  context.bindTexture(gl.TEXTURE_2D, null);
}

export function compress(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  dest: WebGLFramebuffer | null,
  resolution: [number, number],
  depth: number,
  minBase: number,
  rate: number,
){
  let gl = context;
  let hTexture = glutil.createBufferTexture(context, resolution);
  let hBuffer = glutil.bindNewFramebuffer(context, hTexture);
  let wTexture = glutil.createBufferTexture(context, resolution);
  let wBuffer = glutil.bindNewFramebuffer(context, wTexture);
  let qTexture = glutil.createBufferTexture(context, resolution);
  let qBuffer = glutil.bindNewFramebuffer(context, qTexture);
  nop(context, src, resolution);
  var clip = resolution.slice() as [number, number];
  for (var i: number = 0; i < depth; i++) {
    let base = calcBase(minBase, rate, depth - i);
    wavelet_5_3(context, qTexture, hBuffer, resolution, clip, 0);
    wavelet_5_3(context, hTexture, wBuffer, resolution, clip, 1);
    log_requantize(context, wTexture, qBuffer, resolution, clip, base);
    clip = clip.map(v => Math.ceil(v/2)) as [number, number];
  }
  context.bindFramebuffer(gl.FRAMEBUFFER, dest);
  nop(context, qTexture, resolution);
}

export function decompress(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  dest: WebGLFramebuffer | null,
  resolution: [number, number],
  depth: number,
  minBase: number,
  rate: number,
){
  let gl = context;
  let hTexture = glutil.createBufferTexture(context, resolution);
  let hBuffer = glutil.bindNewFramebuffer(context, hTexture);
  let wTexture = glutil.createBufferTexture(context, resolution);
  let wBuffer = glutil.bindNewFramebuffer(context, wTexture);
  let qTexture = glutil.createBufferTexture(context, resolution);
  let qBuffer = glutil.bindNewFramebuffer(context, qTexture);
  nop(context, src, resolution);
  var clips = [resolution.slice() as [number, number]];
  for (var i: number = 1; i < depth; i++) {
    clips[i] = clips[i-1].map(v => Math.ceil(v/2)) as [number, number];
  }
  for (var i: number = depth - 1; 0 <= i; i--) {
    let clip = clips[i];
    let base = calcBase(minBase, rate, depth - i);
    log_pow(context, qTexture, wBuffer, resolution, clip, base);
    waveletInverse_5_3(context, wTexture, hBuffer, resolution, clip, 1);
    waveletInverse_5_3(context, hTexture, qBuffer, resolution, clip, 0);
  }
  context.bindFramebuffer(gl.FRAMEBUFFER, dest);
  nop(context, qTexture, resolution);
}
