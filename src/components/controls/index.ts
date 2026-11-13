/**
 * Famille de commandes HOMI v3 (HOMI_DESIGN_SYSTEM.md § 5) — une source pour les courbes, reflets, teintes, ombres
 * et opacités ; états repos / pression / focus / sélection / chargement / succès / erreur / désactivé selon le rôle.
 *   import { PrimaryButton, SecondaryButton, SensitiveButton, IconOrb, ChoiceGroup, DataTile, Sparkline } from '@/components/controls';
 */
export { PrimaryButton, SecondaryButton, SensitiveButton } from './Buttons';
export { IconOrb, ORB_SIZE } from './IconOrb';
export { CHECK_MIN_WIDTH, CHOICE, ChoiceGroup, orbCenter, orbGatherOffset, type ChoiceOption } from './ChoiceGroup';
export { DataTile, Sparkline, sparkPoints, tileTint, type DataTileProps, type TileTint } from './DataTile';
