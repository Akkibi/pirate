import * as THREE from 'three/webgpu';
import { gameState, formatBoardCoordinate } from '../utils/gameStore';
import { cameraPositions } from './camera';
import type { SceneManager } from './sceneManager';

const ARROW_DEFINITIONS = [
  { name: 'left', position: new THREE.Vector3(0, 0, -0.75) },
  { name: 'right', position: new THREE.Vector3(0, 0, 0.75) },
  { name: 'down', position: new THREE.Vector3(-0.75, 0, 0) },
  { name: 'up', position: new THREE.Vector3(0.75, 0, 0) },
] as const;

const ARROW_OFFSETS: Record<string, { x: number; y: number }> = {
  left: { x: 0, y: -1 },
  right: { x: 0, y: 1 },
  down: { x: -1, y: 0 },
  up: { x: 1, y: 0 },
};

export class ArrowManager {
  private arrowGroup: THREE.Group;
  private arrowMeshes: Map<string, THREE.Mesh> = new Map();
  private arrowOverlays: Map<string, HTMLElement> = new Map();
  private normalTextures: Map<string, THREE.Texture> = new Map();
  private redTextures: Map<string, THREE.Texture> = new Map();
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager, arrowGroup: THREE.Group) {
    this.sceneManager = sceneManager;
    this.arrowGroup = arrowGroup;
  }

  load(onLoaded?: () => void): void {
    const textureLoader = new THREE.TextureLoader();
    let loaded = 0;
    const total = ARROW_DEFINITIONS.length * 2;

    const checkDone = () => {
      loaded++;
      if (loaded === total) onLoaded?.();
    };

    ARROW_DEFINITIONS.forEach((arrow) => {
      textureLoader.load(`images/arrow-${arrow.name}.webp`, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        this.normalTextures.set(arrow.name, texture);

        const geometry = new THREE.PlaneGeometry(0.5, 0.5);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
          depthTest: false,
          depthWrite: false,
          opacity: 0.8,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.renderOrder = 999;
        mesh.position.copy(arrow.position.clone().add(new THREE.Vector3(0, 0.4, 0)));
        mesh.lookAt(cameraPositions.gameplay);
        mesh.visible = gameState.displayArrows;

        this.arrowMeshes.set(arrow.name, mesh);
        this.arrowGroup.add(mesh);
        this.createOverlay(arrow.name);
        checkDone();
      });

      textureLoader.load(`images/arrow-${arrow.name}-red.webp`, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        this.redTextures.set(arrow.name, texture);
        checkDone();
      });
    });
  }

  private createOverlay(arrowName: string): void {
    const overlay = document.createElement('div');
    overlay.className = [
      'absolute',
      'pointer-events-none',
      '-translate-x-1/2',
      '-translate-y-1/2',
      'font-black',
      'font-title',
      'text-[5.5vh]',
      'text-white',
      '[-webkit-text-stroke:6px_#000000]',
      '[paint-order:stroke_fill]',
      'hidden',
    ].join(' ');
    const canvas = this.sceneManager.getRenderer().domElement;
    canvas.parentElement?.appendChild(overlay);
    this.arrowOverlays.set(arrowName, overlay);
  }

  private getArrowTargetLabel(arrowName: string): string {
    const offset = ARROW_OFFSETS[arrowName];
    if (!offset) return '';
    const target = {
      x: gameState.userPosition.x + offset.x,
      y: gameState.userPosition.y + offset.y,
    };
    return formatBoardCoordinate(target);
  }

  resetHighlight(): void {
    for (const [name, mesh] of this.arrowMeshes) {
      const material = mesh.material as THREE.MeshBasicMaterial;
      const normalTex = this.normalTextures.get(name);
      if (normalTex) {
        material.map = normalTex;
        material.needsUpdate = true;
      }
      material.opacity = 0.8;
    }
  }

  highlight(selectedName: string): void {
    for (const [name, mesh] of this.arrowMeshes) {
      const material = mesh.material as THREE.MeshBasicMaterial;
      const isSelected = name === selectedName;
      const tex = isSelected ? this.redTextures.get(name) : this.normalTextures.get(name);
      if (tex) {
        material.map = tex;
        material.needsUpdate = true;
      }
      material.opacity = isSelected ? 1 : 0.8;
    }
  }

  getBlockedDirection(position: THREE.Vector2): string | null {
    if (gameState.turnCount < 2 || gameState.userPositionHistory.length < 2) {
      return null;
    }

    const previousPosition =
      gameState.userPositionHistory[gameState.userPositionHistory.length - 2];
    if (!previousPosition) return null;

    const deltaX = previousPosition.x - position.x;
    const deltaY = previousPosition.y - position.y;

    if (deltaX === 1 && deltaY === 0) return 'up';
    if (deltaX === -1 && deltaY === 0) return 'down';
    if (deltaX === 0 && deltaY === 1) return 'right';
    if (deltaX === 0 && deltaY === -1) return 'left';

    return null;
  }

  updateVisibility(isDisplayed: boolean, position: THREE.Vector2): void {
    this.resetHighlight();
    gameState.arrowClicked = null;

    const blockedDirection = this.getBlockedDirection(position);

    for (const [name, mesh] of this.arrowMeshes) {
      const onBorder =
        (name === 'left' && position.y === 0) ||
        (name === 'right' && position.y === 6) ||
        (name === 'down' && position.x === 0) ||
        (name === 'up' && position.x === 4);

      const visible = !onBorder && isDisplayed && name !== blockedDirection;
      mesh.visible = visible;
      const overlay = this.arrowOverlays.get(name);
      if (overlay) {
        overlay.classList.toggle('hidden', !visible);
        if (visible) overlay.textContent = this.getArrowTargetLabel(name);
      }
    }
  }

  updateOverlayPositions(camera: THREE.Camera, canvas: HTMLCanvasElement): void {
    for (const [name, mesh] of this.arrowMeshes) {
      const overlay = this.arrowOverlays.get(name);
      if (!overlay || !mesh.visible) continue;
      const worldPos = new THREE.Vector3();
      mesh.getWorldPosition(worldPos);
      worldPos.project(camera);
      const x = (worldPos.x + 1) * 0.5 * canvas.clientWidth;
      const y = -(worldPos.y - 1) * 0.5 * canvas.clientHeight;
      overlay.style.left = `${x}px`;
      overlay.style.top = `${y}px`;
    }
  }

  getMeshes(): Map<string, THREE.Mesh> {
    return this.arrowMeshes;
  }

  destroy(): void {
    this.arrowMeshes.clear();
    for (const overlay of this.arrowOverlays.values()) {
      overlay.remove();
    }
    this.arrowOverlays.clear();
    for (const tex of this.normalTextures.values()) tex.dispose();
    for (const tex of this.redTextures.values()) tex.dispose();
    this.normalTextures.clear();
    this.redTextures.clear();
  }
}
