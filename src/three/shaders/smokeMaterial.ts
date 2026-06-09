import * as THREE from 'three/webgpu';
import {
  positionWorld,
  diffuseColor,
  time,
  float,
  vec3,
  vec4,
  mix,
  clamp,
  mx_fractal_noise_float,
} from 'three/tsl';

const NOISE_SCALE = 0.2;
const NOISE_SPEED_X = 0.4;
const NOISE_SPEED_Z = 0.25;
const SMOKE_MIN = 0.05;
const SMOKE_MAX = 0.5;

const _smokeColor = new THREE.Color(0x303535);
const SMOKE_COLOR = vec3(_smokeColor.r, _smokeColor.g, _smokeColor.b);

export function createSmokeMaterial(
  originalMaterial: THREE.Material | null
): THREE.MeshBasicNodeMaterial {
  const mat = new THREE.MeshBasicNodeMaterial();

  if (originalMaterial) {
    const orig = originalMaterial as THREE.MeshBasicMaterial;
    mat.color.copy(orig.color);
    mat.vertexColors = orig.vertexColors;
    if (orig.map) mat.map = orig.map;
  }

  const samplePos = vec3(
    positionWorld.x.mul(float(NOISE_SCALE)).add(time.mul(float(NOISE_SPEED_X))),
    positionWorld.y.mul(float(NOISE_SCALE * 0.5)),
    positionWorld.z.mul(float(NOISE_SCALE)).add(time.mul(float(NOISE_SPEED_Z)))
  );

  const noise = mx_fractal_noise_float(samplePos, 4, 2.0, 0.5);
  // remap [-1,1] noise to [SMOKE_MIN, SMOKE_MAX] blend factor
  const smokeFactor = clamp(
    noise
      // .mul(float(0.5))
      // .add(float(0.5))
      .mul(float(SMOKE_MAX - SMOKE_MIN))
      .add(float(SMOKE_MIN)),
    SMOKE_MIN,
    SMOKE_MAX
  );

  mat.outputNode = vec4(
    mix(diffuseColor.rgb.mul(float(0.9)), SMOKE_COLOR, smokeFactor),
    diffuseColor.a
  );

  mat.transparent = false;
  mat.depthWrite = true;
  mat.side = THREE.DoubleSide;

  return mat;
}
