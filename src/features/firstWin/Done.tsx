/**
 * Après le oui (/start/done) : confirmation — formule, montant, date de fin d'essai ou de première facturation
 * CONFIRMÉE par le serveur (ligne d'abonnement), sinon une phrase qui dit où elle apparaîtra ;
 *  - bouton principal : ouvre directement l'outil essayé (après la création du foyer si elle n'est pas faite) ;
 *  - invitation du co-parent (Premium : un autre adulte inclus ; Famille : tous les adultes du foyer) ;
 *  - « Me rappeler avant mon premier paiement » : rappel local 24 h avant la fin de l'essai, état réel affiché ;
 *  - gestion de l'abonnement (Réglages › Abonnement).
 * Sans droits confirmés (has_premium faux) : retour au paywall, jamais d'accès supposé.
 */
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopInset } from '@/components/demoInset';
import { Banner, Button, Card, Loading, Text } from '@/components/ui';
import { useProfile, useSubscription } from '@/lib/data/hooks';
import { track } from '@/lib/analytics/events';
import { formatMoney, periodOfProduct, tierOfProduct } from '@/lib/premium/plans';
import { Cascade, SuccessCheck } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { formatDate, formatTime, localeTag, t as tr, type TKey } from '@/i18n';
import { usePremiumState } from './hooks';
import { DEMO_OF, loadProgress, saveProgress, type FirstWinProgress } from './model';
import { confirmedChargeDate, perEvery } from './offer';
import { loadReminderState, scheduleTrialReminder, type ReminderState } from './trialReminder';

export function FirstWinDone() {
  const th = useTheme();
  const top = useTopInset();
  const bottom = useSafeAreaInsets().bottom;
  const premium = usePremiumState();
  const sub = useSubscription() as { status?: string; product_id?: string | null; price?: number | string | null; currency?: string | null; trial_ends_at?: string | null; expires_at?: string | null; period_type?: string | null } | null;
  const profile = useProfile();
  const [p, setP] = useState<FirstWinProgress | null | undefined>(undefined);
  const [rem, setRem] = useState<ReminderState>({ status: 'none' });
  const [remBusy, setRemBusy] = useState(false);
  useEffect(() => { void loadProgress().then(setP); void loadReminderState().then(setRem); }, []);

  if (premium === undefined || p === undefined) return <View style={{ flex: 1, backgroundColor: th.colors.background, justifyContent: 'center' }}><Loading /></View>;
  if (premium === false) return <Redirect href="/start/offers" />;

  const demo = p?.need ? DEMO_OF[p.need] : null;
  const tier = sub?.product_id ? tierOfProduct(sub.product_id) : p?.plan?.tier ?? 'premium';
  const period = periodOfProduct(sub?.product_id) ?? p?.plan?.period ?? null;
  const planName = tier === 'family' ? tr('fw.plan.family') : period ? tr(`fw.plan.${period}` as TKey) : tr('fw.plan.monthly');
  const amount = sub?.price != null && sub.currency ? formatMoney(Number(sub.price), sub.currency, localeTag()) : null;
  const date = confirmedChargeDate(sub);
  const trial = sub?.status === 'trial';
  const dateText = date ? formatDate(date, { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const billing = date && amount && period
    ? trial ? tr('fw.done.trialUntil', { date: dateText!, price: amount, every: perEvery(period) }) : tr('fw.done.firstCharge', { price: amount, date: dateText! })
    : tr('fw.done.dateUnknown');
  const setupDone = profile.data?.onboarding_completed === true;

  function openTool() {
    const route = p?.openAfter ?? null;
    if (setupDone) {
      void saveProgress({ openAfter: null });
      router.replace('/(tabs)');
      if (route) router.push(route as never);
    } else {
      // Le foyer n'existe pas encore : onboarding prérempli (étape de vie), puis l'outil (exit de l'onboarding)
      router.replace('/onboarding');
    }
  }
  async function remind() {
    if (!date || remBusy) return;
    setRemBusy(true);
    const st = await scheduleTrialReminder(date);
    setRem(st);
    setRemBusy(false);
    void track('reminder_set', { outcome: st.status });
  }

  const remText = rem.status === 'scheduled' ? tr('fw.rem.scheduled', { date: formatDate(rem.at, { day: 'numeric', month: 'long' }), time: formatTime(rem.at) })
    : rem.status === 'denied' ? tr('fw.rem.denied') : rem.status === 'failed' ? tr('fw.rem.failed') : rem.status === 'too_late' ? tr('fw.rem.tooLate')
      : rem.status === 'unsupported' ? tr('fw.rem.unsupported') : null;

  return (
    <View style={{ flex: 1, backgroundColor: th.colors.background, paddingTop: top }} testID="fw-done">
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <Cascade index={0}>
          <View style={{ alignItems: 'center', gap: spacing.xs }} accessible accessibilityRole="header" accessibilityLabel={`${tr('fw.done.title')}. ${tr('fw.done.plan', { plan: planName })}. ${billing}`}>
            <SuccessCheck visible size={56} color={th.colors.success} />
            <Text variant="title" center>{tr('fw.done.title')}</Text>
            <Text weight="bold" center testID="fw-done-plan">{tr('fw.done.plan', { plan: planName })}</Text>
            <Text center muted testID="fw-done-billing">{billing}</Text>
          </View>
        </Cascade>
        {demo ? (
          <Cascade index={1}>
            <View style={{ gap: spacing.xs }}>
              <Button label={tr(`fw.done.open.${demo}` as TKey)} size="lg" full icon="arrow-right" onPress={openTool} testID="fw-done-open" />
              {!setupDone ? <Text variant="caption" muted center>{tr('fw.done.setupFirst')}</Text> : null}
            </View>
          </Cascade>
        ) : (
          <Button label={tr('pay2.sub.continue')} size="lg" full onPress={() => router.replace(setupDone ? '/(tabs)' : '/onboarding')} testID="fw-done-open" />
        )}
        {trial && date ? (
          <Cascade index={2}>
            <Card testID="fw-done-reminder">
              <View style={{ gap: spacing.xs }}>
                <Text weight="bold">{tr('fw.rem.title')}</Text>
                <Text variant="small" muted>{tr('fw.rem.body')}</Text>
                {remText ? <View accessibilityLiveRegion="polite" testID={`fw-rem-${rem.status}`}><Banner tone={rem.status === 'scheduled' ? 'success' : 'info'}>{remText}</Banner></View> : null}
                {rem.status !== 'scheduled' && rem.status !== 'too_late' && rem.status !== 'unsupported' ? (
                  <Button label={tr('fw.rem.set')} icon="bell" variant="secondary" full loading={remBusy} onPress={() => void remind()} testID="fw-rem-set" />
                ) : null}
              </View>
            </Card>
          </Cascade>
        ) : null}
        <Cascade index={3}>
          <Card testID="fw-done-invite">
            <View style={{ gap: spacing.xs }}>
              <Text weight="bold">{tr('fw.done.inviteTitle')}</Text>
              <Text variant="small" muted>{tr('fw.done.inviteBody')}</Text>
              {tier === 'family' ? <Text variant="small" muted>{tr('fw.done.inviteFamily')}</Text> : null}
              <Button label={tr('fw.done.invite')} icon="user-plus" variant="secondary" full onPress={() => router.push('/settings/family')} testID="fw-done-invite-btn" />
            </View>
          </Card>
        </Cascade>
      </ScrollView>
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: bottom + spacing.sm, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <Button label={tr('fw.done.manage')} variant="ghost" full icon="settings" onPress={() => router.push('/settings/subscription')} testID="fw-done-manage" />
      </View>
    </View>
  );
}
