import * as glutil from 'glutil';

export class KneeShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  threshold: number;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    threshold: number,
  ){
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform sampler2D src;
      uniform float threshold;
      out vec4 outColor;
      float knee(float x, float t) {
        return max(x - t, 0.0) / max(x, 0.0001);
      }
      void main(){
        vec2 uv = gl_FragCoord.xy / resolution;
        vec4 color = texture(src, uv);
        float safeThreshold = clamp(threshold, 0.0, 0.999999);
        float normalizer = 1.0 / knee(1.0, safeThreshold);
        float srcBrightness = max(max(max(color.x, color.y), color.z), 0.0001);
        float destBrightness = knee(srcBrightness, safeThreshold) * normalizer;
        outColor = clamp(vec4(color.xyz * destBrightness / srcBrightness, color.w), 0.0, 1.0);
      }
    `;
    super(context, fs);
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
    this.threshold = threshold;
  }

  override update(){
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, this.src);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "src"), 0);
    this.context.uniform1f(this.context.getUniformLocation(this.program, "threshold"), this.threshold);

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }
}
