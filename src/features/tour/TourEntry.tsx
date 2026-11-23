/**
 * Points d'entrée de la visite guidée :
 *  - `TourOfferStep` : dernier temps de l'onboarding, APRÈS la révélation et l'écran Premium (« Faire la visite
 *    (2 min) » / « Plus tard ») ;
 *  - `TourResumeCard` : petite carte discrète de l'accueil quand une visite a été interrompue (« Reprendre la visite ·
 *    3 sur 7 ») ou remise à plus tard, masquable ;
 *  - `PracticeBanner` : bandeau des formulaires ouverts en mode exercice (rien n'est enregistré) ;
 *  - `useTourAllowed` : jamais pour un compte qui n'est que nounou, ni pendant une urgence.
 * La relance (« Revoir la visite guidée ») est dans Réglages et dans la feuille de l'avatar (`startTour`).
 */
import React, { useEffect, useState } from 'react';
import { glassEdge } from '@/components/glass/GlassRim';
import { View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { GlassButton, GlassIconButton } from '@/components/glass';
import { Icon, Text } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { useMemberships } from '@/lib/data/hooks';
import { useAccess } from '@/lib/data/hooks-access';
import { gateFor, type GateDecision } from '@/lib/premium/access';
import { useBackendMode } from '@/lib/demoMode';
import { isCaregiverOnly } from '@/lib/domain/nounou';
import { isPracticeActive, onPracticeChange } from '@/lib/practice';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { emergencyRecent, isEmergencyPath, showResumeCard, TOUR_LENGTH } from './model';
import { lastEmergencyCall, startTour, tourDispatch, useTourProgress, useTourStore } from './store';

/** La visite peut-elle être proposée ici et maintenant ? */
export function useTourAllowed(): boolean {
  const caregiverOnly = isCaregiverOnly(useMemberships().data);
  const pathname = usePathname();
  return !caregiverOnly && !isEmergencyPath(pathname) && !emergencyRecent(lastEmergencyCall(), Date.now());
}

/**
 * L'écran `path` est-il ouvert (pas recouvert par l'écran Premium du verrouillage strict) ? Même lecture que
 * `PremiumGate` (une seule requête has_premium pour toute l'application). La visite ne se pose jamais sous ce voile.
 */
export function useScreenGate(path: string): GateDecision {
  const { session } = useAuth();
  const q = useQuery({ queryKey: [session?.userId, 'subscriptions', 'premium'], queryFn: () => backend.rpc<boolean>('has_premium'), enabled: !!session, staleTime: 60_000 });
  const access = useAccess();
  // Même décision que l'écran Premium (src/components/PremiumGate.tsx), y compris la visite sans compte (démonstration)
  const { isDemo } = useBackendMode();
  const premium = q.data === true ? true : q.data === false || q.isError ? false : undefined;
  return gateFor(path, premium, access.data ?? null, { visit: isDemo });
}

/** Écran ouvert pour ce compte (une vérification en cours ne compte pas comme ouvert). */
export function useScreenOpen(path: string): boolean {
  return useScreenGate(path) === 'open';
}

/** Contenu du temps « Visite guidée » de l'onboarding (les boutons sont dans le pied de l'écran). */
export function TourOfferStep() {
  const t = useTheme();
  const items = ['home', 'profile', 'tools', 'quick'] as const;
  return (
    <View style={{ gap: spacing.md }} testID="onb-tour">
      <View style={{ gap: spacing.xs }}>
        <Text variant="title" accessibilityRole="header">{tr('tour.offer.title')}</Text>
        <Text muted>{tr('tour.offer.body')}</Text>
      </View>
      <View style={{ gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg, ...glassEdge(t), backgroundColor: t.colors.surface }}>
        {items.map((k) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name="check" size={16} color={t.colors.primary} />
            <Text variant="small" style={{ flex: 1 }}>{tr(`tour.step.${k}.title` as TKey)}</Text>
          </View>
        ))}
        <Text variant="caption" muted>{tr('tour.offer.safe')}</Text>
      </View>
    </View>
  );
}

/** Visite proposée à la fin de l'onboarding : « Faire la visite » lance, « Plus tard » la garde sur l'accueil. */
export function acceptTourOffer() { startTour(); }
export function deferTourOffer() { tourDispatch({ type: 'offer' }); }

/** Carte « Reprendre la visite · 3 sur 7 » (accueil), masquable. */
export function TourResumeCard() {
  const t = useTheme();
  const p = useTourProgress();
  const owner = useTourStore((s) => s.owner);
  const allowed = useTourAllowed();
  const caregiverOnly = isCaregiverOnly(useMemberships().data);
  if (!owner || !allowed || !showResumeCard(p, { caregiverOnly, emergency: false })) return null;
  const label = p.status === 'offered' ? tr('tour.resume.start') : tr('tour.resume.title', { n: p.step + 1, total: TOUR_LENGTH });
  return (
    <View testID="tour-resume" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingLeft: spacing.sm, borderRadius: radius.lg, ...glassEdge(t), backgroundColor: t.colors.surface }}>
      <Icon name="compass" size={18} color={t.colors.primary} />
      <GlassButton label={label} variant="tertiary" size="sm" onPress={startTour} testID="tour-resume-start" style={{ flex: 1, alignItems: 'flex-start' }} />
      <GlassIconButton icon="x" label={tr('tour.resume.hide')} plain size={44} onPress={() => tourDispatch({ type: 'hideResume' })} testID="tour-resume-hide" />
    </View>
  );
}

/** Mode exercice actif (formulaires) : bandeau sobre, toujours lisible. */
export function usePracticeActive() {
  const [on, setOn] = useState(isPracticeActive());
  useEffect(() => onPracticeChange(setOn), []);
  return on;
}
export function PracticeBanner() {
  const t = useTheme();
  const on = usePracticeActive();
  const setPractice = useTourStore((s) => s.setPractice);
  if (!on) return null;
  return (
    <View testID="practice-banner" accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginHorizontal: spacing.lg, marginTop: spacing.xs, paddingLeft: spacing.sm, borderRadius: radius.md, backgroundColor: t.colors.accentSoft }}>
      <Icon name="shield" size={16} color={t.colors.primary} />
      <Text variant="small" weight="bold" style={{ flex: 1, paddingVertical: spacing.xs }}>{tr('tour.practice.banner')}</Text>
      <GlassButton label={tr('tour.practice.stop')} variant="tertiary" size="sm" onPress={() => { setPractice(false); if (router.canGoBack()) router.back(); }} testID="practice-stop" />
    </View>
  );
}
