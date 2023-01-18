import {createEffect, on} from 'solid-js';
import type { Component } from 'solid-js';
import * as glutil from 'glutil';

import {EffectStack} from 'EffectStack';

const Stack: Component<{
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
  let effect = new EffectStack(context, srcTexture, null, resolution);

  createEffect(on(props.update, () => {
    glutil.loadTexture(props.src, srcTexture, context);
    effect.update();
  }));
  return (
    <div>
      {effect.ui({})}
      {signalingCanvas(undefined)}
    </div>
  );

};

export default Stack;
