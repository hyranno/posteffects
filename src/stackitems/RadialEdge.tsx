import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputVec, SignalingInputInt, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {RadialEdgeEffect} from 'effects/RadialEdge';

export class RadialEdge implements EffectItem {
  effect: RadialEdgeEffect;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new RadialEdgeEffect(
      context, dummy, null, resolution,
       200, [21, 21, 21], [0.4, 0.1, 0, 0], 4, 11
    );
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let minRadius = new SignalingInputFloat(200);
    createEffect(()=>this.effect.setMinRadius(minRadius.accessor()));
    let poly = new SignalingInputVec([0.4, 0.1, 0, 0] as [number, number, number, number], SignalingInputFloat);
    createEffect(()=>this.effect.setPolyKernelSize(poly.accessor()));
    let strength = new SignalingInputFloat(4);
    createEffect(()=>this.effect.setStrength(strength.accessor()));
    let numSample = new SignalingInputInt(11);
    createEffect(()=>this.effect.setNumSample(numSample.accessor()));

    return <div>
      <a onClick={_ => setVisibile(!visible())}> RadialEdge </a>
      <Show when={visible()}>
        <label> min radius
          <minRadius.inputs />
        </label>
        <label> polynomial of kernel size
          <poly.inputs />
        </label>
        <label> strength
          <strength.inputs />
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
