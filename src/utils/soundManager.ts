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
  | 'rhumNight'
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
  | 'parrotSurroundings'
  | 'parrotShare'
  | 'parrotToCrew'
  | 'crewToParrot'
  | 'peanut'
  | 'crewPeanut'
  | 'pirateReaction'
  | 'parchmentSmall';

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
  island: [
    '/sounds/abordageile.mp3',
    '/sounds/abordageile2.mp3',
    '/sounds/abordageile3.mp3',
    '/sounds/abordageile 4mp3.mp3',
    '/sounds/abordageile5.mp3',
  ],
  monster: [
    '/sounds/bruit de monstre.mp3',
    '/sounds/bruit de monstre 2.mp3',
    '/sounds/bruit de monstre 3.mp3',
    '/sounds/bruit de monstre 4.mp3',
  ],
  typhon: ['/sounds/typhon1.mp3', '/sounds/typhon2.mp3', '/sounds/typhon3.mp3'],
  rhumRound: ['/sounds/tournee de rhum.mp3'],
  rhumNight: ['/sounds/rhumnuit.mp3', '/sounds/rhumnuit2.mp3'],
  rhumDefeat: ['/sounds/defaiterhum.mp3'],
  cards: ['/sounds/cartes.wav'],
  dice: ['/sounds/des.mp3'],
  timer: ['/sounds/timer.mp3'],
  corsair: ['/sounds/fregate corsaire.mp3'],
  anchor: ['/sounds/jeter lancre.mp3'],
  tequila: ['/sounds/tequila.mp3'],
  bombeArtisanale: ['/sounds/bombeartisanale.mp3'],
  bateauEnBouteille: ['/sounds/bateau en bouteille.mp3'],
  poudreACanon: ['/sounds/poudreacanon.mp3'],
  captain: ['/sounds/victoire.mp3'],
  battle: ['/sounds/bataille.wav'],
  parrot: [
    '/sounds/bruit de perroquet/perroquet5.mp3',
    '/sounds/bruit de perroquet/perroquet3.mp3',
    '/sounds/bruit de perroquet/perroquet2.mp3',
  ],
  parrotSurroundings: ['/sounds/perroquetalentours.mp3', '/sounds/perroquetalentours2.mp3'],
  parrotShare: ['/sounds/perroquettuile.mp3', '/sounds/perroquettuile2.mp3'],
  parrotToCrew: ['/sounds/perroquet a pirate.mp3'],
  crewToParrot: ['/sounds/equipage a perroquet.mp3'],
  peanut: [
    '/sounds/bruit cacahuète/cacachuete 3.mp3',
    '/sounds/bruit cacahuète/cacahuete 2.mp3',
    '/sounds/bruit cacahuète/cachuete.mp3',
  ],
  crewPeanut: ['/sounds/a moi.mp3', '/sounds/a moi2.mp3', '/sounds/a moi3.mp3'],
  pirateReaction: [
    '/sounds/yaaar.mp3',
    '/sounds/yaaar2.mp3',
    '/sounds/yaaar3.mp3',
    '/sounds/yaaar4.mp3',
    '/sounds/ahaha.mp3',
    '/sounds/ahaha2.mp3',
  ],
  parchmentSmall: ['/sounds/papier/petit parchemin.wav'],
};

const SOUND_SELECTION_MODE: Partial<Record<SoundKey, 'roundRobin'>> = {
  rhumNight: 'roundRobin',
  parrotSurroundings: 'roundRobin',
  parrotShare: 'roundRobin',
};

const PIRATE_REACTION_TRIGGER_KEYS = new Set<SoundKey>([
  'calmSea',
  'island',
  'monster',
  'typhon',
  'rhumNight',
  'rhumDefeat',
  'corsair',
  'anchor',
  'tequila',
  'bombeArtisanale',
  'bateauEnBouteille',
  'poudreACanon',
  'captain',
  'battle',
  'parrot',
  'parrotSurroundings',
  'parrotShare',
  'parrotToCrew',
  'crewToParrot',
  'peanut',
  'crewPeanut',
]);

const PIRATE_REACTION_CHANCE = 0.12;
const BACKGROUND_CROSSFADE_SECONDS = 3;
const BACKGROUND_FADE_SECONDS = 2.4;

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
  rhumNight: 0.5,
  rhumDefeat: 0.55,
  cards: 0.42,
  dice: 0.46,
  timer: 0.38,
  corsair: 0.5,
  anchor: 0.5,
  tequila: 0.5,
  parrot: 0.42,
  parrotSurroundings: 0.48,
  parrotShare: 0.48,
  parrotToCrew: 0.48,
  crewToParrot: 0.48,
  peanut: 0.5,
  crewPeanut: 0.5,
  pirateReaction: 0.42,
  battle: 0.55,
  parchmentSmall: 0.38,
};

type SoundOptions = {
  volume?: number;
  interrupt?: boolean;
};

type ActiveSound = {
  audio: HTMLAudioElement;
  initialVolume: number;
  cleanup: () => void;
};

type BackgroundTrack = {
  audio: HTMLAudioElement;
  fadeFrame: number | null;
  startedNext: boolean;
};

const audioCache = new Map<string, HTMLAudioElement>();
const activeSounds = new Map<SoundKey, Set<ActiveSound>>();
const soundSourceIndexes = new Map<SoundKey, number>();
const backgroundTracks = new Set<BackgroundTrack>();
let backgroundAudio: BackgroundTrack | null = null;
let backgroundMonitorFrame: number | null = null;
let backgroundUnlockListenersAttached = false;

function canUseAudio(): boolean {
  return typeof Audio !== 'undefined';
}

function getSoundSource(key: SoundKey): string | null {
  const sources = SOUND_SOURCES[key];

  if (sources.length === 0) {
    return null;
  }

  if (SOUND_SELECTION_MODE[key] === 'roundRobin') {
    const currentIndex = soundSourceIndexes.get(key) ?? 0;
    const nextSource = sources[currentIndex % sources.length] ?? null;
    soundSourceIndexes.set(key, (currentIndex + 1) % sources.length);

    return nextSource;
  }

  return sources[Math.floor(Math.random() * sources.length)] ?? null;
}

function shouldPlayPirateReaction(key: SoundKey): boolean {
  return PIRATE_REACTION_TRIGGER_KEYS.has(key) && Math.random() < PIRATE_REACTION_CHANCE;
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

function playAudio(audio: HTMLAudioElement): Promise<boolean> {
  return audio.play().then(
    () => true,
    () => {
      // Mobile Safari can reject audio until a valid user gesture unlocks it.
      return false;
    }
  );
}

function removeActiveSound(key: SoundKey, activeSound: ActiveSound): void {
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
  activeSound.audio.volume = activeSound.initialVolume;
}

function registerActiveSound(key: SoundKey, audio: HTMLAudioElement): void {
  const handleEnded = () => removeActiveSound(key, activeSound);
  const activeSound: ActiveSound = {
    audio,
    initialVolume: audio.volume,
    cleanup: () => {
      audio.removeEventListener('ended', handleEnded);
      removeActiveSound(key, activeSound);
    },
  };

  audio.addEventListener('ended', handleEnded, { once: true });

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
  resumeBackgroundMusic();

  const source = getSoundSource(key);

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

  registerActiveSound(key, audio);
  void playAudio(audio);

  if (shouldPlayPirateReaction(key)) {
    playSound('pirateReaction');
  }
}

export function startBackgroundMusic(): void {
  attachBackgroundUnlockListeners();

  if (backgroundAudio) {
    resumeBackgroundMusic();
    return;
  }

  startBackgroundTrack();
}

function getBackgroundVolume(): number {
  return SOUND_VOLUME.background ?? 0.18;
}

function createBackgroundTrack(): BackgroundTrack | null {
  const source = SOUND_SOURCES.background[0];

  if (!source) {
    return null;
  }

  const baseAudio = getAudio(source);

  if (!baseAudio) {
    return null;
  }

  const audio = baseAudio.cloneNode(true) as HTMLAudioElement;
  audio.loop = false;
  audio.preload = 'auto';
  audio.currentTime = 0;
  audio.volume = 0;

  const track: BackgroundTrack = {
    audio,
    fadeFrame: null,
    startedNext: false,
  };

  audio.addEventListener('ended', () => {
    const shouldRestart = backgroundAudio === track;

    cleanupBackgroundTrack(track);

    if (shouldRestart) {
      startBackgroundTrack();
    }
  });

  return track;
}

function startBackgroundTrack(): void {
  const previousTrack = backgroundAudio;
  const nextTrack = createBackgroundTrack();

  if (!nextTrack) {
    return;
  }

  backgroundTracks.add(nextTrack);

  if (!previousTrack) {
    backgroundAudio = nextTrack;
  }

  void playAudio(nextTrack.audio).then((didPlay) => {
    if (!didPlay) {
      if (previousTrack) {
        previousTrack.startedNext = false;
        cleanupBackgroundTrack(nextTrack);
      }

      return;
    }

    backgroundAudio = nextTrack;
    fadeBackgroundTrack(nextTrack, getBackgroundVolume(), BACKGROUND_FADE_SECONDS);

    if (previousTrack && previousTrack !== nextTrack) {
      fadeBackgroundTrack(previousTrack, 0, BACKGROUND_FADE_SECONDS, true);
    }

    scheduleBackgroundMonitor();
  });
}

function fadeBackgroundTrack(
  track: BackgroundTrack,
  targetVolume: number,
  durationSeconds: number,
  stopAfterFade = false
): void {
  if (typeof window === 'undefined') {
    track.audio.volume = targetVolume;

    if (stopAfterFade) {
      cleanupBackgroundTrack(track);
    }

    return;
  }

  if (track.fadeFrame !== null) {
    window.cancelAnimationFrame(track.fadeFrame);
  }

  const startVolume = track.audio.volume;
  const startedAt = window.performance.now();

  const updateFade = (now: number) => {
    const elapsedSeconds = (now - startedAt) / 1000;
    const progress = Math.min(1, elapsedSeconds / durationSeconds);
    const easedProgress = progress * progress * (3 - 2 * progress);

    track.audio.volume = startVolume + (targetVolume - startVolume) * easedProgress;

    if (progress < 1) {
      track.fadeFrame = window.requestAnimationFrame(updateFade);
      return;
    }

    track.fadeFrame = null;
    track.audio.volume = targetVolume;

    if (stopAfterFade) {
      cleanupBackgroundTrack(track);
    }
  };

  track.fadeFrame = window.requestAnimationFrame(updateFade);
}

function cleanupBackgroundTrack(track: BackgroundTrack): void {
  if (track.fadeFrame !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(track.fadeFrame);
    track.fadeFrame = null;
  }

  track.audio.pause();
  track.audio.currentTime = 0;
  track.audio.volume = 0;
  backgroundTracks.delete(track);

  if (backgroundAudio === track) {
    backgroundAudio = null;
  }
}

function scheduleBackgroundMonitor(): void {
  if (typeof window === 'undefined' || backgroundMonitorFrame !== null) {
    return;
  }

  const tick = () => {
    backgroundMonitorFrame = null;
    monitorBackgroundMusic();

    if (backgroundTracks.size > 0) {
      scheduleBackgroundMonitor();
    }
  };

  backgroundMonitorFrame = window.requestAnimationFrame(tick);
}

function monitorBackgroundMusic(): void {
  const currentTrack = backgroundAudio;

  if (!currentTrack || currentTrack.audio.paused || currentTrack.startedNext) {
    return;
  }

  const { currentTime, duration } = currentTrack.audio;

  if (!Number.isFinite(duration) || duration <= BACKGROUND_CROSSFADE_SECONDS) {
    return;
  }

  if (duration - currentTime <= BACKGROUND_CROSSFADE_SECONDS) {
    currentTrack.startedNext = true;
    startBackgroundTrack();
  }
}

export function resumeBackgroundMusic(): void {
  if (!backgroundAudio) {
    startBackgroundMusic();
    return;
  }

  for (const track of backgroundTracks) {
    if (!track.audio.paused) {
      continue;
    }

    void playAudio(track.audio).then((didPlay) => {
      if (!didPlay) {
        return;
      }

      if (track === backgroundAudio && track.audio.volume === 0) {
        fadeBackgroundTrack(track, getBackgroundVolume(), BACKGROUND_FADE_SECONDS);
      }

      scheduleBackgroundMonitor();
    });
  }

  scheduleBackgroundMonitor();
}

function attachBackgroundUnlockListeners(): void {
  if (backgroundUnlockListenersAttached || typeof window === 'undefined') {
    return;
  }

  backgroundUnlockListenersAttached = true;

  const resume = () => resumeBackgroundMusic();

  window.addEventListener('pointerdown', resume);
  window.addEventListener('keydown', resume);
}

export function stopBackgroundMusic(): void {
  if (backgroundMonitorFrame !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(backgroundMonitorFrame);
    backgroundMonitorFrame = null;
  }

  for (const track of [...backgroundTracks]) {
    cleanupBackgroundTrack(track);
  }
}
