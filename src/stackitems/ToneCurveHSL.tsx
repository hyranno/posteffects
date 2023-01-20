import {createSignal, createEffect, Show, For} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputVec, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {ToneCurveHSLShader} from 'effects/ToneCurveHSL';

export class ToneCurveHSL implements EffectItem {
  effect: ToneCurveHSLShader;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new ToneCurveHSLShader(context, dummy, null, resolution, [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, -1.7],
      [0, 0, 1.68]
    ]);
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let initialPoly = [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, -1.7],
      [0, 0, 1.68]
    ];
    let poly = initialPoly.map(
      v => new SignalingInputVec(v as [number, number, number], SignalingInputFloat)
    );
    poly.forEach((v, i) => createEffect(()=>this.effect.poly[i] = v.accessor()));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> ToneCurve(HSL) </a>
      <Show when={visible()}>
        <label> polynomial curve
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
