import { vec2 } from 'gl-matrix';
import {
  BLUISH_COLOR,
  drawContact,
  drawDot,
  drawLineSegment,
  LINE_COLOR,
  REDISH_COLOR,
} from '../../../draw';

import { World } from '../../dynamics';
import { SatNarrowPhase } from './sat.narrow-phase';

import { ContactCandidate, ContactInfo } from '../contact';
import { MouseControl } from '../../utils/mouse-control';

const damping = 10;
let satNarrowPhase: SatNarrowPhase = null;

const drawContactPoints = (point0: vec2, point1: vec2, color = '#22FF22') => {
  drawDot(point0, BLUISH_COLOR);
  drawDot(point1, REDISH_COLOR);
  drawLineSegment([point0, point1], color);
};

const drawManifold = (manifold: ContactInfo[]) =>
  manifold.forEach((contact) =>
    drawContactPoints(contact.point0, contact.point1, LINE_COLOR)
  );

export const manifoldTest = (world: World, control: MouseControl) => {
  if (!satNarrowPhase) {
    satNarrowPhase = new SatNarrowPhase(world.registry);
  }

  world.bodies.forEach((body) => {
    body.applyForce(
      vec2.fromValues(
        body.mass * -world.gravity[0],
        body.mass * -world.gravity[1]
      )
    );
    body.applyForce(
      vec2.fromValues(damping * -body.velocity[0], damping * -body.velocity[1])
    );
    body.torque = -damping * body.omega;
  });

  const pairs: ContactCandidate[][] = [];
  for (let i = 0; i < world.bodies.length; i++) {
    for (let j = i + 1; j < world.bodies.length; j++) {
      const body0 = world.bodies[i];
      const body1 = world.bodies[j];
      pairs.push([
        new ContactCandidate(body0.collider, body0.collider.shape, null),
        new ContactCandidate(body1.collider, body1.collider.shape, null),
      ]);
    }
  }

  Array.from(satNarrowPhase.detectContacts(pairs as any)).forEach((c) =>
    drawContact(c)
  );
};
