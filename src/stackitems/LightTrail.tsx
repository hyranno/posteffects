import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputFloat} from 'UtilComponents';
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
    let threshold = new SignalingInputFloat(0.7);
    let ratio = new SignalingInputFloat(0.8);
    let strength = new SignalingInputFloat(0.9);
    createEffect(()=>this.effect.setThreshold(threshold.accessor()));
    createEffect(()=>this.effect.setRatio(ratio.accessor()));
    createEffect(()=>this.effect.setStrength(strength.accessor()));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> LightTrail </a>
      <Show when={visible()}>
        <label> threshold
          <threshold.inputs />
        </label>
        <label> ratio
          <ratio.inputs />
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
