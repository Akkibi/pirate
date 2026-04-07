// skytexture.ts
import * as THREE from 'three/webgpu';
import { uniform, uv, mix, vec3, float, sin, exp, pow, smoothstep } from 'three/src/nodes/TSL.js';

export interface SeaSkyBackground {
  mesh: THREE.Mesh;
  update: (time: number) => void;
}

export function createSeaSkyBackground(camera: THREE.PerspectiveCamera): SeaSkyBackground {
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

  // Water colors (art direction palette, converted sRGB → linear)
  const waterDeep = vec3(0.0, 0.315, 0.219); // #009881
  const waterMid = vec3(0.0, 0.397, 0.246); // #00A988
  const waterLight = vec3(0.037, 0.434, 0.31); // #36B097

  // Sky gradient
  const skyT = y.sub(horizon).div(float(1.0).sub(horizon)).clamp(0, 1);
  const skyColor = mix(skyHorizon, skyTop, skyT);

  // Water gradient (0 = bottom, 1 = horizon)
  const waterT = y.div(horizon).clamp(0, 1);

  // Horizontal wave displacement — multiple sine layers for organic feel
  const waveDisplace = sin(x.mul(28.0).add(uTime.mul(0.0006)))
    .mul(0.02)
    .add(sin(x.mul(45.0).sub(uTime.mul(0.0009)).add(2.1)).mul(0.012))
    .add(sin(x.mul(13.0).add(uTime.mul(0.0004)).add(4.7)).mul(0.008));

  // Apply displacement only in water area (fades to 0 near horizon)
  const proximity = float(1.0).sub(waterT);
  const yWaved = y.add(waveDisplace.mul(proximity));

  // Wave bands — horizontal stripes that ripple
  const band = sin(yWaved.mul(120.0).add(uTime.mul(0.0007)))
    .mul(0.5)
    .add(0.5);

  // Secondary smaller bands for texture
  const band2 = sin(yWaved.mul(250.0).sub(uTime.mul(0.0011)).add(1.3))
    .mul(0.5)
    .add(0.5);

  // Base water gradient deep → mid
  const waterBase = mix(waterDeep, waterMid, waterT);

  // Blend in light color on wave crests, stronger near bottom
  const waveHighlight = band.mul(0.5).add(band2.mul(0.2)).mul(proximity);
  const waterColor = mix(waterBase, waterLight, waveHighlight.clamp(0, 1));

  // Blend at horizon
  const isAboveHorizon = smoothstep(horizon.sub(0.005), horizon.add(0.005), y);
  const baseColor = mix(waterColor, skyColor, isAboveHorizon);

  // Horizon glow
  const horizonDist = y.sub(horizon).mul(12.0);
  const horizonGlow = exp(pow(horizonDist, 2).negate());
  const finalColor = baseColor.add(vec3(0.95, 0.9, 0.8).mul(horizonGlow).mul(0.3));

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
