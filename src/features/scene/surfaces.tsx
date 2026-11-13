/**
 * Trois surfaces de la refonte « Keynote × Liquid Glass » (16/11/2026), en POINT D'INJECTION :
 *  - `OpticalSurface` : verre optique / halo — le point focal UNIQUE d'un écran (ex. prochaine action de l'Accueil) ;
 *  - `SmokedSurface`  : verre fumé — panneaux de détail, feuilles, synthèses ;
 *  - `MatteSurface`   : surface mate, lisible — listes, agenda, historique (aucun effet, contraste maximal).
 *
 * Implémentation par défaut : composants partagés existants (GlowCard, GlassSurface) et jetons du thème seulement.
 * Le design system (agent dédié, `src/components/surfaces/**`) les remplace SANS toucher aux écrans :
 *     registerSceneSurfaces({ OpticalSurface: MonVerreOptique, SmokedSurface: MonVerreFume, MatteSurface: MaSurfaceMate })
 * (mêmes props `SurfaceProps`). Aucune couleur écrite en dur ici.
 */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { GlowCard } from '@/components/GlowCard';
import { GlassSurface } from '@/components/Glass';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export interface SurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Marges intérieures (défaut : spacing.md). */
  padded?: number;
  testID?: string;
  /** Verre optique : moment de validation (filet de succès) au lieu de l'action. */
  tone?: 'action' | 'success';
}

function DefaultOptical({ children, style, padded = spacing.md, testID, tone = 'action' }: SurfaceProps) {
  return (
    <GlowCard active emphasis={tone === 'success' ? 'success' : 'action'} testID={testID} padded={false} style={style}
      contentStyle={{ padding: padded, gap: spacing.sm }}>
      {children}
    </GlowCard>
  );
}

function DefaultSmoked({ children, style, padded = spacing.md, testID }: SurfaceProps) {
  const t = useTheme();
  return (
    <View testID={testID}>
      <GlassSurface fill={t.tokens.surface.glassStrong} depth={2} padded={padded} style={style}>{children}</GlassSurface>
    </View>
  );
}

function DefaultMatte({ children, style, padded = spacing.md, testID }: SurfaceProps) {
  const t = useTheme();
  return (
    <View testID={testID} style={[{ backgroundColor: t.tokens.surface.opaque, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, padding: padded }, style]}>
      {children}
    </View>
  );
}

type Surfaces = { OpticalSurface: React.ComponentType<SurfaceProps>; SmokedSurface: React.ComponentType<SurfaceProps>; MatteSurface: React.ComponentType<SurfaceProps> };
const defaults: Surfaces = { OpticalSurface: DefaultOptical, SmokedSurface: DefaultSmoked, MatteSurface: DefaultMatte };
let injected: Partial<Surfaces> = {};

/** Point d'injection du design system (voir l'en-tête). `{}` : revenir aux surfaces par défaut. */
export function registerSceneSurfaces(s: Partial<Surfaces>) { injected = { ...s }; }

export function OpticalSurface(p: SurfaceProps) { const C = injected.OpticalSurface ?? defaults.OpticalSurface; return <C {...p} />; }
export function SmokedSurface(p: SurfaceProps) { const C = injected.SmokedSurface ?? defaults.SmokedSurface; return <C {...p} />; }
export function MatteSurface(p: SurfaceProps) { const C = injected.MatteSurface ?? defaults.MatteSurface; return <C {...p} />; }
