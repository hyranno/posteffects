import * as glutil from 'glutil';
 import {laplacianKernel} from 'util';

import {NopShader} from 'effects/nop';
import {AddShader} from 'effects/add';
import {Filter1dVec3Shader} from 'effects/filter1dvec3';

export class EdgeEffect extends glutil.GlEffect {
  nop0: NopShader;
  filters: Filter1dVec3Shader[];
  add: AddShader;
  nop1: NopShader;
  filteredTextures: WebGLTexture[];
  accumTextures: WebGLTexture[];
  accumBuffers: WebGLFramebuffer[];
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    size: [number, number, number],
    strength: number,
  ) {
    super(context);
    let filteredTextures = Array.from(new Array(4), ()=>glutil.createBufferTexture(context, resolution));
    let filteredBuffers = filteredTextures.map(tex => glutil.bindNewFramebuffer(context, tex));
    let accumTextures = Array.from(new Array(2), ()=>glutil.createBufferTexture(context, resolution));
    let accumBuffers = accumTextures.map(tex => glutil.bindNewFramebuffer(context, tex));

    this.nop0 = new NopShader(context, src, accumBuffers[1], resolution);
    this.filters = filteredBuffers.map((buffer, i) =>
      new Filter1dVec3Shader(
        context, src, buffer, resolution,
        laplacianKernel(size), [Math.cos(i*Math.PI/4), Math.sin(i*Math.PI/4) ], 0.5
      )
    );
    this.add = new AddShader(
      context, accumTextures[1], filteredTextures[0], accumBuffers[0], resolution,
      [1, strength], [0, -0.5]
    );
    this.nop1 = new NopShader(context, accumTextures[1], dest, resolution);
    this.filteredTextures = filteredTextures;
    this.accumTextures = accumTextures;
    this.accumBuffers = accumBuffers;
  }

  override update(){
    this.nop0.update();
    this.filters.forEach(f => f.update());
    this.filters.forEach((_, i) => {
      this.add.dest = this.accumBuffers[i % this.accumBuffers.length];
      this.add.src0 = this.accumTextures[(1+i)%this.accumTextures.length];
      this.add.src1 = this.filteredTextures[i];
      this.add.update();
    });
    this.nop1.update();
  }
  setSrc(src: WebGLTexture): void {
    this.nop0.src = src;
    this.filters.forEach(f => f.src = src);
  }
  setDest(dest: WebGLFramebuffer | null): void {
    this.nop1.dest = dest;
  }
  setStrength(v: number): void {
    this.add.coef = [1, v];
  }
  setKernelSize(size: [number, number, number]): void {
    this.filters.forEach(f => f.kernel = laplacianKernel(size));
  }

}
