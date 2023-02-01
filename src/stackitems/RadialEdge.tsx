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
       200, [5, 5, 5], [0.4, 0.1, 0, 0], 5
    );
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let minRadius = new SignalingInputFloat(200);
    createEffect(()=>this.effect.setMinRadius(minRadius.accessor()));
    let kernelSize = new SignalingInputInt(5);
    createEffect(()=>{
      let v = kernelSize.accessor();
      this.effect.setSize([v,v,v]);
      this.effect.setNumSample(v);
    });
    let poly = new SignalingInputVec([0.4, 0.1, 0, 0] as [number, number, number, number], SignalingInputFloat);
    createEffect(()=>this.effect.setPolyStrength(poly.accessor()));

    return <div>
      <a onClick={_ => setVisibile(!visible())}> RadialEdge </a>
      <Show when={visible()}>
        <label> min radius
          <minRadius.inputs />
        </label>
        <label> kernel size
          <kernelSize.inputs />
        </label>
        <label> polynomial of strength
          <poly.inputs />
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
