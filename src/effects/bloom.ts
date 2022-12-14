import * as glutil from 'glutil';
import {gaussianKernel} from 'util';

import {knee} from 'effects/knee';
import {blur} from 'effects/blur';
import {add} from 'effects/add';

export function bloom(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  dest: WebGLFramebuffer | null,
  resolution: [number, number],
  size: number,
  threshold: number,
  strength: number,
) {
  let gl = context;
  let kernel = gaussianKernel(size);

  const kneeTexture = glutil.createBufferTexture(context, resolution);
  glutil.bindNewFramebuffer(context, kneeTexture);
  knee(
    context, src, resolution,
    threshold
  );

  const blurTexture = glutil.createBufferTexture(context, resolution);
  let blurBuffer = glutil.bindNewFramebuffer(context, blurTexture);
  blur(
    context, src, blurBuffer,
    resolution, size
  );

  const kernelCenter = kernel[Math.floor(kernel.length / 2)];
  const bloomTexture = glutil.createBufferTexture(context, resolution);
  glutil.bindNewFramebuffer(context, bloomTexture);
  add(
    context, blurTexture, kneeTexture, resolution,
    [1, -kernelCenter*kernelCenter]
  );

  context.bindFramebuffer(gl.FRAMEBUFFER, dest);
  add(
    context, src, bloomTexture, resolution,
    [1, strength]
  );
}
