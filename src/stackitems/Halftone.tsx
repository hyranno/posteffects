import {createSignal, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {EffectItem} from 'EffectStack';
import {HalfToneShader} from 'effects/halftone';

export class HalfTone implements EffectItem {
  effect: HalfToneShader;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new HalfToneShader(context, dummy, null, resolution);
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    return <>
      <a onClick={_ => setVisibile(!visible())}> HalfTone </a>
      <Show when={visible()}>
        <a onClick={_ => this.remover(this)}>remove</a>
      </Show>
    </>;
  };
  setSrc(src: WebGLTexture): void {
    this.effect.src = src;
  }
  setDest(dest: WebGLFramebuffer | null): void {
    this.effect.dest = dest;
  }
}
