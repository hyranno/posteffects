import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputInt, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {StutteringEffect} from 'effects/Stuttering';

export class Stuttering implements EffectItem {
  effect: StutteringEffect;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new StutteringEffect(
      context, dummy, null, resolution,
      10, 0.3
    );
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let seed = new SignalingInputInt(10);
    createEffect(()=>this.effect.setSeed(seed.accessor()));
    let ratio = new SignalingInputFloat(0.3);
    createEffect(()=>this.effect.setRatio(ratio.accessor()));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> Stuttering </a>
      <Show when={visible()}>
        <label> seed
          <seed.inputs />
        </label>
        <label> ratio
          <ratio.inputs />
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
