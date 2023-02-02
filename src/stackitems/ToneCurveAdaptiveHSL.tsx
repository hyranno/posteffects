import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputVec, SignalingInputInt, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {ToneCurveAdaptiveHSLShader} from 'effects/tonecurveAdaptiveHSL';

export class ToneCurveAdaptive implements EffectItem {
  effect: ToneCurveAdaptiveHSLShader;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new ToneCurveAdaptiveHSLShader(
      context, dummy, null, resolution,
      [0.0, 0.8, 0.4], [0.7, 0.7, 0.3], 51
    );
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let strength = new SignalingInputVec([0.0, 0.8, 0.4] as [number, number, number], SignalingInputFloat);
    createEffect(()=>this.effect.strength = strength.accessor());
    let range = new SignalingInputVec([0.7, 0.7, 0.3] as [number, number, number], SignalingInputFloat);
    createEffect(()=>this.effect.range = range.accessor());
    let size = new SignalingInputInt(51);
    createEffect(()=>this.effect.setSize(size.accessor()));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> ToneCurveAdaptive </a>
      <Show when={visible()}>
        <label> strength
          <strength.inputs />
        </label>
        <label> range
          <range.inputs />
        </label>
        <label> size
          <size.inputs />
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
