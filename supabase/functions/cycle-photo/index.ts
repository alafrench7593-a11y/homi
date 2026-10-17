// Analyse PÉDAGOGIQUE d'une photo de glaire cervicale par Gemini (clé côté serveur uniquement).
// POST { image_base64: string (JPEG ≤ 1,5 Mo), mime_type: 'image/jpeg', consent: true }
// → { status: 'ok', suggestion: { analyzable, category, confidence (≤ 0,8), reason } }
//
// Uniquement la glaire cervicale (jamais les tests d'ovulation ou de grossesse, analysés sur l'appareil).
// L'image n'est ni stockée ni journalisée ; la réponse du modèle non plus.
// Sans GEMINI_API_KEY : 503 { error: 'ai_not_configured' } — jamais de faux résultat.
import { adminClient, rateLimit, requireUser } from '../_shared/http.ts';
import { geminiConfig } from '../_shared/gemini.ts';
import { handleCyclePhoto } from './handler.ts';

Deno.serve((req) =>
  handleCyclePhoto(req, {
    authenticate: async (r) => {
      const auth = await requireUser(r);
      return auth instanceof Response ? auth : { userId: auth.user.id };
    },
    config: geminiConfig,
    rateLimit: (userId) => rateLimit(adminClient(), `cycle_photo:${userId}`, 20, 3600),
  })
);
