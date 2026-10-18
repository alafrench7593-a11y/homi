/**
 * Export RGPD de toutes les données de la personne : fichier JSON (portabilité) et PDF lisible.
 * Les fichiers sont créés sur l'appareil puis partagés ; rien n'est envoyé ailleurs.
 */
import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { BRAND } from '@/config/brand';

const stamp = () => new Date().toISOString().slice(0, 10);

/** Fichier JSON : partage (téléphone) ou téléchargement (web). */
export async function exportJson(data: unknown): Promise<'file' | 'download' | 'text'> {
  const json = JSON.stringify(data, null, 2);
  const name = `${BRAND.slug}-export-${stamp()}.json`;
  if (Platform.OS === 'web') {
    const doc = (globalThis as { document?: Document }).document;
    if (doc && typeof URL !== 'undefined' && URL.createObjectURL) {
      const a = doc.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = name;
      a.click();
      return 'download';
    }
    return 'text';
  }
  if (await Sharing.isAvailableAsync()) {
    const file = new File(Paths.cache, name);
    if (file.exists) file.delete();
    file.create();
    file.write(json);
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Exporter mes données', UTI: 'public.json' });
    return 'file';
  }
  return 'text';
}

const SECTION_LABEL: Record<string, string> = {
  profile: 'Profil', personal: 'Données personnelles', households: 'Foyers', consents: 'Consentements', privacy_settings: 'Confidentialité',
  period_entries: 'Règles', symptom_logs: 'Symptômes', ovulation_tests: 'Tests d’ovulation', pregnancy_tests: 'Tests de grossesse',
  fertility_observations: 'Température et glaire', mood_checkins: 'Humeur', maternal_weights: 'Poids', bottles: 'Biberons', breastfeeds: 'Tétées',
  diapers: 'Couches', sleeps: 'Sommeil', meals: 'Repas', children: 'Enfants', pregnancies: 'Grossesses', appointments: 'Rendez-vous',
  documents: 'Documents', reminders: 'Rappels', assistant_conversations: 'Conversations avec l’assistant', parent_sleep_logs: 'Mon sommeil',
};

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const HIDDEN = new Set(['id', 'user_id', 'household_id', 'created_by', 'client_id', 'storage_path', 'photo_path', 'token_hash']);

function cell(v: unknown): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'oui' : 'non';
  if (Array.isArray(v)) return v.length ? v.map((x) => (typeof x === 'object' ? '…' : String(x))).join(', ') : '—';
  if (typeof v === 'object') return '…';
  const s = String(v);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? new Date(s).toLocaleString('fr-FR') : s;
}

function table(name: string, rows: Record<string, unknown>[]): string {
  if (!rows.length) return `<h3>${esc(SECTION_LABEL[name] ?? name)}</h3><p class="muted">Aucune donnée.</p>`;
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((c) => !HIDDEN.has(c)).slice(0, 8);
  const body = rows.slice(0, 500).map((r) => `<tr>${cols.map((c) => `<td>${esc(cell(r[c]))}</td>`).join('')}</tr>`).join('');
  const more = rows.length > 500 ? `<p class="muted">… et ${rows.length - 500} autres lignes (toutes présentes dans l’export JSON).</p>` : '';
  return `<h3>${esc(SECTION_LABEL[name] ?? name)} <span class="muted">(${rows.length})</span></h3><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>${more}`;
}

function walk(name: string, v: unknown, out: string[]) {
  if (Array.isArray(v)) out.push(table(name, v.filter((x) => x && typeof x === 'object') as Record<string, unknown>[]));
  else if (v && typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.every(([, x]) => x == null || typeof x !== 'object')) out.push(table(name, [v as Record<string, unknown>]));
    else {
      out.push(`<h2>${esc(SECTION_LABEL[name] ?? name)}</h2>`);
      for (const [k, x] of entries) walk(k, x, out);
    }
  }
}

/** Document HTML lisible (titres en français, identifiants techniques masqués). */
export function exportHtml(data: unknown, email: string | null): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries((data ?? {}) as Record<string, unknown>)) walk(k, v, parts);
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(BRAND.name)} — mes données</title>
<style>body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#2A1A26;margin:24px;font-size:11px}h1{color:#C93A64;font-size:20px}h2{font-size:15px;margin-top:22px;border-bottom:1px solid #eee}h3{font-size:12.5px;margin:14px 0 4px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #e5dde2;padding:3px 5px;text-align:left;vertical-align:top}th{background:#FBF1F4}.muted{color:#7E6873;font-weight:normal}</style></head>
<body><h1>${esc(BRAND.name)} — export de mes données</h1><p class="muted">Compte : ${esc(email ?? '—')} · Export du ${new Date().toLocaleString('fr-FR')}. Document personnel : conservez-le en lieu sûr.</p>${parts.join('')}</body></html>`;
}

/** PDF : partage (téléphone) ou boîte d'impression « Enregistrer en PDF » (web). */
export async function exportPdf(data: unknown, email: string | null): Promise<'file' | 'print'> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Print = require('expo-print') as typeof import('expo-print');
  const html = exportHtml(data, email);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return 'print';
  }
  const { uri } = await Print.printToFileAsync({ html });
  const named = new File(Paths.cache, `${BRAND.slug}-mes-donnees-${stamp()}.pdf`);
  try {
    if (named.exists) named.delete();
    new File(uri).move(named);
  } catch { /* on garde le nom généré */ }
  const target = named.exists ? named.uri : uri;
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(target, { mimeType: 'application/pdf', dialogTitle: 'Exporter mes données (PDF)', UTI: 'com.adobe.pdf' });
  return 'file';
}
