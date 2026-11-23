/** Audit 04 — corps de requête des fonctions serveur : taille bornée, types vérifiés, jokers ILIKE neutralisés. */
import { escapeLike, isUuid, MAX_JSON_BYTES, optText, readJsonBody } from '../../supabase/functions/_shared/body';

const req = (body: string, headers: Record<string, string> = {}) =>
  ({ headers: { get: (k: string) => headers[k.toLowerCase()] ?? null }, text: async () => body }) as unknown as Request;

describe('readJsonBody', () => {
  it('lit un objet JSON', async () => {
    await expect(readJsonBody(req('{"document_id":"x"}'))).resolves.toEqual({ document_id: 'x' });
  });
  it('corps illisible, tableau ou scalaire : objet vide (→ bad_request ensuite)', async () => {
    await expect(readJsonBody(req('pas du json'))).resolves.toEqual({});
    await expect(readJsonBody(req('[1,2]'))).resolves.toEqual({});
    await expect(readJsonBody(req('"x"'))).resolves.toEqual({});
  });
  it('trop gros : refusé (en-tête déclaré ou taille réelle)', async () => {
    await expect(readJsonBody(req('{}', { 'content-length': String(MAX_JSON_BYTES + 1) }))).resolves.toBeNull();
    await expect(readJsonBody(req(JSON.stringify({ a: 'é'.repeat(MAX_JSON_BYTES) })))).resolves.toBeNull();
    await expect(readJsonBody(req(JSON.stringify({ a: 'x'.repeat(2000) })), 1024)).resolves.toBeNull();
  });
});

describe('validateurs', () => {
  it('UUID strict', () => {
    expect(isUuid('55b64dbb-f64e-48fc-8d5f-aae8ca6b1578')).toBe(true);
    expect(isUuid("55b64dbb-f64e-48fc-8d5f-aae8ca6b1578' or 1=1")).toBe(false);
    expect(isUuid({})).toBe(false);
    expect(isUuid('------------------------------------')).toBe(false);
  });
  it('texte libre borné, jamais un objet', () => {
    expect(optText({ toString: () => 'x' }, 10)).toBeNull();
    expect(optText('  Bébé Lait  ', 4)).toBe('Bébé');
    expect(optText('   ', 10)).toBeNull();
    expect(optText('a'.repeat(1_000_000), 120)).toHaveLength(120);
  });
  it('jokers ILIKE échappés', () => {
    expect(escapeLike('100%_pur\\')).toBe('100\\%\\_pur\\\\');
    expect(escapeLike('%')).toBe('\\%');
  });
});
