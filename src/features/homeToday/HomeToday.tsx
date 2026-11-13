/**
 * « Aujourd'hui dans le foyer » : en tête de l'Accueil, ce qui est prévu aujourd'hui, qui s'en charge, et comment
 * ajouter ou terminer une tâche. Données réelles uniquement (tâches et missions, agenda du foyer, rendez-vous,
 * relais, garde alternée) ; état vide explicite si rien n'est prévu.
 *
 * Mouvement : apparition en cascade (src/motion), validation animée (DoneMark, remplaçable : setTodayDoneComponent).
 * Style : jetons du thème et composants partagés seulement (Card, Button, Text…), pour suivre la refonte du design system.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Divider, haptic, Icon, Text, type IconName } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { UserAvatar } from '@/components/UserAvatar';
import { ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Cascade, useMotion } from '@/motion';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useChildren } from '@/lib/data/hooks';
import type { CalendarItem } from '@/lib/domain/calendar';
import type { CareShift } from '@/lib/domain/familyLoad';
import { formatTime, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { getTodayDoneComponent, type DoneMarkProps } from './DoneMark';
import { TodayAddSheet } from './TodayAddSheet';
import { TodayTaskRow } from './TodayTaskRow';
import { isEmptyToday, todayCounts, type CustodyToday, type TodayTask } from './todayModel';
import { useCompleteToday, useHomeToday, type TodayPerson } from './useHomeToday';

/** Nombre de lignes de tâches affichées sur l'accueil (le reste : « Voir toute l'organisation »). */
const MAX_ROWS = 5;
/** Le temps de voir la validation avant que la ligne rejoigne « fait » (ms). */
const HOLD_MS = 1100;

export function HomeToday({ DoneComponent, cascadeIndex = 0 }: { DoneComponent?: React.ComponentType<DoneMarkProps>; cascadeIndex?: number } = {}) {
  const t = useTheme();
  const m = useMotion();
  const toast = useToast();
  const d = useHomeToday();
  const { complete, accept } = useCompleteToday();
  const Done = DoneComponent ?? getTodayDoneComponent();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<{ id: string; action: 'complete' | 'accept' } | null>(null);
  // Validation optimiste : la ligne passe « fait » tout de suite (animation), garde sa place un instant, puis rejoint « fait »
  const [held, setHeld] = useState<{ ids: string[]; order: string[]; emphasis: string | null } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const list = useMemo(() => {
    if (!held) return d.model.tasks;
    const pos = new Map(held.order.map((id, i) => [id, i]));
    return [...d.model.tasks].sort((a, b) => (pos.get(a.id) ?? 1e6) - (pos.get(b.id) ?? 1e6));
  }, [d.model.tasks, held]);
  const emphasis = held ? held.emphasis : d.emphasis;
  const counts = todayCounts(d.model.tasks);

  async function onComplete(x: TodayTask) {
    if (busy) return;
    setBusy({ id: x.id, action: 'complete' });
    if (timer.current) clearTimeout(timer.current);
    setHeld((h) => ({ ids: [...(h?.ids ?? []), x.id], order: h?.order ?? list.map((y) => y.id), emphasis: h ? h.emphasis : emphasis }));
    haptic('success');
    try {
      await complete(x);
      toast(x.kind === 'mission' ? tr('mis.toast.complete') : tr('ht.doneToast'));
      timer.current = setTimeout(() => setHeld(null), m.off ? 300 : HOLD_MS);
    } catch (e) {
      setHeld((h) => (h ? { ...h, ids: h.ids.filter((id) => id !== x.id) } : null));
      toast(friendlyError(e), 'error');
    } finally { setBusy(null); }
  }
  async function onAccept(x: TodayTask) {
    if (busy) return;
    setBusy({ id: x.id, action: 'accept' });
    try { await accept(x); haptic('success'); toast(tr('mis.toast.accept')); } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(null); }
  }

  const empty = !d.loading && !d.error && isEmptyToday(d.model);
  const shown = list.slice(0, MAX_ROWS);
  const lead = shown.find((x) => x.id === emphasis) ?? null;
  const rest = shown.filter((x) => x !== lead);
  const more = list.length - shown.length;
  const summary = d.loading ? '' : counts.todo || counts.done
    ? [counts.awaiting ? tr('ht.count.awaiting', { count: counts.awaiting }) : null, tr('ht.count.todo', { count: counts.todo }), counts.done ? tr('ht.count.done', { count: counts.done }) : null].filter(Boolean).join(' · ')
    : tr('ht.count.none');

  const row = (x: TodayTask, isLead: boolean) => (
    <TodayTaskRow key={x.id} x={x} owner={d.person(x.ownerId)} emphasis={isLead} celebrate={!!held?.ids.includes(x.id)}
      busy={busy?.id === x.id ? busy.action : null} onComplete={onComplete} onAccept={onAccept} DoneComponent={Done} />
  );

  return (
    <View testID="home-today" style={{ gap: spacing.sm }}>
      <Cascade index={cascadeIndex} style={{ gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="heading" accessibilityRole="header" style={{ flex: 1, minWidth: 0 }}>{tr('ht.title')}</Text>
          {!empty ? (
            <Button label={tr('ht.addShort')} icon="plus" variant="secondary" onPress={() => setAdding(true)} testID="home-today-add"
              accessibilityLabel={tr('ht.addA11y')} />
          ) : null}
        </View>
        {summary ? <Text variant="small" muted testID="home-today-summary" accessibilityLiveRegion="polite">{summary}</Text> : null}
      </Cascade>

      {d.loading ? <Skeleton kind="card" rows={2} />
        : d.error ? <ErrorView error={d.error} onRetry={d.retry} />
          : empty ? (
            <Cascade index={cascadeIndex + 1}>
              <Card testID="home-today-empty" style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                  <Icon name="sun" size={22} color={t.colors.primary} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text weight="bold">{tr('ht.empty.title')}</Text>
                    <Text variant="small" muted>{tr('ht.empty.body')}</Text>
                  </View>
                </View>
                <Button label={tr('ht.add.cta')} icon="plus" full onPress={() => setAdding(true)} testID="home-today-add" />
              </Card>
            </Cascade>
          ) : (
            <>
              {lead ? <Cascade index={cascadeIndex + 1}>{row(lead, true)}</Cascade> : null}
              {rest.length ? (
                <Cascade index={cascadeIndex + 2}>
                  <Card testID="home-today-tasks" style={{ gap: spacing.sm }}>
                    {rest.map((x, i) => (
                      <React.Fragment key={x.id}>
                        {i ? <Divider /> : null}
                        {row(x, false)}
                      </React.Fragment>
                    ))}
                    {more > 0 ? <FooterLink icon="list" label={tr('ht.more', { count: more })} onPress={() => router.push('/family')} testID="home-today-more" /> : null}
                  </Card>
                </Cascade>
              ) : more > 0 ? <FooterLink icon="list" label={tr('ht.more', { count: more })} onPress={() => router.push('/family')} testID="home-today-more" /> : null}
              {d.model.agenda.length || d.model.shifts.length || d.model.custody.length ? (
                <Cascade index={cascadeIndex + 3}>
                  <AgendaCard agenda={d.model.agenda} shifts={d.model.shifts} custody={d.model.custody} person={d.person} />
                </Cascade>
              ) : null}
            </>
          )}
      <TodayAddSheet visible={adding} onClose={() => setAdding(false)} me={d.me} canEdit={d.canEdit} />
    </View>
  );
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

/** Agenda du jour : rendez-vous et événements à venir, relais (nuit, temps pour soi) et garde alternée. */
function AgendaCard({ agenda, shifts, custody, person }: { agenda: CalendarItem[]; shifts: CareShift[]; custody: CustodyToday[]; person: (id: string | null | undefined) => TodayPerson }) {
  const t = useTheme();
  const { data: children } = useChildren();
  const items: { key: string; icon: IconName; when: string; title: string; sub?: string; who?: TodayPerson; href: string }[] = [
    ...custody.map((c) => {
      const child = children?.find((x) => x.id === c.childId)?.first_name;
      const title = c.handover ? tr('ht.custody.handover', { from: c.from ?? '', to: c.where }) : tr('ht.custody.at', { where: c.where });
      return { key: `custody:${c.planId}`, icon: 'home' as IconName, when: c.time ?? tr('ht.allDay'), title, sub: [child, c.place].filter(Boolean).join(' · ') || undefined, href: '/family/custody' };
    }),
    ...agenda.slice(0, 3).map((i) => ({
      key: i.key, icon: SOURCE_ICON[i.source] ?? 'calendar', when: i.allDay ? tr('ht.allDay') : formatTime(i.starts), title: i.title,
      sub: i.location ?? undefined, href: i.source === 'appointment' ? '/appointments' : '/calendar',
    })),
    ...shifts.map((s) => ({
      key: `${s.kind}:${s.id}`, icon: (s.kind === 'night' ? 'moon' : 'sun') as IconName, when: `${formatTime(s.starts_at)} – ${formatTime(s.ends_at)}`,
      title: s.kind === 'night' ? tr('ht.shift.night') : tr('ht.shift.me'), who: person(s.user_id), href: s.kind === 'night' ? '/family/nights' : '/family/me-time',
    })),
  ];
  return (
    <Card testID="home-today-agenda" style={{ gap: spacing.xs }}>
      <Text variant="caption" weight="bold" muted accessibilityRole="header">{tr('ht.agenda')}</Text>
      {items.map((it, i) => (
        <React.Fragment key={it.key}>
          {i ? <Divider /> : null}
          <Tappable accessibilityRole="button" accessibilityLabel={[it.when, it.title, it.who ? tr('ht.by', { name: it.who.name }) : null, it.sub].filter(Boolean).join('. ')}
            onPress={() => router.push(it.href as never)} pressScale={0.99} testID={`home-today-agenda-${it.key}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH + 4 }}>
            <View style={{ width: 52 }}>
              <Text variant="small" weight="bold" numberOfLines={2}>{it.when}</Text>
            </View>
            <Icon name={it.icon} size={18} color={t.colors.primary} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text weight="bold" numberOfLines={2}>{it.title}</Text>
              {it.who || it.sub ? <Text variant="small" muted numberOfLines={1}>{[it.who?.name, it.sub].filter(Boolean).join(' · ')}</Text> : null}
            </View>
            {it.who ? <UserAvatar path={it.who.avatarPath} initial={it.who.initial} size={28} /> : <Icon name="chevron-right" size={18} color={t.colors.textMuted} />}
          </Tappable>
        </React.Fragment>
      ))}
      <FooterLink icon="calendar" label={tr('ht.openAgenda')} onPress={() => router.push('/calendar')} testID="home-today-open-agenda" />
    </Card>
  );
}
