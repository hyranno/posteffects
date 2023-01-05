import * as glutil from 'glutil';
import {gaussianKernel} from 'util';

import {Filter1dShader} from 'effects/filter1d';

export class BlurEffect extends glutil.GlEffect {
  horizontalBlur: Filter1dShader;
  verticalBlur: Filter1dShader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    size: number,
  ) {
    super(context);
    let kernel = gaussianKernel(size);
    let hblurTexture = glutil.createBufferTexture(context, resolution);
    let hblurBuffer = glutil.bindNewFramebuffer(context, hblurTexture);
    this.horizontalBlur = new Filter1dShader(context, src, hblurBuffer, resolution, kernel, [1,0]);
    this.verticalBlur = new Filter1dShader(context, hblurTexture, dest, resolution, kernel, [0,1]);
  }

  override update(){
    this.horizontalBlur.update();
    this.verticalBlur.update();
  }
  setSrc(src: WebGLTexture): void {
    this.horizontalBlur.src = src;
  }
  setDest(dest: WebGLFramebuffer | null): void {
    this.verticalBlur.dest = dest;
  }
}
