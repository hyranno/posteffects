import * as glutil from 'glutil';

import {AddShader} from 'effects/add';
import {KneeShader} from 'effects/knee';
import {MotionBlurEffect} from 'effects/motionblur';

export class LightTrailEffect extends glutil.GlEffect {
  knee: KneeShader;
  motionblur: MotionBlurEffect;
  add: AddShader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    threshold: number,
    ratio: number,
    strength: number,
  ) {
    super(context);
    let kneeTexture = glutil.createBufferTexture(context, resolution);
    let kneeBuffer = glutil.bindNewFramebuffer(context, kneeTexture);
    let blurTexture = glutil.createBufferTexture(context, resolution);
    let blurBuffer = glutil.bindNewFramebuffer(context, blurTexture);

    let knee = new KneeShader(context, src, kneeBuffer, resolution, threshold);
    let blur = new MotionBlurEffect(context, kneeTexture, blurBuffer, resolution, ratio);
    let add = new AddShader(context, src, blurTexture, dest, resolution, [1, strength]);

    this.knee = knee;
    this.motionblur = blur;
    this.add = add;
  }

  override update(){
    this.knee.update();
    this.motionblur.update();
    this.add.update();
  }
  setSrc(src: WebGLTexture): void {
    this.knee.src = src;
    this.add.src0 = src;
  }
  setDest(dest: WebGLFramebuffer | null): void {
    this.add.dest = dest;
  }
  setThreshold(threshold: number): void {
    this.knee.threshold = threshold;
  }
  setRatio(ratio: number): void {
    this.motionblur.setRatio(ratio);
  }
  setStrength(strength: number): void {
    this.add.coef = [1, strength];
  }
}
