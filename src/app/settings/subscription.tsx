/**
 * Abonnement Premium : bénéfices, comparaison claire Gratuit / Premium, formules mensuelle et annuelle (annuelle mise en
 * valeur), essai éventuel, prix total réellement facturé, date de renouvellement, conditions d'annulation, restauration
 * des achats, lien de gestion. Aucun compte à rebours, aucun prix barré, aucun bouton caché.
 * Les droits sont confirmés par le serveur (has_premium), jamais par l'application seule.
 */
import React, { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Divider, Icon, Loading, Row, SectionTitle, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { BRAND } from '@/config/brand';
import { useInvalidate } from '@/lib/data/hooks';
import { useEntitlement } from '@/lib/data/hooks-premium';
import { LegalLink } from '@/features/auth';
import { friendlyError, usePlanLimits } from '@/lib/data/hooks-settings';
import { ALWAYS_FREE, FEATURES, featureTitle, type PremiumFeature } from '@/lib/premium/features';
import { billingDates, getPlans, MANAGE_URLS, manageSubscription, purchase, purchaseMode, restore, type Plan } from '@/lib/purchases';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const PREMIUM = `${BRAND.shortName} Premium`;
const STORE_LABEL: Record<string, string> = { app_store: 'App Store', play_store: 'Google Play', test: 'Démonstration (aucun paiement)', promotional: 'Offert' };
const day = (d: Date | string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

interface Row3 { label: string; free: string | boolean; plus: string | boolean }

function Cell({ v }: { v: string | boolean }) {
  const t = useTheme();
  if (v === true) return <View style={{ flex: 1, alignItems: 'center' }}><Icon name="check" size={18} color={t.colors.success} /></View>;
  if (v === false) return <View style={{ flex: 1, alignItems: 'center' }}><Text variant="small" muted accessibilityLabel="Non inclus">—</Text></View>;
  return <Text variant="small" center style={{ flex: 1 }}>{v}</Text>;
}

const BENEFITS: PremiumFeature[] = ['sleep_insights', 'coparent_invite', 'summaries', 'weekly_menu', 'community_groups', 'voice_entry', 'assistant_more', 'scanner_compare', 'cycle_insights'];

export default function SubscriptionScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const params = useLocalSearchParams<{ feature?: string }>();
  const ent = useEntitlement();
  const premium = ent.premium;
  const sub = ent.sub;
  const { data: limits } = usePlanLimits();
  const plans = useQuery({ queryKey: ['plans', purchaseMode], queryFn: getPlans, staleTime: 600_000, retry: false, enabled: purchaseMode !== 'unavailable' });
  const [busy, setBusy] = useState<string | null>(null);
  const tried = params.feature && params.feature in FEATURES ? (params.feature as PremiumFeature) : null;

  const lim = (key: string, unit: string) => {
    const l = limits?.find((x) => x.key === key);
    return l ? { free: `${l.free_value}${unit}`, plus: `${l.premium_value}${unit}` } : { free: 'Limité', plus: 'Étendu' };
  };
  const q = lim('assistant_questions_per_month', ' / mois');
  const scans = lim('product_scans_per_month', ' / mois');
  const voice = lim('voice_entries_per_month', ' / mois');
  const exportsL = lim('summary_exports_per_month', ' / mois');
  const kids = lim('children_count', '');
  const docs = lim('documents_count', '');
  const lists = lim('checklists_count', '');
  const rem = lim('custom_reminders_count', '');

  const rows: Row3[] = [
    { label: 'Suivi quotidien : biberons, tétées, sommeil, couches, repas', free: true, plus: true },
    { label: 'Rappel du prochain biberon', free: true, plus: true },
    { label: 'Calendrier du cycle et estimations', free: true, plus: true },
    { label: 'Grossesse semaine par semaine, rendez-vous', free: true, plus: true },
    { label: 'Sommeil : rythme moyen, estimation, changements, graphiques, routine', free: false, plus: true },
    { label: 'Partage avec le coparent, par profil', free: false, plus: true },
    { label: 'Résumés (jour)', free: true, plus: true },
    { label: 'Résumés de la semaine et avant rendez-vous', free: false, plus: true },
    { label: 'Export PDF ou partage d’un résumé', free: exportsL.free, plus: exportsL.plus },
    { label: 'Saisie vocale ou en une phrase', free: voice.free, plus: voice.plus },
    { label: 'Questions à l’assistant', free: q.free, plus: q.plus },
    { label: 'Réponses enregistrées et questions suggérées pour votre enfant', free: false, plus: true },
    { label: 'Analyses du scanner', free: scans.free, plus: scans.plus },
    { label: 'Comparer deux produits', free: false, plus: true },
    { label: 'Recettes, favoris, filtres', free: true, plus: true },
    { label: 'Menus de la semaine et courses automatiques', free: false, plus: true },
    { label: 'Statistiques du cycle et export PDF', free: false, plus: true },
    { label: 'Résumé familial du jour', free: false, plus: true },
    { label: 'Rappels personnels actifs', free: rem.free, plus: rem.plus },
    { label: 'Profils enfants', free: kids.free, plus: kids.plus },
    { label: 'Documents dans le coffre', free: docs.free, plus: docs.plus },
    { label: 'Listes de préparation', free: lists.free, plus: lists.plus },
    { label: 'Suivi de la diversification, export des mesures', free: false, plus: true },
    { label: 'Communauté : profil, publications avec photos, commentaires, réactions, suivre des membres et des catégories', free: true, plus: true },
    { label: 'Groupes thématiques et par mois de naissance, sondages, notifications de réponses', free: true, plus: true },
    { label: 'Signaler, bloquer, règles et informations de sécurité', free: true, plus: true },
    { label: 'Profil personnalisé (couleur, bannière, présentation) et badge facultatif', free: false, plus: true },
    { label: 'Groupes privés et invitations', free: false, plus: true },
    { label: 'Albums photo privés ou partagés', free: false, plus: true },
    { label: 'Filtres et recherche avancés, dossiers d’enregistrements, journal d’activité', free: false, plus: true },
    { label: 'Résumé et traduction des longues discussions', free: false, plus: true },
    { label: 'Ateliers et rencontres réservés aux abonné·es', free: false, plus: true },
  ];

  async function buy(plan: Plan) {
    setBusy(plan.id);
    try {
      const ok = await purchase(plan);
      inv('subscriptions');
      toast(ok ? `Bienvenue dans ${PREMIUM} !` : 'Achat enregistré : la confirmation peut prendre quelques minutes.', ok ? 'success' : 'info');
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
      if (!(await confirm('Arrêter l’abonnement de démonstration ?', 'Aucun paiement n’a eu lieu : l’application revient à la version gratuite. Toutes vos données restent consultables.', 'Arrêter'))) return;
    }
    setBusy('manage');
    try {
      await manageSubscription();
      inv('subscriptions');
      if (purchaseMode === 'test') toast('Retour à la version gratuite. Vos données restent consultables.');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusy(null);
    }
  }

  const sorted = [...(plans.data ?? [])].sort((a, b) => (a.period === 'annual' ? -1 : b.period === 'annual' ? 1 : 0));

  return (
    <Screen back title="Abonnement" subtitle={`${PREMIUM} finance une application sans publicité et sans revente de données.`}>
      {tried && !premium ? (
        <Card tone="gold">
          <View testID="sub-tried">
            <Row><Icon name={FEATURES[tried].icon as never} size={18} /><Text weight="bold" style={{ flex: 1 }}>{featureTitle(tried)}</Text></Row>
            <Text variant="small" style={{ marginTop: 4 }}>{FEATURES[tried].benefit}</Text>
          </View>
        </Card>
      ) : null}

      {/* État actuel, expliqué : essai, renouvellement, fin, grâce, paiement refusé, expiré */}
      <View testID="sub-status">
        <Card tone={premium ? 'gold' : 'soft'}>
          <Row>
            <Icon name={premium ? 'star' : 'heart'} size={20} />
            <Text weight="bold" style={{ flex: 1 }}>{premium ? `${PREMIUM} actif` : 'Version gratuite'}</Text>
          </Row>
          <Text variant="small" style={{ marginTop: 6 }} testID="sub-message">{premium && (!sub || sub.status === 'none') ? 'Accès partagé par le propriétaire de votre foyer.' : ent.message}</Text>
          {sub && sub.status !== 'none' ? (
            <View style={{ marginTop: 4, gap: 2 }}>
              {sub.period_type ? <Text variant="small" muted>{`Formule : ${sub.period_type === 'annual' ? 'annuelle' : sub.period_type === 'monthly' ? 'mensuelle' : sub.period_type === 'trial' ? 'essai' : sub.period_type}`}</Text> : null}
              {sub.store ? <Text variant="small" muted>{`Boutique : ${STORE_LABEL[sub.store] ?? sub.store}`}</Text> : null}
            </View>
          ) : null}
          {ent.state === 'billing_issue' || ent.state === 'grace' ? <Banner tone="warning">{'Mettez à jour votre moyen de paiement dans les réglages de votre boutique.'}</Banner> : null}
        </Card>
      </View>

      {!premium ? (
        <>
          <SectionTitle title="Ce que Premium change au quotidien" />
          <Card>
            {BENEFITS.map((f, i) => (
              <Row key={f} style={{ alignItems: 'flex-start', paddingVertical: 6, borderTopWidth: i ? 0.5 : 0, borderColor: t.colors.border }}>
                <Icon name={FEATURES[f].icon as never} size={18} color={t.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text weight="bold">{featureTitle(f)}</Text>
                  <Text variant="small" muted>{FEATURES[f].benefit}</Text>
                </View>
              </Row>
            ))}
          </Card>

          <SectionTitle title={`Choisir ${PREMIUM}`} />
          {purchaseMode === 'unavailable' ? (
            <Banner tone="info" title="Achats bientôt disponibles">{'Les achats intégrés ne sont pas encore configurés pour cette version de l’application.'}</Banner>
          ) : plans.isLoading ? <Loading label="Chargement des offres…" /> : plans.isError ? (
            <Banner tone="warning" title="Offres indisponibles">{friendlyError(plans.error, 'Impossible de joindre la boutique pour le moment.')}</Banner>
          ) : (
            sorted.map((p) => {
              const dates = billingDates(p);
              const annual = p.period === 'annual';
              return (
                <View key={p.id} testID={`plan-${p.period}`}>
                  <Card tone={annual ? 'lavender' : 'surface'} style={annual ? { borderWidth: 2, borderColor: t.colors.primary } : undefined}>
                    {annual ? <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: t.colors.primary, marginBottom: 6 }}><Text variant="caption" weight="bold" color="#FFFFFF">Le plus avantageux</Text></View> : null}
                    <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text weight="bold">{p.title}</Text>
                        <Text variant="small" muted>{p.detail}</Text>
                      </View>
                      <Text variant="heading">{p.price}</Text>
                    </Row>
                    <View style={{ marginTop: 6, gap: 2 }} testID={`plan-terms-${p.period}`}>
                      <Text variant="small" weight="bold">{p.billed}</Text>
                      {p.trialDays ? <Text variant="small">{`${p.trialDays} jours gratuits, puis premier prélèvement le ${day(dates.firstCharge)}.`}</Text> : <Text variant="small">{`Premier prélèvement aujourd’hui.`}</Text>}
                      <Text variant="small" muted>{`Renouvellement automatique le ${day(dates.renewal)}, sauf annulation au moins 24 h avant.`}</Text>
                    </View>
                    <Button label={p.trialDays ? `Commencer l’essai gratuit de ${p.trialDays} jours` : `Choisir la formule ${p.title.toLowerCase()}`} style={{ marginTop: spacing.sm }} loading={busy === p.id} disabled={!!busy && busy !== p.id} onPress={() => buy(p)} testID={`plan-buy-${p.period}`} />
                  </Card>
                </View>
              );
            })
          )}
          {purchaseMode === 'test' ? <Banner tone="demo" title="Mode démonstration">{'L’achat est simulé : aucun paiement n’est demandé ni débité.'}</Banner> : null}
        </>
      ) : null}

      <SectionTitle title="Comparer Gratuit et Premium" />
      <Card>
        <View style={{ flexDirection: 'row', paddingVertical: 6 }}>
          <Text variant="label" style={{ flex: 2.2 }}> </Text>
          <Text variant="label" center style={{ flex: 1 }}>Gratuit</Text>
          <Text variant="label" center style={{ flex: 1 }}>Premium</Text>
        </View>
        <Divider />
        {rows.map((r, i) => (
          <View key={r.label} accessible accessibilityLabel={`${r.label} : gratuit ${r.free === true ? 'inclus' : r.free === false ? 'non inclus' : r.free}, Premium ${r.plus === true ? 'inclus' : r.plus === false ? 'non inclus' : r.plus}`}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: i ? 0.5 : 0, borderColor: t.colors.border }}>
            <Text variant="small" style={{ flex: 2.2, paddingRight: 6 }}>{r.label}</Text>
            <Cell v={r.free} />
            <Cell v={r.plus} />
          </View>
        ))}
      </Card>

      <SectionTitle title="Toujours gratuit" />
      <View testID="always-free">
        <Card tone="soft">
          {ALWAYS_FREE.map((label, i) => (
            <Row key={label} style={{ paddingVertical: 6, borderTopWidth: i ? 0.5 : 0, borderColor: t.colors.border }}>
              <Icon name="shield" size={16} color={t.colors.success} />
              <Text variant="small" style={{ flex: 1 }}>{label}</Text>
            </Row>
          ))}
          <Button label="Voir les numéros d’urgence" size="sm" variant="ghost" icon="life-buoy" style={{ alignSelf: 'flex-start', marginTop: 4 }} onPress={() => router.push('/emergency')} />
        </Card>
        <Text variant="caption" muted style={{ marginTop: spacing.xs }} testID="no-targeted-ads">
          Vos profils privés, les données de vos enfants et vos données de santé ne servent jamais à afficher de la publicité ciblée. Il n’y a aujourd’hui aucun contenu sponsorisé dans l’application.
        </Text>
      </View>

      <View style={{ gap: spacing.xs }}>
        {purchaseMode !== 'unavailable' ? <Button label="Restaurer mes achats" variant="secondary" icon="refresh-cw" loading={busy === 'restore'} onPress={doRestore} testID="sub-restore" /> : null}
        {premium && sub && sub.status !== 'none' && purchaseMode !== 'unavailable' ? (
          <Button label={purchaseMode === 'test' ? 'Arrêter l’abonnement de démonstration' : 'Gérer ou résilier mon abonnement'} variant="ghost" loading={busy === 'manage'} onPress={manage} testID="sub-manage" />
        ) : null}
        <Button label={Platform.OS === 'android' ? 'Gérer mes abonnements sur Google Play' : 'Gérer mes abonnements (App Store)'} variant="ghost" icon="external-link" size="sm"
          onPress={() => void Linking.openURL(Platform.OS === 'android' ? MANAGE_URLS.android : MANAGE_URLS.ios)} testID="sub-manage-link" />
      </View>
      <Text variant="caption" muted testID="sub-terms">
        {'Annulation : à tout moment depuis les réglages de votre compte App Store ou Google Play, au moins 24 h avant la date de renouvellement ; l’accès Premium reste ouvert jusqu’à la fin de la période déjà payée. Pendant un essai gratuit, une annulation avant la fin de l’essai évite tout prélèvement. Le prix affiché est celui de votre boutique, toutes taxes comprises. Après la fin d’un abonnement, toutes vos données restent consultables et exportables.'}
      </Text>
      {/* Liens exigés par l'App Store (règle 3.1.2) : conditions d'utilisation et confidentialité */}
      <Row wrap testID="sub-legal-links">
        <LegalLink doc="terms">Conditions d’utilisation</LegalLink>
        <LegalLink doc="privacy">Politique de confidentialité</LegalLink>
      </Row>
    </Screen>
  );
}
