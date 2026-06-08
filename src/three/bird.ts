import * as THREE from 'three/webgpu';
import { modelLoader } from './modelLoader';

function cloneSkinnedScene(source: THREE.Object3D): THREE.Object3D {
  const sourceLookup = new Map<THREE.Object3D, THREE.Object3D>();
  const cloneLookup = new Map<THREE.Object3D, THREE.Object3D>();

  function parallelTraverse(a: THREE.Object3D, b: THREE.Object3D) {
    sourceLookup.set(b, a);
    cloneLookup.set(a, b);
    for (let i = 0; i < a.children.length; i++) {
      parallelTraverse(a.children[i]!, b.children[i]!);
    }
  }

  const cloned = source.clone();
  parallelTraverse(source, cloned);

  cloned.traverse((node) => {
    if (!(node instanceof THREE.SkinnedMesh)) return;
    const sourceMesh = sourceLookup.get(node) as THREE.SkinnedMesh;
    node.skeleton = sourceMesh.skeleton.clone();
    node.bindMatrix.copy(sourceMesh.bindMatrix);
    node.skeleton.bones = sourceMesh.skeleton.bones.map(
      (bone) => cloneLookup.get(bone) as THREE.Bone
    );
    node.bind(node.skeleton, node.bindMatrix);
  });

  return cloned;
}

export class Bird {
  private birdGroup: THREE.Group;
  private wingLeft: THREE.Bone | null = null;
  private wingRight: THREE.Bone | null = null;

  constructor(parentGroup: THREE.Group) {
    this.birdGroup = new THREE.Group();

    const bird = cloneSkinnedScene(modelLoader.get('./models/bird.glb').scene);
    this.birdGroup.add(bird);
    this.birdGroup.scale.multiplyScalar(0.4);

    bird.traverse((node) => {
      if (!(node instanceof THREE.Bone)) return;
      if (node.name === 'left') this.wingLeft = node;
      if (node.name === 'right') this.wingRight = node;
    });

    parentGroup.add(this.birdGroup);
  }

  public update(time: number, delta: number): void {
    this.birdGroup.rotation.y += 0.0002 * delta;
    this.birdGroup.position.y = Math.sin(time * 0.001 - 2.25) * 0.1 + 1.25;
    this.birdGroup.rotation.z = Math.sin(time * 0.00113) * 0.1;

    const flap = Math.sin(time * 0.001) * 0.25 + 0.25;
    if (this.wingLeft) this.wingLeft.rotation.y = flap;
    if (this.wingRight) this.wingRight.rotation.y = -flap;
  }

  public destroy(): void {
    this.birdGroup.removeFromParent();
  }
}
