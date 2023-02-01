import * as glutil from 'glutil';


export class ToneCurveStairsHSLShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  step: [number, number, number];
  softness: [number, number, number];
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    step: [number, number, number],
    softness: [number, number, number],
  ) {
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform sampler2D src;
      uniform vec3 step;
      uniform vec3 softness;
      out vec4 outColor;

      float balance_radian(float rad) {
        const float pi = radians(180.0);
        return mod(rad + pi, 2.0*pi) - pi;
      }
      vec3 balance_radian(vec3 rad) {
        return vec3(
          balance_radian(rad.x),
          balance_radian(rad.y),
          balance_radian(rad.z)
        );
      }
      vec3 hsl_from_rgb(vec3 rgb) {
        const float pi = radians(180.0);
        const vec3 a = 2.0*pi * vec3(0, 1, 2)/3.0;
        vec2 hv =
          rgb.x * vec2(cos(a.x), sin(a.x)) +
          rgb.y * vec2(cos(a.y), sin(a.y)) +
          rgb.z * vec2(cos(a.z), sin(a.z))
        ;
        float h = mod(atan(hv.y, hv.x), 2.0*pi) / (2.0*pi);
        float cmax = max(rgb.x, max(rgb.y, rgb.z));
        float cmin = min(rgb.x, min(rgb.y, rgb.z));
        float s = (cmax - cmin) / mix(1.0 - abs(cmax + cmin -1.0), 1.0, cmax == cmin);  // cylinder HSL
        float l = (cmax + cmin) / 2.0;
        return vec3(h,s,l);
      }
      vec3 rgb_from_hsl(vec3 hsl) {
        const float pi = radians(180.0);
        const vec3 a = 2.0*pi * vec3(0, 1, 2)/3.0;
        vec3 ratio = vec3(1.0) - clamp(
          abs(balance_radian(vec3(hsl.x * 2.0*pi) - a)) / (pi/3.0) - vec3(1.0),
          vec3(0.0), vec3(1.0)
        );
        float cmax = hsl.z + hsl.y / 2.0 * (1.0 - abs(2.0 * hsl.z - 1.0));
        float cmin = hsl.z - hsl.y / 2.0 * (1.0 - abs(2.0 * hsl.z - 1.0));
        return mix(vec3(cmin), vec3(cmax), ratio);
      }

      vec3 curve(vec3 v) {
        vec3 s = clamp(softness, 0.001, 1.0) / 2.0;
        return (floor(v/step) + smoothstep(vec3(0.5)-s, vec3(0.5)+s, fract(v/step))) * step;
      }

      void main(){
        vec2 uv = gl_FragCoord.xy / resolution;
        vec3 c = hsl_from_rgb( texture(src, uv).xyz );
        vec3 cc = curve(c);
        outColor = vec4(rgb_from_hsl(cc), 1.0);
      }
    `;
    super(context, fs);
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
    this.step = step;
    this.softness = softness;
  }

  override update(){
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, this.src);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "src"), 0);
    this.context.uniform3fv(this.context.getUniformLocation(this.program, "step"), this.step);
    this.context.uniform3fv(this.context.getUniformLocation(this.program, "softness"), this.softness);

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }

}
