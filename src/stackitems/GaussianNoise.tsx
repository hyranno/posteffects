import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputVec, SignalingInputInt, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {GaussianNoiseShader} from 'effects/gaussiannoise';

export class GaussianNoise implements EffectItem {
  effect: GaussianNoiseShader;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new GaussianNoiseShader(
      context, dummy, null, resolution,
      [0.05, 0.03, 0.02],
      [0, 1, 2],
    );
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);

    let strength = new SignalingInputVec([0.05, 0.03, 0.02] as [number, number, number], SignalingInputFloat);
    createEffect(()=>this.effect.strength = strength.accessor());
    let salts = new SignalingInputVec([0, 1, 2] as [number, number, number], SignalingInputFloat);
    createEffect(()=>this.effect.salts = salts.accessor());

    return <div>
      <a onClick={_ => setVisibile(!visible())}> GaussianNoise </a>
      <Show when={visible()}>
        <label> strength
          <strength.inputs />
        </label>
        <label> salts
          <salts.inputs />
        </label>
        <a onClick={_ => this.remover(this)}>remove</a>
      </Show>
    </div>;
  };
  setSrc(src: WebGLTexture): void {
    this.effect.src = src;
  }
  setDest(dest: WebGLFramebuffer | null): void {
    this.effect.dest = dest;
  }
}
