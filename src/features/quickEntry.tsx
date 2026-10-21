/**
 * Saisie rapide : une phrase tapée ou dictée (« Lina a bu 150 ml à 14 h »). La dictée utilise la reconnaissance
 * vocale du navigateur quand elle existe (web) ; sinon, le clavier (et sa dictée intégrée sur téléphone).
 * Rien n'est enregistré sans vérification : le formulaire habituel s'ouvre pré-rempli.
 */
import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, Card, Field, Row, Text } from '@/components/ui';
import { useTrackedChildren } from '@/lib/data/hooks';
import { formatClock } from '@/lib/domain/bottleTimer';
import { parseQuickEntry, type QuickParse } from '@/lib/domain/quickEntry';

type SpeechCtor = new () => { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void; onend: () => void; start: () => void };
const speech = (): SpeechCtor | null => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const ERR: Record<Extract<QuickParse, { ok: false }>['error'], string> = {
  child: 'Précisez le prénom de l’enfant (ex. « Lina a bu 150 ml à 14 h »).',
  kind: 'Je n’ai pas compris quoi noter : biberon, couche ou sommeil.',
  ml: 'Quantité attendue entre 1 et 500 ml.',
};
const LABEL = { bottle: 'Biberon', diaper: 'Couche', sleep: 'Sommeil' } as const;

export function QuickEntry({ activeChildId }: { activeChildId?: string | null }) {
  const { data: children } = useTrackedChildren();
  const [text, setText] = useState('');
  const [res, setRes] = useState<QuickParse | null>(null);
  const [listening, setListening] = useState(false);
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

  return (
    <View testID="quick-entry">
      <Card>
        <Text weight="bold">Saisie rapide</Text>
        <Field label="Une phrase suffit" value={text} onChangeText={(v) => { setText(v); setRes(null); }} placeholder="Lina a bu 150 ml à 14 h" returnKeyType="done" onSubmitEditing={() => analyse()} testID="quick-text" />
        <Row wrap>
          <Button label="Comprendre" size="sm" variant="secondary" icon="check" onPress={() => analyse()} testID="quick-parse" />
          {Rec ? <Button label={listening ? 'J’écoute…' : 'Dicter'} size="sm" variant="ghost" icon="mic" onPress={dictate} disabled={listening} /> : null}
        </Row>
        {res && !res.ok ? <Banner tone="warning">{ERR[res.error]}</Banner> : null}
        {res && res.ok ? (
          <View testID="quick-result" style={{ gap: 4, marginTop: 4 }}>
            <Text>{`${LABEL[res.value.kind]} · ${res.value.childName}${res.value.ml != null ? ` · ${res.value.ml} ml` : ''} · ${res.value.at.toDateString() === new Date().toDateString() ? '' : 'hier, '}${formatClock(res.value.at.toISOString())}`}</Text>
            <Button label="Vérifier et enregistrer" size="sm" icon="arrow-right" testID="quick-open" onPress={() => router.push({
              pathname: '/track/[kind]', params: { kind: res.value.kind, child: res.value.childId, at: res.value.at.toISOString(), ...(res.value.ml != null ? { ml: String(res.value.ml) } : {}) },
            })} />
          </View>
        ) : null}
        <Text variant="caption" muted>Analyse faite sur l’appareil ; rien n’est enregistré avant votre vérification.</Text>
      </Card>
    </View>
  );
}
