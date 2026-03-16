/* eslint-disable @typescript-eslint/no-explicit-any */
import { gameText } from "../content/gameText";
import { gameEvents } from "../events/gameEvents";
import { gameState } from "./gameStore";
import { showScreen } from "./uiFlowStore";

export class GameLoop {
  async startTurn() {
    gameState.turnCount++;

    if (gameState.turnCount === 1) {
      await showScreen({
        type: "full-message-button",
        content: gameText.setup.gameStart,
        props: {
          primaryButtonLabel: gameText.setup.gameStart.primaryButton,
        },
      });
    }

    // --- Crew phase ---
    gameState.currentPhase = "crew";
    const action = await this.waitForCrewAction(); // resolves on UI click
    gameState.currentAction = String(action.cardId ?? "");

    gameEvents.emit("crew:move", action);
    await this.waitForEvent("animation:complete"); // wait for 3D anim

    // --- Parrot phase ---
    gameState.currentPhase = "parrot";
    const parrotAction = this.computeParrotAction();
    gameEvents.emit("parrot:attack", parrotAction);
    await this.waitForEvent("animation:complete");

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
    return this.showCrewActionFlow();
  }

  private computeParrotAction(): any {
    // TODO: Implement parrot AI logic
    return {};
  }

  private async showCrewActionFlow(): Promise<{
    cardId: string | number | undefined;
  }> {
    const crewText =
      gameState.turnCount === 1 ? gameText.turn1.crew : gameText.turn2Plus.crew;

    await showScreen({
      type: "full-message-button",
      content: crewText.morningIntro,
      props: {
        primaryButtonLabel: "Suivant",
      },
    });

    while (true) {
      const choice = await showScreen({
        type: "top-message-lower-button",
        content: crewText.chooseCard,
        props: {
          showUndo: true,
          undoLabel: crewText.chooseCard.undoLabel,
          primaryButtonLabel: "Suivant",
          secondaryButtonLabel: "mamma",

          //   cards: crewText.chooseCard.cards.map((card) => ({
          //     ...card,
          //     id: card.title,
          //   })),
        },
      });

      if (choice.action === "undo") {
        continue;
      }

      if (choice.action === "card") {
        return {
          cardId: choice.cardId,
        };
      }
    }
  }
}
