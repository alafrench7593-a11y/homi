// « Sorties & rencontres » : établissements et photos Google Places (API New), clé côté serveur uniquement.
// POST { category, lat, lon, radius }        -> { google: 'ok', places: GooglePlace[] }
// POST { photo: '<places/…/photos/…>', maxWidthPx } -> { google: 'ok', photoUri }
// Sans GOOGLE_PLACES_API_KEY : { google: 'not_configured' } — l'application garde OpenStreetMap et les illustrations,
// jamais de faux résultat. Connexion obligatoire, position arrondie (~1 km), limite d'appels par personne.
// Aucun résultat Google n'est stocké (conditions de Google Maps Platform).
import { adminClient, corsHeaders, json, rateLimit, requireUser } from '../_shared/http.ts';
import { buildSearch, GOOGLE_FIELD_MASK, parseGooglePlaces, parsePhotoMedia, photoMediaUrl, validPhotoName, validQuery } from '../_shared/google-places.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const key = (Deno.env.get('GOOGLE_PLACES_API_KEY') ?? '').trim();
  if (!key) return json({ google: 'not_configured' });

  const body = await req.json().catch(() => ({}));
  const admin = adminClient();

  if (typeof body?.photo === 'string') {
    if (!validPhotoName(body.photo)) return json({ error: 'bad_request', message: 'Photo invalide.' }, 400);
    if (!(await rateLimit(admin, `places_photo:${auth.user.id}`, 120, 3600))) return json({ google: 'unavailable', message: 'Trop de photos demandées en une heure.' });
    const res = await fetch(photoMediaUrl(body.photo, Number(body.maxWidthPx) || 640, key));
    if (!res.ok) { console.error('places_photo', res.status); return json({ google: 'unavailable' }); }
    const photoUri = parsePhotoMedia(await res.json().catch(() => null));
    return photoUri ? json({ google: 'ok', photoUri }) : json({ google: 'unavailable' });
  }

  const q = validQuery(body);
  if (!q) return json({ error: 'bad_request', message: 'Recherche invalide.' }, 400);
  const search = buildSearch(q);
  if (!search) return json({ google: 'ok', places: [] });
  if (!(await rateLimit(admin, `places_search:${auth.user.id}`, 40, 3600))) return json({ google: 'unavailable', message: 'Trop de recherches en une heure. Les lieux OpenStreetMap restent affichés.' });
  const res = await fetch(search.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': GOOGLE_FIELD_MASK },
    body: JSON.stringify(search.body),
  });
  if (!res.ok) { console.error('places_search', res.status); return json({ google: 'unavailable' }); }
  return json({ google: 'ok', places: parseGooglePlaces(await res.json().catch(() => null), q.category) });
});
