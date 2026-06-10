import * as THREE from 'three/webgpu';
import {
  attribute,
  positionGeometry,
  instanceIndex,
  time,
  float,
  vec3,
  mx_fractal_noise_float,
} from 'three/tsl';
import { atlasTexture } from '../atlasTexture';

const NOISE_SCALE = 0.2;
const NOISE_SPEED = 0.08;
const AMPLITUDE = 0.3;

export function createFogMaterial(
  _originalMaterial: THREE.Material | null,
  instanceOpacityNode: ReturnType<typeof attribute>
): THREE.MeshBasicNodeMaterial {
  const mat = new THREE.MeshBasicNodeMaterial();
  mat.map = atlasTexture;

  mat.transparent = true;
  // mat.depthWrite = false;
  mat.side = THREE.DoubleSide;
  mat.opacityNode = instanceOpacityNode;

  // positionNode runs before the instance matrix is applied, so modelWorldMatrix
  // does not carry per-instance translation here. Use instanceIndex instead:
  // scale it by large irrationals so every tile lands in a distinct region of
  // noise space with no visible periodicity.
  const idx = instanceIndex.toFloat();
  const phaseX = idx.mul(float(5.3871));
  const phaseZ = idx.mul(float(3.9271));

  const sampleX = positionGeometry.x
    .mul(float(NOISE_SCALE))
    .add(phaseX)
    .add(time.mul(float(NOISE_SPEED)));
  const sampleZ = positionGeometry.z
    .mul(float(NOISE_SCALE))
    .add(phaseZ)
    .add(time.mul(float(NOISE_SPEED)));

  // Three independent noise samples (offset seeds) → XYZ displacement
  const base = vec3(sampleX, float(0.0), sampleZ);
  const dispX = mx_fractal_noise_float(base, 4, 2.0, 0.5);
  const dispY = mx_fractal_noise_float(base.add(vec3(3.7, 0.0, 1.3)), 4, 2.0, 0.5);
  const dispZ = mx_fractal_noise_float(base.add(vec3(7.1, 0.0, 5.4)), 4, 2.0, 0.5);

  const displacement = vec3(dispX, dispY, dispZ).mul(float(AMPLITUDE));
  mat.positionNode = positionGeometry.add(displacement);

  return mat;
}
