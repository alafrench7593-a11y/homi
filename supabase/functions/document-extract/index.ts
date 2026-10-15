// Lecture automatique d'un document : extrait UNIQUEMENT les éléments clairement écrits
// (date, terme, nom de l'examen, mesures, poids fœtal estimé), présentés « à vérifier ».
// Aucune interprétation. POST { document_id }
import { adminClient, corsHeaders, hasConsent, json, rateLimit, requireUser } from '../_shared/http.ts';

const MODEL = Deno.env.get('EXTRACTION_MODEL') ?? 'claude-sonnet-5-5';

const INSTRUCTIONS = `Tu transcris des informations EXPLICITEMENT écrites dans un document médical.
Règles absolues :
- Ne recopie que ce qui est lisible et écrit tel quel. Si une valeur est absente ou illisible, mets null.
- N'interprète rien : pas de « normal », « anormal », « rassurant », aucune conclusion, aucun commentaire.
- Ne calcule rien, ne convertis rien.
Réponds UNIQUEMENT avec un objet JSON de cette forme :
{"exam_name": string|null, "document_date": "AAAA-MM-JJ"|null, "term_or_gestational_age": string|null,
 "estimated_fetal_weight": string|null, "measurements": [{"label": string, "value": string}] }`;

function toBase64(buf: ArrayBuffer): string {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const admin = adminClient();
  if (!(await rateLimit(admin, `extract:${auth.user.id}`, 10, 3600))) return json({ error: 'rate_limited' }, 429);
  if (!(await hasConsent(admin, auth.user.id, 'document_reading'))) {
    return json({ error: 'consent_required', message: 'Activez la lecture automatique des documents dans Confidentialité.' }, 403);
  }

  const { document_id } = await req.json().catch(() => ({}));
  // Vérification des droits AVEC la RLS de l'utilisateur
  const { data: doc } = await auth.client.from('documents').select('id,household_id,storage_path,mime_type,size_bytes').eq('id', document_id).maybeSingle();
  if (!doc) return json({ error: 'not_found' }, 404);
  if (doc.size_bytes > 10 * 1024 * 1024) return json({ error: 'too_large', message: 'Document trop volumineux pour la lecture automatique (10 Mo maximum).' }, 413);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ fields: null, status: 'unavailable', message: 'La lecture automatique n’est pas encore activée (aucun service connecté).' });

  const { data: file, error } = await admin.storage.from('documents').download(doc.storage_path);
  if (error || !file) return json({ error: 'file_unavailable' }, 404);
  const data = toBase64(await file.arrayBuffer());
  const source = { type: 'base64', media_type: doc.mime_type, data };
  const block = doc.mime_type === 'application/pdf' ? { type: 'document', source } : { type: 'image', source };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 600, system: INSTRUCTIONS, messages: [{ role: 'user', content: [block, { type: 'text', text: 'Transcris les champs demandés.' }] }] }),
  });
  if (!res.ok) {
    console.error('extract_llm_error', res.status);
    return json({ error: 'unavailable' }, 503);
  }
  const out = await res.json();
  const text = (out.content ?? []).map((b: { text?: string }) => b.text ?? '').join('');
  let fields: unknown = null;
  try {
    fields = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  } catch {
    fields = null;
  }
  if (fields) {
    await admin.from('document_extractions').insert({ document_id: doc.id, household_id: doc.household_id, fields, status: 'to_verify' });
  }
  return json({ fields, status: 'to_verify', notice: 'Éléments lus automatiquement : vérifiez-les sur le document original. Aucune interprétation n’est fournie.' });
});
