import * as glutil from 'glutil';
import {gaussianKernelVec3} from 'util';

import {Filter1dVec3Shader} from 'effects/filter1dvec3';

export class BlurEffect extends glutil.GlEffect {
  horizontalBlur: Filter1dVec3Shader;
  verticalBlur: Filter1dVec3Shader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    size: [number, number, number],
  ) {
    super(context);
    let kernel = gaussianKernelVec3(size);
    let hblurTexture = glutil.createBufferTexture(context, resolution);
    let hblurBuffer = glutil.bindNewFramebuffer(context, hblurTexture);
    this.horizontalBlur = new Filter1dVec3Shader(context, src, hblurBuffer, resolution, kernel, [1,0]);
    this.verticalBlur = new Filter1dVec3Shader(context, hblurTexture, dest, resolution, kernel, [0,1]);
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
  setKernelSize(size: [number, number, number]): void {
    let kernel = gaussianKernelVec3(size);
    this.horizontalBlur.kernel = kernel;
    this.verticalBlur.kernel = kernel;
  }
}
