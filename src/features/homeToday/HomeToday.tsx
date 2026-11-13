/**
 * Accueil — scène « Aujourd'hui » (recomposée le 16/11/2026, critique de la propriétaire : composition dense, ajouts en
 * double, gros boutons dans chaque carte, badges empilés).
 *
 *  1. Point focal UNIQUE : la prochaine action utile (`TodayFocus`, verre optique / halo) — le seul bouton plein ;
 *     à défaut, le prochain rendez-vous (sans bouton), ou un état « rien qui presse ».
 *  2. Agenda lisible (`MatteSurface`) : une ligne par élément, dans l'ordre de la journée (tâches et missions,
 *     rendez-vous, relais, garde) — heure, responsable (avatar + prénom), statut (icône + libellé). Case à cocher
 *     discrète pour terminer quand c'est permis ; toucher une ligne ouvre son détail (transition carte → détail).
 *     Après une validation, la ligne garde sa place le temps de voir la coche, puis la liste se RÉORGANISE en douceur
 *     (`useListLayout` : transition de mise en page Reanimated ; Réduire les animations : sans mouvement).
 *  3. UNE seule entrée d'ajout : le bouton « + » de la barre d'onglets (Dock). Décision : le « + » est déjà présent sur
 *     tous les onglets, à portée de pouce ; l'ancien bouton « Ajouter » de la section faisait doublon. Sur l'accueil,
 *     ce « + » ouvre la feuille « Ajouter pour aujourd'hui » (tâche, mission, puis les autres ajouts rapides) via
 *     `useDockAction('index')` — sauf sur l'accueil d'un enfant, où le « + » reste celui du cocon (`dockAdd={false}`).
 *
 * Confirmation : seulement après la réponse RÉELLE du serveur (fait maintenant / déjà fait / conflit → erreur).
 * Style : jetons du thème, composants partagés, `src/features/scene` (points d'injection du design system).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { Divider, haptic, Icon, Text, type IconName } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { UserAvatar } from '@/components/UserAvatar';
import { ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { useDockAction } from '@/components/dockAction';
import { Cascade, useMotion } from '@/motion';
import { CardSource, MatteSurface, useListLayout } from '@/features/scene';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useChildren } from '@/lib/data/hooks';
import type { CalendarItem } from '@/lib/domain/calendar';
import type { CareShift } from '@/lib/domain/familyLoad';
import { formatTime, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { getTodayDoneComponent, type DoneMarkProps } from './DoneMark';
import { TodayAddSheet } from './TodayAddSheet';
import { TodayAgendaRow, TodayFocus } from './TodayTaskRow';
import { isEmptyToday, todayCounts, todayTimeline, type CustodyToday, type TimelineEntry, type TodayTask } from './todayModel';
import { useCompleteToday, useHomeToday, type TodayPerson } from './useHomeToday';

/** Lignes d'agenda affichées sur l'accueil (le reste : « Voir toute l'organisation »). */
const MAX_ROWS = 7;
/** Le temps de voir la validation avant que la ligne rejoigne « fait » (ms). */
const HOLD_MS = 1100;

export function HomeToday({ DoneComponent, cascadeIndex = 0, dockAdd = true }: { DoneComponent?: React.ComponentType<DoneMarkProps>; cascadeIndex?: number; dockAdd?: boolean } = {}) {
  const t = useTheme();
  const m = useMotion();
  const toast = useToast();
  const d = useHomeToday();
  const layout = useListLayout();
  const { complete, accept } = useCompleteToday();
  const Done = DoneComponent ?? getTodayDoneComponent();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<{ id: string; action: 'complete' | 'accept' } | null>(null);
  // Validation optimiste : la ligne passe « fait » tout de suite (animation), garde sa place un instant, puis la liste se réorganise
  const [held, setHeld] = useState<{ ids: string[]; order: string[]; focus: string | null } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Seule entrée d'ajout de l'écran : le « + » de la barre d'onglets ouvre la feuille d'ajout de l'accueil
  useDockAction('index', dockAdd ? { icon: 'plus', label: tr('ht.addA11y'), hint: tr('ht.addHint'), testID: 'home-today-add', onPress: () => setAdding(true) } : null);

  const focusId = held ? held.focus : d.emphasis;
  const focus = d.model.tasks.find((x) => x.id === focusId) ?? null;
  const timeline = useMemo(() => {
    const now = new Date();
    const list = todayTimeline(d.model, { exclude: focusId, now });
    if (!held) return list;
    const pos = new Map(held.order.map((k, i) => [k, i]));
    return [...list].sort((a, b) => (pos.get(a.key) ?? 1e6) - (pos.get(b.key) ?? 1e6));
  }, [d.model, focusId, held]);
  const counts = todayCounts(d.model.tasks);

  async function onComplete(x: TodayTask) {
    if (busy) return;
    setBusy({ id: x.id, action: 'complete' });
    if (timer.current) clearTimeout(timer.current);
    setHeld((h) => ({ ids: [...(h?.ids ?? []), x.id], order: h?.order ?? timeline.map((e) => e.key), focus: h ? h.focus : focusId }));
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
  const shown = timeline.slice(0, MAX_ROWS);
  const more = timeline.length - shown.length;
  const summary = d.loading ? '' : counts.todo || counts.done
    ? [counts.awaiting ? tr('ht.count.awaiting', { count: counts.awaiting }) : null, tr('ht.count.todo', { count: counts.todo }), counts.done ? tr('ht.count.done', { count: counts.done }) : null].filter(Boolean).join(' · ')
    : tr('ht.count.none');

  return (
    <View testID="home-today" style={{ gap: spacing.sm }}>
      <Cascade index={cascadeIndex} style={{ gap: 2 }}>
        <Text variant="heading" accessibilityRole="header">{tr('ht.title')}</Text>
        {summary ? <Text variant="small" muted testID="home-today-summary" accessibilityLiveRegion="polite">{summary}</Text> : null}
      </Cascade>

      {d.loading ? <Skeleton kind="card" rows={2} />
        : d.error ? <ErrorView error={d.error} onRetry={d.retry} />
          : empty ? (
            <Cascade index={cascadeIndex + 1}>
              <MatteSurface testID="home-today-empty" style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                  <Icon name="sun" size={22} color={t.colors.primary} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text weight="bold">{tr('ht.empty.title')}</Text>
                    <Text variant="small" muted>{dockAdd ? tr('ht.empty.body') : tr('ht.empty.bodyNoAdd')}</Text>
                  </View>
                </View>
              </MatteSurface>
            </Cascade>
          ) : (
            <>
              {/* 1. Point focal : la prochaine action utile */}
              <Cascade index={cascadeIndex + 1}>
                {focus ? (
                  <TodayFocus x={focus} owner={d.person(focus.ownerId)} creator={focus.creatorId ? d.person(focus.creatorId) : null}
                    celebrate={!!held?.ids.includes(focus.id)} busy={busy?.id === focus.id ? busy.action : null}
                    onComplete={onComplete} onAccept={onAccept} DoneComponent={Done} />
                ) : (
                  <View testID="today-clear" accessibilityRole="text" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <Icon name="check-circle" size={18} color={t.colors.success} />
                    <Text variant="small" muted style={{ flex: 1 }}>{tr('ht.focus.clear')}</Text>
                  </View>
                )}
              </Cascade>
              {/* 2. Agenda du jour, surface mate, une ligne par élément */}
              {shown.length ? (
                <Cascade index={cascadeIndex + 2}>
                  <MatteSurface testID="home-today-tasks" padded={spacing.sm} style={{ gap: 0 }}>
                    <Text variant="caption" weight="bold" muted accessibilityRole="header" style={{ paddingHorizontal: spacing.xs, paddingBottom: 2 }}>{tr('ht.agenda')}</Text>
                    {shown.map((e, i) => (
                      <Animated.View key={e.key} layout={layout}>
                        {i ? <Divider /> : null}
                        <TimelineRow e={e} person={d.person} held={held} busy={busy} onComplete={onComplete} />
                      </Animated.View>
                    ))}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, paddingHorizontal: spacing.xs }}>
                      {more > 0 ? <FooterLink icon="list" label={tr('ht.more', { count: more })} onPress={() => router.push('/family')} testID="home-today-more" /> : null}
                      <FooterLink icon="calendar" label={tr('ht.openAgenda')} onPress={() => router.push('/calendar')} testID="home-today-open-agenda" />
                    </View>
                  </MatteSurface>
                </Cascade>
              ) : null}
            </>
          )}
      <TodayAddSheet visible={adding} onClose={() => setAdding(false)} me={d.me} canEdit={d.canEdit} />
    </View>
  );
}

function TimelineRow({ e, person, held, busy, onComplete }: {
  e: TimelineEntry; person: (id: string | null | undefined) => TodayPerson; held: { ids: string[] } | null;
  busy: { id: string; action: 'complete' | 'accept' } | null; onComplete: (x: TodayTask) => void;
}) {
  if (e.kind === 'task') {
    const x = e.task;
    return <TodayAgendaRow x={x} owner={person(x.ownerId)} creator={x.creatorId ? person(x.creatorId) : null} celebrate={!!held?.ids.includes(x.id)} busy={!!busy} onComplete={onComplete} />;
  }
  return <AgendaItemRow e={e} person={person} />;
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

const SOURCE_ICON: Partial<Record<CalendarItem['source'], IconName>> = { event: 'star', appointment: 'calendar' };

/** Rendez-vous / événement, relais (nuit, temps pour soi) ou garde alternée : une ligne d'agenda, détail au toucher. */
function AgendaItemRow({ e, person }: { e: Exclude<TimelineEntry, { kind: 'task' }>; person: (id: string | null | undefined) => TodayPerson }) {
  const t = useTheme();
  const { data: children } = useChildren();
  const it = describe(e, children ?? [], person);
  return (
    <CardSource sourceKey={`today:${e.key}`} onOpen={() => router.push(it.href as never)} testID={`home-today-agenda-${e.key}`}
      accessibilityLabel={[it.when, it.title, it.who ? tr('ht.by', { name: it.who.name }) : null, it.sub].filter(Boolean).join('. ')}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, minHeight: MIN_TOUCH + 8, paddingVertical: spacing.xs }}>
      <View style={{ width: 56, paddingTop: 1 }}>
        <Text variant="small" weight="bold" numberOfLines={2}>{it.when}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text weight="bold" numberOfLines={2}>{it.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {it.who ? <UserAvatar path={it.who.avatarPath} initial={it.who.initial} size={22} /> : <Icon name={it.icon} size={14} color={t.colors.primary} />}
          <Text variant="small" muted numberOfLines={1} style={{ flexShrink: 1 }}>{[it.who?.name, it.sub ?? it.kindLabel].filter(Boolean).join(' · ')}</Text>
        </View>
      </View>
      <View style={{ width: MIN_TOUCH, alignItems: 'center', paddingTop: 4 }}><Icon name="chevron-right" size={18} color={t.colors.textMuted} /></View>
    </CardSource>
  );
}

function describe(e: Exclude<TimelineEntry, { kind: 'task' }>, children: { id: string; first_name: string }[], person: (id: string | null | undefined) => TodayPerson) {
  if (e.kind === 'custody') {
    const c: CustodyToday = e.custody;
    const child = children.find((x) => x.id === c.childId)?.first_name;
    const title = c.handover ? tr('ht.custody.handover', { from: c.from ?? '', to: c.where }) : tr('ht.custody.at', { where: c.where });
    return { icon: 'home' as IconName, when: c.time ?? tr('ht.allDay'), title, sub: [child, c.place].filter(Boolean).join(' · ') || undefined, who: undefined, kindLabel: undefined, href: '/family/custody' };
  }
  if (e.kind === 'event') {
    const i = e.item;
    return { icon: SOURCE_ICON[i.source] ?? 'calendar', when: i.allDay ? tr('ht.allDay') : formatTime(i.starts), title: i.title, sub: i.location ?? undefined, who: undefined,
      kindLabel: i.source === 'appointment' ? tr('ht.kind.appointment') : tr('ht.kind.event'), href: i.source === 'appointment' ? '/appointments' : '/calendar' };
  }
  const s: CareShift = e.shift;
  return { icon: (s.kind === 'night' ? 'moon' : 'sun') as IconName, when: `${formatTime(s.starts_at)} – ${formatTime(s.ends_at)}`, title: s.kind === 'night' ? tr('ht.shift.night') : tr('ht.shift.me'),
    sub: undefined, who: person(s.user_id), kindLabel: undefined, href: s.kind === 'night' ? '/family/nights' : '/family/me-time' };
}
