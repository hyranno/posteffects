import * as glutil from 'glutil';

import {KneeShader} from 'effects/knee';
import {BlurEffect} from 'effects/blurvec3';
import {AddShader} from 'effects/add';

export class HaloEffect extends glutil.GlEffect {
  knee: KneeShader;
  blurInner: BlurEffect;
  blurOuter: BlurEffect;
  add0: AddShader;
  add1: AddShader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    threshold: number,
    radiusOuter: [number, number, number],
    radiusInner: [number, number, number],
    strength: number,
  ) {
    super(context);
    let kneeTexture = glutil.createBufferTexture(context, resolution);
    let kneeBuffer = glutil.bindNewFramebuffer(context, kneeTexture);
    let innerTexture = glutil.createBufferTexture(context, resolution);
    let innerBuffer = glutil.bindNewFramebuffer(context, innerTexture);
    let outerTexture = glutil.createBufferTexture(context, resolution);
    let outerBuffer = glutil.bindNewFramebuffer(context, outerTexture);
    let haloTexture = glutil.createBufferTexture(context, resolution);
    let haloBuffer = glutil.bindNewFramebuffer(context, haloTexture);

    this.knee = new KneeShader(context, src, kneeBuffer, resolution, threshold);
    this.blurInner = new BlurEffect(context, kneeTexture, innerBuffer, resolution, radiusInner);
    this.blurOuter = new BlurEffect(context, kneeTexture, outerBuffer, resolution, radiusOuter);
    this.add0 = new AddShader(context, outerTexture, innerTexture, haloBuffer, resolution, [1, -1]);
    this.add1 = new AddShader(context, src, haloTexture, dest, resolution, [1, strength]);
  }

  override update() {
    this.knee.update();
    this.blurInner.update();
    this.blurOuter.update();
    this.add0.update();
    this.add1.update();
  }
}
