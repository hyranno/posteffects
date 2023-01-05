import {createSignal, createEffect, on, Show, For} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {BundledEffects} from 'effects/bundle';
import {Nop} from 'stackitems/Nop';
import {Dither} from 'stackitems/Dither';
import {HalfTone} from 'stackitems/Halftone';
import {Bloom} from 'stackitems/Bloom';
import {Blur} from 'stackitems/Blur';
import {Glare} from 'stackitems/Glare';
import {Halo} from 'stackitems/Halo';

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
    let [newVisible, setNewVisible] = createSignal(false);
    let remover = (e: EffectItem) => {this.remove(e)};
    return <>
      <For each={this.items()}>
        {item => <item.ui />}
      </For>
      <a onClick={_ => setNewVisible(!newVisible())}> + </a>
      <Show when={newVisible()}>
        <a onClick={_ => this.push(new Nop(this.context, this.resolution, remover))}>Nop</a>
        <a onClick={_ => this.push(new Dither(this.context, this.resolution, remover))}>Dither</a>
        <a onClick={_ => this.push(new HalfTone(this.context, this.resolution, remover))}>HalfTone</a>
        <a onClick={_ => this.push(new Bloom(this.context, this.resolution, remover))}>Bloom</a>
        <a onClick={_ => this.push(new Blur(this.context, this.resolution, remover))}>Blur</a>
        <a onClick={_ => this.push(new Glare(this.context, this.resolution, remover))}>Glare</a>
        <a onClick={_ => this.push(new Halo(this.context, this.resolution, remover))}>Halo</a>
      </Show>
    </>;
  };
  setSrc(src: WebGLTexture) {
    this.src = src;
  }
  setDest(dest: WebGLFramebuffer | null) {
    this.dest = dest;
  }
}
