import * as glutil from 'glutil';

import {NopShader} from 'effects/nop';

export class WaveletShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  clip: [number, number];
  axis: number;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    clip: [number, number],
    axis: number,
  ) {
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
        int length_low = (int(clip[axis]) + 1) / 2;
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
    `;
    super(context, fs);
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
    this.clip = clip;
    this.axis = axis;
  }

  override update(){
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, this.src);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "src"), 0);
    this.context.uniform2fv(this.context.getUniformLocation(this.program, "clip"), this.clip);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "axis"), this.axis);

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }
}


export class WaveletInverseShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  clip: [number, number];
  axis: number;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    clip: [number, number],
    axis: number,
  ) {
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
    super(context, fs);
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
    this.clip = clip;
    this.axis = axis;
  }

  override update(){
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, this.src);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "src"), 0);
    this.context.uniform2fv(this.context.getUniformLocation(this.program, "clip"), this.clip);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "axis"), this.axis);

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }
}


export class Wavelet2dEffect extends glutil.GlEffect {
  resolution: [number, number];
  depth: number;
  copyFromSrc: NopShader;
  copyToDest: NopShader;
  horizontalWavelet: WaveletShader;
  verticalWavelet: WaveletShader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    depth: number,
  ) {
    super(context);
    this.resolution = resolution;
    this.depth = depth;
    let hTexture = glutil.createBufferTexture(context, resolution);
    let hBuffer = glutil.bindNewFramebuffer(context, hTexture);
    let wTexture = glutil.createBufferTexture(context, resolution);
    let wBuffer = glutil.bindNewFramebuffer(context, wTexture);
    this.copyFromSrc = new NopShader(context, src, wBuffer, resolution);
    this.horizontalWavelet = new WaveletShader(context, wTexture, hBuffer, resolution, resolution, 0);
    this.verticalWavelet = new WaveletShader(context, hTexture, wBuffer, resolution, resolution, 1);
    this.copyToDest = new NopShader(context, wTexture, dest, resolution);
  }

  override update(){
    this.copyFromSrc.update();
    var clip = this.resolution.slice() as [number, number];
    for (var i: number = 0; i < this.depth; i++) {
      this.horizontalWavelet.clip = clip;
      this.horizontalWavelet.update();
      this.verticalWavelet.clip = clip;
      this.verticalWavelet.update();
      clip = clip.map(v => Math.ceil(v/2)) as [number, number];
    }
    this.copyToDest.update();
  }
}

export class Wavelet2dInverseEffect extends glutil.GlEffect {
  resolution: [number, number];
  depth: number;
  copyFromSrc: NopShader;
  copyToDest: NopShader;
  verticalWavelet: WaveletShader;
  horizontalWavelet: WaveletShader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    depth: number,
  ) {
    super(context);
    this.resolution = resolution;
    this.depth = depth;
    let hTexture = glutil.createBufferTexture(context, resolution);
    let hBuffer = glutil.bindNewFramebuffer(context, hTexture);
    let wTexture = glutil.createBufferTexture(context, resolution);
    let wBuffer = glutil.bindNewFramebuffer(context, wTexture);
    this.copyFromSrc = new NopShader(context, src, wBuffer, resolution);
    this.verticalWavelet = new WaveletInverseShader(context, wTexture, hBuffer, resolution, resolution, 1);
    this.horizontalWavelet = new WaveletInverseShader(context, hTexture, wBuffer, resolution, resolution, 0);
    this.copyToDest = new NopShader(context, wTexture, dest, resolution);
  }

  override update(){
    this.copyFromSrc.update();
    var clips = [this.resolution.slice() as [number, number]];
    for (var i: number = 1; i < this.depth; i++) {
      clips[i] = clips[i-1].map(v => Math.ceil(v/2)) as [number, number];
    }
    for (var i: number = this.depth - 1; 0 <= i; i--) {
      let clip = clips[i];
      this.verticalWavelet.clip = clip;
      this.verticalWavelet.update();
      this.horizontalWavelet.clip = clip;
      this.horizontalWavelet.update();
    }
    this.copyToDest.update();
  }
}
