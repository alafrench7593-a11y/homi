/**
 * Scène de la refonte (16/11/2026) : surfaces, transition carte → détail et commandes partagées, chacune avec un
 * point d'injection pour le design system (voir chaque fichier). Les écrans de la tranche Accueil + Missions
 * n'importent que d'ici : la refonte s'y applique sans modifier les écrans.
 */
export { MatteSurface, OpticalSurface, SmokedSurface, registerSceneSurfaces, type SurfaceProps } from './surfaces';
export { CardSource, DetailScene, SCENE_MS, lastOpenedCard, registerCardDetailTransition, type CardSourceProps, type DetailSceneProps } from './cardDetail';
export { DataTile, MemberSelector, registerSceneControls, type DataTileProps, type MemberOption, type MemberSelectorProps } from './controls';
export { useListLayout } from './layout';

// Design system v3 branché dès le premier import de la scène
import { bindSceneToDesignSystem } from './v3Bindings';
bindSceneToDesignSystem();
