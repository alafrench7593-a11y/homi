/**
 * Abonnement : comparaison honnête gratuit / Plus, achat, restauration, état actuel.
 * Les informations de sécurité (urgences, réponses de sécurité de l'assistant, rappels officiels) restent TOUJOURS gratuites.
 * Les droits sont confirmés par le serveur (has_premium), jamais par l'application seule.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Divider, Icon, Loading, Row, SectionTitle, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { BRAND } from '@/config/brand';
import { usePremium, useSubscription, useInvalidate } from '@/lib/data/hooks';
import { friendlyError, usePlanLimits } from '@/lib/data/hooks-settings';
import { getPlans, manageSubscription, purchase, purchaseMode, restore, type Plan } from '@/lib/purchases';
import type { Subscription } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const PLUS = `${BRAND.shortName} Plus`;

const STATUS_LABEL: Record<Subscription['status'], string> = {
  none: 'Version gratuite',
  trial: 'Période d’essai en cours',
  active: 'Abonnement actif',
  grace: 'Actif — paiement en cours de régularisation',
  cancelled: 'Résilié — actif jusqu’à l’échéance',
  expired: 'Abonnement terminé',
  billing_issue: 'Problème de paiement',
};
const STORE_LABEL: Record<string, string> = { app_store: 'App Store', play_store: 'Google Play', test: 'Démonstration (aucun paiement)', promotional: 'Offert' };

interface Row3 { label: string; free: string | boolean; plus: string | boolean; safety?: boolean }

function Cell({ v, bold }: { v: string | boolean; bold?: boolean }) {
  const t = useTheme();
  if (v === true) return <View style={{ flex: 1, alignItems: 'center' }}><Icon name="check" size={18} color={t.colors.success} /></View>;
  if (v === false) return <View style={{ flex: 1, alignItems: 'center' }}><Text variant="small" muted accessibilityLabel="Non inclus">—</Text></View>;
  return <Text variant="small" weight={bold ? 'bold' : undefined} center style={{ flex: 1 }}>{v}</Text>;
}

export default function SubscriptionScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const premium = usePremium();
  const sub = useSubscription();
  const { data: limits } = usePlanLimits();
  const plans = useQuery({ queryKey: ['plans', purchaseMode], queryFn: getPlans, staleTime: 600_000, retry: false, enabled: purchaseMode !== 'unavailable' });
  const [busy, setBusy] = useState<string | null>(null);

  const lim = (key: string, unit: string) => {
    const l = limits?.find((x) => x.key === key);
    return l ? { free: `${l.free_value} ${unit}`, plus: `${l.premium_value} ${unit}` } : { free: 'Limité', plus: 'Étendu' };
  };
  const q = lim('assistant_questions_per_month', '/ mois');
  const docs = lim('documents_count', '');
  const kids = lim('children_count', '');
  const lists = lim('checklists_count', '');
  const scans = lim('product_scans_per_month', '/ mois');

  const safetyRows: Row3[] = [
    { label: 'Numéros d’urgence (15, 112, 3114) et ressources d’aide', free: true, plus: true, safety: true },
    { label: 'Réponses de sécurité de l’assistant (signes d’alerte, détresse)', free: true, plus: true, safety: true },
    { label: 'Rappels officiels de produits', free: true, plus: true, safety: true },
    { label: 'Articles de sécurité (signes d’alerte, sommeil sûr…)', free: true, plus: true, safety: true },
  ];
  const rows: Row3[] = [
    { label: 'Suivi quotidien (tétées, biberons, sommeil, couches, repas)', free: 'Illimité', plus: 'Illimité' },
    { label: 'Suivi de grossesse, rendez-vous, rappels', free: true, plus: true },
    { label: 'Partage avec un coparent', free: true, plus: true },
    { label: 'Communauté', free: true, plus: true },
    { label: 'Questions à l’assistant', free: q.free, plus: q.plus },
    { label: 'Documents dans le coffre', free: docs.free, plus: docs.plus },
    { label: 'Profils enfants actifs', free: kids.free, plus: kids.plus },
    { label: 'Listes de préparation', free: lists.free, plus: lists.plus },
    { label: 'Scanner : rappels et précautions principales', free: true, plus: true },
    { label: 'Scanner : analyse détaillée de la composition', free: scans.free, plus: scans.plus },
    { label: 'Articles approfondis', free: false, plus: true },
    { label: 'Exports (CSV) de vos mesures', free: false, plus: true },
    { label: 'Export complet et suppression de vos données (RGPD)', free: true, plus: true },
  ];

  async function buy(plan: Plan) {
    setBusy(plan.id);
    try {
      const ok = await purchase(plan);
      inv('subscriptions');
      toast(ok ? `Bienvenue dans ${PLUS} !` : 'Achat enregistré : la confirmation peut prendre quelques minutes.', ok ? 'success' : 'info');
    } catch (e) {
      const msg = friendlyError(e);
      if (!/cancel|annul/i.test(msg)) toast(msg, 'error');
    } finally {
      setBusy(null);
    }
  }

  async function doRestore() {
    setBusy('restore');
    try {
      const ok = await restore();
      inv('subscriptions');
      toast(ok ? 'Abonnement restauré.' : 'Aucun abonnement actif trouvé pour ce compte.', ok ? 'success' : 'info');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function manage() {
    if (purchaseMode === 'test') {
      if (!(await confirm('Arrêter l’abonnement de démonstration ?', 'Aucun paiement n’a eu lieu : l’application revient simplement à la version gratuite.', 'Arrêter'))) return;
    }
    setBusy('manage');
    try {
      await manageSubscription();
      inv('subscriptions');
      if (purchaseMode === 'test') toast('Retour à la version gratuite.');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusy(null);
    }
  }

  const status = sub?.status ?? 'none';
  const header = (
    <View style={{ flexDirection: 'row', paddingVertical: 6 }}>
      <Text variant="label" style={{ flex: 2.2 }}> </Text>
      <Text variant="label" center style={{ flex: 1 }}>Gratuit</Text>
      <Text variant="label" center style={{ flex: 1 }}>Plus</Text>
    </View>
  );
  const renderRow = (r: Row3, i: number) => (
    <View key={r.label} accessible accessibilityLabel={`${r.label} : gratuit ${r.free === true ? 'inclus' : r.free === false ? 'non inclus' : r.free}, Plus ${r.plus === true ? 'inclus' : r.plus === false ? 'non inclus' : r.plus}`}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: i ? 0.5 : 0, borderColor: t.colors.border }}>
      <Text variant="small" style={{ flex: 2.2, paddingRight: 6 }}>{r.label}</Text>
      <Cell v={r.free} />
      <Cell v={r.plus} />
    </View>
  );

  return (
    <Screen back title="Abonnement" subtitle={`${PLUS} finance une application sans publicité et sans revente de données.`}>
      <Card tone={premium ? 'gold' : 'soft'}>
        <Row>
          <Icon name={premium ? 'star' : 'heart'} size={20} />
          <Text weight="bold" style={{ flex: 1 }}>{premium ? `${PLUS} — ${STATUS_LABEL[status === 'none' ? 'active' : status]}` : STATUS_LABEL[status]}</Text>
        </Row>
        {sub && sub.status !== 'none' ? (
          <View style={{ marginTop: 6, gap: 2 }}>
            {sub.period_type ? <Text variant="small" muted>{`Formule : ${sub.period_type === 'annual' ? 'annuelle' : sub.period_type === 'monthly' ? 'mensuelle' : sub.period_type === 'trial' ? 'essai' : sub.period_type}`}</Text> : null}
            {sub.expires_at ? <Text variant="small" muted>{`${sub.will_renew ? 'Prochain renouvellement' : 'Fin des droits'} : ${new Date(sub.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}</Text> : null}
            {sub.store ? <Text variant="small" muted>{`Boutique : ${STORE_LABEL[sub.store] ?? sub.store}`}</Text> : null}
          </View>
        ) : premium ? (
          <Text variant="small" muted style={{ marginTop: 6 }}>Accès partagé par le propriétaire de votre foyer.</Text>
        ) : null}
        {status === 'billing_issue' ? <Banner tone="warning">{'Mettez à jour votre moyen de paiement dans les réglages de votre boutique pour conserver l’accès.'}</Banner> : null}
      </Card>

      <SectionTitle title="Toujours gratuit" />
      <Card tone="soft">
        <Text variant="small" muted style={{ marginBottom: spacing.xs }}>Ces contenus ne seront jamais payants, quel que soit votre abonnement.</Text>
        {safetyRows.map((r, i) => (
          <Row key={r.label} style={{ paddingVertical: 6, borderTopWidth: i ? 0.5 : 0, borderColor: t.colors.border }}>
            <Icon name="shield" size={16} color={t.colors.success} />
            <Text variant="small" style={{ flex: 1 }}>{r.label}</Text>
          </Row>
        ))}
        <Button label="Voir les numéros d’urgence" size="sm" variant="ghost" icon="life-buoy" style={{ alignSelf: 'flex-start', marginTop: 4 }} onPress={() => router.push('/emergency')} />
      </Card>

      <SectionTitle title="Comparer" />
      <Card>
        {header}
        <Divider />
        {rows.map(renderRow)}
      </Card>
      <Text variant="caption" muted>En version gratuite, l’analyse d’un produit montre les constats les plus importants (par exemple une précaution liée à la grossesse) ; la version Plus détaille tous les constats, sources et informations manquantes.</Text>

      {!premium ? (
        <>
          <SectionTitle title={`Choisir ${PLUS}`} />
          {purchaseMode === 'unavailable' ? (
            <Banner tone="info" title="Achats bientôt disponibles">{'Les achats intégrés ne sont pas encore configurés pour cette version de l’application.'}</Banner>
          ) : plans.isLoading ? <Loading label="Chargement des offres…" /> : plans.isError ? (
            <Banner tone="warning" title="Offres indisponibles">{friendlyError(plans.error, 'Impossible de joindre la boutique pour le moment.')}</Banner>
          ) : (
            (plans.data ?? []).map((p) => (
              <Card key={p.id} tone={p.period === 'annual' ? 'lavender' : 'surface'}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text weight="bold">{p.title}</Text>
                    <Text variant="small" muted>{p.detail}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="heading">{p.price}</Text>
                    {p.trialLabel ? <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: t.colors.surfaceAlt }}><Text variant="caption">{p.trialLabel}</Text></View> : null}
                  </View>
                </Row>
                <Button label={p.trialLabel ? `Commencer l’essai (${p.trialLabel})` : `Choisir l’offre ${p.title.toLowerCase()}`} style={{ marginTop: spacing.sm }} loading={busy === p.id} disabled={!!busy && busy !== p.id} onPress={() => buy(p)} />
              </Card>
            ))
          )}
          {purchaseMode === 'test' ? <Banner tone="demo" title="Mode démonstration">{'L’achat est simulé : aucun paiement n’est demandé ni débité.'}</Banner> : null}
        </>
      ) : null}

      <View style={{ gap: spacing.xs }}>
        {purchaseMode !== 'unavailable' ? <Button label="Restaurer mes achats" variant="secondary" icon="refresh-cw" loading={busy === 'restore'} onPress={doRestore} /> : null}
        {premium && sub && sub.status !== 'none' && purchaseMode !== 'unavailable' ? (
          <Button label={purchaseMode === 'test' ? 'Arrêter l’abonnement de démonstration' : 'Gérer ou résilier mon abonnement'} variant="ghost" loading={busy === 'manage'} onPress={manage} />
        ) : null}
      </View>
      <Text variant="caption" muted>
        L’abonnement se renouvelle automatiquement à la fin de chaque période, sauf résiliation au moins 24 h avant l’échéance depuis les réglages de votre compte App Store ou Google Play. Le prix affiché est celui de votre boutique, toutes taxes comprises. Un abonnement souscrit par le propriétaire du foyer profite aux membres invités.
      </Text>
    </Screen>
  );
}
