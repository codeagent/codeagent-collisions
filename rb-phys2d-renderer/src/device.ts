import { mat4, vec4 } from 'gl-matrix';

export interface VertexAttribute {
  semantics: string;
  slot: number;
  size: number;
  type: GLenum;
  offset: number;
  stride: number;
}

export interface Geometry {
  vao: WebGLVertexArrayObject;
  vbo: WebGLBuffer;
  ebo: WebGLBuffer;
  length: number;
  type: GLenum;
}

export interface GeometryData {
  vertexFormat: VertexAttribute[];
  vertexData: ArrayBufferView;
  indexData: Uint16Array;
}

interface Vec4 {
  type: 'vec4';
  name: string;
  value: vec4;
}

interface Mat4 {
  type: 'mat4';
  name: string;
  value: mat4;
}

export type ProgramVariable = Vec4 | Mat4;

export class Device {
  constructor(public readonly gl: Readonly<WebGL2RenderingContext>) {
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    this.gl.lineWidth(1);
    this.gl.disable(WebGL2RenderingContext.DEPTH_TEST);
    this.gl.disable(WebGL2RenderingContext.CULL_FACE);
    this.gl.disable(WebGL2RenderingContext.BLEND);
    this.gl.blendFunc(
      WebGL2RenderingContext.SRC_ALPHA,
      WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA
    );
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  clear(): void {
    this.gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);
  }

  clearColor(color: Readonly<vec4>): void {
    this.gl.clearColor(color[0], color[1], color[2], color[3]);
  }

  createGeometry(
    def: GeometryData,
    type: GLenum = WebGL2RenderingContext.LINES
  ): Geometry {
    const vBuffer = this.createVertexBuffer(def.vertexData);
    const iBuffer = this.createIndexBuffer(def.indexData);

    const vao = this.gl.createVertexArray();

    this.gl.bindVertexArray(vao);

    for (const attribute of def.vertexFormat) {
      this.gl.enableVertexAttribArray(attribute.slot);
      this.gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, vBuffer);

      if (attribute.type === WebGL2RenderingContext.FLOAT) {
        this.gl.vertexAttribPointer(
          attribute.slot,
          attribute.size,
          attribute.type,
          false,
          attribute.stride,
          attribute.offset
        );
      } else {
        this.gl.vertexAttribIPointer(
          attribute.slot,
          attribute.size,
          attribute.type,
          attribute.stride,
          attribute.offset
        );
      }
    }
    this.gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, iBuffer);
    this.gl.bindVertexArray(null);
    return {
      vao,
      vbo: vBuffer,
      ebo: iBuffer,
      length: def.indexData.length,
      type,
    };
  }

  createShader(vs: string, fs: string): WebGLProgram {
    const program = this.gl.createProgram();

    let shaders: WebGLShader[] = [];
    try {
      for (const shader of [
        { type: WebGL2RenderingContext.VERTEX_SHADER, sourceCode: vs },
        { type: WebGL2RenderingContext.FRAGMENT_SHADER, sourceCode: fs },
      ]) {
        const shaderObject = this.gl.createShader(shader.type);
        this.gl.shaderSource(shaderObject, shader.sourceCode);
        this.gl.compileShader(shaderObject);
        if (
          !this.gl.getShaderParameter(
            shaderObject,
            WebGL2RenderingContext.COMPILE_STATUS
          )
        ) {
          const errorLog = this.gl.getShaderInfoLog(shaderObject);
          const shaderType =
            shader.type === WebGL2RenderingContext.VERTEX_SHADER
              ? 'Vertex'
              : 'Fragment';

          throw new Error(
            `${shaderType} shader compile error: '${errorLog}' \n${shader.sourceCode}\n`
          );
        }
        this.gl.attachShader(program, shaderObject);
        shaders.push(shaderObject);
      }

      this.gl.linkProgram(program);
      if (
        !this.gl.getProgramParameter(
          program,
          WebGL2RenderingContext.LINK_STATUS
        )
      ) {
        const errorLog = this.gl.getProgramInfoLog(program);

        throw new Error(
          `Unable to initialize the shader program: '${errorLog}'`
        );
      }
    } catch (e) {
      shaders.forEach(shader => this.gl.deleteShader(shader));
      this.gl.deleteProgram(program);
      throw e;
    }

    return program;
  }

  useProgram(program: WebGLProgram): void {
    this.gl.useProgram(program);
  }

  setProgramVariable(
    program: WebGLProgram,
    name: string,
    type: 'vec4',
    value: vec4
  ): void;
  setProgramVariable(
    program: WebGLProgram,
    name: string,
    type: 'mat4',
    value: mat4
  ): void;
  setProgramVariable(
    program: WebGLProgram,
    name: string,
    type: string,
    value: any
  ): void {
    const loc = this.gl.getUniformLocation(program, name);

    if (loc) {
      if (type === 'vec4') {
        this.gl.uniform4fv(loc, value);
      } else if (type === 'mat4') {
        this.gl.uniformMatrix4fv(loc, false, value);
      }
    }
  }

  drawGeometry(geometry: Geometry) {
    this.gl.bindVertexArray(geometry.vao);
    this.gl.bindBuffer(
      WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER,
      geometry.ebo
    );
    this.gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, geometry.vbo);

    this.gl.drawElements(
      geometry.type ?? WebGL2RenderingContext.TRIANGLES,
      geometry.length,
      WebGL2RenderingContext.UNSIGNED_SHORT,
      0
    );
  }

  destroyProgram(program: WebGLProgram): void {
    this.gl.deleteProgram(program);
  }

  destroyGeometry(geometry: Geometry): void {
    this.gl.deleteBuffer(geometry.ebo);
    this.gl.deleteBuffer(geometry.vbo);
    this.gl.deleteVertexArray(geometry.vao);
  }

  createVertexBuffer(data: ArrayBufferView): WebGLBuffer {
    const vbo = this.gl.createBuffer();
    this.gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, vbo);
    this.gl.bufferData(
      WebGL2RenderingContext.ARRAY_BUFFER,
      data,
      WebGL2RenderingContext.STATIC_DRAW
    );
    this.gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, null);
    return vbo;
  }

  createIndexBuffer(data: ArrayBufferView): WebGLBuffer {
    const ebo = this.gl.createBuffer();
    this.gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, ebo);
    this.gl.bufferData(
      WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER,
      data,
      WebGL2RenderingContext.STATIC_DRAW
    );
    this.gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, null);
    return ebo;
  }
}
