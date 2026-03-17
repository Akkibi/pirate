import mitt from 'mitt';
// import type { Position } from "../types/general";

export type GameEvents = {
  'crew:arrow_click': { direction: string };
  'crew:move_confirmation': { direction: string };
};

export const gameEvents = mitt<GameEvents>();
