/**
 * Pastille « Démo » (HOMI) : compacte, toujours visible en haut de chaque écran tant que la démonstration est active.
 * La sortie est un vrai bouton (« Quitter la démo », ≥ 48 px de cible, lu « Quitter la démonstration » par les lecteurs
 * d'écran), jamais caché derrière un menu. Écran étroit (< 360 px) : « Démo » + bouton « Quitter » avec icône.
 * v5 : pastille compacte et discrète (surface + liseré, point corail), sortie en lien corail. Couleurs : thème uniquement.
 * Place réservée : les écrans décalent leur haut de `useDemoInset()` (src/components/demoInset.ts) tant qu'elle est affichée.
 */
import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, Text } from '@/components/ui';
import { leaveDemo, useBackendMode } from '@/lib/demoMode';
import { useAuth } from '@/lib/auth';
import { t as tr } from '@/i18n';
import { Tappable } from '@/components/Tappable';
import { useToast } from '@/components/Overlays';
import { friendlyErrorMessage } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, physicalShadow, radius } from '@/theme/tokens';
import { DEMO_LEAVE_HEIGHT, DEMO_PILL_HEIGHT, DEMO_PILL_TOP } from './demoInset';

// Dimensions partagées avec la réserve d'en-tête (`useDemoInset`) : la pastille ne recouvre jamais un en-tête
export { DEMO_LEAVE_HEIGHT, DEMO_PILL_HEIGHT } from './demoInset';

export function DemoBar() {
  const { isDemo, canLeave } = useBackendMode();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const t = useTheme();
  const narrow = useWindowDimensions().width < 360;
  const [leaving, setLeaving] = useState(false);
  const inFlight = useRef(false);
  if (!isDemo || !session) return null;
  const slop = Math.ceil((MIN_TOUCH - DEMO_LEAVE_HEIGHT) / 2);

  async function leave() {
    if (inFlight.current) return;
    inFlight.current = true;
    setLeaving(true);
    try {
      await leaveDemo();
      router.replace('/welcome');
    } catch (e) {
      toast(friendlyErrorMessage(e), 'error');
    } finally {
      inFlight.current = false;
      setLeaving(false);
    }
  }

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + DEMO_PILL_TOP, left: 0, right: 0, alignItems: 'center', zIndex: 50 }}>
      {/* v5 : petite pastille discrète (statut = capsule) — « Démo » + sortie toujours visible, sans aplat coloré */}
      <View
        testID="demo-pill"
        style={{ flexDirection: 'row', alignItems: 'center', height: DEMO_PILL_HEIGHT, paddingLeft: 10, paddingRight: canLeave ? 2 : 10, gap: 6, borderRadius: radius.pill, backgroundColor: t.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, boxShadow: physicalShadow('low', t.isDark) }}
      >
        <View accessible accessibilityRole="text" accessibilityLabel={tr('demo.badgeA11y')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.colors.accent }} />
          <Text variant="caption" weight="bold" muted maxFontSizeMultiplier={1.3}>{tr('demo.badgeShort')}</Text>
        </View>
        {canLeave ? (
          <>
            <View style={{ width: StyleSheet.hairlineWidth, height: 14, backgroundColor: t.colors.border }} />
            <Tappable
              testID="demo-leave"
              accessibilityRole="button"
              accessibilityLabel={tr('demo.leaveA11y')}
              accessibilityState={{ busy: leaving, disabled: leaving }}
              disabled={leaving}
              hitSlop={{ top: slop, bottom: slop, left: 4, right: 8 }}
              onPress={leave}
              // cible de 44 px de haut (le web ignore hitSlop) ; la pastille visible garde 28 px
              style={({ pressed }) => ({ minHeight: 44, marginVertical: -(44 - DEMO_LEAVE_HEIGHT) / 2, justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{ height: DEMO_LEAVE_HEIGHT, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {leaving ? <ActivityIndicator size="small" color={t.colors.primary} /> : <Icon name="log-out" size={13} color={t.colors.primary} />}
                <Text variant="caption" weight="bold" color={t.colors.primary} maxFontSizeMultiplier={1.3}>{tr(narrow ? 'demo.leave' : 'demo.leaveVisible')}</Text>
              </View>
            </Tappable>
          </>
        ) : null}
      </View>
    </View>
  );
}
