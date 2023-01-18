import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {EffectItem} from 'EffectStack';
import {RadialBlurEffect} from 'effects/RadialBlur';

export class RadialBlur implements EffectItem {
  effect: RadialBlurEffect;
  remover: (e: EffectItem) => void;
  constructor(
    context: WebGL2RenderingContext,
    resolution: [number, number],
    remover: (e: EffectItem) => void,
  ) {
    let dummy = glutil.createBufferTexture(context, resolution);
    this.effect = new RadialBlurEffect(
      context, dummy, null, resolution,
       100, [21, 21, 21], [10, 0.3, 0, 0], 21
    );
    this.remover = remover;
  }
  ui: Component<{}> = () => {
    let [visible, setVisibile] = createSignal(false);
    let [minRadius, setMinRadius] = createSignal(100);
    createEffect(()=>this.effect.setMinRadius(minRadius()));
    let [poly, setPoly] = createSignal([10, 0.3, 0, 0] as [number, number, number, number]);
    createEffect(()=>this.effect.setPolyKernelSize(poly()));
    let [numSample, setNumSample] = createSignal(21);
    createEffect(()=>this.effect.setNumSample(numSample()));

    return <div>
      <a onClick={_ => setVisibile(!visible())}> RadialBlur </a>
      <Show when={visible()}>
        <label> min radius
          <input type="number" step="0.1"
            value={minRadius()}
            onInput={e => setMinRadius(parseFloat(e.currentTarget.value))}
          />
        </label>
        <label> polynomial of kernel size
          <input type="number" step="0.1"
            value={poly()[0]}
            onInput={e => setPoly([parseFloat(e.currentTarget.value), poly()[1], poly()[2], poly()[3]])}
          />
          <input type="number" step="0.1"
            value={poly()[1]}
            onInput={e => setPoly([poly()[0], parseFloat(e.currentTarget.value), poly()[2], poly()[3]])}
          />
          <input type="number" step="0.1"
            value={poly()[2]}
            onInput={e => setPoly([poly()[0], poly()[1], parseFloat(e.currentTarget.value), poly()[3]])}
          />
          <input type="number" step="0.1"
            value={poly()[3]}
            onInput={e => setPoly([poly()[0], poly()[1], poly()[2], parseFloat(e.currentTarget.value)])}
          />
        </label>
        <label> number of samples
          <input type="number" step="1"
            value={numSample()}
            onInput={e => setNumSample(parseInt(e.currentTarget.value))}
          />
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
