import {
  applyGameStateSnapshot,
  createGameStateSnapshot,
  type GameStateSnapshot,
} from "./gameStore";

const GAME_PROGRESS_STORAGE_KEY = "pirate.game.progress";

export type GameCheckpoint =
  | "intro.gameStart"
  | "intro.boatPlacement"
  | "parrot.dawnIntro"
  | "parrot.observeSurroundings"
  | "parrot.lookAroundTimer"
  | "parrot.helpCrew"
  | "crew.morningIntro"
  | "crew.diceRoll"
  | "crew.cardChoice"
  | "crew.afternoonIntro"
  | "crew.directionConfirm";

export interface GameProgressData {
  throwDice?: boolean;
  resultValue?: number;
}

export interface SavedGameProgress {
  checkpoint: GameCheckpoint;
  state: GameStateSnapshot;
  data?: GameProgressData;
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}

function isSavedGameProgress(value: unknown): value is SavedGameProgress {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as SavedGameProgress;
  return Boolean(candidate.checkpoint && candidate.state);
}

function loadGameProgressHistory(): SavedGameProgress[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  const rawProgress = window.localStorage.getItem(GAME_PROGRESS_STORAGE_KEY);

  if (!rawProgress) {
    return [];
  }

  try {
    const parsedProgress = JSON.parse(rawProgress) as
      | SavedGameProgress
      | SavedGameProgress[];

    if (Array.isArray(parsedProgress)) {
      return parsedProgress.filter(isSavedGameProgress);
    }

    return isSavedGameProgress(parsedProgress) ? [parsedProgress] : [];
  } catch {
    return [];
  }
}

function persistGameProgressHistory(history: SavedGameProgress[]): void {
  if (!canUseLocalStorage()) {
    return;
  }

  if (history.length === 0) {
    window.localStorage.removeItem(GAME_PROGRESS_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    GAME_PROGRESS_STORAGE_KEY,
    JSON.stringify(history),
  );
}

export function getSavedGameProgressCount(): number {
  return loadGameProgressHistory().length;
}

export function peekSavedGameProgress(): SavedGameProgress | null {
  const history = loadGameProgressHistory();

  return history[history.length - 1] ?? null;
}

export function saveGameProgress(
  checkpoint: GameCheckpoint,
  data?: GameProgressData,
): void {
  const history = loadGameProgressHistory();

  history.push({
    checkpoint,
    state: createGameStateSnapshot(),
    data,
  });

  persistGameProgressHistory(history);
}

export function popSavedGameProgress(): SavedGameProgress | null {
  const history = loadGameProgressHistory();
  const poppedEntry = history.pop() ?? null;

  persistGameProgressHistory(history);

  return poppedEntry;
}

export function restoreGameProgress(
  progress: SavedGameProgress,
): SavedGameProgress {
  applyGameStateSnapshot(progress.state);
  return progress;
}

export function hasSavedGameProgress(): boolean {
  return getSavedGameProgressCount() > 0;
}

export function restoreSavedGameProgress(): SavedGameProgress | null {
  const progress = peekSavedGameProgress();

  if (!progress) {
    return null;
  }

  return restoreGameProgress(progress);
}

export function clearSavedGameProgress(): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(GAME_PROGRESS_STORAGE_KEY);
}
