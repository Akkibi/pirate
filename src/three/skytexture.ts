// skytexture.ts
import * as THREE from 'three/webgpu';
import {
  uniform,
  uv,
  mix,
  vec3,
  float,
  sin,
  abs,
  exp,
  pow,
  smoothstep,
} from 'three/src/nodes/TSL.js';

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

  // Water colors (art direction palette, converted sRGB → linear, darkened + saturated)
  const waterDeep = vec3(0.0, 0.1, 0.05);
  const waterMid = vec3(0.0, 0.14, 0.07);
  const waterLight = vec3(0.01, 0.18, 0.1);

  // Sky gradient
  const skyT = y.sub(horizon).div(float(1.0).sub(horizon)).clamp(0, 1);
  const skyColor = mix(skyHorizon, skyTop, skyT);

  // Water gradient (0 = bottom, 1 = horizon)
  const waterT = y.div(horizon).clamp(0, 1);

  // Wave displacement — multiple sine layers + diagonal component for organic feel
  const waveDisplace = sin(x.mul(28.0).add(uTime.mul(0.0006)))
    .mul(0.025)
    .add(sin(x.mul(45.0).sub(uTime.mul(0.0009)).add(2.1)).mul(0.014))
    .add(sin(x.mul(13.0).add(uTime.mul(0.0004)).add(4.7)).mul(0.01))
    .add(sin(x.mul(7.5).add(y.mul(3.0)).sub(uTime.mul(0.0005))).mul(0.018));

  // Apply displacement only in water area (fades to 0 near horizon)
  const proximity = float(1.0).sub(waterT);
  const yWaved = y.add(waveDisplace.mul(proximity));

  // Primary wave bands — frequency increases near bottom (perspective compression)
  const bandFreq = float(60.0).add(proximity.mul(80.0));
  const band = sin(yWaved.mul(bandFreq).add(uTime.mul(0.0007)))
    .mul(0.5)
    .add(0.5);

  // Secondary micro-waves
  const band2 = sin(yWaved.mul(240.0).sub(uTime.mul(0.0011)).add(1.3))
    .mul(0.5)
    .add(0.5);

  // Diagonal cross-hatch waves
  const band3 = sin(x.mul(50.0).add(yWaved.mul(35.0)).add(uTime.mul(0.0008)).add(3.2))
    .mul(0.5)
    .add(0.5);

  // Sharp wave crests — smoothstep threshold instead of soft pow
  const waveCrest = smoothstep(float(0.64), float(0.7), band);
  const waveCrest2 = smoothstep(float(0.68), float(0.74), band2);

  // Caustic network — three abs(sin()) planes at different angles create intersecting bright lines
  const causticA = abs(sin(x.mul(62.0).add(yWaved.mul(22.0)).add(uTime.mul(0.0009))));
  const causticB = abs(sin(x.mul(41.0).sub(yWaved.mul(31.0)).sub(uTime.mul(0.0007)).add(1.4)));
  const causticC = abs(sin(x.mul(27.0).add(yWaved.mul(48.0)).add(uTime.mul(0.0006)).add(2.8)));
  const caustic = pow(causticA.mul(causticB).mul(causticC), 2.5).mul(proximity);

  // Sharp foam lines — threshold on combined band value
  const foamMask = smoothstep(float(0.67), float(0.72), band.mul(0.65).add(band2.mul(0.35)));
  const foam = foamMask.mul(proximity);

  // Specular glints — higher power = sharper and rarer sparkles
  const glintA = sin(x.mul(97.3).add(uTime.mul(0.002)))
    .mul(0.5)
    .add(0.5);
  const glintB = sin(yWaved.mul(170.0).add(uTime.mul(0.0025)).add(2.4))
    .mul(0.5)
    .add(0.5);
  const glint = pow(glintA.mul(glintB), 13.0).mul(proximity.mul(0.7).add(0.3));

  // Fresnel: water reflects sky near horizon
  const fresnel = pow(waterT, 3.0);

  // Base water gradient deep → mid
  const waterBase = mix(waterDeep, waterMid, waterT);

  // Wave highlights using sharp crests
  const waveHighlight = waveCrest
    .mul(0.4)
    .add(waveCrest2.mul(0.2))
    .add(band3.mul(0.08))
    .mul(proximity);
  const waterWithWaves = mix(waterBase, waterLight, waveHighlight.clamp(0, 1));

  // Caustics — bright teal network overlay
  const waterWithCaustics = waterWithWaves.add(vec3(0.05, 0.5, 0.38).mul(caustic).mul(0.55));

  // Sharp foam streaks
  const waterWithFoam = mix(waterWithCaustics, vec3(0.55, 0.82, 0.7), foam.mul(0.55).clamp(0, 1));

  // Specular sun sparkle
  const waterWithGlints = waterWithFoam.add(vec3(0.9, 1.0, 0.85).mul(glint).mul(0.55));

  // Fresnel reflection toward sky near waterline
  const waterColor = mix(waterWithGlints, skyHorizon.mul(0.15), fresnel.mul(0.12));

  // Blend at horizon
  const isAboveHorizon = smoothstep(horizon.sub(0.001), horizon.add(0.001), y);
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
