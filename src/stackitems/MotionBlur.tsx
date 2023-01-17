import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
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
    let [ratio, setRatio] = createSignal(0.4);
    createEffect(()=>this.effect.setRatio(ratio()));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> MotionBlur </a>
      <Show when={visible()}>
        <label> ratio
          <input type="number" step="0.01"
            value={ratio()}
            onInput={e => setRatio(parseFloat(e.currentTarget.value))}
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
