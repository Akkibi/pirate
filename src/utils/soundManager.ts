import { appSettings } from './appSettings';

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
    // '/sounds/UI global (click, sélection rhum)/clic 1.mp3',
    // '/sounds/UI global (click, sélection rhum)/clic 2.mp3',
    // '/sounds/UI global (click, sélection rhum)/clic 3.mp3',
    '/sounds/UI global (click, sélection rhum)/click1.opus',
    '/sounds/UI global (click, sélection rhum)/click2.opus',
    '/sounds/UI global (click, sélection rhum)/click3.opus',
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
  timer: ['/sounds/timer_with_drin.mp3'],
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
const BACKGROUND_FADE_SECONDS = 2.4;

// UI-critical sounds loaded first so they are ready before the first tap
const PRIORITY_SOUND_KEYS: SoundKey[] = [
  'uiClick',
  'rhumSelect',
  'cards',
  'dice',
  'parchmentSmall',
];

const SCREEN_PERSISTENT_SOUND_KEYS = new Set<SoundKey>(['battle', 'captain', 'rhumDefeat']);

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

// Abstract over Web Audio and HTML Audio backends
type ActiveSound = {
  initialVolume: number;
  stop(): void;
  cleanup(): void;
};

type BackgroundTrack = {
  audio: HTMLAudioElement;
  fadeFrame: number | null;
};

// === Web Audio API (SFX) ===
//
// Two-phase loading to comply with browsers' autoplay policy:
//   Phase 1 (initAudio, no user gesture needed): fetch all SFX as raw ArrayBuffers.
//   Phase 2 (first user gesture): create AudioContext, resume it, decode all raw buffers.
//
// AudioContext must only be created/resumed inside a user-gesture handler — creating it
// earlier causes Chrome to block it and throw "AudioContext was not allowed to start".

let audioCtx: AudioContext | null = null;
// Phase 1 cache: raw bytes, fetchable without AudioContext
const rawBufferCache = new Map<string, ArrayBuffer>();
const rawLoading = new Map<string, Promise<void>>();
// Phase 2 cache: decoded AudioBuffers, ready for zero-latency playback
const sfxBufferCache = new Map<string, AudioBuffer>();

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctx();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// Decode all pre-fetched raw buffers into AudioBuffers. Safe to call multiple times.
async function decodeAllRawBuffers(): Promise<void> {
  const ctx = getAudioCtx();
  if (!ctx) return;

  // Snapshot and clear rawBufferCache to prevent concurrent double-decode.
  const entries = [...rawBufferCache.entries()];
  for (const [url] of entries) rawBufferCache.delete(url);

  await Promise.all(
    entries.map(async ([url, ab]) => {
      if (sfxBufferCache.has(url)) return;
      try {
        const buf = await ctx.decodeAudioData(ab);
        sfxBufferCache.set(url, buf);
      } catch {
        // Unsupported format or detached buffer — silently skip.
      }
    })
  );
}

// Called only from within user-gesture handlers (e.g. playSound).
// Creates the AudioContext (the first time) and kicks off Phase 2 decoding.
function resumeAudioCtx(): void {
  const ctx = getAudioCtx(); // safe here — we are inside a user gesture
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    void ctx.resume().then(() => decodeAllRawBuffers());
  } else if (ctx.state === 'running') {
    void decodeAllRawBuffers();
  }
}

// Fetch a single SFX file as a raw ArrayBuffer (Phase 1, no AudioContext needed).
function fetchSfxRaw(source: string): Promise<void> {
  const url = encodeURI(source);
  if (rawBufferCache.has(url) || sfxBufferCache.has(url)) return Promise.resolve();

  const existing = rawLoading.get(url);
  if (existing) return existing;

  const promise = fetch(url)
    .then((r) => r.arrayBuffer())
    .then((ab) => {
      rawBufferCache.set(url, ab);
      rawLoading.delete(url);
    })
    .catch(() => {
      rawLoading.delete(url);
    });

  rawLoading.set(url, promise);
  return promise;
}

// Called from playViaHtmlAudio fallback so the buffer is ready for the next play.
function loadSfxBuffer(source: string): void {
  const url = encodeURI(source);
  if (sfxBufferCache.has(url) || rawBufferCache.has(url)) return;
  void fetchSfxRaw(source).then(() => {
    const ctx = getAudioCtx();
    if (ctx && ctx.state === 'running') void decodeAllRawBuffers();
  });
}

// Phase 1 only — fetch raw bytes so they are ready to decode on first user tap.
// Do NOT call getAudioCtx() here; that would trigger the "not allowed to start" error.
export function initAudio(): void {
  void (async () => {
    // Priority sounds load first — they must be ready before the first UI tap.
    const prioritySources = PRIORITY_SOUND_KEYS.flatMap((k) => SOUND_SOURCES[k] ?? []);
    await Promise.all(prioritySources.map((s) => fetchSfxRaw(s)));

    // Remaining SFX in the background.
    const prioritySet = new Set(PRIORITY_SOUND_KEYS as string[]);
    const restSources = Object.entries(SOUND_SOURCES)
      .filter(([k]) => k !== 'background' && !prioritySet.has(k))
      .flatMap(([, srcs]) => srcs);
    void Promise.all(restSources.map((s) => fetchSfxRaw(s)));
  })();
}

// === HTML Audio (background music only) ===
const htmlAudioCache = new Map<string, HTMLAudioElement>();

function canUseAudio(): boolean {
  return typeof Audio !== 'undefined';
}

function getHtmlAudio(source: string): HTMLAudioElement | null {
  if (!canUseAudio()) return null;

  const url = encodeURI(source);
  const cached = htmlAudioCache.get(url);
  if (cached) return cached;

  const audio = new Audio(url);
  audio.preload = 'auto';
  htmlAudioCache.set(url, audio);
  return audio;
}

// === Active sound tracking ===
const activeSounds = new Map<SoundKey, Set<ActiveSound>>();
const soundSourceIndexes = new Map<SoundKey, number>();
const backgroundTracks = new Set<BackgroundTrack>();
let backgroundAudio: BackgroundTrack | null = null;
let backgroundUnlockListenersAttached = false;

function getSoundSource(key: SoundKey): string | null {
  const sources = SOUND_SOURCES[key];

  if (sources.length === 0) return null;

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

function removeActiveSound(key: SoundKey, activeSound: ActiveSound): void {
  const sounds = activeSounds.get(key);
  if (!sounds) return;

  sounds.delete(activeSound);
  if (sounds.size === 0) activeSounds.delete(key);
}

function registerActiveSound(key: SoundKey, activeSound: ActiveSound): void {
  const sounds = activeSounds.get(key) ?? new Set<ActiveSound>();
  sounds.add(activeSound);
  activeSounds.set(key, sounds);
}

function stopActiveSound(activeSound: ActiveSound): void {
  activeSound.stop();
  activeSound.cleanup();
}

export function stopSound(key: SoundKey): void {
  const sounds = activeSounds.get(key);
  if (!sounds) return;

  for (const activeSound of [...sounds]) {
    stopActiveSound(activeSound);
  }
}

export function stopScreenSounds(): void {
  for (const key of [...activeSounds.keys()]) {
    if (key === 'uiClick' || key === 'rhumSelect') continue;
    if (SCREEN_PERSISTENT_SOUND_KEYS.has(key)) continue;
    stopSound(key);
  }
}

export function stopSoundEffects(): void {
  for (const key of [...activeSounds.keys()]) {
    if (key === 'background') continue;
    stopSound(key);
  }
}

// === Playback via Web Audio (zero-latency when buffer is cached) ===
function playViaWebAudio(source: string, volume: number, key: SoundKey): boolean {
  const ctx = getAudioCtx();
  if (!ctx) return false;

  const url = encodeURI(source);
  const buffer = sfxBufferCache.get(url);
  if (!buffer) return false;

  resumeAudioCtx();

  const sourceNode = ctx.createBufferSource();
  sourceNode.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.value = volume;
  sourceNode.connect(gainNode);
  gainNode.connect(ctx.destination);

  const activeSound: ActiveSound = {
    initialVolume: volume,
    stop() {
      try {
        sourceNode.stop();
      } catch {
        // already stopped
      }
    },
    cleanup() {
      removeActiveSound(key, activeSound);
    },
  };

  sourceNode.addEventListener('ended', () => removeActiveSound(key, activeSound), { once: true });
  registerActiveSound(key, activeSound);
  sourceNode.start(0);

  return true;
}

// === Playback via HTML Audio (fallback while buffers are loading) ===
function playViaHtmlAudio(source: string, volume: number, key: SoundKey, interrupt: boolean): void {
  const baseAudio = getHtmlAudio(source);
  if (!baseAudio) return;

  if (interrupt) stopSound(key);

  const audio = interrupt ? baseAudio : (baseAudio.cloneNode(true) as HTMLAudioElement);
  audio.volume = volume;
  audio.currentTime = 0;

  const handleEnded = () => removeActiveSound(key, activeSound);

  const activeSound: ActiveSound = {
    initialVolume: volume,
    stop() {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = this.initialVolume;
    },
    cleanup() {
      audio.removeEventListener('ended', handleEnded);
      removeActiveSound(key, activeSound);
    },
  };

  audio.addEventListener('ended', handleEnded, { once: true });
  registerActiveSound(key, activeSound);

  void audio.play().catch(() => {});

  // Kick off buffer loading for next time
  void loadSfxBuffer(source);
}

export function playSound(key: SoundKey, options?: SoundOptions): void {
  if (!appSettings.soundEffectsEnabled) return;

  if (appSettings.musicEnabled) resumeBackgroundMusic();

  resumeAudioCtx();

  const source = getSoundSource(key);
  if (!source) return;

  const volume = options?.volume ?? SOUND_VOLUME[key] ?? 0.45;

  if (options?.interrupt) stopSound(key);

  // Web Audio is zero-latency when the buffer is already decoded
  const playedViaWebAudio = playViaWebAudio(source, volume, key);

  if (!playedViaWebAudio) {
    // Buffer not yet loaded — use HTML Audio as fallback and load buffer for next time
    playViaHtmlAudio(source, volume, key, options?.interrupt ?? false);
  }

  if (shouldPlayPirateReaction(key)) {
    void playSound('pirateReaction');
  }
}

export function startBackgroundMusic(): void {
  if (!appSettings.musicEnabled) return;

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
  if (!source) return null;

  const baseAudio = getHtmlAudio(source);
  if (!baseAudio) return null;

  const audio = baseAudio.cloneNode(true) as HTMLAudioElement;
  audio.loop = true;
  audio.preload = 'auto';
  audio.currentTime = 0;
  audio.volume = 0;

  const track: BackgroundTrack = {
    audio,
    fadeFrame: null,
  };

  return track;
}

function startBackgroundTrack(): void {
  const nextTrack = createBackgroundTrack();

  if (!nextTrack) return;

  backgroundTracks.add(nextTrack);
  backgroundAudio = nextTrack;

  void playHtmlAudio(nextTrack.audio).then((didPlay) => {
    if (!didPlay) {
      cleanupBackgroundTrack(nextTrack);
      return;
    }

    fadeBackgroundTrack(nextTrack, getBackgroundVolume(), BACKGROUND_FADE_SECONDS);
  });
}

function playHtmlAudio(audio: HTMLAudioElement): Promise<boolean> {
  return audio.play().then(
    () => true,
    () => false
  );
}

function fadeBackgroundTrack(
  track: BackgroundTrack,
  targetVolume: number,
  durationSeconds: number,
  stopAfterFade = false
): void {
  if (typeof window === 'undefined') {
    track.audio.volume = targetVolume;
    if (stopAfterFade) cleanupBackgroundTrack(track);
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

    if (stopAfterFade) cleanupBackgroundTrack(track);
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

  if (backgroundAudio === track) backgroundAudio = null;
}

export function resumeBackgroundMusic(): void {
  if (!appSettings.musicEnabled) return;

  if (!backgroundAudio) {
    startBackgroundMusic();
    return;
  }

  for (const track of backgroundTracks) {
    if (!track.audio.paused) continue;

    void playHtmlAudio(track.audio).then((didPlay) => {
      if (!didPlay) return;

      if (track === backgroundAudio && track.audio.volume === 0) {
        fadeBackgroundTrack(track, getBackgroundVolume(), BACKGROUND_FADE_SECONDS);
      }
    });
  }
}

function attachBackgroundUnlockListeners(): void {
  if (backgroundUnlockListenersAttached || typeof window === 'undefined') return;

  backgroundUnlockListenersAttached = true;

  const resume = () => resumeBackgroundMusic();
  window.addEventListener('pointerdown', resume);
  window.addEventListener('keydown', resume);
}

export function stopBackgroundMusic(): void {
  for (const track of [...backgroundTracks]) {
    cleanupBackgroundTrack(track);
  }
}
