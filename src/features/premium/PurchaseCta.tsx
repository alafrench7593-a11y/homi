/**
 * Bouton d'achat et conditions tarifaires — MÊME bloc sur l'écran Premium (/premium, écran réservé) et sur la page
 * d'abonnement (Réglages › Abonnement) : les deux écrans ne peuvent pas dire deux choses différentes.
 *  - Le bouton dit exactement ce qui se passe (« Commencer l'essai de 3 jours » / « S'abonner — 119,99 € / an ») ;
 *  - juste dessous, donc visibles en même temps que lui SANS défiler : ce qui est prélevé et quand, puis le
 *    renouvellement automatique écrit en clair (montant et période) ;
 *  - `PurchaseFinePrint` : comment annuler, origine du prix (boutique, ou grille de démonstration signalée).
 * Sans essai confirmé par la boutique pour cette personne, aucune ligne ne parle d'essai (purchaseTerms).
 * Mouvement : léger ressort du bouton quand son libellé change ; rien avec Réduire les animations (useMotion).
 */
import React, { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence } from 'react-native-reanimated';
import { Button, Text } from '@/components/ui';
import type { Plan } from '@/lib/premium/plans';
import { useMotion } from '@/motion';
import { spacing } from '@/theme/tokens';
import { ctaLabel, purchaseTerms } from './paywallModel';

type TermsPlan = Pick<Plan, 'trialDays' | 'price' | 'period' | 'demo'>;

export function PurchaseCta({ plan, label, chargeLine, loading, disabled, onPress, now, testID = 'pw2-buy' }: {
  plan: TermsPlan;
  /** Libellé imposé (changement de formule) ; par défaut celui de la formule choisie. */
  label?: string;
  /** Phrase « ce qui est prélevé et quand » imposée (changement de formule) ; `null` : aucune. */
  chargeLine?: string | null;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
  /** Date de référence (tests) */
  now?: Date;
  testID?: string;
}) {
  const m = useMotion();
  const s = useSharedValue(1);
  const first = useRef(true);
  const text = label ?? ctaLabel(plan);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (m.off) return;
    s.value = withSequence(m.timing(0.97, 90, 'standard') as number, m.spring(1, 'rebondLeger') as number);
  }, [text, m, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const terms = purchaseTerms(plan, Platform.OS, now);
  const charge = chargeLine === undefined ? terms[0].text : chargeLine;
  const renew = terms[1].text;
  return (
    <View style={{ gap: spacing.xs }} testID="pw2-cta">
      <Animated.View style={style}>
        <Button label={text} size="lg" full loading={loading} disabled={disabled} onPress={onPress} accessibilityHint={[charge, renew].filter(Boolean).join(' ')} testID={testID} />
      </Animated.View>
      <View style={{ gap: 2 }} testID="pw2-cta-terms">
        {charge ? <Text variant="small" center testID="pw2-cta-hint">{charge}</Text> : null}
        <Text variant="small" weight="medium" center testID="pw2-renew">{renew}</Text>
      </View>
    </View>
  );
}

/** Comment annuler, et d'où vient le prix affiché. */
export function PurchaseFinePrint({ plan, now, omitCancel = false }: { plan: TermsPlan; now?: Date; /** La marche à suivre pour annuler est déjà affichée juste au-dessus (chronologie de l'essai). */ omitCancel?: boolean }) {
  const terms = purchaseTerms(plan, Platform.OS, now).slice(2).filter((l) => !(omitCancel && l.key === 'cancel'));
  return (
    <View style={{ gap: 4 }} testID="pw2-fine">
      {terms.map((l) => <Text key={l.key} variant="caption" muted>{l.text}</Text>)}
    </View>
  );
}
