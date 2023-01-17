import {createSignal, createEffect, Show} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
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
    let [tileSize, setTileSize] = createSignal(8);
    createEffect(()=>this.effect.tileSize = tileSize());
    let [step, setStep] = createSignal(1/4);
    createEffect(()=>this.effect.requantizationScale = [step(), step(), step(), 1/255]);
    let [offsetX, setOffsetX] = createSignal(3);
    createEffect(()=>this.effect.offset[0] = offsetX());
    let [offsetY, setOffsetY] = createSignal(5);
    createEffect(()=>this.effect.offset[1] = offsetY());
    let [angle, setAngle] = createSignal(Math.PI/6);
    createEffect(()=>this.effect.angle = angle());
    return <div>
      <a onClick={_ => setVisibile(!visible())}> HalfTone </a>
      <Show when={visible()}>
        <label> tile size
          <input type="number" step="1"
            value={tileSize()}
            onInput={e => setTileSize(parseInt(e.currentTarget.value))}
          />
        </label>
        <label> step
          <input type="number" step="0.01"
            value={step()}
            onInput={e => setStep(parseFloat(e.currentTarget.value))}
          />
        </label>
        <label> offset
          <input type="number" step="1"
            value={offsetX()}
            onInput={e => setOffsetX(parseInt(e.currentTarget.value))}
          />
          <input type="number" step="1"
            value={offsetY()}
            onInput={e => setOffsetY(parseInt(e.currentTarget.value))}
          />
        </label>
        <label> angle
          <input type="number" step="0.01"
            value={angle()}
            onInput={e => setAngle(parseFloat(e.currentTarget.value))}
          />
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
