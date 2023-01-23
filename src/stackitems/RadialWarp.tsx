import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputVec, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {RadialWarpShader} from 'effects/RadialWarp';

export class RadialWarp implements EffectItem {
  effect: RadialWarpShader;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new RadialWarpShader(context, dummy, null, resolution,
      [0, 1, -0.001, 0]
    );
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let initialPoly = [0, 1, -0.001, 0] as [number, number, number, number];
    let poly = new SignalingInputVec(initialPoly, SignalingInputFloat);
    createEffect(()=>this.effect.poly = poly.accessor());
    return <div>
      <a onClick={_ => setVisibile(!visible())}> RadialWarp </a>
      <Show when={visible()}>
        <label> polynomial curve
          <poly.inputs />
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
