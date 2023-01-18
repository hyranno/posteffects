import * as glutil from 'glutil';
import {gaussianKernelVec3} from 'util';

import {RadialFilterShader} from 'effects/radialfilter';

export class RadialBlurEffect extends glutil.GlEffect {
  filter: RadialFilterShader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    min_radius: number,
    size: [number, number, number],
    poly_kernel_size: [number, number, number, number],
    num_sample: number,
  ) {
    super(context);
    let kernel = gaussianKernelVec3(size);
    this.filter = new RadialFilterShader(
      context, src, dest, resolution,
      min_radius, kernel, poly_kernel_size, num_sample
    );
  }

  override update(){
    this.filter.update();
  }
  setSrc(src: WebGLTexture): void {
    this.filter.src = src;
  }
  setDest(dest: WebGLFramebuffer | null): void {
    this.filter.dest = dest;
  }
  setMinRadius(r: number): void {
    this.filter.min_radius = r;
  }
  setSize(size: [number, number, number]): void {
    let kernel = gaussianKernelVec3(size);
    this.filter.kernel = kernel;
  }
  setPolyKernelSize(poly: [number, number, number, number]): void {
    this.filter.poly_kernel_size = poly;
  }
  setNumSample(n: number): void {
    this.filter.num_sample = n;
  }

}
