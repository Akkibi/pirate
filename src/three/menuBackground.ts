import * as THREE from 'three/webgpu';
import {
  time,
  sin,
  cos,
  vec2,
  vec3,
  mix,
  screenUV,
  uniform,
  texture,
  positionLocal,
  vec4,
} from 'three/tsl';

export function createMenuBackground(scene: THREE.Scene): void {
  const uSpeed = uniform(5.0);
  const uScale = uniform(1.0);
  const uRotation = uniform(0.0);
  const uDisplace = uniform(0.05);

  const bgTexture = new THREE.TextureLoader().load('/images/bg.webp');
  bgTexture.wrapS = THREE.RepeatWrapping;
  bgTexture.wrapT = THREE.RepeatWrapping;
  bgTexture.colorSpace = THREE.SRGBColorSpace;

  const vUv = screenUV;

  // rotateUvs(vUv * uScale, uRotation)
  const scaled = vUv.mul(uScale);
  const c = cos(uRotation);
  const s = sin(uRotation);
  const uvRotated = vec2(
    c.mul(scaled.x).sub(s.mul(scaled.y)),
    s.mul(scaled.x).add(c.mul(scaled.y))
  );

  const tex = uvRotated.mul(uScale);

  // tOffset matches Silk.vue's time accumulation: uTime += 0.1 * deltaSeconds
  const tOffset = uSpeed.mul(time).mul(0.1);

  const texX = tex.x;
  const texY = tex.y.add(sin(texX.mul(8.0).sub(tOffset)).mul(0.03));

  const texSum = texX.add(texY);
  const innerCos = cos(texX.mul(3.0).add(texY.mul(5.0)));
  const inner = texSum.add(innerCos).add(tOffset.mul(0.02));
  const outerSin = sin(texSum.sub(tOffset.mul(0.1)).mul(20.0));
  const pattern = sin(inner.mul(5.0).add(outerSin)).mul(0.4).add(0.6);

  const disp = pattern.sub(0.6).mul(uDisplace).mul(0.25);
  const imgUv = vec2(vUv.x.add(disp), vUv.y.add(disp));

  const img = texture(bgTexture, imgUv);
  const finalColor = mix(img.rgb, vec3(0.0, 0.0, 0.0), pattern.mul(0.35));

  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = finalColor;
  material.vertexNode = vec4(positionLocal.xy, 1.0, 1.0);
  material.depthWrite = false;
  material.depthTest = true;

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 9999;
  scene.add(mesh);
}
