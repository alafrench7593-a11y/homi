/**
 * Remontée du menu, du garde-manger et des vaccins dans leur catégorie (/tools/feeding, /tools/health) — 23/11/2026.
 * Lit les MÊMES lignes que les mini-apps et n'affiche une ligne que si une donnée existe (jamais « 0 ») ; toucher une
 * ligne ouvre la mini-app sur CETTE donnée :
 *  · Alimentation : repas du menu enregistré prévus aujourd'hui → /meals/menu?day= ; ingrédients cochés ou corrigés
 *    aujourd'hui → /meals/pantry?item= (le plus récent) ;
 *  · Santé (enfant affiché) : vaccin noté aujourd'hui → /child/<id>/vaccines?vax= ; rendez-vous de vaccination
 *    aujourd'hui (non fait).
 * Classements : aucune donnée datée propre (score éditorial) → pas de ligne.
 */
import React from 'react';
import { router } from 'expo-router';
import { Panel, type LineSpec } from '@/features/careTrack/CareTrackCategory';
import { formatDate, t as tr } from '@/i18n';
import { useActiveSubject, useChildren } from '@/lib/data/hooks';
import { useLatestMealPlan, useRecipes } from '@/lib/data/hooks-recipes';
import { useStocks } from '@/lib/data/hooks-stocks';
import { useVaccineAppointments, useVaccinations } from '@/lib/data/hooks-vaccines';
import { dayOfStamp } from '@/lib/domain/careTrack';
import { todayISO } from '@/lib/domain/dates';
import { pantryRows, todayMenu, vaccinesOn } from '@/lib/domain/finishMeals';
import { mealLabel } from '@/features/recipes/labels';
import type { Meal } from '@/lib/recipes/types';
import { INGREDIENTS } from '@/lib/recipes/ingredients';
import type { Child } from '@/lib/types';

function FeedingLines() {
  const today = todayISO();
  const { plan, items } = useLatestMealPlan();
  const { data: recipes } = useRecipes();
  const { all: stocks } = useStocks();
  const menu = todayMenu(plan, items, today);
  // Panneau « Noté aujourd'hui » : seulement les ingrédients cochés ou corrigés aujourd'hui
  const pantry = pantryRows(stocks).filter((s) => dayOfStamp(s.updated_at || s.created_at) === today);
  const lines: LineSpec[] = [];
  if (menu) {
    const title = (slug: string) => (recipes ?? []).find((r) => r.slug === slug)?.title ?? null;
    lines.push({ key: 'menu', icon: 'menu', label: tr('fm.cat.menu'), value: tr('fm.menu.count', { count: menu.items.length }),
      sub: menu.items.map((i) => [mealLabel(i.meal as Meal), title(i.recipe_slug)].filter(Boolean).join(' : ')).join(' · '),
      onPress: () => router.push({ pathname: '/meals/menu', params: { day: String(menu.day) } } as never) });
  }
  if (pantry.length) {
    const last = pantry[0];
    lines.push({ key: 'pantry', icon: 'archive', label: tr('fm.cat.pantry'), value: tr('fm.pantry.count', { count: pantry.length }),
      sub: pantry.slice(0, 4).map((s) => (s.ingredient_key ? INGREDIENTS[s.ingredient_key]?.name : null) ?? s.label).join(', '),
      onPress: () => router.push({ pathname: '/meals/pantry', params: { item: last.id } } as never) });
  }
  return <Panel lines={lines} testID="fm-cat-feeding" />;
}

function VaccineLines({ child }: { child: Child }) {
  const v = useVaccinations(child.id).data ?? [];
  const a = useVaccineAppointments(child.id).data ?? [];
  const on = vaccinesOn(v, a, todayISO(), dayOfStamp);
  const lines: LineSpec[] = [];
  if (on.given.length) lines.push({ key: 'vaccines', icon: 'shield', label: tr('fm.cat.vaccines', { name: child.first_name }), value: tr('fm.vx.count', { count: on.given.length }),
    sub: on.given.map((x) => x.vaccine).join(', '),
    onPress: () => router.push({ pathname: '/child/[id]/vaccines', params: { id: child.id, vax: on.given[0].id } } as never) });
  if (on.appts.length) lines.push({ key: 'vaccine-appt', icon: 'calendar', label: tr('fm.cat.vaccineAppt', { name: child.first_name }), value: on.appts[0].title,
    sub: formatDate(on.appts[0].starts_at, { hour: '2-digit', minute: '2-digit' }),
    onPress: () => router.push({ pathname: '/child/[id]/vaccines', params: { id: child.id } } as never) });
  return <Panel lines={lines} testID="fm-cat-vaccines" />;
}

export function FinishCategory({ category }: { category: 'feeding' | 'health' }) {
  const { subject } = useActiveSubject();
  const { data: children } = useChildren();
  if (category === 'feeding') return <FeedingLines />;
  const child = subject?.type === 'child' ? (children ?? []).find((c) => c.id === subject.id) ?? null : null;
  return child ? <VaccineLines key={child.id} child={child} /> : null;
}
