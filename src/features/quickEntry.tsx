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
import { parseQuickEntry, type QuickError, type QuickParse, type QuickResult } from '@/lib/domain/quickEntry';

type SpeechCtor = new () => { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void; onend: () => void; start: () => void };
const speech = (): SpeechCtor | null => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const ERR: Record<QuickError, string> = {
  child: 'Précisez le prénom de l’enfant (ex. « Lina a bu 150 ml à 14 h »).',
  kind: 'Je n’ai pas compris quoi noter : biberon, sommeil, couche, rendez-vous ou rappel de médicament.',
  ml: 'Quantité attendue entre 1 et 500 ml.',
  time: 'Précisez l’heure (ex. « à 17 h ») : elle n’est jamais devinée.',
  date: 'Précisez le jour du rendez-vous (« mardi », « demain », « le 12 »).',
};

const when = (v: QuickResult) => {
  const today = v.at.toDateString() === new Date().toDateString();
  const day = today ? '' : `${v.at.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}, `;
  return v.timeGiven ? `${day}${formatClock(v.at.toISOString())}` : `maintenant (${formatClock(v.at.toISOString())})`;
};

export function describe(v: QuickResult): string {
  switch (v.kind) {
    case 'bottle': return `Biberon · ${v.childName}${v.ml != null ? ` · ${v.ml} ml` : ' · quantité non dite'} · ${when(v)}`;
    case 'sleep_start': return `${v.childName} s’endort · ${when(v)}`;
    case 'sleep_end': return `${v.childName} se réveille · ${when(v)}`;
    case 'diaper': return `Couche · ${v.childName} · ${when(v)}`;
    case 'appointment': return `Rendez-vous « ${v.title} »${v.childName ? ` pour ${v.childName}` : ''} · ${when(v)}`;
    case 'medication': return `Rappel du médicament déjà prescrit de ${v.childName} à ${v.time}`;
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
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    setListening(true);
    r.start();
  }

  /** Une utilisation est comptée seulement quand la personne confirme (jamais pour une phrase non comprise). */
  async function allowed(v: QuickResult): Promise<boolean> {
    if (access.premium) return true;
    const r = await consume();
    if (!r.allowed) {
      access.showPreview(<Text variant="small">{`« ${describe(v)} » : avec Premium, cette phrase serait enregistrée en un appui.`}</Text>, { used: r.used, quota: r.quota, unit: 'saisies vocales' });
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
          toast(`Enregistré : ${describe(v)}.`, 'success');
          break;
        case 'sleep_end': {
          const open = await backend.select<{ id: string; started_at: string }>({ table: 'sleeps', filters: [eq('child_id', v.childId!), { col: 'ended_at', op: 'is', value: null }] });
          if (!open[0]) { toast(`Aucun sommeil en cours pour ${v.childName} : notez d’abord l’endormissement.`, 'info'); return; }
          if (v.at.toISOString() < open[0].started_at) { toast('L’heure du réveil précède l’endormissement noté.', 'error'); return; }
          await backend.update('sleeps', { ended_at: v.at.toISOString() }, [eq('id', open[0].id)]);
          inv('sleeps');
          toast(`Enregistré : ${describe(v)}.`, 'success');
          break;
        }
        case 'appointment':
          router.push({ pathname: '/appointments', params: { new: 'quick', title: v.title ?? 'Rendez-vous', at: v.at.toISOString(), ...(v.childId ? { child: v.childId } : {}) } });
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
          <Text weight="bold">Saisie vocale ou en une phrase</Text>
          {left != null ? <Text variant="caption" muted testID="quick-left">{`${left} essai(s) gratuit(s) ce mois`}</Text> : null}
        </Row>
        <Field label="Dites ou écrivez" value={text} onChangeText={(v) => { setText(v); setRes(null); }} placeholder="Lina a bu 150 ml à 13 h 10" returnKeyType="done" onSubmitEditing={() => analyse()} testID="quick-text" />
        <Row wrap>
          <Button label="Comprendre" size="sm" variant="secondary" icon="check" onPress={() => analyse()} testID="quick-parse" />
          {Rec ? <Button label={listening ? 'J’écoute…' : 'Dicter'} size="sm" variant="ghost" icon="mic" onPress={dictate} disabled={listening} /> : null}
        </Row>
        {res && !res.ok ? <Banner tone="warning">{ERR[res.error]}</Banner> : null}
        {res && res.ok ? (
          <View testID="quick-result" style={{ gap: 4, marginTop: 4 }}>
            <Text weight="bold">{describe(res.value)}</Text>
            {res.value.kind === 'medication' ? <Text variant="caption" muted>Le nom et la dose viennent uniquement du traitement déjà enregistré depuis l’ordonnance ; rien n’est ajouté ici.</Text> : null}
            <Row wrap>
              <Button label={res.value.kind === 'sleep_start' || res.value.kind === 'sleep_end' ? 'Confirmer et enregistrer' : 'Vérifier et enregistrer'} size="sm" icon="arrow-right" loading={busy} onPress={() => confirm(res.value)} testID="quick-open" />
              <Button label="Annuler" size="sm" variant="ghost" onPress={() => setRes(null)} />
            </Row>
          </View>
        ) : null}
        <Text variant="caption" muted>Analyse faite sur l’appareil ; rien n’est enregistré avant votre confirmation.</Text>
      </Card>
    </View>
  );
}
