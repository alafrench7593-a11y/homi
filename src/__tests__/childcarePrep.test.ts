/**
 * Avant la garde (25/11/2026) — règles pures : coût mensuel avant aides, tri, appariement arrivée → départ, totaux,
 * planning et absences, export CSV ; textes : modèle d'entretien et de visite traduit, aucune aide chiffrée.
 */
import { setLocale, t } from '@/i18n';
import { DICTIONARIES } from '@/i18n/dictionaries';
import { APP_ROUTES } from '@/lib/routes.generated';
import {
  INTERVIEW_TEMPLATE, OFFICIAL, VISIT_TEMPLATE, activeItems, hoursCsv, isoWeekday, localDay, monthEnd, mondayOfWeek, monthlyCost, normTime, pairShifts, parseAmount,
  periodSummary, plannedOn, progressOf, sortCandidates, validDay, type Absence, type Candidate, type PrepItem, type PunchEvent, type Schedule,
} from '@/features/childcarePrep/domain';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, e: 'utf8'): string };
const cand = (p: Partial<Candidate>): Candidate => ({
  id: 'c', household_id: 'h', name: 'X', kind: 'assmat', status: 'to_contact', phone: null, email: null, address: null, availability: null,
  rate_mode: 'hourly', hourly_rate: null, hours_per_week: null, weeks_per_year: 52, days_per_week: null, monthly_fee: null, meal_fee_per_day: null,
  upkeep_fee_per_day: null, other_monthly: null, interview_at: null, notes: null, created_at: '2026-11-01T00:00:00Z', ...p,
});
const at = (day: string, hm: string) => new Date(`${day}T${hm}:00`).toISOString();
const ev = (id: string, kind: 'arrival' | 'departure', day: string, hm: string): PunchEvent => ({ id, kind, at: at(day, hm), child_id: 'k' });

describe('coût mensuel (avant aides)', () => {
  it('taux horaire × heures × semaines ÷ 12, plus les frais par jour', () => {
    const c = monthlyCost(cand({ hourly_rate: 4.2, hours_per_week: 40, weeks_per_year: 52, days_per_week: 5, meal_fee_per_day: 4.5, upkeep_fee_per_day: 3.6 }));
    expect(c.base).toBe(728); // 4,20 × 40 × 52 / 12
    expect(c.meals).toBe(97.5); // 4,5 × 5 × 52 / 12
    expect(c.upkeep).toBe(78);
    expect(c.total).toBe(903.5);
    expect(c.hoursPerMonth).toBeCloseTo(173.33, 2);
    expect(c.complete).toBe(true);
  });
  it('forfait mensuel ; semaines réduites ; tarif incomplet signalé', () => {
    expect(monthlyCost(cand({ rate_mode: 'monthly', monthly_fee: 380, other_monthly: 20 })).total).toBe(400);
    expect(monthlyCost(cand({ hourly_rate: 10, hours_per_week: 12, weeks_per_year: 46 })).base).toBe(460);
    expect(monthlyCost(cand({ hourly_rate: 10 })).complete).toBe(false);
    expect(monthlyCost(cand({ rate_mode: 'monthly' })).complete).toBe(false);
  });
  it('montants saisis : virgule, euro, illisible', () => {
    expect(parseAmount('4,20')).toBe(4.2);
    expect(parseAmount(' 380 € ')).toBe(380);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNaN();
  });
  it('tri par coût : sans tarif puis écartées en dernier', () => {
    const list = [
      cand({ id: 'a', name: 'A', rate_mode: 'monthly', monthly_fee: 500 }),
      cand({ id: 'b', name: 'B', rate_mode: 'monthly', monthly_fee: 300, status: 'dismissed' }),
      cand({ id: 'c', name: 'C' }),
      cand({ id: 'd', name: 'D', rate_mode: 'monthly', monthly_fee: 400 }),
    ];
    expect(sortCandidates(list, 'cost').map((c) => c.id)).toEqual(['d', 'a', 'c', 'b']);
    expect(sortCandidates(list, 'name').map((c) => c.id)).toEqual(['a', 'c', 'd', 'b']);
  });
});

describe('questions et checklist', () => {
  const items: PrepItem[] = [
    { id: '1', household_id: 'h', kind: 'interview', template_key: 'day', label: null, position: 10, archived: false },
    { id: '2', household_id: 'h', kind: 'interview', template_key: 'experience', label: null, position: 0, archived: false },
    { id: '3', household_id: 'h', kind: 'interview', template_key: null, label: 'Couches lavables ?', position: 20, archived: true },
    { id: '4', household_id: 'h', kind: 'visit', template_key: 'hygiene', label: null, position: 0, archived: false },
  ];
  it('ordre, retrait sans perte, avancement par candidate', () => {
    expect(activeItems(items, 'interview').map((i) => i.id)).toEqual(['2', '1']);
    const answers = [
      { household_id: 'h', candidate_id: 'c', item_id: '2', answer: '12 ans', checked: false },
      { household_id: 'h', candidate_id: 'c', item_id: '3', answer: 'oui', checked: false },
      { household_id: 'h', candidate_id: 'c', item_id: '4', answer: null, checked: true },
      { household_id: 'h', candidate_id: 'z', item_id: '1', answer: 'autre', checked: false },
    ];
    expect(progressOf(items, answers, 'c', 'interview')).toEqual({ done: 1, total: 2 });
    expect(progressOf(items, answers, 'c', 'visit')).toEqual({ done: 1, total: 1 });
  });
  it.each(Object.keys(DICTIONARIES))('« %s » : chaque question du modèle est traduite', (l) => {
    for (const k of INTERVIEW_TEMPLATE) expect(DICTIONARIES[l][`gp.q.${k}`]).toBeTruthy();
    for (const k of VISIT_TEMPLATE) expect(DICTIONARIES[l][`gp.v.${k}`]).toBeTruthy();
  });
});

describe('planning, absences, heures', () => {
  const sched: Schedule[] = [{ id: 's', household_id: 'h', child_id: 'k', label: 'Chez Sophie', starts_on: '2026-11-01', ends_on: null,
    days: [{ wd: 1, start: '08:30', end: '17:30' }, { wd: 3, start: '09:00', end: '12:00' }] }];
  const absences: Absence[] = [
    { id: 'a1', household_id: 'h', child_id: 'k', kind: 'child', from_on: '2026-11-18', to_on: '2026-11-18', caregiver_id: null, note: null },
    { id: 'a2', household_id: 'h', child_id: 'k', kind: 'caregiver_leave', from_on: '2026-11-23', to_on: '2026-11-24', caregiver_id: 'n', note: null },
  ];
  it('jours de la semaine, lundi de la semaine, fin de mois', () => {
    // jour d'affichage en date LOCALE (pas minuit UTC, qui tombe la veille à l'ouest de Greenwich)
    const d = localDay('2026-11-01');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 1]);
    expect(isoWeekday('2026-11-16')).toBe(1);
    expect(isoWeekday('2026-11-22')).toBe(7);
    expect(mondayOfWeek('2026-11-22')).toBe('2026-11-16');
    expect(monthEnd('2026-02-10')).toBe('2026-02-28');
  });
  it('heures saisies normalisées ; créneau valide', () => {
    expect(normTime('8h30')).toBe('08:30');
    expect(normTime('17')).toBe('17:00');
    expect(normTime('25:00')).toBeNull();
    expect(validDay({ wd: 1, start: '09:00', end: '08:00' })).toBe(false);
  });
  it('prévu = planning sauf absence, congé ou fermeture', () => {
    expect(plannedOn('2026-11-16', sched, absences).plannedMin).toBe(540);
    expect(plannedOn('2026-11-18', sched, absences)).toMatchObject({ plannedMin: 0, off: true });
    expect(plannedOn('2026-10-26', sched, absences).plannedMin).toBe(0); // avant le début du planning
  });
  it('appariement arrivée → départ, oublis sans durée inventée', () => {
    const shifts = pairShifts([
      ev('1', 'arrival', '2026-11-16', '08:30'), ev('2', 'departure', '2026-11-16', '17:15'),
      ev('3', 'arrival', '2026-11-17', '08:40'), // départ oublié
      ev('4', 'arrival', '2026-11-19', '09:00'), ev('5', 'departure', '2026-11-19', '12:00'),
      ev('6', 'departure', '2026-11-20', '18:00'), // arrivée oubliée
    ]);
    expect(shifts.map((s) => [s.date, s.minutes])).toEqual([['2026-11-16', 525], ['2026-11-17', 0], ['2026-11-19', 180], ['2026-11-20', 0]]);
    const sum = periodSummary('2026-11-16', '2026-11-22', shifts, sched, absences);
    expect(sum).toEqual({ workedMin: 705, plannedMin: 540, childDays: 1, leaveDays: 0, closureDays: 0, incomplete: 2 });
    expect(periodSummary('2026-11-23', '2026-11-29', [], sched, absences)).toMatchObject({ plannedMin: 180, leaveDays: 2 }); // lundi en congé, mercredi gardé
  });
  it('export CSV : lignes, absence, total décimal, mention sans valeur légale, cellules protégées', () => {
    const shifts = pairShifts([ev('1', 'arrival', '2026-11-16', '08:30'), ev('2', 'departure', '2026-11-16', '17:15')]);
    const csv = hoursCsv('2026-11-16', '2026-11-18', shifts, [{ ...absences[0], note: '=HYPERLINK()' }], {
      date: 'Date', arrival: 'Arrivée', departure: 'Départ', duration: 'Durée', hours: 'Heures', absence: 'Absence', total: 'Total',
      notice: 'Sans valeur légale', kinds: { child: '=Enfant absent', caregiver_leave: 'Congé', closure: 'Fermeture' }, decimalComma: true,
    });
    const lines = csv.replace('﻿', '').trim().split('\r\n');
    expect(lines[0]).toBe('"Date";"Arrivée";"Départ";"Durée";"Heures";"Absence"');
    expect(lines[1]).toBe('"2026-11-16";"08:30";"17:15";"8 h 45";"8,75";""');
    expect(lines[2]).toBe('"2026-11-18";"";"";"";"";"\'=Enfant absent"');
    expect(lines[3]).toBe('"Total";"";"";"8 h 45";"8,75";""');
    expect(lines[4]).toBe('"Sans valeur légale";"";"";"";"";""');
  });
});

describe('textes et liens', () => {
  it('aucun montant ni pourcentage d’aide promis (CMG, crédit d’impôt)', () => {
    for (const d of Object.values(DICTIONARIES)) {
      for (const k of Object.keys(d).filter((x) => x.startsWith('gp.'))) {
        const v = JSON.stringify(d[k]);
        expect([k, /\d+\s?%|\d+\s?€/.test(v)]).toEqual([k, false]);
      }
    }
    setLocale('fr');
    expect(t('gp.bd.aidBody')).toMatch(/ne les calcule pas/);
    expect(t('gp.hr.legal')).toMatch(/pas de valeur légale/);
  });
  it('liens officiels : uniquement des adresses déjà sourcées dans les guides du dépôt', () => {
    const guides = ['src/content/articles/guide/b26.ts', 'src/content/articles/guide/b27.ts', 'src/content/articles/guide/bebe.ts', 'supabase/migrations/20261030000100_articles_guide.sql']
      .map((f) => fs.readFileSync(f, 'utf8')).join('\n').replace(/\$\{SP\}/g, 'https://www.service-public.gouv.fr/particuliers/vosdroits/');
    for (const s of Object.values(OFFICIAL)) expect([s.url, guides.includes(s.url)]).toEqual([s.url, true]);
  });
  it('routes « Avant la garde » présentes', () => {
    for (const r of ['/garde/prep', '/garde/prep/modes', '/garde/prep/candidats', '/garde/prep/fiche', '/garde/prep/entretien', '/garde/prep/visite',
      '/garde/prep/budget', '/garde/prep/planning', '/garde/prep/heures', '/garde/prep/absences']) expect(APP_ROUTES).toContain(r);
  });
  it('lien vers « Avant la garde » côté parent seulement sur /garde', () => {
    const src = fs.readFileSync('src/app/garde/index.tsx', 'utf8');
    expect(src).toMatch(/\{myKids\.length \? \([\s\S]{0,300}testID=\"care-open-prep\"/);
  });
});
