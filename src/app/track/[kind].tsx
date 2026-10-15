/** Saisie / modification / suppression d'une entrée du suivi quotidien. */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Chip, Field, haptic, Row, Segmented, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { Stepper, TimePicker, KIND_META } from '@/features/tracking';
import { backend, eq } from '@/lib/backend';
import { useAddLog, useChild, useChildren, useDeleteRow, useInvalidate, useRows } from '@/lib/data/hooks';
import { useBottleTimer, useStartBottleTimer, useUpdateBottleTimer } from '@/lib/data/hooks-bottle';
import { NO_RECOMMENDATION_NOTE, parseMl, ReminderChoicePicker } from '@/features/bottle';
import { atClock, bottleDraftDefaults, formatHM, markBottleGiven, resolveReminderChoice, type ReminderChoice } from '@/lib/domain/bottleTimer';
import type { BottleRecord } from '@/lib/types-bottle';
import { uuid } from '@/lib/uuid';
import { LOG_TABLE, type Bottle, type Breastfeed, type Diaper, type LogKind, type Meal, type Observation, type Pumping, type Sleep } from '@/lib/types';
import { formatDuration } from '@/lib/domain/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

type Side = 'left' | 'right' | 'both';

export default function TrackEntry() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  // timer / planned : ouverture depuis le minuteur (« Marquer le biberon comme donné »)
  const params = useLocalSearchParams<{ kind: LogKind; child?: string; id?: string; timer?: string; planned?: string }>();
  const kind = (params.kind ?? 'bottle') as LogKind;
  const { data: children } = useChildren();
  const childId = params.child || children?.[0]?.id || '';
  const child = useChild(childId);
  const add = useAddLog(kind);
  const del = useDeleteRow(LOG_TABLE[kind]);
  const editing = !!params.id;
  const { data: existing } = useRows<Record<string, unknown>>([LOG_TABLE[kind], 'edit', params.id ?? ''], editing ? { table: LOG_TABLE[kind], filters: [eq('id', params.id)] } : null);
  const { data: lastBottle } = useRows<Bottle>(['bottles', childId, 'last'], kind === 'bottle' && childId ? { table: 'bottles', filters: [eq('child_id', childId)], order: [{ col: 'at', asc: false }], limit: 1 } : null);

  const bottleTimer = useBottleTimer(kind === 'bottle' ? childId : null);
  const startTimer = useStartBottleTimer();
  const updateTimer = useUpdateBottleTimer();
  // Valeurs initiales : rien n'est suggéré (seule la quantité prévue saisie sur le minuteur pré-remplit « préparée »)
  const draft = bottleDraftDefaults({ plannedMl: params.planned != null && params.planned !== '' && Number.isInteger(Number(params.planned)) ? Number(params.planned) : null });

  const [time, setTime] = useState(new Date());
  const [prepared, setPrepared] = useState<number | null>(draft.prepared_ml);
  const [consumed, setConsumed] = useState<number | null>(draft.consumed_ml);
  const [plannedNext, setPlannedNext] = useState(draft.planned_next_ml == null ? '' : String(draft.planned_next_ml));
  const [reminder, setReminder] = useState<ReminderChoice>(draft.reminder);
  const [milkType, setMilkType] = useState('');
  const [side, setSide] = useState<Side>('left');
  const [duration, setDuration] = useState('');
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [amount, setAmount] = useState<number | null>(80);
  const [wet, setWet] = useState(true);
  const [stool, setStool] = useState(false);
  const [end, setEnd] = useState(new Date());
  const [wakeups, setWakeups] = useState(0);
  const [description, setDescription] = useState('');
  const [foods, setFoods] = useState('');
  const [texture, setTexture] = useState<Meal['texture']>(null);
  const [reaction, setReaction] = useState('');
  const [obsKind, setObsKind] = useState<Observation['kind']>('temperature');
  const [temp, setTemp] = useState('');
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const loadedRef = useRef(false);

  // Pré-remplissage : édition, ou dernier type de lait utilisé (jamais de quantité suggérée)
  useEffect(() => {
    if (loadedRef.current) return;
    const r = existing?.[0];
    if (editing && !r) return;
    if (!editing && kind === 'bottle' && lastBottle === undefined) return;
    loadedRef.current = true;
    if (!r) {
      if (lastBottle?.[0]) setMilkType(lastBottle[0].milk_type ?? '');
      return;
    }
    setNote((r.note as string) ?? '');
    switch (kind) {
      case 'bottle': { const b = r as unknown as BottleRecord; setTime(new Date(b.at)); setPrepared(b.prepared_ml); setConsumed(b.consumed_ml); setMilkType(b.milk_type ?? ''); setPlannedNext(b.planned_next_ml != null ? String(b.planned_next_ml) : ''); break; }
      case 'breastfeed': { const f = r as unknown as Breastfeed; setTime(new Date(f.started_at)); setSide(f.side); if (f.ended_at) setDuration(String(Math.round((new Date(f.ended_at).getTime() - new Date(f.started_at).getTime()) / 60000))); break; }
      case 'pumping': { const p = r as unknown as Pumping; setTime(new Date(p.at)); setAmount(p.amount_ml); setSide(p.side ?? 'both'); break; }
      case 'diaper': { const d = r as unknown as Diaper; setTime(new Date(d.at)); setWet(d.wet); setStool(d.stool); break; }
      case 'sleep': { const s = r as unknown as Sleep; setTime(new Date(s.started_at)); setEnd(s.ended_at ? new Date(s.ended_at) : new Date()); setWakeups(s.wakeups); break; }
      case 'meal': { const m = r as unknown as Meal; setTime(new Date(m.at)); setDescription(m.description ?? ''); setFoods(m.foods.join(', ')); setTexture(m.texture); setReaction(m.reaction_note ?? ''); break; }
      case 'observation': { const o = r as unknown as Observation; setTime(new Date(o.at)); setObsKind(o.kind); setTemp(o.value_num != null ? String(o.value_num).replace('.', ',') : ''); setLabel(o.label ?? ''); break; }
    }
  }, [existing, editing, kind, lastBottle]);

  // Chronomètre de tétée
  useEffect(() => {
    if (!timerStart) return;
    const id = setInterval(() => setElapsed(Math.round((Date.now() - timerStart.getTime()) / 1000)), 1000);
    return () => clearInterval(id);
  }, [timerStart]);

  function build(): Record<string, unknown> | null {
    const base = { child_id: childId, household_id: child?.household_id, note: note.trim() || null };
    switch (kind) {
      case 'bottle':
        if (prepared == null && consumed == null) return setError('Indiquez au moins une quantité.'), null;
        if (prepared != null && consumed != null && consumed > prepared) return setError('La quantité bue ne peut pas dépasser la quantité préparée.'), null;
        if ((prepared ?? 0) > 500 || (consumed ?? 0) > 500) return setError('Quantité attendue entre 0 et 500 ml.'), null;
        {
          const next = parseMl(plannedNext);
          if (next.error) return setError(next.error), null;
          if (!editing && reminder.kind !== 'none' && resolveReminderChoice(reminder) == null) return setError('Choisissez une durée de rappel valide (10 min à 12 h).'), null;
          return { ...base, at: time.toISOString(), prepared_ml: prepared, consumed_ml: consumed, planned_next_ml: next.value, milk_type: milkType.trim() || null };
        }
      case 'breastfeed': {
        const mins = timerStart ? elapsed / 60 : Number(duration.replace(',', '.'));
        if (!timerStart && duration && (!Number.isFinite(mins) || mins <= 0 || mins > 180)) return setError('Durée attendue entre 1 et 180 minutes.'), null;
        const start = timerStart ?? time;
        return { ...base, side, started_at: start.toISOString(), ended_at: mins ? new Date(start.getTime() + mins * 60000).toISOString() : null };
      }
      case 'pumping':
        if (!amount) return setError('Indiquez la quantité tirée.'), null;
        return { ...base, at: time.toISOString(), amount_ml: amount, side };
      case 'diaper':
        if (!wet && !stool && !note.trim()) return setError('Cochez « mouillée », « selles » ou ajoutez une note.'), null;
        return { ...base, at: time.toISOString(), wet, stool };
      case 'sleep':
        if (end < time) return setError('La fin du sommeil ne peut pas précéder son début.'), null;
        return { ...base, started_at: time.toISOString(), ended_at: end.toISOString(), wakeups };
      case 'meal':
        return { ...base, at: time.toISOString(), description: description.trim() || null, foods: foods.split(',').map((f) => f.trim()).filter(Boolean), texture, reaction_note: reaction.trim() || null };
      case 'observation': {
        if (obsKind === 'temperature') {
          const v = Number(temp.replace(',', '.'));
          if (!Number.isFinite(v) || v < 34 || v > 43) return setError('Température attendue entre 34 et 43 °C.'), null;
          return { ...base, at: time.toISOString(), kind: obsKind, value_num: v, label: null };
        }
        if (!label.trim() && !note.trim()) return setError('Ajoutez un libellé ou une note.'), null;
        return { ...base, at: time.toISOString(), kind: obsKind, value_num: null, label: label.trim() || null };
      }
    }
  }

  async function save() {
    setError(null);
    const row = build();
    if (!row) return;
    setSaving(true);
    try {
      if (editing) {
        const { household_id: _h, ...patch } = row; // eslint-disable-line @typescript-eslint/no-unused-vars
        await backend.update(LOG_TABLE[kind], patch, [eq('id', params.id)]);
        inv(LOG_TABLE[kind]);
        toast('Modification enregistrée.');
      } else if (kind === 'bottle') {
        const id = uuid();
        const res = await add.mutateAsync({ ...row, id });
        const timerNote = await afterBottleSaved(res === 'sent' ? id : null, (row.planned_next_ml as number | null) ?? null);
        toast(
          (res === 'queued' ? 'Biberon enregistré sur l’appareil — synchronisation au retour du réseau.' : 'Biberon enregistré.') + (timerNote ? ` ${timerNote}` : ''),
          res === 'queued' ? 'info' : 'success',
        );
      } else {
        const res = await add.mutateAsync(row);
        if (kind === 'meal' && res === 'sent') {
          const list = (row.foods as string[]) ?? [];
          if (list.length) {
            await backend
              .insert('food_introductions', list.map((food_name) => ({ child_id: childId, household_id: child?.household_id, food_name, first_tried_on: time.toISOString().slice(0, 10), reaction_note: reaction.trim() || null })), { onConflict: 'child_id,food_name', ignoreDuplicates: true })
              .catch(() => undefined);
            inv('food_introductions');
          }
        }
        toast(res === 'queued' ? 'Enregistré sur l’appareil — synchronisation au retour du réseau.' : `${KIND_META[kind].label} enregistré.`, res === 'queued' ? 'info' : 'success');
      }
      haptic('success');
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }

  /**
   * Après l'enregistrement d'un biberon : démarre le rappel choisi (en remplaçant, après accord,
   * le minuteur en cours — jamais deux pour un enfant), ou clôt le minuteur dont on vient.
   * Renvoie une phrase pour le message de confirmation.
   */
  async function afterBottleSaved(bottleId: string | null, plannedMl: number | null): Promise<string | null> {
    const minutes = resolveReminderChoice(reminder);
    const active = bottleTimer.active;
    const fromActiveTimer = !!active && params.timer === active.id;
    const name = child?.first_name ?? 'l’enfant';
    try {
      if (minutes == null) {
        if (!active) return null;
        if (fromActiveTimer || (await confirm(`Un rappel est en cours pour ${name}`, `Il est prévu ${atClock(active.due_at)}. Le clore maintenant que ce biberon est enregistré ?`, 'Clore le rappel', false))) {
          await updateTimer.mutateAsync({ id: active.id, patch: markBottleGiven() });
          return 'Rappel en cours clos.';
        }
        return null;
      }
      if (active && !fromActiveTimer && !(await confirm('Remplacer le minuteur en cours ?', `Un rappel est déjà prévu ${atClock(active.due_at)} pour ${name}. Le remplacer par un rappel dans ${formatHM(minutes)} après ce biberon ?`, 'Remplacer', false))) {
        return 'Le rappel en cours est conservé.';
      }
      const timer = await startTimer.mutateAsync({ childId, lastBottleAt: time, intervalMinutes: minutes, plannedMl, bottleId, replace: active ? 'new_bottle' : false });
      return `Prochain rappel ${atClock(timer.due_at)}.`;
    } catch (e) {
      return `Rappel non programmé : ${e instanceof Error ? e.message : 'erreur inconnue'}`;
    }
  }

  async function remove() {
    if (!(await confirm('Supprimer cette entrée ?', 'Elle sera supprimée pour toutes les personnes du foyer.', 'Supprimer'))) return;
    await del.mutateAsync(params.id!);
    toast('Entrée supprimée.');
    router.back();
  }

  if (!childId) {
    return (
      <Screen back title={KIND_META[kind].label}>
        <Banner tone="info">{'Ajoutez d’abord le profil d’un enfant.'}</Banner>
        <Button label="Ajouter un profil" onPress={() => router.replace('/profiles/new')} />
      </Screen>
    );
  }

  const fmtTimer = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <Screen
      back
      title={`${editing ? 'Modifier' : 'Ajouter'} : ${KIND_META[kind].label.toLowerCase()}`}
      subtitle={child ? `Pour ${child.first_name}` : undefined}
      footer={
        <View style={{ gap: spacing.xs }}>
          <Button label={editing ? 'Enregistrer les modifications' : 'Enregistrer'} size="lg" loading={saving} onPress={save} />
          {editing && <Button label="Supprimer" variant="ghost" icon="trash-2" onPress={remove} />}
        </View>
      }
    >
      {children && children.length > 1 && !editing && (
        <Row wrap>
          {children.map((c) => <Chip key={c.id} label={c.first_name} selected={c.id === childId} onPress={() => router.setParams({ child: c.id })} />)}
        </Row>
      )}
      {error ? <Banner tone="danger">{error}</Banner> : null}

      {kind === 'bottle' && (
        <>
          <TimePicker value={time} onChange={setTime} label="Heure du biberon" />
          <Stepper label="Quantité préparée" value={prepared} onChange={setPrepared} presets={[60, 90, 120, 150, 180, 210, 240]} />
          <Stepper label="Quantité bue" value={consumed} onChange={setConsumed} />
          <Field label="Type de lait" optional value={milkType} onChangeText={setMilkType} placeholder="Lait infantile 1er âge, lait maternel…" hint="Tel que vous l’indiquez : l’application ne recommande pas de lait." />
          <Field label="Quantité prévue pour le prochain biberon" optional value={plannedNext} onChangeText={setPlannedNext} keyboardType="number-pad" suffix="ml" hint="Celle que vous avez décidée ou qu’un professionnel vous a indiquée. Elle sera rappelée avec le minuteur." />
          {!editing && (
            <View style={{ gap: spacing.xs }}>
              <Text variant="label">Prochain rappel</Text>
              {bottleTimer.active && (
                <Text variant="small" muted>
                  {params.timer === bottleTimer.active.id
                    ? `Le rappel en cours (prévu ${atClock(bottleTimer.active.due_at)}) sera clos ou remplacé.`
                    : `Un rappel est déjà prévu ${atClock(bottleTimer.active.due_at)} : vous pourrez choisir de le remplacer.`}
                </Text>
              )}
              <ReminderChoicePicker value={reminder} onChange={setReminder} lastInterval={bottleTimer.lastInterval} />
              <Text variant="caption" muted>{NO_RECOMMENDATION_NOTE}</Text>
            </View>
          )}
        </>
      )}

      {(kind === 'breastfeed' || kind === 'pumping') && (
        <Segmented label="Côté" value={side} onChange={setSide} options={[{ value: 'left', label: 'Gauche' }, { value: 'right', label: 'Droite' }, { value: 'both', label: 'Les deux' }]} />
      )}
      {kind === 'breastfeed' && (
        <>
          {!editing && (
            <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md }}>
              <Text variant="hero" accessibilityLiveRegion="polite">{timerStart ? fmtTimer : '0:00'}</Text>
              <Button label={timerStart ? 'Arrêter et enregistrer' : 'Démarrer le chronomètre'} icon={timerStart ? 'square' : 'play'} variant={timerStart ? 'primary' : 'secondary'} onPress={timerStart ? save : () => { setTimerStart(new Date()); haptic('light'); }} />
            </View>
          )}
          {!timerStart && (
            <>
              <Text muted center>— ou saisie après coup —</Text>
              <TimePicker value={time} onChange={setTime} label="Début" />
              <Field label="Durée (minutes)" optional value={duration} onChangeText={setDuration} keyboardType="number-pad" />
            </>
          )}
        </>
      )}
      {kind === 'pumping' && (
        <>
          <TimePicker value={time} onChange={setTime} />
          <Stepper label="Quantité tirée" value={amount} onChange={setAmount} presets={[40, 60, 80, 100, 120, 150]} />
        </>
      )}

      {kind === 'diaper' && (
        <>
          <TimePicker value={time} onChange={setTime} />
          <Row wrap>
            <Chip label="Mouillée" icon="droplet" selected={wet} onPress={() => setWet(!wet)} />
            <Chip label="Selles" icon="circle" selected={stool} onPress={() => setStool(!stool)} />
          </Row>
        </>
      )}

      {kind === 'sleep' && (
        <>
          <TimePicker value={time} onChange={setTime} label="Endormissement" />
          <TimePicker value={end} onChange={setEnd} label="Réveil" />
          <Text muted>Durée : {formatDuration((end.getTime() - time.getTime()) / 60000)}</Text>
          <Stepper label="Réveils pendant ce sommeil" value={wakeups} onChange={(v) => setWakeups(v ?? 0)} step={1} unit="réveil(s)" />
        </>
      )}

      {kind === 'meal' && (
        <>
          <TimePicker value={time} onChange={setTime} />
          <Field label="Repas" optional value={description} onChangeText={setDescription} placeholder="Purée de courgette, compote…" />
          <Field label="Aliments" optional value={foods} onChangeText={setFoods} placeholder="Séparés par des virgules" hint="Les nouveaux aliments apparaîtront dans « Diversification »." />
          <View style={{ gap: spacing.xs }}>
            <Text variant="label">Texture</Text>
            <Row wrap>
              {([['smooth', 'Lisse'], ['mashed', 'Écrasée'], ['pieces', 'Petits morceaux'], ['family', 'Comme à table']] as const).map(([k, l]) => (
                <Chip key={k} label={l} selected={texture === k} onPress={() => setTexture(texture === k ? null : k)} />
              ))}
            </Row>
          </View>
          <Field label="Réaction observée" optional value={reaction} onChangeText={setReaction} multiline />
          <Banner tone="danger" title="Réaction importante ?">{'Gêne pour respirer, gonflement du visage ou des lèvres, vomissements répétés, malaise : appelez le 15 ou le 112 immédiatement.'}</Banner>
        </>
      )}

      {kind === 'observation' && (
        <>
          <Segmented label="Type" value={obsKind} onChange={setObsKind} options={[{ value: 'temperature', label: 'Température' }, { value: 'medication', label: 'Traitement' }, { value: 'symptom', label: 'Symptôme' }, { value: 'note', label: 'Note' }]} />
          <TimePicker value={time} onChange={setTime} />
          {obsKind === 'temperature' ? (
            <Field label="Température mesurée" value={temp} onChangeText={setTemp} keyboardType="decimal-pad" suffix="°C" />
          ) : (
            <Field
              label={obsKind === 'medication' ? 'Traitement déjà prescrit' : obsKind === 'symptom' ? 'Symptôme observé' : 'Titre'}
              value={label}
              onChangeText={setLabel}
              hint={obsKind === 'medication' ? 'Uniquement un traitement prescrit par un professionnel. L’application n’indique aucune dose.' : undefined}
            />
          )}
          <Banner tone="warning">{'Ces notes servent à préparer un rendez-vous. Elles ne sont pas interprétées. Un nourrisson de moins de 3 mois qui a de la fièvre doit être vu rapidement par un médecin : en cas de doute, appelez le 15.'}</Banner>
        </>
      )}

      <Field label="Note" optional value={note} onChangeText={setNote} multiline maxLength={1000} />
      {kind === 'observation' && <Text variant="caption" muted color={t.colors.textMuted}>Ne remplace pas l’avis d’un professionnel de santé.</Text>}
    </Screen>
  );
}
