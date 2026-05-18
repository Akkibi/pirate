import { gsap } from 'gsap';
import * as THREE from 'three/webgpu';
import { objectPool } from '../three/instancedModelManger';

const _tempMatrix = new THREE.Matrix4();
const _tempPos = new THREE.Vector3();
const _tempQuat = new THREE.Quaternion();
const _tempScale = new THREE.Vector3();
const _updateVec = new THREE.Vector3();

export interface InstanceTweenVars extends Omit<gsap.TweenVars, 'x' | 'y' | 'z'> {
  x?: number;
  y?: number;
  z?: number;
}

/**
 * GSAP wrapper for animating instanced mesh positions via objectPool.
 * Usage: instanceTween.to('island', idx, { x: 1, z: 2, duration: 0.5, ease: 'expo.out' })
 */
export const instanceTween = {
  to(name: string, idx: number, vars: InstanceTweenVars): gsap.core.Tween {
    const mesh = objectPool.getInstancedMesh(name);

    mesh.getMatrixAt(idx, _tempMatrix);
    _tempMatrix.decompose(_tempPos, _tempQuat, _tempScale);

    const proxy = { x: _tempPos.x, y: _tempPos.y, z: _tempPos.z };
    const { x, y, z, ...gsapVars } = vars;

    return gsap.to(proxy, {
      ...gsapVars,
      x: x ?? _tempPos.x,
      y: y ?? _tempPos.y,
      z: z ?? _tempPos.z,
      onUpdate() {
        objectPool.updatePosition(name, idx, _updateVec.set(proxy.x, proxy.y, proxy.z));
      },
    });
  },
};
