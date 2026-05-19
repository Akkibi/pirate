export type ButtonHandler = (() => void | Promise<void>) | undefined;

export interface ChoiceCard {
  id?: string | number;
  title: string;
  imageSrc?: string;
  imageAlt?: string;
  caption: string;
  badge?: string;
  disabled?: boolean;
  disabledReason?: string;
  onSelect?: ButtonHandler;
}
