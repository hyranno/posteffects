import {createSignal, createEffect, Show, For} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputVec, SignalingInputInt, SignalingInputFloat} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {TiledRandomEffect} from 'effects/displacement/TiledRandom';

export class TiledRandom implements EffectItem {
  effect: TiledRandomEffect;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new TiledRandomEffect(
      context, dummy, null, resolution,
      [1024, 4],
      [[11, 0], [8, 4], [5, 2]],
      [[0, 1], [2, 3], [4, 5]],
    );
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let tilesize = new SignalingInputVec([1024, 4] as [number, number], SignalingInputInt);
    createEffect(()=>this.effect.setTileSize(tilesize.accessor()));
    let strength = [[11, 0], [8, 4], [5, 2]].map(
      v => new SignalingInputVec(v as [number, number], SignalingInputFloat)
    );
    createEffect(()=>this.effect.setStrength(
      strength.map(v => v.accessor()) as [[number, number], [number, number], [number, number]]
    ));
    let salt = [[0, 1], [2, 3], [4, 5]].map(
      v => new SignalingInputVec(v as [number, number], SignalingInputFloat)
    );
    createEffect(()=>this.effect.setSalt(
      salt.map(v => v.accessor()) as [[number, number], [number, number], [number, number]]
    ));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> TiledRandom </a>
      <Show when={visible()}>
        <label> tile size
          <tilesize.inputs />
        </label>
        <label> strength
          <For each={strength}>
            {v => <div><v.inputs /></div>}
          </For>
        </label>
        <label> seed
          <For each={salt}>
            {v => <div><v.inputs /></div>}
          </For>
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
