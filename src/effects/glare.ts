import * as glutil from 'glutil';
import {gaussianKernel} from 'util';

import {KneeShader} from 'effects/knee';
import {Filter1dShader} from 'effects/filter1d';
import {AddShader} from 'effects/add';

export class GlareEffect extends glutil.GlEffect {
  knee: KneeShader;
  filters: Filter1dShader[] = [];
  adds: AddShader[] = [];
  add: AddShader;
  buffersToClear: WebGLFramebuffer[];
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    threshold: number,
    params: {
      size: number,
      angle: number,
      strength: number,
    }[],
  ){
    super(context);
    let gl = context;
    let kneeTexture = glutil.createBufferTexture(context, resolution);
    let kneeBuffer = glutil.bindNewFramebuffer(context, kneeTexture);
    let filteredTexture = glutil.createBufferTexture(context, resolution);
    let filterBuffer = glutil.bindNewFramebuffer(context, filteredTexture);
    let glareTextures = Array.from(Array(2), (_) => glutil.createBufferTexture(context, resolution));
    let glareBuffers = glareTextures.map((tex) => glutil.bindNewFramebuffer(context, tex));
    this.buffersToClear = glareBuffers;

    this.knee = new KneeShader(context, src, kneeBuffer, resolution, threshold);
    params.forEach((p, i) => {
      let kernel = gaussianKernel(p.size);
      kernel[Math.floor(kernel.length/2)] = 0;
      context.bindFramebuffer(gl.FRAMEBUFFER, filterBuffer);
      this.filters[i] = new Filter1dShader(
        context, kneeTexture, filterBuffer, resolution, kernel, [Math.cos(p.angle), Math.sin(p.angle)]
      );
      this.adds[i] = new AddShader(
        context, glareTextures[(i+1)%2], filteredTexture, glareBuffers[i%2], resolution, [1, p.strength]
      );
    });
    this.add = new AddShader(
      context, src, glareTextures[(params.length-1)%2], dest, resolution, [1, 1]
    );
  }

  override update(){
    let gl = this.context;
    this.buffersToClear.forEach((v) => {
      this.context.bindFramebuffer(gl.FRAMEBUFFER, v);
      this.context.clear(gl.COLOR_BUFFER_BIT);
    });
    this.knee.update();
    for (var i = 0; i < this.filters.length; i++) {
      this.filters[i].update();
      this.adds[i].update();
    }
    this.add.update();
  }

  setSrc(src: WebGLTexture) {
    this.knee.src = src;
    this.add.src0 = src;
  }
  setDest(dest: WebGLTexture | null) {
    this.add.dest = dest;
  }
}
