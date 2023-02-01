import * as glutil from 'glutil';
import {Random} from 'reliable-random';

import {NopShader} from 'effects/nop';

export class StutteringEffect extends glutil.GlEffect {
  rand: Random;
  ratio: number;
  nop: NopShader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    seed: number,
    ratio: number,
  ) {
    super(context);

    this.rand = new Random(seed, 0);
    this.ratio = ratio;
    this.nop = new NopShader(context, src, dest, resolution);
  }

  override update(){
    if (this.ratio < this.rand.random()) {
      this.nop.update();
    }
  }
  setSrc(src: WebGLTexture): void {
    this.nop.src = src;
  }
  setDest(dest: WebGLFramebuffer | null): void {
    this.nop.dest = dest;
  }
  setSeed(seed: number) {
    this.rand = new Random(seed, 0);
  }
  setRatio(ratio: number): void {
    this.ratio = ratio;
  }
}
