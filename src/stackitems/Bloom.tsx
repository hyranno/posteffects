import {createSignal, createEffect, Show} from 'solid-js';
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
    let [size, setSize] = createSignal(31);
    createEffect(()=>this.effect.setSize(size()));
    let [threshold, setThreshold] = createSignal(0.7);
    createEffect(()=>this.effect.setThreshold(threshold()));
    let [strength, setStrength] = createSignal(0.8);
    createEffect(()=>this.effect.setStrength(strength()));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> Bloom </a>
      <Show when={visible()}>
        <label> size
          <input type="number" step="1"
            value={size()}
            onInput={e => setSize(parseInt(e.currentTarget.value))}
          />
        </label>
        <label> threshold
          <input type="number" step="0.1"
            value={threshold()}
            onInput={e => setThreshold(parseFloat(e.currentTarget.value))}
          />
        </label>
        <label> strength
          <input type="number" step="0.1"
            value={strength()}
            onInput={e => setStrength(parseFloat(e.currentTarget.value))}
          />
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
