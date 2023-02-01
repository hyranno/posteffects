import {createSignal, createEffect, Show, For} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {spline3} from 'util';
import {SignalingInputVec, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {ToneCurveStairsHSLShader} from 'effects/ToneCurveStairsHSL';

export class ToneCurveStairsHSL implements EffectItem {
  effect: ToneCurveStairsHSLShader;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new ToneCurveStairsHSLShader(context, dummy, null, resolution,
      [0.2, 0.2, 0.1], [0.3, 0.3, 0.3]
    );
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let step = new SignalingInputVec([0.2, 0.2, 0.1] as [number, number, number], SignalingInputFloat);
    createEffect(()=>this.effect.step = step.accessor());
    let softness = new SignalingInputVec([0.3, 0.3, 0.3] as [number, number, number], SignalingInputFloat);
    createEffect(()=>this.effect.softness = softness.accessor());
    return <div>
      <a onClick={_ => setVisibile(!visible())}> ToneCurve(HSL) </a>
      <Show when={visible()}>
        <label> step
          <step.inputs />
        </label>
        <label> softness
          <softness.inputs />
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
