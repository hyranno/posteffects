import {createSignal, Show} from 'solid-js';
import type { Component } from 'solid-js';
import * as glutil from 'glutil';

import {compress, decompress} from 'effects/compression';

const Compression: Component<{
  src: (HTMLCanvasElement | HTMLImageElement),
}> = (props) => {
  let resolution: [number, number] = [props.src.width, props.src.height];

  const canvas0 = document.createElement("canvas")!;
  canvas0.width = props.src.width;
  canvas0.height = props.src.height;
  let context0 = canvas0.getContext("webgl2")!;
  const srcTexture = context0.createTexture()!;
  glutil.loadTexture(props.src, srcTexture, context0);
  compress(context0, srcTexture, null, resolution, 4, 1.1, 0.2);

  const canvas1 = document.createElement("canvas")!;
  canvas1.width = props.src.width;
  canvas1.height = props.src.height;
  let context1 = canvas1.getContext("webgl2")!;
  const compressedTexture = context1.createTexture()!;
  glutil.loadTexture(canvas0, compressedTexture, context1);
  decompress(context1, compressedTexture, null, resolution, 4, 1.1, 0.2);
  // TODO: jpegsize = canvas1.toDataURL(jpg).length/4

  const title = "Compression";

  const [visible, setVisibile] = createSignal(false);
  const toggleVisible = () => {setVisibile(!visible())};
  return (
    <div>
      <div>
        <a onClick={toggleVisible} href="#">{title}</a>
      </div>
      <Show when={visible()}>
        {canvas0}
        compressed size: {canvas0.toDataURL("image/png").length/4}
        {canvas1}
        jpeg size: {canvas1.toDataURL("image/jpeg").length/4},
        webp size: {canvas1.toDataURL("image/webp").length/4}
      </Show>
    </div>
  );
};

export default Compression;
