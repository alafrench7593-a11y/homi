/**
 * Observation de la glaire cervicale : aspect, texture, sensation, note, photo facultative,
 * comparaison au fil du cycle. Jamais de conclusion sur l'ovulation.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { PrivateBanner } from '@/components/Fertility';
import { Banner, Button, Card, Chip, Field, haptic, IconButton, ListRow, Loading, Row, SectionTitle, Text } from '@/components/ui';
import { KeepPhotoChoice, PhotoButtons, PhotoGuide } from '@/features/cycleTests';
import { useUserId } from '@/lib/auth';
import { useInvalidate, usePeriods } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useFertilityObservations } from '@/lib/data/hooks-fertility';
import { requestMucusSuggestion, useDeletePhoto, useSaveMucus } from '@/lib/data/hooks-cycle';
import { backend, eq } from '@/lib/backend';
import { BackendError } from '@/lib/backend/types';
import {
  fertilitySign, MUCUS_CATEGORIES, MUCUS_SENSATIONS, MUCUS_TEXTURES, mucusLabel, observationMessage, photoSuggestionMessage,
  suggestionConfidenceLabel, type MucusCategory, type MucusSensation, type MucusTexture, type PhotoSuggestionResult,
} from '@/lib/cycleAnalysis/mucus';
import { assessQuality, QUALITY_MESSAGES } from '@/lib/cycleAnalysis/quality';
import { decodeImage, jpegBase64ForUpload } from '@/lib/cycleAnalysis/decode';
import { deleteEncryptedPhoto, discardLocalImage, loadEncryptedPhoto } from '@/lib/cycleAnalysis/privacy';
import { daysBetween, formatDateFr, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const SIGN_COLOUR = { less_fertile: '#C9B79C', intermediate: '#F2C46D', potentially_fertile: '#7FB6E8', see_professional: '#E0607E', none: '#B9B9C6' } as const;

export default function MucusScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const save = useSaveMucus();
  const delPhoto = useDeletePhoto();
  const { data: obs } = useFertilityObservations(200);
  const { data: periods } = usePeriods();

  const [date, setDate] = useState(toFrDate(todayISO()));
  const [category, setCategory] = useState<MucusCategory | null>(null);
  const [texture, setTexture] = useState<MucusTexture | null>(null);
  const [sensation, setSensation] = useState<MucusSensation | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [uri, setUri] = useState<string | null>(null);
  const uriRef = useRef<string | null>(null);
  const [qualityMsg, setQualityMsg] = useState<string[] | null>(null);
  const [suggestion, setSuggestion] = useState<PhotoSuggestionResult | null>(null);
  const [asking, setAsking] = useState(false);
  const [keepPhoto, setKeepPhoto] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => { uriRef.current = uri; }, [uri]);
  useEffect(() => () => { void discardLocalImage(uriRef.current); }, []);

  async function onPicked(u: string) {
    await discardLocalImage(uri);
    setUri(u);
    setSuggestion(null);
    setQualityMsg(null);
    try {
      // Contrôle de qualité SUR LE TÉLÉPHONE, avant tout envoi éventuel
      const q = assessQuality(await decodeImage(u));
      setQualityMsg(q.ok ? [] : q.issues.map((i) => QUALITY_MESSAGES[i]));
    } catch {
      setQualityMsg(['Image illisible.']);
    }
  }

  async function dropPhoto() {
    await discardLocalImage(uri);
    setUri(null);
    uriRef.current = null;
    setSuggestion(null);
    setQualityMsg(null);
    setKeepPhoto(false);
  }

  async function askSuggestion() {
    if (!uri) return;
    const ok = await confirm(
      'Envoyer cette photo pour analyse ?',
      'La photo est envoyée de façon chiffrée à notre serveur, puis à l’intelligence artificielle Google Gemini, uniquement pour proposer une catégorie. Toi & Moi ne la conserve pas, ne l’utilise pas pour entraîner une IA et ne la publie jamais. Le résultat reste une suggestion éducative, sans diagnostic.',
      'Envoyer la photo',
    );
    if (!ok) return;
    setAsking(true);
    try {
      const b64 = await jpegBase64ForUpload(uri);
      setSuggestion(await requestMucusSuggestion(b64));
    } catch (err) {
      const code = err instanceof BackendError ? err.code : null;
      toast(code === 'ai_not_configured' ? 'Analyse de photo indisponible : le service n’est pas configuré. Choisissez vous-même la description.' : friendlyError(err), 'error');
    } finally {
      setAsking(false);
    }
  }

  async function submit() {
    const iso = frToISO(date);
    if (!iso || iso > todayISO()) return setError('Date invalide (JJ/MM/AAAA, pas dans le futur).');
    if (!category && !texture && !sensation && !note.trim()) return setError('Choisissez au moins un aspect, une texture, une sensation ou ajoutez une note.');
    setError(null);
    if (!userId) return;
    try {
      const res = await save.mutateAsync({ userId, observedOn: iso, category, texture, sensation, note: note.trim() || null, suggestion, photoUri: uri, keepPhoto });
      uriRef.current = null;
      setUri(null);
      setSuggestion(null);
      setQualityMsg(null);
      setCategory(null); setTexture(null); setSensation(null); setNote(''); setKeepPhoto(false);
      haptic('success');
      toast(res.photoPath ? 'Observation enregistrée avec la photo chiffrée.' : 'Observation enregistrée. La photo éventuelle a été supprimée.');
    } catch (err) {
      setUri(null);
      toast(friendlyError(err), 'error');
    }
  }

  async function remove(id: string, on: string, photoPath?: string | null) {
    if (!(await confirm(`Supprimer l’observation du ${formatDateFr(on)} ?`, 'L’observation et sa photo éventuelle seront supprimées définitivement.', 'Supprimer'))) return;
    try {
      await deleteEncryptedPhoto(photoPath);
      await backend.remove('fertility_observations', [eq('id', id)]);
      inv('fertility_observations');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function view(path: string) {
    try {
      setViewing(await loadEncryptedPhoto(path));
    } catch {
      toast('Photo illisible sur ce téléphone (la clé de chiffrement est propre à l’appareil qui l’a prise).', 'error');
    }
  }

  // Comparaison au fil du cycle : un rang par cycle, une pastille par jour de cycle
  const cycles = useMemo(() => {
    const starts = [...new Set((periods ?? []).map((p) => p.start_date))].sort().slice(-3);
    const withMucus = (obs ?? []).filter((o) => o.cervical_mucus);
    return starts.reverse().map((start, idx, arr) => {
      const end = idx === 0 ? todayISO() : arr[idx - 1];
      const days = withMucus.filter((o) => o.observed_on >= start && o.observed_on < end).map((o) => ({ day: daysBetween(start, o.observed_on) + 1, cat: o.cervical_mucus as MucusCategory }));
      return { start, days };
    });
  }, [periods, obs]);

  const message = observationMessage(category);

  return (
    <Screen back title="Ma glaire cervicale" subtitle="Observer son corps, à son rythme. Rien n’est obligatoire.">
      <PrivateBanner>Ces observations et leurs photos ne sont jamais partagées avec votre foyer, votre coparent ni la communauté.</PrivateBanner>

      <Card>
        <Field label="Date" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" placeholder="JJ/MM/AAAA" />
        <Text variant="label" style={{ marginTop: spacing.sm }}>Quel aspect aujourd’hui ?</Text>
        <View style={{ gap: 6, marginTop: 6 }}>
          {MUCUS_CATEGORIES.map((m) => (
            <Pressable key={m.value} accessibilityRole="radio" accessibilityState={{ selected: category === m.value }} onPress={() => setCategory(category === m.value ? null : m.value)}
              style={{ padding: spacing.sm, borderRadius: radius.md, borderWidth: 1.5, borderColor: category === m.value ? t.colors.primary : t.colors.border, backgroundColor: category === m.value ? t.colors.primary + '18' : 'transparent' }}>
              <Text weight="bold">{m.label}</Text>
              <Text variant="caption" muted>{m.hint}</Text>
            </Pressable>
          ))}
        </View>
        <Text variant="label" style={{ marginTop: spacing.sm }}>Texture</Text>
        <Row wrap style={{ marginTop: 6 }}>{MUCUS_TEXTURES.map((m) => <Chip key={m.value} label={m.label} selected={texture === m.value} onPress={() => setTexture(texture === m.value ? null : m.value)} />)}</Row>
        <Text variant="label" style={{ marginTop: spacing.sm }}>Sensation ressentie</Text>
        <Row wrap style={{ marginTop: 6 }}>{MUCUS_SENSATIONS.map((m) => <Chip key={m.value} label={m.label} selected={sensation === m.value} onPress={() => setSensation(sensation === m.value ? null : m.value)} />)}</Row>
        <View style={{ marginTop: spacing.sm }}><Field label="Note" optional value={note} onChangeText={setNote} maxLength={500} /></View>
        {message ? <Banner tone={fertilitySign(category) === 'see_professional' ? 'warning' : 'info'}>{message}</Banner> : null}
      </Card>

      <SectionTitle title="Photo (facultative)" />
      <Card>
        {!uri ? (
          <>
            <Text variant="small" muted>Une photo peut aider à proposer une catégorie éducative. Elle est vérifiée sur votre téléphone ; elle n’est envoyée pour analyse que si vous l’acceptez explicitement.</Text>
            <View style={{ marginTop: spacing.sm }}><PhotoGuide kind="mucus" /></View>
            <View style={{ marginTop: spacing.sm }}><PhotoButtons onPicked={onPicked} onError={(m) => toast(m, 'error')} /></View>
          </>
        ) : (
          <>
            <Row>
              <Image source={{ uri }} style={{ width: 84, height: 84, borderRadius: radius.md }} accessibilityLabel="Aperçu de la photo" />
              <View style={{ flex: 1, gap: 4 }}>
                {qualityMsg == null ? <Loading label="Vérification de la photo…" /> : qualityMsg.length ? qualityMsg.map((m) => <Text key={m} variant="small">{m}</Text>) : <Text variant="small">Photo nette et bien éclairée.</Text>}
              </View>
            </Row>
            {!suggestion ? (
              <Button label="Proposer une catégorie à partir de la photo" icon="send" variant="secondary" style={{ marginTop: spacing.sm }} loading={asking} disabled={!qualityMsg || qualityMsg.length > 0} onPress={askSuggestion} />
            ) : (
              <View style={{ marginTop: spacing.sm, gap: 4 }}>
                <Text variant="caption" muted weight="bold">SUGGESTION ÉDUCATIVE (IA) — À VÉRIFIER</Text>
                {suggestion.analyzable && suggestion.category !== 'unanalyzable' ? <Text weight="bold">{mucusLabel(suggestion.category)} · confiance {suggestionConfidenceLabel(suggestion.confidence)}</Text> : null}
                <Text variant="small">{photoSuggestionMessage(suggestion)}</Text>
                {suggestion.analyzable && suggestion.category !== 'unanalyzable' && suggestion.category !== category ? (
                  <Button label="Utiliser cette suggestion" size="sm" variant="secondary" onPress={() => setCategory(suggestion.category as MucusCategory)} />
                ) : null}
              </View>
            )}
            <View style={{ marginTop: spacing.sm }}><KeepPhotoChoice value={keepPhoto} onChange={setKeepPhoto} /></View>
            <Button label="Supprimer la photo maintenant" icon="trash-2" variant="ghost" onPress={async () => { await dropPhoto(); toast('Photo supprimée.'); }} />
          </>
        )}
      </Card>

      {error ? <Banner tone="danger">{error}</Banner> : null}
      <Button label="Enregistrer l’observation" icon="check" loading={save.isPending} onPress={submit} full />

      <SectionTitle title="Au fil de mes cycles" />
      {cycles.some((c) => c.days.length) ? (
        <Card>
          {cycles.map((c) => (
            <View key={c.start} style={{ marginBottom: spacing.sm }}>
              <Text variant="caption" muted>{`Cycle commencé le ${formatDateFr(c.start)}`}</Text>
              <Row gap={2} style={{ marginTop: 4, flexWrap: 'wrap' }}>
                {Array.from({ length: 35 }, (_, i) => {
                  const d = c.days.find((x) => x.day === i + 1);
                  return <View key={i} accessibilityLabel={d ? `Jour ${i + 1} : ${mucusLabel(d.cat)}` : undefined} style={{ width: 8, height: 14, borderRadius: 2, backgroundColor: d ? SIGN_COLOUR[fertilitySign(d.cat)] : t.colors.border + '66' }} />;
                })}
              </Row>
            </View>
          ))}
          <View style={{ gap: 2 }}>
            {([['less_fertile', 'Sèche, épaisse ou collante'], ['intermediate', 'Crémeuse'], ['potentially_fertile', 'Transparente, étirable ou aqueuse'], ['see_professional', 'Inhabituelle']] as const).map(([k, l]) => (
              <Row key={k} gap={6}><View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: SIGN_COLOUR[k] }} /><Text variant="caption" muted>{l}</Text></Row>
            ))}
          </View>
          <Text variant="caption" muted style={{ marginTop: 6 }}>Chaque case est un jour du cycle, à partir du premier jour des règles. Ce schéma décrit vos saisies ; il ne confirme pas une ovulation.</Text>
        </Card>
      ) : (
        <Card tone="soft"><Text muted>Notez vos règles et quelques observations pour comparer vos cycles.</Text></Card>
      )}

      {(obs ?? []).some((o) => o.cervical_mucus || o.mucus_texture || o.mucus_sensation) ? (
        <>
          <SectionTitle title="Mes observations" />
          <Card>
            {(obs ?? []).filter((o) => o.cervical_mucus || o.mucus_texture || o.mucus_sensation).slice(0, 20).map((o) => (
              <ListRow
                key={o.id}
                icon="droplet"
                title={formatDateFr(o.observed_on)}
                subtitle={[mucusLabel(o.cervical_mucus), MUCUS_TEXTURES.find((x) => x.value === o.mucus_texture)?.label, MUCUS_SENSATIONS.find((x) => x.value === o.mucus_sensation)?.label, o.photo_path ? 'photo chiffrée' : null, o.note].filter(Boolean).join(' · ')}
                right={(
                  <Row gap={0}>
                    {o.photo_path ? <IconButton icon="eye" label="Voir la photo" onPress={() => view(o.photo_path!)} /> : null}
                    {o.photo_path ? <IconButton icon="image" label="Supprimer la photo seulement" onPress={async () => { if (await confirm('Supprimer la photo ?', 'L’observation est conservée, la photo est effacée définitivement.', 'Supprimer')) delPhoto.mutate({ table: 'fertility_observations', id: o.id, photoPath: o.photo_path! }); }} /> : null}
                    <IconButton icon="trash-2" label={`Supprimer l’observation du ${formatDateFr(o.observed_on)}`} onPress={() => remove(o.id, o.observed_on, o.photo_path)} />
                  </Row>
                )}
              />
            ))}
          </Card>
        </>
      ) : null}

      <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <Pressable accessibilityLabel="Fermer la photo" onPress={() => setViewing(null)} style={{ flex: 1, backgroundColor: '#000d', alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
          {viewing ? <Image source={{ uri: viewing }} style={{ width: '100%', height: '70%' }} resizeMode="contain" /> : null}
          <Text color="#fff" style={{ marginTop: spacing.sm }}>Touchez pour fermer</Text>
        </Pressable>
      </Modal>
    </Screen>
  );
}
