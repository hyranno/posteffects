import {createSignal, createEffect, Show, For} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {SignalingInputVec, SignalingInputInt} from 'UtilComponents';
import {EffectItem} from 'EffectStack';
import {TranslateColorEffect} from 'effects/displacement/Translate';

export class Translate implements EffectItem {
  effect: TranslateColorEffect;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new TranslateColorEffect(
      context, dummy, null, resolution,
      [[23, 0], [11, 8], [-5, 5]]
    );
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let initialValue = [[23, 0], [11, 8], [-5, 5]];
    let translate = initialValue.map(
      v => new SignalingInputVec(v as [number, number], SignalingInputInt)
    );
    createEffect(()=>this.effect.setTranslate(
      translate.map(v => v.accessor()) as [[number, number], [number, number], [number, number]]
    ));
    return <div>
      <a onClick={_ => setVisibile(!visible())}> Translate </a>
      <Show when={visible()}>
        <label> translate
          <For each={translate}>
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
