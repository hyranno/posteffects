import {createSignal, createEffect, Show, For} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {spline3} from 'util';
import {SignalingInputVec, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {ToneCurveRGBShader} from 'effects/ToneCurveRGB';

export class ToneCurveRGB implements EffectItem {
  effect: ToneCurveRGBShader;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new ToneCurveRGBShader(context, dummy, null, resolution, [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
      [0, 0, 0]
    ]);
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let initialPoly = spline3([[0,0], [0.3, 0.2], [0.7, 0.8], [1,1]]).map(v => [v,v,v]);
    let poly = initialPoly.map(
      v => new SignalingInputVec(v as [number, number, number], SignalingInputFloat)
    );
    poly.forEach((v, i) => createEffect(()=>this.effect.poly[i] = v.accessor()));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> ToneCurve(RGB) </a>
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
