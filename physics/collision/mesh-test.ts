import { World } from '../world';

import MESH from '../../objects/mesh';
import { loadObj } from '../../obj-loader';
import { drawMesh } from '../../draw';
import { mat3 } from 'gl-matrix';

export const meshTest = (world: World) => {
  const collection = loadObj(MESH);
  const transform = mat3.create();
  const color = '#666666';

  drawMesh(collection['Plane001'], transform, color);
};
