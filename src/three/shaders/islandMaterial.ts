import * as THREE from 'three/webgpu';
import { positionWorld, mix, clamp, vec3, vec4, diffuseColor, attribute } from 'three/tsl';

// sRGB hex → linear
const _teal = new THREE.Color(0x008c74);
const TEAL_COLOR = vec3(_teal.r, _teal.g, _teal.b);

export function createIslandMaterial(
  originalMaterial: THREE.Material | null,
  instanceOpacityNode: ReturnType<typeof attribute>
): THREE.MeshBasicNodeMaterial {
  const mat = new THREE.MeshBasicNodeMaterial();

  // GLTF unlit materials (KHR_materials_unlit) produce MeshBasicMaterial, not
  // MeshStandardMaterial. Cast broadly — color, map, and vertexColors exist on all
  // mesh material types so we only copy what MeshBasicNodeMaterial actually uses.
  if (originalMaterial) {
    const orig = originalMaterial as THREE.MeshBasicMaterial;
    mat.color.copy(orig.color);
    mat.vertexColors = orig.vertexColors;
    if (orig.map) mat.map = orig.map;
  }

  // Use outputNode instead of colorNode so the full default pipeline runs first:
  // (material.color × texture(map) × vertexColors).
  // The gradient blend is then applied on top of that already-computed diffuseColor.
  const factor = clamp(positionWorld.y.negate().div(0.25), 0, 1);
  mat.outputNode = vec4(mix(diffuseColor.rgb, TEAL_COLOR, factor), diffuseColor.a);

  // opacityNode feeds into diffuseColor.a, so it is correctly forwarded via outputNode
  mat.opacityNode = instanceOpacityNode;
  mat.transparent = true;
  mat.depthWrite = true;
  mat.side = THREE.DoubleSide;

  return mat;
}
