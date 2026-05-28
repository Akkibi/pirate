type SoundKey =
  | 'background'
  | 'uiClick'
  | 'calmSea'
  | 'island'
  | 'monster'
  | 'typhon'
  | 'rhumRound'
  | 'bombeArtisanale'
  | 'bateauEnBouteille'
  | 'poudreACanon'
  | 'captain'
  | 'battle'
  | 'parrot'
  | 'peanut';

const SOUND_SOURCES: Record<SoundKey, string[]> = {
  background: ['/sounds/bandeson.mp3'],
  uiClick: [
    '/sounds/bruit ui action-clic equipage/pirate 4.wav',
    '/sounds/bruit ui action-clic equipage/pirate2.wav',
    '/sounds/bruit ui action-clic equipage/pirate1.mp3',
    '/sounds/bruit ui action-clic equipage/pirate3.mp3',
  ],
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
  peanut: [
    '/sounds/bruit cacahuète/cacachuete 3.mp3',
    '/sounds/bruit cacahuète/cacahuete 2.mp3',
    '/sounds/bruit cacahuète/cachuete.mp3',
  ],
};

const SOUND_VOLUME: Partial<Record<SoundKey, number>> = {
  background: 0.18,
  uiClick: 0.38,
  calmSea: 0.42,
  island: 0.48,
  monster: 0.5,
  typhon: 0.48,
  rhumRound: 0.5,
  parrot: 0.42,
  peanut: 0.5,
  battle: 0.55,
};

const audioCache = new Map<string, HTMLAudioElement>();
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

export function playSound(key: SoundKey, options?: { volume?: number; interrupt?: boolean }): void {
  const source = getRandomSource(key);

  if (!source) {
    return;
  }

  const baseAudio = getAudio(source);

  if (!baseAudio) {
    return;
  }

  const audio = options?.interrupt ? baseAudio : (baseAudio.cloneNode(true) as HTMLAudioElement);
  audio.volume = options?.volume ?? SOUND_VOLUME[key] ?? 0.45;
  audio.currentTime = 0;

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
