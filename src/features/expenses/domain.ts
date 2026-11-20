/**
 * Dépenses familiales (outil 186) — logique pure, testée (foyerTools.test.ts).
 * Montants calculés en centimes (aucune erreur d'arrondi) ; aucune connexion bancaire, aucun conseil financier :
 * l'application additionne seulement ce que les parents ont saisi.
 *
 * Répartition : chaque dépense payée par un adulte A avec une « part du payeur » p % : A supporte p % ; le reste est
 * partagé à parts égales entre les autres adultes retenus. Le solde de chacun = ce qu'il a payé − ce qu'il supporte ;
 * les virements proposés soldent les comptes avec le moins de mouvements possible (« qui doit combien à qui »).
 */
import { csvCell } from '@/lib/csv';
import type { ISODate } from '@/lib/domain/dates';

export const EXPENSE_CATEGORIES = ['food', 'children', 'childcare', 'health', 'housing', 'leisure', 'other'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string; household_id: string; amount: number; currency?: string; spent_on: ISODate; category: ExpenseCategory;
  paid_by: string | null; payer_share: number; child_id: string | null; candidate_id: string | null; note: string | null;
  created_by?: string | null; created_at?: string; updated_at?: string; _pending?: boolean;
}

/** PostgREST renvoie les numeric en texte : nombres. */
export function normalizeExpense(r: Expense): Expense {
  return { ...r, amount: Number(r.amount), payer_share: r.payer_share == null ? 50 : Number(r.payer_share) };
}

export const toCents = (n: number) => Math.round(n * 100);
export const fromCents = (c: number) => c / 100;

/** Montant saisi (« 12,50 », « 12.5 € ») → nombre ; null si vide ; NaN si illisible, nul, négatif ou trop grand. */
export function parseMoney(input: string): number | null {
  const s = input.replace(/[\s  €]/g, '').replace(',', '.');
  if (!s) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return Number.NaN;
  const n = Number(s);
  return n > 0 && n <= 100000 ? n : Number.NaN;
}

export const monthOf = (iso: ISODate) => iso.slice(0, 7);
export function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
export function monthBounds(month: string): { from: ISODate; to: ISODate } {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}
export const inRange = (e: Pick<Expense, 'spent_on'>, from: ISODate, to: ISODate) => e.spent_on >= from && e.spent_on <= to;

export interface Totals { total: number; byCategory: Partial<Record<ExpenseCategory, number>>; byPayer: Record<string, number>; count: number }
/** Totaux (en euros) d'une liste : par catégorie et par personne qui a payé (« none » : non renseigné). */
export function totals(list: Expense[]): Totals {
  const cat: Partial<Record<ExpenseCategory, number>> = {};
  const payer: Record<string, number> = {};
  let total = 0;
  for (const e of list) {
    const c = toCents(e.amount);
    total += c;
    cat[e.category] = (cat[e.category] ?? 0) + c;
    const k = e.paid_by ?? 'none';
    payer[k] = (payer[k] ?? 0) + c;
  }
  const out: Totals = { total: fromCents(total), byCategory: {}, byPayer: {}, count: list.length };
  for (const k of Object.keys(cat) as ExpenseCategory[]) out.byCategory[k] = fromCents(cat[k]!);
  for (const k of Object.keys(payer)) out.byPayer[k] = fromCents(payer[k]);
  return out;
}

export interface Transfer { from: string; to: string; amount: number }
export interface Balance {
  paid: Record<string, number>; borne: Record<string, number>; net: Record<string, number>; transfers: Transfer[];
  /** Dépenses laissées de côté : payées par une personne hors de la répartition, ou sans payeur. */
  ignored: number;
}

/** Répartition entre adultes sur une liste de dépenses (déjà filtrée sur la période). */
export function balance(list: Expense[], adults: string[]): Balance {
  const paid: Record<string, number> = {}; const borne: Record<string, number> = {};
  for (const a of adults) { paid[a] = 0; borne[a] = 0; }
  let ignored = 0;
  for (const e of list) {
    const c = toCents(e.amount);
    if (!e.paid_by || !adults.includes(e.paid_by)) { ignored += c; continue; }
    paid[e.paid_by] += c;
    const others = adults.filter((a) => a !== e.paid_by);
    const share = others.length ? Math.max(0, Math.min(100, e.payer_share)) : 100;
    const rest = c - Math.round((c * share) / 100);
    // le reste est réparti à parts égales ; le centime d'arrondi revient au premier dans l'ordre fourni
    const each = Math.floor(rest / Math.max(1, others.length));
    let left = rest - each * others.length;
    for (const o of others) { borne[o] += each + (left > 0 ? 1 : 0); if (left > 0) left -= 1; }
    borne[e.paid_by] += c - (others.length ? rest : 0);
  }
  const netC: Record<string, number> = {};
  for (const a of adults) netC[a] = paid[a] - borne[a];
  // virements : le plus gros débiteur rembourse le plus gros créancier, jusqu'à zéro
  const debt = adults.filter((a) => netC[a] < 0).map((a) => ({ a, v: -netC[a] })).sort((x, y) => y.v - x.v);
  const cred = adults.filter((a) => netC[a] > 0).map((a) => ({ a, v: netC[a] })).sort((x, y) => y.v - x.v);
  const transfers: Transfer[] = [];
  let i = 0; let j = 0;
  while (i < debt.length && j < cred.length) {
    const v = Math.min(debt[i].v, cred[j].v);
    if (v > 0) transfers.push({ from: debt[i].a, to: cred[j].a, amount: fromCents(v) });
    debt[i].v -= v; cred[j].v -= v;
    if (debt[i].v === 0) i++;
    if (cred[j].v === 0) j++;
  }
  const conv = (r: Record<string, number>) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, fromCents(v)]));
  return { paid: conv(paid), borne: conv(borne), net: conv(netC), transfers, ignored: fromCents(ignored) };
}

export interface ExpenseCsvLabels {
  date: string; category: string; amount: string; paidBy: string; payerShare: string; child: string; note: string;
  categories: Record<ExpenseCategory, string>; nameOf: (id: string | null) => string; childOf: (id: string | null) => string; decimalComma: boolean; total: string;
}
/** CSV (séparateur « ; », BOM pour Excel) : une ligne par dépense, puis le total. */
export function expensesCsv(list: Expense[], l: ExpenseCsvLabels): string {
  const num = (n: number) => (l.decimalComma ? n.toFixed(2).replace('.', ',') : n.toFixed(2));
  const rows: string[][] = [[l.date, l.category, l.amount, l.paidBy, l.payerShare, l.child, l.note]];
  const sorted = [...list].sort((a, b) => a.spent_on.localeCompare(b.spent_on));
  for (const e of sorted) {
    rows.push([e.spent_on, l.categories[e.category], num(e.amount), l.nameOf(e.paid_by), String(e.payer_share), l.childOf(e.child_id), e.note ?? '']);
  }
  rows.push([l.total, '', num(totals(list).total), '', '', '', '']);
  return `﻿${rows.map((r) => r.map((c) => csvCell(c)).join(';')).join('\r\n')}\r\n`;
}
