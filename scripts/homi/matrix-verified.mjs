#!/usr/bin/env node
/**
 * Audit 10 — matrice outil → résultat (une ligne par outil du catalogue MATRICE_OUTILS.csv).
 *
 * Assemble les grilles des audits : tools_entry.csv (n° 1, ouverture depuis le point d'entrée), tools_saisie.csv (n° 5),
 * tools_suivi.csv (n° 6), tools_foyer.csv (n° 7, rapproché par l'adresse), tools_fiabilite.csv (n° 8, rapproché par
 * le parcours) et le statut de refonte de HOMI_SCREEN_INVENTORY.csv ; ajoute la contre-vérification de l'audit 10
 * (scripts E2E rejoués : docs/audit/10_e2e.json, `{ "<script>": "vert" | "rouge : cause" }`).
 *
 * Statut final : « corrigé » si une source profonde (5 à 8) a corrigé ; sinon « validé » si une source l'a vérifié
 * (au minimum l'ouverture, audit 1 : profondeur indiquée) ; sinon « bloqué » (cause et test restant). Les réserves
 * (parties non exécutables sur le web, services réels) restent indiquées même quand le parcours web est validé.
 *
 * Usage : node scripts/homi/matrix-verified.mjs   → docs/audit/MATRICE_OUTILS_VERIFIEE.csv (+ totaux affichés)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const AUDIT = path.join(ROOT, 'docs', 'audit');

function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x !== ''));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}
const read = (f) => parseCsv(fs.readFileSync(f, 'utf8'));
const csvCell = (v) => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

/** Adresse comparable : sans « /(tabs) », identifiants d'enfant → :id */
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const norm = (r) => (r || '').trim().replace('/(tabs)', '').replace(UUID, ':id').replace(/\/c1\b/g, '/:id').replace(/=c1\b/g, '=:id') || '';
const base = (r) => norm(r).split('?')[0];

const catalog = read(path.join(ROOT, 'MATRICE_OUTILS.csv'));
const inventory = Object.fromEntries(read(path.join(ROOT, 'HOMI_SCREEN_INVENTORY.csv')).filter((r) => r.type_ligne === 'outil').map((r) => [r.outil_id, r]));
const entry = read(path.join(AUDIT, 'tools_entry.csv'));
const saisie = read(path.join(AUDIT, 'tools_saisie.csv'));
const suivi = read(path.join(AUDIT, 'tools_suivi.csv'));
const foyer = read(path.join(AUDIT, 'tools_foyer.csv'));
const fiab = read(path.join(AUDIT, 'tools_fiabilite.csv'));
const e2ePath = path.join(AUDIT, '10_e2e.json');
const e2e = fs.existsSync(e2ePath) ? JSON.parse(fs.readFileSync(e2ePath, 'utf8')) : {};

/** Parcours de l'audit 8 → adresses concernées */
const FIAB_ROUTES = {
  'tâches': ['/family', '/family/routines', '/family/brain-dump', '/family/domains', '/family/notebook'],
  courses: ['/meals/shopping', '/lists'],
  missions: ['/family/missions'],
  stocks: ['/family/stocks'],
  'médicaments': ['/medications'],
  'rendez-vous': ['/appointments'],
  documents: ['/documents'],
  'humeur / journal': ['/me/mood', '/journal', '/me/diary'],
  'biberon / sommeil / couches': ['/bottle', '/bottle/history', '/track/bottle', '/track/breastfeed', '/track/diaper', '/night', '/sleep', '/track'],
  "demande d'aide (SOS relais)": ['/family/nights'],
};
const fiabKey = (p) => Object.keys(FIAB_ROUTES).find((k) => p === k || p.startsWith(`${k} `));

const kind = (s) => {
  const t = (s || '').toLowerCase();
  // « bloqué (caméra…) ; parcours web validé » : le parcours web est vérifié, la partie native reste en réserve
  if (t.includes('parcours web validé')) return 'validé';
  if (t.startsWith('corrigé')) return 'corrigé';
  if (t.startsWith('validé') || t.startsWith('ok')) return 'validé';
  if (t.startsWith('limite')) return 'validé';
  if (t.startsWith('bloqué')) return 'bloqué';
  return '';
};
/** Scripts E2E cités par une preuve → résultat du rejeu (audit 10) */
const replay = (proof) => {
  const names = [...new Set([...(proof || '').matchAll(/e2e\/([a-z0-9_]+)\.py|\b(audit_[a-z]+|missions_scenario_a|courses_stocks_scenarios|biberon_v3|scanner_v3|humeur_journal_v3|home_today|accueil_missions_v3)\b/g)].map((m) => m[1] || m[2]))];
  return names.filter((n) => e2e[n]).map((n) => `${n} : ${e2e[n]}`);
};

const keyCount = catalog.reduce((m, t) => m.set(t.outil_cle, (m.get(t.outil_cle) ?? 0) + 1), new Map());
const out = [];
for (const tool of catalog) {
  const id = tool.id;
  const route = id.slice(id.indexOf(':') + 1);
  const ev = [];
  // même adresse, ou même clé d'outil quand la clé est propre à une ligne du catalogue (la tuile peut ouvrir une autre adresse)
  for (const e of entry.filter((x) => (x.route && norm(x.route) === norm(route)) || (x.id === tool.outil_cle && keyCount.get(tool.outil_cle) === 1))) {
    ev.push({ src: 1, deep: false, statut: e.ouverture === 'OK' ? 'validé' : '', cause: e.ouverture === 'OK' ? '' : e.observation, entree: e.point_entree, parcours: 'ouverture depuis le point d’entrée réel', attendu: 'écran ouvert, Retour cohérent', observe: e.observation, preuve: 'e2e/audit_navigation.py' });
  }
  for (const [src, rows] of [[5, saisie], [6, suivi]]) {
    for (const s of rows.filter((x) => x.outil_id === id)) {
      ev.push({ src, deep: true, statut: kind(s.statut), cause: /bloqu/i.test(s.statut) ? s.statut : '', entree: s['point d’entrée'], parcours: s['parcours testé'] || s['jeu de test'], attendu: s['résultat attendu'], observe: s['résultat observé'], preuve: s['test de preuve'] });
    }
  }
  for (const f of foyer) {
    const pts = f.point_entree.split(/[;«]/).map((p) => p.trim().split(' ')[0]).filter((p) => p.startsWith('/'));
    if (pts.some((p) => base(p).replace('/[id]', '') === base(route) || (base(route).length > 1 && base(p).startsWith(`${base(route)}/`) && base(route) !== '/family'))) {
      ev.push({ src: 7, deep: true, statut: kind(f.statut), cause: /bloqu/i.test(f.statut) ? `${f.statut} — ${f.resultat_observe}` : '', entree: f.point_entree, parcours: f.outil_parcours, attendu: f.resultat_attendu, observe: f.resultat_observe, preuve: f.test_preuve });
    }
  }
  for (const f of fiab) {
    const k = fiabKey(f.parcours);
    if (k && FIAB_ROUTES[k].includes(base(route))) {
      ev.push({ src: 8, deep: true, statut: kind(f.statut), cause: f.statut.startsWith('limite') ? `limite : ${f['observé (avant)']}` : '', entree: '', parcours: `${f.parcours} — ${f['scénario de panne']}`, attendu: f.attendu, observe: f['observé (avant)'], preuve: f.preuve });
    }
  }
  const deep = ev.filter((e) => e.deep);
  let statut; let cause = '';
  if (deep.some((e) => e.statut === 'corrigé')) statut = 'corrigé';
  else if (deep.some((e) => e.statut === 'validé')) statut = 'validé';
  else if (deep.some((e) => e.statut === 'bloqué')) statut = 'bloqué';
  else if (ev.some((e) => e.statut === 'validé')) statut = 'validé';
  else { statut = 'bloqué'; cause = ev.length ? ev.map((e) => e.cause).filter(Boolean).join(' | ') : 'aucun audit ne l’a ouvert (outil hors démonstration ou adresse non rapprochée) — test restant : ouvrir depuis son point d’entrée'; }
  const reserves = ev.filter((e) => e.cause).map((e) => `[${e.src}] ${e.cause}`);
  if (statut === 'bloqué' && !cause) cause = reserves.join(' | ');
  if (statut === 'bloqué' && ev.some((e) => e.src === 1 && e.statut === 'validé')) {
    cause += ' — ouverture validée (audit 1, rejouée en audit 10) ; test restant : saisie et résultat de bout en bout';
  }
  const profondeur = deep.length ? 'parcours (saisie / résultat / foyer / panne)' : ev.length ? 'ouverture seulement (audit 1)' : 'aucune';
  const pick = (k) => [...new Set(ev.map((e) => e[k]).filter(Boolean))].join(' | ');
  const inv = inventory[id];
  const revalid = [...new Set(ev.flatMap((e) => replay(e.preuve)))];
  if (ev.some((e) => e.src === 1) && e2e.audit_navigation) revalid.unshift(`audit_navigation : ${e2e.audit_navigation}`);
  out.push({
    outil_id: id, libelle: tool.libelle_fr, theme: tool.theme_titre, ecran: tool.ecran,
    point_entree: pick('entree'), parcours: pick('parcours'), attendu: pick('attendu'), observe: pick('observe'),
    statut_final: statut, profondeur, cause_et_test_restant: statut === 'bloqué' ? cause : reserves.join(' | '),
    sources: [...new Set(ev.map((e) => `audit ${e.src}`))].join(' ; ') || '—',
    preuves: pick('preuve'), refonte_inventaire: inv ? `écrans refondus : ${inv.ecrans_refondus} ; parcours vérifié : ${inv.parcours_verifie}` : '',
    rejeu_audit10: [...new Set(revalid)].join(' ; '),
  });
}

const cols = Object.keys(out[0]);
fs.writeFileSync(path.join(AUDIT, 'MATRICE_OUTILS_VERIFIEE.csv'), [cols.join(','), ...out.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n');
const count = (f) => out.filter(f).length;
const totals = {
  inventories: out.length,
  valides: count((r) => r.statut_final === 'validé'),
  valides_ouverture_seule: count((r) => r.statut_final === 'validé' && r.profondeur.startsWith('ouverture')),
  corriges: count((r) => r.statut_final === 'corrigé'),
  bloques: count((r) => r.statut_final === 'bloqué'),
  bloques_sans_source: count((r) => r.statut_final === 'bloqué' && r.sources === '—'),
  avec_reserves: count((r) => r.statut_final !== 'bloqué' && r.cause_et_test_restant),
};
console.log(JSON.stringify(totals, null, 1));
