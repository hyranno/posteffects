import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputVec, SignalingInputInt, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {RadialBlurEffect} from 'effects/RadialBlur';

export class RadialBlur implements EffectItem {
  effect: RadialBlurEffect;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new RadialBlurEffect(
      context, dummy, null, resolution,
       100, [21, 21, 21], [10, 0.3, 0, 0], 21
    );
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let minRadius = new SignalingInputFloat(100);
    createEffect(()=>this.effect.setMinRadius(minRadius.accessor()));
    let poly = new SignalingInputVec([10, 0.3, 0, 0] as [number, number, number, number], SignalingInputFloat);
    createEffect(()=>this.effect.setPolyKernelSize(poly.accessor()));
    let numSample = new SignalingInputInt(21);
    createEffect(()=>this.effect.setNumSample(numSample.accessor()));

    return <div>
      <a onClick={_ => setVisibile(!visible())}> RadialBlur </a>
      <Show when={visible()}>
        <label> min radius
          <minRadius.inputs />
        </label>
        <label> polynomial of kernel size
          <poly.inputs />
        </label>
        <label> number of samples
          <numSample.inputs />
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
