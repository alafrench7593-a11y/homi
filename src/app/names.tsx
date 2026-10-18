/** Idées de prénoms : explorer, mettre de côté, voter à deux, ajouter ses propres idées. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Chip, Field, IconButton, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { ensureHousehold, useBabyNames, useHouseholdId, useHouseholdMembers, useInvalidate, useNameFavorites, useNameVotes } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import type { BabyName, NameFavorite, NameVote } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

type Mode = 'explore' | 'favorites';
type Usage = 'all' | 'feminine' | 'masculine' | 'mixed';

const USAGE_LABEL: Record<Exclude<Usage, 'all'>, string> = { feminine: 'féminin', masculine: 'masculin', mixed: 'mixte' };
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

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
  const [usage, setUsage] = useState<Usage>('all');
  const [custom, setCustom] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const favByName = useMemo(() => new Map((favorites ?? []).map((f) => [norm(f.name), f])), [favorites]);
  const filtered = useMemo(() => {
    const q = norm(query);
    return (names ?? []).filter((n) => (usage === 'all' || n.usage.includes(usage)) && (!q || norm(n.name).includes(q) || norm(n.origin ?? '').includes(q) || norm(n.meaning ?? '').includes(q)));
  }, [names, query, usage]);

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

  async function toggleFavorite(n: BabyName) {
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
  const activeQ = explore ? namesQ : favoritesQ;
  const loading = activeQ.isLoading && !activeQ.data;
  const failed = activeQ.isError && !activeQ.data;

  const renderName = (n: BabyName) => {
    const fav = favByName.has(norm(n.name));
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, paddingVertical: spacing.xs }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="medium">{n.name}</Text>
          <Text variant="small" muted>{[n.usage.map((u) => USAGE_LABEL[u]).join(', '), n.origin, n.meaning].filter(Boolean).join(' · ')}</Text>
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

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.xs }}>
      <Segmented
        label="Affichage"
        value={view}
        onChange={setView}
        options={[{ value: 'explore', label: 'Explorer' }, { value: 'favorites', label: `Nos favoris${favorites?.length ? ` (${favorites.length})` : ''}` }]}
      />
      {explore ? (
        <>
          <Field label="Rechercher" value={query} onChangeText={setQuery} placeholder="Prénom, origine, signification…" autoCorrect={false} />
          <Row wrap>
            {(['all', 'feminine', 'masculine', 'mixed'] as Usage[]).map((u) => (
              <Chip key={u} label={u === 'all' ? 'Tous' : USAGE_LABEL[u][0].toUpperCase() + USAGE_LABEL[u].slice(1)} selected={usage === u} onPress={() => setUsage(u)} />
            ))}
          </Row>
        </>
      ) : !hasPartner ? (
        <Banner tone="info" title="Voter à deux">{'Invitez votre coparent dans le foyer : chacun vote de son côté et vous voyez les prénoms qui vous plaisent à tous les deux.'}</Banner>
      ) : null}
      {loading ? <Skeleton rows={5} /> : null}
      {failed ? <ErrorView error={activeQ.error} onRetry={() => void activeQ.refetch()} title={explore ? 'Impossible d’afficher les prénoms' : 'Impossible d’afficher vos favoris'} /> : null}
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
      {explore ? <Text variant="caption" muted>Origines et significations données à titre indicatif.</Text> : null}
      <SectionTitle title="Votre propre idée" />
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Field label="Prénom" value={custom} onChangeText={(v) => { setCustom(v); setCustomError(null); }} maxLength={40} autoCapitalize="words" error={customError} onSubmitEditing={addCustom} returnKeyType="done" />
          <Button label="Ajouter aux favoris" icon="plus" variant="secondary" loading={busy === custom.trim() && !!custom.trim()} onPress={addCustom} />
        </View>
      </Card>
    </View>
  );

  const empty = loading || failed ? null : explore ? (
    query.trim() ? (
      <EmptyState icon="search" title="Aucun prénom ne correspond" body="Vous pouvez ajouter votre propre idée à vos favoris." action={{ label: `Ajouter « ${query.trim().slice(0, 40)} »`, icon: 'heart', onPress: () => void addFavorite(query.trim().slice(0, 40)) }} />
    ) : (
      <EmptyState icon="search" title="Aucun prénom ne correspond" body="Essayez un autre filtre, ou ajoutez votre propre idée ci-dessous." action={{ label: 'Voir tous les prénoms', icon: 'refresh-cw', onPress: () => setUsage('all') }} />
    )
  ) : (
    <EmptyState icon="heart" title="Aucun favori pour l’instant" body="Touchez le cœur à côté d’un prénom pour le mettre de côté." action={{ label: 'Explorer les prénoms', icon: 'search', onPress: () => setView('explore') }} />
  );

  const contentStyle = { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.xs };

  return (
    <Screen back title="Prénoms" subtitle="Des idées, vos coups de cœur et un vote à deux." scroll={false} padded={false}>
      {explore ? (
        <VirtualList
          key="explore"
          data={loading || failed ? [] : filtered}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => <Card padded={false} style={{ paddingHorizontal: spacing.md }}>{renderName(item)}</Card>}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contentStyle}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          ListFooterComponent={footer}
        />
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
