import {createSignal, createEffect, on, Show} from 'solid-js';
import type { Component } from 'solid-js';
import * as glutil from 'glutil';

import {BloomEffect} from 'effects/bloom';

const Bloom: Component<{
  src: (HTMLCanvasElement | HTMLImageElement | HTMLVideoElement),
  update: () => any,
}> = (props) => {
  const canvas = document.createElement("canvas")!;
  canvas.width = props.src.width;
  canvas.height = props.src.height;
  const signalingCanvas = on(props.update, () => canvas);
  let resolution: [number, number] = [props.src.width, props.src.height];

  let context = canvas.getContext("webgl2")!;

  const srcTexture = context.createTexture()!;
  glutil.loadTexture(props.src, srcTexture, context);

  let effect = new BloomEffect(context, srcTexture, null, resolution, 31, 0.4, 1);

  const title = "Bloom";

  createEffect(on(props.update, () => effect.update()));
  const [visible, setVisibile] = createSignal(false);
  const toggleVisible = () => {setVisibile(!visible())};
  return (
    <div>
      <div>
        <a onClick={toggleVisible} href="#">{title}</a>
      </div>
      <Show when={visible()}>
        {signalingCanvas(undefined)}
      </Show>
    </div>
  );
};

export default Bloom;
