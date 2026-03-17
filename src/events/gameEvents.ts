/* eslint-disable @typescript-eslint/no-explicit-any */
import mitt from "mitt";
import type { Position } from "../types/general";

type GameEvents = {
  "crew:move": { from: Position; to: Position };
  "parrot:attack": { target: Position };
  "animation:complete": { name: string };
  "video:play": { src: string };
  "crew:actionSelected": any;
};

export const gameEvents = mitt<GameEvents>();
