/**
 * « Ses découvertes » : carnet de diversification d'un enfant (données de CET enfant uniquement).
 *  · mosaïque d'aliments en verre dépoli sur fond crème, pêche et lavande, cercle coloré autour de chaque aliment ;
 *  · statut (pas encore proposé, goûté, apprécié, refusé pour le moment), réaction observée, date, texture,
 *    préparation, note, favori ; historique de chaque proposition ;
 *  · recherche, filtres, favoris, découvertes de la semaine, idées adaptées à l'âge, recettes avec les aliments déjà
 *    goûtés, allergènes, conseils de préparation, « Signaler une réaction » (sécurité immédiate, jamais de diagnostic) ;
 *  · progression par catégorie, sans total ni comparaison : « Lina a découvert 8 légumes et 6 fruits ».
 * Gratuit : aliments essentiels de chaque catégorie, 15 fiches par enfant, sécurité, historique de 30 jours.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { GlassSurface } from '@/components/Glass';
import { PremiumSection } from '@/components/Premium';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { TodaySummary } from '@/components/MiniApp';
import { Banner, Button, Chip, Field, Icon, IconButton, Row, SectionTitle, Text, haptic } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { RecipeArt } from '@/features/recipes/RecipeArt';
import { FoodArt } from '@/features/discoveries/FoodArt';
import { allergenLabel, textureLabel } from '@/features/recipes/labels';
import { useChild, useChildren, useMemberships, usePremium } from '@/lib/data/hooks';
import { callNumber, openLink } from '@/lib/links';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { useRecipes } from '@/lib/data/hooks-recipes';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteFood, useFoodEntries, useSaveFood, useTastings, useToggleFoodFavorite } from '@/lib/data/hooks-discoveries';
import { DISCOVERY_SOURCES, FOODS, FOOD_BY_KEY, matchFoodKey, FOOD_CATEGORIES, type FoodCategory, type FoodDef } from '@/content/discoveries/foods';
import {
  ageInMonths, discoveredThisWeek, displayState, freeFood, ideasForAge, PREPARATIONS, progressByCategory, reactionAdvice, recipesWithTasted,
  TEXTURES, topCategories, visibleHistory, type DisplayState, type FoodEntry, type FoodStatus, type ReactionSign, type Texture,
} from '@/lib/domain/discoveries';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { formatDate, t as tr, tMaybe, type TKey } from '@/i18n';
import { recentlyOffered } from '@/lib/domain/dayTimeline';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import type { Recipe } from '@/lib/recipes/types';

type Filter = 'all' | 'to_discover' | 'discovered' | 'retry' | 'favorites' | 'reaction';
const BASIC_FILTERS: Filter[] = ['all', 'favorites'];
const ADVANCED_FILTERS: Filter[] = ['to_discover', 'discovered', 'retry', 'reaction'];
const STATUSES: FoodStatus[] = ['not_yet', 'tasted', 'liked', 'refused'];
const SIGNS: ReactionSign[] = ['breathing', 'swelling', 'vomiting', 'faint', 'hives', 'redness_mouth', 'digestive', 'other'];
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const day = (iso: string) => formatDate(`${iso}T12:00:00`, { day: 'numeric', month: 'long' });

/** Clés de la 2e passe (fichiers passA.ts de src/i18n) ; repli sur une clé existante tant qu'elles ne sont pas branchées. */
const RECENT_KEY = ['pa', 'dc', 'recent'].join('.');
const RECENT_HINT_KEY = ['pa', 'dc', 'recentHint'].join('.');

export default function Discoveries() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const childrenQ = useChildren();
  const membershipsQ = useMemberships();
  const isLoading = (membershipsQ.isLoading && !membershipsQ.data) || (childrenQ.isLoading && !childrenQ.data);
  const loadError = membershipsQ.isError && !membershipsQ.data ? membershipsQ : childrenQ.isError && !childrenQ.data ? childrenQ : null;
  const premium = usePremium();
  const access = usePremiumAccess('diversification', child?.first_name);
  const entriesQ = useFoodEntries(child?.id);
  const tastingsQ = useTastings(child?.id);
  const { data: recipes } = useRecipes();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<FoodCategory | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<FoodDef | null>(null);
  const [reacting, setReacting] = useState(false);
  const [celebrate, setCelebrate] = useState<FoodDef | null>(null);
  const { width } = useWindowDimensions();
  const [boxW, setBoxW] = useState(0);

  const today = todayISO();
  const age = child ? ageInMonths(child.birth_date, today) : 0;
  // F-02 : aliments notés dans un repas avant la correction (sans clé) : reliés au catalogue par leur nom
  const entries = useMemo(() => (entriesQ.data ?? []).map((e) => (e.food_key ? e : { ...e, food_key: matchFoodKey(e.food_name) })), [entriesQ.data]);
  const tastings = tastingsQ.data ?? [];
  const byKey = useMemo(() => new Map(entries.filter((e) => e.food_key).map((e) => [e.food_key!, e])), [entries]);
  const progress = useMemo(() => progressByCategory(entries), [entries]);
  const top = topCategories(progress);
  const week = discoveredThisWeek(tastings, today);
  const recent = recentlyOffered(tastings, today).filter((k) => FOOD_BY_KEY[k]);
  const recentTitle = tMaybe(RECENT_KEY) ?? tr('dc.historyRecent');
  const recentHint = tMaybe(RECENT_HINT_KEY);
  const ideas = useMemo(() => ideasForAge(entries, age, 6, child?.allergies_declared ?? []), [entries, age, child?.allergies_declared]);

  const list = useMemo(() => FOODS.filter((f) => {
    const e = byKey.get(f.key);
    const st = displayState(e, f, age);
    if (cat && f.category !== cat) return false;
    if (q.trim() && !fold(f.name).includes(fold(q.trim()))) return false;
    if (filter === 'favorites') return !!e?.favorite;
    if (filter === 'to_discover') return st === 'to_discover' || st === 'not_yet_age';
    if (filter === 'discovered') return st === 'discovered';
    if (filter === 'retry') return st === 'retry_later';
    if (filter === 'reaction') return !!e?.reaction;
    return true;
  }), [byKey, cat, q, filter, age]);

  if (!child) {
    return (
      <Screen back title={tr('dc.title')}>
        {isLoading ? <Skeleton rows={3} /> : loadError ? (
          <ErrorView error={loadError.error} onRetry={() => { void membershipsQ.refetch(); void childrenQ.refetch(); }} title={tr('common.cannotShow')} />
        ) : (
          <EmptyState
            icon="user-x"
            title={tr('alb.notFound')}
            body={tr('cm2.member.notFoundBody')}
            action={{ label: tr('pj.blocked.home'), icon: 'home', onPress: () => router.replace('/(tabs)') }}
          />
        )}
      </Screen>
    );
  }
  const name = child.first_name;
  // Largeur réelle du conteneur (marges de l'écran comprises) : 3 colonnes dès 300 px, 4 sur tablette
  const avail = boxW || Math.min(width, 720) - spacing.lg * 2;
  const cols = avail >= 560 ? 4 : avail >= 300 ? 3 : 2;
  const cardW = Math.floor((avail - spacing.sm * (cols - 1)) / cols);
  const allergenFoods = FOODS.filter((f) => f.allergen);
  const history = visibleHistory(tastings, today, premium);
  const countLabel = (c: FoodCategory, n: number) => tr(`dc.count.${c}` as TKey, { count: n });

  function openFood(f: FoodDef) {
    if (!freeFood(f) && !premium && !byKey.get(f.key)) return access.showPreview(<Text variant="small">{tr('dc.lockedPreview', { name })}</Text>);
    setOpen(f);
  }

  return (
    <Screen back title={tr('dc.title')} subtitle={tr('dc.subtitle', { name, age: tr('dc.age', { count: age }) })}>
      <View testID="discoveries" />
      <LinearGradient pointerEvents="none" colors={t.isDark ? ['rgba(255,214,190,0.05)', 'rgba(201,184,255,0.06)'] : ['#FFF7EE', '#FDEBE0', '#F1EAFB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: -spacing.md, right: -spacing.md, height: 2400, borderRadius: 32 }} />

      {/* Résumé : progression par catégorie, sans total ni comparaison */}
      <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.55)' : 'rgba(255,255,255,0.62)'} depth={2} radius={26} padded={spacing.md}>
        <View testID="dc-hero" style={{ gap: 6 }}>
          <Text variant="label" muted>{tr('dc.hero.title', { name })}</Text>
          <Text variant="heading" testID="dc-hero-line">
            {top.length === 2 ? tr('dc.hero.line', { name, a: countLabel(top[0].category, top[0].count), b: countLabel(top[1].category, top[1].count) })
              : top.length === 1 ? tr('dc.hero.line1', { name, a: countLabel(top[0].category, top[0].count) })
                : tr('dc.hero.none', { name })}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 4 }}>
            {FOOD_CATEGORIES.filter((c) => progress[c] > 0).map((c) => (
              <View key={c} testID={`dc-progress-${c}`} style={{ alignItems: 'center', gap: 2, minWidth: 64 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: CAT_TINT[c] }}>
                  <Text weight="bold">{progress[c]}</Text>
                </View>
                <Text variant="caption" muted numberOfLines={1}>{tr(`dc.cat.${c}` as TKey)}</Text>
              </View>
            ))}
          </ScrollView>
          <Text variant="caption" muted>{tr('dc.hero.rhythm')}</Text>
        </View>
      </GlassSurface>

      <TodaySummary title={tr('dc.history')} testID="dc-summary" items={[
        { icon: 'check-circle', value: String(FOODS.filter((f) => displayState(byKey.get(f.key), f, age) === 'discovered').length), label: tr('dc.filter.discovered') },
        { icon: 'star', value: String(week.length), label: tr('dc.week') },
        { icon: 'alert-triangle', value: String(entries.filter((e) => e.reaction).length), label: tr('dc.filter.reaction') },
      ]} />
      <Button label={tr('dc.react')} icon="alert-triangle" variant="secondary" onPress={() => setReacting(true)} testID="dc-react" />

      {/* Cette semaine */}
      <SectionTitle title={tr('dc.week')} />
      {week.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }} testID="dc-week">
          {week.map((k) => { const f = FOOD_BY_KEY[k]; return f ? (
            <Tappable key={k} accessibilityRole="button" onPress={() => openFood(f)} style={{ alignItems: 'center', gap: 4, width: 76 }}>
              <FoodArt food={f} size={56} /><Text variant="caption" numberOfLines={1}>{f.name}</Text>
            </Tappable>
          ) : <Chip key={k} label={k} />; })}
        </ScrollView>
      ) : <Text muted variant="small">{tr('dc.weekNone')}</Text>}

      {/* Ajout rapide : aliments proposés ces 30 derniers jours, un geste ouvre la fiche pré-remplie */}
      {recent.length ? (
        <View style={{ gap: spacing.xs }} testID="dc-recent">
          <SectionTitle title={recentTitle} />
          {recentHint ? <Text variant="caption" muted>{recentHint}</Text> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {recent.map((k) => { const f = FOOD_BY_KEY[k]; return f ? (
              <Tappable key={k} accessibilityRole="button" accessibilityLabel={f.name} onPress={() => openFood(f)} testID={`dc-recent-${k}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, paddingRight: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surface }}>
                <FoodArt food={f} size={30} /><Text variant="small" weight="bold">{f.name}</Text><Icon name="plus" size={14} color={t.colors.primary} />
              </Tappable>
            ) : null; })}
          </View>
        </View>
      ) : null}

      {/* Idées adaptées à l'âge (Premium : suggestions personnalisées) */}
      <SectionTitle title={tr('dc.ideas')} />
      <PremiumSection feature="diversification" name={name} preview={<Text variant="small">{tr('dc.ideasHint')}</Text>} testID="dc-ideas-locked">
        <Text variant="small" muted>{tr('dc.ideasHint')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }} testID="dc-ideas">
          {ideas.map((f) => (
            <Tappable key={f.key} accessibilityRole="button" onPress={() => openFood(f)} testID={`dc-idea-${f.key}`} style={{ alignItems: 'center', gap: 4, width: 84 }}>
              <FoodArt food={f} size={60} /><Text variant="caption" numberOfLines={1}>{f.name}</Text>
            </Tappable>
          ))}
        </ScrollView>
      </PremiumSection>

      {/* Recherche et filtres */}
      <SectionTitle title={tr('dc.mosaic')} />
      <Field label={tr('dc.search')} value={q} onChangeText={setQ} placeholder={tr('dc.searchPh')} testID="dc-search" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        <Chip label={tr('dc.filter.allCats')} selected={!cat} onPress={() => setCat(null)} testID="dc-cat-all" />
        {FOOD_CATEGORIES.map((c) => <Chip key={c} label={tr(`dc.cat.${c}` as TKey)} selected={cat === c} onPress={() => setCat(cat === c ? null : c)} testID={`dc-cat-${c}`} />)}
      </ScrollView>
      <Row wrap>
        {BASIC_FILTERS.map((f) => <Chip key={f} label={tr(`dc.filter.${f}` as TKey)} icon={f === 'favorites' ? 'heart' : undefined} selected={filter === f} onPress={() => setFilter(f)} testID={`dc-filter-${f}`} />)}
        {ADVANCED_FILTERS.map((f) => (
          <Chip key={f} label={tr(`dc.filter.${f}` as TKey)} icon={premium ? undefined : 'lock'} selected={filter === f}
            onPress={() => { if (access.require(<Text variant="small">{tr('dc.filter.advancedHint')}</Text>)) setFilter(filter === f ? 'all' : f); }} testID={`dc-filter-${f}`} />
        ))}
      </Row>
      {!premium ? <Text variant="caption" muted testID="dc-quota">{tr('dc.quota', { used: entries.length, max: 15, name })}</Text> : null}

      {/* Mosaïque */}
      {entriesQ.isLoading && !entriesQ.data ? <Skeleton kind="card" rows={2} /> : list.length ? (
        <View onLayout={(e) => setBoxW(Math.floor(e.nativeEvent.layout.width))} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }} testID="dc-mosaic">
          {list.map((f) => <FoodTile key={f.key} food={f} entry={byKey.get(f.key)} state={displayState(byKey.get(f.key), f, age)} width={cardW} locked={!premium && !freeFood(f) && !byKey.get(f.key)} onPress={() => openFood(f)} />)}
        </View>
      ) : <EmptyState icon="search" title={tr('dc.none')} body={tr('dc.noneBody')} />}
      <Text variant="caption" muted>{tr('dc.legend')}</Text>

      {/* Allergènes : toujours gratuit */}
      <SectionTitle title={tr('dc.allergens')} />
      <Banner tone="info" icon="info">{tr('dc.allergensHint')}</Banner>
      <View style={{ gap: 6 }} testID="dc-allergens">
        {allergenFoods.map((f) => {
          const e = byKey.get(f.key);
          const st = displayState(e, f, age);
          return (
            <Tappable key={f.key} accessibilityRole="button" onPress={() => setOpen(f)} testID={`dc-allergen-${f.key}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 52 }}>
              <FoodArt food={f} size={44} />
              <View style={{ flex: 1 }}>
                <Text weight="bold">{f.name}</Text>
                <Text variant="caption" muted>{allergenLabel(f.allergen!)} · {tr(`dc.state.${st}` as TKey)}{e?.reaction ? ` · ${tr('dc.reactionNoted')}` : ''}</Text>
              </View>
              <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
            </Tappable>
          );
        })}
      </View>

      {/* Historique */}
      <SectionTitle title={tr('dc.history')} />
      <Text variant="caption" muted>{premium ? tr('dc.historyFull') : tr('dc.historyRecent')}</Text>
      {history.length ? (
        <View style={{ gap: 4 }} testID="dc-history">
          {history.slice(0, premium ? 200 : 40).map((h) => (
            <View key={h.id} testID={`dc-h-${h.id}`} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', minHeight: 40 }}>
              <Text variant="caption" muted style={{ width: 72 }}>{day(h.tasted_on)}</Text>
              <Text style={{ flex: 1 }} numberOfLines={2}>{h.food_name} · {tr(`dc.status.${h.status}` as TKey)}{h.texture ? ` · ${tr(`dc.texture.${h.texture}` as TKey)}` : ''}{h.reaction ? ` · ${tr('dc.reactionNoted')}` : ''}</Text>
            </View>
          ))}
        </View>
      ) : <Text muted variant="small">{tr('dc.historyNone')}</Text>}
      {!premium && tastings.length > history.length ? (
        <PremiumSection feature="diversification" name={name} preview={<Text variant="small">{tr('dc.historyMore', { count: tastings.length - history.length })}</Text>}><View /></PremiumSection>
      ) : null}

      <View style={{ gap: 2 }}>
        <Text variant="caption" muted>{tr('dc.sources')}</Text>
        {(['spf', 'anses_miel', 'lait_cru', 'ameli_quincke'] as const).map((k) => <SourceLink key={k} s={DISCOVERY_SOURCES[k]} />)}
        <Text variant="caption" muted>{tr('dc.disclaimer')}</Text>
      </View>

      <FoodSheet food={open} child={child} age={age} entry={open ? byKey.get(open.key) : undefined} entries={entries} tastings={tastings} recipes={recipes ?? []} premium={premium}
        onClose={() => setOpen(null)} onDiscovered={(f) => { setOpen(null); setCelebrate(f); }} onQuota={() => access.showPreview(<Text variant="small">{tr('dc.quotaPreview', { name })}</Text>, { used: entries.length, quota: 15, unit: tr('dc.quotaUnit') })} />
      <ReactionSheet visible={reacting} child={child} entries={entries} onClose={() => setReacting(false)} />
      <Celebration food={celebrate} name={name} onDone={() => setCelebrate(null)} />
    </Screen>
  );
}

const CAT_TINT: Record<FoodCategory, string> = {
  veg: '#7DA548', fruit: '#E5525F', starch: '#E8CF8E', cereal: '#D8A866', legume: '#E4774C', meat: '#B5654E', fish: '#6C8296',
  egg: '#F6D365', dairy: '#C9B8FF', fat: '#E9C84A', herb: '#4E9A3E', allergen: '#A8754A', other: '#B9A3D6',
};

function FoodTile({ food, entry, state, width, locked, onPress }: { food: FoodDef; entry?: FoodEntry; state: DisplayState; width: number; locked: boolean; onPress: () => void }) {
  const t = useTheme();
  const badge: Record<DisplayState, string> = { discovered: t.colors.success ?? '#3E8E41', retry_later: '#C9822B', to_discover: t.colors.textMuted, not_yet_age: t.colors.textMuted };
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={`${food.name}. ${tr(`dc.state.${state}` as TKey)}${entry?.favorite ? `. ${tr('dc.favorite')}` : ''}${locked ? `. ${tr('dc.locked')}` : ''}`}
      onPress={onPress} testID={`dc-food-${food.key}`} style={{ width }}>
      <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.5)' : 'rgba(255,255,255,0.58)'} depth={1} radius={22} padded={10} style={{ alignItems: 'center' }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <FoodArt food={food} size={Math.min(84, width - 28)} dim={state === 'not_yet_age' || locked} />
          <Text weight="bold" variant="small" center numberOfLines={2}>{food.name}</Text>
          <Text variant="caption" center color={badge[state]} numberOfLines={2} testID={`dc-state-${food.key}`}>{tr(`dc.state.${state}` as TKey)}</Text>
        </View>
        {entry?.favorite ? <View style={{ position: 'absolute', top: 6, right: 6 }}><Icon name="heart" size={14} color="#E5525F" /></View> : null}
        {locked ? <View style={{ position: 'absolute', top: 6, left: 6 }}><Icon name="lock" size={14} color={t.colors.textMuted} /></View> : null}
      </GlassSurface>
    </Tappable>
  );
}

function SourceLink({ s }: { s: { label: string; url: string; published?: string; consulted: string } }) {
  const t = useTheme();
  const toast = useToast();
  return (
    <Tappable accessibilityRole="link" onPress={() => openLink(s.url, toast)} style={{ minHeight: 32, justifyContent: 'center' }}>
      <Text variant="caption" color={t.colors.primary}>{s.label}{s.published ? ` (${formatDate(`${s.published}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' })})` : ''}</Text>
    </Tappable>
  );
}

// ---------------------------------------------------------------- fiche d'un aliment
function FoodSheet({ food, child, age, entry, entries, tastings, recipes, premium, onClose, onDiscovered, onQuota }: {
  food: FoodDef | null; entries: FoodEntry[]; child: { id: string; household_id: string; first_name: string }; age: number; entry?: FoodEntry; tastings: { id: string; food_key: string | null; tasted_on: string; status: string; texture: string | null; reaction: boolean }[];
  recipes: Recipe[]; premium: boolean; onClose: () => void; onDiscovered: (f: FoodDef) => void; onQuota: () => void;
}) {
  const t = useTheme();
  const toast = useToast();
  const save = useSaveFood();
  const fav = useToggleFoodFavorite();
  const del = useDeleteFood();
  const [status, setStatus] = useState<FoodStatus>('not_yet');
  const [date, setDate] = useState('');
  const [texture, setTexture] = useState<Texture | null>(null);
  const [prep, setPrep] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [reaction, setReaction] = useState(false);
  const [rxNote, setRxNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!food) return;
    setStatus(entry?.status && entry.status !== 'not_yet' ? entry.status : 'tasted');
    setDate(toFrDate(todayISO()));
    setTexture(entry?.texture ?? null); setPrep(entry?.preparation ?? null); setNote(entry?.note ?? '');
    setReaction(false); setRxNote(''); setErr(null);
  }, [food?.key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!food) return <Sheet visible={false} onClose={onClose} title=""><View /></Sheet>;
  const st = displayState(entry, food, age);
  const later = st === 'not_yet_age';
  const mine = tastings.filter((x) => x.food_key === food.key);
  const ideas = recipesWithTasted(recipes, entries, age, food.key);

  async function submit() {
    const iso = status === 'not_yet' ? null : frToISO(date);
    if (status !== 'not_yet' && !iso) return setErr(tr('dc.err.date'));
    if (iso && iso > todayISO()) return setErr(tr('dc.err.future'));
    const wasNew = !entry || entry.status === 'not_yet';
    try {
      await save.mutateAsync({ child, food: { key: food!.key, name: food!.name }, existing: entry ?? null, status, date: iso, texture, preparation: prep, note: note.trim() || null, reaction, reactionNote: reaction ? (rxNote.trim() || null) : null, log: status !== 'not_yet' });
      haptic('success');
      if (wasNew && (status === 'tasted' || status === 'liked')) onDiscovered(food!);
      else { toast(tr('dc.sheet.saved'), 'success'); onClose(); }
    } catch (e) {
      if (String((e as { hint?: string }).hint ?? (e as Error).message).includes('premium_required') || /Limite/.test((e as Error).message)) { onClose(); onQuota(); }
      else setErr(friendlyError(e));
    }
  }
  async function remove() {
    if (!entry || !(await confirm(tr('dc.sheet.deleteTitle', { food: food!.name }), tr('dc.sheet.deleteBody'), tr('common.delete')))) return;
    try { await del.mutateAsync({ entry, withHistory: true }); toast(tr('dc.sheet.deleted')); onClose(); } catch (e) { setErr(friendlyError(e)); }
  }

  return (
    <Sheet visible={!!food} onClose={onClose} title={food.name}>
      <View style={{ gap: spacing.sm }} testID="dc-sheet">
        <Row style={{ alignItems: 'center' }}>
          <FoodArt food={food} size={92} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="label" muted>{tr(`dc.cat.${food.category}` as TKey)}{food.allergen ? ` · ${tr('dc.allergen', { a: allergenLabel(food.allergen).toLowerCase() })}` : ''}</Text>
            <Text weight="bold" testID="dc-sheet-state">{later ? tr('dc.state.not_yet_age_long', { age: tr('dc.age', { count: food.minMonths ?? 4 }) }) : st === 'to_discover' ? tr('dc.state.to_discover_long') : tr(`dc.state.${st}` as TKey)}</Text>
            {entry?.first_tried_on ? <Text variant="caption" muted>{tr('dc.sheet.firstOn', { date: day(entry.first_tried_on) })}</Text> : null}
          </View>
          <IconButton icon="heart" label={entry?.favorite ? tr('dc.unfavorite') : tr('dc.favorite')} color={entry?.favorite ? '#E5525F' : t.colors.textMuted}
            onPress={() => fav.mutate({ child, food: { key: food.key, name: food.name }, existing: entry ?? null }, { onError: (e) => (/Limite|premium/.test(String(e)) ? onQuota() : toast(friendlyError(e), 'error')) })} />
        </Row>
        <View style={{ gap: 2 }}>
          <Text variant="small" weight="bold">{tr('dc.sheet.advice')}</Text>
          <Text variant="small">{food.prep}</Text>
          {food.care ? <Text variant="small"><Text variant="small" weight="bold">{tr('dc.sheet.care')} </Text>{food.care}</Text> : null}
          {food.source ? <SourceLink s={DISCOVERY_SOURCES[food.source]} /> : null}
        </View>
        {later ? <Banner tone="info" icon="clock">{tr('dc.sheet.laterHint')}</Banner> : null}

        <Text variant="label">{tr('dc.sheet.status')}</Text>
        <Row wrap>{STATUSES.map((s) => <Chip key={s} label={tr(`dc.status.${s}` as TKey)} selected={status === s} onPress={() => setStatus(s)} testID={`dc-status-${s}`} />)}</Row>
        {status !== 'not_yet' ? (
          <>
            <Field label={tr('dc.sheet.when')} value={date} onChangeText={setDate} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" testID="dc-date" />
            <Text variant="label">{tr('dc.sheet.texture')}</Text>
            <Row wrap>{TEXTURES.map((x) => <Chip key={x} label={tr(`dc.texture.${x}` as TKey)} selected={texture === x} onPress={() => setTexture(texture === x ? null : x)} testID={`dc-texture-${x}`} />)}</Row>
            <Text variant="label">{tr('dc.sheet.prep')}</Text>
            <Row wrap>{PREPARATIONS.map((x) => <Chip key={x} label={tr(`dc.prep.${x}` as TKey)} selected={prep === x} onPress={() => setPrep(prep === x ? null : x)} testID={`dc-prep-${x}`} />)}</Row>
            <Chip label={tr('dc.sheet.reaction')} icon="alert-circle" selected={reaction} onPress={() => setReaction(!reaction)} testID="dc-reaction" />
            {reaction ? <Field label={tr('dc.sheet.reactionNote')} value={rxNote} onChangeText={setRxNote} multiline maxLength={1000} hint={tr('dc.sheet.reactionHint')} testID="dc-reaction-note" /> : null}
            {reaction ? <ReactionAdvice signs={[]} name={child.first_name} /> : null}
          </>
        ) : null}
        <Field label={tr('dc.sheet.note')} optional value={note} onChangeText={setNote} multiline maxLength={1000} testID="dc-note" />
        {err ? <Text variant="small" color={t.colors.danger}>{err}</Text> : null}
        <Button label={tr('dc.sheet.save')} full loading={save.isPending} onPress={submit} testID="dc-save" />

        {mine.length ? (
          <View style={{ gap: 2 }} testID="dc-sheet-history">
            <Text variant="small" weight="bold">{tr('dc.sheet.history')}</Text>
            {mine.slice(0, premium ? 50 : 5).map((h) => <Text key={h.id} variant="caption" muted>{day(h.tasted_on)} · {tr(`dc.status.${h.status}` as TKey)}{h.texture ? ` · ${tr(`dc.texture.${h.texture}` as TKey)}` : ''}{h.reaction ? ` · ${tr('dc.reactionNoted')}` : ''}</Text>)}
          </View>
        ) : null}

        <Text variant="small" weight="bold">{tr('dc.sheet.recipes', { food: food.name })}</Text>
        <PremiumSection feature="diversification" name={child.first_name} preview={<Text variant="small">{tr('dc.sheet.recipesHint')}</Text>} testID="dc-recipes-locked">
          <Text variant="caption" muted>{tr('dc.sheet.recipesHint')}</Text>
          {ideas.length ? ideas.slice(0, 6).map((r) => <RecipeLine key={r.id} r={r} onOpen={() => { onClose(); router.push(`/meals/${r.slug}`); }} />)
            : <Text variant="small" muted testID="dc-recipes-none">{tr('dc.sheet.recipesNone', { food: food.name })}</Text>}
        </PremiumSection>
        {entry ? <Button label={tr('dc.sheet.delete')} variant="ghost" icon="trash-2" onPress={remove} testID="dc-delete" /> : null}
      </View>
    </Sheet>
  );
}

function RecipeLine({ r, onOpen }: { r: Recipe; onOpen: () => void }) {
  const total = r.prepMin + r.cookMin;
  const freezes = r.freezing && !/^ne se cong|non|pas de cong/i.test(r.freezing);
  return (
    <Tappable accessibilityRole="button" onPress={onOpen} testID={`dc-recipe-${r.slug}`} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', minHeight: 64 }}>
      <View style={{ width: 64 }}><RecipeArt recipe={r} height={56} label={false} rounded={12} /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="bold" variant="small" numberOfLines={2}>{r.title}</Text>
        <Text variant="caption" muted numberOfLines={3}>
          {[tr('dc.recipe.time', { n: total }), r.textures.map((x) => textureLabel(x).toLowerCase()).join(', '),
            r.allergens.length ? tr('dc.recipe.allergens', { list: r.allergens.map((a) => allergenLabel(a).toLowerCase()).join(', ') }) : tr('dc.recipe.noAllergen'),
            freezes ? tr('dc.recipe.freeze') : tr('dc.recipe.noFreeze'), r.familyAdaptations || r.audiences.includes('family') ? tr('dc.recipe.family') : null].filter(Boolean).join(' · ')}
        </Text>
        <Text variant="caption" muted numberOfLines={2}>{tr('dc.recipe.storage')} {r.storage}</Text>
      </View>
    </Tappable>
  );
}

// ---------------------------------------------------------------- réaction
function ReactionAdvice({ signs, name }: { signs: ReactionSign[]; name: string }) {
  const toast = useToast();
  const level = reactionAdvice(signs);
  return (
    <View style={{ gap: 6 }} testID={`dc-rx-${level}`}>
      {level === 'emergency' ? (
        <Banner tone="danger" icon="phone" title={tr('dc.rx.emergencyTitle')}>{tr('dc.rx.emergencyBody')}</Banner>
      ) : (
        <Banner tone="warning" icon="info" title={tr('dc.rx.adviceTitle')}>{tr('dc.rx.adviceBody', { name })}</Banner>
      )}
      {level === 'emergency' ? (
        <Row wrap>
          <Button label={tr('dc.rx.call15')} icon="phone" onPress={() => callNumber('15', toast)} testID="dc-call-15" />
          <Button label={tr('dc.rx.call112')} icon="phone" variant="secondary" onPress={() => callNumber('112', toast)} />
        </Row>
      ) : null}
      <Text variant="caption" muted>{tr('dc.rx.noDiagnosis')}</Text>
    </View>
  );
}

function ReactionSheet({ visible, child, entries, onClose }: { visible: boolean; child: { id: string; household_id: string; first_name: string }; entries: FoodEntry[]; onClose: () => void }) {
  const toast = useToast();
  const save = useSaveFood();
  const [signs, setSigns] = useState<ReactionSign[]>([]);
  const [food, setFood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  useEffect(() => { if (visible) { setSigns([]); setFood(null); setNote(''); } }, [visible]);
  const recent = [...entries].filter((e) => e.status !== 'not_yet' && e.food_key).sort((a, b) => (b.first_tried_on ?? '').localeCompare(a.first_tried_on ?? '')).slice(0, 8);
  const pool = recent.length ? recent.map((e) => FOOD_BY_KEY[e.food_key!]).filter(Boolean) : FOODS.filter((f) => f.allergen).slice(0, 8);
  async function submit() {
    const f = food ? FOOD_BY_KEY[food] : null;
    if (!f) return toast(tr('dc.rx.pickFood'), 'info');
    const existing = entries.find((e) => e.food_key === f.key) ?? null;
    const text = [signs.map((s) => tr(`dc.sign.${s}` as TKey)).join(', '), note.trim()].filter(Boolean).join(' — ') || null;
    try {
      await save.mutateAsync({ child, food: { key: f.key, name: f.name }, existing, status: existing?.status && existing.status !== 'not_yet' ? existing.status : 'tasted', date: todayISO(), texture: existing?.texture ?? null, preparation: existing?.preparation ?? null, note: existing?.note ?? null, reaction: true, reactionNote: text, log: true });
      toast(tr('dc.rx.saved', { food: f.name }), 'success');
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={tr('dc.rx.title')}>
      <View style={{ gap: spacing.sm }} testID="dc-rx-sheet">
        <Text variant="label">{tr('dc.rx.signs')}</Text>
        <Row wrap>{SIGNS.map((s) => <Chip key={s} label={tr(`dc.sign.${s}` as TKey)} selected={signs.includes(s)} onPress={() => setSigns(signs.includes(s) ? signs.filter((x) => x !== s) : [...signs, s])} testID={`dc-sign-${s}`} />)}</Row>
        {signs.length ? <ReactionAdvice signs={signs} name={child.first_name} /> : null}
        <Text variant="label">{tr('dc.rx.food')}</Text>
        <Row wrap>{pool.map((f) => <Chip key={f.key} label={f.name} selected={food === f.key} onPress={() => setFood(f.key)} testID={`dc-rx-food-${f.key}`} />)}</Row>
        <Field label={tr('dc.sheet.reactionNote')} optional value={note} onChangeText={setNote} multiline maxLength={800} hint={tr('dc.sheet.reactionHint')} testID="dc-rx-note" />
        <Button label={tr('dc.rx.save')} full loading={save.isPending} onPress={submit} testID="dc-rx-save" />
        <SourceLink s={DISCOVERY_SOURCES.ameli_quincke} />
      </View>
    </Sheet>
  );
}

// ---------------------------------------------------------------- animation douce « découvert »
function Celebration({ food, name, onDone }: { food: FoodDef | null; name: string; onDone: () => void }) {
  const reduce = useReduceMotion();
  const toast = useToast();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!food) return;
    toast(tr('dc.sheet.firstTime', { name, food: food.name }), 'success');
    if (reduce) { const id = setTimeout(onDone, 900); return () => clearTimeout(id); }
    v.setValue(0);
    Animated.sequence([
      Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }),
      Animated.delay(700),
      Animated.timing(v, { toValue: 2, duration: 280, useNativeDriver: true }),
    ]).start(() => onDone());
    return undefined;
  }, [food?.key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!food) return null;
  const scale = v.interpolate({ inputRange: [0, 1, 2], outputRange: [0.6, 1, 1.08] });
  const opacity = v.interpolate({ inputRange: [0, 0.4, 1, 2], outputRange: [0, 1, 1, 0] });
  return (
    <View pointerEvents="none" testID="dc-celebrate" style={{ position: 'absolute', top: 120, left: 0, right: 0, alignItems: 'center' }}>
      <Animated.View style={{ transform: [{ scale: reduce ? 1 : scale }], opacity: reduce ? 1 : opacity, alignItems: 'center', gap: 8 }}>
        <View style={{ padding: 10, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.75)' }}><FoodArt food={food} size={120} /></View>
        <Text weight="bold" center>{tr('dc.sheet.firstTime', { name, food: food.name })}</Text>
      </Animated.View>
    </View>
  );
}
