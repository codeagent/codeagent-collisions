import { mat3 } from 'gl-matrix';

import { World } from '../world';
import MESH from '../../objects/mesh';
import { loadObj } from '../../obj-loader';
import { drawMesh, drawOBBTree } from '../../draw';
import { generateOBBTree } from './mesh';

const collection = loadObj(MESH);
const mesh = collection['Plane001'];
const tree = generateOBBTree(mesh);
const transform = mat3.create();

console.log(tree);
export const meshTest = (world: World) => {
  drawMesh(mesh, transform, '#666666');
  drawOBBTree(tree, 3);
};
