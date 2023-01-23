import * as glutil from 'glutil';


export class RadialWarpShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  min_radius: number;
  poly: [number, number, number, number];
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    min_radius: number,
    poly: [number, number, number, number],
  ) {
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform sampler2D src;
      uniform float minRadius;
      uniform float[4] poly;
      out vec4 outColor;

      void main(){
        vec2 center = resolution / 2.0;
        vec2 p = gl_FragCoord.xy - center;
        vec2 direction = normalize(p);
        float r = max(0.0, length(p) - minRadius);
        float dr = poly[0] + r*(poly[1] + r*(poly[2] + r*(poly[3])));
        vec2 coord = gl_FragCoord.xy + dr * direction;
        vec2 uv = clamp(coord / resolution, vec2(0.0), vec2(1.0));
        outColor = texture(src, uv);
      }
    `;
    super(context, fs);
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
    this.min_radius = min_radius;
    this.poly = poly;
  }

  override update(){
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, this.src);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "src"), 0);
    this.context.uniform1f(this.context.getUniformLocation(this.program, "minRadius"), this.min_radius);
    this.poly.forEach((v, i) => {
      this.context.uniform1f(this.context.getUniformLocation(this.program, `poly[${i}]`), v);
    });

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }

}
