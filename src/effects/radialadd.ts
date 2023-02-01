import * as glutil from 'glutil';

export class RadialAddShader extends glutil.PostEffectShader {
  src0: WebGLTexture;
  src1: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  min_radius: number;
  poly_coef0: [number, number, number, number];
  poly_coef1: [number, number, number, number];
  bias: [number, number];
  constructor(
    context: WebGL2RenderingContext,
    src0: WebGLTexture,
    src1: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    min_radius: number,
    poly_coef0: [number, number, number, number],
    poly_coef1: [number, number, number, number],
    bias: [number, number] = [0, 0],
  ) {
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform sampler2D src0;
      uniform sampler2D src1;
      uniform float min_radius;
      uniform float[4] poly_coef0;
      uniform float[4] poly_coef1;
      uniform vec2 bias;
      out vec4 outColor;
      void main(){
        vec2 uv = gl_FragCoord.xy / resolution;
        vec2 center = resolution / 2.0;
        vec2 p = gl_FragCoord.xy - center;
        float r = max(0.0, length(p) - min_radius);
        float coef0 = poly_coef0[0] + r*(poly_coef0[1] + r*(poly_coef0[2] + r*(poly_coef0[3])));
        float coef1 = poly_coef1[0] + r*(poly_coef1[1] + r*(poly_coef1[2] + r*(poly_coef1[3])));
        vec3 color = clamp(
          coef0*(texture(src0, uv) + vec4(bias.x)) + coef1*(texture(src1, uv) + vec4(bias.y)),
          0.0, 1.0
        ).xyz;
        outColor = vec4(color, 1.0);
      }
    `;
    super(context, fs);
    this.src0 = src0;
    this.src1 = src1;
    this.dest = dest;
    this.resolution = resolution;
    this.min_radius = min_radius;
    this.poly_coef0 = poly_coef0;
    this.poly_coef1 = poly_coef1;
    this.bias = bias;
  }

  override update(){
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, this.src0);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "src0"), 0);
    this.context.activeTexture(gl.TEXTURE1);
    this.context.bindTexture(gl.TEXTURE_2D, this.src1);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "src1"), 1);
    this.context.uniform1f(this.context.getUniformLocation(this.program, "min_radius"), this.min_radius);
    this.poly_coef0.forEach((v, i) =>
      this.context.uniform1f(this.context.getUniformLocation(this.program, `poly_coef0[${i}]`), v)
    );
    this.poly_coef1.forEach((v, i) =>
      this.context.uniform1f(this.context.getUniformLocation(this.program, `poly_coef1[${i}]`), v)
    );
    this.context.uniform2fv(this.context.getUniformLocation(this.program, "bias"), this.bias);

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(gl.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }

}
