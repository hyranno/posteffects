import * as glutil from 'glutil';

import {BlurEffect} from 'effects/blurvec3';
import {DeviationShader} from 'effects/deviation';

export class ToneCurveAdaptiveHSLShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  strength: [number, number, number];
  range: [number, number, number];
  localMeanTexture: WebGLTexture;
  localDeviationTexture: WebGLTexture;
  mean: BlurEffect;
  deviation: DeviationShader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    strength: [number, number, number],
    range: [number, number, number],
    size: number,
  ) {
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform sampler2D src;
      uniform sampler2D mean;
      uniform sampler2D deviation;
      uniform vec3 strength;
      uniform vec3 range;
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

      vec3 curve(vec3 val, vec3 m, vec3 d) {
        vec3 s = clamp(range / vec3(2.0) * d, vec3(0.1), vec3(strength));
        return strength * smoothstep(max(vec3(0.0), m-s), min(vec3(1.0), m+s), val) + (vec3(1.0)-strength) * val;
      }

      void main(){
        vec2 uv = gl_FragCoord.xy / resolution;
        vec3 c = hsl_from_rgb( texture(src, uv).xyz );
        vec3 m = hsl_from_rgb( texture(mean, uv).xyz );
        vec3 d = hsl_from_rgb( texture(deviation, uv).xyz );
        vec3 cc = curve(c, m, d);
        outColor = vec4(rgb_from_hsl(cc), 1.0);
      }
    `;
    super(context, fs);
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
    this.strength = strength;
    this.range = range;

    let localMeanTexture = glutil.createBufferTexture(context, resolution);
    let localMeanBuffer = glutil.bindNewFramebuffer(context, localMeanTexture);
    let localDeviationTexture = glutil.createBufferTexture(context, resolution);
    let localDeviationBuffer = glutil.bindNewFramebuffer(context, localDeviationTexture);
    let mean = new BlurEffect(context, src, localMeanBuffer, resolution, [size, size, size]);
    let deviation = new DeviationShader(context, src, localMeanTexture, localDeviationBuffer, resolution, size);
    this.localMeanTexture = localMeanTexture;
    this.localDeviationTexture = localDeviationTexture;
    this.mean = mean;
    this.deviation = deviation;
  }

  override update(){
    this.mean.update();
    this.deviation.update();

    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    {
      this.context.activeTexture(gl.TEXTURE0);
      this.context.bindTexture(gl.TEXTURE_2D, this.src);
      this.context.uniform1i(this.context.getUniformLocation(this.program, "src"), 0);
    }
    {
      this.context.activeTexture(gl.TEXTURE1);
      this.context.bindTexture(gl.TEXTURE_2D, this.localMeanTexture);
      this.context.uniform1i(this.context.getUniformLocation(this.program, "mean"), 1);
    }
    {
      this.context.activeTexture(gl.TEXTURE2);
      this.context.bindTexture(gl.TEXTURE_2D, this.localDeviationTexture);
      this.context.uniform1i(this.context.getUniformLocation(this.program, "deviation"), 2);
    }
    this.context.uniform3fv(this.context.getUniformLocation(this.program, "strength"), this.strength);
    this.context.uniform3fv(this.context.getUniformLocation(this.program, "range"), this.range);

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
    [gl.TEXTURE2, gl.TEXTURE1, gl.TEXTURE0].forEach(v => {
      this.context.activeTexture(v);
      this.context.bindTexture(gl.TEXTURE_2D, null)
    });
  }

  setSrc(src: WebGLTexture) {
    this.src = src;
    this.mean.setSrc(src);
    this.deviation.setSrc(src);
  }
  setDest(dest: WebGLFramebuffer | null) {
    this.dest = dest;
  }
  setSize(size: number) {
    this.mean.setKernelSize([size, size, size]);
    this.deviation.setSize(size);
  }
}
