import * as THREE from 'three/webgpu';
import {
  positionWorld,
  time,
  mix,
  float,
  vec3,
  mx_worley_noise_float,
  mx_noise_vec3,
  mx_fractal_noise_float,
  floor,
  mod,
} from 'three/tsl';

export const WATER_SCALE = 2;
export const WATER_SPEED = 0.4;
const NOISE_SPEED = 0.08;
export const BASE_OPACITY = 0.45;
export const CHESS_DARKEN = 0.12;

const _deep = new THREE.Color(0x008c74);
const _surface = new THREE.Color(0x00a680);
export const DEEP_COLOR = vec3(_deep.r, _deep.g, _deep.b);
export const SURFACE_COLOR = vec3(_surface.r, _surface.g, _surface.b);

export function createWaterColorNode() {
  const worldXZ = positionWorld.xz.mul(float(WATER_SCALE)).add(time.mul(float(WATER_SPEED)));
  const noiseXZ = positionWorld.xz.mul(float(WATER_SCALE)).add(time.mul(float(NOISE_SPEED)));

  // Domain warp: offset sampling coords with Perlin noise so Voronoi cell
  // edges become wavy and look like painted brush strokes
  const warp = mx_noise_vec3(noiseXZ.mul(float(0.5))).xy.mul(float(0.4));
  const warpedXZ = worldXZ.add(warp);
  const worley = mx_worley_noise_float(warpedXZ, 0.85);

  // Fractal noise overlay for fine painted surface detail
  const fractal = mx_fractal_noise_float(noiseXZ.mul(float(1.5)), 3, 2.0, 0.5);

  // Blend: Worley drives the broad cell structure, fractal adds fine texture
  const combinedNoise = mix(worley, fractal, float(0.2));

  const chess = mod(
    floor(positionWorld.x.add(0.5)).add(floor(positionWorld.z.add(0.5))),
    float(2.0)
  );
  return mix(DEEP_COLOR, SURFACE_COLOR, combinedNoise).mul(
    float(1.0).sub(chess.mul(float(CHESS_DARKEN)))
  );
}
