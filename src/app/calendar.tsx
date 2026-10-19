/**
 * Agenda familial : événements du foyer, rendez-vous, tâches datées, relais de nuit et temps pour soi.
 * Vues jour, semaine, mois et agenda. Créer, modifier, déplacer, supprimer. Export iCalendar (.ics)
 * importable dans Google Agenda, Apple Calendrier ou Outlook — sans données de santé par défaut.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Linking, Pressable, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/States';
import { StaggerItem, usePop } from '@/components/Motion';
import { Flash, SlideSwap } from '@/components/MotionKit';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, haptic, Icon, IconButton, type IconName, Row, SectionTitle, Segmented, Text, Toggle } from '@/components/ui';
import { parseFrDateTime, splitLocal } from '@/features/familyLoad';
import { useAppointments, useChildren, useHouseholdId } from '@/lib/data/hooks';
import { feedUrl, useCalendarFeeds, useCreateCalendarFeed, useRevokeCalendarFeed, webcalUrl } from '@/lib/data/hooks-calendar';
import { backendUrl, isDemo } from '@/lib/backend';
import { useCareShifts, useDeleteEvent, useFamilyEvents, useFamilyTasks, usePeople, useSaveEvent } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import {
  EVENT_KINDS, SOURCE_LABEL, addDays, addMonths, atLocal, dayKey, itemsBetween, itemsOnDay, monthGrid, overlaps, toIcs, weekStart,
  type CalendarItem, type EventKind, type FamilyEvent,
} from '@/lib/domain/calendar';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { exportTextFile } from '@/lib/exportData';
import { toFrDate } from '@/lib/validation';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type View_ = 'day' | 'week' | 'month' | 'agenda';
const ICON: Record<CalendarItem['source'], IconName> = { event: 'star', appointment: 'calendar', task: 'check-square', night: 'moon', me_time: 'sun' };
const hm = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const longDay = (day: string) => atLocal(day, 12).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase());

type Draft = { id?: string; title: string; kind: EventKind; date: string; from: string; to: string; allDay: boolean; location: string; notes: string; recurrence: 'none' | 'daily' | 'weekly' | 'monthly'; until: string; childId: string | null };

export default function FamilyCalendar() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ view?: View_ }>();
  const [view, setView] = useState<View_>(params.view ?? 'week');
  const [cursor, setCursor] = useState(todayISO());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [withHealth, setWithHealth] = useState(false);
  const eventsQ = useFamilyEvents();
  const { data: appointments } = useAppointments();
  const { data: tasks } = useFamilyTasks();
  const { data: shifts } = useCareShifts();
  const { data: children } = useChildren();
  const { labelOf } = usePeople();
  const save = useSaveEvent();
  const del = useDeleteEvent();

  const range = useMemo(() => {
    if (view === 'day') return [cursor, addDays(cursor, 1)];
    if (view === 'week') { const s = weekStart(cursor); return [s, addDays(s, 7)]; }
    if (view === 'month') { const g = monthGrid(cursor); return [g[0][0], addDays(g[g.length - 1][6], 1)]; }
    return [todayISO(), addDays(todayISO(), 31)];
  }, [view, cursor]);
  const items = useMemo(() => itemsBetween({ events: eventsQ.data ?? [], appointments: appointments ?? [], tasks: tasks ?? [], shifts: shifts ?? [] }, atLocal(range[0]), atLocal(range[1])), [eventsQ.data, appointments, tasks, shifts, range]);
  const clashes = useMemo(() => overlaps(items), [items]);

  const dir = useRef(0);
  const [moved, setMoved] = useState<string | null>(null);
  function move(n: number) {
    haptic('selection');
    dir.current = n;
    setCursor((c) => (view === 'day' ? addDays(c, n) : view === 'week' ? addDays(c, 7 * n) : view === 'month' ? addMonths(c, n) : c));
  }

  function openNew(day = cursor) {
    setDraft({ title: '', kind: 'activity', date: toFrDate(day), from: '10h', to: '11h', allDay: false, location: '', notes: '', recurrence: 'none', until: '', childId: null });
  }
  function openItem(i: CalendarItem) {
    if (i.source === 'appointment') return router.push('/appointments');
    if (i.source === 'task') return router.push('/family');
    if (i.source === 'night') return router.push('/family/nights');
    if (i.source === 'me_time') return router.push('/family/me-time');
    const e = eventsQ.data?.find((x) => x.id === i.refId);
    if (!e) return;
    const a = splitLocal(e.starts_at);
    const b = splitLocal(e.ends_at);
    setDraft({ id: e.id, title: e.title, kind: e.kind, date: a.date, from: a.time, to: b.time, allDay: e.all_day, location: e.location_label ?? '', notes: e.notes ?? '', recurrence: e.recurrence?.type ?? 'none', until: e.recurrence?.until ? toFrDate(e.recurrence.until) : '', childId: e.child_id });
  }

  async function submit() {
    if (!draft) return;
    if (!draft.title.trim()) return toast('Donnez un titre à l’événement.', 'error');
    const starts = parseFrDateTime(draft.date, draft.allDay ? '0h' : draft.from);
    const ends = draft.allDay ? null : parseFrDateTime(draft.date, draft.to);
    if (!starts || ends === undefined) return toast('Date ou heure non reconnue (jj/mm/aaaa, 14h30).', 'error');
    if (ends && ends < starts) return toast('La fin doit être après le début.', 'error');
    const until = draft.until.trim() ? frToISO(draft.until) : null;
    if (draft.until.trim() && !until) return toast('Date de fin de répétition non reconnue.', 'error');
    try {
      await save.mutateAsync({
        id: draft.id,
        input: {
          title: draft.title.trim().slice(0, 120), kind: draft.kind, starts_at: starts, ends_at: ends, all_day: draft.allDay, location_label: draft.location.trim() || null,
          notes: draft.notes.trim() || null, child_id: draft.childId, recurrence: draft.recurrence === 'none' ? null : { type: draft.recurrence, ...(until ? { until } : {}) },
        },
      });
      haptic('success');
      toast(draft.id ? 'Événement modifié.' : 'Événement ajouté.');
      dir.current = 0;
      setCursor(dayKey(new Date(starts)));
      if (draft.id) setMoved(draft.id);
      setDraft(null);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function remove() {
    if (!draft?.id) return;
    if (!(await confirm('Supprimer cet événement ?', draft.recurrence !== 'none' ? 'Toutes ses répétitions seront supprimées.' : draft.title, 'Supprimer'))) return;
    try { await del.mutateAsync(draft.id); toast('Événement supprimé.'); setDraft(null); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function exportIcs() {
    const from = atLocal(addDays(todayISO(), -30));
    const to = atLocal(addDays(todayISO(), 365));
    const all = itemsBetween({ events: eventsQ.data ?? [], appointments: appointments ?? [], tasks: (tasks ?? []).filter((x) => x.status === 'todo'), shifts: shifts ?? [] }, from, to);
    const ics = toIcs(all, { includeHealthTitles: withHealth, events: eventsQ.data ?? [] });
    try {
      const r = await exportTextFile(ics, `agenda-familial-${todayISO()}.ics`, 'text/calendar', 'public.calendar-event', 'Exporter l’agenda');
      toast(r === 'text' ? 'Export impossible sur cet appareil.' : 'Fichier .ics prêt : ouvrez-le avec votre agenda pour l’importer.', r === 'text' ? 'error' : 'success');
      setExportOpen(false);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const title = view === 'day' ? longDay(cursor)
    : view === 'week' ? `Semaine du ${atLocal(weekStart(cursor), 12).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
      : view === 'month' ? atLocal(cursor, 12).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase())
        : 'Les 30 prochains jours';

  const renderItem = (i: CalendarItem, idx: number) => (
    <StaggerItem key={i.key} index={idx}>
      <Flash on={moved === i.refId} color={t.colors.primary}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${SOURCE_LABEL[i.source]} : ${i.title}, ${i.allDay ? 'toute la journée' : hm(i.starts)}`} onPress={() => openItem(i)}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, borderWidth: 1, borderColor: clashes.has(i.key) ? t.colors.gold : t.colors.border })}>
        <Text variant="small" weight="bold" style={{ width: 48 }}>{i.allDay ? 'Jour' : hm(i.starts)}</Text>
        <Icon name={ICON[i.source]} size={16} color={i.source === 'appointment' ? t.colors.heart : i.source === 'event' ? t.colors.primary : t.colors.lavender} />
        <View style={{ flex: 1 }}>
          <Text weight="medium" style={{ textDecorationLine: i.done ? 'line-through' : 'none' }}>{i.title}</Text>
          <Text variant="caption" muted>{[SOURCE_LABEL[i.source], i.private ? 'privé' : null, i.recurring ? 'répété' : null, i.who ? labelOf(i.who) : null, i.location, clashes.has(i.key) ? 'chevauche un autre créneau' : null].filter(Boolean).join(' · ')}</Text>
        </View>
      </Pressable>
      </Flash>
    </StaggerItem>
  );

  return (
    <Screen back account title="Agenda familial" subtitle="Rendez-vous, activités, tâches et relais." right={<IconButton icon="plus" label="Nouvel événement" onPress={() => openNew()} />}>
      <Segmented label="Vue" value={view} onChange={(v) => { dir.current = 0; setView(v); haptic('selection'); }} options={[{ value: 'day', label: 'Jour' }, { value: 'week', label: 'Semaine' }, { value: 'month', label: 'Mois' }, { value: 'agenda', label: 'Agenda' }]} />
      <Row style={{ justifyContent: 'space-between' }}>
        {view !== 'agenda' ? <IconButton icon="chevron-left" label="Période précédente" onPress={() => move(-1)} /> : <View />}
        <Pressable onPress={() => setCursor(todayISO())} accessibilityRole="button" accessibilityLabel={`${title}. Revenir à aujourd’hui`}>
          <Text weight="bold" center>{title}</Text>
          {cursor !== todayISO() && view !== 'agenda' ? <Text variant="caption" color={t.colors.primary} center>Revenir à aujourd’hui</Text> : null}
        </Pressable>
        {view !== 'agenda' ? <IconButton icon="chevron-right" label="Période suivante" onPress={() => move(1)} /> : <View />}
      </Row>

      {eventsQ.isLoading && !eventsQ.data ? <Skeleton rows={3} /> : null}

      <SlideSwap key={`${view}:${range[0]}`} dir={dir.current}>
      {view === 'month' ? (
        <MonthView cursor={cursor} items={items} onPick={(d) => { setCursor(d); setView('day'); }} />
      ) : view === 'day' ? (
        <View style={{ gap: spacing.xs }}>
          {itemsOnDay(items, cursor).map(renderItem)}
          {!itemsOnDay(items, cursor).length ? <Card tone="soft"><Text variant="small" muted>Rien de prévu ce jour-là.</Text></Card> : null}
          <Button label="Ajouter un événement ce jour" icon="plus" variant="secondary" size="sm" style={{ alignSelf: 'flex-start' }} onPress={() => openNew(cursor)} />
        </View>
      ) : (
        Array.from({ length: view === 'week' ? 7 : 31 }, (_, k) => addDays(range[0], k)).map((d) => {
          const list = itemsOnDay(items, d);
          if (view === 'agenda' && !list.length) return null;
          return (
            <View key={d} style={{ gap: spacing.xs }}>
              <Pressable onPress={() => { setCursor(d); setView('day'); }} accessibilityRole="button" accessibilityLabel={`Voir le ${longDay(d)}`}>
                <Text weight="bold" color={d === todayISO() ? t.colors.primary : t.colors.text}>{longDay(d)}{d === todayISO() ? ' · aujourd’hui' : ''}</Text>
              </Pressable>
              {list.map(renderItem)}
              {view === 'week' && !list.length ? <Text variant="caption" muted>—</Text> : null}
            </View>
          );
        })
      )}
      {view === 'agenda' && !items.length ? <Card tone="soft"><Text variant="small" muted>Rien de prévu dans les 30 prochains jours.</Text></Card> : null}
      </SlideSwap>

      <SectionTitle title="Partager avec un autre agenda" />
      <Card>
        <Text variant="small">Exportez un fichier .ics à importer dans Google Agenda, Apple Calendrier ou Outlook. C’est une copie : les modifications ultérieures ne sont pas synchronisées.</Text>
        <Button label="Exporter (.ics)" icon="download" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={() => setExportOpen(true)} />
      </Card>

      <FeedCard />

      <Sheet visible={exportOpen} onClose={() => setExportOpen(false)} title="Exporter l’agenda">
        <View style={{ gap: spacing.sm }}>
          <Text variant="small">Événements du foyer, tâches à faire, relais et temps pour soi, du mois dernier à l’an prochain.</Text>
          <Banner tone="info" icon="lock">{'Les rendez-vous privés ne sont jamais exportés. Les autres rendez-vous médicaux apparaissent comme « Rendez-vous », sans titre ni lieu.'}</Banner>
          <Row style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text weight="medium">Inclure les titres des rendez-vous médicaux</Text>
              <Text variant="caption" muted>Ils seraient alors visibles dans l’agenda externe et par les personnes qui y ont accès.</Text>
            </View>
            <Toggle label="Inclure les titres des rendez-vous médicaux" value={withHealth} onChange={setWithHealth} />
          </Row>
          <Button label="Créer le fichier" icon="download" full onPress={exportIcs} />
        </View>
      </Sheet>

      <Sheet visible={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Modifier l’événement' : 'Nouvel événement'}>
        {draft ? (
          <View style={{ gap: spacing.sm }}>
            <Field label="Titre" value={draft.title} onChangeText={(v) => setDraft({ ...draft, title: v })} maxLength={120} placeholder="Bébés nageurs" />
            <Text variant="label">Type</Text>
            <Row wrap>{EVENT_KINDS.map((k) => <Chip key={k.value} label={k.label} selected={draft.kind === k.value} onPress={() => setDraft({ ...draft, kind: k.value })} />)}</Row>
            <Field label="Date" value={draft.date} onChangeText={(v) => setDraft({ ...draft, date: v })} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" />
            <Row style={{ alignItems: 'center' }}>
              <Text weight="medium" style={{ flex: 1 }}>Toute la journée</Text>
              <Toggle label="Toute la journée" value={draft.allDay} onChange={(v) => setDraft({ ...draft, allDay: v })} />
            </Row>
            {!draft.allDay ? (
              <Row>
                <View style={{ flex: 1 }}><Field label="De" value={draft.from} onChangeText={(v) => setDraft({ ...draft, from: v })} placeholder="10h" /></View>
                <View style={{ flex: 1 }}><Field label="À" value={draft.to} onChangeText={(v) => setDraft({ ...draft, to: v })} placeholder="11h" /></View>
              </Row>
            ) : null}
            <Text variant="label">Répéter</Text>
            <Segmented label="Répéter" value={draft.recurrence} onChange={(v) => setDraft({ ...draft, recurrence: v })} options={[{ value: 'none', label: 'Non' }, { value: 'daily', label: 'Chaque jour' }, { value: 'weekly', label: 'Chaque semaine' }, { value: 'monthly', label: 'Chaque mois' }]} />
            {draft.recurrence !== 'none' ? <Field label="Jusqu’au" optional value={draft.until} onChangeText={(v) => setDraft({ ...draft, until: v })} placeholder="JJ/MM/AAAA" /> : null}
            {children?.length ? (
              <>
                <Text variant="label">Pour</Text>
                <Row wrap>
                  <Chip label="Toute la famille" selected={!draft.childId} onPress={() => setDraft({ ...draft, childId: null })} />
                  {children.map((c) => <Chip key={c.id} label={c.first_name} selected={draft.childId === c.id} onPress={() => setDraft({ ...draft, childId: c.id })} />)}
                </Row>
              </>
            ) : null}
            <Field label="Lieu" optional value={draft.location} onChangeText={(v) => setDraft({ ...draft, location: v })} maxLength={160} />
            <Field label="Notes" optional multiline value={draft.notes} onChangeText={(v) => setDraft({ ...draft, notes: v })} maxLength={2000} />
            <Button label={draft.id ? 'Enregistrer' : 'Ajouter'} full onPress={submit} loading={save.isPending} />
            {draft.id ? <Button label="Supprimer" variant="ghost" onPress={remove} /> : null}
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function MonthView({ cursor, items, onPick }: { cursor: string; items: CalendarItem[]; onPick: (d: string) => void }) {
  const t = useTheme();
  const month = cursor.slice(0, 7);
  const today = todayISO();
  return (
    <Card padded={false} style={{ padding: spacing.xs }}>
      <Row gap={0}>{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <Text key={i} variant="caption" muted center style={{ flex: 1 }}>{d}</Text>)}</Row>
      {monthGrid(cursor).map((w) => (
        <Row key={w[0]} gap={0}>
          {w.map((d) => <DayCell key={d} day={d} out={d.slice(0, 7) !== month} today={d === today} count={itemsOnDay(items, d).length} onPress={() => onPick(d)} accent={t.colors.primary} />)}
        </Row>
      ))}
    </Card>
  );
}

function DayCell({ day, out, today, count, onPress, accent }: { day: string; out: boolean; today: boolean; count: number; onPress: () => void; accent: string }) {
  const t = useTheme();
  const pop = usePop(today);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${atLocal(day, 12).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}, ${count ? `${count} élément${count > 1 ? 's' : ''}` : 'rien de prévu'}`} onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingVertical: 6, minHeight: 48 }}>
      <Animated.View style={[{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: today ? accent : 'transparent' }, pop]}>
        <Text variant="small" weight={today ? 'bold' : undefined} color={today ? t.colors.primaryText : out ? t.colors.textMuted : t.colors.text} style={{ opacity: out ? 0.5 : 1 }}>{Number(day.slice(8))}</Text>
      </Animated.View>
      <View style={{ flexDirection: 'row', gap: 2, height: 6, marginTop: 2 }}>
        {Array.from({ length: Math.min(count, 3) }, (_, i) => <View key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: accent, opacity: out ? 0.4 : 1 }} />)}
      </View>
    </Pressable>
  );
}

// ------------------------------------------------------------------ abonnement (synchronisation à sens unique)
/**
 * Lien secret que Google Agenda, Apple Calendrier ou Outlook interrogent régulièrement.
 * Le lien n'est montré qu'une fois ; il se révoque ici. Rien ne part en démonstration.
 */
function FeedCard() {
  const t = useTheme();
  const toast = useToast();
  const householdId = useHouseholdId();
  const available = !isDemo && !!backendUrl && !!householdId;
  const feedsQ = useCalendarFeeds(available);
  const create = useCreateCalendarFeed();
  const revoke = useRevokeCalendarFeed();
  const [open, setOpen] = useState(false);
  const [health, setHealth] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  async function make() {
    if (!householdId) return;
    try {
      const r = await create.mutateAsync({ householdId, includeHealthTitles: health });
      setCreated(feedUrl(r.token));
      haptic('success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function remove(id: string) {
    if (!(await confirm('Révoquer ce lien ?', 'Les agendas abonnés ne recevront plus aucune mise à jour. Les événements déjà copiés peuvent y rester jusqu’à ce que vous supprimiez l’abonnement.', 'Révoquer'))) return;
    try { await revoke.mutateAsync(id); toast('Lien révoqué.'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const close = () => { setOpen(false); setCreated(null); setHealth(false); };
  const when = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <Card>
      <Row style={{ alignItems: 'center' }}>
        <Icon name="refresh-cw" size={18} color={t.colors.primary} />
        <Text weight="bold" style={{ flex: 1 }}>S’abonner depuis un autre agenda</Text>
      </Row>
      <Text variant="small" style={{ marginTop: 4 }}>Un lien secret que Google Agenda, Apple Calendrier ou Outlook consultent régulièrement : vos changements y apparaissent sans nouvel export. Synchronisation à sens unique (les modifications faites là-bas ne reviennent pas ici).</Text>
      {!available ? (
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{isDemo ? 'Disponible avec un compte : en démonstration, rien ne quitte cet appareil.' : 'Disponible une fois le foyer créé et le serveur configuré.'}</Text>
      ) : (
        <>
          {(feedsQ.data ?? []).map((f) => (
            <Row key={f.id} style={{ alignItems: 'center', marginTop: spacing.xs }}>
              <View style={{ flex: 1 }}>
                <Text variant="small" weight="medium">{f.label}{f.include_health_titles ? ' · titres de santé visibles' : ''}</Text>
                <Text variant="caption" muted>{`Créé le ${when(f.created_at)} · ${f.last_accessed_at ? `dernière lecture le ${when(f.last_accessed_at)}` : 'pas encore consulté'}`}</Text>
              </View>
              <Button label="Révoquer" size="sm" variant="ghost" onPress={() => void remove(f.id)} />
            </Row>
          ))}
          <Button label="Créer un lien d’abonnement" icon="link" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={() => setOpen(true)} />
        </>
      )}

      <Sheet visible={open} onClose={close} title="Lien d’abonnement">
        {created ? (
          <View style={{ gap: spacing.sm }}>
            <Banner tone="warning" icon="lock">{'Ce lien n’est affiché qu’une fois. Toute personne qui le possède voit ces événements : ne le publiez pas. Vous pourrez le révoquer à tout moment.'}</Banner>
            <Text selectable variant="caption" style={{ padding: spacing.sm, borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt }} accessibilityLabel="Adresse du lien d’abonnement">{created}</Text>
            <Button label="Ouvrir dans mon agenda" icon="calendar" full onPress={() => void Linking.openURL(webcalUrl(created)).catch(() => toast('Aucun agenda n’a pu ouvrir ce lien : copiez l’adresse.', 'error'))} />
            <Button label="Partager ou copier le lien" icon="share-2" variant="secondary" full onPress={() => void Share.share({ message: created }).catch(() => undefined)} />
            <Text variant="caption" muted>Google Agenda : « Autres agendas » › « À partir de l’URL ». Les agendas actualisent un abonnement à leur propre rythme (de quelques minutes à plusieurs heures selon le service).</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <Text variant="small">Événements du foyer, tâches à faire, relais de nuit et votre temps pour soi, du mois dernier à l’an prochain — selon vos droits dans le foyer.</Text>
            <Banner tone="info" icon="lock">{'Les rendez-vous privés d’autres personnes n’y figurent jamais. Les rendez-vous médicaux apparaissent comme « Rendez-vous », sans titre ni lieu, sauf si vous choisissez de les afficher.'}</Banner>
            <Row style={{ alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text weight="medium">Afficher les titres des rendez-vous médicaux</Text>
                <Text variant="caption" muted>Ils seraient visibles dans l’agenda externe et par les personnes qui y ont accès.</Text>
              </View>
              <Toggle label="Afficher les titres des rendez-vous médicaux" value={health} onChange={setHealth} />
            </Row>
            <Button label="Créer le lien" icon="link" full loading={create.isPending} onPress={make} />
          </View>
        )}
      </Sheet>
    </Card>
  );
}
