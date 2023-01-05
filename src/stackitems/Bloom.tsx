import {createSignal, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {EffectItem} from 'EffectStack';
import {BloomEffect} from 'effects/bloom';

export class Bloom implements EffectItem {
  effect: BloomEffect;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new BloomEffect(context, dummy, null, resolution, 31, 0.7, 0.8);
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    return <>
      <a onClick={_ => setVisibile(!visible())}> Bloom </a>
      <Show when={visible()}>
        <a onClick={_ => this.remover(this)}>remove</a>
      </Show>
    </>;
  };
  setSrc(src: WebGLTexture): void {
    this.effect.setSrc(src);
  }
  setDest(dest: WebGLFramebuffer | null): void {
    this.effect.setDest(dest);
  }
}
