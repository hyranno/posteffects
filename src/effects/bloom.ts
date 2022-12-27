import * as glutil from 'glutil';
import {gaussianKernel} from 'util';

import {KneeShader} from 'effects/knee';
import {BlurEffect} from 'effects/blur';
import {AddShader} from 'effects/add';

export class BloomEffect extends glutil.GlEffect {
  knee: KneeShader;
  blur: BlurEffect;
  add0: AddShader;
  add1: AddShader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    size: number,
    threshold: number,
    strength: number,
  ){
    super(context);
    let kneeTexture = glutil.createBufferTexture(context, resolution);
    let kneeBuffer = glutil.bindNewFramebuffer(context, kneeTexture);
    let blurTexture = glutil.createBufferTexture(context, resolution);
    let blurBuffer = glutil.bindNewFramebuffer(context, blurTexture);
    let bloomTexture = glutil.createBufferTexture(context, resolution);
    let bloomBuffer = glutil.bindNewFramebuffer(context, bloomTexture);

    this.knee = new KneeShader(context, src, kneeBuffer, resolution, threshold);
    this.blur = new BlurEffect(context, kneeTexture, blurBuffer, resolution, size);
    let kernel = gaussianKernel(size);
    let kernelCenter = kernel[Math.floor(kernel.length / 2)];
    this.add0 = new AddShader(context, blurTexture, kneeTexture, bloomBuffer, resolution, [1, -kernelCenter*kernelCenter]);
    this.add1 = new AddShader(context, src, bloomTexture, dest, resolution, [1, strength]);
  }

  override update(){
    this.knee.update();
    this.blur.update();
    this.add0.update();
    this.add1.update();
  }
}
