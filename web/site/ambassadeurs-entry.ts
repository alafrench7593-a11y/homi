/**
 * Page publique « Ambassadeurs » (/ambassadeurs/) : conditions lues EN DIRECT dans Supabase (vue publique
 * ambassador_terms_public, version active) ; simulateur calculé avec le MÊME module que l'application
 * (src/lib/ambassador/commission.ts). Aucun taux ni prix écrit dans la page : si les conditions ne se chargent pas, la
 * page le dit au lieu d'afficher un chiffre.
 * Lien de recommandation : ?ref=CODE sur n'importe quelle page du site → gardé sur l'appareil (homi.ref, 60 jours) ;
 * la web app le propose après l'inscription (jamais appliqué sans la personne).
 */
import { euros, rateFor, simulate, split, type AmbassadorTerms } from '@/lib/ambassador/commission';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T | null;
const root = document.documentElement;
const SB_URL = root.dataset.sbUrl ?? '';
const SB_KEY = root.dataset.sbKey ?? '';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Compteur animé (désactivé avec « Réduire les animations ») */
function count(el: HTMLElement, cents: number, currency: string) {
  const from = Number(el.dataset.v ?? 0);
  el.dataset.v = String(cents);
  if (reduce || from === cents) { el.textContent = euros(cents, currency); return; }
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / 420);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = euros(Math.round(from + (cents - from) * e), currency);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function render(terms: AmbassadorTerms) {
  const cur = terms.reference.currency;
  const monthly = terms.reference.plans.find((p) => p.key === 'monthly');
  const s = monthly ? split(Math.round(monthly.price * 100), terms.reference.vat_rate, terms.reference.store_fee_rate, terms.base_rate) : null;
  // Chiffres des conditions (aucun en dur dans le HTML)
  const set = (k: string, v: string) => document.querySelectorAll<HTMLElement>(`[data-t="${k}"]`).forEach((e) => { e.textContent = v; });
  set('rate', `${terms.base_rate} %`);
  set('max', `${terms.max_rate} %`);
  set('months', String(terms.commission_months));
  set('threshold', euros(terms.payout_threshold_cents, cur));
  set('hold', String(terms.hold_days));
  if (monthly && s) {
    set('price', euros(Math.round(monthly.price * 100), cur));
    set('ht', euros(Math.round(monthly.price * 100) - s.taxCents, cur));
    set('vat', `${terms.reference.vat_rate} %`);
    set('fee', `${terms.reference.store_fee_rate} %`);
    set('fee-amount', euros(s.storeFeeCents, cur));
    set('net', euros(s.netCents, cur));
    set('per', euros(s.amountCents, cur));
    set('rest', euros(s.netCents - s.amountCents, cur));
  }
  if (terms.reference.trial_days) set('trial', String(terms.reference.trial_days));
  // Niveaux
  const tiers = $('#tiers');
  if (tiers) {
    tiers.innerHTML = '';
    for (const t of terms.tiers) {
      const li = document.createElement('li');
      li.className = 'card tier' + (t.enabled ? '' : ' tier-soon');
      li.innerHTML = `<b></b><span class="tier-rate"></span><span class="muted small"></span>`;
      (li.children[0] as HTMLElement).textContent = t.label;
      (li.children[1] as HTMLElement).textContent = `${t.rate} %`;
      (li.children[2] as HTMLElement).textContent = t.enabled ? (t.min_conversions ? `À partir de ${t.min_conversions} abonnés` : 'Dès l’inscription') : 'Bientôt (ouverture validée par HOMI)';
      tiers.appendChild(li);
    }
  }
  // Simulateur
  const range = $<HTMLInputElement>('#sim-n');
  const num = $<HTMLInputElement>('#sim-n-num');
  const tierSel = $<HTMLSelectElement>('#sim-tier');
  if (tierSel) {
    tierSel.innerHTML = '';
    for (const t of terms.tiers.filter((x) => x.enabled)) tierSel.add(new Option(`${t.label.replace(/^HOMI /, '')} · ${t.rate} %`, t.key));
  }
  const bars = $('#sim-bars');
  const update = () => {
    const n = Math.max(0, Math.min(100000, Math.floor(Number(num?.value ?? range?.value ?? 0)) || 0));
    const rate = rateFor(terms, tierSel?.value);
    const r = simulate(terms, n, rate);
    count($('#sim-monthly')!, r.monthlyCents, cur);
    count($('#sim-total')!, r.totalCents, cur);
    const p = $('#sim-per'); if (p) p.textContent = euros(r.perSubscriberCents, cur);
    const m = $('#sim-months'); if (m) m.textContent = String(r.months);
    if (bars) {
      bars.innerHTML = '';
      for (let i = 1; i <= r.months; i++) {
        const b = document.createElement('span');
        b.style.setProperty('--h', `${(i / r.months) * 100}%`);
        b.title = `Mois ${i} : ${euros(r.monthlyCents * i, cur)} cumulés`;
        bars.appendChild(b);
      }
    }
  };
  range?.addEventListener('input', () => { if (num) num.value = range.value; update(); });
  num?.addEventListener('input', () => { if (range) range.value = String(Math.min(Number(range.max), Number(num.value) || 0)); update(); });
  tierSel?.addEventListener('change', update);
  update();
  const cond = $('#conditions-text'); if (cond) cond.textContent = terms.conditions_md ?? '';
  const ver = $('#terms-version'); if (ver) ver.textContent = String(terms.version);
  root.classList.add('terms-ready');
}

async function load() {
  try {
    if (!SB_URL || !SB_KEY) throw new Error('config');
    const r = await fetch(`${SB_URL}/rest/v1/ambassador_terms_public?select=*`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
    if (!r.ok) throw new Error(String(r.status));
    const rows = (await r.json()) as AmbassadorTerms[];
    if (!rows[0]) throw new Error('closed');
    render(rows[0]);
  } catch {
    root.classList.add('terms-error');
  }
}

void load();
