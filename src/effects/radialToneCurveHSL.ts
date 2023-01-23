import * as glutil from 'glutil';


export class RadialToneCurveHSLShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  min_radius: number;
  poly_strength: [
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
    min_radius: number,
    poly_strength: [
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
      uniform float minRadius;
      uniform vec3[4] poly_strength;
      out vec4 outColor;

      float[4] spline3(vec2[4] p) {
        float denominator = (p[1].x-p[0].x)*(p[2].x-p[0].x)*(p[2].x-p[1].x)*(p[3].x-p[0].x)*(p[3].x-p[1].x)*(p[3].x-p[2].x);
        float[4] ct = float[](
          -(p[2].x-p[1].x)*(p[3].x-p[1].x)*(p[3].x-p[2].x),
          +(p[2].x-p[0].x)*(p[3].x-p[0].x)*(p[3].x-p[2].x),
          -(p[1].x-p[0].x)*(p[3].x-p[0].x)*(p[3].x-p[1].x),
          +(p[1].x-p[0].x)*(p[2].x-p[0].x)*(p[2].x-p[1].x)
        );
        float c0 = (
          +p[3].y*(-p[0].x*p[1].x*p[2].x *ct[3])
          +p[2].y*(-p[0].x*p[1].x*p[3].x *ct[2])
          +p[1].y*(-p[0].x*p[2].x*p[3].x *ct[1])
          +p[0].y*(-p[1].x*p[2].x*p[3].x *ct[0])
        ) / denominator;
        float c1 = (
          +p[3].y*(+(p[1].x*p[2].x+p[0].x*p[2].x+p[0].x*p[1].x) *ct[3])
          +p[2].y*(+(p[1].x*p[3].x+p[0].x*p[3].x+p[0].x*p[1].x) *ct[2])
          +p[1].y*(+(p[2].x*p[3].x+p[0].x*p[3].x+p[0].x*p[2].x) *ct[1])
          +p[0].y*(+(p[2].x*p[3].x+p[1].x*p[3].x+p[1].x*p[2].x) *ct[0])
        ) / denominator;
        float c2 = (
          +p[3].y*(-(p[2].x+p[1].x+p[0].x) *ct[3])
          +p[2].y*(-(p[3].x+p[1].x+p[0].x) *ct[2])
          +p[1].y*(-(p[3].x+p[2].x+p[0].x) *ct[1])
          +p[0].y*(-(p[3].x+p[2].x+p[1].x) *ct[0])
        ) / denominator;
        float c3 = (
          +p[3].y*(ct[3])
          +p[2].y*(ct[2])
          +p[1].y*(ct[1])
          +p[0].y*(ct[0])
        ) / denominator;
        return float[](c0, c1, c2, c3);
      }

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

      void main(){
        vec2 uv = gl_FragCoord.xy / resolution;
        vec3 c = hsl_from_rgb( texture(src, uv).xyz );

        vec2 center = resolution / 2.0;
        vec2 p = gl_FragCoord.xy - center;
        float r = max(0.0, length(p) - minRadius);
        vec3 strength = clamp(
          poly_strength[0] + r*(poly_strength[1] + r*(poly_strength[2] + r*(poly_strength[3]))),
          vec3(0.0), vec3(1.0)
        );
        vec3[4] poly = vec3[](vec3(0), vec3(0), vec3(0), vec3(0));
        for (int i=0; i<3; i++) {
          float[4] poly_elem = spline3(vec2[4](
            vec2(0.0, 0.0),
            mix(vec2(0.3, 0.3), vec2(0.49, 0.0), strength[i]),
            mix(vec2(0.7, 0.7), vec2(0.51, 1.0), strength[i]),
            vec2(1.0, 1.0)
          ));
          for (int j=0; j<4; j++) {
            poly[j][i] = poly_elem[j];
          }
        }

        vec3 cc = clamp(
          poly[0] + c*(poly[1] + c*(poly[2] + c*(poly[3]))),
          vec3(0.0), vec3(1.0)
        );
        outColor = vec4(rgb_from_hsl(cc), 1.0);
      }
    `;
    super(context, fs);
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
    this.min_radius = min_radius;
    this.poly_strength = poly_strength;
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
    this.poly_strength.forEach((v, i) => {
      this.context.uniform3fv(this.context.getUniformLocation(this.program, `poly_strength[${i}]`), v);
    });

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }

}
