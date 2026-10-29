// Lecture automatique d'un document : extrait UNIQUEMENT les éléments clairement écrits
// (date, terme, nom de l'examen, mesures, poids fœtal estimé), présentés « à vérifier ».
// Aucune interprétation. POST { document_id }
import { geminiConfig, geminiGenerate, GeminiError } from '../_shared/gemini.ts';
import { adminClient, corsHeaders, hasConsent, json, rateLimit, requireUser } from '../_shared/http.ts';
import { READABLE_MIME } from '../_shared/document-read.ts';


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
  if (typeof document_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(document_id)) return json({ error: 'bad_request' }, 400);
  // Vérification des droits AVEC la RLS de l'utilisateur
  const { data: doc } = await auth.client.from('documents').select('id,household_id,storage_path,mime_type,size_bytes').eq('id', document_id).maybeSingle();
  if (!doc) return json({ error: 'not_found' }, 404);
  if (!READABLE_MIME.has(doc.mime_type)) return json({ error: 'unsupported' }, 415);
  if (doc.size_bytes > 10 * 1024 * 1024) return json({ error: 'too_large', message: 'Document trop volumineux pour la lecture automatique (10 Mo maximum).' }, 413);

  const gemini = geminiConfig();
  if (!gemini) return json({ fields: null, status: 'not_configured', message: 'Lecture automatique non configurée : la clé GEMINI_API_KEY doit être ajoutée aux secrets Supabase.' });

  const { data: file, error } = await admin.storage.from('documents').download(doc.storage_path);
  if (error || !file) return json({ error: 'file_unavailable' }, 404);
  const data = toBase64(await file.arrayBuffer());
  let text: string;
  try {
    text = await geminiGenerate(gemini, {
      system: INSTRUCTIONS,
      turns: [{ role: 'user', text: 'Transcris les champs demandés.' }],
      images: [{ mimeType: doc.mime_type, base64: data }],
      maxOutputTokens: 600,
    });
  } catch (e) {
    console.error('extract_llm_error', e instanceof GeminiError ? e.status : 'unknown');
    return json({ error: 'unavailable' }, 503);
  }
  let fields: unknown = null;
  try {
    fields = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  } catch {
    fields = null;
  }
  if (fields) {
    // Enregistrement soumis aux droits de la personne (RLS) : sans droit d'écriture, rien n'est gardé
    const { error: saveErr } = await auth.client.from('document_extractions').insert({ document_id: doc.id, household_id: doc.household_id, fields, status: 'to_verify' });
    if (saveErr) console.error('extract_save_refused', saveErr.code);
  }
  return json({ fields, status: 'to_verify', notice: 'Éléments lus automatiquement : vérifiez-les sur le document original. Aucune interprétation n’est fournie.' });
});
