import * as THREE from 'three/webgpu';
import { positionWorld, mix, clamp, vec3, vec4, diffuseColor } from 'three/tsl';
import { atlasTexture } from '../atlasTexture';

const _teal = new THREE.Color(0x008c74);
const TEAL_COLOR = vec3(_teal.r, _teal.g, _teal.b);

export interface AtlasMaterialOptions {
  side?: THREE.Side;
  transparent?: boolean;
  depthWrite?: boolean;
}

export function createAtlasMaterial(
  options: AtlasMaterialOptions = {}
): THREE.MeshBasicNodeMaterial {
  const mat = new THREE.MeshBasicNodeMaterial();

  mat.map = atlasTexture;
  mat.side = options.side ?? THREE.FrontSide;
  mat.transparent = options.transparent ?? false;
  mat.depthWrite = options.depthWrite ?? true;

  const factor = clamp(positionWorld.y.negate().div(0.25), 0, 1);
  mat.outputNode = vec4(mix(diffuseColor.rgb, TEAL_COLOR, factor), diffuseColor.a);

  return mat;
}
