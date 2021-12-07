import { mat3 } from 'gl-matrix';

import { World } from '../world';
import MESH from '../../objects/mesh';
import { loadObj } from '../../obj-loader';
import { drawMesh } from '../../draw';
import { calculateOBB } from './mesh';

export const meshTest = (world: World) => {
  const collection = loadObj(MESH);
  const transform = mat3.create();
  const color = '#666666';
  const mesh = collection['Plane001'];

  const obb = calculateOBB(mesh);
  console.log(obb);

  drawMesh(mesh, transform, color);
};
