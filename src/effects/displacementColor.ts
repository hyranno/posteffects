import * as glutil from 'glutil';

import {DISPLACEMENT_SCALE_FACTOR} from 'effects/displacement';

export class DisplacementColorShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  displacement: [WebGLTexture, WebGLTexture, WebGLTexture];
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    displacement: [WebGLTexture, WebGLTexture, WebGLTexture],
  ) {
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform sampler2D src;
      uniform sampler2D displacement0;
      uniform sampler2D displacement1;
      uniform sampler2D displacement2;
      out vec4 outColor;
      void main(){
        vec3 res = vec3(0.0);
        vec2 uv = gl_FragCoord.xy / resolution;
        vec2 values[3] = vec2[](
          texture(displacement0, uv).xy,
          texture(displacement1, uv).xy,
          texture(displacement2, uv).xy
        );
        for (int i=0; i<3; i++) {
          vec2 diff = (values[i] - vec2(0.5)) * float(${DISPLACEMENT_SCALE_FACTOR});
          vec2 coord = gl_FragCoord.xy - diff;
          vec2 uv_src = clamp(coord / resolution, vec2(0.0), vec2(1.0));
          res[i] = texture(src, uv_src)[i];
        }
        outColor = vec4(res, 1.0);
      }
    `;
    super(context, fs);
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
    this.displacement = displacement;
  }

  override update(){
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, this.src);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "src"), 0);
    [gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3].forEach((t, i) => {
      this.context.activeTexture(t);
      this.context.bindTexture(gl.TEXTURE_2D, this.displacement[i]);
      this.context.uniform1i(this.context.getUniformLocation(this.program, `displacement${i}`), i+1);
    });

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(gl.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }

}


export class DisplacementColorEffect extends glutil.GlEffect {
  effect: DisplacementColorShader;
  displacement_effect: glutil.GlEffect;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    displacement: [WebGLTexture, WebGLTexture, WebGLTexture],
    displacement_effect: glutil.GlEffect,
  ) {
    super(context);
    this.effect = new DisplacementColorShader(context, src, dest, resolution, displacement);
    this.displacement_effect = displacement_effect;
  }
  override update(){
    this.displacement_effect.update();
    this.effect.update();
  }
  setSrc(src: WebGLTexture): void {
    this.effect.src = src;
  }
  setDest(dest: WebGLFramebuffer | null): void {
    this.effect.dest = dest;
  }
}
