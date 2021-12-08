import { mat3 } from 'gl-matrix';

import { World } from '../world';
import MESH from '../../objects/mesh';
import { loadObj } from '../../obj-loader';
import { drawMesh, drawOBB, drawOBBTree } from '../../draw';
import { calculateOBB, generateOBBTree  } from './mesh';

const collection = loadObj(MESH);
const mesh = collection['Plane001'];
const tree = generateOBBTree(mesh);
const transform = mat3.create();


console.log(tree.children[1].children[1].children[0].children[1].children[0]);
export const meshTest = (world: World) => {
  drawMesh(mesh, transform, '#666666');
  // drawOBB(tree.obb, '#f5ad42')

  // drawOBB(tree.children[1].obb, '#f5ad42')
  // drawOBB(tree.children[1].children[0].obb, '#f5ad42')
  // drawOBB(tree.children[1].children[1].obb, '#f5ad42')
  // drawOBB(tree.children[1].children[1].children[0].children[0].obb, '#f5ad42')
  // drawOBB(tree.children[1].children[1].children[0].children[1].obb, '#f5ad42')
  // drawOBB(tree.children[1].children[1].children[1].obb, '#f5ad42')

  drawOBBTree(tree, 4);
};
