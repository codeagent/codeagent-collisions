import { mat3 } from 'gl-matrix';

import { World } from '../world';
import MESH from '../../objects/mesh';
import { loadObj } from '../../obj-loader';
import { clear, drawMesh, drawOBB } from '../../draw';
import { calculateOBB } from './mesh';

const collection = loadObj(MESH);
const obb = calculateOBB(collection['Plane001']);

export const meshTest = (world: World) => {
  const transform = mat3.create();
  const mesh = collection['Plane001'];

  drawOBB(obb, '#f5ad42');
  drawMesh(mesh, transform, '#666666');
};
