import * as glutil from 'glutil';
 import {gaussianOddifiedKernel} from 'util';

import {AddShader} from 'effects/add';
import {RadialFilterShader} from 'effects/radialfilter';

export class RadialEdgeEffect extends glutil.GlEffect {
  filter: RadialFilterShader;
  add: AddShader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    min_radius: number,
    size: [number, number, number],
    poly_kernel_size: [number, number, number, number],
    strength: number,
    num_sample: number,
  ) {
    super(context);
    let filteredTexture = glutil.createBufferTexture(context, resolution);
    let filteredBuffer = glutil.bindNewFramebuffer(context, filteredTexture);

    let kernel = gaussianOddifiedKernel(size);
    this.filter = new RadialFilterShader(
      context, src, filteredBuffer, resolution,
      min_radius, kernel, poly_kernel_size, num_sample, 0.5
    );
    this.add = new AddShader(context, src, filteredTexture, dest, resolution, [1, strength], [0, -0.5]);
  }

  override update(){
    this.filter.update();
    this.add.update();
  }
  setSrc(src: WebGLTexture): void {
    this.filter.src = src;
    this.add.src0 = src;
  }
  setDest(dest: WebGLFramebuffer | null): void {
    this.add.dest = dest;
  }
  setMinRadius(r: number): void {
    this.filter.min_radius = r;
  }
  setSize(size: [number, number, number]): void {
    let kernel = gaussianOddifiedKernel(size);
    this.filter.kernel = kernel;
  }
  setPolyKernelSize(poly: [number, number, number, number]): void {
    this.filter.poly_kernel_size = poly;
  }
  setStrength(v: number): void {
    this.add.coef = [1, v];
  }
  setNumSample(n: number): void {
    this.filter.num_sample = n;
  }

}
