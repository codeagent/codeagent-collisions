export const vertex = `#version 300 es
layout(location = 0) in vec2 position;

uniform mat4 projMat;
uniform mat4 worldMat;

void main()
{
  gl_Position = projMat * worldMat * vec4(position, 0.0f, 1.0f);
}
`;

export const fragment = `#version 300 es
precision highp float;

layout(location = 0) out vec4 color;	

uniform vec4 albedo;

void main()
{
  color = albedo;
}
`;
