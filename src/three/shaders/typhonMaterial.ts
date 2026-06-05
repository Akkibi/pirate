import * as THREE from 'three/webgpu';
import {
  positionGeometry,
  mix,
  clamp,
  fract,
  abs,
  step,
  oneMinus,
  vec3,
  float,
  cos,
  sin,
  attribute,
  time,
  mx_noise_vec3,
  atan2,
} from 'three/tsl';
import { BASE_OPACITY, createWaterColorNode } from './waterBase';

// Blender ColorRamp stops (pos 0.0 / 0.5 / 1.0) — sRGB hex → linear
const _colCenter = new THREE.Color(0x36b097);
const _colArm = new THREE.Color(0x00a988);
const _colBg = new THREE.Color(0x009881);
const COL_CENTER = vec3(_colCenter.r, _colCenter.g, _colCenter.b);
const COL_ARM = vec3(_colArm.r, _colArm.g, _colArm.b);
const COL_BG = vec3(_colBg.r, _colBg.g, _colBg.b);

// Slow global spin, radians/second
const SPIN_SPEED = 0.3;

export function createTyphonMaterial(
  instanceOpacityNode: ReturnType<typeof attribute>
): THREE.MeshBasicNodeMaterial {
  const mat = new THREE.MeshBasicNodeMaterial();
  mat.transparent = true;
  mat.depthWrite = false;

  // ── Water base (world-space → seamless across all tiles) ─────────────────
  const waterColor = createWaterColorNode();
  // ── Typhon spiral ─────────────────────────────────────────────────────────
  // positionGeometry is the raw geometry attribute — before the per-instance
  // matrix is applied. This keeps the spiral centered on every tile regardless
  // of its world position, unlike positionLocal which bakes the instance
  // translation in and makes dotProd huge for tiles far from world origin.
  const geoPos = positionGeometry;

  // Blender: dot(Object, Object) = squared distance from tile center
  const dotProd = geoPos.dot(geoPos.add(vec3(0, 1, 0)));

  // 3D noise for organic arm distortion (Blender Noise on Generated+offset, −0.5)
  const noiseVec = mx_noise_vec3(geoPos.add(vec3(1.67, 0.0, 0.0))).mul(0.5);

  // Spiral angle: distance term makes outer vertices rotate more (creates arms).
  // time.mul(SPIN_SPEED) adds the missing global rotation animation.
  const spiralAngle = dotProd.mul(2.0).add(time.mul(SPIN_SPEED)).add(2.0875).add(noiseVec.z);

  // Y-axis rotation of local XZ (Blender's Z-axis rotation on an XY-flat tile)
  const cosA = cos(spiralAngle);
  const sinA = sin(spiralAngle);
  const rotX = geoPos.x.mul(cosA).add(geoPos.z.mul(sinA));
  const rotZ = geoPos.x.mul(sinA).negate().add(geoPos.z.mul(cosA));

  // Blender RADIAL gradient → normalised atan2
  const radialGrad = atan2(rotZ, rotX)
    .add(Math.PI)
    .div(Math.PI * 2.0);

  // 6 arms: V-shape via abs(fract(radial×6) − 0.5)
  // → 0 at arm centre, 0.5 at arm edges
  const armShape = abs(fract(radialGrad.mul(6.0)).sub(0.5));

  // Attenuate by falloff
  const shape = armShape.mul(oneMinus(dotProd));

  // Blender GREATER_THAN thresholds
  const innerMask = step(float(0.005), shape); // 1 outside narrow centre line
  const outerMask = step(float(0.1), shape); // 1 in background between arms

  // Blender Math.011: innerMask × (outerMask + 0.5)
  //   0   → arm centre line  (COL_CENTER)
  //   0.5 → arm fill         (COL_ARM)
  //   1.5 → background       (clamped → COL_BG, replaced by waterColor)
  const combined = innerMask.mul(outerMask.add(0.5));

  // 3-stop colour ramp (Blender ColorRamp, stops at 0 / 0.5 / 1.0)
  const t = clamp(oneMinus(combined), 0, 1);
  const rLow = mix(COL_CENTER, COL_ARM, clamp(t.mul(2.0), 0, 1));
  const rHigh = mix(COL_ARM, COL_BG, clamp(t.sub(0.5).mul(2.0), 0, 1));
  const typhonColor = mix(rLow, rHigh, step(float(0.5), t));

  // Arms (outerMask=0) → typhon colour.  Background (outerMask=1) → water Voronoi.
  mat.colorNode = mix(waterColor, typhonColor, innerMask.mul(dotProd.add(0.3)));
  // mat.colorNode = innerMask.mul(dotProd.add(0.5));
  mat.opacityNode = mix(instanceOpacityNode.mul(float(BASE_OPACITY)), float(0.9), innerMask);
  return mat;
}
