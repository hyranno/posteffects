import * as glutil from 'glutil';
 import {laplacianKernel} from 'util';

import {RadialAddShader} from 'effects/radialadd';
import {RadialFilterShader} from 'effects/radialfilter';

export class RadialEdgeEffect extends glutil.GlEffect {
  filter: RadialFilterShader;
  add: RadialAddShader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    min_radius: number,
    size: [number, number, number],
    poly_strength: [number, number, number, number],
    num_sample: number,
  ) {
    super(context);
    let filteredTexture = glutil.createBufferTexture(context, resolution);
    let filteredBuffer = glutil.bindNewFramebuffer(context, filteredTexture);

    let poly_kernel_size = [Math.max(...size), 0, 0, 0] as [number, number, number, number];
    let kernel = laplacianKernel(size);
    this.filter = new RadialFilterShader(
      context, src, filteredBuffer, resolution,
      min_radius, kernel, poly_kernel_size, num_sample, 0.5
    );
    this.add = new RadialAddShader(
      context, src, filteredTexture, dest, resolution,
      200, [1, 0,0,0], poly_strength, [0, -0.5]);
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
    this.add.min_radius = r;
  }
  setSize(size: [number, number, number]): void {
    let kernel = laplacianKernel(size);
    this.filter.kernel = kernel;
    this.filter.poly_kernel_size = [Math.max(...size), 0, 0, 0] as [number, number, number, number];
  }
  setPolyStrength(v: [number, number, number, number]): void {
    this.add.poly_coef1 = v;
  }
  setNumSample(n: number): void {
    this.filter.num_sample = n;
  }

}
