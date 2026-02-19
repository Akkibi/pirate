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
      gameEvents.on(event, resolve, { once: true });
    });
  }

  waitForCrewAction(): Promise<any> {
    return new Promise((resolve) => {
      gameEvents.on('crew:actionSelected', resolve, {
        once: true,
      });
    });
  }
}
