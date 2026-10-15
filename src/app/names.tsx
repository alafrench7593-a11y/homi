/** Idées de prénoms : explorer, mettre de côté, voter à deux, ajouter ses propres idées. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Chip, Field, IconButton, Loading, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { ensureHousehold, useBabyNames, useHouseholdId, useHouseholdMembers, useInvalidate, useNameFavorites, useNameVotes } from '@/lib/data/hooks';
import { errorMessage } from '@/lib/data/hooks-family';
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
  const { data: names, isLoading } = useBabyNames();
  const { data: favorites } = useNameFavorites();
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
      toast(errorMessage(e, 'Ajout impossible.'), 'error');
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
      toast(errorMessage(e, 'Suppression impossible.'), 'error');
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
    try {
      if (mine) await backend.update('name_votes', { vote: next }, [eq('favorite_id', f.id), eq('user_id', userId)]);
      else await backend.insert('name_votes', { favorite_id: f.id, household_id: f.household_id, user_id: userId, vote: next });
      inv('name_votes');
    } catch (e) {
      toast(errorMessage(e, 'Vote impossible.'), 'error');
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

  return (
    <Screen back title="Prénoms" subtitle="Des idées, vos coups de cœur et un vote à deux.">
      <Segmented
        label="Affichage"
        value={view}
        onChange={setView}
        options={[{ value: 'explore', label: 'Explorer' }, { value: 'favorites', label: `Nos favoris${favorites?.length ? ` (${favorites.length})` : ''}` }]}
      />

      {view === 'explore' ? (
        <>
          <Field label="Rechercher" value={query} onChangeText={setQuery} placeholder="Prénom, origine, signification…" autoCorrect={false} />
          <Row wrap>
            {(['all', 'feminine', 'masculine', 'mixed'] as Usage[]).map((u) => (
              <Chip key={u} label={u === 'all' ? 'Tous' : USAGE_LABEL[u][0].toUpperCase() + USAGE_LABEL[u].slice(1)} selected={usage === u} onPress={() => setUsage(u)} />
            ))}
          </Row>
          {isLoading ? <Loading /> : (
            <Card>
              {filtered.map((n) => {
                const fav = favByName.has(norm(n.name));
                return (
                  <View key={n.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, paddingVertical: spacing.xs }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text weight="medium">{n.name}</Text>
                      <Text variant="small" muted>{[n.usage.map((u) => USAGE_LABEL[u]).join(', '), n.origin, n.meaning].filter(Boolean).join(' · ')}</Text>
                    </View>
                    <IconButton
                      icon="heart"
                      color={fav ? t.colors.primary : t.colors.textMuted}
                      label={fav ? `Retirer ${n.name} des favoris` : `Ajouter ${n.name} aux favoris`}
                      onPress={() => { if (busy !== n.name) toggleFavorite(n); }}
                      style={fav ? { backgroundColor: t.colors.surfaceAlt } : undefined}
                    />
                  </View>
                );
              })}
              {!filtered.length && <Text muted>Aucun prénom ne correspond. Vous pouvez ajouter votre propre idée ci-dessous.</Text>}
            </Card>
          )}
          <Text variant="caption" muted>Origines et significations données à titre indicatif.</Text>
        </>
      ) : (
        <>
          {!hasPartner && (
            <Banner tone="info" title="Voter à deux">{'Invitez votre coparent dans le foyer : chacun vote de son côté et vous voyez les prénoms qui vous plaisent à tous les deux.'}</Banner>
          )}
          <Card>
            {sortedFavorites.map((f) => {
              const vs = votesFor(f);
              const mine = vs.find((v) => v.user_id === userId)?.vote ?? 0;
              const others = vs.filter((v) => v.user_id !== userId && v.vote !== 0);
              const othersLabel = others.length
                ? others.map((v) => (v.vote > 0 ? 'aime' : 'n’est pas convaincu·e')).join(', ')
                : hasPartner ? 'pas encore de vote' : null;
              return (
                <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 56, paddingVertical: spacing.xs }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text weight="medium">{f.name}</Text>
                    <Text variant="small" muted>{[othersLabel ? `Coparent : ${othersLabel}` : null, `score ${score(f) > 0 ? '+' : ''}${score(f)}`].filter(Boolean).join(' · ')}</Text>
                  </View>
                  <IconButton icon="thumbs-up" label={`J’aime ${f.name}${mine === 1 ? ' (sélectionné)' : ''}`} color={mine === 1 ? t.colors.primary : t.colors.textMuted} style={mine === 1 ? { backgroundColor: t.colors.surfaceAlt } : undefined} onPress={() => vote(f, 1)} />
                  <IconButton icon="thumbs-down" label={`Je n’aime pas ${f.name}${mine === -1 ? ' (sélectionné)' : ''}`} color={mine === -1 ? t.colors.primary : t.colors.textMuted} style={mine === -1 ? { backgroundColor: t.colors.surfaceAlt } : undefined} onPress={() => vote(f, -1)} />
                  <IconButton icon="x" label={`Retirer ${f.name} des favoris`} color={t.colors.textMuted} onPress={() => removeFavorite(f, true)} />
                </View>
              );
            })}
            {!favorites?.length && <Text muted>Aucun favori pour l’instant. Touchez le cœur à côté d’un prénom pour le mettre de côté.</Text>}
          </Card>
        </>
      )}

      <SectionTitle title="Votre propre idée" />
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Field label="Prénom" value={custom} onChangeText={(v) => { setCustom(v); setCustomError(null); }} maxLength={40} autoCapitalize="words" error={customError} onSubmitEditing={addCustom} returnKeyType="done" />
          <Button label="Ajouter aux favoris" icon="plus" variant="secondary" loading={busy === custom.trim() && !!custom.trim()} onPress={addCustom} />
        </View>
      </Card>
    </Screen>
  );
}
