import * as util from 'util';
import * as glutil from 'glutil';

import {knee} from 'effects/knee';
import {filter1dVec3} from 'effects/filter1dVec3';
import {add} from 'effects/add';

function blurGaussian(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  dest: WebGLFramebuffer | null,
  resolution: [number, number],
  size: [number, number, number],
) {
  let gl = context;
  let kernel = util.gaussianKernelVec3(size);

  let hblurTexture = glutil.createBufferTexture(context, resolution);
  glutil.bindNewFramebuffer(context, hblurTexture);
  filter1dVec3(
    context, src, resolution,
    kernel, [1,0]
  );

  context.bindFramebuffer(gl.FRAMEBUFFER, dest);
  filter1dVec3(
    context, hblurTexture, resolution,
    kernel, [0,1]
  );
}

export function halo(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  dest: WebGLFramebuffer | null,
  resolution: [number, number],
  threshold: number,
  radiusOuter: [number, number, number],
  radiusInner: [number, number, number],
  strength: number,
) {
  let gl = context;

  let kneeTexture = glutil.createBufferTexture(context, resolution);
  glutil.bindNewFramebuffer(context, kneeTexture);
  knee(context, src, resolution, threshold);

  let smallBloomTexture = glutil.createBufferTexture(context, resolution);
  let smallBloomBuffer = glutil.bindNewFramebuffer(context, smallBloomTexture);
  blurGaussian(context, kneeTexture, smallBloomBuffer, resolution, radiusInner);

  let largeBloomTexture = glutil.createBufferTexture(context, resolution);
  let largeBloomBuffer = glutil.bindNewFramebuffer(context, largeBloomTexture);
  blurGaussian(context, kneeTexture, largeBloomBuffer, resolution, radiusOuter);

  let haloTexture = glutil.createBufferTexture(context, resolution);
  glutil.bindNewFramebuffer(context, haloTexture);
  add(context, largeBloomTexture, smallBloomTexture, resolution, [1, -1]);

  context.bindFramebuffer(gl.FRAMEBUFFER, dest);
  add(context, src, haloTexture, resolution, [1, strength]);
}
