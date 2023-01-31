import * as glutil from 'glutil';
import {Random} from 'reliable-random';

import {NopShader} from 'effects/nop';

export class StutteringEffect extends glutil.GlEffect {
  rand: Random;
  ratio: number;
  nopToState: NopShader;
  nopToDest: NopShader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    seed: number,
    ratio: number,
  ) {
    super(context);
    let stateTexture = glutil.createBufferTexture(context, resolution);
    let stateBuffer = glutil.bindNewFramebuffer(context, stateTexture);

    let nop_to_state = new NopShader(context, src, stateBuffer, resolution);
    let nop_to_dest = new NopShader(context, stateTexture, dest, resolution);
    nop_to_state.update();

    this.rand = new Random(seed, 0);
    this.ratio = ratio;
    this.nopToState = nop_to_state;
    this.nopToDest = nop_to_dest;
  }

  override update(){
    if (this.ratio < this.rand.random()) {
      this.nopToState.update();
    }
    this.nopToDest.update();
  }
  setSrc(src: WebGLTexture): void {
    this.nopToState.src = src;
  }
  setDest(dest: WebGLFramebuffer | null): void {
    this.nopToDest.dest = dest;
  }
  setSeed(seed: number) {
    this.rand = new Random(seed, 0);
  }
  setRatio(ratio: number): void {
    this.ratio = ratio;
  }
}
