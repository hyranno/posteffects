import {createSignal, Show} from 'solid-js';
import type { Component } from 'solid-js';
import * as glutil from 'glutil';

import {glare} from 'effects/glare';

const Glare: Component<{
  src: (HTMLCanvasElement | HTMLImageElement),
}> = (props) => {
  const canvas = document.createElement("canvas")!;
  canvas.width = props.src.width;
  canvas.height = props.src.height;
  let resolution: [number, number] = [props.src.width, props.src.height];

  let context = canvas.getContext("webgl2")!;

  const srcTexture = context.createTexture()!;
  glutil.loadTexture(props.src, srcTexture, context);

  glare(context, srcTexture, null, resolution, 0.7, [
    {size: 127, angle: Math.PI*0.05, strength: 0.7},
    {size: 101, angle: Math.PI*0.21, strength: 0.4},
  ]);

  const title = "Glare";

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

export default Glare;
