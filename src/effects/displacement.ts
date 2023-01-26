import * as glutil from 'glutil';


export const DISPLACEMENT_SCALE_FACTOR = 256.0;  // color represented as 8bit int


export class DisplacementShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  displacement: WebGLTexture;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    displacement: WebGLTexture,
  ) {
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform sampler2D src;
      uniform sampler2D displacement;
      out vec4 outColor;
      void main(){
        vec2 uv = gl_FragCoord.xy / resolution;
        vec2 coord = gl_FragCoord.xy - (texture(displacement, uv).xy - vec2(0.5)) * float(${DISPLACEMENT_SCALE_FACTOR});
        vec2 uv_src = clamp(coord / resolution, vec2(0.0), vec2(1.0));
        outColor = texture(src, uv_src);
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
    this.context.activeTexture(gl.TEXTURE1);
    this.context.bindTexture(gl.TEXTURE_2D, this.displacement);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "displacement"), 1);

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(gl.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }

}


export class DisplacementEffect extends glutil.GlEffect {
  effect: DisplacementShader;
  displacement_effect: glutil.GlEffect;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    displacement: WebGLTexture,
    displacement_effect: glutil.GlEffect,
  ) {
    super(context);
    this.effect = new DisplacementShader(context, src, dest, resolution, displacement);
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
