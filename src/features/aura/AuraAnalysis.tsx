/**
 * « Analyser avec HOMI Aura — X crédits » posé sur un outil (bouton `AnalyzeWithAI` existant) avec, AVANT :
 *  - l'aperçu EXACT de ce qui sera envoyé (agrégats minimisés calculés sur le téléphone, analysis.ts) ;
 *  - le consentement explicite pour CETTE analyse (interrupteur, jamais pré-coché) ;
 *  - le coût, affiché par le bouton puis rappelé dans sa confirmation.
 * Le résultat s'affiche sous le bouton (texte contrôlé par le serveur : aucun diagnostic, aucune posologie).
 * Journal intime : la personne COCHE les pages à envoyer (rien d'autre ne part).
 * IA éteinte : le bouton l'indique discrètement et l'outil reste entièrement utilisable.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { AnalyzeWithAI } from '@/features/credits/AnalyzeWithAI';
import { Markdown } from '@/components/Markdown';
import { Glass } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Icon, Row, Text, Toggle } from '@/components/ui';
import { hasRealBackend, isDemo } from '@/lib/backend';
import { aiAssistantOnline } from '@/config/features';
import type { MoodCheckin } from '@/lib/types';
import { formatDate, getLocale, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { uuid } from '@/lib/uuid';
import { useEntitlement } from '@/lib/data/hooks-premium';
import { MAX_JOURNAL_ENTRIES } from '../../../supabase/functions/_shared/aura-data';
import { askAura, type AuraServerReply } from './api';
import { analysisPeriod, previewRows, sleepAggregate } from './analysis';
import { useSleepAssistantContext } from '@/features/sleepAssistant';
import type { Child } from '@/lib/types';
import { AuraGlyph } from './AuraMark';
import { creditActionFor, journalPayload } from './model';
import { MotionItem, MotionList } from '@/motion/ListMotion';

type Kind = 'sleep' | 'cycle' | 'mood' | 'load' | 'bottle' | 'nap';

export function AuraAnalysis({ kind, data, testID, followUps }: { kind: Kind; data: Record<string, unknown> | null; testID?: string; followUps?: React.ReactNode }) {
  return <AnalysisShell kind={kind} payload={data} testID={testID ?? `aura-analysis-${kind}`} followUps={followUps} />;
}

/** Journal intime : synthèse des pages COCHÉES par la personne. */
export function AuraDiaryAnalysis({ pages, testID = 'aura-analysis-diary' }: { pages: readonly MoodCheckin[]; testID?: string }) {
  const t = useTheme();
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const recent = useMemo(() => pages.slice(0, 20), [pages]);
  const payload = useMemo(() => (chosen.size ? { entries: journalPayload('diary', recent, chosen).entries } : null), [recent, chosen]);
  if (!recent.length) return null;
  return (
    <AnalysisShell kind="diary" payload={payload} testID={testID}>
      <Text variant="small" muted>{tr('aura.an.pick')}</Text>
      <MotionList>{recent.map((p) => {
        const on = chosen.has(p.id);
        return (
          <MotionItem key={p.id}><Tappable key={p.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} testID="aura-analysis-page"
            onPress={() => setChosen((s) => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else if (n.size < MAX_JOURNAL_ENTRIES) n.add(p.id); return n; })}
            style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 }}>
            <Icon name={on ? 'check-square' : 'square'} size={20} color={on ? t.colors.primary : t.colors.textMuted} />
            <Text variant="small" style={{ flex: 1 }} numberOfLines={1}>{`${formatDate(p.checked_at, { day: 'numeric', month: 'short' })} — ${p.journal ?? ''}`}</Text>
          </Tappable></MotionItem>
        );
      })}</MotionList>
    </AnalysisShell>
  );
}

function AnalysisShell({ kind, payload, testID, children, followUps }: { kind: Kind | 'diary'; payload: Record<string, unknown> | null; testID: string; children?: React.ReactNode; followUps?: React.ReactNode }) {
  const t = useTheme();
  const [agreed, setAgreed] = useState(false);
  const [result, setResult] = useState<AuraServerReply | null>(null);
  // Données analysées : si elles changent ensuite (sieste modifiée, supprimée), l'analyse affichée est signalée
  // comme à relancer — jamais recalculée (ni facturée) automatiquement à l'affichage
  const payloadKey = JSON.stringify(payload ?? null);
  const [analysedKey, setAnalysedKey] = useState<string | null>(null);
  const stale = !!result && analysedKey !== null && analysedKey !== stableKey(kind, payloadKey);
  const action = creditActionFor('analysis', { analysis: kind });
  const demoBackend = isDemo && !hasRealBackend;
  const rows = payload ? previewRows(payload) : [];
  // L'essai de 3 jours ouvre les outils, pas l'IA : aucun crédit d'essai, on le dit honnêtement
  const trial = useEntitlement().state === 'trial' && (aiAssistantOnline() || demoBackend);
  return (
    <Glass variant="card" radius={radius.xl} testID={testID} contentStyle={{ gap: spacing.sm, padding: spacing.md }}>
      <Row style={{ alignItems: 'center' }}>
        <AuraGlyph size={22} />
        <Text weight="bold" accessibilityRole="header" style={{ flex: 1 }}>{tr('aura.an.title')}</Text>
      </Row>
      {children}
      {!payload ? <Text variant="small" muted testID={`${testID}-empty`}>{tr(kind === 'diary' ? 'aura.an.pickFirst' : kind === 'bottle' ? 'sa.an.bottleNone' : 'aura.an.none')}</Text> : (
        <>
          <Text variant="small" testID={`${testID}-period`}>{(() => { const p = analysisPeriod(kind, payload); return tr(p.key as never, { count: p.days ?? 0 }); })()}</Text>
          <Text variant="small" muted>{tr('aura.an.body')}</Text>
          <MotionList style={{ gap: 2, padding: spacing.sm, borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt }} testID={`${testID}-preview`}>
            {rows.map((r) => <MotionItem key={r.key}><Text key={r.key} variant="caption">{`${tr(`aura.an.f.${r.key}` as TKey)} : ${r.value}`}</Text></MotionItem>)}
          </MotionList>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text variant="small" style={{ flex: 1 }}>{tr('aura.an.consent')}</Text>
            <Toggle label={tr('aura.an.consent')} value={agreed} onChange={setAgreed} />
          </Row>
          {trial ? <Text variant="small" muted testID={`${testID}-trial`}>{tr('aura.sub.trial')}</Text> : agreed || !(aiAssistantOnline() || demoBackend) ? (
            <AnalyzeWithAI<AuraServerReply>
              action={action}
              demo={demoBackend}
              testID={`${testID}-ai`}
              run={({ requestId }) => askAura({ kind: 'analysis', analysis: { kind, data: payload }, data_consent: true, lang: getLocale(), request_id: requestId || uuid(), credit_action: action })}
              onResult={(r) => { setResult(r); setAnalysedKey(stableKey(kind, payloadKey)); }}
            />
          ) : null}
        </>
      )}
      {result ? (
        <View style={{ gap: spacing.xs }} testID={`${testID}-result`} accessibilityLiveRegion="polite">
          <Text variant="label">{tr('aura.an.result')}</Text>
          {result.demo ? <Text variant="caption" color={t.colors.lavender} testID={`${testID}-simulated`}>{tr('aura.mode.demo')}</Text> : null}
          {result.safety && result.safety !== 'none' ? <Text variant="small">{result.answer}</Text> : <Markdown source={result.answer ?? ''} />}
          <Text variant="caption" muted>{`${result.footer ?? tr('aura.aiNote')} ${result.credits?.charged ? tr('aura.charged', { count: result.credits.cost ?? 0 }) : tr('aura.notCharged')}`}</Text>
          {stale ? <Text variant="small" weight="medium" testID={`${testID}-stale`}>{tr('nn.an.stale')}</Text> : null}
          {followUps ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>{followUps}</View> : null}
        </View>
      ) : null}
    </Glass>
  );
}

/**
 * Clé de comparaison des données analysées. Sieste en cours : la durée écoulée avance seule (elle ne rend pas l'analyse
 * périmée) ; seules les siestes comparées et l'heure d'endormissement comptent.
 */
function stableKey(kind: string, payloadKey: string): string {
  if (kind !== 'nap') return payloadKey;
  try { const d = JSON.parse(payloadKey) as Record<string, unknown> | null; return JSON.stringify(d ? { s: d.started_hm, c: d.comparable_minutes } : null); } catch { return payloadKey; }
}

/** Sommeil d'un enfant : moyennes de la semaine (les mêmes que « M'aider pour les nuits »), âge en mois seulement. */
export function AuraSleepAnalysis({ child }: { child: Child }) {
  const ctx = useSleepAssistantContext(child);
  return <AuraAnalysis kind="sleep" data={sleepAggregate(ctx?.sleep)} />;
}
