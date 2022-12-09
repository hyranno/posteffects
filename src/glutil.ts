

export function loadTexture(src: (HTMLCanvasElement | HTMLImageElement), texture: WebGLTexture, context: WebGL2RenderingContext) {
  const gl = context;
  context.bindTexture(gl.TEXTURE_2D, texture);
  context.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  context.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  context.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  context.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  context.generateMipmap(gl.TEXTURE_2D);
  context.bindTexture(gl.TEXTURE_2D, null);
}

export function bindShader(
  canvas: HTMLCanvasElement, vs: string, fs: string
): [WebGL2RenderingContext, WebGLProgram] {
  const context = canvas.getContext("webgl2")!;
  const program = prepareProgram(context, vs, fs);
  return [context, program];
}

export function prepareProgram(
  context: WebGL2RenderingContext,
  vs: string, fs: string,
): WebGLProgram {
  const gl = context;
  const program = context.createProgram()!;
  prepareShader(program, gl.VERTEX_SHADER, vs, context);
  prepareShader(program, gl.FRAGMENT_SHADER, fs, context);
  context.linkProgram(program);
  if (!context.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(context.getProgramInfoLog(program)); //error
  }
  return program;
}

export function prepareShader(program: WebGLProgram, type: number, source: string, context: WebGL2RenderingContext) {
  const shader = context.createShader(type)!;
  context.shaderSource(shader, source);
  context.compileShader(shader);
  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)){
    console.log(context.getShaderInfoLog(shader)); //error
  }
  context.attachShader(program, shader);
}
