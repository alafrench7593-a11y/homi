/**
 * Idées de prénoms : près de 13 000 prénoms donnés en France (INSEE, Licence Ouverte), recherche, A à Z,
 * féminin / masculin / mixte, longueur, fréquence, origine et signification (liste éditoriale), favoris,
 * vote avec le coparent, suggestions pour une fratrie et pour des jumeaux ou triplés.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Chip, Field, IconButton, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { ensureHousehold, useActivePregnancy, useBabyNames, useChildren, useHouseholdId, useHouseholdMembers, useInvalidate, useNameFavorites, useNameVotes } from '@/lib/data/hooks';
import { buildNames, filterNames, fold, LETTERS, lenOf, originsOf, popOf, siblingSuggestions, twinSuggestions, type Gender, type Len, type NameEntry, type Pop } from '@/lib/domain/names';
import { getLocale, t as tr, type TKey } from '@/i18n';

const L = (fr: string, en: string) => (getLocale().startsWith('fr') ? fr : en);
import { friendlyError } from '@/lib/data/hooks-settings';
import type { NameFavorite, NameVote } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

type Mode = 'explore' | 'favorites' | 'ideas';
const norm = fold;
const ROW_H = 84; // deux lignes de détails tiennent sans être coupées sur un petit écran
// Base INSEE chargée à la première ouverture de l'écran
let RAW: Parameters<typeof buildNames>[0] | null = null;
const rawNames = () => (RAW ??= require('@/content/firstnames.json') as Parameters<typeof buildNames>[0]);
const genderLabel = (g: Gender) => tr(`nm.g.${g}` as TKey);
const popLabel = (p: Pop) => tr(`nm.pop.${p}` as TKey);

export default function NamesScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const hid = useHouseholdId();
  const insets = useSafeAreaInsets();
  const namesQ = useBabyNames();
  const { data: names } = namesQ;
  const favoritesQ = useNameFavorites();
  const { data: favorites } = favoritesQ;
  const { data: votes } = useNameVotes();
  const { data: members } = useHouseholdMembers();
  const [view, setView] = useState<Mode>('explore');
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [letter, setLetter] = useState<string | null>(null);
  const [len, setLen] = useState<Len | null>(null);
  const [pop, setPop] = useState<Pop | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  const [sort, setSort] = useState<'az' | 'pop'>('az');
  const [twinBase, setTwinBase] = useState('');
  const pregnancy = useActivePregnancy();
  const { data: kids } = useChildren();
  const [custom, setCustom] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [moreFilters, setMoreFilters] = useState(false);

  const favByName = useMemo(() => new Map((favorites ?? []).map((f) => [norm(f.name), f])), [favorites]);
  const all = useMemo(() => buildNames(rawNames(), names ?? []), [names]);
  const origins = useMemo(() => originsOf(all), [all]);
  const filtered = useMemo(() => filterNames(all, { q: query, letter, gender, len, pop, origin, sort }), [all, query, letter, gender, len, pop, origin, sort]);
  const siblings = (kids ?? []).map((c) => c.first_name);
  const sibIdeas = useMemo(() => siblingSuggestions(all, siblings, gender), [all, siblings.join(','), gender]); // eslint-disable-line react-hooks/exhaustive-deps
  const twins = useMemo(() => twinSuggestions(all, twinBase, gender), [all, twinBase, gender]);
  const multiple = pregnancy && pregnancy.multiplicity !== 'single';

  const hasPartner = (members?.length ?? 0) > 1;
  const votesFor = (f: NameFavorite) => (votes ?? []).filter((v) => v.favorite_id === f.id);
  const score = (f: NameFavorite) => votesFor(f).reduce((s, v) => s + v.vote, 0);
  const sortedFavorites = [...(favorites ?? [])].sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name, 'fr'));

  async function addFavorite(name: string) {
    const clean = name.trim();
    if (!clean) return;
    setBusy(clean);
    try {
      const h = hid ?? (await ensureHousehold());
      await backend.insert('name_favorites', { household_id: h, name: clean, list_label: 'Favoris', added_by: userId });
      inv('name_favorites', 'memberships');
      toast(`${clean} ajouté aux favoris.`);
    } catch (e) {
      toast(friendlyError(e, 'Ajout impossible.'), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function removeFavorite(f: NameFavorite, ask = false) {
    if (ask && votesFor(f).length && !(await confirm(`Retirer ${f.name} ?`, 'Les votes associés seront aussi supprimés.', 'Retirer'))) return;
    setBusy(f.name);
    try {
      await backend.remove('name_votes', [eq('favorite_id', f.id), eq('user_id', userId)]).catch(() => undefined);
      await backend.remove('name_favorites', [eq('id', f.id)]);
      inv('name_favorites', 'name_votes');
    } catch (e) {
      toast(friendlyError(e, 'Suppression impossible.'), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function toggleFavorite(n: NameEntry) {
    const f = favByName.get(norm(n.name));
    if (f) await removeFavorite(f, true);
    else await addFavorite(n.name);
  }

  async function vote(f: NameFavorite, value: -1 | 1) {
    const mine = (votes ?? []).find((v) => v.favorite_id === f.id && v.user_id === userId);
    const next: NameVote['vote'] = mine?.vote === value ? 0 : value;
    setBusy(`vote-${f.id}`);
    try {
      if (mine) await backend.update('name_votes', { vote: next }, [eq('favorite_id', f.id), eq('user_id', userId)]);
      else await backend.insert('name_votes', { favorite_id: f.id, household_id: f.household_id, user_id: userId, vote: next });
      inv('name_votes');
    } catch (e) {
      toast(friendlyError(e, 'Vote impossible.'), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function addCustom() {
    const clean = custom.trim();
    if (!clean) return setCustomError('Indiquez un prénom.');
    if (clean.length > 40) return setCustomError('40 caractères maximum.');
    if (favByName.has(norm(clean))) return setCustomError('Ce prénom est déjà dans vos favoris.');
    setCustomError(null);
    await addFavorite(clean);
    setCustom('');
  }

  const explore = view === 'explore';
  const activeQ = view === 'favorites' ? favoritesQ : namesQ;
  const loading = activeQ.isLoading && !activeQ.data;
  const failed = activeQ.isError && !activeQ.data;

  const renderName = (n: NameEntry) => {
    const fav = favByName.has(norm(n.name));
    const meta = [genderLabel(n.gender), n.recent ? tr('nm.births', { count: n.recent.toLocaleString('fr-FR') }) : popLabel('old'), n.origin, n.meaning].filter(Boolean).join(' · ');
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: ROW_H - 8 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="medium">{n.name}</Text>
          <Text variant="small" muted numberOfLines={2} intentionalTruncation accessibilityLabel={meta}>{meta}</Text>
        </View>
        <IconButton
          icon="heart"
          color={fav ? t.colors.primary : t.colors.textMuted}
          label={fav ? `Retirer ${n.name} des favoris` : `Ajouter ${n.name} aux favoris`}
          onPress={() => { if (busy !== n.name) void toggleFavorite(n); }}
          style={fav ? { backgroundColor: t.colors.surfaceAlt } : undefined}
        />
      </View>
    );
  };
  const nameChips = (list: NameEntry[]) => (
    <Row wrap>{list.map((n) => <Chip key={n.key} label={n.name} selected={favByName.has(n.key)} onPress={() => void toggleFavorite(n)} accessibilityLabel={`${n.name}, ${genderLabel(n.gender)}. ${favByName.has(n.key) ? 'Retirer des favoris' : 'Ajouter aux favoris'}`} />)}</Row>
  );

  const renderFavorite = (f: NameFavorite) => {
    const vs = votesFor(f);
    const mine = vs.find((v) => v.user_id === userId)?.vote ?? 0;
    const others = vs.filter((v) => v.user_id !== userId && v.vote !== 0);
    const othersLabel = others.length
      ? others.map((v) => (v.vote > 0 ? 'aime' : 'n’est pas convaincu·e')).join(', ')
      : hasPartner ? 'pas encore de vote' : null;
    const voting = busy === `vote-${f.id}`;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 56, paddingVertical: spacing.xs }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="medium">{f.name}</Text>
          <Text variant="small" muted>{[othersLabel ? `Coparent : ${othersLabel}` : null, `score ${score(f) > 0 ? '+' : ''}${score(f)}`].filter(Boolean).join(' · ')}</Text>
        </View>
        <IconButton icon="thumbs-up" label={`J’aime ${f.name}${mine === 1 ? ' (sélectionné)' : ''}`} color={mine === 1 ? t.colors.primary : t.colors.textMuted} style={mine === 1 ? { backgroundColor: t.colors.surfaceAlt } : undefined} onPress={() => { if (!voting) void vote(f, 1); }} />
        <IconButton icon="thumbs-down" label={`Je n’aime pas ${f.name}${mine === -1 ? ' (sélectionné)' : ''}`} color={mine === -1 ? t.colors.primary : t.colors.textMuted} style={mine === -1 ? { backgroundColor: t.colors.surfaceAlt } : undefined} onPress={() => { if (!voting) void vote(f, -1); }} />
        <IconButton icon="x" label={`Retirer ${f.name} des favoris`} color={t.colors.textMuted} onPress={() => { if (busy !== f.name) void removeFavorite(f, true); }} />
      </View>
    );
  };

  const top = sortedFavorites[0];
  const myVotes = (votes ?? []).filter((v) => v.user_id === userId && v.vote !== 0).length;
  const extraActive = (len ? 1 : 0) + (pop ? 1 : 0) + (origin ? 1 : 0);
  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.xs }}>
      <TodaySummary title={L('Nos prénoms', 'Our names')} items={[
        { icon: 'heart', value: String(favorites?.length ?? 0), label: L('Favoris', 'Favourites') },
        { icon: 'award', value: top ? top.name : '—', label: L('En tête', 'Top pick') },
        { icon: 'thumbs-up', value: String(myVotes), label: L('Mes votes', 'My votes') },
      ]} />
      <Segmented
        label="Affichage"
        value={view}
        onChange={setView}
        options={[{ value: 'explore', label: tr('nm.tab.explore') }, { value: 'ideas', label: tr('nm.tab.ideas') }, { value: 'favorites', label: `${tr('nm.tab.favorites')}${favorites?.length ? ` (${favorites.length})` : ''}` }]}
      />
      {explore ? (
        <>
          <Field label={tr('nm.search')} value={query} onChangeText={setQuery} placeholder={tr('nm.searchPh')} autoCorrect={false} testID="names-search" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }} accessibilityLabel={tr('nm.az')}>
            <Chip label={tr('nm.allLetters')} selected={!letter} onPress={() => setLetter(null)} />
            {LETTERS.map((l) => <Chip key={l} label={l} selected={letter === l} onPress={() => setLetter(letter === l ? null : l)} accessibilityLabel={tr('nm.letterA11y', { l })} />)}
          </ScrollView>
          <Row wrap>
            {(['f', 'm', 'x'] as Gender[]).map((g) => <Chip key={g} label={genderLabel(g)} selected={gender === g} onPress={() => setGender(gender === g ? null : g)} />)}
            <Chip label={`${L('Plus de filtres', 'More filters')}${extraActive ? ` · ${extraActive}` : ''}`} icon={moreFilters ? 'chevron-up' : 'sliders'} selected={moreFilters || extraActive > 0} onPress={() => setMoreFilters(!moreFilters)} testID="names-more-filters" />
          </Row>
          {moreFilters ? (
            <>
              <Row wrap>
                {(['short', 'medium', 'long'] as Len[]).map((l) => <Chip key={l} tone="lavender" label={tr(`nm.len.${l}` as TKey)} selected={len === l} onPress={() => setLen(len === l ? null : l)} />)}
              </Row>
              <Row wrap>
                {(['very', 'common', 'uncommon', 'rare', 'old'] as Pop[]).map((p) => <Chip key={p} label={popLabel(p)} selected={pop === p} onPress={() => setPop(pop === p ? null : p)} />)}
              </Row>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                {origins.map((o) => <Chip key={o} tone="lavender" label={o} selected={origin === o} onPress={() => setOrigin(origin === o ? null : o)} />)}
              </ScrollView>
            </>
          ) : null}
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="small" muted testID="names-count">{tr('nm.count', { count: filtered.length.toLocaleString('fr-FR') })}</Text>
            <Row gap={4}>
              <Chip label={tr('nm.sort.az')} selected={sort === 'az'} onPress={() => setSort('az')} />
              <Chip label={tr('nm.sort.pop')} selected={sort === 'pop'} onPress={() => setSort('pop')} />
            </Row>
          </Row>
        </>
      ) : view === 'ideas' ? (
        <View style={{ gap: spacing.sm }}>
          <Row wrap>{(['f', 'm', 'x'] as Gender[]).map((g) => <Chip key={g} label={genderLabel(g)} selected={gender === g} onPress={() => setGender(gender === g ? null : g)} />)}</Row>
          <Card>
            <Text variant="heading">{tr('nm.sib.title')}</Text>
            {siblings.length ? <>
              <Text variant="small" muted>{tr('nm.sib.body', { names: siblings.join(', ') })}</Text>
              {sibIdeas.length ? nameChips(sibIdeas) : <Text muted>{tr('nm.sib.none')}</Text>}
            </> : <Text variant="small" muted>{tr('nm.sib.noKids')}</Text>}
          </Card>
          <Card>
            <Text variant="heading">{tr('nm.twin.title')}</Text>
            <Text variant="small" muted>{multiple ? tr('nm.twin.bodyMultiple') : tr('nm.twin.body')}</Text>
            <Field label={tr('nm.twin.base')} value={twinBase} onChangeText={setTwinBase} autoCorrect={false} testID="twin-base" />
            {(favorites ?? []).length ? <Row wrap>{(favorites ?? []).slice(0, 8).map((f) => <Chip key={f.id} tone="lavender" label={f.name} selected={norm(twinBase) === norm(f.name)} onPress={() => setTwinBase(f.name)} />)}</Row> : null}
            {twinBase.trim() ? (twins.sameInitial.length || twins.sameEnding.length ? <>
              {twins.sameInitial.length ? <><Text weight="bold" style={{ marginTop: 6 }}>{tr('nm.twin.initial')}</Text>{nameChips(twins.sameInitial)}</> : null}
              {twins.sameEnding.length ? <><Text weight="bold" style={{ marginTop: 6 }}>{tr('nm.twin.ending')}</Text>{nameChips(twins.sameEnding)}</> : null}
            </> : <Text muted>{tr('nm.twin.none')}</Text>) : null}
          </Card>
          <Text variant="caption" muted>{tr('nm.ideas.note')}</Text>
        </View>
      ) : !hasPartner ? (
        <Banner tone="info" title="Voter à deux">{'Invitez votre coparent dans le foyer : chacun vote de son côté et vous voyez les prénoms qui vous plaisent à tous les deux.'}</Banner>
      ) : null}
      {loading ? <Skeleton rows={5} /> : null}
      {failed ? <ErrorView error={activeQ.error} onRetry={() => void activeQ.refetch()} title={explore ? 'Impossible d’afficher les prénoms' : 'Impossible d’afficher vos favoris'} /> : null}
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
      {explore ? <Text variant="caption" muted>{tr('nm.source')}</Text> : null}
      <SectionTitle title="Votre propre idée" />
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Field label="Prénom" value={custom} onChangeText={(v) => { setCustom(v); setCustomError(null); }} maxLength={40} autoCapitalize="words" error={customError} onSubmitEditing={addCustom} returnKeyType="done" />
          <Button label="Ajouter aux favoris" icon="plus" variant="secondary" loading={busy === custom.trim() && !!custom.trim()} onPress={addCustom} />
        </View>
      </Card>
    </View>
  );

  const empty = loading || failed || view === 'ideas' ? null : explore ? (
    query.trim() ? (
      <EmptyState icon="search" title="Aucun prénom ne correspond" body="Vous pouvez ajouter votre propre idée à vos favoris." action={{ label: `Ajouter « ${query.trim().slice(0, 40)} »`, icon: 'heart', onPress: () => void addFavorite(query.trim().slice(0, 40)) }} />
    ) : (
      <EmptyState icon="search" title="Aucun prénom ne correspond" body="Essayez un autre filtre, ou ajoutez votre propre idée ci-dessous." action={{ label: 'Voir tous les prénoms', icon: 'refresh-cw', onPress: () => { setGender(null); setLetter(null); setLen(null); setPop(null); setOrigin(null); } }} />
    )
  ) : (
    <EmptyState icon="heart" title="Aucun favori pour l’instant" body="Touchez le cœur à côté d’un prénom pour le mettre de côté." action={{ label: 'Explorer les prénoms', icon: 'search', onPress: () => setView('explore') }} />
  );

  const contentStyle = { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.xs };

  return (
    <Screen back title="Prénoms" subtitle="Idées, coups de cœur, vote à deux." scroll={false} padded={false}
      action={(() => {
        const q = query.trim().slice(0, 40);
        if (explore && q && !favByName.has(norm(q))) return { label: L(`Ajouter « ${q} » aux favoris`, `Add “${q}” to favourites`), icon: 'heart' as const, onPress: () => void addFavorite(q), testID: 'names-main-action' };
        if (view === 'favorites') return { label: L('Explorer les prénoms', 'Explore names'), icon: 'search' as const, onPress: () => setView('explore'), testID: 'names-main-action' };
        return { label: `${L('Mes favoris', 'My favourites')}${favorites?.length ? ` (${favorites.length})` : ''}`, icon: 'heart' as const, onPress: () => setView('favorites'), testID: 'names-main-action' };
      })()}>
      {explore ? (
        <VirtualList
          key="explore"
          data={loading || failed ? [] : filtered}
          keyExtractor={(n) => n.key}
          renderItem={({ item }) => <Card padded={false} style={{ paddingHorizontal: spacing.md, height: ROW_H - 8, marginBottom: 8, justifyContent: 'center' }}>{renderName(item)}</Card>}
          initialNumToRender={20}
          maxToRenderPerBatch={30}
          windowSize={11}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contentStyle}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          ListFooterComponent={footer}
        />
      ) : view === 'ideas' ? (
        <VirtualList key="ideas" data={[] as NameFavorite[]} renderItem={() => null} contentContainerStyle={contentStyle} ListHeaderComponent={header} ListFooterComponent={footer} showsVerticalScrollIndicator={false} />
      ) : (
        <VirtualList
          key="favorites"
          data={loading || failed ? [] : sortedFavorites}
          keyExtractor={(f) => f.id}
          renderItem={({ item }) => <Card padded={false} style={{ paddingHorizontal: spacing.md }}>{renderFavorite(item)}</Card>}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contentStyle}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          ListFooterComponent={footer}
        />
      )}
    </Screen>
  );
}
