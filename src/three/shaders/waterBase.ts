import * as THREE from 'three/webgpu';
import {
  positionWorld,
  time,
  mix,
  float,
  vec3,
  mx_worley_noise_float,
  floor,
  mod,
} from 'three/tsl';

export const WATER_SCALE = 2;
export const WATER_SPEED = 0.4;
export const BASE_OPACITY = 0.45;
export const CHESS_DARKEN = 0.12;

const _deep = new THREE.Color(0x008c74);
const _surface = new THREE.Color(0x00a680);
export const DEEP_COLOR = vec3(_deep.r, _deep.g, _deep.b);
export const SURFACE_COLOR = vec3(_surface.r, _surface.g, _surface.b);

export function createWaterColorNode() {
  const worldXZ = positionWorld.xz.mul(float(WATER_SCALE)).add(time.mul(float(WATER_SPEED)));
  const worley = mx_worley_noise_float(worldXZ, 0.85);
  const chess = mod(
    floor(positionWorld.x.add(0.5)).add(floor(positionWorld.z.add(0.5))),
    float(2.0)
  );
  return mix(DEEP_COLOR, SURFACE_COLOR, worley).mul(float(1.0).sub(chess.mul(float(CHESS_DARKEN))));
}
