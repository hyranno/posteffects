import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputInt, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {DitherShader} from 'effects/dither';

export class Dither implements EffectItem {
  effect: DitherShader;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new DitherShader(context, dummy, null, resolution);
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let depth = new SignalingInputInt(3);
    createEffect(()=>this.effect.depth = depth.accessor());
    let step = new SignalingInputFloat(1/4);
    createEffect(()=>this.effect.requantizationScale = step.accessor());
    return <div>
      <a onClick={_ => setVisibile(!visible())}> Dither </a>
      <Show when={visible()}>
        <label> depth
          <depth.inputs />
        </label>
        <label> step
          <step.inputs />
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
