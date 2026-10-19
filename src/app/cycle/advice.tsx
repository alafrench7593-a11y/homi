/**
 * Mes conseils : tous les conseils en cours, calculés à partir des saisies récentes, du plus pressant au plus léger.
 * Ouvrir cette page marque les conseils comme vus (ils ne sont plus signalés « nouveaux » à chaque ouverture).
 */
import React, { useEffect } from 'react';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/States';
import { Banner } from '@/components/ui';
import { AdviceCard } from '@/features/cycle/AdviceCard';
import { Glass, Ink } from '@/features/cycle/kit';
import { useAdvice } from '@/features/cycle/useAdvice';
import { useUiStore } from '@/lib/store';
import { t as tr } from '@/i18n';

export default function AdviceScreen() {
  const { all, isNew, enabled, loading } = useAdvice();
  const markSeen = useUiStore((s) => s.markAdviceSeen);
  const fresh = all.filter(isNew).map((a) => a.signature);
  // Marqués comme vus en quittant l'écran : l'étiquette « Nouveau » reste visible pendant la lecture
  useEffect(() => () => { if (fresh.length) markSeen(fresh); }, [fresh.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Screen back title={tr('adv.ui.title')} subtitle={tr('adv.ui.subtitle')}>
      {!enabled ? <Banner tone="info">{tr('adv.ui.off')}</Banner> : null}
      {loading ? <Skeleton kind="card" rows={2} /> : null}
      {!loading && !all.length ? (
        <Glass>
          <Ink weight="bold">{tr('adv.ui.empty')}</Ink>
          <Ink variant="small" soft>{tr('adv.ui.emptyHint')}</Ink>
        </Glass>
      ) : null}
      {all.map((a, i) => <AdviceCard key={a.signature} advice={a} isNew={isNew(a)} delay={Math.min(i, 5) * 50} />)}
      <Ink variant="caption" soft>{tr('adv.ui.howUsed')}</Ink>
    </Screen>
  );
}
