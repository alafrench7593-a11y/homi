/** Formulaire de contact du site : validation, robots, limite de débit, en-têtes sans injection. */
import { buildMail, checkContact, rateLimited } from '../../supabase/functions/_shared/contact';

const ok = { category: 'Presse', name: 'Julie', email: 'Julie@Exemple.fr', subject: 'Interview', message: 'Bonjour, une question.', consent: true };

it('accepte une demande complète (e-mail normalisé)', () => {
  const r = checkContact(ok);
  expect(r).toMatchObject({ ok: true, value: { email: 'julie@exemple.fr', category: 'Presse' } });
});
it('refuse sans consentement, catégorie inconnue, e-mail invalide, champs vides', () => {
  expect(checkContact({ ...ok, consent: false })).toMatchObject({ ok: false, error: 'consent' });
  expect(checkContact({ ...ok, category: 'Pub' })).toMatchObject({ ok: false, error: 'category' });
  expect(checkContact({ ...ok, email: 'pas-un-mail' })).toMatchObject({ ok: false, error: 'email' });
  expect(checkContact({ ...ok, message: '  ' })).toMatchObject({ ok: false, error: 'required' });
});
it('robots : pot de miel ou trop de liens → spam (réponse neutre, rien envoyé)', () => {
  expect(checkContact({ ...ok, website: 'http://x' })).toMatchObject({ ok: false, spam: true });
  expect(checkContact({ ...ok, message: Array(7).fill('https://x.y').join(' ') })).toMatchObject({ ok: false, spam: true });
});
it('aucune injection d’en-tête par l’objet ou le nom', () => {
  const r = checkContact({ ...ok, subject: 'A\r\nBcc: x@y.z', name: 'J\nX' });
  if (!r.ok) throw new Error('attendu ok');
  const m = buildMail(r.value, 'contact@homifamille.com');
  expect(m.subject).not.toMatch(/[\r\n]/);
  expect(m.to).toEqual(['homixyz@gmail.com']);
  expect(m.reply_to).toBe('julie@exemple.fr');
});
it('limite : 5 messages par 10 minutes et par adresse', () => {
  for (let i = 0; i < 5; i++) expect(rateLimited('1.2.3.4', 1000 + i)).toBe(false);
  expect(rateLimited('1.2.3.4', 2000)).toBe(true);
  expect(rateLimited('1.2.3.4', 1000 + 600_001)).toBe(false);
});
