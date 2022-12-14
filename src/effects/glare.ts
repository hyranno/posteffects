import * as glutil from 'glutil';
import {gaussianKernel} from 'util';

import {knee} from 'effects/knee';
import {filter1d} from 'effects/filter1d';
import {add} from 'effects/add';

export function glare(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  dest: WebGLFramebuffer | null,
  resolution: [number, number],
  threshold: number,
  params: {
    size: number,
    angle: number,
    strength: number,
  }[],
) {
  let gl = context;

  const kneeTexture = glutil.createBufferTexture(context, resolution);
  glutil.bindNewFramebuffer(context, kneeTexture);
  knee(
    context, src, resolution,
    threshold
  );

  let filteredTexture = glutil.createBufferTexture(context, resolution);
  let filterBuffer = glutil.bindNewFramebuffer(context, filteredTexture);

  let glareTextures = Array.from(Array(2), (_) => glutil.createBufferTexture(context, resolution));
  let glareBuffers = glareTextures.map((tex) => glutil.bindNewFramebuffer(context, tex));

  params.forEach((p, i) => {
    let kernel = gaussianKernel(p.size);
    kernel[Math.floor(kernel.length/2)] = 0;
    context.bindFramebuffer(gl.FRAMEBUFFER, filterBuffer);
    filter1d(context, kneeTexture, resolution, kernel, [Math.cos(p.angle), Math.sin(p.angle)]);
    context.bindFramebuffer(gl.FRAMEBUFFER, glareBuffers[i%2]);
    add(context, glareTextures[(i+1)%2], filteredTexture, resolution, [1, p.strength]);
  });
  context.bindFramebuffer(gl.FRAMEBUFFER, dest);
  add(context, src, glareTextures[(params.length-1)%2], resolution, [1, 1]);
}
