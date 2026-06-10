import mitt from 'mitt';
// import type { Position } from "../types/general";

export type GameEvents = {
  'crew:arrow_click': { direction: string };
  'crew:move_confirmation': { direction: string };
  'parrot:map_revealed': Record<string, never>;
  'boat:shoot_cannons': Record<string, never>;
  'scene:game': void;
  'game:return_home': Record<string, never>;
};

export const gameEvents = mitt<GameEvents>();
