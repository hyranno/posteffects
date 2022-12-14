import * as glutil from 'glutil';
import {gaussianKernel} from 'util';

import {filter1d} from 'effects/filter1d';

export function blur(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  dest: WebGLFramebuffer | null,
  resolution: [number, number],
  size: number,
) {
  let gl = context;
  let kernel = gaussianKernel(size);

  let hblurTexture = glutil.createBufferTexture(context, resolution);
  glutil.bindNewFramebuffer(context, hblurTexture);
  filter1d(
    context, src, resolution,
    kernel, [1,0]
  );

  context.bindFramebuffer(gl.FRAMEBUFFER, dest);
  filter1d(
    context, hblurTexture, resolution,
    kernel, [0,1]
  );
}
