import {createSignal, createEffect, on, Show} from 'solid-js';
import type { Component } from 'solid-js';
import * as glutil from 'glutil';

import {Wavelet2dEffect, Wavelet2dInverseEffect} from 'effects/wavelet';


const Wavelet: Component<{
  src: (HTMLCanvasElement | HTMLImageElement | HTMLVideoElement),
  update: () => any,
}> = (props) => {
  let resolution: [number, number] = [props.src.width, props.src.height];

  const canvas0 = document.createElement("canvas")!;
  canvas0.width = props.src.width;
  canvas0.height = props.src.height;
  let context0 = canvas0.getContext("webgl2")!;
  const srcTexture = context0.createTexture()!;

  let effect0 = new Wavelet2dEffect(context0, srcTexture, null, resolution, 4);

  const canvas1 = document.createElement("canvas")!;
  canvas1.width = props.src.width;
  canvas1.height = props.src.height;
  let context1 = canvas1.getContext("webgl2")!;
  const waveletTexture = context1.createTexture()!;

  let effect1 = new Wavelet2dInverseEffect(context1, waveletTexture, null, resolution, 4);

  const title = "Wavelet";

  createEffect(on(props.update, ()=>{
    glutil.loadTexture(props.src, srcTexture, context0);
    effect0.update();
    glutil.loadTexture(canvas0, waveletTexture, context1);
    effect1.update();
  }));
  const [visible, setVisibile] = createSignal(false);
  const toggleVisible = () => {setVisibile(!visible())};
  return (
    <div>
      <div>
        <a onClick={toggleVisible} href="#">{title}</a>
      </div>
      <Show when={visible()}>
        {canvas0}
        {canvas1}
      </Show>
    </div>
  );
};

export default Wavelet;
