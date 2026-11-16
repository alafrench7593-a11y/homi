/**
 * Schéma des 20 dents de lait (HOMI v5) : deux arcades vues de face, chaque dent à sa forme (molaires larges,
 * canines, incisives étroites), repères « Haut / Bas » et « Sa droite / Sa gauche » (vu de face, la droite de
 * l'enfant est à gauche de l'écran), légende (notée, pas encore, souvent la première).
 * Dent notée : aplat corail + coche (pas la couleur seule). Dents « souvent les premières » (incisives centrales du
 * bas) : contour en pointillés tant qu'aucune dent n'est notée. Chaque dent est une case à cocher nommée
 * (« Incisive centrale en bas, droite »), qui ouvre la fiche de la dent.
 * Aucune animation en lecture ; l'appui répond par une légère réduction (Tappable).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text } from '@/components/ui';
import { PRIMARY_TEETH } from '@/lib/domain/childCare';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

type Kind = 'molar' | 'canine' | 'incisor';
/** Type de dent d'après sa place dans l'arcade (0-4 côté droit : 2e molaire → incisive centrale ; 5-9 : l'inverse). */
export function toothKind(index: number): Kind {
  const k = index < 5 ? index : 9 - index;
  return k <= 1 ? 'molar' : k === 2 ? 'canine' : 'incisor';
}
/** Incisives centrales du bas : les premières à percer chez beaucoup d'enfants (repère, jamais une norme). */
export const FIRST_TEETH = new Set(['b-r-4', 'b-l-0']);

const SIZE: Record<Kind, { w: number; h: number; r: number }> = {
  molar: { w: 30, h: 28, r: 9 },
  canine: { w: 24, h: 30, r: 11 },
  incisor: { w: 22, h: 28, r: 6 },
};

export function TeethMap({ present, onPick, hintFirst }: { present: Set<string>; onPick: (label: string) => void; hintFirst?: boolean }) {
  const t = useTheme();
  const [W, setW] = useState(300);
  const rx = W * 0.4;
  const ry = 84;
  const pad = 22;
  const mid = 64;
  const H = (ry + pad) * 2 + mid;
  const place = (arch: 'top' | 'bottom', index: number) => {
    const a = Math.PI * (0.06 + (index / 9) * 0.88);
    const x = W / 2 - Math.cos(a) * rx;
    const lift = ry * (1 - Math.sin(a));
    const y = arch === 'top' ? pad + lift : H - pad - lift;
    const tilt = ((a * 180) / Math.PI - 90) * 0.55;
    return { x, y, rot: arch === 'top' ? tilt : -tilt };
  };
  const off = t.colors.textMuted;
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm }} onLayout={(e) => { const w = Math.min(320, Math.floor(e.nativeEvent.layout.width)); if (w > 0 && w !== W) setW(w); }}>
      <View style={{ width: W, height: H }} accessibilityLabel={tr('h5.teeth.chartA11y', { n: present.size })} testID="teeth-map">
        {/* repères au centre : haut / bas, et les côtés de l'enfant */}
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: ry + pad + 4, height: mid - 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="caption" weight="bold" muted>↑ {tr('h5.teeth.upper')}</Text>
          <Text variant="caption" weight="bold" muted>↓ {tr('h5.teeth.lower')}</Text>
        </View>
        <Text variant="caption" muted style={{ position: 'absolute', left: 0, top: ry + pad + mid / 2 - 9 }} accessibilityElementsHidden importantForAccessibility="no">{tr('h5.teeth.right')}</Text>
        <Text variant="caption" muted style={{ position: 'absolute', right: 0, top: ry + pad + mid / 2 - 9, textAlign: 'right' }} accessibilityElementsHidden importantForAccessibility="no">{tr('h5.teeth.left')}</Text>
        {PRIMARY_TEETH.map((d) => {
          const p = place(d.arch, d.index);
          const s = SIZE[toothKind(d.index)];
          const on = present.has(d.label);
          const first = hintFirst && !on && FIRST_TEETH.has(d.id);
          const box = 36;
          return (
            <Tappable key={d.id} testID={`tooth-${d.id}`} accessibilityRole="checkbox" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={d.label}
              onPress={() => { haptic('selection'); onPick(d.label); }} hitSlop={4} pressScale={0.9} hoverLift={0}
              style={{ position: 'absolute', left: p.x - box / 2, top: p.y - box / 2, width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: s.w, height: s.h, borderRadius: s.r, transform: [{ rotate: `${p.rot}deg` }], alignItems: 'center', justifyContent: 'center',
                backgroundColor: on ? t.colors.primary : first ? t.colors.surface : t.colors.surfaceAlt,
                borderWidth: on ? 0 : first ? 2 : 1.5, borderStyle: first ? 'dashed' : 'solid', borderColor: first ? t.colors.primary : off }}>
                {on ? <Icon name="check" size={14} color={t.colors.primaryText} /> : null}
              </View>
            </Tappable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: spacing.md, rowGap: spacing.xs }} testID="teeth-legend">
        <Legend label={tr('h5.teeth.legendOn')}><View style={{ width: 16, height: 16, borderRadius: 5, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={10} color={t.colors.primaryText} /></View></Legend>
        <Legend label={tr('h5.teeth.legendOff')}><View style={{ width: 16, height: 16, borderRadius: 5, backgroundColor: t.colors.surfaceAlt, borderWidth: 1.5, borderColor: off }} /></Legend>
        {hintFirst ? <Legend label={tr('h5.teeth.legendFirst')}><View style={{ width: 16, height: 16, borderRadius: 5, borderWidth: 2, borderStyle: 'dashed', borderColor: t.colors.primary }} /></Legend> : null}
      </View>
    </View>
  );
}

function Legend({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {children}
      <Text variant="caption" muted>{label}</Text>
    </View>
  );
}
