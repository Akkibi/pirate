import { shallowRef } from 'vue';
import type { ChoiceCard } from '../types/ui';
import type { TreasureCardView } from './treasureCards';
import { stopScreenSounds } from './soundManager';
import type { GameCheckpoint, GameProgressData } from './gameProgress';

export interface ScreenContent {
  title?: string;
  body?: string;
  caption?: string;
  footer?: string;
  stats?: {
    label: string;
    value: string;
  }[];
}

export type DayPhaseIndicator = 'aurore' | 'matinee' | 'journee' | 'soiree';

export interface TutorialScreenContent extends ScreenContent {
  title: string;
  body: string;
  items?: readonly string[];
}

export interface ScreenChrome {
  phase?: DayPhaseIndicator;
  showRhum?: boolean;
  showPeanuts?: boolean;
  canUseCards?: boolean;
}

type ChoiceCardInput = Omit<ChoiceCard, 'onSelect'>;

type ScreenChromeProps = {
  chrome?: ScreenChrome;
};

type BaseButtonProps = {
  showParchment?: boolean;
  primaryButtonLabel?: string;
  secondaryButtonLabel?: string;
  showUndo?: boolean;
  undoLabel?: string;
  openHandOnPrimary?: boolean;
  openHandOnSecondary?: boolean;
  primaryButtonOnClick?: () => void;
  secondaryButtonOnClick?: () => void;
};

export type UIScreen =
  | {
      type: 'difficulty-setup';
      content?: ScreenContent;
      props: {
        initialValue: number;
        minValue?: number;
        maxValue?: number;
        primaryButtonLabel?: string;
      } & ScreenChromeProps;
    }
  | {
      type: 'card-confirm';
      content?: ScreenContent;
      props: {
        card: TreasureCardView;
        confirmLabel?: string;
        cancelLabel?: string;
      } & ScreenChromeProps;
    }
  | {
      type: 'full-message-button';
      content?: ScreenContent;
      props: BaseButtonProps &
        ScreenChromeProps & {
          primaryButtonLabel: string;
        };
    }
  | {
      type: 'tutorial';
      content: TutorialScreenContent;
      props: BaseButtonProps &
        ScreenChromeProps & {
          imageSrc: string;
          imageAlt: string;
          primaryButtonLabel: string;
          secondaryButtonLabel: string;
        };
    }
  | {
      type: 'looking-around-timer';
      content?: ScreenContent;
      props: {
        replayKey?: string | number | boolean | null;
        stepDuration?: number;
        onComplete?: () => void;
      } & ScreenChromeProps;
    }
  | {
      type: 'top-message-lower-button';
      content?: ScreenContent;
      props: BaseButtonProps & ScreenChromeProps;
    }
  | {
      type: 'top-message-lower-button-cards';
      content?: ScreenContent;
      props: BaseButtonProps &
        ScreenChromeProps & {
          cards: ChoiceCardInput[];
          buttonsOnLastRow?: boolean;
        };
    }
  | {
      type: 'top-message-lower-button-dice';
      content?: ScreenContent;
      props: BaseButtonProps &
        ScreenChromeProps & {
          rollDuration?: number;
          throwDice?: boolean;
          resultValue?: number;
          zeroResultButtonLabel?: string;
          movingResultButtonLabel?: string;
          onRollComplete?: (value: number) => void;
        };
    };

type ActiveUIScreen = UIScreen & {
  instanceId: number;
};

export interface ActiveUIScreenProgress {
  checkpoint: GameCheckpoint;
  data?: GameProgressData;
}

export type UIScreenResult =
  | { action: 'primary' }
  | { action: 'secondary' }
  | { action: 'undo' }
  | { action: 'difficulty'; maxRhum: number }
  | { action: 'timer-complete' }
  | { action: 'card'; cardId: string | number | undefined };

export const currentScreen = shallowRef<ActiveUIScreen | null>(null);
export const currentScreenProgress = shallowRef<ActiveUIScreenProgress | null>(null);

let nextScreenInstanceId = 1;
let pendingResolve: ((value: UIScreenResult) => void) | null = null;

export function showScreen(
  screen: UIScreen,
  progress?: ActiveUIScreenProgress
): Promise<UIScreenResult> {
  currentScreen.value = {
    ...screen,
    instanceId: nextScreenInstanceId++,
  };
  currentScreenProgress.value = progress ?? null;

  return new Promise<UIScreenResult>((resolve) => {
    pendingResolve = resolve;
  });
}

export function resolveScreen(result: UIScreenResult): void {
  const resolve = pendingResolve;

  stopScreenSounds();
  pendingResolve = null;
  currentScreen.value = null;
  currentScreenProgress.value = null;

  resolve?.(result);
}

export function clearScreen(): void {
  stopScreenSounds();
  pendingResolve = null;
  currentScreen.value = null;
  currentScreenProgress.value = null;
}
