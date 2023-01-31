import * as glutil from 'glutil';

export class RadialFilterShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  min_radius: number;
  kernel: [number, number, number][];
  poly_kernel_size: [number, number, number, number];  // kernel_size = poly_kernel_size( max(0, (radius - min_radius)) )
  num_sample: number;
  bias: number;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    min_radius: number,
    kernel: [number, number, number][],
    poly_kernel_size: [number, number, number, number],
    num_sample: number,
    bias: number = 0,
  ) {
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform sampler2D src;
      uniform float minRadius;
      uniform int kernelLength;
      uniform vec3[256] kernel;
      uniform vec4 polyKernelSize;
      uniform int numSample;
      uniform float bias;
      out vec4 outColor;
      vec3 sampleKernel(float x) {
        float i = clamp(x * float(kernelLength-1), 0.0, float(kernelLength-1));
        return mix( kernel[int(floor(i))], kernel[int(ceil(i))], fract(i) );
      }

      void main(){
        vec2 center = resolution / 2.0;
        vec2 p = gl_FragCoord.xy - center;
        vec2 direction = p / length(p);
        float r = max(0.0, length(p) - minRadius);
        float kernelSize = max(
          0.1,
          polyKernelSize.x + r*(polyKernelSize.y + r*(polyKernelSize.z + r*(polyKernelSize.w)))
        );
        vec3 res = vec3(0);
        for (int i=0; i<numSample; i++) {
          vec2 uv = (gl_FragCoord.xy + (float(i)/float(numSample-1) - 0.5) * kernelSize * direction) / resolution;
          float x = float(i) / float(numSample-1);
          res += sampleKernel(x) * texture(src, uv).xyz;
        }
        res /= float(numSample) / float(kernelLength);
        res += vec3(bias);
        outColor = vec4(res, 1);
      }
    `;
    super(context, fs);
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
    this.min_radius = min_radius;
    this.kernel = kernel;
    this.poly_kernel_size = poly_kernel_size;
    this.num_sample = num_sample;
    this.bias = bias;
  }

  override update() {
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, this.src);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "src"), 0);
    this.context.uniform1f(this.context.getUniformLocation(this.program, "minRadius"), this.min_radius);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "kernelLength"), this.kernel.length);
    this.kernel.forEach((v,i) =>
      this.context.uniform3fv(this.context.getUniformLocation(this.program, "kernel["+i+"]"), new Float32Array(v))
    );
    this.context.uniform4fv(
      this.context.getUniformLocation(this.program, "polyKernelSize"), new Float32Array(this.poly_kernel_size)
    );
    this.context.uniform1i(this.context.getUniformLocation(this.program, "numSample"), this.num_sample);
    this.context.uniform1f(this.context.getUniformLocation(this.program, "bias"), this.bias);

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }
}
