/**
 * Garde-fou « tutoiement partout » (décision de la propriétaire, 02/12/2026).
 * L'application s'adresse au parent au « tu » (fr), « du » (de), « tú » (es), « tu » (it). Ce test échoue si une
 * chaîne s'adresse de nouveau au lecteur au « vous » / « Sie » / « usted » / « Lei », hors liste blanche ci-dessous.
 * Liste blanche = cas relus un par un, avec leur raison :
 *   - pluriel réel : les deux parents, le couple, « vous deux », « l’un de vous », parent + enfant ;
 *   - publications de démonstration de la communauté qui s'adressent à plusieurs membres (« Et vous ? ») ;
 *   - questions que le parent pose à une professionnelle (candidate nounou, consultante en lactation, médecin) ;
 *   - citations « … », titres de pages officielles et adresses web (non concernés par le test) ;
 *   - textes juridiques (CGU, confidentialité, mentions légales) : registre juridique, hors périmètre.
 * Une nouvelle exception doit être ajoutée ICI, avec sa raison, jamais en contournant le test.
 */
import { DICTIONARIES } from '@/i18n/dictionaries';

type Dirent = { name: string; isDirectory(): boolean };
const fs = require('fs') as { readdirSync(p: string, o: { withFileTypes: true }): Dirent[]; readFileSync(p: string, enc: 'utf8'): string };
const path = require('path') as { join(...p: string[]): string; relative(a: string, b: string): string };

type Msg = string | Record<string, string>;
const values = (lang: string): [string, string][] =>
  Object.entries(DICTIONARIES[lang] as Record<string, Msg>).flatMap(([k, v]) =>
    typeof v === 'string' ? [[k, v] as [string, string]] : Object.values(v).map((x) => [k, x] as [string, string]));

const clean = (s: string) => s
  .replace(/https?:\/\/\S+/g, '')
  .replace(/[Rr]endez[- ]vous/g, '')
  .replace(/«[^«»]*»|“[^“”]*”/g, '');

// ---------------------------------------------------------------- français
const FR_VOUS = /\b(vous|votre|vos|vôtres?)\b/i;
/** formes verbales en -ez adressées au lecteur (impératif ou présent) ; noms communs exclus */
const FR_EZ = /\b(?!(?:chez|nez|assez|rez|merguez)\b)[a-zà-ÿ]+ez\b/i;
const FR_ALLOW: Record<string, string> = {
  'calm.cancelQ': 'pluriel réel : la demande est annulée pour les deux parents',
  'mom.plan.agenda': 'pluriel réel : agenda du couple, « pour vous deux »',
  'mom.done.done': 'pluriel réel : souvenirs du couple',
  'mom.deleteQ': 'pluriel réel : « pour vous deux »',
  'mom.idea.series_episode.sub': 'pluriel réel : série suivie à deux',
  'cp2.inv.title': 'pluriel réel : la famille du couple',
  'und.moment.body': 'pluriel réel : « à tous les deux »',
  'und.inbox.emptyB': 'pluriel réel : messages entre les deux parents',
  'und.inbox.private': 'pluriel réel : « vous deux »',
  'dm.safetyNote': 'pluriel réel : conversation « entre vous deux » (le reste est au « tu »)',
  'dm.emptyOpen': 'pluriel réel : « vous vous suivez mutuellement »',
  'dm.blockBody': 'pluriel réel : les deux membres',
  'dm.request.body': 'pluriel réel : les deux membres',
  'dm.demo.papa1': 'pluriel réel : « votre organisation » (la famille)',
  'dom.question.family.q1': 'question de communauté adressée à toute la famille',
  'dom.question.ttc.q2': 'question de communauté adressée au couple',
  'h2.133.d': 'pluriel réel : semaine de lecture parent + enfant',
  'h2.177.d': 'pluriel réel : semaine du couple',
  'h2.180.d': 'pluriel réel : « vous deux »',
  'kn.k.ask.community.q': 'publication de démonstration adressée aux membres du forum',
  'l2.dm.sp0b': 'publication de démonstration adressée aux membres du forum',
  'l2.dm.sp1b': 'publication de démonstration adressée aux membres du forum',
  'l2.dm.sp2t': 'publication de démonstration adressée aux membres du forum',
  'l2.dm.sp5b': 'publication de démonstration adressée aux membres du forum',
  'l2.dm.sp6b': 'publication de démonstration adressée aux membres du forum',
  'l2.dm.sp7b': 'publication de démonstration adressée aux membres du forum',
  'l2.dm.sp8t': 'publication de démonstration adressée aux membres du forum',
  'l2.dm.sp8b': 'publication de démonstration adressée aux membres du forum',
  'cm.dom.alone': 'pluriel réel : se partager les domaines',
  'mis.sub': 'pluriel réel : demandes « entre vous »',
  'nm.ideas.note': 'pluriel réel : « que vous seuls pouvez juger » (les parents)',
  'sub3.shared.note': 'pluriel réel : « vous faites tous les deux partie du foyer »',
  'th.preg_names.d': 'pluriel réel : choisir à deux',
  'th.couple_week.d': 'pluriel réel : « vous dire ce qui compte »',
  'th.preg_names.problem': 'pluriel réel : le couple ne s’accorde pas',
  'th.couple_week.problem': 'pluriel réel : s’organiser à deux',
  'cu.intro': 'pluriel réel : rythme convenu entre les parents',
  'u7.names.voteTogetherBody': 'pluriel réel : prénoms qui plaisent aux deux',
  'bfi.q.latch': 'question posée à la consultante en lactation',
  'gp.q.experience': 'question posée à une candidate nounou',
  'gp.q.approval': 'question posée à une candidate nounou',
  'gp.q.children': 'question posée à une candidate nounou',
  'gp.q.meals': 'question posée à une candidate nounou',
  'gp.q.outings': 'question posée à une candidate nounou',
  'gp.q.illness': 'question posée à une candidate nounou',
  'gp.q.first_aid': 'question posée à une candidate nounou',
  'gp.q.adaptation': 'question posée à une candidate nounou',
  'gp.q.holidays': 'question posée à une candidate nounou',
  'gp.q.references': 'question posée à une candidate nounou',
  'rc.whatToDo': 'accord grammatical : « si ton enfant ou toi l’avez déjà consommé » (toi + un tiers → 2e personne du pluriel)',
};

describe('tutoiement : interface française', () => {
  it('aucune chaîne ne vouvoie le lecteur (hors liste blanche documentée)', () => {
    const bad = values('fr').filter(([k, v]) => !FR_ALLOW[k] && (FR_VOUS.test(clean(v)) || FR_EZ.test(clean(v))));
    expect(bad).toEqual([]);
  });
  it('la liste blanche reste nécessaire (chaque exception vouvoie encore)', () => {
    const fr = DICTIONARIES.fr as Record<string, Msg>;
    for (const k of Object.keys(FR_ALLOW)) {
      const v = fr[k];
      const txt = typeof v === 'string' ? v : Object.values(v ?? {}).join(' ');
      expect([k, FR_VOUS.test(clean(txt)) || FR_EZ.test(clean(txt))]).toEqual([k, true]);
    }
  });
  it('exemples : raisons, carte de détresse, Aura, abonnement au « tu »', () => {
    const fr = DICTIONARIES.fr as Record<string, string>;
    expect(fr['pz.r.breastfeeding'] ?? Object.values(fr).find((v) => typeof v === 'string' && v.startsWith('Parce que tu allaites'))).toBe('Parce que tu allaites');
    expect(Object.values(fr).some((v) => v === 'Tu n’es pas seul·e')).toBe(true);
    expect(Object.values(fr).some((v) => typeof v === 'string' && /Parce que vous/.test(v))).toBe(false);
  });
});

// ---------------------------------------------------------------- allemand, espagnol, italien
/** « Sie / Ihr… » en milieu de phrase = vouvoiement (en début de phrase ou après « : », c'est souvent « elle / ils »). */
const DE_FORMAL = /(?<![.!?:;•„“"(]\s)(?<![.!?:;•„“"(])(?<=\S\s)\b(Sie|Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihres)\b/;
const DE_ALLOW = new Set(['bfi.q.latch', 'gp.q.experience', 'gp.q.children', 'gp.q.meals', 'gp.q.outings', 'gp.q.illness', 'gp.q.first_aid',
  'gp.q.adaptation', 'gp.q.holidays', 'gp.q.hours', 'gp.q.references']); // questions posées à une professionnelle
const ES_FORMAL = /\b(usted|ustedes)\b|\b(Elija|Seleccione|Introduzca|Pulse|Deslice|Toque [A-ZÉ])\b/;
const ES_ALLOW = new Set(['gp.q.meals']);
const IT_FORMAL = /\b(Scelga|Selezioni|Inserisca|Tocchi|Trascini|La preghiamo)\b|(?<=\S\s)\b(Lei|Suo|Sua|Suoi|Sue)\b/;
const IT_ALLOW = new Set<string>(['h5.teeth.right', 'h5.teeth.left']); // « Sua destra / sinistra » : côté de l'enfant vu de face

describe('tutoiement : allemand (du), espagnol (tú), italien (tu)', () => {
  it.each([
    ['de', DE_FORMAL, DE_ALLOW],
    ['es', ES_FORMAL, ES_ALLOW],
    ['it', IT_FORMAL, IT_ALLOW],
  ] as const)('%s : aucune forme de politesse hors liste blanche', (lang, re, allow) => {
    const bad = values(lang).filter(([k, v]) => !allow.has(k) && re.test(clean(v)));
    expect(bad).toEqual([]);
  });
});

// ---------------------------------------------------------------- contenus éditoriaux et textes du serveur
const ROOT = process.cwd();
const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : [p];
});
/** fichiers éditoriaux français (les traductions et les textes juridiques sont exclus) */
const FR_CONTENT = walk(path.join(ROOT, 'src/content')).filter((p) => /\.(ts|json)$/.test(p)
  && !/\.(de|es|it|en)\.ts$|\/(de|es|it|en)\.ts$|\/en\/|legal\.ts$|privacy-policy\.ts$|firstnames\.json$|photos\.generated\.ts$/.test(p));

/** phrases relues qui gardent le « vous » : pluriel réel (couple, deux parents, parent + enfant) ou question à une professionnelle */
const CONTENT_ALLOW = [
  'Racontez votre journée chacun à votre tour', 'plutôt que de vous lever à deux', 'À deux, vous pouvez vous relayer', 'neuro-vous-netes-pas-seuls', 'Relayez-vous si vous êtes deux', 'un de vous',
  'êtes pas seuls', 'vos antécédents (opérations, infections, maladies, traitements) des deux côtés', 'des deux partenaires : de petits changements, à votre rythme',
  'toutes les chances de votre côté, à deux', 'Vous, parents, êtes au cœur', 'Organisez-vous à deux', 'ce qui vous aide le plus à deux',
  'vous pouvez aussi y aller ensemble', 'elle vous protège tous les deux', 'cherchez ensemble la méthode qui vous convient', 'Faites-vous dépister à deux',
  'Prévenez-vous mutuellement entre parents', 'que vous pouvez décider ensemble', 'adapter vos moments d’intimité', 'ni de vos sentiments',
  'Vous pouvez convenir ensemble', 'bon pour vous deux', 'si vous le souhaitez tous les deux', 'pour vous deux', 'Partenaire, proches** : soyez attentifs',
  'rien qu’à vous deux', 'Relayez-vous** entre parents', 'pour vous dire **comment chacun va**', 'Décidez ensemble**, à votre rythme',
  'décidez ensemble** du rattachement', 'si vous vous êtes mis d’accord', 'Coordonnez-vous à deux', 'Mettez-vous d’accord à deux', 'puis vous alternez',
  'Parler ensemble de ce que vous vivez', 'si vous êtes un couple ou une femme seule', 'si vous êtes rentrés très tôt', 'Ensemble, vous pouvez ajuster',
  'Remplissez ensemble (ou chacun de votre côté)', 'entraînez-vous ensemble', 'bercez-vous en rythme', 's’il vous fait plaisir à tous les deux',
  'vous, les parents** : vous demandez le PAI', 'Entre vous, parlez la langue', 'que vous êtes heureux de le voir grandir', 'Parlez-en** à deux : de vos envies',
  'Ne vous comparez pas à d’autres couples', 'Vous êtes les parents.**', 'à des moments où vous êtes disponibles', 'Faites l’inventaire de votre poste**, chacun de votre côté',
  'Si vous n’êtes pas tout à fait prêts', 'Mes cycles vous paraissent-ils', 'Sa croissance et son développement vous paraissent-ils',
  'Mes règles ou mon cycle vous semblent-ils', 'et vous inventez l’histoire ensemble',
];

describe('tutoiement : contenus éditoriaux français (articles, guides, recettes, jeux…)', () => {
  it('chaque phrase encore au « vous » est un pluriel réel ou une question à une professionnelle, relue', () => {
    const bad: string[] = [];
    for (const f of FR_CONTENT) {
      const txt = clean(fs.readFileSync(f, 'utf8'));
      for (const seg of txt.split(/(?<=[.!?;])\s+|\\n|\n/)) {
        if (!FR_VOUS.test(seg)) continue;
        if (CONTENT_ALLOW.some((a) => seg.includes(a))) continue;
        bad.push(`${path.relative(ROOT, f)} : ${seg.trim().slice(0, 140)}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('tutoiement : textes envoyés par le serveur', () => {
  const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  it('notifications de paiement, e-mails et réponses de sécurité au « tu »', () => {
    const rc = read('supabase/functions/_shared/revenuecat.ts');
    expect(rc).toContain('Ton abonnement n’a pas pu être renouvelé.');
    expect(rc).not.toMatch(/'Votre abonnement/);
    const mail = read('supabase/functions/auth-email/email.ts');
    expect(mail).toContain('Confirme ton adresse e-mail pour activer ton compte.');
    expect(mail).not.toMatch(/\b(Confirmez|votre|Vous avez)\b/);
    const safety = read('supabase/functions/_shared/safety.ts');
    expect(safety).toContain('Ce que tu traverses compte, et tu n’as pas à le porter seule ou seul.');
    expect(safety).not.toMatch(/'[^']*\b(Ce que vous|Si vous pensez|Appelez le)\b/);
  });
  it('la migration additive réécrit les notifications SQL et reste idempotente (aucune paire ne réintroduit son texte d’origine)', () => {
    const sql = read('supabase/migrations/20261202000100_tutoiement.sql');
    expect(sql).toContain("$tu$'Une tâche t’est confiée'$tu$");
    const pairs = [...sql.matchAll(/\(\$tu\$(.*?)\$tu\$, \$tu\$(.*?)\$tu\$\)/g)];
    expect(pairs.length).toBeGreaterThan(50);
    for (const [, from, to] of pairs) expect(to.includes(from)).toBe(false);
  });
});
