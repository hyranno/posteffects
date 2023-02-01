import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputInt, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {EdgeEffect} from 'effects/Edge';

export class Edge implements EffectItem {
  effect: EdgeEffect;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new EdgeEffect(context, dummy, null, resolution, [5,5,5], 1);
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let kernelSize = new SignalingInputInt(5);
    createEffect(()=>{
      let v = kernelSize.accessor();
      this.effect.setKernelSize([v,v,v]);
    });
    let strength = new SignalingInputFloat(1);
    createEffect(()=>this.effect.setStrength(strength.accessor()));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> Edge </a>
      <Show when={visible()}>
        <label> kernel size
          <kernelSize.inputs />
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
