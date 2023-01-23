import {createSignal, createEffect, on, For} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {BundledEffects} from 'effects/bundle';
import {Nop} from 'stackitems/Nop';
import {ToneCurveRGB} from 'stackitems/ToneCurveRGB';
import {ToneCurveHSL} from 'stackitems/ToneCurveHSL';
import {Dither} from 'stackitems/Dither';
import {HalfTone} from 'stackitems/Halftone';
import {Bloom} from 'stackitems/Bloom';
import {Blur} from 'stackitems/Blur';
import {Glare} from 'stackitems/Glare';
import {Halo} from 'stackitems/Halo';
import {MotionBlur} from 'stackitems/MotionBlur';
import {LightTrail} from 'stackitems/LightTrail';
import {RadialBlur} from 'stackitems/RadialBlur';
import {RadialEdge} from 'stackitems/RadialEdge';
import {RadialToneCurveHSL} from 'stackitems/RadialToneCurveHSL';

import styles from './EffectStack.module.css';

export interface EffectItem {
  effect: glutil.GlEffect;
  ui: Component<{}>;
  setSrc(src: WebGLTexture): void;
  setDest(dest: WebGLFramebuffer | null): void;
}

export class EffectStack extends glutil.GlEffect implements EffectItem {
  context: WebGL2RenderingContext;
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  effect: BundledEffects;
  items: () => EffectItem[];
  setItems: (v: EffectItem[]) => EffectItem[];
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
  ) {
    super(context);
    this.context = context;
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
    this.effect = new BundledEffects(context, []);
    [this.items, this.setItems] = createSignal([]);
    createEffect(on(this.items, () => {
      this.attachBuffers();
      this.effect.effects = this.items().map(i => i.effect);
    }));
  }
  override update() {
    this.effect.update();
  }
  attachBuffers() {
    var src = this.src;
    this.items().forEach((item, index, items) => {
      item.setSrc(src);
      if (index < items.length-1) {
        let tex = glutil.createBufferTexture(this.context, this.resolution);
        let dest = glutil.bindNewFramebuffer(this.context, tex);
        item.setDest(dest);
        src = tex;
      } else {
        item.setDest(this.dest);
      }
    });
  }
  push(item: EffectItem) {
    this.setItems(
      this.items().concat([item])
    );
  }
  remove(target: EffectItem) {
    this.setItems(
      this.items().filter(item => (item !== target))
    );
  }
  ui: Component<{}> = () => {
    let remover = (e: EffectItem) => {this.remove(e)};
    let options = new Map<string, ()=>EffectItem>([
      ["Nop", () => new Nop(this.context, this.resolution, remover)],
      ["ToneCurve(RGB)", () => new ToneCurveRGB(this.context, this.resolution, remover)],
      ["ToneCurve(HSL)", () => new ToneCurveHSL(this.context, this.resolution, remover)],
      ["Dither", () => new Dither(this.context, this.resolution, remover)],
      ["HalfTone", () => new HalfTone(this.context, this.resolution, remover)],
      ["Bloom", () => new Bloom(this.context, this.resolution, remover)],
      ["Blur", () => new Blur(this.context, this.resolution, remover)],
      ["Glare", () => new Glare(this.context, this.resolution, remover)],
      ["Halo", () => new Halo(this.context, this.resolution, remover)],
      ["MotionBlur", () => new MotionBlur(this.context, this.resolution, remover)],
      ["LightTrail", () => new LightTrail(this.context, this.resolution, remover)],
      ["RadialBlur", () => new RadialBlur(this.context, this.resolution, remover)],
      ["RadialEdge", () => new RadialEdge(this.context, this.resolution, remover)],
      ["RadialToneCurve(HSL)", () => new RadialToneCurveHSL(this.context, this.resolution, remover)],
    ]);
    let [selected, setSelected] = createSignal(options.keys().next().value);
    return <div class={styles.EffectStack}>
      <div class={styles.EffectItems}>
        <For each={this.items()}>
          {item => <item.ui />}
        </For>
      </div>
      <div>
        <a onClick={_ => this.push(options.get(selected())!())}> + </a>
        <select value={selected()} onInput={e => setSelected(e.currentTarget.value)}>
          <For each={Array.from(options.keys())}>{
            filter => <option value={filter}>{filter}</option>
          }</For>
        </select>
      </div>
    </div>;
  };
  setSrc(src: WebGLTexture) {
    this.src = src;
  }
  setDest(dest: WebGLFramebuffer | null) {
    this.dest = dest;
  }
}
