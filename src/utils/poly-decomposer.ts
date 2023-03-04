import { vec2 } from 'gl-matrix';

import { Mesh } from '../cd';
import { cross } from '../math';

export const getLoops = (mesh: Mesh): vec2[][] => {
  const lookup = new Map<string, [vec2, vec2]>();

  for (const triangle of mesh) {
    const edges: [vec2, vec2][] = [
      [triangle.p0, triangle.p1],
      [triangle.p1, triangle.p2],
      [triangle.p2, triangle.p0],
    ];

    for (const edge of edges) {
      const invId = `${vec2.str(edge[1])}-${vec2.str(edge[0])}`;

      if (lookup.has(invId)) {
        lookup.delete(invId);
      } else {
        const id = `${vec2.str(edge[0])}-${vec2.str(edge[1])}`;
        lookup.set(id, edge);
      }
    }
  }

  const loops: vec2[][] = [];
  let loop: vec2[] = null;

  while (lookup.size > 0) {
    if (loop === null) {
      for (const [id, edge] of lookup) {
        loop = [...edge];
        lookup.delete(id);
        break;
      }
    } else {
      let found = 0;

      for (const [id, edge] of lookup) {
        if (vec2.equals(loop[loop.length - 1], edge[0])) {
          loop.push(edge[1]);
          lookup.delete(id);
          found++;
        } else if (vec2.equals(edge[1], loop[0])) {
          loop.unshift(edge[0]);
          lookup.delete(id);
          found++;
        }

        if (found === 2) {
          break;
        }
      }

      if (found === 0) {
        loops.push(loop);
        loop = null;
      }
    }
  }

  if (loop) {
    loops.push(loop);
  }

  return loops;
};

export const isCCW = (loop: vec2[]): boolean => {
  let sum = 0;

  const length = loop.length;

  for (let i = 0; i < length; i++) {
    const p0 = loop[i];
    const p1 = loop[(i + 1) % length];

    sum += cross(p0, p1);
  }

  return sum > 0;
};
