import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {MotionBlurEffect} from 'effects/MotionBlur';

export class MotionBlur implements EffectItem {
  effect: MotionBlurEffect;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new MotionBlurEffect(context, dummy, null, resolution, 0.4);
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let ratio = new SignalingInputFloat(0.4);
    createEffect(()=>this.effect.setRatio(ratio.accessor()));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> MotionBlur </a>
      <Show when={visible()}>
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
