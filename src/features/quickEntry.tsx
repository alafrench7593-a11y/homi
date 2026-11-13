/**
 * Saisie vocale ou en une phrase (Premium ; quelques essais gratuits chaque mois, comptés côté serveur).
 * La dictée utilise la reconnaissance vocale du navigateur quand elle existe (web) ; sur téléphone, la dictée du clavier.
 * La phrase devient des données structurées ; RIEN n'est enregistré sans confirmation : le formulaire habituel s'ouvre
 * pré-rempli (biberon, rendez-vous, médicament) ou une confirmation explicite est demandée (sommeil).
 */
import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, Card, Field, Row, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { backend, eq } from '@/lib/backend';
import { useAddLog, useInvalidate, useTrackedChildren } from '@/lib/data/hooks';
import { useConsumeQuota, usePremiumAccess, useQuota } from '@/lib/data/hooks-premium';
import { friendlyError } from '@/lib/data/hooks-settings';
import { formatClock } from '@/lib/domain/bottleTimer';
import { formatDate, t as tr } from '@/i18n';
import { parseQuickEntry, type QuickError, type QuickParse, type QuickResult } from '@/lib/domain/quickEntry';

type SpeechCtor = new () => { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void; onend: () => void; start: () => void };
const speech = (): SpeechCtor | null => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const errText = (e: QuickError): string => ({
  child: tr('u6.quick.err_child'),
  kind: tr('u6.quick.err_kind'),
  ml: tr('u6.quick.err_ml'),
  time: tr('u6.quick.err_time'),
  date: tr('u6.quick.err_date'),
}[e]);

const when = (v: QuickResult) => {
  const today = v.at.toDateString() === new Date().toDateString();
  const day = today ? '' : `${formatDate(v.at, { weekday: 'long', day: 'numeric', month: 'long' })}, `;
  return v.timeGiven ? `${day}${formatClock(v.at.toISOString())}` : tr('u6.quick.now_at', { time: formatClock(v.at.toISOString()) });
};

export function describe(v: QuickResult): string {
  switch (v.kind) {
    case 'bottle': return `${tr('u6.quick.bottle')} · ${v.childName}${v.ml != null ? ` · ${v.ml} ml` : ` · ${tr('u6.quick.qty_unsaid')}`} · ${when(v)}`;
    case 'sleep_start': return `${tr('u6.quick.falls_asleep', { name: v.childName ?? '' })} · ${when(v)}`;
    case 'sleep_end': return `${tr('u6.quick.wakes_up', { name: v.childName ?? '' })} · ${when(v)}`;
    case 'diaper': return `${tr('u6.quick.diaper')} · ${v.childName} · ${when(v)}`;
    case 'appointment': return `${tr('u6.quick.appt', { title: v.title ?? '' })}${v.childName ? ` ${tr('u6.quick.for_child', { name: v.childName })}` : ''} · ${when(v)}`;
    case 'medication': return tr('u6.quick.med', { name: v.childName ?? '', time: v.time ?? '' });
  }
}

export function QuickEntry({ activeChildId }: { activeChildId?: string | null }) {
  const toast = useToast();
  const inv = useInvalidate();
  const { data: children } = useTrackedChildren();
  const [text, setText] = useState('');
  const [res, setRes] = useState<QuickParse | null>(null);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const access = usePremiumAccess('voice_entry');
  const quota = useQuota('voice_entries_per_month');
  const consume = useConsumeQuota('voice_entries_per_month');
  const addSleep = useAddLog('sleep');
  const Rec = speech();
  if (!children?.length) return null;
  const analyse = (v = text) => setRes(v.trim() ? parseQuickEntry(v, children, new Date(), activeChildId) : null);

  function dictate() {
    if (!Rec) return;
    const r = new Rec();
    r.lang = 'fr-FR';
    r.interimResults = false;
    r.onresult = (e) => { const said = e.results[0]?.[0]?.transcript ?? ''; setText(said); analyse(said); };
    // Sans micro ou refus : on le dit (audit navigation N-09), au lieu de revenir en silence
    r.onerror = () => { setListening(false); toast(tr('u6.quick.dictateUnavailable'), 'info'); };
    r.onend = () => setListening(false);
    setListening(true);
    r.start();
  }

  /** Une utilisation est comptée seulement quand la personne confirme (jamais pour une phrase non comprise). */
  async function allowed(v: QuickResult): Promise<boolean> {
    if (access.premium) return true;
    const r = await consume();
    if (!r.allowed) {
      access.showPreview(<Text variant="small">{tr('u6.quick.preview', { text: describe(v) })}</Text>, { used: r.used, quota: r.quota, unit: tr('u6.quick.unit') });
      return false;
    }
    return true;
  }

  async function confirm(v: QuickResult) {
    setBusy(true);
    try {
      if (!(await allowed(v))) return;
      const child = children!.find((c) => c.id === v.childId);
      switch (v.kind) {
        case 'bottle':
          router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: v.childId!, at: v.at.toISOString(), ...(v.ml != null ? { ml: String(v.ml) } : {}) } });
          break;
        case 'diaper':
          router.push({ pathname: '/track/[kind]', params: { kind: 'diaper', child: v.childId!, at: v.at.toISOString() } });
          break;
        case 'sleep_start':
          await addSleep.mutateAsync({ child_id: v.childId, household_id: child?.household_id, started_at: v.at.toISOString(), kind: v.at.getHours() >= 19 || v.at.getHours() < 7 ? 'night' : 'nap' });
          toast(tr('u6.quick.saved', { text: describe(v) }), 'success');
          break;
        case 'sleep_end': {
          const open = await backend.select<{ id: string; started_at: string }>({ table: 'sleeps', filters: [eq('child_id', v.childId!), { col: 'ended_at', op: 'is', value: null }] });
          if (!open[0]) { toast(tr('u6.quick.no_sleep', { name: v.childName ?? '' }), 'info'); return; }
          if (v.at.toISOString() < open[0].started_at) { toast(tr('u6.quick.wake_before', {}), 'error'); return; }
          await backend.update('sleeps', { ended_at: v.at.toISOString() }, [eq('id', open[0].id)]);
          inv('sleeps');
          toast(tr('u6.quick.saved', { text: describe(v) }), 'success');
          break;
        }
        case 'appointment':
          router.push({ pathname: '/appointments', params: { new: 'quick', title: v.title ?? tr('u6.quick.appt_default'), at: v.at.toISOString(), ...(v.childId ? { child: v.childId } : {}) } });
          break;
        case 'medication':
          router.push({ pathname: '/child/[id]/needs', params: { id: v.childId!, tab: 'treatments', time: v.time! } });
          break;
      }
      setText(''); setRes(null);
      void quota.refetch();
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  const left = quota.status && !access.premium ? quota.status.remaining : null;
  return (
    <View testID="quick-entry">
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text weight="bold">{tr('u6.quick.title')}</Text>
          {left != null ? <Text variant="caption" muted testID="quick-left">{tr('u6.quick.left', { count: left })}</Text> : null}
        </Row>
        <Field label={tr('u6.quick.say')} value={text} onChangeText={(v) => { setText(v); setRes(null); }} placeholder={tr('u6.quick.placeholder')} returnKeyType="done" onSubmitEditing={() => analyse()} testID="quick-text" />
        <Row wrap>
          <Button label={tr('u6.quick.parse')} size="sm" variant="secondary" icon="check" onPress={() => analyse()} disabled={!text.trim()} testID="quick-parse" />
          {Rec ? <Button label={listening ? tr('u6.quick.listening') : tr('u6.quick.dictate')} size="sm" variant="ghost" icon="mic" onPress={dictate} disabled={listening} /> : null}
        </Row>
        {res && !res.ok ? <Banner tone="warning">{errText(res.error)}</Banner> : null}
        {res && res.ok ? (
          <View testID="quick-result" style={{ gap: 4, marginTop: 4 }}>
            <Text weight="bold">{describe(res.value)}</Text>
            {res.value.kind === 'medication' ? <Text variant="caption" muted>{tr('u6.quick.med_note')}</Text> : null}
            <Row wrap>
              <Button label={res.value.kind === 'sleep_start' || res.value.kind === 'sleep_end' ? tr('u6.quick.confirm_save') : tr('u6.quick.check_save')} size="sm" icon="arrow-right" loading={busy} onPress={() => confirm(res.value)} testID="quick-open" />
              <Button label={tr('u6.quick.cancel')} size="sm" variant="ghost" onPress={() => setRes(null)} />
            </Row>
          </View>
        ) : null}
        <Text variant="caption" muted>{tr('u6.quick.footer')}</Text>
      </Card>
    </View>
  );
}
