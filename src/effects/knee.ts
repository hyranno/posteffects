import * as glutil from 'glutil';

export function knee(
  context: WebGL2RenderingContext,
  src: WebGLTexture,
  resolution: [number, number],
  threshold: number,
) {
  const vs = `#version 300 es
    in vec2 position;
    void main(void) {
      gl_Position = vec4(position, 0, 1);
    }
  `;
  const fs = `#version 300 es
    precision mediump float;
    uniform vec2 resolution;
    uniform sampler2D src;
    uniform float threshold;
    out vec4 outColor;
    float knee(float x, float t) {
      return max(x - t, 0.0) / max(x, 0.0001);
    }
    void main(){
      vec2 uv = gl_FragCoord.xy / resolution;
      vec4 color = texture(src, uv);
      float safeThreshold = clamp(threshold, 0.0, 0.999999);
      float normalizer = 1.0 / knee(1.0, safeThreshold);
      float srcBrightness = max(max(max(color.x, color.y), color.z), 0.0001);
      float destBrightness = knee(srcBrightness, safeThreshold) * normalizer;
      outColor = clamp(vec4(color.xyz * destBrightness / srcBrightness, color.w), 0.0, 1.0);
    }
  `
  let gl = context;
  let program = glutil.prepareProgram(context, vs, fs);

  const vertexPositions = [[+1.0, +1.0], [+1.0, -1.0], [-1.0, -1.0], [-1.0, +1.0]];
  const vertexBuffer = context.createBuffer();
  context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
  context.bufferData(context.ARRAY_BUFFER, new Float32Array(vertexPositions.flat()), context.STATIC_DRAW);
  context.bindBuffer(context.ARRAY_BUFFER, null);

  context.useProgram(program);
  /* vertex */
  context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
  const location = context.getAttribLocation(program, 'position');
  context.enableVertexAttribArray(location);
  context.vertexAttribPointer(location, 2, context.FLOAT, false, 0, 0);
  /* fragment */
  gl.uniform2fv(context.getUniformLocation(program, "resolution"), resolution);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, src);
  gl.uniform1i(context.getUniformLocation(program, "src"), 0);
  gl.uniform1f(context.getUniformLocation(program, "threshold"), threshold);

  context.drawArrays(context.TRIANGLE_FAN, 0, 4);

  /* unbind */
  context.bindBuffer(context.ARRAY_BUFFER, null);
  context.bindTexture(gl.TEXTURE_2D, null);
}
