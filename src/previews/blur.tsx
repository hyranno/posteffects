import {createSignal, Show} from 'solid-js';
import type { Component } from 'solid-js';
import * as glutil from 'glutil';

import {blur} from 'effects/blur';

const Blur: Component<{
  src: (HTMLCanvasElement | HTMLImageElement),
}> = (props) => {
  const canvas = document.createElement("canvas")!;
  canvas.width = props.src.width;
  canvas.height = props.src.height;
  let resolution: [number, number] = [props.src.width, props.src.height];

  let context = canvas.getContext("webgl2")!;

  const srcTexture = context.createTexture()!;
  glutil.loadTexture(props.src, srcTexture, context);

  blur(context, srcTexture, null, resolution, 7);

  const title = "Blur";

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

export default Blur;
