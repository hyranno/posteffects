import {createSignal, Show} from 'solid-js';
import type { Component } from 'solid-js';
import * as glutil from 'glutil';

import {knee} from 'effects/knee';
import {filter1d} from 'effects/filter1d';
import {add} from 'effects/add';

function gaussianKernel(size: number): number[] {
  const sigma = size / (2 * 3);
  const half = (size - 1) / 2;
  const weights: number[] = Array.from(Array(size), (_, i) => Math.exp(-(i - half)*(i - half) / (2*sigma*sigma)));
  const denominator = weights.reduce((prev, curr) => prev+curr, 0);  // calc sum, not analytic integration, for approx error
  return weights.map((v) => v/denominator);
}


const Bloom: Component<{
  src: (HTMLCanvasElement | HTMLImageElement),
}> = (props) => {
  const canvas = document.createElement("canvas")!;
  canvas.width = props.src.width;
  canvas.height = props.src.height;
  let resolution: [number, number] = [props.src.width, props.src.height];
  let kernel = gaussianKernel(31); //[1/16, 4/16, 6/16, 4/16, 1/16];

  let context = canvas.getContext("webgl2")!;
  let gl = context;

  const srcTexture = context.createTexture()!;
  glutil.loadTexture(props.src, srcTexture, context);


  function createBufferTexture(): WebGLTexture {
    const texture = context.createTexture()!;
    context.bindTexture(gl.TEXTURE_2D, texture);
    context.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null
    );
    context.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    context.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    context.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }

  function bindNewFramebuffer(texture: WebGLTexture): WebGLFramebuffer {
    context.bindTexture(gl.TEXTURE_2D, texture);
    const buffer = context.createFramebuffer()!;
    context.bindFramebuffer(gl.FRAMEBUFFER, buffer);
    context.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0
    );
    context.bindTexture(gl.TEXTURE_2D, null);
    return buffer;
  }

  const kneeTexture = createBufferTexture();
  bindNewFramebuffer(kneeTexture);
  knee(
    context, srcTexture, resolution,
    0.4
  );

  const hblurTexture = createBufferTexture();
  bindNewFramebuffer(hblurTexture);
  filter1d(
    context, kneeTexture, resolution,
    kernel, [1,0]
  );

  const blurTexture = createBufferTexture();
  bindNewFramebuffer(blurTexture);
  filter1d(
    context, hblurTexture, resolution,
    kernel, [0,1]
  );

  const kernelCenter = kernel[Math.floor(kernel.length / 2)];
  const bloomTexture = createBufferTexture();
  bindNewFramebuffer(bloomTexture);
  add(
    context, blurTexture, kneeTexture, resolution,
    [1, -kernelCenter*kernelCenter]
  );

  context.bindFramebuffer(gl.FRAMEBUFFER, null);  // render to the canvas
  add(
    context, srcTexture, bloomTexture, resolution,
    [1, 1]
  );

  const title = "Bloom";

  const [visible, setVisibile] = createSignal(false);
  const toggleVisible = () => {setVisibile(!visible())};
  return (
    <div>
      <div>
        <a onClick={toggleVisible} href="#">{title}</a>
      </div>
      <Show when={visible()}>
        {canvas}
      </Show>
    </div>
  );
};

export default Bloom;
