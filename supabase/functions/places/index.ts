// « Sorties près de chez moi » : lieux familiaux et photos Google Places (API New), clé côté serveur uniquement.
// POST { category: 'all'|'cafes'|'restaurants'|'parks'|'activities'|'support', lat, lon, radius } -> { google: 'ok', places }
// POST { photo: '<places/…/photos/…>', maxWidthPx } -> { google: 'ok', photoUri }
// POST { check: true } -> { google: 'ok' | 'not_configured' | 'invalid_key' | … } (vérification de la configuration)
// Sans GOOGLE_PLACES_API_KEY : { google: 'not_configured' } — jamais de faux résultat. Connexion obligatoire, position
// arrondie (~1 km), limite d'appels par personne, aucun résultat stocké.
import { adminClient, corsHeaders, json, rateLimit, requirePremium, requireUser, withCors } from '../_shared/http.ts';
import { buildSearch, GOOGLE_FIELD_MASK, googleErrorState, parseGooglePlaces, parsePhotoMedia, photoMediaUrl, validPhotoName, validQuery } from '../_shared/google-places.ts';

async function search(key: string, body: { url: string; body: Record<string, unknown> }) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 12000);
  try {
    return await fetch(body.url, {
      method: 'POST', signal: ac.signal,
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': GOOGLE_FIELD_MASK },
      body: JSON.stringify(body.body),
    });
  } finally { clearTimeout(timer); }
}

Deno.serve(withCors(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const locked = await requirePremium(auth.client); // Premium strict
  if (locked) return locked;
  const key = (Deno.env.get('GOOGLE_PLACES_API_KEY') ?? '').trim();
  if (!key) return json({ google: 'not_configured' });

  const body = await req.json().catch(() => ({}));
  const admin = adminClient();

  try {
    if (body?.check === true) {
      // Petite recherche réelle (Paris, 1 km) pour vérifier que la clé fonctionne : seul l'état est renvoyé.
      // Chaque vérification est facturée par Google : 5 par heure et par personne au plus.
      if (!(await rateLimit(admin, `places_check:${auth.user.id}`, 5, 3600))) return json({ google: 'quota' });
      const res = await search(key, buildSearch({ category: 'parks', lat: 48.86, lon: 2.35, radius: 1000 }));
      return json({ google: res.ok ? 'ok' : googleErrorState(res.status) });
    }
    if (typeof body?.photo === 'string') {
      if (!validPhotoName(body.photo)) return json({ error: 'bad_request', message: 'Photo invalide.' }, 400);
      if (!(await rateLimit(admin, `places_photo:${auth.user.id}`, 150, 3600))) return json({ google: 'quota' });
      const res = await fetch(photoMediaUrl(body.photo, Number(body.maxWidthPx) || 640, key), { signal: AbortSignal.timeout(8000) }).catch(() => null);
      if (!res) return json({ google: 'unavailable' });
      if (!res.ok) { console.error('places_photo', res.status); return json({ google: googleErrorState(res.status) }); }
      const photoUri = parsePhotoMedia(await res.json().catch(() => null));
      return photoUri ? json({ google: 'ok', photoUri }) : json({ google: 'unavailable' });
    }
    const q = validQuery(body);
    if (!q) return json({ error: 'bad_request', message: 'Recherche invalide.' }, 400);
    if (!(await rateLimit(admin, `places_search:${auth.user.id}`, 60, 3600))) return json({ google: 'quota' });
    const res = await search(key, buildSearch(q));
    if (!res.ok) { console.error('places_search', res.status); return json({ google: googleErrorState(res.status) }); }
    return json({ google: 'ok', places: parseGooglePlaces(await res.json().catch(() => null), q.category) });
  } catch (e) {
    console.error('places_error', (e as Error).name);
    return json({ google: 'unavailable' });
  }
}));
