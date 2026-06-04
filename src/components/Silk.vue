<template>
  <canvas ref="canvasRef" class="w-full h-full block" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';

const props = withDefaults(
  defineProps<{
    speed?: number;
    scale?: number;
    rotation?: number;
    displace?: number;
  }>(),
  {
    speed: 5,
    scale: 1,
    rotation: 0,
    displace: 0.05,
  }
);

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float uTime;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform sampler2D uTexture;
uniform float uDisplace;

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2 rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  vec2 uv     = rotateUvs(vUv * uScale, uRotation);
  vec2 tex    = uv * uScale;
  float tOffset = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
    0.4 * sin(5.0 * (tex.x + tex.y +
                     cos(3.0 * tex.x + 5.0 * tex.y) +
                     0.02 * tOffset) +
             sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  // Displace image by the silk pattern (centered at 0.6 so it goes both ways)
  vec2 imgUv = vUv;
  imgUv.x += (pattern - 0.6) * uDisplace * 0.25;
  imgUv.y += (pattern - 0.6) * uDisplace * 0.25;

  vec4 img = texture2D(uTexture, imgUv);
  gl_FragColor = vec4(mix(img.rgb, vec3(0.0), pattern * 0.35), 1.0);
}
`;

const canvasRef = ref<HTMLCanvasElement | null>(null);
let renderer: THREE.WebGLRenderer | null = null;
let frameId = 0;

onMounted(() => {
  const canvas = canvasRef.value!;
  const parent = canvas.parentElement!;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  const texture = new THREE.TextureLoader().load('/images/bg.webp');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  const uniforms = {
    uTime: { value: 0 },
    uSpeed: { value: props.speed },
    uScale: { value: props.scale },
    uRotation: { value: props.rotation },
    uTexture: { value: texture },
    uDisplace: { value: props.displace },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    uniforms,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  scene.add(new THREE.Mesh(geometry, material));

  const resize = () => {
    renderer!.setSize(parent.clientWidth, parent.clientHeight);
  };

  window.addEventListener('resize', resize);
  resize();

  watch(
    () => props.speed,
    (v) => {
      uniforms.uSpeed.value = v;
    }
  );
  watch(
    () => props.scale,
    (v) => {
      uniforms.uScale.value = v;
    }
  );
  watch(
    () => props.rotation,
    (v) => {
      uniforms.uRotation.value = v;
    }
  );
  watch(
    () => props.displace,
    (v) => {
      uniforms.uDisplace.value = v;
    }
  );

  let lastTime = Date.now();
  const animate = () => {
    const now = Date.now();
    uniforms.uTime.value += 0.1 * ((now - lastTime) / 1000);
    lastTime = now;
    renderer!.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  };

  frameId = requestAnimationFrame(animate);

  onBeforeUnmount(() => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    geometry.dispose();
    material.dispose();
    texture.dispose();
    renderer!.dispose();
  });
});
</script>
