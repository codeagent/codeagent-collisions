import { mat3, vec2 } from 'gl-matrix';

import { AABB } from '../aabb';
import {
  generateOBBTree,
  getMeshCentroid,
  getMeshItertia,
  Mesh,
  MeshOBBNode,
} from './utils';

import { AABBBounded, TestTarget, MassDistribution } from '../shape.interface';

export class MeshShape implements TestTarget, AABBBounded, MassDistribution {
  private readonly triangles = new Array<TestTarget>();
  private readonly points = new Set<vec2>();
  readonly obbTree: MeshOBBNode;

  constructor(readonly mesh: Mesh, transformOrigin: boolean = true) {
    if (transformOrigin) {
      this.mesh = this.transformOriginToCentroid(this.mesh);
    }
    this.obbTree = generateOBBTree(this.mesh);
    this.getLeafs();
    this.getVertices();
  }

  testPoint(point: vec2): boolean {
    return this.triangles.some((shape) => shape.testPoint(point));
  }

  aabb(out: AABB, transform: mat3): AABB {
    const v = vec2.create();

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const p of this.points) {
      vec2.transformMat3(v, p, transform);

      if (v[0] < minX) {
        minX = v[0];
      }
      if (v[1] < minY) {
        minY = v[1];
      }
      if (v[0] > maxX) {
        maxX = v[0];
      }
      if (v[1] > maxY) {
        maxY = v[1];
      }
    }

    vec2.set(out[0], minX, minY);
    vec2.set(out[1], maxX, maxY);

    return out;
  }

  inetria(mass: number): number {
    return getMeshItertia(this.mesh, mass);
  }

  private getLeafs() {
    const q = [this.obbTree];

    while (q.length) {
      const { payload, children } = q.pop();

      if (payload) {
        this.triangles.push(payload.triangleShape);
      }

      for (const child of children) {
        q.push(child);
      }
    }
  }

  private getVertices() {
    for (const triangle of this.mesh) {
      this.points.add(triangle.p0);
      this.points.add(triangle.p1);
      this.points.add(triangle.p2);
    }
  }

  private transformOriginToCentroid(mesh: Mesh): Mesh {
    const shift = getMeshCentroid(mesh);
    return mesh.map((triangle) => ({
      p0: vec2.subtract(vec2.create(), triangle.p0, shift),
      p1: vec2.subtract(vec2.create(), triangle.p1, shift),
      p2: vec2.subtract(vec2.create(), triangle.p2, shift),
    }));
  }
}
