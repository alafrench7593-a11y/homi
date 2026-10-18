/**
 * Bilan d'humeur — privé (visible uniquement par vous), facultatif, sans score ni diagnostic.
 * Si les réponses évoquent une détresse, on propose doucement les numéros d'aide.
 */
import { insertOrQueue } from '@/lib/offline';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { EmergencyList } from '@/components/Family';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { useInvalidate, useMoods } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import type { MoodCheckin } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';

const MOODS: { value: MoodCheckin['mood']; label: string }[] = [
  { value: 1, label: 'Très difficile' },
  { value: 2, label: 'Difficile' },
  { value: 3, label: 'Entre les deux' },
  { value: 4, label: 'Plutôt bien' },
  { value: 5, label: 'Bien' },
];
const moodLabel = (m: number) => MOODS.find((x) => x.value === m)?.label ?? '';

const FEELINGS = ['Fatigue', 'Inquiétude', 'Tristesse', 'Solitude', 'Irritabilité', 'Débordement', 'Désespoir', 'Calme', 'Joie', 'Fierté', 'Soutien', 'Tendresse'];
const HEAVY = ['Désespoir'];

function isDistress(mood: number | null, feelings: string[], safety: boolean) {
  return safety || mood === 1 || feelings.some((f) => HEAVY.includes(f));
}

function SupportBanner({ urgent }: { urgent: boolean }) {
  return (
    <Banner
      tone={urgent ? 'danger' : 'warning'}
      title={urgent ? 'Vous n’avez pas à traverser ça seul·e' : 'Merci de l’avoir noté'}
      action={
        <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
          <EmergencyList compact />
          <Button label="Voir toutes les ressources d’aide" variant="secondary" size="sm" icon="life-buoy" onPress={() => router.push('/emergency')} style={{ alignSelf: 'flex-start' }} />
        </View>
      }
    >
      <Text variant="small">
        {urgent
          ? 'Si vous avez des pensées de vous faire du mal, appelez le 3114 (gratuit, 24 h/24) ou le 15. En cas de danger immédiat, le 112. Si vous le pouvez, demandez à une personne de confiance de rester avec vous.'
          : 'Les moments très difficiles arrivent, surtout quand on manque de sommeil. Si cela dure ou vous inquiète, votre sage-femme, votre médecin ou la PMI peuvent vous écouter. Le 3114 répond aussi, gratuitement, à toute heure.'}
      </Text>
    </Banner>
  );
}

export default function MoodScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const insets = useSafeAreaInsets();
  const moodsQ = useMoods(60);
  const { data: moods } = moodsQ;
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [mood, setMood] = useState<MoodCheckin['mood'] | null>(null);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [safety, setSafety] = useState(false);
  const [journal, setJournal] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedDistress, setSavedDistress] = useState<null | 'urgent' | 'soft'>(null);

  const distressNow = isDistress(mood, feelings, safety);

  function toggleFeeling(f: string) {
    setFeelings((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  }

  async function save() {
    if (!mood) return setError('Choisissez ce qui ressemble le plus à votre journée.');
    if (journal.length > 6000) return setError('6 000 caractères maximum.');
    setError(null);
    setSaving(true);
    try {
      await insertOrQueue('mood_checkins', { user_id: userId, checked_at: new Date().toISOString(), mood, feelings, safety_concern: safety, journal: journal.trim() || null });
      inv('mood_checkins');
      const d = isDistress(mood, feelings, safety);
      setSavedDistress(d ? (safety || feelings.some((f) => HEAVY.includes(f)) ? 'urgent' : 'soft') : null);
      haptic('success');
      toast('Bilan enregistré, il reste privé.');
      setMood(null);
      setFeelings([]);
      setSafety(false);
      setJournal('');
    } catch (e) {
      toast(friendlyError(e, 'Enregistrement impossible. Réessayez dans un instant.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!(await confirm('Supprimer ce bilan ?', 'Cette action est définitive.', 'Supprimer'))) return;
    setRemovingId(id);
    try {
      await backend.remove('mood_checkins', [eq('id', id)]);
      inv('mood_checkins');
      toast('Bilan supprimé.');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setRemovingId(null);
    }
  }

  const loading = moodsQ.isLoading && !moods;
  const failed = moodsQ.isError && !moods;

  return (
    <Screen back title="Comment je me sens" subtitle="Privé, facultatif, sans jugement." scroll={false} padded={false}>
      <VirtualList
        data={loading || failed ? [] : moods ?? []}
        keyExtractor={(m) => m.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        ListHeaderComponent={(
          <View style={{ gap: spacing.md }}>
            <Banner tone="info">{'Ce bilan est visible uniquement par vous. Il ne calcule aucun score et ne pose aucun diagnostic : c’est simplement un espace pour faire le point.'}</Banner>

            {savedDistress && <SupportBanner urgent={savedDistress === 'urgent'} />}

            <Card>
              <Text weight="bold">Aujourd’hui, c’est plutôt…</Text>
              <View accessibilityRole="radiogroup" accessibilityLabel="Mon humeur du jour" style={{ gap: spacing.xs, marginTop: spacing.sm }}>
                {MOODS.map((m) => {
                  const sel = mood === m.value;
                  return (
                    <Pressable
                      key={m.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: sel }}
                      accessibilityLabel={m.label}
                      onPress={() => { haptic('selection'); setMood(m.value); setSavedDistress(null); }}
                      style={({ pressed }) => ({
                        minHeight: MIN_TOUCH, borderRadius: radius.pill, borderWidth: 1.2, paddingHorizontal: spacing.md, justifyContent: 'center',
                        borderColor: sel ? t.colors.primary : t.colors.border, backgroundColor: sel ? t.colors.primary : pressed ? t.colors.surfaceAlt : t.colors.surface,
                      })}
                    >
                      <Row>
                        <View style={{ flexDirection: 'row', gap: 3 }}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i <= m.value ? (sel ? t.colors.primaryText : t.colors.lavender) : t.colors.border }} />
                          ))}
                        </View>
                        <Text weight="medium" color={sel ? t.colors.primaryText : t.colors.text}>{m.label}</Text>
                      </Row>
                    </Pressable>
                  );
                })}
              </View>
              {error ? <Text variant="small" color={t.colors.danger} style={{ marginTop: spacing.xs }}>{error}</Text> : null}
            </Card>

            <Card>
              <Text weight="bold">Ce qui est présent en ce moment</Text>
              <Text variant="small" muted>Facultatif, plusieurs choix possibles.</Text>
              <Row wrap style={{ marginTop: spacing.sm }}>
                {FEELINGS.map((f) => <Chip key={f} label={f} selected={feelings.includes(f)} onPress={() => toggleFeeling(f)} />)}
              </Row>
            </Card>

            <Card tone="soft">
              <Row style={{ alignItems: 'flex-start' }}>
                <Text style={{ flex: 1 }}>Ces derniers jours, j’ai eu des pensées de me faire du mal ou de ne plus être là.</Text>
                <Toggle label="J’ai eu des pensées de me faire du mal" value={safety} onChange={(v) => { setSafety(v); setSavedDistress(null); }} />
              </Row>
              <Text variant="caption" muted style={{ marginTop: 6 }}>Répondre est facultatif. Votre réponse reste privée.</Text>
            </Card>

            {distressNow && !savedDistress && <SupportBanner urgent={safety || feelings.some((f) => HEAVY.includes(f))} />}

            <Field label="Mon journal" optional value={journal} onChangeText={setJournal} multiline maxLength={6000} placeholder="Ce que j’ai envie de garder de cette journée…" style={{ minHeight: 110, textAlignVertical: 'top' }} />
            <Button label="Enregistrer mon bilan" onPress={save} loading={saving} full />

            <SectionTitle title="Mes bilans précédents" />
            {loading ? <Skeleton rows={2} /> : null}
            {failed ? <ErrorView error={moodsQ.error} onRetry={() => void moodsQ.refetch()} title="Impossible d’afficher vos bilans" /> : null}
          </View>
        )}
        ListEmptyComponent={loading || failed ? null : <EmptyState icon="heart" title="Aucun bilan pour l’instant" body="Il n’y a aucune obligation d’en faire." />}
        renderItem={({ item: m }) => (
          <Card style={{ paddingVertical: spacing.xs }}>
            <ListRow
              icon={m.safety_concern ? 'life-buoy' : 'heart'}
              title={`${new Date(m.checked_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · ${moodLabel(m.mood)}`}
              subtitle={[m.feelings.join(', '), m.journal ? (m.journal.length > 90 ? `${m.journal.slice(0, 90)}…` : m.journal) : null].filter(Boolean).join(' — ') || undefined}
              right={<Button label="Supprimer" size="sm" variant="ghost" loading={removingId === m.id} onPress={() => remove(m.id)} accessibilityLabel={`Supprimer le bilan du ${new Date(m.checked_at).toLocaleDateString('fr-FR')}`} />}
            />
          </Card>
        )}
      />
    </Screen>
  );
}
