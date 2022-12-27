import * as glutil from 'glutil';

export class Filter1dVec3Shader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  kernel: [number, number, number][];
  direction: [number, number];
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    kernel: [number, number, number][],
    direction: [number, number],
  ) {
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform sampler2D src;
      uniform int kernelSize;
      uniform vec3[256] kernel;
      uniform vec2 direction;
      out vec4 outColor;
      void main(){
        vec3 res = vec3(0);
        for (int i=0; i<kernelSize; i++) {
          vec2 uv = (gl_FragCoord.xy + (float(i) - float(kernelSize)/2.0) * direction) / resolution;
          res += kernel[i] * texture(src, uv).xyz;
        }
        outColor = vec4(res, 1);
      }
    `;
    super(context, fs);
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
    this.kernel = kernel;
    this.direction = direction;
  }

  override update() {
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, this.src);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "src"), 0);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "kernelSize"), this.kernel.length);
    this.kernel.forEach((v,i) =>
      this.context.uniform3fv(this.context.getUniformLocation(this.program, "kernel["+i+"]"), new Float32Array(v))
    );
    this.context.uniform2fv(
      this.context.getUniformLocation(this.program, "direction"), new Float32Array(this.direction)
    );

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }
}
