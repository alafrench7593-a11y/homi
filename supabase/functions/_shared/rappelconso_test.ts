// Tests RappelConso : deux schémas de réponse, correspondance, état de la vérification (faux transport réseau).
function assertEquals(a: unknown, b: unknown) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
}
import { fetchRecallRecords, matchRecalls, parseRecallRecords, type RecallFetch } from './rappelconso.ts';

const V21 = { total_count: 1, results: [{ numero_fiche: '2026-10-0042', libelle: 'Lait corporel bébé', marque_produit: 'Marque Test', gtin: '3017620422003', motif_rappel: 'Bactéries', date_publication: '2026-10-01T08:00:00+00:00', lien_vers_la_fiche_rappel: 'https://rappel.conso.gouv.fr/fiche-rappel/42/Interne' }] };
const V1 = { records: [{ fields: { reference_fiche: '2023-05-0007', nom_de_la_marque_du_produit: 'Fromagerie Test', noms_des_modeles_ou_references: 'Brie au lait cru', identification_des_produits: '3017620422003 $ Lot n° L123', motif_du_rappel: 'Listeria', date_de_publication: '04/05/2023' } }] };

const fake = (body: unknown, ok = true): RecallFetch => () => Promise.resolve({ ok, status: ok ? 200 : 503, json: () => Promise.resolve(body) });

Deno.test('schéma v2.1 et ancien schéma lus de la même façon', () => {
  const a = parseRecallRecords(V21)[0];
  const b = parseRecallRecords(V1)[0];
  assertEquals([a.gtins, a.reason, a.published_on], [['3017620422003'], 'Bactéries', '2026-10-01']);
  assertEquals([b.gtins, b.reason, b.published_on, b.lot_numbers], [['3017620422003'], 'Listeria', '2023-05-04', ['L123']]);
});

Deno.test('vérification réussie : enregistrements lus, checked = true', async () => {
  const urls: string[] = [];
  const f: RecallFetch = (url) => { urls.push(url); return fake(V21)(url); };
  const out = await fetchRecallRecords(['3017620422003'], { fetchImpl: f });
  assertEquals(out.checked, true);
  assertEquals(out.records.length, 1);
  assertEquals(urls[0].startsWith('https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-espaces/records?where='), true);
  assertEquals(matchRecalls(out.records, { barcode: '3017620422003' })[0].match, 'gtin');
});

Deno.test('base injoignable ou en erreur : checked = false (jamais « aucun rappel » par défaut)', async () => {
  assertEquals((await fetchRecallRecords(['3017620422003'], { fetchImpl: fake(null, false) })).checked, false);
  assertEquals((await fetchRecallRecords(['3017620422003'], { fetchImpl: () => Promise.reject(new Error('réseau')) })).checked, false);
  assertEquals((await fetchRecallRecords([], { fetchImpl: fake(V21) })).checked, false);
});

Deno.test('jeu de données configurable', async () => {
  const urls: string[] = [];
  await fetchRecallRecords(['x'], { dataset: 'autre-jeu', fetchImpl: (u) => { urls.push(u); return fake({ results: [] })(u); } });
  assertEquals(urls[0].includes('/datasets/autre-jeu/records'), true);
});
