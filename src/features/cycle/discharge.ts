/** Libellés traduits des observations de pertes (résumés courts pour les listes et le calendrier). */
import { t as tr, type TKey } from '@/i18n';
import type { DischargeLog } from '@/lib/data/hooks-cycle2';

export const dl = (group: string, v: string) => tr(`cy.dis.${group}.${v}` as TKey);

export function useDischargeLabels() {
  return {
    summary: (l: Pick<DischargeLog, 'amount' | 'color' | 'textures' | 'odor' | 'symptoms'>) =>
      [
        l.amount ? dl('amount', l.amount) : null,
        l.color ? dl('color', l.color) : null,
        ...(l.textures ?? []).map((x) => dl('textures', x)),
        l.odor ? dl('odor', l.odor) : null,
        ...(l.symptoms ?? []).filter((x) => x !== 'none').map((x) => dl('symptoms', x)),
      ].filter(Boolean).join(' · '),
  };
}
