import type { Component } from 'solid-js';
import * as glutil from 'glutil';

import {filter1d} from 'effects/filter1d';

const Blur: Component<{
  src: (HTMLCanvasElement | HTMLImageElement),
}> = (props) => {
  const canvas = document.createElement("canvas")!;
  canvas.width = props.src.width;
  canvas.height = props.src.height;
  let resolution: [number, number] = [props.src.width, props.src.height];
  let kernel = [1/16, 4/16, 6/16, 4/16, 1/16];

  let context = canvas.getContext("webgl2")!;
  let gl = context;

  const srcTexture = context.createTexture()!;
  glutil.loadTexture(props.src, srcTexture, context);

  // render to the middle buffer texture
  const midTexture = context.createTexture()!;
  context.bindTexture(gl.TEXTURE_2D, midTexture);
  context.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null
  );
  context.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  context.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  const midBuffer = context.createFramebuffer();
  context.bindFramebuffer(gl.FRAMEBUFFER, midBuffer);
  context.framebufferTexture2D(
    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, midTexture, 0
  );
  context.bindTexture(gl.TEXTURE_2D, null);
  filter1d(
    context, srcTexture, resolution,
    kernel, [1,0]
  );

  // render to the canvas
  context.bindFramebuffer(gl.FRAMEBUFFER, null);
  filter1d(
    context, midTexture, resolution,
    kernel, [0,1]
  );

  return (
    <div>
      {canvas}
    </div>
  );
};

export default Blur;
