import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputInt, SignalingInputFloat} from 'UtilComponents';
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
    let size = new SignalingInputInt(31);
    createEffect(()=>this.effect.setSize(size.accessor()));
    let threshold = new SignalingInputFloat(0.7);
    createEffect(()=>this.effect.setThreshold(threshold.accessor()));
    let strength = new SignalingInputFloat(0.8);
    createEffect(()=>this.effect.setStrength(strength.accessor()));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> Bloom </a>
      <Show when={visible()}>
        <label> size
          <size.inputs />
        </label>
        <label> threshold
          <threshold.inputs />
        </label>
        <label> strength
          <strength.inputs />
        </label>
        <a onClick={_ => this.remover(this)}>remove</a>
      </Show>
    </div>;
  };
  setSrc(src: WebGLTexture): void {
    this.effect.setSrc(src);
  }
  setDest(dest: WebGLFramebuffer | null): void {
    this.effect.setDest(dest);
  }
}
