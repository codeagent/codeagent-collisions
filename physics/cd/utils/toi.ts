import { mat3, vec2 } from 'gl-matrix';

import { Body } from '../../dynamics';
import { betweenPair } from '../../math';
import * as gjk from '../narrow-phase/gjk-epa';
import { Shape } from '../shape';

class BodyProxy {
  public shape: Shape;
  public readonly transform = mat3.create();
  public readonly position = vec2.create();
  public readonly velocity = vec2.create();
  public angle = 0.0;
  public omega = 0.0;

  advance(dt: number): void {
    vec2.scaleAndAdd(this.position, this.position, this.velocity, dt);
    this.angle += this.omega * dt;
    this.updateTransform();
  }

  public wrap(body: Readonly<Body>) {
    this.shape = body.collider.shape;

    vec2.copy(this.position, body.position);
    this.angle = body.angle;

    vec2.copy(this.velocity, body.velocity);
    this.omega = body.omega;

    this.updateTransform();
  }

  private updateTransform() {
    mat3.fromTranslation(this.transform, this.position);
    mat3.rotate(this.transform, this.transform, this.angle);
  }
}

const initialDir = vec2.create();
const simplex = new Set<vec2>();
const spacesMapping = betweenPair(mat3.create(), mat3.create());
const proxy0 = new BodyProxy();
const proxy1 = new BodyProxy();
const toiPenetration = 5.0e-2;

const distance = (
  distance: vec2,
  proxy0: Readonly<BodyProxy>,
  proxy1: Readonly<BodyProxy>
): number => {
  vec2.subtract(initialDir, proxy1.position, proxy0.position);
  spacesMapping.update(proxy0.transform, proxy1.transform);
  simplex.clear();

  const dist = gjk.distance(
    simplex,
    proxy0.shape,
    proxy1.shape,
    spacesMapping,
    initialDir,
    -toiPenetration
  );

  if (dist === 0) {
    return 0;
  }

  gjk.mdv(distance, simplex);
  vec2.normalize(distance, distance);

  return dist;
};

const d = vec2.create();
const v = vec2.create();

/**
 * Get time of inpact for two moving bodies.
 *
 * @param body0 First body to test against
 * @param r0 maximal radius of the shape of dynamic body (the maximal distance from centriod to boundary)
 * @param body1 Second body to test against
 * @param r1 maximal radius of the shape of dynamic body (the maximal distance from centriod to boundary)
 * @param interval time interval inside witch result should be found. Estimates in seconds.
 * @param epsilon numerical proximity
 * @returns value between [0-1]. 1 indicates no collisions in given interval
 */
export const getToi = (
  body0: Body,
  r0: number,
  body1: Body,
  r1: number,
  interval: number,
  epsilon = 1.0e-3,
  maxIterations = 8
): number => {
  proxy0.wrap(body0);
  proxy1.wrap(body1);

  let t = 0;
  let dist = Number.POSITIVE_INFINITY;

  vec2.subtract(v, proxy1.velocity, proxy0.velocity);
  const angular = Math.abs(proxy0.omega) * r0 + Math.abs(proxy1.omega) * r1;

  do {
    dist = distance(d, proxy0, proxy1);

    // maximal possible projection of relative velocity onto d-direction
    const speed = vec2.dot(v, d) + angular;

    // bodies are recede from each other - early exit
    if (speed <= 0.0) {
      return 1.0;
    }

    const dt = dist / speed;

    if (!Number.isFinite(dt)) {
      debugger;
    }

    proxy0.advance(dt);
    proxy1.advance(dt);

    t += dt;
  } while (dist >= epsilon && t < interval && t >= 0 && --maxIterations);

  t = Math.min(interval, Math.max(0, t));
  return t / interval;
};
