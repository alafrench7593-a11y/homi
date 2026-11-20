/**
 * 174 — Traducteur émotionnel (entrée d'Aura, thème `emotion_translator`), relié à « Se comprendre ».
 *  - avec l'IA : la personne écrit son message, Aura propose 3 reformulations douces (coût affiché avant) ;
 *  - sans IA : les formulations ÉCRITES À L'AVANCE de « Se comprendre » (situation → plus courte / plus douce / plus
 *    directe), sans faire semblant de reformuler.
 * La personne choisit, puis « Utiliser ce message » le garde en BROUILLON de « Se comprendre » et ouvre la rédaction :
 * elle peut encore le modifier, et rien n'est envoyé sans « Envoyer à … » puis la confirmation de cet écran.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Button, Chip, Field, Icon, Row, Text } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { saveDraft } from '@/lib/data/hooks-couple';
import { SITUATIONS, VARIANTS, situationText, situationTitle, type Situation } from '@/lib/domain/understand';
import { t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { MAX_QUESTION_LENGTH } from '../../../supabase/functions/_shared/assistant-format';
import type { AuraMode } from './model';

export function EmotionTranslator({ mode, cost, initialDraft, initialSituation, reformulate }: {
  mode: AuraMode; cost: number; initialDraft?: string; initialSituation?: Situation | null;
  /** Demande de 3 reformulations (null : échec déjà signalé par l'écran). */
  reformulate: (draft: string) => Promise<string[] | null>;
}) {
  const t = useTheme();
  const toast = useToast();
  const me = useUserId();
  const [draft, setDraft] = useState(initialDraft ?? '');
  const [situation, setSituation] = useState<Situation | null>(initialSituation ?? null);
  const [options, setOptions] = useState<string[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const local = mode === 'local';
  const list = local ? (situation ? VARIANTS.map((v) => tr(situationText(situation, v))) : []) : options ?? [];

  async function ask() {
    if (busy || draft.trim().length < 2) return;
    setBusy(true);
    setPicked(null);
    try { setOptions(await reformulate(draft.trim())); } finally { setBusy(false); }
  }
  async function use() {
    if (!picked) return;
    // Brouillon de « Se comprendre » (sur ce téléphone) : la rédaction l'affiche d'emblée, rien n'est envoyé
    await saveDraft(me, local && situation ? situation : initialSituation ?? 'feelings', picked);
    toast(tr('aura.ref.used'));
    const s = local && situation ? situation : initialSituation;
    router.push({ pathname: '/family/understand/compose', params: s ? { situation: s } : {} } as never);
  }

  return (
    <View style={{ gap: spacing.sm }} testID="aura-translator">
      <Text weight="bold" accessibilityRole="header">{tr('aura.ref.title')}</Text>
      <Text variant="small" muted>{local ? tr('aura.ref.local') : tr('aura.ref.body')}</Text>
      {local ? (
        <Row wrap>
          {SITUATIONS.map((s) => <Chip key={s} label={tr(situationTitle(s))} selected={situation === s} onPress={() => { setSituation(s); setPicked(null); }} testID={`aura-ref-situation-${s}`} />)}
        </Row>
      ) : (
        <>
          <Field label={tr('aura.ref.field')} value={draft} onChangeText={setDraft} multiline maxLength={MAX_QUESTION_LENGTH} style={{ minHeight: 96, textAlignVertical: 'top' }} testID="aura-ref-draft" />
          <Button label={tr('aura.ref.go', { count: cost })} icon="feather" variant="secondary" full loading={busy} disabled={draft.trim().length < 2} onPress={() => void ask()} testID="aura-ref-go" />
        </>
      )}
      {list.length ? <Text variant="label">{tr('aura.ref.choose')}</Text> : null}
      {list.map((o, i) => {
        const on = picked === o;
        return (
          <Tappable key={`${i}-${o.slice(0, 12)}`} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setPicked(o)} testID="aura-ref-option"
            style={{ minHeight: MIN_TOUCH, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: on ? t.colors.primary : t.colors.border, backgroundColor: on ? t.colors.accentSoft : t.colors.surface }}>
            <Icon name={on ? 'check-circle' : 'circle'} size={20} color={on ? t.colors.primary : t.colors.textMuted} />
            <View style={{ flex: 1, gap: 2 }}>
              {local ? <Text variant="caption" muted>{tr(`und.v.${VARIANTS[i]}` as TKey)}</Text> : null}
              <Text variant="small">{o}</Text>
            </View>
          </Tappable>
        );
      })}
      {list.length ? <Button label={tr('aura.ref.use')} icon="edit-3" full disabled={!picked} onPress={() => void use()} testID="aura-ref-use" /> : null}
    </View>
  );
}
