import { mat3, vec2 } from 'gl-matrix';

import { World } from '../../../dynamics';
import MESH from '../../../../objects/mesh';
import PINTBALL from '../../../../objects/pintball';
import PISTON from '../../../../objects/piston';
import { loadObj } from '../../../utils';
import { drawAABB, drawMesh, drawOBB, drawOBBTree } from '../../../../draw';
import {
  calculateOBB,
  generateOBBTree,
  MeshTriangle,
  OBBNode,
  testAABBOBB,
  testAABBOBBTree,
  AABB,
} from '../../shape';

const collection = loadObj(PINTBALL);
const mesh = collection['piece'];
const obb = calculateOBB(mesh);
// const tree = generateOBBTree(mesh);
const transform = mat3.create();

// console.log(tree);
const aabb: AABB = [vec2.create(), vec2.create()];

const nodes = new Set<OBBNode>();
export const meshTest = (world: World) => {
  // const body = world.bodies[3];
  // const shape = world.bodyShape.get(body);
  // shape.aabb(aabb, body.transform);

  drawMesh(mesh, transform, '#666666');
  // drawOBBTree(tree, 0);
  drawOBB(obb, '#ff0000');
  // drawAABB(aabb, '#ff0000');

  // const node = tree.children[0].children[1].children[1];
  // if (testAABBOBB(aabb, node.obb, node.obb.transform, node.obb.invTransform)) {
  //   drawOBB(node.obb, '#FF0000');
  // } else {
  //   drawOBB(node.obb, '#0000ff');
  // }

  // drawOBBTree(tree, -1, true);
  // if (testAABBOBBTree(nodes, aabb, tree, transform)) {
  //   for (const node of nodes) {
  //     drawOBB(node.obb, '#FF0000');
  //   }
  // }
};
