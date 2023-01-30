import * as glutil from 'glutil';

export class GaussianNoiseShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  strength: [number, number, number];
  salts: [number, number, number];
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    strength: [number, number, number],
    salts: [number, number, number],
  ) {
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform sampler2D src;
      uniform vec3 strength;
      uniform vec3 salts;
      out vec4 outColor;
      float hash(vec2 p, float salt) {
        float phase = 321.47 * salt + mod(dot(p, vec2(564.459, 893.109)), 951.54);
        return fract(4643.4649 * cos(phase));
      }
      vec3 hash(vec2 p, vec3 salt) {
        vec3 phase = 321.47 * salt + mod(dot(p, vec2(564.459, 893.109)), 951.54);
        return fract(37564.4643 * cos(phase));
      }
      vec2 box_mullar(vec2 r) {
        float amp = sqrt(-2.0*log(max(0.00001, r.x)));
        float phase = 2.0*radians(180.0) * r.y;
        return  amp * vec2(cos(phase), sin(phase));
      }
      void main(){
        vec3 hashes = hash(gl_FragCoord.xy, salts);
        vec3 noise = vec3(
          box_mullar(vec2(hashes.x, hashes.y)),
          box_mullar(vec2(hashes.x, hashes.z)).x
        ) * strength;
        vec2 uv = gl_FragCoord.xy / resolution;
        outColor = texture(src, uv) + vec4(noise, 1.0);
      }
    `;
    super(context, fs);
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
    this.strength = strength;
    this.salts = salts;
  }

  override update(){
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, this.src);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "src"), 0);
    this.context.uniform3fv(this.context.getUniformLocation(this.program, "strength"), this.strength);
    this.context.uniform3fv(this.context.getUniformLocation(this.program, "salts"), this.salts);

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(gl.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }
}
