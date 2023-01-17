import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {EffectItem} from 'EffectStack';
import {LightTrailEffect} from 'effects/LightTrail';

export class LightTrail implements EffectItem {
  effect: LightTrailEffect;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new LightTrailEffect(context, dummy, null, resolution, 0.7, 0.8, 0.9);
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let [threshold, setThreshold] = createSignal(0.7);
    let [ratio, setRatio] = createSignal(0.8);
    let [strength, setStrength] = createSignal(0.9);
    createEffect(()=>this.effect.setThreshold(threshold()));
    createEffect(()=>this.effect.setRatio(ratio()));
    createEffect(()=>this.effect.setStrength(strength()));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> LightTrail </a>
      <Show when={visible()}>
        <label> threshold
          <input type="number" step="0.1"
            value={threshold()}
            onInput={e => setThreshold(parseFloat(e.currentTarget.value))}
          />
        </label>
        <label> ratio
          <input type="number" step="0.01"
            value={ratio()}
            onInput={e => setRatio(parseFloat(e.currentTarget.value))}
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
