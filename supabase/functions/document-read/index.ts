// Lecture du texte d'un document par le service Gemini, uniquement si l'utilisatrice l'a demandé ET a donné son accord
// « lecture automatique des documents ». Le document n'est accessible que si la RLS l'autorise pour CETTE personne.
// Seul le fichier est envoyé (aucun nom, aucun profil). Le texte est renvoyé à l'application, qui le présente « à vérifier ».
// Le texte n'est jamais écrit dans les journaux. POST { document_id, request_id? }
// Crédits (24/11/2026, décision de la propriétaire) : 5 crédits (`cost.document_read`) réservés AVANT l'appel, débités
// seulement si le texte est livré, restitués si l'IA échoue ou si le document est illisible. Un document déjà lu par le
// serveur n'est jamais relu : son texte enregistré est renvoyé, sans appel ni débit.
import { geminiGenerate, GeminiError } from '../_shared/gemini.ts';
import { enabledGeminiConfig } from '../_shared/ai-switch.ts';
import { adminClient, corsHeaders, hasConsent, json, rateLimit, requirePremium, requireUser, withCors } from '../_shared/http.ts';
import { isUuid, readJsonBody } from '../_shared/body.ts';
import { requestKey, reserveRefusal, settle } from '../_shared/credits.ts';
import { creditsGate } from '../_shared/credits-gate.ts';
import { MAX_READ_BYTES, parseReadResponse, READ_INSTRUCTIONS, READ_SCHEMA, READABLE_MIME, toBase64 } from '../_shared/document-read.ts';

Deno.serve(withCors(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const locked = await requirePremium(auth.client); // Premium strict
  if (locked) return locked;
  const admin = adminClient();
  if (!(await rateLimit(admin, `docread:${auth.user.id}`, 20, 3600))) return json({ error: 'rate_limited' }, 429);
  if (!(await hasConsent(admin, auth.user.id, 'document_reading'))) return json({ error: 'consent_required' }, 403);

  const body = await readJsonBody(req);
  if (!body) return json({ error: 'too_large' }, 413);
  const document_id = body.document_id;
  if (!isUuid(document_id)) return json({ error: 'bad_request' }, 400);
  // Droits vérifiés AVEC la RLS de l'utilisatrice : un document privé d'un autre membre est introuvable
  const { data: doc } = await auth.client.from('documents').select('id,household_id,uploaded_by,storage_path,mime_type,size_bytes,ocr_text,ocr_source').eq('id', document_id).maybeSingle();
  if (!doc) return json({ error: 'not_found' }, 404);
  // Déjà lu par le serveur : même résultat, aucun nouvel appel, aucun crédit (document identique, droits vérifiés)
  if (doc.ocr_source === 'server' && typeof doc.ocr_text === 'string' && doc.ocr_text.trim()) {
    return json({ status: 'to_verify', text: doc.ocr_text, illegible: [], cached: true });
  }
  if (!READABLE_MIME.has(doc.mime_type)) return json({ error: 'unsupported' }, 415);
  if (doc.size_bytes > MAX_READ_BYTES) return json({ error: 'too_large' }, 413);
  // Le fichier doit appartenir au foyer du document (jamais un fichier rattaché d'un autre foyer)
  if (typeof doc.storage_path !== 'string' || !doc.storage_path.startsWith(`${doc.household_id}/`)) return json({ error: 'not_found' }, 404);
  // Le document d'une autre personne n'est envoyé à l'IA que si CETTE personne a aussi donné son accord
  if (doc.uploaded_by && doc.uploaded_by !== auth.user.id && !(await hasConsent(admin, doc.uploaded_by, 'document_reading'))) {
    return json({ error: 'owner_consent_required' }, 403);
  }

  const gemini = await enabledGeminiConfig(adminClient());
  if (!gemini) return json({ status: 'not_configured' });

  const { data: file, error } = await admin.storage.from('documents').download(doc.storage_path);
  if (error || !file) return json({ error: 'file_unavailable' }, 404);
  if (file.size > MAX_READ_BYTES) return json({ error: 'too_large' }, 413); // taille réelle, pas celle déclarée
  // Réserve AVANT l'appel (crédits insuffisants → aucun appel) ; la même requête renvoyée ne réserve qu'une fois
  const gate = creditsGate(admin, auth.user.id);
  const reservation = await gate.reserve('document_read', requestKey('docread', auth.user.id, body.request_id));
  const refusal = reserveRefusal(reservation);
  if (refusal) return json(refusal.body, refusal.status);
  const rid = reservation.ok ? reservation.reservation_id : '';
  let raw: string;
  try {
    raw = await geminiGenerate(gemini, {
      system: READ_INSTRUCTIONS,
      turns: [{ role: 'user', text: 'Transcris ce document.' }],
      images: [{ mimeType: doc.mime_type, base64: toBase64(await file.arrayBuffer()) }],
      maxOutputTokens: 8000,
      responseSchema: READ_SCHEMA,
    });
  } catch (e) {
    console.error('docread_llm_error', e instanceof GeminiError ? e.status : 'unknown'); // jamais le contenu
    await settle(gate, rid, false, 'llm_error');
    return json({ error: 'unavailable' }, 503);
  }
  const parsed = parseReadResponse(raw);
  if (!parsed) { await settle(gate, rid, false, 'unreadable'); return json({ status: 'unreadable' }); }
  await settle(gate, rid, true, 'delivered');
  return json({ status: 'to_verify', text: parsed.text, illegible: parsed.illegible });
}));
