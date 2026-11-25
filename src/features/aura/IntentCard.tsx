/**
 * Carte d'action d'Aura issue d'une intention LOCALE (src/lib/aura/intents.ts) : réponse brève + bouton dont le
 * libellé décrit le résultat (« Ouvrir Allaitement », « Corriger cette sieste », « Préparer le relais »).
 * La destination est recalculée avec les données et droits ACTUELS à chaque affichage, puis de nouveau à l'appui :
 * une ancienne carte respecte un retrait d'accès, un changement d'enfant ou une sieste modifiée entre-temps.
 * Écritures (Aura 2.0 : sieste, biberon) : seulement après l'appui du parent sur « Enregistrer », par le MÊME chemin que
 * les écrans (`useAddLog` : file hors ligne, identifiant fixe anti-doublon, cache partagé invalidé → outil, accueil,
 * graphiques et historique à jour). Droits relus à l'appui ; la base (RLS) refuse de toute façon un accès retiré.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Icon, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { resolveIntent, type AuraIntent, type IntentContext, type Resolution, type WriteKind } from '@/lib/aura/intents';
import { useActivePregnancy, useActiveSubject, useAddLog, useDeleteRow, useLogs, useMyMembership, useTrackedChildren } from '@/lib/data/hooks';
import { uuid } from '@/lib/uuid';
import { useTreatmentLogs, useTreatments } from '@/lib/data/hooks-needs';
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
  const bottles = useLogs<{ at: string; consumed_ml: number | null; child_id: string }>('bottle', intent.kind === 'log_bottle' || intent.kind === 'bottles_today' ? childId : null, 1, { includePending: true });
  const diapers = useLogs<{ at: string; wet: boolean; stool: boolean; child_id: string }>('diaper', intent.kind === 'last_diaper' ? childId : null, 3, { includePending: true });
  const feeds = useLogs<{ started_at: string; ended_at: string | null; child_id: string }>('breastfeed', intent.kind === 'feeds_today' ? childId : null, 1, { includePending: true });
  const treatments = useTreatments(intent.kind === 'med_check' ? childId : null);
  const day0 = new Date(); day0.setHours(0, 0, 0, 0);
  const doses = useTreatmentLogs(intent.kind === 'med_check' ? (treatments.data ?? []).map((x) => x.id) : [], day0.toISOString());
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
    treatments: treatments.data ?? [],
    doses: doses.data ?? [],
    diapers: diapers.data ?? [],
    feeds: feeds.data ?? [],
    now: new Date(),
    t: (k, v) => tr(k as TKey, v as never),
    clock: (d) => clock(d),
  };
}

/**
 * 26/11/2026 (retour iPhone « il propose juste, il ne note pas ») : une action SIMPLE et réversible dite clairement
 * (un biberon, une couche, un sommeil ou une tétée avec durée) est enregistrée tout de suite, avec « Annuler ».
 * Plusieurs actions ou une série restent à confirmer. Mémoire par message : jamais deux enregistrements si la bulle
 * est ré-affichée (défilement, retour sur l'écran).
 */
type AutoState = { status: 'saving' | 'done' | 'queued' | 'error' | 'undone'; label: string; href: string; items: { kind: WriteKind; id: string }[] };
const AUTO = new Map<string, AutoState>();
export const __resetAutoSaves = () => AUTO.clear();
export function autoSaves(intent: AuraIntent): boolean {
  if (intent.kind === 'log_bottle') return intent.ml != null && (intent.times?.length ?? 0) <= 1;
  return intent.kind === 'log_diaper' || intent.kind === 'log_sleep_for' || intent.kind === 'log_sleep' || (intent.kind === 'log_feed_for' && !!intent.side);
}

export function IntentCard({ intent: initial, catalog, allTools, autoKey }: { intent: AuraIntent; catalog: CatalogTool[]; allTools: CatalogTool[]; autoKey?: string }) {
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
  const addDiaper = useAddLog('diaper');
  const addFeed = useAddLog('breastfeed');
  const adders = { sleep: addSleep, bottle: addBottle, diaper: addDiaper, breastfeed: addFeed } as const;
  const writeId = useRef(uuid());
  const extraIds = useRef<string[]>([]);
  const [phase, setPhase] = useState<'idle' | 'saving' | 'done' | 'queued' | 'error'>(() => {
    const a = autoKey ? AUTO.get(autoKey) : undefined;
    return a?.status === 'queued' ? 'queued' : a && a.status !== 'error' && a.status !== 'saving' ? 'done' : 'idle';
  });
  const [done, setDone] = useState<{ label: string; href: string } | null>(() => {
    const a = autoKey ? AUTO.get(autoKey) : undefined;
    return a && (a.status === 'done' || a.status === 'queued' || a.status === 'undone') ? { label: a.label, href: a.href } : null;
  });
  const prior = autoKey ? AUTO.get(autoKey) : undefined;
  const savedItems = useRef<{ kind: WriteKind; id: string }[]>(prior?.items ?? []);
  const delSleep = useDeleteRow('sleeps'); const delBottle = useDeleteRow('bottles'); const delDiaper = useDeleteRow('diapers'); const delFeed = useDeleteRow('breastfeeds');
  const deleters = { sleep: delSleep, bottle: delBottle, diaper: delDiaper, breastfeed: delFeed } as const;
  const [undone, setUndone] = useState(prior?.status === 'undone');
  const undo = async () => {
    try {
      for (const it of [...savedItems.current].reverse()) await deleters[it.kind].mutateAsync(it.id);
      if (autoKey) { const a = AUTO.get(autoKey); if (a) AUTO.set(autoKey, { ...a, status: 'undone' }); }
      setUndone(true); toast(tr('aura.auto.undone'), 'info');
    } catch { toast(tr('aura.it2.failed'), 'error'); }
  };
  const inFlight = useRef(false);
  const save = async () => {
    if (inFlight.current || phase === 'saving' || phase === 'done' || phase === 'queued') return;
    inFlight.current = true;
    const now = resolveIntent(intent, { ...ctx, now: new Date() });
    if (now.status !== 'confirm') { inFlight.current = false; toast(tr('aura.it.changed'), 'info'); return; }
    const household_id = kids?.find((c) => c.id === now.write.row.child_id)?.household_id;
    if (!household_id) { inFlight.current = false; if (autoKey) AUTO.delete(autoKey); toast(tr('aura.it.changed'), 'info'); return; }
    setPhase('saving');
    try {
      // Série (plusieurs biberons) : un identifiant stable par ligne → un 2e appui ne crée jamais de doublon
      // Phrase à plusieurs actions (25/11/2026) : chaque ligne va dans SON outil, même protection contre les doublons
      const items = now.write.batch?.length ? now.write.batch : (now.write.rows?.length ? now.write.rows : [now.write.row]).map((row) => ({ kind: now.write.kind, row }));
      let res: unknown = null;
      const saved: { kind: WriteKind; id: string }[] = [];
      for (let i = 0; i < items.length; i++) {
        const id = i === 0 ? writeId.current : (extraIds.current[i] ??= uuid());
        res = await adders[items[i].kind].mutateAsync({ ...items[i].row, id, client_id: id, household_id });
        saved.push({ kind: items[i].kind, id });
      }
      const st = res === 'queued' ? 'queued' : 'done';
      if (autoKey) AUTO.set(autoKey, { status: st, label: now.doneLabel, href: now.viewHref, items: saved });
      savedItems.current = saved;
      setDone({ label: now.doneLabel, href: now.viewHref });
      setPhase(st);
    } catch {
      if (autoKey) AUTO.delete(autoKey);
      inFlight.current = false;
      setPhase('error');
    }
  };
  // Enregistrement immédiat d'une action simple (une seule fois par message)
  useEffect(() => {
    if (!autoKey || AUTO.has(autoKey) || !autoSaves(intent) || r.status !== 'confirm' || r.write.batch?.length || (r.write.rows?.length ?? 0) > 1) return;
    if (!kids?.length) return; // attend les enfants (foyer) avant d'écrire
    AUTO.set(autoKey, { status: 'saving', label: r.doneLabel, href: r.viewHref, items: [] });
    void save();
  }, [autoKey, r.status, kids?.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (done) {
    return (
      <View testID="aura-intent-done" accessibilityLiveRegion="polite" style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Icon name="check-circle" size={18} color={t.colors.success} />
          <Text weight="bold" style={{ flex: 1 }}>{done.label}</Text>
        </View>
        {phase === 'queued' ? <Text variant="caption" muted testID="aura-intent-queued">{tr('aura.it2.queued')}</Text> : null}
        {undone ? <Text variant="caption" muted testID="aura-intent-undone">{tr('aura.auto.undone')}</Text> : null}
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Button label={tr('aura.it2.view')} icon="arrow-right" size="sm" onPress={() => router.push(done.href as never)} testID="aura-intent-view" />
          <Button label={tr('aura.it2.edit')} size="sm" variant="secondary" onPress={() => router.push(done.href as never)} testID="aura-intent-edit" />
          {!undone && savedItems.current.length ? <Button label={tr('aura.auto.undo')} size="sm" variant="ghost" onPress={() => void undo()} testID="aura-intent-undo" /> : null}
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
          {/* Deux boutons pleine largeur l'un sous l'autre : côte à côte dans la bulle, « Enregistrer » était coupé */}
          <View style={{ gap: spacing.xs }}>
            <Button label={phase === 'saving' ? tr('aura.it2.saving') : tr('aura.it2.save')} icon="check" loading={phase === 'saving'} onPress={() => void save()} testID="aura-intent-save" full />
            <Button label={tr('aura.it2.edit')} variant="secondary" onPress={() => router.push(r.editHref as never)} testID="aura-intent-open" full />
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
          {r.hint ? <Text variant="caption" muted testID="aura-intent-hint">{r.hint}</Text> : null}
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
