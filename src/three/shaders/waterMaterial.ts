import * as THREE from 'three/webgpu';
import { float, attribute } from 'three/tsl';
import { BASE_OPACITY, createWaterColorNode } from './waterBase';

export function createWaterMaterial(
  instanceOpacityNode: ReturnType<typeof attribute>
): THREE.MeshBasicNodeMaterial {
  const mat = new THREE.MeshBasicNodeMaterial();
  mat.transparent = true;
  mat.depthWrite = false;
  mat.side = THREE.DoubleSide;

  mat.colorNode = createWaterColorNode();
  mat.opacityNode = instanceOpacityNode.mul(float(BASE_OPACITY));

  return mat;
}
