import * as glutil from 'glutil';

import {NopShader} from 'effects/nop';
import {AddShader} from 'effects/add';

export class MotionBlurEffect extends glutil.GlEffect {
  ratio: number;
  add: AddShader;
  nop0: NopShader;
  nop1: NopShader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    ratio: number,
  ) {
    super(context);
    this.ratio = ratio;
    let prevTexture = glutil.createBufferTexture(context, resolution);
    let prevBuffer = glutil.bindNewFramebuffer(context, prevTexture);
    let addTexture = glutil.createBufferTexture(context, resolution);
    let addBuffer = glutil.bindNewFramebuffer(context, addTexture);

    let add = new AddShader(context, src, prevTexture, addBuffer, resolution, [1-ratio, ratio]);
    let nop0 = new NopShader(context, addTexture, dest, resolution);
    let nop1 = new NopShader(context, src, prevBuffer, resolution);
    nop1.update();
    nop1.src = addTexture;

    this.add = add;
    this.nop0 = nop0;
    this.nop1 = nop1;
  }

  override update(){
    this.add.update();
    this.nop0.update();
    this.nop1.update();
  }
  setSrc(src: WebGLTexture): void {
    this.add.src0 = src;
  }
  setDest(dest: WebGLFramebuffer | null): void {
    this.nop0.dest = dest;
  }
  setRatio(ratio: number): void {
    this.add.coef = [1-ratio, ratio];
  }
}
