/**
 * Page publique « Ambassadeurs » (/ambassadeurs/) : MÊMES règles et MÊME simulateur que l'app
 * (src/lib/affiliateProgram.ts) — un seul programme, pas de prix d'abonnement affiché.
 * Lien de recommandation : ?ref=<code> (ou ?c= / ?f= pour campagne et fonctionnalité) sur cette page → code gardé sur
 * l'appareil sous la même clé que l'app (rattaché au compte après connexion) + clic anonyme compté.
 * Les boutons mènent à la web app : /ambassadors (programme, candidature) et /ambassadors/dashboard.
 */
import { normalizeCode, PENDING_KEY, PROGRAM, simulate } from '@/lib/affiliateProgram';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T | null;
const root = document.documentElement;
const SB_URL = root.dataset.sbUrl ?? '';
const SB_KEY = root.dataset.sbKey ?? '';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const euros = (minor: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(minor / 100);
const tag = (v: string | null) => (v && /^[a-z0-9-]{1,32}$/i.test(v) ? v.toLowerCase() : '');

function count(el: HTMLElement, minor: number) {
  const from = Number(el.dataset.v ?? 0);
  el.dataset.v = String(minor);
  if (reduce || from === minor) { el.textContent = euros(minor); return; }
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / 420);
    el.textContent = euros(Math.round(from + (minor - from) * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Chiffres du programme (aucun en dur dans le HTML)
const set = (k: string, v: string) => document.querySelectorAll<HTMLElement>(`[data-t="${k}"]`).forEach((e) => { e.textContent = v; });
set('rate', `${PROGRAM.percent} %`);
set('months', String(PROGRAM.months));
set('hold', String(PROGRAM.holdDays));
set('attribution', String(PROGRAM.attributionDays));
set('threshold', euros(PROGRAM.thresholdMinor));

// Simulateur
const net = $<HTMLInputElement>('#sim-net');
const range = $<HTMLInputElement>('#sim-n');
const num = $<HTMLInputElement>('#sim-n-num');
const bars = $('#sim-bars');
const update = () => {
  const n = Math.max(0, Math.min(100000, Math.floor(Number(num?.value ?? range?.value ?? 0)) || 0));
  const netMinor = Math.max(0, Math.round((Number(String(net?.value ?? '0').replace(',', '.')) || 0) * 100));
  const r = simulate(netMinor, n);
  count($('#sim-monthly')!, r.monthlyAtCruiseMinor);
  count($('#sim-total')!, r.totalMinor);
  const p = $('#sim-per'); if (p) p.textContent = euros(r.perSubscriberMinor);
  if (bars) {
    bars.innerHTML = '';
    const max = Math.max(1, ...r.byMonth);
    r.byMonth.forEach((v, i) => {
      const b = document.createElement('span');
      b.style.setProperty('--h', `${(v / max) * 100}%`);
      b.title = `Mois ${i + 1} : ${euros(v)}`;
      bars.appendChild(b);
    });
  }
};
range?.addEventListener('input', () => { if (num) num.value = range.value; update(); });
num?.addEventListener('input', () => { if (range) range.value = String(Math.min(Number(range.max), Number(num.value) || 0)); update(); });
net?.addEventListener('input', update);
update();
root.classList.add('terms-ready');

// Lien de recommandation ?ref=<code> : même clé et même format que l'app ; clic anonyme agrégé (aucun identifiant)
const q = new URLSearchParams(location.search);
const code = normalizeCode(q.get('ref'));
if (code) {
  const campaign = tag(q.get('c')); const feature = tag(q.get('f'));
  try { localStorage.setItem(PENDING_KEY, JSON.stringify({ code, source: 'link', campaign, feature, at: Date.now() })); } catch { /* navigation privée */ }
  if (SB_URL && SB_KEY) {
    void fetch(`${SB_URL}/rest/v1/rpc/affiliate_record_click`, {
      method: 'POST', headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_code: code, p_campaign: campaign, p_feature: feature }),
    }).catch(() => undefined);
  }
}
