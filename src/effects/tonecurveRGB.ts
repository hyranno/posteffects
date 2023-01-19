import * as glutil from 'glutil';


export class ToneCurveRGBShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  poly: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ];
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    poly: [
      [number, number, number],
      [number, number, number],
      [number, number, number],
      [number, number, number],
    ],
  ) {
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform sampler2D src;
      uniform int depth;
      uniform vec3[4] poly;
      out vec4 outColor;
      void main(){
        vec2 uv = gl_FragCoord.xy / resolution;
        vec3 c = texture(src, uv).xyz;
        vec3 cc = poly[0] + c*(poly[1] + c*(poly[2] + c*(poly[3])));
        outColor = vec4(cc, 1.0);
      }
    `;
    super(context, fs);
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
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
    this.poly.forEach((v, i) => {
      this.context.uniform3fv(this.context.getUniformLocation(this.program, `poly[${i}]`), v);
    });

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }

}
