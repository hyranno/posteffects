import * as glutil from 'glutil';
import {DisplacementEffect} from 'effects/displacement';
import {DisplacementColorEffect} from 'effects/displacementColor';
import {BundledEffects} from 'effects/bundle';

import {DISPLACEMENT_SCALE_FACTOR} from 'effects/displacement';

class MapShader extends glutil.PostEffectShader {
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  translate: [number, number];
  constructor(
    context: WebGL2RenderingContext,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    translate: [number, number],
  ) {
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform vec2 translate;
      out vec4 outColor;
      void main(){
        outColor = vec4(translate / float(${DISPLACEMENT_SCALE_FACTOR}) + vec2(0.5), 0.0, 1.0);
      }
    `;
    super(context, fs);
    this.dest = dest;
    this.resolution = resolution;
    this.translate = translate;
  }

  override update(){
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.uniform2fv(this.context.getUniformLocation(this.program, "translate"), this.translate);

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}


export class TranslateEffect extends DisplacementEffect {
  map: MapShader;
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    translate: [number, number],
  ) {
    let mapTexture = glutil.createBufferTexture(context, resolution);
    let mapBuffer = glutil.bindNewFramebuffer(context, mapTexture);
    let map = new MapShader(context, mapBuffer, resolution, translate);
    super(context, src, dest, resolution, mapTexture, map);
    this.map = map;
  }
  setTranslate(translate: [number, number]) {
    this.map.translate = translate;
  }
}


export class TranslateColorEffect extends DisplacementColorEffect {
  map: [MapShader, MapShader, MapShader];
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    translate: [[number, number], [number, number], [number, number]],
  ) {
    let mapTexture = translate.map(
      _ => glutil.createBufferTexture(context, resolution)
    ) as [WebGLTexture, WebGLTexture, WebGLTexture];
    let map = translate.map((t, i) => new MapShader(
      context, glutil.bindNewFramebuffer(context, mapTexture[i]), resolution, t)
    ) as [MapShader, MapShader, MapShader];
    super(context, src, dest, resolution, mapTexture, new BundledEffects(context, map));
    this.map = map;
  }
  setTranslate(translate: [[number, number], [number, number], [number, number]]) {
    translate.forEach((t, i) => this.map[i].translate = t);
  }
}
