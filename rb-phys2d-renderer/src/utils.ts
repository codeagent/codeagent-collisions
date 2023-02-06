import { mat3, mat4, vec4 } from 'gl-matrix';

export const ortho = (
  projection: mat3,
  left: number,
  right: number,
  bottom: number,
  top: number
): mat3 => {
  const tx = (right + left) / (right - left);
  const ty = (top + bottom) / (top - bottom);

  return mat3.set(
    projection,
    2.0 / (right - left),
    0,
    0,
    0,
    2.0 / (top - bottom),
    0,
    tx,
    ty,
    1.0
  );
};

export const toMat4 = (out: mat4, m: Readonly<mat3>): mat4 => {
  out.fill(0.0);

  out[0] = m[0];
  out[1] = m[1];

  out[4] = m[3];
  out[5] = m[4];

  out[12] = m[6];
  out[13] = m[7];
  out[15] = m[8];

  return out;
};

const HEX_COLOR_REGEXPR = /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i;

export const fromHexColor = (out: vec4, color: string): vec4 => {
  const [, r, g, b] = color.match(HEX_COLOR_REGEXPR);
  return vec4.set(
    out,
    parseInt(r, 16) / 255,
    parseInt(g, 16) / 255,
    parseInt(b, 16) / 255,
    1.0
  );
};

export const isTouchDevice = (): boolean => 'ontouchstart' in self;
