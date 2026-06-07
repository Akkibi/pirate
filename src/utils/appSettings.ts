import { reactive } from 'vue';

export type LanguageCode = 'fr' | 'en';

interface AppSettings {
  language: LanguageCode;
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
}

const APP_SETTINGS_STORAGE_KEY = 'pirate.app.settings';

const DEFAULT_APP_SETTINGS: AppSettings = {
  language: 'fr',
  musicEnabled: true,
  soundEffectsEnabled: true,
};

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && 'localStorage' in window;
}

function isLanguageCode(value: unknown): value is LanguageCode {
  return value === 'fr' || value === 'en';
}

function normalizeSettings(value: unknown): AppSettings {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_APP_SETTINGS };
  }

  const candidate = value as Partial<AppSettings>;

  return {
    language: isLanguageCode(candidate.language)
      ? candidate.language
      : DEFAULT_APP_SETTINGS.language,
    musicEnabled:
      typeof candidate.musicEnabled === 'boolean'
        ? candidate.musicEnabled
        : DEFAULT_APP_SETTINGS.musicEnabled,
    soundEffectsEnabled:
      typeof candidate.soundEffectsEnabled === 'boolean'
        ? candidate.soundEffectsEnabled
        : DEFAULT_APP_SETTINGS.soundEffectsEnabled,
  };
}

function loadAppSettings(): AppSettings {
  if (!canUseLocalStorage()) {
    return { ...DEFAULT_APP_SETTINGS };
  }

  const rawSettings = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);

  if (!rawSettings) {
    return { ...DEFAULT_APP_SETTINGS };
  }

  try {
    return normalizeSettings(JSON.parse(rawSettings));
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

function persistAppSettings(): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(appSettings));
}

export const appSettings = reactive<AppSettings>(loadAppSettings());

export function setAppLanguage(language: LanguageCode): void {
  appSettings.language = language;
  persistAppSettings();
}

export function setMusicEnabled(enabled: boolean): void {
  appSettings.musicEnabled = enabled;
  persistAppSettings();
}

export function setSoundEffectsEnabled(enabled: boolean): void {
  appSettings.soundEffectsEnabled = enabled;
  persistAppSettings();
}
