import * as glutil from 'glutil';


export class HalfToneShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  tileSize: number;
  requantizationScale: [number, number, number, number];
  offset: [number, number];
  angle: number;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    tileSize: number = 8,
    requantizationScale: [number, number, number, number] = [1/4, 1/4, 1/4, 1/255],
    offset: [number, number] = [3, 5],
    angle: number = Math.PI/6,
  ){
    let fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform sampler2D src;
      uniform float tileSize;
      uniform vec4 requantizationScale;
      uniform vec2 offset;
      uniform float angle;
      out vec4 outColor;
      void main(){
        vec2 uv = gl_FragCoord.xy / resolution;
        vec4 color = texture(src, uv);
        mat2 dcm = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
        vec2 lCoord = mod(dcm*(gl_FragCoord.xy + offset), tileSize) / tileSize - vec2(0.5);
        vec4 pattern = sqrt(lCoord.x*lCoord.x + lCoord.y*lCoord.y) * requantizationScale;
        vec4 requantized = requantizationScale * floor((color + pattern) / requantizationScale);
        outColor = requantized;
      }
    `;
    super(context, fs);
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
    this.tileSize = tileSize;
    this.requantizationScale = requantizationScale;
    this.offset = offset;
    this.angle = angle;
  }

  override update(){
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, this.src);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "src"), 0);
    this.context.uniform1f(this.context.getUniformLocation(this.program, "tileSize"), this.tileSize);
    this.context.uniform4fv(
      this.context.getUniformLocation(this.program, "requantizationScale"),
      this.requantizationScale
    );
    this.context.uniform2fv(this.context.getUniformLocation(this.program, "offset"), this.offset);
    this.context.uniform1f(this.context.getUniformLocation(this.program, "angle"), this.angle);

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }
}
