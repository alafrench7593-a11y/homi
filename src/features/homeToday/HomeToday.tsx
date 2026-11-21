/**
 * Accueil — journée v5 « Lumière corail » (16/11/2026, demande de la propriétaire : reconnaître l'identité de
 * l'onboarding — lumière corail, 3D — avec une interface calme, précise et facile à utiliser au quotidien).
 *
 *  1. PROCHAIN ÉVÉNEMENT (`NextUp`) : ce qui arrive ensuite ressort immédiatement — petite illustration 3D sur un halo
 *     corail local et FIXE, heure en chiffres tabulaires, titre, lieu ou personne ; toucher ouvre le détail.
 *  2. À TRAITER : la demande en tête (`TodayFocus`, carte isolée) porte la SEULE action principale de l'écran
 *     (« J'accepte » ou « C'est fait ») ; les autres demandes urgentes (à accepter, en retard) suivent en lignes.
 *  3. LE RESTE DE LA JOURNÉE : chronologie à horaires alignés (colonne d'heures tabulaires, fil vertical fin, point
 *     d'état « en retard / en cours / ensuite / fait »), statut en capsule courte, case à cocher discrète.
 *     Ce qui est déjà montré plus haut (prochain événement, demandes) n'est pas répété. Plus de compteurs
 *     (« 1 attend votre réponse · 4 à faire · 1 fait ») : la liste le montre déjà.
 *  4. UNE seule entrée d'ajout : le « + » de la barre d'onglets (`useDockAction('index')`), sauf sur l'accueil d'un
 *     enfant où le « + » reste celui du cocon (`dockAdd={false}`).
 *
 * Écran de suivi : rien ne bouge pendant la lecture (aucune pulsation, halo figé). Seuls mouvements : apparition des
 * blocs (`Cascade`), pression, validation (coche), réorganisation douce après une validation (`useListLayout`).
 * Confirmation : seulement après la réponse RÉELLE du serveur (fait maintenant / déjà fait / conflit → erreur).
 */
import { useTourAnchor } from '@/features/tour/anchors';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { haptic, Icon, Text, type IconName } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { UserAvatar } from '@/components/UserAvatar';
import { ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Cascade, useMotion } from '@/motion';
import { CardSource, useListLayout } from '@/features/scene';
import { DayList, DayRail, DaySection, DaySeparator, StatusPill, type DayState } from '@/features/day5/DayParts';
import { NextUp, type NextArt, type NextUpInfo } from '@/features/day5/NextUp';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useChildren } from '@/lib/data/hooks';
import type { CalendarItem } from '@/lib/domain/calendar';
import type { CareShift } from '@/lib/domain/familyLoad';
import { countdown } from '@/lib/domain/dayThread';
import { formatTime, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { getTodayDoneComponent, type DoneMarkProps } from './DoneMark';
import { TodayAgendaRow, TodayFocus } from './TodayTaskRow';
import { isEmptyToday, todayTimeline, type CustodyToday, type TimelineEntry, type TodayProfile, type TodayTask } from './todayModel';
import { useCompleteToday, useHomeToday, type TodayPerson } from './useHomeToday';

/** Lignes de chronologie affichées sur l'accueil (le reste : « Voir toute l'organisation »). */
const MAX_ROWS = 7;
/** Le temps de voir la validation avant que la ligne rejoigne « fait » (ms). */
const HOLD_MS = 1100;

type Other = Exclude<TimelineEntry, { kind: 'task' }>;

/** Début / fin (ms) d'une entrée datée de la chronologie ; null : toute la journée ou sans heure. */
export function entrySpan(e: TimelineEntry, sod: number): { start: number; end: number } | null {
  if (e.kind === 'event') return e.item.allDay ? null : { start: Date.parse(e.item.starts), end: Date.parse(e.item.ends) };
  if (e.kind === 'shift') return { start: Date.parse(e.shift.starts_at), end: Date.parse(e.shift.ends_at) };
  if (e.kind === 'custody') {
    if (!e.custody.time) return null;
    const [h, m] = e.custody.time.split(':').map(Number);
    const start = sod + (h * 60 + m) * 60_000;
    return { start, end: start + 30 * 60_000 };
  }
  const x = e.task;
  if (!x.timed || !x.dueAt || x.late) return null;
  const at = Date.parse(x.dueAt);
  return { start: at, end: at };
}

/** Une demande est URGENTE si elle attend ma réponse, ou si elle est à moi (ou à prendre) et en retard. */
export function isUrgent(x: TodayTask, now: number): boolean {
  if (x.done) return false;
  if (x.awaitsMe) return true;
  const overdue = x.late || (x.timed && !!x.dueAt && Date.parse(x.dueAt) < now);
  return overdue && x.canComplete;
}

/**
 * États de la chronologie : fait, en retard (tâche dépassée), en cours (événement commencé), ensuite (le premier à
 * venir), plus tard, sans heure.
 */
export function entryStates(list: TimelineEntry[], now: number, sod: number): Map<string, DayState> {
  const out = new Map<string, DayState>();
  let nextGiven = false;
  for (const e of list) {
    if (e.kind === 'task' && e.task.done) { out.set(e.key, 'done'); continue; }
    if (e.kind === 'task' && e.task.late) { out.set(e.key, 'late'); continue; }
    const span = entrySpan(e, sod);
    if (!span) { out.set(e.key, 'anytime'); continue; }
    if (e.kind === 'task') {
      if (span.start < now) { out.set(e.key, 'late'); continue; }
    } else if (span.start <= now && now < span.end) { out.set(e.key, 'now'); continue; }
    else if (span.end <= now) { out.set(e.key, 'past'); continue; }
    out.set(e.key, nextGiven ? 'later' : 'next');
    nextGiven = true;
  }
  return out;
}

/** Le prochain événement (rendez-vous, événement, relais, passage de garde) : en cours, sinon le premier à venir. */
export function nextEntry(list: TimelineEntry[], now: number, sod: number): Other | null {
  const others = list.filter((e): e is Other => e.kind !== 'task');
  const timed = others.find((e) => { const s = entrySpan(e, sod); return !!s && s.end > now; });
  return timed ?? others.find((e) => !entrySpan(e, sod) && e.kind === 'event') ?? null;
}

/**
 * État partagé de la journée (17/11/2026) : l'accueil place « prochaine action » (`TodayNext`) et « agenda du jour »
 * (`TodayAgenda`) à deux endroits du tableau de bord ; les deux lisent la MÊME scène (une validation dans l'un ne fait
 * pas sauter l'autre). `profile` : journée du profil affiché.
 */
export function useTodayScene({ DoneComponent, profile }: { DoneComponent?: React.ComponentType<DoneMarkProps>; profile?: TodayProfile } = {}) {
  const m = useMotion();
  const toast = useToast();
  const d = useHomeToday(undefined, profile);
  const { data: children } = useChildren();
  const { complete, accept } = useCompleteToday();
  const Done = DoneComponent ?? getTodayDoneComponent();
  const [busy, setBusy] = useState<{ id: string; action: 'complete' | 'accept' } | null>(null);
  // Validation optimiste : la ligne passe « fait » tout de suite (animation), garde sa place un instant, puis la liste se réorganise
  const [held, setHeld] = useState<{ ids: string[]; order: string[]; focus: string | null; urgent: string[] } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const focusId = held ? held.focus : d.emphasis;
  const focus = d.model.tasks.find((x) => x.id === focusId) ?? null;
  const view = useMemo(() => {
    const nowD = new Date();
    const now = nowD.getTime();
    const sod = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate()).getTime();
    const all = todayTimeline(d.model, { exclude: focusId, now: nowD });
    const next = nextEntry(all, now, sod);
    // Demandes urgentes (hors demande en tête) : figées pendant une validation pour ne pas sauter sous le doigt
    const urgentIds = held ? held.urgent : d.model.tasks.filter((x) => x.id !== focusId && isUrgent(x, now)).map((x) => x.id);
    const urgent = urgentIds.map((id) => d.model.tasks.find((x) => x.id === id)).filter((x): x is TodayTask => !!x);
    let rest = all.filter((e) => e.key !== next?.key && !(e.kind === 'task' && urgentIds.includes(e.task.id)));
    if (held) {
      const pos = new Map(held.order.map((k, i) => [k, i]));
      rest = [...rest].sort((a, b) => (pos.get(a.key) ?? 1e6) - (pos.get(b.key) ?? 1e6));
    }
    return { now, sod, next, urgent, urgentIds, rest, states: entryStates(rest, now, sod) };
  }, [d.model, focusId, held]);

  async function onComplete(x: TodayTask) {
    if (busy) return;
    setBusy({ id: x.id, action: 'complete' });
    if (timer.current) clearTimeout(timer.current);
    setHeld((h) => ({ ids: [...(h?.ids ?? []), x.id], order: h?.order ?? view.rest.map((e) => e.key), focus: h ? h.focus : focusId, urgent: h?.urgent ?? view.urgentIds }));
    haptic('success');
    try {
      const out = await complete(x);
      // Confirmation = résultat réel du serveur (déjà fait : rejeu / double appui)
      toast(out === 'unchanged' ? tr('ht.alreadyDone') : x.kind === 'mission' ? tr('mis.toast.complete') : tr('ht.doneToast'));
      timer.current = setTimeout(() => setHeld(null), m.off ? 300 : HOLD_MS);
    } catch (e) {
      setHeld((h) => (h ? { ...h, ids: h.ids.filter((id) => id !== x.id) } : null));
      toast(friendlyError(e), 'error');
    } finally { setBusy(null); }
  }
  async function onAccept(x: TodayTask) {
    if (busy) return;
    setBusy({ id: x.id, action: 'accept' });
    try {
      const out = await accept(x);
      haptic('success');
      toast(out === 'unchanged' ? tr('ht.alreadyAccepted') : tr('mis.toast.accept'));
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(null); }
  }

  const empty = !d.loading && !d.error && isEmptyToday(d.model);
  const shown = view.rest.slice(0, MAX_ROWS);
  const more = view.rest.length - shown.length;
  const nextInfo = view.next ? describeNext(view.next, children ?? [], d.person, view.now) : null;
  return { d, view, focus, held, busy, Done, empty, shown, more, nextInfo, onComplete, onAccept };
}
export type TodayScene = ReturnType<typeof useTodayScene>;

/** 1 + 2 — Prochain événement, puis « À traiter » (la seule action principale de l'écran). */
export function TodayNext({ scene, art = 'foyer', cascadeIndex = 0, compactEmpty = false }: { scene: TodayScene; art?: NextArt; cascadeIndex?: number; compactEmpty?: boolean }) {
  const t = useTheme();
  const { d, view, focus, held, busy, Done, empty, nextInfo, onComplete, onAccept } = scene;
  return (
    <View testID="home-today" style={{ gap: spacing.md }}>
      <Cascade index={cascadeIndex}>
        {d.loading ? <Skeleton kind="card" rows={1} /> : <NextUp info={nextInfo} art={art} compactEmpty={compactEmpty} />}
      </Cascade>
      {d.loading ? <Skeleton kind="card" rows={2} />
        : d.error ? <ErrorView error={d.error} onRetry={d.retry} />
          : empty ? (
            <Cascade index={cascadeIndex + 1}>
              <View testID="home-today-empty" style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', paddingHorizontal: spacing.xxs }}>
                <Icon name="sun" size={20} color={t.colors.primary} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text weight="bold">{tr('ht.empty.title')}</Text>
                  <Text variant="small" muted>{tr('ht.empty.body')}</Text>
                </View>
              </View>
            </Cascade>
          ) : focus || view.urgent.length ? (
            <Cascade index={cascadeIndex + 1}>
              <DaySection title={tr('d5.urgent.title')} testID="home-urgent">
                {focus ? (
                  <TodayFocus x={focus} owner={d.person(focus.ownerId)} creator={focus.creatorId ? d.person(focus.creatorId) : null}
                    celebrate={!!held?.ids.includes(focus.id)} busy={busy?.id === focus.id ? busy.action : null}
                    onComplete={onComplete} onAccept={onAccept} DoneComponent={Done} />
                ) : null}
                {view.urgent.length ? (
                  <DayList testID="home-urgent-list">
                    {view.urgent.map((x, i) => (
                      <React.Fragment key={x.id}>
                        {i ? <DaySeparator /> : null}
                        <TodayAgendaRow x={x} owner={d.person(x.ownerId)} creator={x.creatorId ? d.person(x.creatorId) : null}
                          celebrate={!!held?.ids.includes(x.id)} busy={!!busy} onComplete={onComplete}
                          state={x.late || (x.timed && x.dueAt && Date.parse(x.dueAt) < view.now) ? 'late' : x.timed ? 'later' : 'anytime'} first={i === 0} last={i === view.urgent.length - 1} />
                      </React.Fragment>
                    ))}
                  </DayList>
                ) : null}
              </DaySection>
            </Cascade>
          ) : (
            <Cascade index={cascadeIndex + 1}>
              <View testID="today-clear" accessibilityRole="text" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xxs }}>
                <StatusPill label={tr('d5.clear.pill')} tone="done" icon="check" />
                <Text variant="small" muted style={{ flex: 1 }}>{tr('d5.clear.body')}</Text>
              </View>
            </Cascade>
          )}
    </View>
  );
}

/** 3 — Agenda du jour du profil affiché : chronologie à horaires alignés, lien vers l'agenda complet. */
export function TodayAgenda({ scene, cascadeIndex = 0, caption }: { scene: TodayScene; cascadeIndex?: number; caption?: string }) {
  const layout = useListLayout();
  const { d, view, held, busy, shown, more, onComplete } = scene;
  if (d.loading || d.error) return null;
  const links = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md }}>
      {more > 0 ? <FooterLink icon="list" label={tr('ht.more', { count: more })} onPress={() => router.push('/family')} testID="home-today-more" /> : null}
      <AgendaLink />
    </View>
  );
  return (
    <Cascade index={cascadeIndex}>
      <View testID="home-agenda" style={{ gap: spacing.xs }}>
        <DaySection title={tr('ht.agenda.title')}>
          {caption ? <Text variant="caption" muted testID="home-agenda-for" style={{ paddingHorizontal: spacing.xxs }}>{caption}</Text> : null}
          {shown.length ? (
            <DayList testID="home-today-tasks" footer={links}>
              {shown.map((e, i) => (
                <Animated.View key={e.key} layout={layout}>
                  {i ? <DaySeparator /> : null}
                  <TimelineRow e={e} state={view.states.get(e.key) ?? 'later'} person={d.person} held={held} busy={busy} onComplete={onComplete} first={i === 0} last={i === shown.length - 1} />
                </Animated.View>
              ))}
            </DayList>
          ) : (
            <View style={{ gap: 2, paddingHorizontal: spacing.xxs }}>
              <Text variant="small" muted testID="home-agenda-empty">{tr('ht.agenda.empty')}</Text>
              {links}
            </View>
          )}
        </DaySection>
      </View>
    </Cascade>
  );
}

/** Les deux blocs à la suite (écrans qui n'intercalent rien entre eux). */
export function HomeToday({ DoneComponent, cascadeIndex = 0, art = 'foyer', profile }: { DoneComponent?: React.ComponentType<DoneMarkProps>; cascadeIndex?: number; art?: NextArt; profile?: TodayProfile } = {}) {
  const scene = useTodayScene({ DoneComponent, profile });
  return (
    <View style={{ gap: spacing.md }}>
      <TodayNext scene={scene} art={art} cascadeIndex={cascadeIndex} />
      <TodayAgenda scene={scene} cascadeIndex={cascadeIndex + 2} />
    </View>
  );
}

function TimelineRow({ e, state, person, held, busy, onComplete, first, last }: {
  e: TimelineEntry; state: DayState; person: (id: string | null | undefined) => TodayPerson; held: { ids: string[] } | null;
  busy: { id: string; action: 'complete' | 'accept' } | null; onComplete: (x: TodayTask) => void; first: boolean; last: boolean;
}) {
  if (e.kind === 'task') {
    const x = e.task;
    return <TodayAgendaRow x={x} owner={person(x.ownerId)} creator={x.creatorId ? person(x.creatorId) : null} celebrate={!!held?.ids.includes(x.id)} busy={!!busy} onComplete={onComplete} state={state} first={first} last={last} />;
  }
  return <AgendaItemRow e={e} state={state} person={person} first={first} last={last} />;
}

/** « Ouvrir l'agenda » : ancre de la visite guidée (étape « Ouvrir l'agenda »). */
function AgendaLink() {
  const anchor = useTourAnchor('agenda-link');
  return <View {...anchor} style={{ alignSelf: 'flex-start' }}><FooterLink icon="calendar" label={tr('ht.openAgenda')} onPress={() => router.push('/calendar')} testID="home-today-open-agenda" /></View>;
}

function FooterLink({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID?: string }) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} testID={testID} pressScale={0.99}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: MIN_TOUCH, alignSelf: 'flex-start' }}>
      <Icon name={icon} size={16} color={t.colors.primary} />
      <Text variant="small" weight="bold" color={t.colors.primary}>{label}</Text>
    </Tappable>
  );
}

/** Rendez-vous / événement, relais (nuit, temps pour soi) ou garde alternée : une ligne de chronologie, détail au toucher. */
function AgendaItemRow({ e, state, person, first, last }: { e: Other; state: DayState; person: (id: string | null | undefined) => TodayPerson; first: boolean; last: boolean }) {
  const t = useTheme();
  const { data: children } = useChildren();
  const it = describe(e, children ?? [], person);
  const pill = state === 'now' || state === 'next' ? tr(`d5.state.${state}` as never) : null;
  return (
    <CardSource sourceKey={`today:${e.key}`} onOpen={() => router.push(it.href as never)} testID={`home-today-agenda-${e.key}`}
      accessibilityLabel={[it.when, it.title, pill, it.who ? tr('ht.by', { name: it.who.name }) : null, it.sub ?? it.kindLabel].filter(Boolean).join('. ')}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, minHeight: MIN_TOUCH + 8, paddingVertical: spacing.sm, paddingLeft: spacing.md, paddingRight: spacing.sm }}>
      <DayRail time={it.when} timeSub={it.until} state={state} first={first} last={last} />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text weight={pill ? 'bold' : 'medium'} numberOfLines={2} color={state === 'past' ? t.colors.textMuted : t.colors.text}>{it.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {pill ? <StatusPill label={pill} tone="accent" /> : null}
          {it.who ? <UserAvatar path={it.who.avatarPath} initial={it.who.initial} size={20} /> : null}
          <Text variant="small" muted numberOfLines={1} style={{ flexShrink: 1 }}>{[it.who?.name, it.sub ?? it.kindLabel].filter(Boolean).join(' · ')}</Text>
        </View>
      </View>
      <View style={{ paddingTop: 2 }}><Icon name="chevron-right" size={18} color={t.colors.textMuted} /></View>
    </CardSource>
  );
}

function describe(e: Other, children: { id: string; first_name: string }[], person: (id: string | null | undefined) => TodayPerson) {
  if (e.kind === 'custody') {
    const c: CustodyToday = e.custody;
    const child = children.find((x) => x.id === c.childId)?.first_name;
    const title = c.handover ? tr('ht.custody.handover', { from: c.from ?? '', to: c.where }) : tr('ht.custody.at', { where: c.where });
    return { when: c.time ?? tr('d5.anytime'), until: null as string | null, title, sub: [child, c.place].filter(Boolean).join(' · ') || undefined, who: undefined, kindLabel: tr('d5.kind.custody'), href: '/family/custody' };
  }
  if (e.kind === 'event') {
    const i: CalendarItem = e.item;
    const child = i.source === 'activity' ? children.find((x) => x.id === i.childId)?.first_name : undefined;
    return { when: i.allDay ? tr('d5.anytime') : formatTime(i.starts), until: i.allDay || i.ends === i.starts ? null : formatTime(i.ends), title: i.title, sub: [child, i.location].filter(Boolean).join(' · ') || undefined, who: undefined,
      kindLabel: i.source === 'appointment' ? tr('ht.kind.appointment') : i.source === 'activity' ? tr('p2.act.kind') : tr('ht.kind.event'),
      href: i.source === 'appointment' ? '/appointments' : i.source === 'activity' ? `/child/${i.childId}/activities?a=${i.refId}` : '/calendar' };
  }
  const s: CareShift = e.shift;
  return { when: formatTime(s.starts_at), until: formatTime(s.ends_at), title: s.kind === 'night' ? tr('ht.shift.night') : tr('ht.shift.me'),
    sub: undefined, who: person(s.user_id), kindLabel: undefined, href: s.kind === 'night' ? '/family/nights' : '/family/me-time' };
}

/** Le prochain événement, prêt pour la carte du haut. */
function describeNext(e: Other, children: { id: string; first_name: string }[], person: (id: string | null | undefined) => TodayPerson, now: number): NextUpInfo {
  const it = describe(e, children, person);
  const kicker = e.kind === 'event' ? (e.item.source === 'appointment' ? tr('d5.next.appointment') : tr('d5.next.event'))
    : e.kind === 'shift' ? (e.shift.kind === 'night' ? tr('ht.shift.night') : tr('ht.shift.me')) : tr('d5.kind.custody');
  const startIso = e.kind === 'event' ? (e.item.allDay ? null : e.item.starts) : e.kind === 'shift' ? e.shift.starts_at : null;
  const soon = startIso && Date.parse(startIso) > now ? countdown(startIso, new Date(now)) : startIso ? tr('d5.state.now') : null;
  const title = e.kind === 'shift' ? [it.who?.name, it.title].filter(Boolean).join(' · ') : it.title;
  return {
    kicker, time: it.when, timeSub: [it.until ? `→ ${it.until}` : null, soon].filter(Boolean).join(' · ') || null, title,
    sub: e.kind === 'shift' ? null : it.sub ?? null, onPress: () => router.push(it.href as never),
  };
}
