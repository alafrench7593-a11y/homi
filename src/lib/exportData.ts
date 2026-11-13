/**
 * Export RGPD de toutes les données de la personne : fichier JSON (portabilité) et PDF lisible.
 * Les fichiers sont créés sur l'appareil puis partagés ; rien n'est envoyé ailleurs.
 */
import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { BRAND } from '@/config/brand';
import { t as tr, getLocale, localeTag } from '@/i18n';
import { localized } from '@/i18n/localized';

const stamp = () => new Date().toISOString().slice(0, 10);

/**
 * Efface du téléphone les fichiers d'export déjà créés (toutes les données de la personne en clair).
 * Appelé avant chaque nouvel export et lors de l'effacement des données locales.
 */
export function purgeExportFiles(): number {
  if (Platform.OS === 'web') return 0;
  let n = 0;
  try {
    for (const item of new Directory(Paths.cache).list()) {
      if (item instanceof File && (item.name.startsWith(`${BRAND.slug}-export-`) || item.name.startsWith(`${BRAND.slug}-mes-donnees-`))) {
        try { item.delete(); n++; } catch { /* fichier déjà absent */ }
      }
    }
  } catch { /* dossier illisible : rien à faire */ }
  return n;
}

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
    purgeExportFiles();
    const file = new File(Paths.cache, name);
    if (file.exists) file.delete();
    file.create();
    file.write(json);
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: tr('l5.exp.dialogJson'), UTI: 'public.json' });
    return 'file';
  }
  return 'text';
}

/** Fichier texte quelconque (agenda .ics, journal .csv) : partage (téléphone) ou téléchargement (web). */
export async function exportTextFile(content: string, name: string, mimeType: string, uti?: string, dialogTitle = tr('l5.exp.dialog')): Promise<'file' | 'download' | 'text'> {
  if (Platform.OS === 'web') {
    const doc = (globalThis as { document?: Document }).document;
    if (doc && typeof URL !== 'undefined' && URL.createObjectURL) {
      const a = doc.createElement('a');
      a.href = URL.createObjectURL(new Blob([content], { type: mimeType }));
      a.download = name;
      a.click();
      return 'download';
    }
    return 'text';
  }
  if (await Sharing.isAvailableAsync()) {
    purgeExportFiles();
    const file = new File(Paths.cache, name);
    if (file.exists) file.delete();
    file.create();
    file.write(content);
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle, UTI: uti });
    return 'file';
  }
  return 'text';
}

const SECTION_LABEL_FR: Record<string, string> = {
  profile: 'Profil', personal: 'Données personnelles', households: 'Foyers', consents: 'Consentements', privacy_settings: 'Confidentialité',
  period_entries: 'Règles', symptom_logs: 'Symptômes', ovulation_tests: 'Tests d’ovulation', pregnancy_tests: 'Tests de grossesse',
  fertility_observations: 'Température et glaire', mood_checkins: 'Humeur', maternal_weights: 'Poids', bottles: 'Biberons', breastfeeds: 'Tétées',
  diapers: 'Couches', sleeps: 'Sommeil', meals: 'Repas', children: 'Enfants', pregnancies: 'Grossesses', appointments: 'Rendez-vous',
  documents: 'Documents', reminders: 'Rappels', assistant_conversations: 'Conversations avec l’assistant', parent_sleep_logs: 'Mon sommeil', postpartum_settings: 'Post-partum : réglages et plan de soutien', postpartum_checkins: 'Post-partum : mes points du jour', trusted_contacts: 'Contacts de confiance', postpartum_actions: 'Post-partum : mes démarches', postpartum_shared_status: 'Post-partum : ce que je partage',
};
const SECTION_LABEL_EN: Record<string, string> = {
  profile: 'Profile', personal: 'Personal data', households: 'Households', consents: 'Consents', privacy_settings: 'Privacy',
  period_entries: 'Periods', symptom_logs: 'Symptoms', ovulation_tests: 'Ovulation tests', pregnancy_tests: 'Pregnancy tests',
  fertility_observations: 'Temperature and mucus', mood_checkins: 'Mood', maternal_weights: 'Weight', bottles: 'Bottles', breastfeeds: 'Breastfeeds',
  diapers: 'Nappies', sleeps: 'Sleep', meals: 'Meals', children: 'Children', pregnancies: 'Pregnancies', appointments: 'Appointments',
  documents: 'Documents', reminders: 'Reminders', assistant_conversations: 'Conversations with the assistant', parent_sleep_logs: 'My sleep', postpartum_settings: 'Postpartum: settings and support plan', postpartum_checkins: 'Postpartum: my daily check-ins', trusted_contacts: 'Trusted contacts', postpartum_actions: 'Postpartum: my steps', postpartum_shared_status: 'Postpartum: what I share',
};
const SECTION_LABEL_ES: Record<string, string> = {
  profile: 'Perfil', personal: 'Datos personales', households: 'Hogares', consents: 'Consentimientos', privacy_settings: 'Privacidad',
  period_entries: 'Menstruación', symptom_logs: 'Síntomas', ovulation_tests: 'Tests de ovulación', pregnancy_tests: 'Pruebas de embarazo',
  fertility_observations: 'Temperatura y moco cervical', mood_checkins: 'Estado de ánimo', maternal_weights: 'Peso', bottles: 'Biberones', breastfeeds: 'Tomas de pecho',
  diapers: 'Pañales', sleeps: 'Sueño', meals: 'Comidas', children: 'Hijos', pregnancies: 'Embarazos', appointments: 'Citas',
  documents: 'Documentos', reminders: 'Recordatorios', assistant_conversations: 'Conversaciones con el asistente', parent_sleep_logs: 'Mi sueño', postpartum_settings: 'Posparto: ajustes y plan de apoyo', postpartum_checkins: 'Posparto: mis balances del día', trusted_contacts: 'Contactos de confianza', postpartum_actions: 'Posparto: mis trámites', postpartum_shared_status: 'Posparto: lo que comparto',
};
const SECTION_LABEL_DE: Record<string, string> = {
  profile: 'Profil', personal: 'Persönliche Daten', households: 'Haushalte', consents: 'Einwilligungen', privacy_settings: 'Datenschutz',
  period_entries: 'Periode', symptom_logs: 'Symptome', ovulation_tests: 'Ovulationstests', pregnancy_tests: 'Schwangerschaftstests',
  fertility_observations: 'Temperatur und Zervixschleim', mood_checkins: 'Stimmung', maternal_weights: 'Gewicht', bottles: 'Fläschchen', breastfeeds: 'Stillmahlzeiten',
  diapers: 'Windeln', sleeps: 'Schlaf', meals: 'Mahlzeiten', children: 'Kinder', pregnancies: 'Schwangerschaften', appointments: 'Termine',
  documents: 'Dokumente', reminders: 'Erinnerungen', assistant_conversations: 'Gespräche mit dem Assistenten', parent_sleep_logs: 'Mein Schlaf', postpartum_settings: 'Wochenbett: Einstellungen und Unterstützungsplan', postpartum_checkins: 'Wochenbett: meine Tagesrückblicke', trusted_contacts: 'Vertrauenspersonen', postpartum_actions: 'Wochenbett: meine Schritte', postpartum_shared_status: 'Wochenbett: was ich teile',
};
const SECTION_LABEL_IT: Record<string, string> = {
  profile: 'Profilo', personal: 'Dati personali', households: 'Nuclei familiari', consents: 'Consensi', privacy_settings: 'Privacy',
  period_entries: 'Mestruazioni', symptom_logs: 'Sintomi', ovulation_tests: 'Test di ovulazione', pregnancy_tests: 'Test di gravidanza',
  fertility_observations: 'Temperatura e muco cervicale', mood_checkins: 'Umore', maternal_weights: 'Peso', bottles: 'Biberon', breastfeeds: 'Poppate',
  diapers: 'Pannolini', sleeps: 'Sonno', meals: 'Pasti', children: 'Figli', pregnancies: 'Gravidanze', appointments: 'Appuntamenti',
  documents: 'Documenti', reminders: 'Promemoria', assistant_conversations: 'Conversazioni con l’assistente', parent_sleep_logs: 'Il mio sonno', postpartum_settings: 'Post-partum: impostazioni e piano di sostegno', postpartum_checkins: 'Post-partum: i miei punti del giorno', trusted_contacts: 'Contatti di fiducia', postpartum_actions: 'Post-partum: le mie pratiche', postpartum_shared_status: 'Post-partum: cosa condivido',
};
const SECTION_LABEL: Record<string, string> = localized(SECTION_LABEL_FR, SECTION_LABEL_EN, { es: SECTION_LABEL_ES, de: SECTION_LABEL_DE, it: SECTION_LABEL_IT });

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const HIDDEN = new Set(['id', 'user_id', 'household_id', 'created_by', 'client_id', 'storage_path', 'photo_path', 'token_hash']);

function cell(v: unknown): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? tr('l5.exp.yes') : tr('l5.exp.no');
  if (Array.isArray(v)) return v.length ? v.map((x) => (typeof x === 'object' ? '…' : String(x))).join(', ') : '—';
  if (typeof v === 'object') return '…';
  const s = String(v);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? new Date(s).toLocaleString(localeTag()) : s;
}

function table(name: string, rows: Record<string, unknown>[]): string {
  if (!rows.length) return `<h3>${esc(SECTION_LABEL[name] ?? name)}</h3><p class="muted">${esc(tr('l5.exp.noData'))}</p>`;
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((c) => !HIDDEN.has(c)).slice(0, 8);
  const body = rows.slice(0, 500).map((r) => `<tr>${cols.map((c) => `<td>${esc(cell(r[c]))}</td>`).join('')}</tr>`).join('');
  const more = rows.length > 500 ? `<p class="muted">${esc(tr('l5.exp.moreRows', { count: rows.length - 500 }))}</p>` : '';
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

/** Document HTML lisible (titres dans la langue de l'application, identifiants techniques masqués). */
export function exportHtml(data: unknown, email: string | null): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries((data ?? {}) as Record<string, unknown>)) walk(k, v, parts);
  return `<!doctype html><html lang="${getLocale()}"><head><meta charset="utf-8"><title>${esc(tr('l5.exp.docTitle', { name: BRAND.name }))}</title>
<style>body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#1C1533;margin:24px;font-size:11px}h1{color:#5B2A86;font-size:20px}h2{font-size:15px;margin-top:22px;border-bottom:1px solid #eee}h3{font-size:12.5px;margin:14px 0 4px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #E4DAFB;padding:3px 5px;text-align:left;vertical-align:top}th{background:#F4F0FA}.muted{color:#584D72;font-weight:normal}</style></head>
<body><h1>${esc(tr('l5.exp.h1', { name: BRAND.name }))}</h1><p class="muted">${esc(tr('l5.exp.meta', { email: email ?? '—', date: new Date().toLocaleString(localeTag()) }))}</p>${parts.join('')}</body></html>`;
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
  purgeExportFiles();
  const { uri } = await Print.printToFileAsync({ html });
  const named = new File(Paths.cache, `${BRAND.slug}-mes-donnees-${stamp()}.pdf`);
  try {
    if (named.exists) named.delete();
    new File(uri).move(named);
  } catch { /* on garde le nom généré */ }
  const target = named.exists ? named.uri : uri;
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(target, { mimeType: 'application/pdf', dialogTitle: tr('l5.exp.dialogPdf'), UTI: 'com.adobe.pdf' });
  return 'file';
}
