import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputVec, SignalingInputInt, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {HalfToneShader} from 'effects/halftone';

export class HalfTone implements EffectItem {
  effect: HalfToneShader;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new HalfToneShader(context, dummy, null, resolution);
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let tileSize = new SignalingInputInt(8);
    createEffect(()=>this.effect.tileSize = tileSize.accessor());
    let step = new SignalingInputFloat(1/4);
    createEffect(()=>this.effect.requantizationScale = [
      step.accessor(), step.accessor(), step.accessor(), 1/255
    ]);
    let offset = new SignalingInputVec([3, 5] as [number, number], SignalingInputInt);
    createEffect(()=>this.effect.offset = offset.accessor());
    let angle = new SignalingInputFloat(Math.PI/6);
    createEffect(()=>this.effect.angle = angle.accessor());
    return <div>
      <a onClick={_ => setVisibile(!visible())}> HalfTone </a>
      <Show when={visible()}>
        <label> tile size
          <tileSize.inputs />
        </label>
        <label> step
          <step.inputs />
        </label>
        <label> offset
          <offset.inputs />
        </label>
        <label> angle
          <angle.inputs />
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
