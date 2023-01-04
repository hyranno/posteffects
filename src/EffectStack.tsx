import {createSignal, createEffect, on, For} from 'solid-js';
import type {Component} from 'solid-js';

import * as glutil from 'glutil';
import {BundledEffects} from 'effects/bundle';
import {Nop} from 'stackitems/Nop';

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
    return <>
      <For each={this.items()}>
        {item => <item.ui />}
      </For>
      <a onClick={_ => this.push(new Nop(this.context, this.resolution, e => {this.remove(e)}))}> + </a>
    </>;
  };
  setSrc(src: WebGLTexture) {
    this.src = src;
  }
  setDest(dest: WebGLFramebuffer | null) {
    this.dest = dest;
  }
}
