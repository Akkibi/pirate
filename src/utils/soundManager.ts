type SoundKey =
  | 'background'
  | 'uiClick'
  | 'pirateIntro'
  | 'rhumSelect'
  | 'calmSea'
  | 'island'
  | 'monster'
  | 'typhon'
  | 'rhumRound'
  | 'rhumDefeat'
  | 'cards'
  | 'dice'
  | 'timer'
  | 'corsair'
  | 'anchor'
  | 'tequila'
  | 'bombeArtisanale'
  | 'bateauEnBouteille'
  | 'poudreACanon'
  | 'captain'
  | 'battle'
  | 'parrot'
  | 'parrotShare'
  | 'parrotToCrew'
  | 'crewToParrot'
  | 'peanut';

const SOUND_SOURCES: Record<SoundKey, string[]> = {
  background: ['/sounds/bande son.mp3'],
  uiClick: [
    '/sounds/UI global (click, sélection rhum)/clic 1.mp3',
    '/sounds/UI global (click, sélection rhum)/clic 2.mp3',
    '/sounds/UI global (click, sélection rhum)/clic 3.mp3',
  ],
  pirateIntro: [
    '/sounds/UI pirate/pirate 4.wav',
    '/sounds/UI pirate/pirate2.wav',
    '/sounds/UI pirate/pirate1.mp3',
    '/sounds/UI pirate/pirate3.mp3',
  ],
  rhumSelect: ['/sounds/UI global (click, sélection rhum)/selection rhum.mp3'],
  calmSea: ['/sounds/mer calme.mp3'],
  island: ['/sounds/abordage ile.mp3'],
  monster: [
    '/sounds/bruit de monstre/bruit de monstre 3.wav',
    '/sounds/bruit de monstre/bruit de monstre 4.mp3',
    '/sounds/bruit de monstre/bruit de monstre 2.mp3',
    '/sounds/bruit de monstre/bruit de monstre.wav',
  ],
  typhon: ['/sounds/bruit typhon/typhon.mp3', '/sounds/bruit typhon/typhon2.mp3'],
  rhumRound: ['/sounds/tournee de rhum.mp3'],
  rhumDefeat: ['/sounds/defaiterhum.mp3'],
  cards: ['/sounds/cartes.wav'],
  dice: ['/sounds/des.mp3'],
  timer: ['/sounds/timer.mp3'],
  corsair: ['/sounds/fregate corsaire.mp3'],
  anchor: ['/sounds/jeter lancre.mp3'],
  tequila: ['/sounds/tequilla.mp3'],
  bombeArtisanale: ['/sounds/bombe artisanale.mp3'],
  bateauEnBouteille: ['/sounds/bateau en bouteille.mp3'],
  poudreACanon: ['/sounds/poudre a canon.mp3'],
  captain: ['/sounds/capitaine.mp3'],
  battle: ['/sounds/bataille.wav'],
  parrot: [
    '/sounds/bruit de perroquet/perroquet5.mp3',
    '/sounds/bruit de perroquet/perroquet3.mp3',
    '/sounds/bruit de perroquet/perroquet2.mp3',
  ],
  parrotShare: ['/sounds/perroquepartage.mp3'],
  parrotToCrew: ['/sounds/perroquet a pirate.mp3'],
  crewToParrot: ['/sounds/equipage a perroquet.mp3'],
  peanut: [
    '/sounds/bruit cacahuète/cacachuete 3.mp3',
    '/sounds/bruit cacahuète/cacahuete 2.mp3',
    '/sounds/bruit cacahuète/cachuete.mp3',
  ],
};

const SOUND_VOLUME: Partial<Record<SoundKey, number>> = {
  background: 0.18,
  uiClick: 0.38,
  pirateIntro: 0.42,
  rhumSelect: 0.48,
  calmSea: 0.42,
  island: 0.48,
  monster: 0.5,
  typhon: 0.48,
  rhumRound: 0.5,
  rhumDefeat: 0.55,
  cards: 0.42,
  dice: 0.46,
  timer: 0.38,
  corsair: 0.5,
  anchor: 0.5,
  tequila: 0.5,
  parrot: 0.42,
  parrotShare: 0.48,
  parrotToCrew: 0.48,
  crewToParrot: 0.48,
  peanut: 0.5,
  battle: 0.55,
};

const SOUND_MAX_DURATION_MS: Partial<Record<SoundKey, number>> = {
  uiClick: 220,
  pirateIntro: 950,
  rhumSelect: 360,
  calmSea: 2200,
  island: 2400,
  monster: 2200,
  typhon: 2200,
  rhumRound: 1600,
  rhumDefeat: 2200,
  dice: 900,
  corsair: 2200,
  anchor: 1300,
  tequila: 1800,
  bombeArtisanale: 1800,
  bateauEnBouteille: 700,
  poudreACanon: 1500,
  captain: 2600,
  battle: 2600,
  parrot: 1200,
  parrotShare: 1800,
  parrotToCrew: 1800,
  crewToParrot: 1800,
  peanut: 1200,
};

type SoundOptions = {
  volume?: number;
  interrupt?: boolean;
  maxDuration?: number;
};

type ActiveSound = {
  audio: HTMLAudioElement;
  stopTimer: number | null;
  cleanup: () => void;
};

const audioCache = new Map<string, HTMLAudioElement>();
const activeSounds = new Map<SoundKey, Set<ActiveSound>>();
let backgroundAudio: HTMLAudioElement | null = null;

function canUseAudio(): boolean {
  return typeof Audio !== 'undefined';
}

function getRandomSource(key: SoundKey): string | null {
  const sources = SOUND_SOURCES[key];

  if (sources.length === 0) {
    return null;
  }

  return sources[Math.floor(Math.random() * sources.length)] ?? null;
}

function getAudio(source: string): HTMLAudioElement | null {
  if (!canUseAudio()) {
    return null;
  }

  const resolvedSource = encodeURI(source);
  const cachedAudio = audioCache.get(resolvedSource);

  if (cachedAudio) {
    return cachedAudio;
  }

  const audio = new Audio(resolvedSource);
  audio.preload = 'auto';
  audioCache.set(resolvedSource, audio);

  return audio;
}

function playAudio(audio: HTMLAudioElement): void {
  void audio.play().catch(() => {
    // Mobile Safari can reject audio until a valid user gesture unlocks it.
  });
}

function removeActiveSound(key: SoundKey, activeSound: ActiveSound): void {
  if (activeSound.stopTimer !== null) {
    window.clearTimeout(activeSound.stopTimer);
    activeSound.stopTimer = null;
  }

  const sounds = activeSounds.get(key);

  if (!sounds) {
    return;
  }

  sounds.delete(activeSound);

  if (sounds.size === 0) {
    activeSounds.delete(key);
  }
}

function stopActiveSound(activeSound: ActiveSound): void {
  activeSound.cleanup();
  activeSound.audio.pause();
  activeSound.audio.currentTime = 0;
}

function registerActiveSound(key: SoundKey, audio: HTMLAudioElement, maxDuration?: number): void {
  const handleEnded = () => removeActiveSound(key, activeSound);
  const activeSound: ActiveSound = {
    audio,
    stopTimer: null,
    cleanup: () => {
      audio.removeEventListener('ended', handleEnded);
      removeActiveSound(key, activeSound);
    },
  };

  audio.addEventListener('ended', handleEnded, { once: true });

  if (maxDuration !== undefined) {
    activeSound.stopTimer = window.setTimeout(() => {
      stopActiveSound(activeSound);
    }, maxDuration);
  }

  const sounds = activeSounds.get(key) ?? new Set<ActiveSound>();

  sounds.add(activeSound);
  activeSounds.set(key, sounds);
}

export function stopSound(key: SoundKey): void {
  const sounds = activeSounds.get(key);

  if (!sounds) {
    return;
  }

  for (const activeSound of [...sounds]) {
    stopActiveSound(activeSound);
  }
}

export function stopScreenSounds(): void {
  for (const key of activeSounds.keys()) {
    if (key === 'uiClick' || key === 'rhumSelect') {
      continue;
    }

    stopSound(key);
  }
}

export function playSound(key: SoundKey, options?: SoundOptions): void {
  const source = getRandomSource(key);

  if (!source) {
    return;
  }

  const baseAudio = getAudio(source);

  if (!baseAudio) {
    return;
  }

  if (options?.interrupt) {
    stopSound(key);
  }

  const audio = options?.interrupt ? baseAudio : (baseAudio.cloneNode(true) as HTMLAudioElement);
  audio.volume = options?.volume ?? SOUND_VOLUME[key] ?? 0.45;
  audio.currentTime = 0;

  registerActiveSound(key, audio, options?.maxDuration ?? SOUND_MAX_DURATION_MS[key]);
  playAudio(audio);
}

export function startBackgroundMusic(): void {
  const source = SOUND_SOURCES.background[0];

  if (!source) {
    return;
  }

  const audio = getAudio(source);

  if (!audio) {
    return;
  }

  backgroundAudio = audio;
  backgroundAudio.loop = true;
  backgroundAudio.volume = SOUND_VOLUME.background ?? 0.18;

  playAudio(backgroundAudio);
}

export function stopBackgroundMusic(): void {
  if (!backgroundAudio) {
    return;
  }

  backgroundAudio.pause();
  backgroundAudio.currentTime = 0;
}
