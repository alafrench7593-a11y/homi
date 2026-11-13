/**
 * Branchement du design system v3 sur les points d'injection de la tranche Accueil + Missions.
 *  - Surfaces : verre optique / verre givré-fumé / surface mate de `@/components/surfaces`.
 *  - Tuile de résultat : `DataTile` de `@/components/controls` (lumière intérieure, état vide explicite).
 * Conservés volontairement : la transition carte → détail de la tranche (retour à la même ligne + focus, vérifié en E2E)
 * et son sélecteur de membre (avatars + prénoms, que `ChoiceGroup` n'affiche pas).
 */
import React from 'react';
import { View } from 'react-native';
import { DataTile as V3DataTile, type TileTint } from '@/components/controls';
import { FrostedGlass, MatteSurface as V3Matte, OpticalGlass } from '@/components/surfaces';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { registerSceneControls, type DataTileProps } from './controls';
import { registerSceneSurfaces, type SurfaceProps } from './surfaces';

function Optical({ children, style, padded = spacing.md, testID, tone = 'action' }: SurfaceProps) {
  const t = useTheme();
  return (
    <View testID={testID} style={style}>
      <OpticalGlass padded={padded} contentStyle={{ gap: spacing.sm }} shadow
        tint={tone === 'success' ? t.tokens.status.success : undefined}>
        {children}
      </OpticalGlass>
    </View>
  );
}
function Smoked({ children, style, padded = spacing.md, testID }: SurfaceProps) {
  return <View testID={testID} style={style}><FrostedGlass padded={padded} contentStyle={{ gap: spacing.sm }}>{children}</FrostedGlass></View>;
}
function Matte({ children, style, padded = spacing.md, testID }: SurfaceProps) {
  return <View testID={testID} style={style}><V3Matte padded={padded} contentStyle={{ gap: spacing.sm }}>{children}</V3Matte></View>;
}

const TONE: Record<NonNullable<DataTileProps['tone']>, TileTint> = { accent: 'accent', calm: 'accent2', done: 'success' };
function Tile({ value, label, context, empty, icon, tone = 'calm', onPress, testID }: DataTileProps) {
  return <V3DataTile label={label} value={value} context={context} emptyText={empty} icon={icon} tint={TONE[tone]} onPress={onPress} testID={testID} />;
}

let done = false;
export function bindSceneToDesignSystem() {
  if (done) return;
  done = true;
  registerSceneSurfaces({ OpticalSurface: Optical, SmokedSurface: Smoked, MatteSurface: Matte });
  registerSceneControls({ DataTile: Tile });
}
