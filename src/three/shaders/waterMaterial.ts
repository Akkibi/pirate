import * as THREE from 'three/webgpu';
import { positionWorld, time, mix, float, vec3, mx_worley_noise_float, attribute } from 'three/tsl';

const SCALE = 2;
const SPEED = 0.4;
const BASE_OPACITY = 0.45;

// sRGB hex → linear: WebGPU pipeline is linear; the renderer applies linearToSRGB at output
const _deep = new THREE.Color(0x008c74);
const _surface = new THREE.Color(0x00a680);
const DEEP_COLOR = vec3(_deep.r, _deep.g, _deep.b);
const SURFACE_COLOR = vec3(_surface.r, _surface.g, _surface.b);

export function createWaterMaterial(
  instanceOpacityNode: ReturnType<typeof attribute>
): THREE.MeshBasicNodeMaterial {
  const mat = new THREE.MeshBasicNodeMaterial();
  mat.transparent = true;
  mat.depthWrite = false;
  mat.side = THREE.DoubleSide;

  // World-space XZ as UV so the pattern is seamless across all instances,
  // shifted over time for a slow drift effect
  const worldXZ = positionWorld.xz.mul(float(SCALE)).add(time.mul(float(SPEED)));
  const worley = mx_worley_noise_float(worldXZ, 0.85);

  mat.colorNode = mix(DEEP_COLOR, SURFACE_COLOR, worley);
  mat.opacityNode = instanceOpacityNode.mul(float(BASE_OPACITY));

  return mat;
}
