import * as glutil from 'glutil';

import {BlurEffect} from 'effects/blurvec3';

export class DeviationShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  mean: WebGLTexture;
  resolution: [number, number];
  tmpBuffer: WebGLTexture;
  blur: BlurEffect;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    mean: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    size: number
  ) {
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform sampler2D src;
      uniform sampler2D mean;
      out vec4 outColor;
      void main(){
        vec2 uv = gl_FragCoord.xy / resolution;
        vec3 c = texture(src, uv).xyz;
        vec3 m = texture(mean, uv).xyz;
        vec3 color = sqrt((c-m)*(c-m));
        outColor = vec4(color, 1.0);
      }
    `;
    super(context, fs);
    this.src = src;
    this.mean = mean;
    this.resolution = resolution;
    let tmpTexture = glutil.createBufferTexture(context, resolution);
    let tmpBuffer = glutil.bindNewFramebuffer(context, tmpTexture);
    let blur = new BlurEffect(context, tmpTexture, dest, resolution, [size, size, size]);
    this.tmpBuffer = tmpBuffer;
    this.blur = blur;
  }

  override update(){
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, this.src);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "src"), 0);
    this.context.activeTexture(gl.TEXTURE1);
    this.context.bindTexture(gl.TEXTURE_2D, this.mean);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "mean"), 1);

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.tmpBuffer);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(gl.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, null);

    this.blur.update();
  }

  setSrc(src: WebGLTexture) {
    this.src = src;
  }
  setDest(dest: WebGLFramebuffer | null) {
    this.blur.setDest(dest);
  }
  setSize(size: number) {
    this.blur.setKernelSize([size, size, size]);
  }
}
