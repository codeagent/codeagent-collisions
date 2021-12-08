import { mat3 } from 'gl-matrix';

import { World } from '../world';
import MESH from '../../objects/mesh';
import { loadObj } from '../../obj-loader';
import { drawMesh, drawOBB } from '../../draw';
import { calculateOBB } from './mesh';

const collection = loadObj(MESH);
const mesh = collection['Plane001'];
const obb = calculateOBB(mesh);
const transform = mat3.create();

export const meshTest = (world: World) => {
  drawMesh(mesh, transform, '#666666');
  drawOBB(obb, '#ff0000');
};
