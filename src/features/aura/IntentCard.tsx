/**
 * Carte d'action d'Aura issue d'une intention LOCALE (src/lib/aura/intents.ts) : réponse brève + bouton dont le
 * libellé décrit le résultat (« Ouvrir Allaitement », « Corriger cette sieste », « Préparer le relais »).
 * La destination est recalculée avec les données et droits ACTUELS à chaque affichage, puis de nouveau à l'appui :
 * une ancienne carte respecte un retrait d'accès, un changement d'enfant ou une sieste modifiée entre-temps.
 * Aucune écriture : la carte ouvre l'écran ou le brouillon ; « Afficher Noé » change seulement le profil affiché.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Icon, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { resolveIntent, type AuraIntent, type IntentContext, type Resolution } from '@/lib/aura/intents';
import { useActivePregnancy, useActiveSubject, useLogs, useMyMembership, useTrackedChildren } from '@/lib/data/hooks';
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
  const sleeps = useLogs<Sleep>('sleep', intent.kind === 'fix_sleep_end' ? childId : null, 2);
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
  return (
    <View testID="aura-intent" style={{ gap: spacing.xs }}>
      {r.status === 'ready' ? (
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
