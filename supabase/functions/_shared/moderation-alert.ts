/**
 * Alerte de modération (24/11/2026, audit App Store, règle 1.2) : à chaque signalement, la modératrice reçoit un
 * e-mail (une seule fois par signalement : reports.alerted_at). Logique pure, testée ; envoi par Resend.
 * L'e-mail ne contient ni e-mail ni identité de la personne qui signale : seulement le motif, un extrait du contenu
 * signalé (300 caractères au plus) et les identifiants internes pour le retrouver dans l'espace de modération.
 */
export interface ReportForAlert {
  id: string;
  reason: string;
  details: string | null;
  created_at: string;
  post_id: string | null;
  comment_id: string | null;
  reported_user: string | null;
  excerpt: string | null;
}

const REASON_FR: Record<string, string> = {
  harassment: 'Harcèlement', medical_misinformation: 'Information médicale trompeuse', spam: 'Spam', personal_data: 'Donnée personnelle',
  danger: 'Danger', inappropriate: 'Contenu inapproprié', other: 'Autre',
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const cut = (s: string | null, n: number) => (s ? (s.length > n ? `${s.slice(0, n)}…` : s) : '');

/** Le signalement doit être récent (10 min) et pas encore alerté : sinon rien n'est envoyé (pas de doublon, pas de rejeu). */
export function shouldAlert(r: { created_at: string; alerted_at?: string | null }, now = Date.now()): boolean {
  return !r.alerted_at && now - Date.parse(r.created_at) <= 10 * 60 * 1000;
}

export function buildAlert(r: ReportForAlert): { subject: string; html: string; text: string } {
  const what = r.post_id ? `publication ${r.post_id}` : r.comment_id ? `commentaire ${r.comment_id}` : r.reported_user ? `membre ${r.reported_user}` : 'contenu';
  const motif = REASON_FR[r.reason] ?? r.reason;
  const subject = `HOMI · signalement : ${motif}`;
  const lines = [`Nouveau signalement (${motif}) sur ${what}.`, r.excerpt ? `Extrait : « ${cut(r.excerpt, 300)} »` : '', r.details ? `Précision : ${cut(r.details, 300)}` : '',
    `Signalement ${r.id} du ${r.created_at}.`, 'À traiter dans HOMI › Communauté › Modération (règle Apple : réponse sous 24 h).'].filter(Boolean);
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.5;color:#111">${lines.map((l) => `<p style="margin:0 0 10px">${esc(l)}</p>`).join('')}</div>`;
  return { subject, html, text: lines.join('\n') };
}
