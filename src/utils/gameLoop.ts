/* eslint-disable @typescript-eslint/no-explicit-any */
import { gameEvents } from '../events/gameEvents';
import { gameState } from './gameStore';

export class GameLoop {
  async startTurn() {
    gameState.turnCount++;

    // --- Crew phase ---
    gameState.currentPhase = 'crew';
    gameState.showActionPanel = true;
    const action = await this.waitForCrewAction(); // resolves on UI click
    gameState.showActionPanel = false;

    gameEvents.emit('crew:move', action);
    await this.waitForEvent('animation:complete'); // wait for 3D anim

    // --- Parrot phase ---
    gameState.currentPhase = 'parrot';
    const parrotAction = this.computeParrotAction();
    gameEvents.emit('parrot:attack', parrotAction);
    await this.waitForEvent('animation:complete');

    this.startTurn(); // next turn
  }

  waitForEvent(event: string): Promise<void> {
    return new Promise((resolve) => {
      const handler = () => {
        gameEvents.off(event as any, handler);
        resolve();
      };
      gameEvents.on(event as any, handler);
    });
  }

  waitForCrewAction(): Promise<any> {
    return new Promise((resolve) => {
      const handler = (action: any) => {
        gameEvents.off('crew:actionSelected', handler);
        resolve(action);
      };
      gameEvents.on('crew:actionSelected', handler);
    });
  }

  private computeParrotAction(): any {
    // TODO: Implement parrot AI logic
    return {};
  }
}
