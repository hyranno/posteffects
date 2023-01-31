import * as glutil from 'glutil';
import {Random} from 'reliable-random';

export class MosaicShader extends glutil.PostEffectShader {
  src: WebGLTexture;
  dest: WebGLFramebuffer | null;
  resolution: [number, number];
  tileSize: [number, number];
  seed: number;
  samplingPoints: [number, number][];
  constructor(
    context: WebGL2RenderingContext,
    src: WebGLTexture,
    dest: WebGLFramebuffer | null,
    resolution: [number, number],
    tileSize: [number, number],
    seed: number,
    numSamples: number,
  ) {
    const fs = `#version 300 es
      precision mediump float;
      uniform vec2 resolution;
      uniform sampler2D src;
      uniform int numSamples;
      uniform vec2[128] samplingPoints;
      uniform vec2 tileSize;
      out vec4 outColor;
      void main(){
        vec4 res = vec4(0);
        vec2 origin = floor(gl_FragCoord.xy / tileSize) * tileSize;
        for (int i=0; i<numSamples; i++) {
          vec2 coord = origin + samplingPoints[i];
          vec2 uv = coord / resolution;
          res += texture(src, uv);
        }
        outColor = res / float(numSamples);
      }
    `;
    super(context, fs);
    this.src = src;
    this.dest = dest;
    this.resolution = resolution;
    this.tileSize = tileSize;
    this.seed = seed;
    this.samplingPoints = this.generateSamplePositions(numSamples);
  }

  override update(){
    let gl = this.context;
    this.context.useProgram(this.program);
    this.bindVertex();

    this.context.uniform2fv(this.context.getUniformLocation(this.program, "resolution"), this.resolution);
    this.context.activeTexture(gl.TEXTURE0);
    this.context.bindTexture(gl.TEXTURE_2D, this.src);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "src"), 0);
    this.context.uniform1i(this.context.getUniformLocation(this.program, "numSamples"), this.samplingPoints.length);
    this.samplingPoints.forEach((v,i) =>
      this.context.uniform2fv(this.context.getUniformLocation(this.program, "samplingPoints["+i+"]"), v)
    );
    this.context.uniform2fv(this.context.getUniformLocation(this.program, "tileSize"), this.tileSize);

    this.context.bindFramebuffer(gl.FRAMEBUFFER, this.dest);
    this.context.drawArrays(this.context.TRIANGLE_FAN, 0, 4);

    /* unbind */
    this.context.bindBuffer(gl.ARRAY_BUFFER, null);
    this.context.bindTexture(gl.TEXTURE_2D, null);
  }

  generateSamplePositions(numSamples: number): [number, number][] {
    let rand = new Random(this.seed, 0);
    return Array.from(new Array(numSamples), _=>
      this.tileSize.map(size => rand.random() * size)
    ) as [number, number][];
  }
  setTileSize(size: [number, number]) {
    this.tileSize = size;
    this.samplingPoints = this.generateSamplePositions(this.samplingPoints.length);
  }
  setSeed(value: number) {
    this.seed = value;
    this.samplingPoints = this.generateSamplePositions(this.samplingPoints.length);
  }
  setNumSamples(value: number) {
    this.samplingPoints = this.generateSamplePositions(value);
  }
}
