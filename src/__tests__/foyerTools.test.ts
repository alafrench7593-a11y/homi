/**
 * Outils du foyer du 28/11/2026 — règles pures : dépenses (totaux, répartition, CSV), animaux (états des soins dates
 * saisies, âge, tâches), portions préparées (reste, échéance saisie), lecture (semaine sans culpabilité, plus lus),
 * bibliothèque d'histoires (12 histoires, 3 tranches, 5 langues complètes), routes et suppression des « bientôt ».
 */
import { setLocale, t } from '@/i18n';
import { APP_ROUTES } from '@/lib/routes.generated';
import { balance, expensesCsv, monthBounds, parseMoney, shiftMonth, totals, type Expense, type ExpenseCategory } from '@/features/expenses/domain';
import { careHistory, careStatus, careReminderLink, petAge, tasksFor, upcomingCares, type PetCare } from '@/features/pets/domain';
import { expiryAlerts, expiryStatus, portionsLeft, sortBatches, useByFromDays, type PortionBatch, type PortionUse } from '@/features/portions/domain';
import { isFavorite, mostRead, parseMinutes, weekStart, weekSummary } from '@/features/reading/domain';
import { bandForMonths, isStoryId, readingMinutes, STORIES, STORY_BANDS, STORY_IDS, storyText } from '@/content/stories';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, e: 'utf8'): string; readdirSync(p: string): string[] };

const exp = (p: Partial<Expense>): Expense => ({
  id: Math.random().toString(36).slice(2), household_id: 'h', amount: 10, spent_on: '2026-11-10', category: 'food', paid_by: 'A', payer_share: 50,
  child_id: null, candidate_id: null, note: null, ...p,
});

describe('dépenses familiales (186)', () => {
  it('lit un montant saisi (virgule, euro, espaces) et refuse nul, négatif, illisible ou trop précis', () => {
    expect(parseMoney('12,50')).toBe(12.5);
    expect(parseMoney(' 1 234,5 € ')).toBe(1234.5);
    expect(parseMoney('')).toBeNull();
    for (const bad of ['0', '-3', 'abc', '12,345', '200000']) expect(Number.isNaN(parseMoney(bad) as number)).toBe(true);
  });
  it('totaux du mois en centimes exacts, par catégorie et par personne', () => {
    const t1 = totals([exp({ amount: 0.1 }), exp({ amount: 0.2 }), exp({ amount: 395, category: 'childcare', paid_by: 'B' }), exp({ amount: 5, paid_by: null })]);
    expect(t1.total).toBe(400.3);
    expect(t1.byCategory).toEqual({ food: 5.3, childcare: 395 });
    expect(t1.byPayer).toEqual({ A: 0.3, B: 395, none: 5 });
  });
  it('répartition à parts égales : qui doit combien à qui', () => {
    const b = balance([exp({ amount: 100, paid_by: 'A' }), exp({ amount: 40, paid_by: 'B' })], ['A', 'B']);
    expect(b.paid).toEqual({ A: 100, B: 40 });
    expect(b.borne).toEqual({ A: 70, B: 70 });
    expect(b.net).toEqual({ A: 30, B: -30 });
    expect(b.transfers).toEqual([{ from: 'B', to: 'A', amount: 30 }]);
  });
  it('dépense « pour la personne qui a payé » (100 %) et part personnalisée', () => {
    const b = balance([exp({ amount: 60, paid_by: 'A', payer_share: 100 }), exp({ amount: 100, paid_by: 'B', payer_share: 30 })], ['A', 'B']);
    // A supporte 60 + 70 ; B supporte 30
    expect(b.borne).toEqual({ A: 130, B: 30 });
    expect(b.transfers).toEqual([{ from: 'A', to: 'B', amount: 70 }]);
  });
  it('centime d’arrondi : la somme supportée égale toujours la somme payée', () => {
    const b = balance([exp({ amount: 10, paid_by: 'A' }), exp({ amount: 0.01, paid_by: 'B' }), exp({ amount: 33.33, paid_by: 'C' })], ['A', 'B', 'C']);
    const sum = (r: Record<string, number>) => Math.round(Object.values(r).reduce((s, v) => s + v, 0) * 100);
    expect(sum(b.borne)).toBe(sum(b.paid));
    expect(Math.round(b.transfers.reduce((s, x) => s + x.amount, 0) * 100)).toBe(Math.round(Object.values(b.net).filter((v) => v > 0).reduce((s, v) => s + v, 0) * 100));
  });
  it('comptes équilibrés, payeur inconnu ou ancien membre laissé de côté', () => {
    const b = balance([exp({ amount: 50, paid_by: 'A' }), exp({ amount: 50, paid_by: 'B' }), exp({ amount: 20, paid_by: 'X' }), exp({ amount: 5, paid_by: null })], ['A', 'B']);
    expect(b.transfers).toEqual([]);
    expect(b.ignored).toBe(25);
  });
  it('un seul adulte : il supporte tout, aucun virement', () => {
    const b = balance([exp({ amount: 42, paid_by: 'A' })], ['A']);
    expect(b.borne).toEqual({ A: 42 });
    expect(b.transfers).toEqual([]);
  });
  it('mois : bornes et décalage (année comprise)', () => {
    expect(monthBounds('2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });
  it('export CSV : BOM, séparateur « ; », virgule décimale, total, cellule « formule » neutralisée', () => {
    const csv = expensesCsv([exp({ amount: 12.5, spent_on: '2026-11-02', note: '=SOMME(A1)' }), exp({ amount: 7, spent_on: '2026-11-01', paid_by: 'B', child_id: 'k' })], {
      date: 'Date', category: 'Catégorie', amount: 'Montant', paidBy: 'Payé par', payerShare: 'Part', child: 'Enfant', note: 'Note', total: 'Total', decimalComma: true,
      categories: { food: 'Alimentation' } as Record<ExpenseCategory, string>, nameOf: (id) => (id === 'A' ? 'Camille' : 'Sam'), childOf: (id) => (id ? 'Lina' : ''),
    });
    expect(csv.startsWith('﻿"Date";"Catégorie";"Montant"')).toBe(true);
    const lines = csv.trim().split('\r\n');
    expect(lines[1]).toBe('"2026-11-01";"Alimentation";"7,00";"Sam";"50";"Lina";""');
    expect(lines[2]).toContain('"\'=SOMME(A1)"');
    expect(lines[3]).toBe('"Total";"";"19,50";"";"";"";""');
  });
});

describe('animaux (189)', () => {
  const care = (p: Partial<PetCare>): PetCare => ({ id: 'c', household_id: 'h', pet_id: 'p', kind: 'vaccine', label: null, done_on: null, next_due: null, note: null, ...p });
  it('état d’un soin d’après la date SAISIE : en retard, bientôt, prévu, sans prochaine date', () => {
    expect(careStatus(care({ next_due: '2026-11-19' }), '2026-11-20')).toBe('overdue');
    expect(careStatus(care({ next_due: '2026-11-30' }), '2026-11-20')).toBe('soon');
    expect(careStatus(care({ next_due: '2027-01-30' }), '2026-11-20')).toBe('planned');
    expect(careStatus(care({ done_on: '2026-11-01' }), '2026-11-20')).toBe('done');
  });
  it('prochains soins triés, historique du plus récent ; aucun soin inventé', () => {
    const list = [care({ id: 'a', next_due: '2027-02-01', done_on: '2026-02-01' }), care({ id: 'b', next_due: '2026-12-01' }), care({ id: 'c', done_on: '2026-10-01' })];
    expect(upcomingCares(list).map((c) => c.id)).toEqual(['b', 'a']);
    expect(careHistory(list).map((c) => c.id)).toEqual(['c', 'a']);
    expect(upcomingCares([])).toEqual([]);
  });
  it('âge en années et mois révolus ; rien sans date ou date future', () => {
    expect(petAge('2022-11-21', '2026-11-20')).toEqual({ years: 3, months: 11 });
    expect(petAge('2026-05-20', '2026-11-20')).toEqual({ years: 0, months: 6 });
    expect(petAge(null, '2026-11-20')).toBeNull();
    expect(petAge('2027-01-01', '2026-11-20')).toBeNull();
  });
  it('tâches récurrentes adaptées à l’espèce (missions « Animaux »)', () => {
    expect(tasksFor('dog').map((t) => t.key)).toEqual(['feed', 'walk']);
    expect(tasksFor('cat').map((t) => t.key)).toEqual(['feed', 'litter']);
    expect(tasksFor('fish').map((t) => t.key)).toEqual(['feed', 'cage']);
    expect(tasksFor('dog').every((t) => t.category === 'pets')).toBe(true);
    expect(careReminderLink('p1', 'c1')).toBe('/family/pets/p1?care=c1');
  });
});

describe('portions préparées (122)', () => {
  const batch = (p: Partial<PortionBatch>): PortionBatch => ({ id: 'b', household_id: 'h', child_id: null, label: 'Purée', recipe_slug: null, portions_total: 8, prepared_on: '2026-11-14', storage: 'freezer', use_by: null, note: null, ...p });
  const use = (portion_id: string, count: number): PortionUse => ({ id: Math.random().toString(36), household_id: 'h', portion_id, count, used_at: '2026-11-15T11:00:00Z', used_by: 'A' });
  it('reste = préparé − utilisations du lot (jamais négatif)', () => {
    expect(portionsLeft(batch({}), [use('b', 2), use('b', 1), use('x', 5)])).toBe(5);
    expect(portionsLeft(batch({ portions_total: 2 }), [use('b', 3)])).toBe(0);
  });
  it('échéance d’après la date saisie : dépassée, aujourd’hui, bientôt, à venir, aucune', () => {
    expect(expiryStatus('2026-11-19', '2026-11-20')).toBe('expired');
    expect(expiryStatus('2026-11-20', '2026-11-20')).toBe('today');
    expect(expiryStatus('2026-11-22', '2026-11-20')).toBe('soon');
    expect(expiryStatus('2026-12-20', '2026-11-20')).toBe('ok');
    expect(expiryStatus(null, '2026-11-20')).toBe('none');
  });
  it('date limite depuis un nombre de jours SAISI ; refus d’un nombre invalide', () => {
    expect(useByFromDays('2026-11-14', 30)).toBe('2026-12-14');
    expect(useByFromDays('2026-11-14', 0)).toBe('2026-11-14');
    expect(useByFromDays('2026-11-14', -1)).toBeNull();
    expect(useByFromDays('2026-11-14', 1.5)).toBeNull();
  });
  it('tri : lots restants par échéance (sans date en dernier), lots terminés à part ; alertes seulement s’il en reste', () => {
    const a = batch({ id: 'a', use_by: '2026-12-10' }); const b = batch({ id: 'b', use_by: '2026-11-21' }); const c = batch({ id: 'c' });
    const d = batch({ id: 'd', portions_total: 1, use_by: '2026-11-19' });
    const uses = [use('d', 1)];
    const s = sortBatches([a, b, c, d], uses);
    expect(s.active.map((x) => x.id)).toEqual(['b', 'a', 'c']);
    expect(s.finished.map((x) => x.id)).toEqual(['d']);
    expect(expiryAlerts([a, b, c, d], uses, '2026-11-20').map((x) => x.id)).toEqual(['b']);
  });
  it('aucune durée de conservation codée dans l’outil (le parent la saisit ; la recette garde ses sources)', () => {
    const src = fs.readFileSync('src/features/portions/domain.ts', 'utf8') + fs.readFileSync('src/app/meals/portions.tsx', 'utf8');
    expect(/\b(24|48|72)\s*h\b|jours?\s+au\s+(congélateur|réfrigérateur)|days?\s+in\s+the\s+(freezer|fridge)/i.test(src)).toBe(false);
  });
});

describe('lecture (133)', () => {
  const log = (read_on: string, title: string, minutes: number | null = null) => ({ read_on, title, minutes });
  it('semaine du lundi au dimanche : jours lus, minutes, livres différents', () => {
    expect(weekStart('2026-11-20')).toBe('2026-11-16'); // vendredi → lundi
    expect(weekStart('2026-11-22')).toBe('2026-11-16'); // dimanche
    const w = weekSummary([log('2026-11-16', 'La lune', 6), log('2026-11-16', 'Petit Ours', 4), log('2026-11-19', 'la  lune ', 5), log('2026-11-12', 'Ancien', 9)], '2026-11-20');
    expect(w.days.map((d) => d.read)).toEqual([true, false, false, true, false, false, false]);
    expect(w.daysRead).toBe(2);
    expect(w.minutes).toBe(15);
    expect(w.books).toBe(2);
  });
  it('les plus lus (titres regroupés sans tenir compte de la casse) et favoris', () => {
    const top = mostRead([log('2026-11-01', 'La lune'), log('2026-11-05', 'Petit Ours'), log('2026-11-09', 'la lune')], 5);
    expect(top[0]).toEqual({ title: 'La lune', count: 2, last: '2026-11-09' });
    expect(isFavorite([{ child_id: 'k', title: 'LA LUNE' }], 'k', ' la lune')).toBe(true);
    expect(isFavorite([{ child_id: 'k', title: 'La lune' }], 'k2', 'La lune')).toBe(false);
  });
  it('durée facultative : entier de 1 à 300', () => {
    expect(parseMinutes('')).toBeNull();
    expect(parseMinutes('12')).toBe(12);
    for (const bad of ['0', '301', '1.5', 'dix']) expect(parseMinutes(bad)).toBe('bad');
  });
  it('aucune gamification culpabilisante dans les textes (série « cassée », retard, objectif manqué)', () => {
    const fr = fs.readFileSync('src/i18n/fr/foyer28.ts', 'utf8').split('\n').filter((l) => l.includes("'rd.") || l.includes("'st."));
    expect(fr.join('\n')).not.toMatch(/série|cass|manqu|objectif|retard|dommage|record/i);
  });
});

describe('bibliothèque d’histoires (134)', () => {
  it('12 histoires originales, 4 par tranche d’âge 2–4 / 4–6 / 6–10', () => {
    expect(STORIES).toHaveLength(12);
    expect(new Set(STORIES.map((s) => s.id)).size).toBe(12);
    for (const b of STORY_BANDS) expect(STORIES.filter((s) => s.band === b)).toHaveLength(4);
    expect([...STORY_IDS].sort()).toEqual(STORIES.map((s) => s.id).sort());
  });
  it('chaque langue a chaque histoire, avec le même nombre de paragraphes que le français, sans texte vide', () => {
    for (const lang of ['en', 'de', 'es', 'it']) {
      for (const s of STORIES) {
        const fr = storyText(s.id, 'fr'); const tx = storyText(s.id, lang);
        expect([lang, s.id, tx.paras.length]).toEqual([lang, s.id, fr.paras.length]);
        expect(tx.title).not.toBe(fr.title);
        expect(tx.paras.every((p) => p.trim().length > 10)).toBe(true);
      }
    }
  });
  it('longueur adaptée à l’âge : les histoires des plus grands sont plus longues', () => {
    const words = (id: (typeof STORY_IDS)[number]) => storyText(id, 'fr').paras.join(' ').split(/\s+/).length;
    const avg = (b: string) => STORIES.filter((s) => s.band === b).reduce((n, s) => n + words(s.id), 0) / 4;
    expect(avg('2-4')).toBeLessThan(avg('4-6'));
    expect(avg('4-6')).toBeLessThan(avg('6-10'));
    expect(readingMinutes(storyText('petite_lune', 'fr'))).toBeGreaterThanOrEqual(1);
  });
  it('ton doux : aucun mot effrayant ou violent', () => {
    const all = STORIES.flatMap((s) => ['fr', 'en'].map((l) => storyText(s.id, l)).flatMap((x) => [x.title, ...x.paras])).join(' ');
    expect(all.replace(/the rain sang/g, '')).not.toMatch(/\b(morte?|mourir|tuer|tué|sang|monstres?|sorcières?|cauchemars?|hurl\w*|dead|dies?|killed|kills?|blood|monsters?|witch(es)?|nightmares?|scream\w*)\b/i);
  });
  it('tranche conseillée selon l’âge ; identifiant inconnu refusé', () => {
    expect(bandForMonths(13)).toBe('2-4');
    expect(bandForMonths(60)).toBe('4-6');
    expect(bandForMonths(90)).toBe('6-10');
    expect(bandForMonths(null)).toBeNull();
    expect(isStoryId('phare')).toBe(true);
    expect(isStoryId('../x')).toBe(false);
  });
});

describe('écrans, textes et mentions « bientôt »', () => {
  it('routes des outils', () => {
    for (const r of ['/family/expenses', '/family/pets', '/family/pets/[id]', '/meals/portions', '/reading', '/reading/stories', '/reading/story/[id]']) expect(APP_ROUTES).toContain(r);
  });
  it('plus aucun « bientôt » pour les animaux, la photo de produit ni les articles de fertilité', () => {
    const files = ['src/app/family/missions/new.tsx', 'src/features/stocks/StockForm.tsx', 'src/app/meals/shopping.tsx', 'src/components/Fertility.tsx'];
    const src = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
    expect(src).not.toMatch(/mis\.form\.pet'|stk\.form\.petSoon|shp\.photoSoon/);
    for (const lang of ['fr', 'en', 'de', 'es', 'it']) {
      const ui5 = fs.readFileSync(`src/i18n/${lang}/ui5.ts`, 'utf8').split('\n').filter((l) => l.includes('u5.fert.soon')).map((l) => l.split(':').slice(1).join(':')).join(' ');
      expect([lang, /bientôt|soon|bald|pronto|presto|próximamente/i.test(ui5)]).toEqual([lang, false]);
    }
  });
  it('textes traduits : un écran en allemand n’affiche pas de français', () => {
    setLocale('de');
    expect(t('fx.title')).toBe('Familienausgaben');
    expect(t('pet.ageYears', { count: 2, months: 3 })).toBe('2 Jahre und 3 Monate');
    setLocale('fr');
    expect(t('pet.ageYears', { count: 1, months: 4 })).toBe('1 an et 4 mois');
    expect(t('fx.monthTotal', { amount: '10 €', count: 0 })).toBe('Aucune dépense ce mois-ci');
  });
});
