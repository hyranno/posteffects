import {createSignal, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {EffectItem} from 'EffectStack';
import {HaloEffect} from 'effects/halo';

export class Halo implements EffectItem {
  effect: HaloEffect;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new HaloEffect(
      context, dummy, null, resolution,
      0.7, [100, 106, 127], [70, 80, 100], 7
    );
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    return <>
      <a onClick={_ => setVisibile(!visible())}> Halo </a>
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
