import {createSignal, createEffect, on, Show} from 'solid-js';
import type { Component } from 'solid-js';
import * as glutil from 'glutil';

import {NopShader} from 'effects/nop';

const Nop: Component<{
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

  let effect = new NopShader(context, srcTexture, null, resolution);

  const title = "Nop";

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

export default Nop;
