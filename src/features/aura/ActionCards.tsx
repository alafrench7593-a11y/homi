/**
 * Cartes d'action d'Aura : des PROPOSITIONS. Rien n'est écrit sans la personne :
 *  - « Ouvrir … » : simple navigation, au choix de la personne (l'outil est retrouvé dans SON catalogue, par
 *    identifiant ; une route envoyée par le serveur n'est jamais suivie telle quelle) ;
 *  - « Ajouter au calendrier » / « Créer une mission » : feuille de confirmation où tout se relit et se modifie,
 *    puis écriture seulement à l'appui sur le bouton de confirmation ;
 *  - plan : chaque étape peut devenir une mission, une par une, avec la même confirmation ;
 *  - « Choisir des pages à partager » : ouvre le sélecteur (consentement explicite).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Sheet, useToast } from '@/components/Overlays';
import { Button, Field, Icon, Text } from '@/components/ui';
import { openTool } from '@/components/ToolCard';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useSaveEvent } from '@/lib/data/hooks-family-load';
import { useCreateMission } from '@/lib/data/hooks-missions';
import { findEntry, type CatalogTool } from '@/lib/domain/toolCatalog';
import { uuid } from '@/lib/uuid';
import { formatDate, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { eventInputFrom, missionInputFrom, type AuraAction } from './model';

type EventAction = Extract<AuraAction, { type: 'calendar_event' }>;
type MissionAction = Extract<AuraAction, { type: 'mission' }>;

function CardShell({ children, testID }: { children: React.ReactNode; testID?: string }) {
  const t = useTheme();
  return (
    <View testID={testID} style={{ backgroundColor: t.colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, padding: spacing.md, gap: spacing.xs }}>
      {children}
      <Text variant="caption" muted>{tr('aura.act.proposal')}</Text>
    </View>
  );
}

const whenLabel = (date: string, time: string | null) => `${formatDate(`${date}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })}${time ? ` · ${time}` : ''}`;

export function ActionCards({ actions, catalog, onChooseJournal }: { actions: AuraAction[]; catalog: CatalogTool[]; onChooseJournal: (j: 'mood' | 'diary') => void }) {
  const [event, setEvent] = useState<EventAction | null>(null);
  const [mission, setMission] = useState<MissionAction | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  if (!actions.length) return null;
  return (
    <View style={{ gap: spacing.sm }} testID="aura-actions">
      {actions.map((a, i) => {
        const key = `${a.type}-${i}`;
        if (a.type === 'open_tool') {
          const tool = findEntry(catalog, a.id);
          if (!tool) return null;
          return (
            <CardShell key={key} testID="aura-action-open">
              {a.reason ? <Text variant="small" muted>{a.reason}</Text> : null}
              <Button label={tr('aura.act.open', { name: tool.label })} icon="arrow-right" variant="secondary" full onPress={() => openTool(tool)} testID={`aura-open-${tool.id}`} />
            </CardShell>
          );
        }
        if (a.type === 'calendar_event') {
          return (
            <CardShell key={key} testID="aura-action-event">
              <Text weight="bold">{a.title}</Text>
              <Text variant="small" muted>{tr('aura.act.when', { when: whenLabel(a.date, a.time) })}</Text>
              {done[key] ? <Done label={tr('aura.act.done.event')} /> : (
                <Button label={tr('aura.act.event')} icon="calendar" variant="secondary" full onPress={() => setEvent({ ...a, __key: key } as EventAction)} testID="aura-event-open" />
              )}
            </CardShell>
          );
        }
        if (a.type === 'mission') {
          return (
            <CardShell key={key} testID="aura-action-mission">
              <Text weight="bold">{a.title}</Text>
              {done[key] ? <Done label={tr('aura.act.done.mission')} /> : (
                <Button label={tr('aura.act.mission')} icon="check-square" variant="secondary" full onPress={() => setMission({ ...a, __key: key } as MissionAction)} testID="aura-mission-open" />
              )}
            </CardShell>
          );
        }
        if (a.type === 'plan') {
          return (
            <CardShell key={key} testID="aura-action-plan">
              <Text variant="caption" muted>{tr('aura.act.plan')}</Text>
              <Text weight="bold" accessibilityRole="header">{a.title}</Text>
              {a.steps.map((s, j) => {
                const sk = `${key}-${j}`;
                return (
                  <View key={sk} style={{ gap: 4, paddingTop: spacing.xs }}>
                    <Text variant="small">{`${j + 1}. ${s.title}${s.when ? ` — ${s.when}` : ''}`}</Text>
                    {done[sk] ? <Done label={tr('aura.act.done.mission')} /> : (
                      <Button label={tr('aura.act.mission')} size="sm" variant="ghost" icon="check-square" style={{ alignSelf: 'flex-start' }}
                        onPress={() => setMission({ type: 'mission', title: s.title, category: 'organization', due_date: null, notes: null, __key: sk } as MissionAction)} testID={`aura-plan-step-${j}`} />
                    )}
                  </View>
                );
              })}
            </CardShell>
          );
        }
        return (
          <CardShell key={key} testID="aura-action-journal">
            <Button label={tr('aura.act.journal')} icon="book-open" variant="secondary" full onPress={() => onChooseJournal(a.journal)} testID="aura-journal-open" />
          </CardShell>
        );
      })}
      <EventSheet action={event} onClose={() => setEvent(null)} onDone={(k) => setDone((d) => ({ ...d, [k]: true }))} />
      <MissionSheet action={mission} onClose={() => setMission(null)} onDone={(k) => setDone((d) => ({ ...d, [k]: true }))} />
    </View>
  );
}

function Done({ label }: { label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityLiveRegion="polite">
      <Icon name="check-circle" size={16} color={t.colors.success} />
      <Text variant="small" color={t.colors.success} weight="bold">{label}</Text>
    </View>
  );
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Feuille de confirmation : la personne relit et modifie AVANT toute écriture. */
function EventSheet({ action, onClose, onDone }: { action: EventAction | null; onClose: () => void; onDone: (key: string) => void }) {
  const toast = useToast();
  const save = useSaveEvent();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seen, setSeen] = useState<EventAction | null>(null);
  if (action && action !== seen) { setSeen(action); setTitle(action.title); setDate(action.date); setTime(action.time ?? ''); }
  const valid = !!title.trim() && DATE_RE.test(date) && (!time || TIME_RE.test(time));
  async function confirmSave() {
    if (!action || !valid) return;
    const input = eventInputFrom({ title, date, time: time || null, duration_minutes: action.duration_minutes, notes: action.notes });
    if (!input) return;
    try {
      await save.mutateAsync({ input });
      onDone((action as EventAction & { __key: string }).__key);
      toast(tr('aura.act.done.event'));
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible={!!action} onClose={onClose} title={tr('aura.act.eventSheet')}>
      <View style={{ gap: spacing.sm }} testID="aura-event-sheet">
        <Field label={tr('aura.act.title')} value={title} onChangeText={setTitle} maxLength={80} testID="aura-event-title" />
        <Field label={tr('aura.act.date')} value={date} onChangeText={setDate} maxLength={10} keyboardType="numbers-and-punctuation" testID="aura-event-date" />
        <Field label={tr('aura.act.time')} value={time} onChangeText={setTime} maxLength={5} keyboardType="numbers-and-punctuation" optional testID="aura-event-time" />
        {!valid ? <Text variant="small" color={undefined} muted>{tr('aura.act.badDate')}</Text> : null}
        <Button label={tr('aura.act.confirmEvent')} icon="calendar" full loading={save.isPending} disabled={!valid} onPress={() => void confirmSave()} testID="aura-event-confirm" />
        <Button label={tr('aura.act.cancel')} variant="ghost" full onPress={onClose} testID="aura-event-cancel" />
      </View>
    </Sheet>
  );
}

function MissionSheet({ action, onClose, onDone }: { action: MissionAction | null; onClose: () => void; onDone: (key: string) => void }) {
  const toast = useToast();
  const create = useCreateMission();
  const [title, setTitle] = useState('');
  const [seen, setSeen] = useState<MissionAction | null>(null);
  const [clientId, setClientId] = useState(uuid);
  if (action && action !== seen) { setSeen(action); setTitle(action.title); setClientId(uuid()); }
  async function confirmCreate() {
    if (!action) return;
    const input = missionInputFrom({ ...action, title });
    if (!input) return;
    try {
      await create.mutateAsync({ ...input, client_id: clientId });
      onDone((action as MissionAction & { __key: string }).__key);
      toast(tr('aura.act.done.mission'));
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible={!!action} onClose={onClose} title={tr('aura.act.missionSheet')}>
      <View style={{ gap: spacing.sm }} testID="aura-mission-sheet">
        <Field label={tr('aura.act.title')} value={title} onChangeText={setTitle} maxLength={80} testID="aura-mission-title" />
        <Text variant="caption" muted>{tr('aura.act.missionNote')}</Text>
        <Button label={tr('aura.act.confirmMission')} icon="check-square" full loading={create.isPending} disabled={!title.trim()} onPress={() => void confirmCreate()} testID="aura-mission-confirm" />
        <Button label={tr('aura.act.cancel')} variant="ghost" full onPress={onClose} testID="aura-mission-cancel" />
      </View>
    </Sheet>
  );
}
