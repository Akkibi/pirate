import * as THREE from 'three/webgpu';
import { uv, texture, time, float, vec2, vec3, mx_noise_vec3 } from 'three/tsl';

const WIND_SCALE = 5;
const WIND_SPEED = 0.06;
const WIND_AMPLITUDE = 0.05;

export function createCloudMaterial(
  originalMaterial: THREE.Material | null
): THREE.MeshBasicNodeMaterial {
  const mat = new THREE.MeshBasicNodeMaterial();
  mat.transparent = true;
  mat.depthWrite = false;
  mat.side = THREE.DoubleSide;

  if (!originalMaterial) return mat;

  const orig = originalMaterial as THREE.MeshBasicMaterial;
  mat.color.copy(orig.color);
  mat.vertexColors = orig.vertexColors;

  if (!orig.map) return mat;

  // Noise drifts along U over time → wind blowing across the texture
  const noiseInput = vec3(
    uv()
      .x.mul(float(WIND_SCALE))
      .add(time.mul(float(WIND_SPEED))),
    float(0.0),
    uv().y.mul(float(WIND_SCALE))
  );
  const noiseVec = mx_noise_vec3(noiseInput);
  const windedUV = uv().add(vec2(noiseVec.x, noiseVec.z).mul(float(WIND_AMPLITUDE)));

  const cloudTex = texture(orig.map, windedUV);
  mat.colorNode = cloudTex.rgb;
  mat.opacityNode = cloudTex.a;

  return mat;
}
