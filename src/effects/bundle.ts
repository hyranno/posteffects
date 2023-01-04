import * as glutil from 'glutil';

export class BundledEffects extends glutil.GlEffect {
  effects: glutil.GlEffect[];
  constructor(
    context: WebGL2RenderingContext,
    effects: glutil.GlEffect[],
  ) {
    super(context);
    this.effects = effects;
  }

  override update() {
    this.effects.forEach(e => e.update());
  }
}
