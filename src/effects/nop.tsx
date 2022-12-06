import type { Component } from 'solid-js';

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
  const gl = canvas.getContext("webgl2")!;
  const context = gl;
  const program = context.createProgram()!;

  function prepareShader(type: number, source: string, context: WebGL2RenderingContext) {
    const shader = context.createShader(type)!;
    context.shaderSource(shader, source);
    context.compileShader(shader);
    if (!context.getShaderParameter(shader, context.COMPILE_STATUS)){
      console.log(context.getShaderInfoLog(shader)); //error
    }
    context.attachShader(program, shader);
  }

  prepareShader(gl.VERTEX_SHADER, vs, context);
  prepareShader(gl.FRAGMENT_SHADER, fs, context);

  context.linkProgram(program);
  if (!context.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(context.getProgramInfoLog(program)); //error
  }

  const vertexPositions = [[+1.0, +1.0], [+1.0, -1.0], [-1.0, -1.0], [-1.0, +1.0]];
  const vertexBuffer = context.createBuffer();
  context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
  context.bufferData(context.ARRAY_BUFFER, new Float32Array(vertexPositions.flat()), context.STATIC_DRAW);
  context.bindBuffer(context.ARRAY_BUFFER, null);

  const resolution = [props.src.width, props.src.height];

  function loadTexture(src: (HTMLCanvasElement | HTMLImageElement), texture: WebGLTexture, context: WebGL2RenderingContext) {
    context.bindTexture(gl.TEXTURE_2D, texture);
    context.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    context.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    context.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    context.generateMipmap(gl.TEXTURE_2D);
    context.bindTexture(gl.TEXTURE_2D, null);
  }

  var srcTexture = context.createTexture()!;
  loadTexture(props.src, srcTexture, context);

  function drawCall() {
    context.useProgram(program);
    /* vertex */
    context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
    const location = context.getAttribLocation(program, 'position');
    context.enableVertexAttribArray(location);
    context.vertexAttribPointer(location, vertexPositions[0].length, context.FLOAT, false, 0, 0);
    /* fragment */
    const resolutionLocation = context.getUniformLocation(program, "resolution");
    gl.uniform2fv(resolutionLocation, resolution);
    const srcLocation = context.getUniformLocation(program, "src");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTexture);
    gl.uniform1i(srcLocation, 0);
    /* draw call */
    context.drawArrays(context.TRIANGLE_FAN, 0, 4);
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
