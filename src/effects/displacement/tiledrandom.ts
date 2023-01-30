import * as glutil from 'glutil';
import {DisplacementColorEffect} from 'effects/displacementColor';
import {BundledEffects} from 'effects/bundle';

import {DISPLACEMENT_SCALE_FACTOR} from 'effects/displacement';

class MapShader extends glutil.PostEffectShader {
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  tilesize: [number, number];
  strength: [number, number];
  salts: [number, number];
  constructor(
    context: WebGL2RenderingContext,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    tilesize: [number, number],
    strength: [number, number],
    salts: [number, number],
  ) {
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform vec2 tilesize;
      uniform vec2 strength;
      uniform vec2 salts;
      out vec4 outColor;
      float hash(vec2 p, float salt) {
        float phase = 321.47 * salt + mod(dot(p, vec2(564.459, 893.109)), 951.54);
        return fract(4643.4649 * cos(phase));
      }
      vec2 box_mullar(vec2 r) {
        float amp = sqrt(-2.0*log(max(0.00001, r.x)));
        float phase = 2.0*radians(180.0) * r.y;
        return  amp * vec2(cos(phase), sin(phase));
      }
      void main(){
        vec2 p = floor(gl_FragCoord.xy / tilesize);
        vec2 unirand = vec2(hash(p, salts.x), hash(p, salts.y));
        vec2 val = box_mullar(unirand);
        outColor = vec4(val * strength / float(${DISPLACEMENT_SCALE_FACTOR}) + vec2(0.5), 0.0, 1.0);
      }
    `;
    super(context, fs);
    this.dest = dest;
    this.resolution = resolution;
    this.tilesize = tilesize;
    this.strength = strength;
    this.salts = salts;
  }

  override update(){
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.uniform2fv(this.context.getUniformLocation(this.program, "tilesize"), this.tilesize);
    this.context.uniform2fv(this.context.getUniformLocation(this.program, "strength"), this.strength);
    this.context.uniform2fv(this.context.getUniformLocation(this.program, "salts"), this.salts);

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}


export class TiledRandomEffect extends DisplacementColorEffect {
  map: [MapShader, MapShader, MapShader];
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    tilesize: [number, number],
    strength: [[number, number], [number, number], [number, number]],
    salt: [[number, number], [number, number], [number, number]],
  ) {
    let mapTexture = strength.map(
      _ => glutil.createBufferTexture(context, resolution)
    ) as [WebGLTexture, WebGLTexture, WebGLTexture];
    let map = mapTexture.map((tex, i) => new MapShader(
      context, glutil.bindNewFramebuffer(context, tex), resolution,
      tilesize, strength[i], salt[i]
    )) as [MapShader, MapShader, MapShader];
    super(context, src, dest, resolution, mapTexture, new BundledEffects(context, map));
    this.map = map;
  }
  setTileSize(value: [number, number]) {
    this.map.forEach(map => map.tilesize = value);
  }
  setStrength(value: [[number, number], [number, number], [number, number]]) {
    this.map.forEach((map, i) => map.strength = value[i]);
  }
  setSalt(value: [[number, number], [number, number], [number, number]]) {
    this.map.forEach((map, i) => map.salts = value[i]);
  }
}
