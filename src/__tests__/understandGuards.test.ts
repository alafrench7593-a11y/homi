/**
 * « Se comprendre » — INTERDITS DE CONCEPTION (19/11/2026), gardés ici :
 *  - aucun compteur de refus, aucun score ni statistique de disponibilité sexuelle (textes, code, schéma) ;
 *  - aucun rappel visant à obtenir un rapport (aucune notification planifiée dans ces écrans, aucune relance serveur) ;
 *  - aucun texte présentant le sexe comme une obligation ou une condition de la santé du couple ;
 *  - aucun texte encourageant à insister après un refus ; aucune mission présentée comme contrepartie ;
 *  - aucun diagnostic médical ; la détresse renvoie vers un professionnel de santé et les ressources de l'app ;
 *  - rien n'est envoyé sans confirmation ; la notification ne porte jamais le contenu.
 * Plus : les formulations existent dans les 5 langues, avec leurs trois variantes, sans IA ni appel réseau.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const fs = require('fs') as { readFileSync(p: string, enc: string): string; readdirSync(p: string): string[] };
const path = require('path') as { join(...p: string[]): string };

import { DICTIONARIES } from '@/i18n/dictionaries';
import { isNeutralText } from '@/lib/domain/missions';
import {
  DISTRESS, FEELINGS, REPLIES, REST_REQUESTS, SITUATIONS, VARIANTS, feelingKey, offersRest, otherAdult, requestAsk, requestDue, requestMission,
  showsHelp, situationText, situationTitle, unreadCount,
} from '@/lib/domain/understand';
import { createDemoBackend } from '@/lib/backend/demo';

const ROOT = process.cwd();
const read = (...p: string[]) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const LANGS = ['fr', 'en', 'es', 'de', 'it'] as const;
const text = (k: string, l: string) => {
  const v = DICTIONARIES[l][k];
  return typeof v === 'string' ? v : JSON.stringify(v);
};
const undKeys = (l: string) => Object.keys(DICTIONARIES[l]).filter((k) => k.startsWith('und.') || k.startsWith('cp2.'));

/** Formulations interdites, toutes langues (minuscules). */
const FORBIDDEN: RegExp[] = [
  // obligation / devoir / condition
  /devoir conjugal/, /obligation/, /obligatoire/, /\btu dois\b/, /il faut que tu/, /sinon notre couple/, /santé (de notre|du) couple/,
  /\byou (must|have to|owe)\b/, /\bduty\b/, /\bobligation\b/, /healthy relationship needs/,
  /\bdebes\b/, /\bdeber conyugal\b/, /obligaci[oó]n/,
  /\bdu musst\b/, /pflicht/, /eheliche/,
  /\bdevi\b/, /dovere coniugale/, /obbligo/,
  // insister après un refus
  /insist/, /\bencore une fois\b/, /\btry again\b/, /\bvuelve a intentar/, /\bversuch es (noch|erneut)/, /\briprova\b/,
  // compteurs, scores, statistiques
  /\bscore\b/, /\btaux\b/, /statisti/, /\bcompteur\b/, /refus (comptés|répétés)/, /\brate\b/, /\bpuntuaci/, /\bpunteggio\b/, /\bquote\b/,
  // contrepartie
  /en échange/, /contrepartie/, /in exchange/, /in return/, /a cambio/, /als gegenleistung/, /in cambio/,
  // diagnostic
  /dépression (post|du)/, /\bdiagnosti/, /\bdepression\b/, /\bdepresi[oó]n\b/, /\bdepressione\b/,
];

describe('Se comprendre : contenus écrits à l’avance, 5 langues', () => {
  it.each(LANGS.map((l) => [l]))('%s : 9 ressentis × 3 accords, 7 situations × 4 formulations, 4 réponses, 6 demandes', (l) => {
    for (const f of FEELINGS) for (const g of ['f', 'm', 'n'] as const) expect(text(feelingKey(f, g), l).length).toBeGreaterThan(3);
    for (const s of SITUATIONS) {
      expect(text(situationTitle(s), l).length).toBeGreaterThan(3);
      const variants = VARIANTS.map((v) => text(situationText(s, v), l));
      expect(new Set(variants).size).toBe(4); // trois variantes réellement différentes de la suggestion
      const short = text(situationText(s, 'short'), l);
      expect(short.length).toBeLessThan(text(situationText(s, 'base'), l).length);
    }
    for (const r of REPLIES) expect(text(r, l).length).toBeGreaterThan(3);
    for (const r of REST_REQUESTS) {
      expect(text(requestAsk(r), l)).toMatch(/\?$/); // une DEMANDE, jamais un ordre
      expect(isNeutralText(text(requestMission(r), l))).toBe(true); // titre de mission neutre (garde-fou des missions)
    }
  });

  it('français : accord choisi respecté, formulation épicène par défaut', () => {
    expect(text(feelingKey('tired', 'f'), 'fr')).toBe('Je suis épuisée');
    expect(text(feelingKey('tired', 'm'), 'fr')).toBe('Je suis épuisé');
    expect(text(feelingKey('tired', null), 'fr')).toBe('Je suis à bout de forces');
    for (const f of FEELINGS) expect(text(feelingKey(f, 'n'), 'fr')).not.toMatch(/·|\(e\)/);
  });
});

describe('Se comprendre : interdits de conception', () => {
  it.each(LANGS.map((l) => [l]))('%s : aucun texte d’obligation, d’insistance, de score, de contrepartie ni de diagnostic', (l) => {
    const bad: string[] = [];
    for (const k of undKeys(l)) {
      const v = text(k, l).toLowerCase();
      for (const re of FORBIDDEN) if (re.test(v)) bad.push(`${k} : ${re}`);
    }
    expect(bad).toEqual([]);
  });

  it('aucune relance ni notification planifiée dans les écrans « Se comprendre » ; envoi seulement après confirmation', () => {
    const dir = path.join(ROOT, 'src', 'app', 'family', 'understand');
    for (const f of fs.readdirSync(dir)) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      expect(src).not.toMatch(/scheduleNotification|setInterval|scheduleOnRN|backend\.invoke|[^e]fetch\(/);
      // tout envoi passe par la feuille de confirmation (onConfirm)
      const sends = src.match(/(send|req)\.mutateAsync\(/g) ?? [];
      const confirms = src.match(/<ConfirmSend/g) ?? [];
      if (sends.length) expect(confirms.length).toBeGreaterThan(0);
    }
    const compose = read('src', 'app', 'family', 'understand', 'compose.tsx');
    expect(compose).toMatch(/onPress=\{\(\) => setConfirming\(true\)\} testID="und-send"/);
  });

  it('schéma : pas de compteur, de score ni de statistique ; notification au texte fixe ; pas de journal du contenu', () => {
    const sql = read('supabase', 'migrations', '20261119100100_se_comprendre.sql').toLowerCase();
    const code = sql.replace(/--.*$/gm, '');
    expect(code).not.toMatch(/refus\w*_count|decline\w*_count|score|rate\b|stat(s|istic)|_audit_row|household_events|cron/);
    // la notification ne référence jamais le corps du message
    const notif = code.slice(code.indexOf('insert into public.notifications'), code.indexOf('return r;'));
    expect(notif).not.toMatch(/p_body|r\.body|btrim\(p_body/);
  });

  it('détresse : renvoi sobre vers un professionnel de santé et les ressources de l’app (« Je craque », numéros)', () => {
    expect(DISTRESS).toEqual(expect.arrayContaining(['tired', 'overwhelmed', 'lonely', 'stressed']));
    expect(showsHelp(['talk'])).toBe(false);
    expect(showsHelp(['overwhelmed'])).toBe(true);
    for (const l of LANGS) expect(text('und.help', l).length).toBeGreaterThan(30);
    const kit = read('src', 'features', 'couple', 'CoupleKit.tsx');
    expect(kit).toMatch(/'\/family\/sos'/);
    expect(kit).toMatch(/'\/emergency'/);
  });

  it('organisation : proposée après fatigue / repos seulement, jamais automatiquement', () => {
    expect(offersRest({ feelings: ['tired'] })).toBe(true);
    expect(offersRest({ situation: 'no_sex_now' })).toBe(false);
    expect(offersRest({ situation: 'tenderness' })).toBe(false);
    expect(offersRest({ situation: 'fatigue' })).toBe(true);
  });
});

describe('Se comprendre : logique', () => {
  it('l’autre adulte du foyer, jamais la nounou ; personne s’il n’a pas rejoint', () => {
    const people = [{ id: 'a', role: 'owner', isMe: true }, { id: 'n', role: 'caregiver', isMe: false }, { id: 'b', role: 'coparent', isMe: false }];
    expect(otherAdult(people)?.id).toBe('b');
    expect(otherAdult(people.slice(0, 2))).toBeNull();
  });
  it('messages non lus : ceux de l’autre, après la dernière ouverture sur ce téléphone', () => {
    const msgs = [{ author_id: 'b', created_at: '2026-11-19T10:00:00Z' }, { author_id: 'a', created_at: '2026-11-19T11:00:00Z' }, { author_id: 'b', created_at: '2026-11-19T12:00:00Z' }];
    expect(unreadCount(msgs, 'a', null)).toBe(2);
    expect(unreadCount(msgs, 'a', '2026-11-19T11:30:00Z')).toBe(1);
  });
  it('échéance d’une demande : jamais dans le passé', () => {
    const late = new Date(2026, 10, 19, 23, 30);
    const bedtime = REST_REQUESTS.find((r) => r.key === 'bedtime')!;
    expect(Date.parse(requestDue(bedtime, late)!)).toBeGreaterThan(late.getTime());
    expect(requestDue(REST_REQUESTS.find((r) => r.key === 'groceries')!, late)).toBeNull();
  });
});

describe('Se comprendre : démonstration (mêmes règles que le serveur)', () => {
  it('ressenti privé, message confirmé, notification sans contenu, réponse, demande → mission → terminée', async () => {
    const b = createDemoBackend({ strictPremium: false });
    await b.auth.signUp('camille@exemple.test', 'MotDePasse!2026');
    await b.auth.signIn('camille@exemple.test', 'MotDePasse!2026');
    const me = (await b.auth.getSession())!.userId;
    const { household_id: hid } = await b.rpc<{ household_id: string }>('ensure_my_account');
    await b.update('profiles', { display_name: 'Camille' }, [{ col: 'id', op: 'eq', value: me }]);
    const { user_id: partner } = await b.rpc<{ user_id: string }>('demo_mission_partner');
    await b.insert('couple_feelings', { feelings: ['tired', 'rest'], note: 'note privée', client_id: 'f1' });
    const body = 'Je manque de forces en ce moment, j’aurais besoin de repos.';
    const sent = await b.rpc<{ id: string }>('couple_send', { p_household: hid, p_recipient: partner, p_kind: 'share', p_body: body, p_situation: 'fatigue', p_client_id: 'k1' });
    expect((await b.rpc<{ id: string }>('couple_send', { p_household: hid, p_recipient: partner, p_kind: 'share', p_body: body, p_client_id: 'k1' })).id).toBe(sent.id);
    await expect(b.rpc('couple_send', { p_household: hid, p_recipient: me, p_kind: 'share', p_body: 'x' })).rejects.toBeTruthy();

    await b.rpc('demo_switch_person', { p_user: partner });
    expect(await b.select({ table: 'couple_feelings' })).toEqual([]); // le ressenti de Camille reste privé
    const inbox = await b.select<{ body: string }>({ table: 'couple_messages', filters: [{ col: 'household_id', op: 'eq', value: hid }] });
    expect(inbox.map((m) => m.body)).toEqual([body]);
    const notes = await b.select<{ title: string; body: string; payload: unknown; deep_link: string }>({ table: 'notifications', filters: [{ col: 'user_id', op: 'eq', value: partner }] });
    const couple = notes.filter((n) => n.deep_link === '/family/understand/inbox');
    expect(couple).toHaveLength(1);
    expect(couple[0].title).toBe('Camille souhaite partager quelque chose avec vous');
    expect(JSON.stringify(couple[0])).not.toMatch(/forces|repos/);
    await b.rpc('couple_send', { p_household: hid, p_recipient: me, p_kind: 'reply', p_body: 'Je comprends. Comment je peux t’aider ?', p_reply_to: sent.id });

    await b.rpc('demo_switch_person', { p_user: me });
    const m = await b.rpc<{ id: string; mission_state: string }>('create_mission', { p_household: hid, p_title: 'Gérer le coucher ce soir', p_assignee: partner, p_category: 'childcare', p_client_id: 'r1' });
    await b.rpc('couple_send', { p_household: hid, p_recipient: partner, p_kind: 'request', p_body: 'Tu peux gérer le coucher ce soir ?', p_task: m.id, p_client_id: 'r1' });
    await b.rpc('demo_switch_person', { p_user: partner });
    await b.rpc('mission_respond', { p_task: m.id, p_action: 'accept' });
    await b.rpc('mission_respond', { p_task: m.id, p_action: 'start' });
    await b.rpc('mission_respond', { p_task: m.id, p_action: 'complete' });
    expect((await b.rpc<{ unchanged?: boolean }>('mission_respond', { p_task: m.id, p_action: 'complete' })).unchanged).toBe(true);
    await b.rpc('demo_switch_person', { p_user: me });
    const done = await b.select<{ id: string; done_at: string | null; done_by: string }>({ table: 'family_tasks', filters: [{ col: 'household_id', op: 'eq', value: hid }, { col: 'mission_state', op: 'eq', value: 'done' }] });
    expect(done.map((d) => d.id)).toContain(m.id);
    expect(done.find((d) => d.id === m.id)?.done_by).toBe(partner);
    const mine = await b.select<{ title: string }>({ table: 'notifications', filters: [{ col: 'user_id', op: 'eq', value: me }] });
    expect(mine.filter((n) => n.title === 'Sam a terminé : Gérer le coucher ce soir')).toHaveLength(1);
  });

  it('préférence coupée : pas de « … a terminé » ; grossesse non partagée invisible du co-parent', async () => {
    const b = createDemoBackend({ strictPremium: false });
    await b.auth.signUp('ines@exemple.test', 'MotDePasse!2026');
    await b.auth.signIn('ines@exemple.test', 'MotDePasse!2026');
    const me = (await b.auth.getSession())!.userId;
    const { household_id: hid } = await b.rpc<{ household_id: string }>('ensure_my_account');
    const [p] = await b.insert<{ id: string }>('pregnancies', { household_id: hid, carrier_user_id: me, status: 'active', due_date: '2027-03-01', due_date_source: 'due_date', multiplicity: 'single', reminders_wanted: [], topics: [] });
    await b.insert('notification_settings', { user_id: me, mission_done: false }, { onConflict: 'user_id' });
    const { user_id: partner } = await b.rpc<{ user_id: string }>('demo_mission_partner');
    const m = await b.rpc<{ id: string }>('create_mission', { p_household: hid, p_title: 'Sortir les poubelles', p_assignee: partner, p_category: 'housework' });
    await b.rpc('demo_switch_person', { p_user: partner });
    expect(await b.select({ table: 'pregnancies', filters: [{ col: 'household_id', op: 'eq', value: hid }] })).toEqual([]);
    await expect(b.rpc('set_pregnancy_sharing', { p_pregnancy: p.id, p_basics: true, p_medical: true })).rejects.toBeTruthy();
    await b.rpc('mission_respond', { p_task: m.id, p_action: 'complete' });
    await b.rpc('demo_switch_person', { p_user: me });
    const mine = await b.select<{ title: string }>({ table: 'notifications', filters: [{ col: 'user_id', op: 'eq', value: me }] });
    expect(mine.some((n) => n.title.includes('a terminé'))).toBe(false);
    await b.rpc('set_pregnancy_sharing', { p_pregnancy: p.id, p_basics: true, p_medical: false });
    await b.rpc('demo_switch_person', { p_user: partner });
    expect(await b.select({ table: 'pregnancies', filters: [{ col: 'household_id', op: 'eq', value: hid }] })).toHaveLength(1);
  });
});
