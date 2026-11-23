/**
 * Personnages de « Notre histoire » : croquis au fil doré (comme le logo), tirés des images ElevenLabs du 26/10/2026 : la même femme que dans la vidéo
 * de fond, à chaque étape de STORY_CHAPTERS, détourée (fond transparent) pour se poser sur le ciel de l'application.
 * HOMI (13/11/2026) : affichées teintées en silhouette lilas (FamilyStoryArt, STORY_TINT) ; illustrations HOMI dédiées à produire.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
export const STORY_IMAGES: number[] = [
  require('../../../assets/story/etape-01.png'),
  require('../../../assets/story/etape-02.png'),
  require('../../../assets/story/etape-03.png'),
  require('../../../assets/story/etape-04.png'),
  require('../../../assets/story/etape-05.png'),
  require('../../../assets/story/etape-06.png'),
  require('../../../assets/story/etape-07.png'),
  require('../../../assets/story/etape-08.png'),
  require('../../../assets/story/etape-09.png'),
  require('../../../assets/story/etape-10.png'),
];
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Mini-vidéos au fil d'or (Kling 3 Pro via ElevenLabs, 26/10/2026) converties en WebP animé à fond transparent :
 * même étape que STORY_IMAGES, le trait respire et bouge doucement en boucle.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
export const STORY_ANIMS: number[] = [
  require('../../../assets/story/anim-01.webp'),
  require('../../../assets/story/anim-02.webp'),
  require('../../../assets/story/anim-03.webp'),
  require('../../../assets/story/anim-04.webp'),
  require('../../../assets/story/anim-05.webp'),
  require('../../../assets/story/anim-06.webp'),
  require('../../../assets/story/anim-07.webp'),
  require('../../../assets/story/anim-08.webp'),
  require('../../../assets/story/anim-09.webp'),
  require('../../../assets/story/anim-10.webp'),
];
/* eslint-enable @typescript-eslint/no-require-imports */
