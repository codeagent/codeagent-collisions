import { vec2 } from 'gl-matrix';
import Container from 'typedi';

import {
  BLUISH_COLOR,
  drawContact,
  drawDot,
  drawLineSegment,
  LINE_COLOR,
  REDISH_COLOR,
} from '../../../draw';

import { World } from '../../dynamics';

import { ContactCandidate, ContactInfo } from '../contact';
import { MouseControl } from '../../utils/mouse-control';
import { NarrowPhaseInterface } from './narrow-phase.interface';

import { NARROW_PHASE } from '../../di';

const damping = 10;
let satNarrowPhase: NarrowPhaseInterface = null;

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
    satNarrowPhase = Container.of(world.settings.uid).get(NARROW_PHASE);
  }

  world.bodies.forEach((body) => {
    body.applyForce(
      vec2.fromValues(
        body.mass * -world.settings.gravity[0],
        body.mass * -world.settings.gravity[1]
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
