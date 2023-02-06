export const vertex = `#version 300 es
layout(location = 0) in vec2 position;
layout(location = 1) in vec4 color;

uniform mat4 projMat;
uniform mat4 worldMat;

out vec4 _color;

void main()
{
  gl_Position =  projMat * worldMat * vec4(position, 0.0f, 1.0f);
  _color = color;
}
`;

export const fragment = `#version 300 es
precision highp float;

layout(location = 0) out vec4 color;	

in vec4 _color;

void main()
{
  color = _color;
}
`;
