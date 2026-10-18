/**
 * Accueil simple : profil actif, une carte principale adaptée, 3 ou 4 actions rapides,
 * le prochain rappel ou rendez-vous, l'article du jour et « Poser une question ».
 * Tout le reste est rangé dans « Tous mes outils ».
 */
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { DemoBanner, ProfileSwitcher } from '@/components/Family';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Icon, IconButton, Row, Text } from '@/components/ui';
import { PostpartumHomeCard } from '@/features/postpartum';
import { ChildToday, CycleCard, PregnancyHero, QuickActions, setCycleRoute, UpcomingCard } from '@/features/home';
import { useActivePregnancy, useActiveSubject, useArticles, useChildren, useNotificationsInbox, usePremium, useProfile } from '@/lib/data/hooks';
import { greeting } from '@/lib/domain/dates';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { childAge } from '@/lib/domain/child';
import { isLocked, suggestArticles } from '@/lib/domain/content';
import { articleOfDay, mainJourneys, quickActionsFor } from '@/lib/domain/journeys';
import { useOfflineStore } from '@/lib/offline';
import { useUiStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, NACRE, previewTime, spacing } from '@/theme/tokens';

export default function Home() {
  const t = useTheme();
  const profileQ = useProfile();
  const profile = profileQ.data;
  const { subject } = useActiveSubject();
  const pregnancy = useActivePregnancy();
  const childrenQ = useChildren();
  const children = childrenQ.data;
  // Carte principale : squelette pendant le premier chargement, erreur avec « Réessayer » sinon
  const mainLoading = (profileQ.isLoading && !profile) || (childrenQ.isLoading && !children);
  const mainError = profileQ.isError && !profile ? profileQ : childrenQ.isError && !children ? childrenQ : null;
  const { data: articles } = useArticles();
  const { data: inbox } = useNotificationsInbox();
  const premium = usePremium();
  const offline = useOfflineStore();
  const skyOverride = useUiStore((st) => st.skyOverride);
  const now = skyOverride ? previewTime(skyOverride) : new Date();

  const journeys = profile?.journeys ?? [];
  const main = mainJourneys(journeys);
  const unread = inbox?.filter((n) => !n.read_at).length ?? 0;
  const child = subject.type === 'child' ? children?.find((c) => c.id === subject.id) : subject.type === 'family' ? children?.[0] : undefined;
  const cycleMode: 'ttc' | 'avoid' | null = main.includes('ttc') ? 'ttc' : main.includes('avoid') ? 'avoid' : null;
  setCycleRoute(cycleMode === 'avoid' ? '/contraception' : '/fertility');

  const subtitle = subject.type === 'child' && child
    ? `${child.first_name}, ${childAge(child.birth_date).label}`
    : subject.type === 'pregnancy' && pregnancy
      ? `${pregnancyProgress(pregnancy.due_date).label}`
      : cycleMode === 'ttc' ? 'Projet bébé' : cycleMode === 'avoid' ? 'Mon cycle' : undefined;

  const article = useMemo(() => {
    const list = suggestArticles(articles ?? [], {
      journeys,
      weekSA: subject.type === 'pregnancy' && pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
      childAgesMonths: child ? [childAge(child.birth_date).months] : (children ?? []).map((c) => childAge(c.birth_date).months),
      postpartum: main.includes('mother'),
      multiple: !!pregnancy && pregnancy.multiplicity !== 'single',
    }, 6);
    return articleOfDay(list);
  }, [articles, journeys, subject, pregnancy, child, children, main]);

  const youngestMonths = children?.length ? Math.min(...children.map((c) => childAge(c.birth_date).months)) : null;
  const quick = quickActionsFor(subject.type === 'pregnancy' ? 'pregnancy' : subject.type === 'child' ? 'child' : subject.type === 'family' ? 'family' : 'me', journeys);

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={96}>
        {/* En-tête */}
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginTop: spacing.xs }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="small" muted weight="bold">{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())}</Text>
            <Text variant="title" accessibilityRole="header">{greeting(profile?.display_name, now)}</Text>
            {subtitle ? <Text variant="small" muted>{subtitle}</Text> : null}
          </View>
          <Row gap={0}>
            <IconButton icon="maximize" label="Scanner un produit ou un aliment" onPress={() => router.push('/scanner')} />
            <IconButton icon="life-buoy" label="Besoin d’aide maintenant" color={t.colors.heart} onPress={() => router.push('/emergency')} />
            <View>
              <IconButton icon="bell" label={unread ? `Notifications, ${unread} non lues` : 'Notifications'} onPress={() => router.push('/notifications')} />
              {unread > 0 && <View style={{ position: 'absolute', top: 11, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: t.colors.heart }} />}
            </View>
          </Row>
        </Row>

        {/* 1. Profil actif */}
        <Appear kind="soft" delay={0.1}><ProfileSwitcher /></Appear>
        {!offline.online && <Banner tone="warning" title="Hors connexion">{offline.pending.length ? `${offline.pending.length} entrée(s) en attente de synchronisation.` : 'Vos données restent consultables ; les nouvelles saisies seront synchronisées.'}</Banner>}

        {/* 2. Carte principale */}
        <Appear kind="pop" delay={0.2}>
          {mainLoading ? <Skeleton kind="card" rows={1} />
            : mainError ? <ErrorView error={mainError.error} onRetry={() => { void profileQ.refetch(); void childrenQ.refetch(); }} />
            : subject.type === 'pregnancy' && pregnancy ? <PregnancyHero pregnancy={pregnancy} />
            : child ? <ChildToday child={child} compact />
              : cycleMode ? <CycleCard mode={cycleMode} />
                : (
                  <Card onPress={() => router.push('/me')} accessibilityLabel="Ouvrir l’espace Moi aussi">
                    <Text variant="heading">Moi aussi</Text>
                    <Text variant="small" muted>Votre santé, votre sommeil et votre humeur.</Text>
                  </Card>
                )}
        </Appear>

        {/* 3. Actions rapides */}
        <Appear kind="soft" delay={0.32}>
          <QuickActions keys={quick} childId={child?.id} />
        </Appear>

        {/* 4. Prochain rappel ou rendez-vous */}
        <Appear kind="soft" delay={0.42}><UpcomingCard /></Appear>

        {/* 4 bis. Après la naissance (mère : invitation douce ; conjoint : ce qu'elle a choisi de partager) */}
        <Appear kind="soft" delay={0.46}><PostpartumHomeCard journeys={profile?.journeys ?? []} youngestChildMonths={youngestMonths} /></Appear>

        {/* 5. Article du jour */}
        {article && (
          <Appear kind="soft" delay={0.5}>
            <Card onPress={() => router.push(`/article/${article.slug}`)} accessibilityLabel={`Article du jour : ${article.title}`}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>ARTICLE DU JOUR</Text>
                {isLocked(article, premium) && <Icon name="lock" size={14} color={t.colors.gold} />}
              </Row>
              <Text variant="heading" style={{ marginTop: 4 }}>{article.title}</Text>
              <Text variant="small" muted numberOfLines={2}>{article.summary}</Text>
            </Card>
          </Appear>
        )}

        {/* 6. Poser une question + Tous mes outils */}
        <Appear kind="btn" delay={0.6}>
          <Pressable accessibilityRole="button" accessibilityLabel="Poser une question à l’assistant" onPress={() => router.push('/assistant/chat')} style={({ pressed }) => ({ borderRadius: 24, overflow: 'hidden', transform: [{ scale: pressed ? 0.98 : 1 }] })}>
            <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, minHeight: MIN_TOUCH + 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="message-circle" color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text weight="bold" color="#FFFFFF">Poser une question</Text>
                <Text variant="caption" color="rgba(255,255,255,0.85)">Assistant d’information santé et parentalité</Text>
              </View>
              <Icon name="arrow-right" color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </Appear>
        <Appear kind="side" delay={0.7}>
          <Button label="Tous mes outils" icon="grid" variant="secondary" onPress={() => router.push('/tools')} full />
        </Appear>

        <DemoBanner />
      </Screen>
    </View>
  );
}
