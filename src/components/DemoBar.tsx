/**
 * Pastille « Démo » (HOMI) : compacte, toujours visible en haut de chaque écran tant que la démonstration est active.
 * La sortie est un vrai bouton (« Quitter la démo », ≥ 48 px de cible, lu « Quitter la démonstration » par les lecteurs
 * d'écran), jamais caché derrière un menu. Écran étroit (< 360 px) : « Démo » + bouton « Quitter » avec icône.
 * Couleurs : verre flottant du thème (aucune valeur en dur).
 */
import React, { useRef, useState } from 'react';
import { ActivityIndicator, useWindowDimensions, View } from 'react-native';
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

/** Hauteur visible de la pastille et de son bouton ; la cible tactile du bouton est complétée à 48 px par `hitSlop`. */
export const DEMO_PILL_HEIGHT = 34;
export const DEMO_LEAVE_HEIGHT = DEMO_PILL_HEIGHT - 6;

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
  const glass = t.material.glass.floating;
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
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 4, left: 0, right: 0, alignItems: 'center', zIndex: 50 }}>
      <View
        testID="demo-pill"
        style={{ flexDirection: 'row', alignItems: 'center', height: DEMO_PILL_HEIGHT, paddingLeft: 12, paddingRight: canLeave ? 3 : 12, gap: 8, borderRadius: radius.pill, backgroundColor: glass.fill, borderWidth: 1, borderColor: glass.edge, boxShadow: physicalShadow('mid', t.isDark) }}
      >
        <View accessible accessibilityRole="text" accessibilityLabel={tr('demo.badgeA11y')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.primary }} />
          <Text variant="caption" weight="bold" maxFontSizeMultiplier={1.3}>{tr(narrow ? 'demo.badgeShort' : 'demo.badge')}</Text>
        </View>
        {canLeave ? (
          <Tappable
            testID="demo-leave"
            accessibilityRole="button"
            accessibilityLabel={tr('demo.leaveA11y')}
            accessibilityState={{ busy: leaving, disabled: leaving }}
            disabled={leaving}
            hitSlop={{ top: slop, bottom: slop, left: 4, right: 8 }}
            onPress={leave}
            style={({ pressed }) => ({ height: DEMO_LEAVE_HEIGHT, paddingHorizontal: 12, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.colors.primary, opacity: pressed ? 0.85 : 1 })}
          >
            {leaving ? <ActivityIndicator size="small" color={t.colors.primaryText} /> : <Icon name="log-out" size={14} color={t.colors.primaryText} />}
            <Text variant="caption" weight="bold" color={t.colors.primaryText} maxFontSizeMultiplier={1.3}>{tr(narrow ? 'demo.leave' : 'demo.leaveVisible')}</Text>
          </Tappable>
        ) : null}
      </View>
    </View>
  );
}
