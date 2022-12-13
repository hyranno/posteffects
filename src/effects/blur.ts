import * as glutil from 'glutil';

import {filter1d} from 'effects/filter1d';

function gaussianKernel(size: number): number[] {
  const sigma = size / (2 * 3);
  const half = (size - 1) / 2;
  const weights: number[] = Array.from(Array(size), (_, i) => Math.exp(-(i - half)*(i - half) / (2*sigma*sigma)));
  const denominator = weights.reduce((prev, curr) => prev+curr, 0);  // calc sum, not analytic integration, for approx error
  return weights.map((v) => v/denominator);
}

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
