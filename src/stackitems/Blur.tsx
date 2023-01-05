import {createSignal, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {EffectItem} from 'EffectStack';
import {BlurEffect} from 'effects/blur';

export class Blur implements EffectItem {
  effect: BlurEffect;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new BlurEffect(context, dummy, null, resolution, 31);
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    return <>
      <a onClick={_ => setVisibile(!visible())}> Blur </a>
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
