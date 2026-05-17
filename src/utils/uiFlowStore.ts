import { shallowRef } from 'vue';
import type { ChoiceCard } from '../types/ui';

export interface ScreenContent {
  title?: string;
  body?: string;
  caption?: string;
  footer?: string;
}

type ChoiceCardInput = Omit<ChoiceCard, 'onSelect'>;

type BaseButtonProps = {
  showParchment?: boolean;
  primaryButtonLabel?: string;
  secondaryButtonLabel?: string;
  showUndo?: boolean;
  undoLabel?: string;
  primaryButtonOnClick?: () => void;
  secondaryButtonOnClick?: () => void;
};

export type UIScreen =
  | {
      type: 'full-message-button';
      content?: ScreenContent;
      props: BaseButtonProps & {
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
      };
    }
  | {
      type: 'top-message-lower-button';
      content?: ScreenContent;
      props: BaseButtonProps;
    }
  | {
      type: 'top-message-lower-button-cards';
      content?: ScreenContent;
      props: BaseButtonProps & {
        cards: ChoiceCardInput[];
      };
    }
  | {
      type: 'top-message-lower-button-dice';
      content?: ScreenContent;
      props: BaseButtonProps & {
        rollDuration?: number;
        throwDice?: boolean;
        resultValue?: number;
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

  pendingResolve = null;
  currentScreen.value = null;

  resolve?.(result);
}

export function clearScreen(): void {
  pendingResolve = null;
  currentScreen.value = null;
}
