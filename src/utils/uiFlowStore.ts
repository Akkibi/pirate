import { shallowRef } from 'vue';
import type { ChoiceCard } from '../types/ui';
import type { TreasureCardView } from './treasureCards';
import { stopScreenSounds } from './soundManager';

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

export type UIScreenResult =
  | { action: 'primary' }
  | { action: 'secondary' }
  | { action: 'undo' }
  | { action: 'difficulty'; maxRhum: number }
  | { action: 'timer-complete' }
  | { action: 'card'; cardId: string | number | undefined };

export const currentScreen = shallowRef<ActiveUIScreen | null>(null);

let nextScreenInstanceId = 1;
let pendingResolve: ((value: UIScreenResult) => void) | null = null;

export function showScreen(screen: UIScreen): Promise<UIScreenResult> {
  currentScreen.value = {
    ...screen,
    instanceId: nextScreenInstanceId++,
  };

  return new Promise<UIScreenResult>((resolve) => {
    pendingResolve = resolve;
  });
}

export function resolveScreen(result: UIScreenResult): void {
  const resolve = pendingResolve;

  stopScreenSounds();
  pendingResolve = null;
  currentScreen.value = null;

  resolve?.(result);
}

export function clearScreen(): void {
  stopScreenSounds();
  pendingResolve = null;
  currentScreen.value = null;
}
