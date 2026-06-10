const IMAGES = {
  'action_cards/action_card_observerlesalentours':
    '/images/action_cards/action_card_observerlesalentours.webp',
  'action_cards/action_card_partagerdesinformations':
    '/images/action_cards/action_card_partagerdesinformations.webp',
  'action_cards/action_card_repererlescorsaires':
    '/images/action_cards/action_card_repererlescorsaires.webp',
  'animations/rhum_anim_1': '/images/animations/rhum_anim_1.webp',
  'animations/rhum_anim_2': '/images/animations/rhum_anim_2.webp',
  'animations/rhum_anim_3': '/images/animations/rhum_anim_3.webp',
  'animations/rhum_anim_4': '/images/animations/rhum_anim_4.webp',
  'animations/rhum_anim_5': '/images/animations/rhum_anim_5.webp',
  'arrow-down-red': '/images/arrow-down-red.webp',
  'arrow-down': '/images/arrow-down.webp',
  'arrow-left-red': '/images/arrow-left-red.webp',
  'arrow-left': '/images/arrow-left.webp',
  'arrow-right-red': '/images/arrow-right-red.webp',
  'arrow-right': '/images/arrow-right.webp',
  'arrow-up-red': '/images/arrow-up-red.webp',
  'arrow-up': '/images/arrow-up.webp',
  background: '/images/background.webp',
  bg: '/images/bg.webp',
  boundstexture: '/images/boundstexture.webp',
  'cards/bateauenbouteille': '/images/cards/bateauenbouteille.webp',
  'cards/bombeartisanale': '/images/cards/bombeartisanale.webp',
  'cards/cacahuete': '/images/cards/cacahuete.webp',
  'cards/capitaine': '/images/cards/capitaine.webp',
  'cards/depipe': '/images/cards/depipe.webp',
  'cards/dos': '/images/cards/dos.webp',
  'cards/jeterlancre': '/images/cards/jeterlancre.webp',
  'cards/lenvolee': '/images/cards/lenvolee.webp',
  'cards/poudreacanon': '/images/cards/poudreacanon.webp',
  'cards/tequila': '/images/cards/tequila.webp',
  clouds: '/images/clouds.webp',
  corsaires: '/images/corsaires.webp',
  'dice-bg': '/images/dice-bg.webp',
  'dice/d3': '/images/dice/d3.webp',
  'dice/de0': '/images/dice/de0.webp',
  'dice/de1': '/images/dice/de1.webp',
  'dice/de2': '/images/dice/de2.webp',
  equipage: '/images/equipage.webp',
  'indicators/peanut': '/images/indicators/peanut.webp',
  'indicators/picto_aurore': '/images/indicators/picto_aurore.webp',
  'indicators/picto_journee': '/images/indicators/picto_journee.webp',
  'indicators/picto_matinee': '/images/indicators/picto_matinee.webp',
  'indicators/picto_nuit': '/images/indicators/picto_nuit.webp',
  'indicators/rhum_empty': '/images/indicators/rhum_empty.webp',
  'indicators/rhum_full': '/images/indicators/rhum_full.webp',
  'logo/bussole_aiguilles': '/images/logo/bussole_aiguilles.webp',
  'logo/bussole_epingle': '/images/logo/bussole_epingle.webp',
  'logo/captain_logo_withoutboussole2': '/images/logo/captain_logo_withoutboussole2.webp',
  'masks/anchor': '/images/masks/anchor.svg',
  'masks/wheel': '/images/masks/wheel.svg',
  'mise-en-place': '/images/mise-en-place.webp',
  'parchment/background': '/images/parchment/background.webp',
  'parchment/left_end': '/images/parchment/left_end.webp',
  'parchment/phase_parent': '/images/parchment/phase_parent.svg',
  'parchment/right_end': '/images/parchment/right_end.webp',
  'physical_assets/exchange': '/images/physical_assets/exchange.png',
  'physical_assets/island': '/images/physical_assets/island.webp',
  'physical_assets/move': '/images/physical_assets/move.png',
  'physical_assets/octopus': '/images/physical_assets/octopus.webp',
  'physical_assets/typhon': '/images/physical_assets/typhon.webp',
  perroquet: '/images/perroquet.webp',
  point: '/images/point.webp',
  'screen-border': '/images/screen-border.webp',
} as const;

export type ImageKey = keyof typeof IMAGES;

export class ImagesLoader {
  private static cache = new Map<ImageKey, HTMLImageElement>();

  static async preloadAll(onProgress?: (progress: number) => void): Promise<void> {
    const entries = Object.entries(IMAGES) as [ImageKey, string][];
    const total = entries.length;
    let loaded = 0;

    const promises = entries.map(
      ([key, src]) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            void (async () => {
              try {
                await img.decode();
              } catch {
                // onload already confirmed the image is available.
              }

              this.cache.set(key, img);
              loaded++;
              onProgress?.(Math.round((loaded / total) * 100));
              resolve();
            })();
          };
          img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
          img.src = src;
        })
    );
    await Promise.all(promises);
  }

  static get(key: ImageKey): HTMLImageElement {
    const img = this.cache.get(key);
    if (!img) throw new Error(`Image not loaded: ${key}. Call ImagesLoader.load() first.`);
    return img;
  }
}
