/** Accueil intelligent : s'adapte au profil choisi, au moment de la journée et aux données saisies. */
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { DemoBanner, ProfileSwitcher } from '@/components/Family';
import { Sheet, useToast } from '@/components/Overlays';
import { Banner, Card, Chip, Icon, IconButton, Row, SectionTitle, Text } from '@/components/ui';
import { ChildToday, PregnancyHero, QuickActions, QUICK_KEYS, quickLabel, UpcomingCard } from '@/features/home';
import { DayThread, UniverseGrid, useSkyMoments } from '@/features/sky';
import { pregnancyProgress as pp } from '@/lib/domain/pregnancy';
import {
  useActivePregnancy, useActiveSubject, useArticles, useChildren, useMoods, useNotificationsInbox, usePremium, useProfile, useUpdateProfile,
} from '@/lib/data/hooks';
import { greeting } from '@/lib/domain/dates';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { childAge } from '@/lib/domain/child';
import { isLocked, suggestArticles } from '@/lib/domain/content';
import { useOfflineStore } from '@/lib/offline';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, NACRE, previewTime, spacing } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { Appear } from '@/components/Appear';
import { useUiStore } from '@/lib/store';

export default function Home() {
  const t = useTheme();
  const toast = useToast();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { subject } = useActiveSubject();
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  const { data: articles } = useArticles();
  const { data: inbox } = useNotificationsInbox();
  const { data: moods } = useMoods(1);
  const premium = usePremium();
  const offline = useOfflineStore();
  const [customizing, setCustomizing] = useState(false);

  const journeys = profile?.journeys ?? [];
  const unread = inbox?.filter((n) => !n.read_at).length ?? 0;
  const child = subject.type === 'child' ? children?.find((c) => c.id === subject.id) : undefined;
  const postpartum = journeys.includes('newborn') || (children ?? []).some((c) => childAge(c.birth_date).months < 12);
  const shortcuts = profile?.home_shortcuts ?? ['bottle', 'diaper', 'sleep', 'question'];
  const skyChildId = child?.id ?? (subject.type === 'family' ? children?.[0]?.id : undefined);
  const moments = useSkyMoments(skyChildId);
  const skyOverride = useUiStore((st) => st.skyOverride);
  const skyNow = skyOverride ? previewTime(skyOverride) : new Date();
  const skySubtitle = child
    ? `${child.first_name}, ${childAge(child.birth_date).label}`
    : subject.type === 'pregnancy' && pregnancy
      ? `${pp(pregnancy.due_date).label}, terme le ${new Date(pregnancy.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
      : undefined;

  const suggestions = useMemo(() => suggestArticles(articles ?? [], {
    journeys,
    weekSA: subject.type === 'pregnancy' && pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
    childAgesMonths: child ? [childAge(child.birth_date).months] : (children ?? []).map((c) => childAge(c.birth_date).months),
    postpartum: subject.type === 'me' ? postpartum : false,
    multiple: !!pregnancy && pregnancy.multiplicity !== 'single',
  }, 2), [articles, journeys, subject, pregnancy, child, children, postpartum]);

  const moodToday = moods?.[0] && new Date(moods[0].checked_at).toDateString() === new Date().toDateString();

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={96}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginTop: spacing.xs }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="small" muted weight="bold">{skyNow.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())}</Text>
            <Text variant="title" accessibilityRole="header">{greeting(profile?.display_name, skyNow)}</Text>
            {skySubtitle ? <Text variant="small" muted>{skySubtitle}</Text> : null}
          </View>
          <Row gap={0}>
            <IconButton icon="life-buoy" label="Besoin d’aide maintenant" color={t.colors.heart} onPress={() => router.push('/emergency')} />
            <View>
              <IconButton icon="bell" label={unread ? `Notifications, ${unread} non lues` : 'Notifications'} onPress={() => router.push('/notifications')} />
              {unread > 0 && <View style={{ position: 'absolute', top: 11, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: t.colors.heart }} />}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Réglages et profil" onPress={() => router.push('/settings')} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
              <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
                <Text weight="bold" color="#FFFFFF">{(profile?.display_name ?? '•').slice(0, 1).toUpperCase()}</Text>
              </LinearGradient>
            </Pressable>
          </Row>
        </Row>
        <Appear kind="soft" delay={0.16}><ProfileSwitcher /></Appear>
        {!offline.online && <Banner tone="warning" title="Hors connexion">{offline.pending.length ? `${offline.pending.length} entrée(s) en attente de synchronisation.` : 'Vos dernières données restent consultables ; les nouvelles saisies seront synchronisées.'}</Banner>}

        {subject.type === 'pregnancy' && pregnancy && <Appear kind="pop" delay={0.26}><PregnancyHero pregnancy={pregnancy} /></Appear>}
        <Appear kind="soft" delay={0.42}><SectionTitle title="Le fil du jour" /></Appear>
        <DayThread moments={moments} empty={child ? 'Rien d’enregistré aujourd’hui. Touchez « + » pour ajouter un moment.' : 'Vos rendez-vous et rappels du jour apparaîtront ici.'} />
        {subject.type === 'child' && child && <ChildToday child={child} compact />}

        {subject.type === 'family' && (
          <View style={{ gap: spacing.sm }}>
            {pregnancy && <PregnancyHero pregnancy={pregnancy} />}
            {(children ?? []).map((c) => <ChildToday key={c.id} child={c} />)}
          </View>
        )}

        {subject.type === 'me' && (
          <View style={{ gap: spacing.sm }}>
            <Card tone="soft" onPress={() => router.push('/me')} accessibilityLabel="Ouvrir l’espace Moi aussi">
              <Row>
                <Icon name="heart" color={t.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text variant="heading">Moi aussi</Text>
                  <Text variant="small" muted>{postpartum ? 'Récupération, émotions, rééducation, sommeil : un espace pour vous.' : 'Votre santé, votre cycle et votre bien-être.'}</Text>
                </View>
                <Icon name="chevron-right" color={t.colors.textMuted} />
              </Row>
            </Card>
            {(journeys.includes('avoid') || journeys.includes('ttc')) && (
              <Card onPress={() => router.push('/cycle')} accessibilityLabel="Ouvrir le suivi du cycle">
                <Row>
                  <Icon name="circle" color={t.colors.lavender} />
                  <View style={{ flex: 1 }}>
                    <Text weight="bold">Mon cycle</Text>
                    <Text variant="small" muted>Règles, symptômes et estimations — sans garantie.</Text>
                  </View>
                </Row>
              </Card>
            )}
          </View>
        )}

        {!moodToday && (subject.type === 'me' || postpartum) && (
          <Card tone="soft" onPress={() => router.push('/me/mood')} accessibilityLabel="Comment te sens-tu aujourd’hui ? Bilan facultatif">
            <Row>
              <View style={{ flex: 1 }}>
                <Text variant="heading">Comment te sens-tu aujourd’hui ?</Text>
                <Text variant="small" muted>Privé, facultatif, quelques secondes.</Text>
              </View>
              <Row gap={4}>{['😔', '😐', '🙂'].map((e) => <Text key={e} style={{ fontSize: 22 }}>{e}</Text>)}</Row>
            </Row>
          </Card>
        )}

        {(subject.type === 'child' || subject.type === 'family' || (subject.type === 'pregnancy' && children?.length)) && (
          <>
            <QuickActions keys={shortcuts} childId={child?.id ?? children?.[0]?.id} onCustomize={() => setCustomizing(true)} />
          </>
        )}

        <UpcomingCard />

        <SectionTitle title="Tout l’univers" />
        <UniverseGrid />

        {suggestions.length > 0 && (
          <>
            <SectionTitle title="À lire en ce moment" action="Tout voir" onAction={() => router.push('/(tabs)/discover')} />
            {suggestions.map((a, i) => (
              <Pressable key={a.id} onPress={() => router.push(`/article/${a.slug}`)} accessibilityRole="button" accessibilityLabel={`Article : ${a.title}`} style={({ pressed }) => ({ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: i ? 1 : 0, borderTopColor: t.colors.border, opacity: pressed ? 0.7 : 1 })}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="heading">{a.title}</Text>
                  <Text variant="small" muted numberOfLines={2}>{a.summary}</Text>
                </View>
                {isLocked(a, premium) && <Icon name="lock" size={16} color={t.colors.gold} />}
              </Pressable>
            ))}
          </>
        )}

        <DemoBanner />
      </Screen>

      <Sheet visible={customizing} onClose={() => setCustomizing(false)} title="Mes raccourcis">
        <Text muted>Choisissez jusqu’à 7 actions à afficher sur l’accueil.</Text>
        <Row wrap>
          {QUICK_KEYS.map((k) => {
            const sel = shortcuts.includes(k);
            return (
              <Chip key={k} label={quickLabel(k)} selected={sel} onPress={() => {
                const nextKeys = sel ? shortcuts.filter((x) => x !== k) : shortcuts.length >= 7 ? shortcuts : [...shortcuts, k];
                if (!sel && shortcuts.length >= 7) toast('7 raccourcis maximum.', 'info');
                updateProfile.mutate({ home_shortcuts: nextKeys });
              }} />
            );
          })}
        </Row>
      </Sheet>
    </View>
  );
}
