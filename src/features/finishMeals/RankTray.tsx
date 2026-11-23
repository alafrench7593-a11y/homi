/**
 * Classements — fiche d'une recette classée (23/11/2026), gardée dans l'adresse (« ?recipe=<slug> ») : le score
 * éditorial en grand (jamais présenté comme le Nutri-Score officiel), son rang dans le classement affiché, puis
 * « Corriger ma préférence » : favorite / neutre / écartée des menus — valeur PROVISOIRE, Annuler, Enregistrer
 * verrouillé ; si la préférence a changé ailleurs depuis l'ouverture, rien n'est écrit et la fiche le dit.
 * Écrit par les MÊMES favoris / « je n'aime pas » que la fiche recette et le menu.
 */
import React, { useState } from 'react';
import { HmFixTray } from '@/features/homeTrack/kit';
import { budgetLabel } from '@/features/recipes/labels';
import { t as tr } from '@/i18n';
import { useRecipeDislikes, useRecipeFavorites } from '@/lib/data/hooks-recipes';
import { friendlyError } from '@/lib/data/hooks-settings';
import { preferenceOf, preferenceSteps, type Preference } from '@/lib/domain/finishMeals';
import type { Recipe } from '@/lib/recipes/types';

const PREF_KEYS = ['fm.rank.pref.fav', 'fm.rank.pref.neutral', 'fm.rank.pref.out'] as const;

export function RankTray({ recipe, score, rank, context, onClose }: { recipe: Recipe; score: number; rank: number; context: string; onClose: () => void }) {
  const fav = useRecipeFavorites();
  const dis = useRecipeDislikes();
  const current = preferenceOf(recipe.slug, fav.slugs, dis.slugs);
  // Préférence lue à l'ouverture : sert de garde (quelqu'un l'a-t-il changée entre-temps ?)
  const [opened] = useState<Preference>(current);
  return (
    <HmFixTray open onOpenChange={(v) => { if (!v) onClose(); }} testID="fm-rank-tray"
      title={recipe.title} hero={tr('rc.score.badge', { n: score })} heroLabel={tr('fm.rank.scoreA11y', { n: score })}
      lines={[tr('fm.rank.position', { n: rank, context }), `${tr('rc.card.meta', { min: recipe.prepMin + recipe.cookMin, n: recipe.servings })} · ${budgetLabel(recipe.budget)}`, tr(PREF_KEYS[current]), tr('rc.score.disclaimer')]}
      editLabel={tr('fm.rank.fix')} editTitle={tr('fm.rank.fixTitle')}
      fields={[{ key: 'pref', label: tr('fm.rank.prefLabel'), kind: 'choice', options: PREF_KEYS.map((k) => tr(k)) }]}
      initial={{ pref: String(opened) }}
      onSave={async (d) => {
        const to = Number(d.pref) as Preference;
        if (![0, 1, 2].includes(to)) return tr('fm.rank.badPref');
        if (current !== opened) return tr('fm.changedMeanwhile');
        const steps = preferenceSteps(current, to);
        try {
          if (steps.favorite) await fav.toggle.mutateAsync(recipe.slug);
          if (steps.dislike) await dis.toggle.mutateAsync(recipe.slug);
          return 'ok';
        } catch (e) { return friendlyError(e); }
      }} />
  );
}
