import { reactive, watch } from 'vue';
import * as THREE from 'three/webgpu';

export type PhaseType = 'crew' | 'parrot';

interface StoreInterface {
  currentPhase: PhaseType;
  currentAction: string | null;
  showActionPanel: boolean;
  showVideoOverlay: boolean;
  turnCount: number;
  crewHP: number;
  userPosition: THREE.Vector2;
  userPositionHistory: Array<THREE.Vector2>;
}

export const gameState = reactive({
  currentPhase: 'crew',
  currentAction: null as string | null,
  showActionPanel: false,
  showVideoOverlay: false,
  turnCount: 0,
  crewHP: 3,
  userPosition: new THREE.Vector2(0, 0),
  userPositionHistory: [new THREE.Vector2(0, 0)],
} as StoreInterface);
