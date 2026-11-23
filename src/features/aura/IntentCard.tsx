/**
 * Carte d'action d'Aura issue d'une intention LOCALE (src/lib/aura/intents.ts) : réponse brève + bouton dont le
 * libellé décrit le résultat (« Ouvrir Allaitement », « Corriger cette sieste », « Préparer le relais »).
 * La destination est recalculée avec les données et droits ACTUELS à chaque affichage, puis de nouveau à l'appui :
 * une ancienne carte respecte un retrait d'accès, un changement d'enfant ou une sieste modifiée entre-temps.
 * Écritures (Aura 2.0 : sieste, biberon) : seulement après l'appui du parent sur « Enregistrer », par le MÊME chemin que
 * les écrans (`useAddLog` : file hors ligne, identifiant fixe anti-doublon, cache partagé invalidé → outil, accueil,
 * graphiques et historique à jour). Droits relus à l'appui ; la base (RLS) refuse de toute façon un accès retiré.
 */
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Icon, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { resolveIntent, type AuraIntent, type IntentContext, type Resolution } from '@/lib/aura/intents';
import { useActivePregnancy, useActiveSubject, useAddLog, useLogs, useMyMembership, useTrackedChildren } from '@/lib/data/hooks';
import { uuid } from '@/lib/uuid';
import { useScope } from '@/lib/data/hooks-scope';
import { clock } from '@/lib/domain/sleepPlanner';
import { toolCatalog, type CatalogTool } from '@/lib/domain/toolCatalog';
import type { Sleep } from '@/lib/types';
import { t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

function useIntentContext(intent: AuraIntent, catalog: CatalogTool[], allTools: CatalogTool[]): IntentContext {
  const { data: children } = useTrackedChildren();
  const scope = useScope();
  const member = useMyMembership();
  const childId = ('childId' in intent && intent.childId) || scope.childId || (children?.length === 1 ? children[0].id : null);
  const needsSleeps = intent.kind === 'fix_sleep_end' || intent.kind === 'log_sleep' || intent.kind === 'sleep_today';
  const sleeps = useLogs<Sleep>('sleep', needsSleeps ? childId : null, 2, { includePending: intent.kind !== 'fix_sleep_end' });
  const bottles = useLogs<{ at: string; consumed_ml: number | null }>('bottle', intent.kind === 'log_bottle' ? childId : null, 1, { includePending: true });
  const pregnancy = useActivePregnancy();
  // Outils grossesse RÉELLEMENT disponibles : seulement si une grossesse est déclarée (catalogue du profil grossesse)
  const pregnancyCatalog = pregnancy ? toolCatalog({ scope: 'pregnancy', pregnancyId: pregnancy.id }).filter((x) => x.category === 'pregnancy') : [];
  void allTools;
  return {
    children: (children ?? []).map((c) => ({ id: c.id, first_name: c.first_name })),
    activeChildId: scope.childId ?? null,
    member: member as never,
    catalog: catalog.map((x) => ({ id: x.id, label: x.label, href: x.href })),
    pregnancyCatalog: pregnancyCatalog.map((x) => ({ id: x.id, label: x.label, href: x.href })),
    sleeps: (sleeps.data ?? []) as Sleep[],
    bottles: bottles.data ?? [],
    now: new Date(),
    t: (k, v) => tr(k as TKey, v as never),
    clock: (d) => clock(d),
  };
}

export function IntentCard({ intent: initial, catalog, allTools }: { intent: AuraIntent; catalog: CatalogTool[]; allTools: CatalogTool[] }) {
  const t = useTheme();
  const toast = useToast();
  const [intent, setIntent] = useState<AuraIntent>(initial);
  const ctx = useIntentContext(intent, catalog, allTools);
  const { setSubject } = useActiveSubject();
  const r: Resolution = resolveIntent(intent, ctx);
  // À l'appui : même calcul avec l'état du moment (droits retirés, sieste corrigée ailleurs, enfant changé)
  const go = (href: string) => {
    const now = resolveIntent(intent, { ...ctx, now: new Date() });
    if (now.status !== 'ready' || now.href !== href) { toast(tr('aura.it.changed'), 'info'); return; }
    router.push(href as never);
  };
  // ---- écriture confirmée (une seule, même après double appui : identifiant fixé à l'affichage de la carte)
  const { data: kids } = useTrackedChildren();
  const addSleep = useAddLog('sleep');
  const addBottle = useAddLog('bottle');
  const writeId = useRef(uuid());
  const [phase, setPhase] = useState<'idle' | 'saving' | 'done' | 'queued' | 'error'>('idle');
  const [done, setDone] = useState<{ label: string; href: string } | null>(null);
  const save = async () => {
    if (phase === 'saving' || phase === 'done' || phase === 'queued') return;
    const now = resolveIntent(intent, { ...ctx, now: new Date() });
    if (now.status !== 'confirm') { toast(tr('aura.it.changed'), 'info'); return; }
    const household_id = kids?.find((c) => c.id === now.write.row.child_id)?.household_id;
    if (!household_id) { toast(tr('aura.it.changed'), 'info'); return; }
    setPhase('saving');
    try {
      const row = { ...now.write.row, id: writeId.current, client_id: writeId.current, household_id };
      const res = await (now.write.kind === 'sleep' ? addSleep : addBottle).mutateAsync(row);
      setDone({ label: now.doneLabel, href: now.viewHref });
      setPhase(res === 'queued' ? 'queued' : 'done');
    } catch {
      setPhase('error');
    }
  };
  if (done) {
    return (
      <View testID="aura-intent-done" accessibilityLiveRegion="polite" style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Icon name="check-circle" size={18} color={t.colors.success} />
          <Text weight="bold" style={{ flex: 1 }}>{done.label}</Text>
        </View>
        {phase === 'queued' ? <Text variant="caption" muted testID="aura-intent-queued">{tr('aura.it2.queued')}</Text> : null}
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Button label={tr('aura.it2.view')} icon="arrow-right" size="sm" onPress={() => router.push(done.href as never)} testID="aura-intent-view" />
          <Button label={tr('aura.it2.edit')} size="sm" variant="secondary" onPress={() => router.push(done.href as never)} testID="aura-intent-edit" />
        </View>
      </View>
    );
  }
  return (
    <View testID="aura-intent" style={{ gap: spacing.xs }}>
      {r.status === 'confirm' ? (
        <>
          <Text weight="bold" testID="aura-intent-summary">{r.summary}</Text>
          {phase === 'error' ? <Text variant="small" color={t.colors.danger} testID="aura-intent-error">{tr('aura.it2.failed')}</Text> : null}
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Button label={phase === 'saving' ? tr('aura.it2.saving') : tr('aura.it2.save')} icon="check" loading={phase === 'saving'} onPress={() => void save()} testID="aura-intent-save" style={{ flex: 1 }} />
            <Button label={tr('aura.it2.edit')} variant="secondary" onPress={() => router.push(r.editHref as never)} testID="aura-intent-open" style={{ flex: 1 }} />
          </View>
        </>
      ) : r.status === 'answer' ? (
        <>
          <Text variant="small" testID="aura-intent-answer">{r.text}</Text>
          <Button label={r.label} icon="arrow-right" variant="secondary" full onPress={() => router.push(r.href as never)} testID="aura-intent-go" />
        </>
      ) : r.status === 'ready' ? (
        <>
          <Text variant="small">{tr('aura.it.reply')}{r.hint ? ` ${r.hint}` : ''}</Text>
          <Button label={r.label} icon="arrow-right" variant="primary" full onPress={() => go(r.href)} testID="aura-intent-go" />
        </>
      ) : r.status === 'ask' ? (
        <>
          <Text variant="small" weight="medium" testID="aura-intent-question">{r.question}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {r.options.map((o, i) => <Button key={i} label={o.label} size="sm" variant="secondary" onPress={() => setIntent(o.intent)} testID={`aura-intent-opt-${i}`} />)}
          </View>
        </>
      ) : r.status === 'select_child' ? (
        <>
          <Text variant="small">{r.label}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {r.options.map((o) => (
              <Button key={o.childId} label={o.label} size="sm" variant={ctx.activeChildId === o.childId ? 'primary' : 'secondary'} testID={`aura-intent-child-${o.childId}`}
                onPress={() => { setSubject({ type: 'child', id: o.childId }); toast(tr('aura.it.switched', { name: ctx.children.find((c) => c.id === o.childId)?.first_name ?? '' }), 'success'); }} />
            ))}
          </View>
        </>
      ) : r.status === 'list' ? (
        <>
          <Text variant="small">{r.label}</Text>
          {r.items.map((x, i) => <Button key={x.href} label={x.label} icon="arrow-right" variant={i === 0 ? 'primary' : 'secondary'} full onPress={() => router.push(x.href as never)} testID={`aura-intent-item-${i}`} />)}
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
            <Icon name="info" size={16} color={t.colors.textMuted} />
            <Text variant="small" style={{ flex: 1 }} testID="aura-intent-unavailable">{r.reason}</Text>
          </View>
          {r.alternative ? <Button label={r.alternative.label} icon="arrow-right" variant="secondary" full onPress={() => router.push(r.alternative!.href as never)} testID="aura-intent-alt" /> : null}
        </>
      )}
      <Text variant="caption" muted>{tr('aura.it.local')}</Text>
    </View>
  );
}
