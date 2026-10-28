/**
 * Sommeil de l'enfant : enregistrement en deux grands boutons, planning du jour estimé, modification des horaires.
 * Inspiré du principe des applications spécialisées (estimation des périodes d'éveil), avec une interface et des
 * textes propres à Au fil de nous.
 *  · Gratuit : enregistrer siestes, nuits, réveils nocturnes ; modifier ou supprimer un horaire ; état actuel ;
 *    totaux du jour ; aide pour la nuit ; sommeil en sécurité.
 *  · Premium : estimations personnalisées (prochaine sieste, routine, coucher), recalcul en temps réel,
 *    notifications, apprentissage des retours, tendances.
 * Jamais de promesse ni d'obligation : ce sont des estimations, les signes de fatigue de l'enfant priment.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Chip, Field, haptic, Icon, Row, Segmented, Text } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { PremiumSection } from '@/components/Premium';
import { Tappable } from '@/components/Tappable';
import { useInvalidate, usePremium, useTrackedChildren } from '@/lib/data/hooks';
import { notificationsSupported } from '@/lib/notifications';
import { friendlyError } from '@/lib/data/hooks-settings';
import { addSleepFeedback, SleepError, useSleepActions, useSleepNotificationSync, useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { agree, clock, estimateBefore, parseHM, planLines, sleepKind, span, type SleepFeedback, type SleepPlan, type SleepProfile, type SleepRecord } from '@/lib/domain/sleepPlanner';
import type { Child, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { palette, radius, spacing } from '@/theme/tokens';

const MIN = 60_000;
const errText = (e: unknown) => (e instanceof SleepError ? e.message : friendlyError(e));

/** Heure « HH:MM » saisie → date la plus récente passée (aujourd'hui, sinon hier). */
export function pastTime(hhmm: string, now = new Date()): Date | null {
  const m = parseHM(hhmm);
  if (m === null) return null;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, m);
  if (d.getTime() > now.getTime() + MIN) d.setDate(d.getDate() - 1);
  return d;
}
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

// ─── Choix de l'heure (si le parent a oublié de lancer le suivi) ───────────────────────────────────

export function TimeSheet({ visible, title, onClose, onConfirm, kind, onKind }: {
  visible: boolean; title: string; onClose: () => void; onConfirm: (at: Date) => Promise<void> | void;
  kind?: 'nap' | 'night'; onKind?: (k: 'nap' | 'night') => void;
}) {
  const [offset, setOffset] = useState(0);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function go() {
    const now = new Date();
    const at = typed.trim() ? pastTime(typed, now) : new Date(now.getTime() - offset * MIN);
    if (!at) { setError('Heure attendue au format HH:MM (ex. 14:05).'); return; }
    setBusy(true);
    try { await onConfirm(at); setTyped(''); setOffset(0); setError(null); onClose(); } catch (e) { setError(errText(e)); } finally { setBusy(false); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={{ gap: spacing.sm }} testID="sleep-time-sheet">
        {kind && onKind ? <Segmented label="Type de sommeil" value={kind} onChange={onKind} options={[{ value: 'nap', label: 'Sieste' }, { value: 'night', label: 'Nuit' }]} /> : null}
        <Row wrap>
          {[0, 5, 10, 15, 30, 45].map((m) => (
            <Chip key={m} label={m ? `Il y a ${m} min` : 'Maintenant'} selected={!typed && offset === m} onPress={() => { setOffset(m); setTyped(''); }} />
          ))}
        </Row>
        <Field label="Ou une heure précise" optional value={typed} onChangeText={(v) => { setTyped(v); setError(null); }} placeholder="14:05" keyboardType="numbers-and-punctuation" maxLength={5} testID="sleep-time-input" error={error ?? undefined} />
        <Button label="Enregistrer" onPress={go} loading={busy} testID="sleep-time-save" />
      </View>
    </Sheet>
  );
}

// ─── Grands boutons ────────────────────────────────────────────────────────────────────────────────

/** Gros bouton tactile, utilisable d'une main. */
export function BigButton({ label, icon, onPress, testID, tone = 'primary', hint, loading }: { label: string; icon: React.ComponentProps<typeof Icon>['name']; onPress: () => void; testID?: string; tone?: 'primary' | 'soft' | 'night'; hint?: string; loading?: boolean }) {
  const t = useTheme();
  const bg = tone === 'primary' ? t.colors.primary : tone === 'night' ? '#1B2550' : t.colors.surfaceAlt;
  const fg = tone === 'primary' ? t.colors.primaryText : tone === 'night' ? '#C9D2F2' : t.colors.text;
  return (
    <Tappable testID={testID} accessibilityRole="button" accessibilityLabel={hint ? `${label}. ${hint}` : label} onPress={loading ? undefined : onPress}
      style={({ pressed }) => ({ flexGrow: 1, flexBasis: '45%', minHeight: 76, borderRadius: radius.lg, backgroundColor: bg, opacity: pressed || loading ? 0.85 : 1, alignItems: 'center', justifyContent: 'center', gap: 4, padding: spacing.sm })}>
      <Icon name={icon} color={fg} />
      <Text weight="bold" center color={fg}>{label}</Text>
    </Tappable>
  );
}

/**
 * « Mon enfant s'endort » / « Mon enfant se réveille », adaptés à l'état : la nuit, réveil nocturne ou réveil du matin.
 * Chaque action accepte une autre heure (oubli de lancer le suivi).
 */
export function SleepRecordButtons({ child, plan, tone = 'primary' }: { child: Child; plan: SleepPlan | null; tone?: 'primary' | 'night' }) {
  const toast = useToast();
  const act = useSleepActions(child);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState<null | 'asleep' | 'awake' | 'waking' | 'back'>(null);
  const h = new Date().getHours();
  const defaultKind: 'nap' | 'night' = plan?.state === 'awake' && plan.nextNap && !plan.nextNap.overdue ? 'nap' : plan?.state === 'awake' && plan.bedtime && !plan.nextNap ? (h >= 16 ? 'night' : 'nap') : h >= 19 || h < 7 ? 'night' : 'nap';
  const [kind, setKind] = useState<'nap' | 'night'>(defaultKind);
  const name = child.first_name;
  const state = plan?.state ?? 'unknown';

  async function run(fn: () => Promise<void>, msg: string) {
    setBusy(true);
    try { await fn(); haptic('success'); toast(msg, 'success'); } catch (e) { toast(errText(e), 'error'); } finally { setBusy(false); }
  }
  const now = () => new Date();
  const asleepNow = () => run(() => act.asleep(now(), defaultKind), `${name} : ${defaultKind === 'night' ? 'nuit' : 'sieste'} notée depuis ${clock(Date.now())}.`);
  const awakeNow = () => run(() => act.awake(now()), `Réveil de ${name} noté à ${clock(Date.now())}.`);
  const otherTime = (k: typeof sheet) => { setKind(defaultKind); setSheet(k); };

  return (
    <View style={{ gap: spacing.xs }} testID="sleep-record">
      <Row wrap>
        {state === 'asleep_nap' ? <BigButton tone={tone} icon="sun" label="Mon enfant se réveille" hint={name} onPress={awakeNow} loading={busy} testID="sleep-awake" /> : null}
        {state === 'asleep_night' ? (
          <>
            <BigButton tone={tone} icon="moon" label="Réveil pendant la nuit" hint={name} onPress={() => run(() => act.nightWaking(now()), `Réveil de nuit noté à ${clock(Date.now())}.`)} loading={busy} testID="sleep-night-waking" />
            <BigButton tone={tone === 'night' ? 'night' : 'soft'} icon="sun" label="Mon enfant se réveille" hint="Réveil du matin" onPress={awakeNow} loading={busy} testID="sleep-awake" />
          </>
        ) : null}
        {state === 'night_waking' ? (
          <>
            <BigButton tone={tone} icon="moon" label="Mon enfant se rendort" hint={name} onPress={() => run(() => act.backToSleep(now()), `${name} se rendort à ${clock(Date.now())}.`)} loading={busy} testID="sleep-back" />
            <BigButton tone={tone === 'night' ? 'night' : 'soft'} icon="sun" label="Réveil du matin" hint={name} onPress={awakeNow} loading={busy} testID="sleep-awake" />
          </>
        ) : null}
        {state === 'awake' || state === 'unknown' || state === 'stale' ? <BigButton tone={tone} icon="moon" label="Mon enfant s’endort" hint={`${name}, ${defaultKind === 'night' ? 'nuit' : 'sieste'}`} onPress={asleepNow} loading={busy} testID="sleep-asleep" /> : null}
      </Row>
      <Row wrap>
        <Button size="sm" variant="ghost" icon="clock" label="Autre heure…" testID="sleep-other-time"
          onPress={() => otherTime(state === 'asleep_nap' ? 'awake' : state === 'asleep_night' ? 'waking' : state === 'night_waking' ? 'back' : 'asleep')} />
      </Row>
      <TimeSheet visible={sheet === 'asleep'} title={`${name} s’est endormi${agree(child.sex, '', 'e', '·e')} à…`} onClose={() => setSheet(null)} kind={kind} onKind={setKind}
        onConfirm={async (at) => { await act.asleep(at, kind); toast(`Sommeil noté depuis ${clock(at)}.`, 'success'); }} />
      <TimeSheet visible={sheet === 'awake'} title={`${name} s’est réveillé${agree(child.sex, '', 'e', '·e')} à…`} onClose={() => setSheet(null)}
        onConfirm={async (at) => { await act.awake(at); toast(`Réveil noté à ${clock(at)}.`, 'success'); }} />
      <TimeSheet visible={sheet === 'waking'} title="Réveil pendant la nuit à…" onClose={() => setSheet(null)}
        onConfirm={async (at) => { await act.nightWaking(at); toast(`Réveil de nuit noté à ${clock(at)}.`, 'success'); }} />
      <TimeSheet visible={sheet === 'back'} title={`${name} s’est rendormi${agree(child.sex, '', 'e', '·e')} à…`} onClose={() => setSheet(null)}
        onConfirm={async (at) => { await act.backToSleep(at); toast(`Rendormi${agree(child.sex, '', 'e', '·e')} à ${clock(at)}.`, 'success'); }} />
    </View>
  );
}

/** Ancien nom conservé (écrans et tests existants) : mêmes grands boutons. */
export function SleepQuickButtons({ child }: { child: Child }) {
  const { plan } = useSleepPlan(child);
  return <SleepRecordButtons child={child} plan={plan} />;
}

// ─── Accueil : l'essentiel seulement ───────────────────────────────────────────────────────────────

/** État actuel, durée, prochaine action estimée, bouton d'enregistrement. Le détail est dans « Sommeil ». */
export function SleepNowCard({ child }: { child: Child }) {
  const premium = usePremium();
  const { plan } = useSleepPlan(child);
  const lines = plan ? planLines(plan, child.first_name, child.sex) : [];
  const state = lines.find((l) => l.key === 'state')?.text;
  const next = lines.find((l) => l.key === 'nap' || l.key === 'bedtime' || l.key === 'wake');
  const hour = new Date().getHours();
  const isNightTime = plan?.state === 'asleep_night' || plan?.state === 'night_waking' || hour >= 20 || hour < 6;
  return (
    <View testID="sleep-now">
      <Card>
        <Row style={{ alignItems: 'center' }}>
          <Icon name={plan?.state === 'awake' ? 'sun' : 'moon'} color={palette.lavenderInk} />
          <View style={{ flex: 1 }}>
            <Text variant="caption" muted>{`Sommeil de ${child.first_name}`}</Text>
            <Text weight="bold" testID="sleep-now-state">{state ?? '—'}</Text>
          </View>
        </Row>
        {next ? (premium
          ? <Text variant="small" style={{ marginTop: 4 }} testID="sleep-now-next">{`${next.text} (estimation)`}</Text>
          : <Text variant="small" muted style={{ marginTop: 4 }}>Prochaine sieste et coucher estimés avec Premium</Text>) : null}
        <View style={{ marginTop: spacing.xs }}><SleepRecordButtons child={child} plan={plan} /></View>
        <Row wrap>
          <Button size="sm" variant="ghost" iconRight="arrow-right" label="Planning complet" onPress={() => router.push(`/sleep/${child.id}` as never)} testID="sleep-open" />
          {isNightTime ? <Button size="sm" variant="ghost" icon="moon" label="Aide pour cette nuit" onPress={() => router.push({ pathname: '/sleep/tonight', params: { child: child.id } } as never)} testID="sleep-now-tonight" /> : null}
        </Row>
      </Card>
    </View>
  );
}

/** Carte de la fiche enfant : l'essentiel + accès au planning, au mode nuit et à l'aide pour cette nuit. */
export function BabySleepCard({ child }: { child: Child }) {
  const { plan, sleeps } = useSleepPlan(child);
  const today = plan?.daySleepMinutes ?? 0;
  return (
    <View testID="baby-sleep" style={{ gap: spacing.xs }}>
      <SleepNowCard child={child} />
      <Card tone="soft">
        <Text variant="small">{`Aujourd’hui : ${plan?.napsDone ?? 0} sieste(s) · ${span(today)}`}{sleeps.length ? '' : ' · aucun relevé pour l’instant'}</Text>
        <Row wrap style={{ marginTop: spacing.xs }}>
          <Button label="Noter un sommeil passé" size="sm" variant="ghost" icon="edit-3" onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'sleep', child: child.id } })} />
          <Button label="Mode nuit" size="sm" variant="ghost" icon="moon" onPress={() => router.push('/night')} />
          <Button label="Aide pour cette nuit" size="sm" variant="ghost" icon="star" onPress={() => router.push({ pathname: '/sleep/tonight', params: { child: child.id } } as never)} testID="sleep-tonight-link" />
        </Row>
      </Card>
      <View testID="sleep-estimate">
        <PremiumSection feature="sleep_insights" name={child.first_name} testID="premium-sleep"
          preview={<Text variant="small">{`${plan?.samples ?? 0} temps d’éveil déjà notés : Premium en tire la prochaine sieste, la routine et le coucher estimés de ${child.first_name}, recalculés à chaque relevé.`}</Text>}>
          <Card onPress={() => router.push(`/sleep/${child.id}` as never)} accessibilityLabel={`Planning de sommeil de ${child.first_name}`}>
            <Text weight="bold">{`Planning de sommeil de ${child.first_name}`}</Text>
            <Text variant="small" muted>Estimations personnalisées, notifications, tendances sur 7 jours</Text>
          </Card>
        </PremiumSection>
      </View>
    </View>
  );
}

// ─── Planning visuel ───────────────────────────────────────────────────────────────────────────────

const ITEM_LABEL: Record<SleepPlan['items'][number]['kind'], string> = {
  night: 'Nuit', nap: 'Sieste', awake: 'Éveil en cours', nap_est: 'Sieste estimée', routine: 'Routine du soir', bedtime: 'Coucher estimé',
};

/** Frise verticale de la journée : réalisé (plein) puis estimé (pointillés). Toucher un sommeil noté pour le modifier. */
export function SleepTimeline({ plan, showEstimates, onEdit, now }: { plan: SleepPlan; showEstimates: boolean; onEdit?: (id: string) => void; now: Date }) {
  const t = useTheme();
  const items = plan.items.filter((i) => showEstimates || !i.estimated);
  if (!items.length) return <Text variant="small" muted>Rien de noté aujourd’hui pour l’instant.</Text>;
  return (
    <View accessibilityLabel="Planning de la journée" testID="sleep-timeline">
      {items.map((i, k) => {
        const done = !i.estimated;
        const color = i.kind === 'night' || i.kind === 'nap' ? palette.lavenderInk : i.kind === 'awake' ? t.colors.gold : t.colors.textMuted;
        const dur = i.to !== null ? span((i.to - i.from) / MIN) : i.ongoing ? span((now.getTime() - i.from) / MIN) : null;
        const when = i.kind === 'nap_est' ? `vers ${clock(i.from)}` : i.kind === 'bedtime' && plan.bedtime ? `${clock(plan.bedtime.from)} – ${clock(plan.bedtime.to)}` : i.to !== null && i.kind !== 'routine' ? `${clock(i.from)} – ${clock(i.to)}` : i.kind === 'routine' ? `vers ${clock(i.from)}` : `depuis ${clock(i.from)}`;
        const body = (
          <Row style={{ alignItems: 'stretch' }}>
            <View style={{ width: 14, alignItems: 'center' }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, marginTop: 4, backgroundColor: done ? color : 'transparent', borderWidth: 2, borderColor: color, borderStyle: done ? 'solid' : 'dashed' }} />
              {k < items.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: t.colors.border, marginTop: 2 }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: spacing.sm }}>
              <Text weight={done ? 'bold' : undefined}>{`${ITEM_LABEL[i.kind]}${i.estimated ? ' (estimation)' : ''}`}</Text>
              <Text variant="small" muted>{`${when}${dur && i.kind !== 'routine' ? ` · ${dur}` : ''}`}</Text>
            </View>
            {done && i.id && onEdit ? <Icon name="edit-3" size={16} color={t.colors.textMuted} /> : null}
          </Row>
        );
        return done && i.id && onEdit
          ? <Tappable key={`${i.kind}-${i.from}`} accessibilityRole="button" accessibilityLabel={`Modifier : ${ITEM_LABEL[i.kind]} ${when}`} onPress={() => onEdit(i.id!)} testID={`sleep-item-${i.kind}`}>{body}</Tappable>
          : <View key={`${i.kind}-${i.from}`} testID={`sleep-item-${i.kind}`}>{body}</View>;
      })}
      <Text variant="small" weight="bold">{`Sommeil de jour : ${span(plan.daySleepMinutes)} · ${plan.napsDone} sieste(s)`}</Text>
    </View>
  );
}

// ─── Modifier un horaire ───────────────────────────────────────────────────────────────────────────

export function SleepEditSheet({ child, sleep, all, onClose }: { child: Child; sleep: Sleep | null; all: Sleep[]; onClose: () => void }) {
  const toast = useToast();
  const act = useSleepActions(child);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [kind, setKind] = useState<'nap' | 'night'>('nap');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = sleep?.id;
  React.useEffect(() => {
    if (!sleep) return;
    setStart(hhmm(new Date(sleep.started_at))); setEnd(sleep.ended_at ? hhmm(new Date(sleep.ended_at)) : ''); setKind(sleepKind(sleep)); setError(null);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!sleep) return null;
  async function save() {
    const base = new Date(sleep!.started_at);
    const s = parseHM(start); const e = end.trim() ? parseHM(end) : null;
    if (s === null || (end.trim() && e === null)) { setError('Heures attendues au format HH:MM.'); return; }
    const a = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, s);
    let b: Date | null = null;
    if (e !== null) { b = new Date(a.getFullYear(), a.getMonth(), a.getDate(), 0, e); if (b <= a) b.setDate(b.getDate() + 1); }
    if (!sleep!.ended_at && b === null) b = null;
    setBusy(true);
    try { await act.edit(sleep!, { started_at: a, ended_at: b, kind }, all); toast('Horaires modifiés : le planning est recalculé.', 'success'); onClose(); } catch (err) { setError(errText(err)); } finally { setBusy(false); }
  }
  async function del() {
    if (!(await confirm('Supprimer ce sommeil ?', 'Le planning sera recalculé sans lui.', 'Supprimer'))) return;
    try { await act.remove(sleep!); toast('Sommeil supprimé : le planning est recalculé.', 'success'); onClose(); } catch (err) { setError(errText(err)); }
  }
  return (
    <Sheet visible={!!sleep} onClose={onClose} title={`Modifier — ${child.first_name}`}>
      <View style={{ gap: spacing.sm }} testID="sleep-edit">
        <Segmented label="Type de sommeil" value={kind} onChange={setKind} options={[{ value: 'nap', label: 'Sieste' }, { value: 'night', label: 'Nuit' }]} />
        <Row>
          <View style={{ flex: 1 }}><Field label="Endormissement" value={start} onChangeText={setStart} keyboardType="numbers-and-punctuation" maxLength={5} testID="sleep-edit-start" /></View>
          <View style={{ flex: 1 }}><Field label="Réveil" optional={!sleep.ended_at} value={end} onChangeText={setEnd} placeholder={sleep.ended_at ? '' : 'en cours'} keyboardType="numbers-and-punctuation" maxLength={5} testID="sleep-edit-end" /></View>
        </Row>
        {error ? <Text variant="small" color={palette.danger}>{error}</Text> : null}
        <Button label="Enregistrer" onPress={save} loading={busy} testID="sleep-edit-save" />
        <Button label="Supprimer ce sommeil" variant="ghost" icon="trash-2" onPress={del} testID="sleep-edit-delete" />
      </View>
    </Sheet>
  );
}

// ─── Votre avis sur la dernière estimation ─────────────────────────────────────────────────────────

/** Après un endormissement, « l'estimation était juste / trop tôt / trop tard » : améliore les prochaines. */
export function FeedbackPrompt({ child, sleeps, profile, feedback }: { child: Child; sleeps: SleepRecord[]; profile: SleepProfile | null; feedback: SleepFeedback[] }) {
  const toast = useToast();
  const inv = useInvalidate();
  const [sent, setSent] = useState<string | null>(null);
  const target = useMemo(() => {
    const own = sleeps.filter((s) => s.child_id === child.id || s.child_id == null).sort((a, b) => b.started_at.localeCompare(a.started_at));
    const last = own[0];
    if (!last || Date.now() - Date.parse(last.started_at) > 12 * 3600_000) return null;
    const e = estimateBefore({ childId: child.id, birthDate: child.birth_date, profile, sleeps, feedback }, last);
    if (!e) return null;
    if (feedback.some((f) => f.target === e.target && Math.abs(Date.parse(f.estimated_for) - e.at) < MIN)) return null;
    return { ...e, startedAt: Date.parse(last.started_at) };
  }, [child, sleeps, profile, feedback]);
  if (!target || sent === String(target.at)) return null;
  async function send(verdict: 'right' | 'early' | 'late') {
    try {
      await addSleepFeedback(child, target!.target, verdict, target!.at);
      setSent(String(target!.at));
      inv('sleep_feedback');
      toast('Merci : les prochaines estimations en tiendront compte.', 'success');
    } catch (e) { toast(errText(e), 'error'); }
  }
  return (
    <Card tone="lavender">
      <View testID="sleep-feedback">
        <Text weight="bold">{`${target.target === 'nap' ? 'Sieste' : 'Coucher'} estimé${target.target === 'nap' ? 'e' : ''} vers ${clock(target.at)}, ${child.first_name} s’est endormi${agree(child.sex, '', 'e', '·e')} à ${clock(target.startedAt)}`}</Text>
        <Text variant="small" muted>Cette estimation vous a-t-elle paru adaptée ?</Text>
        <Row wrap style={{ marginTop: spacing.xs }}>
          <Chip label="Cette estimation était juste" onPress={() => send('right')} />
          <Chip label="Trop tôt" onPress={() => send('early')} />
          <Chip label="Trop tard" onPress={() => send('late')} />
        </Row>
      </View>
    </Card>
  );
}

// ─── Notifications : tenues à jour pour chaque enfant suivi, où que l'on soit dans l'application ──

function SleepNotificationSync({ child }: { child: Child }) {
  const { plan, profile } = useSleepPlan(child, 60_000);
  useSleepNotificationSync(child, plan, profile);
  return null;
}

/** Monté une fois : recalcule et reprogramme les notifications de sommeil de chaque enfant (annulées sans Premium). */
export function SleepNotificationsHost() {
  const kids = useTrackedChildren().data ?? [];
  if (!notificationsSupported) return null;
  return <>{kids.filter((c) => c.enabled_tracking.includes('sleep')).map((c) => <SleepNotificationSync key={c.id} child={c} />)}</>;
}
