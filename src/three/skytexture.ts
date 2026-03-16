// skytexture.ts
import * as THREE from "three/webgpu";
import {
  uniform,
  uv,
  mix,
  vec3,
  float,
  sin,
  exp,
  pow,
  smoothstep,
} from "three/src/nodes/TSL.js";

export interface SeaSkyBackground {
  mesh: THREE.Mesh;
  update: (time: number) => void;
}

export function createSeaSkyBackground(
  camera: THREE.PerspectiveCamera,
): SeaSkyBackground {
  const uTime = uniform(0);

  const geometry = new THREE.SphereGeometry(500, 32, 32);
  const material = new THREE.MeshBasicNodeMaterial();
  material.side = THREE.BackSide;
  material.depthWrite = false;

  const horizon = float(0.45);

  const vUv = uv();
  const y = vUv.y;
  const x = vUv.x;

  // Sky colors
  const skyTop = vec3(0.3, 0.6, 1.0);
  const skyHorizon = vec3(0.2, 0.4, 1.0);

  // Water colors
  const waterTop = vec3(0.1, 0.1, 0.5);
  const waterBottom = vec3(0.0, 0.3, 0.7);

  // Sky gradient
  const skyT = y.sub(horizon).div(float(1.0).sub(horizon)).clamp(0, 1);
  const skyColor = mix(skyHorizon, skyTop, skyT);

  // Water gradient
  const waterT = y.div(horizon).clamp(0, 1);

  // Wave shimmer
  const wave = sin(x.mul(80.0).add(uTime.mul(0.001)))
    .mul(0.015)
    .mul(float(1.0).sub(waterT));
  const waterColor = mix(waterBottom, waterTop, waterT).add(
    vec3(wave, wave, wave),
  );

  // Blend at horizon
  const isAboveHorizon = smoothstep(horizon.sub(0.005), horizon.add(0.005), y);
  const baseColor = mix(waterColor, skyColor, isAboveHorizon);

  // Horizon glow
  const horizonDist = y.sub(horizon).mul(12.0);
  const horizonGlow = exp(pow(horizonDist, 2).negate());
  const finalColor = baseColor.add(
    vec3(0.95, 0.9, 0.8).mul(horizonGlow).mul(0.3),
  );

  material.colorNode = finalColor;

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;

  return {
    mesh,
    update(time: number) {
      uTime.value = time;
      // Follow the camera so the sky sphere is always centered on the viewer
      mesh.position.copy(camera.position);
    },
  };
}
