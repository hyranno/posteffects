import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputVec, SignalingInputInt, SignalingInputFloat} from 'UtilComponents';
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
    let threshold = new SignalingInputFloat(0.7);
    createEffect(()=>this.effect.setThreshold(threshold.accessor()));
    let radiusOuter = new SignalingInputVec([100, 106, 127] as [number, number, number], SignalingInputInt);
    createEffect(()=>this.effect.setRadiusOuter(radiusOuter.accessor()));
    let radiusInner = new SignalingInputVec([70, 80, 100] as [number, number, number], SignalingInputInt);
    createEffect(()=>this.effect.setRadiusInner(radiusInner.accessor()));
    let strength = new SignalingInputFloat(7);
    createEffect(()=>this.effect.setStrength(strength.accessor()));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> Halo </a>
      <Show when={visible()}>
        <label> threshold
          <threshold.inputs />
        </label>
        <label> outer radius
          <radiusOuter.inputs />
        </label>
        <label> inner radius
          <radiusInner.inputs />
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
