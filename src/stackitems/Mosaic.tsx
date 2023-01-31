import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputVec, SignalingInputInt, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {MosaicShader} from 'effects/Mosaic';

export class Mosaic implements EffectItem {
  effect: MosaicShader;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new MosaicShader(
      context, dummy, null, resolution,
      [16, 16], 10, 16
    );
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let tileSize = new SignalingInputVec([16, 16] as [number, number], SignalingInputInt);
    createEffect(()=>this.effect.setTileSize(tileSize.accessor()));
    let seed = new SignalingInputInt(10);
    createEffect(()=>this.effect.setSeed(seed.accessor()));
    let numSamples = new SignalingInputInt(16);
    createEffect(()=>this.effect.setSeed(numSamples.accessor()));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> Mosaic (Monte Carlo) </a>
      <Show when={visible()}>
        <label> tileSize
          <tileSize.inputs />
        </label>
        <label> seed
          <seed.inputs />
        </label>
        <label> number of samples
          <numSamples.inputs />
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
