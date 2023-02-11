import { vec2 } from 'gl-matrix';
import { Inject, Service } from 'typedi';

import { PairsRegistryInterface } from '../../dynamics';
import { Settings } from '../../settings';
import { pairId } from '../../utils';
import { ContactCandidatePair, ContactInfo } from '../contact';
import { Circle, Polygon } from '../shape';

import { distance, epa, mdv } from './gjk-epa';
import {
  getCircleCircleContactManifold,
  getPolyCircleContactManifold,
  getPolyPolyContactManifold,
} from './gjk-epa/manifold';
import { NarrowPhaseInterface } from './narrow-phase.interface';

@Service()
export class GjkEpaNarrowPhase implements NarrowPhaseInterface {
  private readonly mtv = vec2.create();

  private readonly simplex = new Set<vec2>();

  private readonly initialDir = vec2.create();

  constructor(
    @Inject('SETTINGS') private readonly settings: Readonly<Settings>,
    @Inject('PAIRS_REGISTRY')
    private readonly registry: PairsRegistryInterface
  ) {}

  *detectContacts(
    pairs: Iterable<ContactCandidatePair>
  ): Iterable<ContactInfo> {
    const contact: ContactInfo[] = [];

    for (const [left, right] of pairs) {
      const id = pairId(left.collider.id, right.collider.id);
      this.registry.updateTransform(id);
      const pair = this.registry.getPairById(id);

      contact.length = 0;
      this.simplex.clear();
      vec2.subtract(
        this.initialDir,
        left.collider.body.position,
        right.collider.body.position
      );

      const dist = distance(
        this.simplex,
        left.shape,
        right.shape,
        pair.spaceMapping,
        this.initialDir,
        -this.settings.narrowPhaseMargin,
        this.settings.gjkRelError,
        this.settings.gjkMaxIterations
      );

      if (dist < this.settings.epaEpsilon) {
        // inner shapes are intersect - crank a epa algorithm!

        this.simplex.clear();

        distance(
          this.simplex,
          left.shape,
          right.shape,
          pair.spaceMapping,
          this.initialDir,
          0,
          this.settings.gjkRelError,
          this.settings.gjkMaxIterations
        );

        epa(
          this.mtv,
          this.simplex,
          left.shape,
          right.shape,
          pair.spaceMapping,
          0,
          this.settings.epaEpsilon,
          this.settings.epaMaxIterations
        );

        vec2.negate(this.mtv, this.mtv);
      } else {
        const point0 = vec2.create();
        const point1 = vec2.create();

        mdv(this.mtv, this.simplex);

        pair.spaceMapping.toSecondVector(point1, this.mtv);
        right.shape.support(point1, point1);
        pair.spaceMapping.fromSecondPoint(point1, point1);

        vec2.negate(this.mtv, this.mtv);

        pair.spaceMapping.toFirstVector(point0, this.mtv);
        left.shape.support(point0, point0);
        pair.spaceMapping.fromFirstPoint(point0, point0);

        vec2.negate(this.mtv, this.mtv);

        const proj1 = vec2.dot(this.mtv, point1);
        const proj0 = vec2.dot(this.mtv, point0);

        // bodies are not intersecting
        if (proj0 >= proj1) {
          continue;
        }
      }

      //
      if (left.shape instanceof Polygon && right.shape instanceof Polygon) {
        yield* getPolyPolyContactManifold(
          contact,
          left.collider,
          left.shape,
          right.collider,
          right.shape,
          pair.spaceMapping,
          this.mtv
        );
      } else if (
        left.shape instanceof Polygon &&
        right.shape instanceof Circle
      ) {
        yield* getPolyCircleContactManifold(
          contact,
          left.collider,
          left.shape,
          right.collider,
          right.shape,
          pair.spaceMapping,
          this.mtv
        );
      } else if (
        left.shape instanceof Circle &&
        right.shape instanceof Polygon
      ) {
        yield* getPolyCircleContactManifold(
          contact,
          right.collider,
          right.shape,
          left.collider,
          left.shape,
          pair.spaceMapping.inverted(),
          vec2.fromValues(-this.mtv[0], -this.mtv[1])
        );
      } else if (
        left.shape instanceof Circle &&
        right.shape instanceof Circle
      ) {
        yield* getCircleCircleContactManifold(
          contact,
          right.collider,
          right.shape,
          left.collider,
          left.shape,
          pair.spaceMapping,
          this.mtv
        );
      }
    }
  }
}
