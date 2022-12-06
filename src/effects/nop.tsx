import type { Component } from 'solid-js';
import * as glutil from 'glutil';

const Nop: Component<{
  src: (HTMLCanvasElement | HTMLImageElement),
}> = (props) => {
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
    out vec4 outColor;
    void main(){
      vec2 uv = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y) / resolution;
      //outColor = vec4(uv, 0, 1);
      outColor = texture(src, uv);
    }
  `
  const canvas = document.createElement("canvas")!;
  canvas.width = props.src.width;
  canvas.height = props.src.height;
  const [context, program] = glutil.bindShader(canvas, vs, fs);
  const gl = context;

  const vertexPositions = [[+1.0, +1.0], [+1.0, -1.0], [-1.0, -1.0], [-1.0, +1.0]];
  const vertexBuffer = context.createBuffer();
  context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
  context.bufferData(context.ARRAY_BUFFER, new Float32Array(vertexPositions.flat()), context.STATIC_DRAW);
  context.bindBuffer(context.ARRAY_BUFFER, null);

  const srcTexture = context.createTexture()!;
  glutil.loadTexture(props.src, srcTexture, context);

  function drawCall() {
    context.useProgram(program);
    /* vertex */
    context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
    const location = context.getAttribLocation(program, 'position');
    context.enableVertexAttribArray(location);
    context.vertexAttribPointer(location, 2, context.FLOAT, false, 0, 0);
    /* fragment */
    const resolution = [props.src.width, props.src.height];
    const resolutionLocation = context.getUniformLocation(program, "resolution");
    gl.uniform2fv(resolutionLocation, resolution);
    const srcLocation = context.getUniformLocation(program, "src");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTexture);
    gl.uniform1i(srcLocation, 0);
    /* draw call */
    context.drawArrays(context.TRIANGLE_FAN, 0, 4);
    /* unbind */
    context.bindBuffer(context.ARRAY_BUFFER, null);
    context.bindTexture(gl.TEXTURE_2D, null);
  }
  drawCall();

  return (
    <div>
      {canvas}
    </div>
  );
};

export default Nop;
