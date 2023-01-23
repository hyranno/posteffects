import {createSignal, createEffect, Show, For} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {spline3} from 'util';
import {SignalingInputVec, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {RadialToneCurveHSLShader} from 'effects/RadialToneCurveHSL';

export class RadialToneCurveHSL implements EffectItem {
  effect: RadialToneCurveHSLShader;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new RadialToneCurveHSLShader(context, dummy, null, resolution,
      100,
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
        [0, 0, 0]
      ]
    );
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let initialPoly = [0, 0.002, 0, 0].map(v => [v,v,v]);
    let minRadius = new SignalingInputFloat(100);
    createEffect(()=>this.effect.min_radius = minRadius.accessor());
    let poly = initialPoly.map(
      v => new SignalingInputVec(v as [number, number, number], SignalingInputFloat)
    );
    poly.forEach((v, i) => createEffect(()=>this.effect.poly_strength[i] = v.accessor()));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> RadialToneCurve(HSL) </a>
      <Show when={visible()}>
        <label> min radius
          <minRadius.inputs />
        </label>
        <label> polynomial curve of strength
          <For each={poly}>
              {v => <div><v.inputs /></div>}
          </For>
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
