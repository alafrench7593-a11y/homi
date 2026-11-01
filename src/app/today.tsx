/**
 * « Aujourd'hui » : résumé du matin ou du soir, calculé à l'ouverture avec les données à jour.
 * Rendez-vous et rappels, prochaine sieste estimée (planificateur Premium) ou aperçu, prochain biberon (minuteur),
 * grossesse, réponses reçues, activité des groupes suivis, recette et articles adaptés, question du jour facultative,
 * bilan du soir. Rien n'est inventé ni culpabilisant ; une rubrique sans donnée n'apparaît pas.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { Button, Card, Icon, type IconName, Row, Segmented, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useActivePregnancy, useAppointments, useArticles, useLogs, usePremium, useProfile, useTrackedChildren } from '@/lib/data/hooks';
import { useRelevantNotifications, useScope } from '@/lib/data/hooks-scope';
import { useBottleTimer } from '@/lib/data/hooks-bottle';
import { useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { useFoodProfile, useRecipeDislikes, useRecipes } from '@/lib/data/hooks-recipes';
import { useDigestPrefs, useGroups, useSaveDigestPrefs } from '@/lib/data/hooks-social';
import { useRows } from '@/lib/data/hooks';
import { buildDigest, sleepMinutesToday, type DigestMoment } from '@/lib/domain/dailyDigest';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { childAge } from '@/lib/domain/child';
import { suggestArticles } from '@/lib/domain/content';
import { recipeOfDay } from '@/lib/recipes/engine';
import type { Bottle, Breastfeed, Diaper, FeedPost, Meal, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export default function Today() {
  const t = useTheme();
  const params = useLocalSearchParams<{ moment?: string }>();
  const now = useMemo(() => new Date(), []);
  const defaultMoment: DigestMoment = params.moment === 'evening' || params.moment === 'morning' ? params.moment : now.getHours() >= 17 ? 'evening' : 'morning';
  const [moment, setMoment] = React.useState<DigestMoment>(defaultMoment);

  const { data: profile } = useProfile();
  const scope = useScope();
  const premium = usePremium();
  const pregnancy = useActivePregnancy();
  const { data: children } = useTrackedChildren();
  const child = scope.child ?? (scope.scope === 'family' ? children?.[0] ?? null : null);
  const prefsQ = useDigestPrefs();
  const savePrefs = useSaveDigestPrefs();
  const prefs = prefsQ.data;

  const { data: appointments } = useAppointments({ upcomingOnly: true });
  const { data: inbox } = useRelevantNotifications();
  const { plan, sleeps } = useSleepPlan(child && child.enabled_tracking.includes('sleep') ? child : null, 60_000);
  const { active: bottleTimer } = useBottleTimer(child?.id);
  const { data: bottles } = useLogs<Bottle>('bottle', child?.id, 1);
  const { data: feeds } = useLogs<Breastfeed>('breastfeed', child?.id, 1);
  const { data: diapers } = useLogs<Diaper>('diaper', child?.id, 1);
  const { data: meals } = useLogs<Meal>('meal', child?.id, 1);
  const { data: groups } = useGroups();
  const recent = useRows<FeedPost>(['forum_feed', 'today'], { table: 'forum_feed', order: [{ col: 'created_at', asc: false }], limit: 100 }, { staleTime: 60_000 });
  const { data: recipes } = useRecipes();
  const { profile: foodProfile } = useFoodProfile();
  const dislikes = useRecipeDislikes();
  const { data: articles } = useArticles();

  const digest = useMemo(() => {
    const today = startOfDay(now).getTime();
    const isToday = (iso: string) => Date.parse(iso) >= today;
    const myGroups = new Set((groups ?? []).filter((g) => g.is_member).map((g) => g.id));
    const groupPosts = (recent.data ?? []).filter((p) => p.group_id && myGroups.has(p.group_id) && !p.is_mine && now.getTime() - Date.parse(p.created_at) < 86_400_000).length;
    const weekSA = scope.scope === 'pregnancy' && pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null;
    const art = suggestArticles(articles ?? [], {
      journeys: scope.scope === 'pregnancy' ? ['pregnant'] : scope.scope === 'baby' ? ['newborn'] : scope.scope === 'child' ? ['child'] : [],
      weekSA, childAgesMonths: child ? [childAge(child.birth_date).months] : [], postpartum: scope.scope === 'postpartum', multiple: false,
    }, 2);
    const sleepDays = new Set((sleeps ?? []).map((s) => s.started_at.slice(0, 10))).size;
    return buildDigest({
      moment, now, hidden: prefs.hidden_items, questionEnabled: prefs.question, firstName: profile?.display_name ?? null,
      childName: child?.first_name ?? null, childId: child?.id ?? null, scope: scope.scope,
      events: (appointments ?? []).map((a) => ({ title: a.title, at: a.starts_at, link: '/calendar' })),
      nextNap: premium && plan?.nextNap ? { at: new Date(plan.nextNap.at).toISOString() } : null,
      sleepPlannerTeaser: !premium && sleepDays >= 3,
      nextBottle: bottleTimer ? { at: bottleTimer.due_at } : null,
      pregnancy: weekSA != null && pregnancy ? { label: pregnancyProgress(pregnancy.due_date).label, detail: tr('trk.digest.pregDetail') } : null,
      groupPosts,
      unreadReplies: (inbox ?? []).filter((n) => !n.read_at && n.category.startsWith('community_') && n.category !== 'community_like').length,
      recipe: (() => { const r = recipes ? recipeOfDay(recipes, foodProfile, undefined, dislikes.ids) : null; return r ? { title: r.title, slug: r.slug } : null; })(),
      articles: art.map((a) => ({ title: a.title, slug: a.slug })),
      day: child ? {
        bottles: (bottles ?? []).filter((b) => isToday(b.at)).length,
        bottleMl: (bottles ?? []).filter((b) => isToday(b.at)).reduce((s, b) => s + (b.consumed_ml ?? 0), 0),
        feeds: (feeds ?? []).filter((f) => isToday(f.started_at)).length,
        diapers: (diapers ?? []).filter((d) => isToday(d.at)).length,
        sleepMinutes: sleepMinutesToday(sleeps ?? [], now),
        meals: (meals ?? []).filter((m) => isToday(m.at)).length,
      } : null,
    });
  }, [moment, now, prefs, profile, child, scope.scope, appointments, premium, plan, sleeps, bottleTimer, pregnancy, groups, recent.data, inbox, recipes, foodProfile, dislikes.ids, articles, bottles, feeds, diapers, meals]);

  const question = digest.items.find((i) => i.key === 'question');
  return (
    <Screen back title={moment === 'morning' ? tr('trk.digest.morning') : tr('trk.digest.evening')} subtitle={digest.title}>
      <Segmented label={tr('trk.digest.moment')} value={moment} onChange={(v) => setMoment(v as DigestMoment)} options={[{ value: 'morning', label: tr('trk.digest.morningOpt') }, { value: 'evening', label: tr('trk.digest.eveningOpt') }]} />
      <Text variant="small" muted>{digest.subtitle}</Text>
      <View style={{ gap: spacing.sm }} testID="digest-items">
        {digest.items.filter((i) => i.key !== 'question').map((it, i) => (
          <Appear key={it.key} kind="soft" delay={0.05 * i}>
            <Tappable accessibilityRole={it.link ? 'button' : 'text'} accessibilityLabel={`${it.title}${it.detail ? `. ${it.detail}` : ''}`} disabled={!it.link}
              onPress={() => it.link && router.push(it.link as never)} testID={`digest-${it.key}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, minHeight: MIN_TOUCH + 12, borderRadius: radius.lg, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: (it.premium ? t.colors.gold : t.colors.primary) + '1F' }}>
                <Icon name={it.icon as IconName} size={18} color={it.premium ? t.colors.gold : t.colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text weight="bold">{it.title}</Text>
                {it.detail ? <Text variant="small" muted>{it.detail}</Text> : null}
              </View>
              {it.premium ? <Text variant="caption" color={t.colors.gold}>{tr('trk.digest.premium')}</Text> : it.link ? <Icon name="chevron-right" size={18} color={t.colors.textMuted} /> : null}
            </Tappable>
          </Appear>
        ))}
      </View>
      {question ? (
        <Card testID="digest-question">
          <Row gap={6}><Icon name="help-circle" size={16} color={t.colors.lavender} /><Text variant="caption" weight="bold" muted>{tr('trk.digest.question')}</Text></Row>
          <Text variant="heading" style={{ marginTop: 4 }}>{question.detail}</Text>
          <Row wrap gap={6} style={{ marginTop: spacing.sm }}>
            <Button label={tr('trk.digest.answer')} size="sm" icon="message-circle" onPress={() => router.push({ pathname: '/community/new', params: { title: question.detail ?? '', kind: 'testimony' } })} testID="digest-question-share" />
            <Button label={tr('trk.digest.hide')} size="sm" variant="ghost" onPress={() => savePrefs.mutateAsync({ ...prefs, question: false })} />
          </Row>
        </Card>
      ) : null}
      <Button label={tr('trk.digest.settings')} icon="bell" variant="secondary" onPress={() => router.push('/community/notifications')} testID="digest-settings" />
      {!prefs.morning && !prefs.evening ? (
        <Text variant="caption" muted>{tr('trk.digest.noNotif')}</Text>
      ) : null}
    </Screen>
  );
}
