/**
 * Vidéos OFFICIELLES lues dans l'appli (07/11/2026).
 *
 * Chaque vidéo a été vérifiée le 07/11/2026 via l'oEmbed de YouTube : elle existe, elle est publiée par la chaîne
 * indiquée (`by`) et son auteur autorise l'intégration (oEmbed 200). Aucune vidéo n'est copiée : elles sont lues
 * avec le lecteur YouTube (mode sans cookie), chargé seulement quand la personne appuie sur « Lire ».
 *
 * Les fichiers MP4 de 1000-premiers-jours.fr ne sont PAS utilisés : leurs mentions légales soumettent toute reprise
 * à l'accord de Santé publique France et excluent l'usage commercial.
 */
import { toolArticleScore } from '@/lib/domain/toolArticles';

export const VIDEOS_CHECKED_ON = '2026-11-07';

export type VideoChannel = 'spf' | 'has' | 'ameli';
export type VideoTopic = 'pregnancy' | 'baby' | 'sleep' | 'feeding' | 'meals' | 'couple' | 'me';
export type VideoJourney = 'pregnant' | 'newborn' | 'child';
export interface OfficialVideo {
  /** Identifiant YouTube (11 caractères). */
  id: string;
  by: VideoChannel;
  topic: VideoTopic;
  /** Titre court affiché (clé sol.v.<key>) ; le titre exact de la chaîne reste visible sur YouTube. */
  key: string;
  /** Mots-clés pour relier les articles de la bibliothèque (les 3 premiers comptent double). */
  words: string[];
  cats?: string[];
  /** Mots qui écartent un article (titre). */
  not?: string[];
  journeys?: VideoJourney[];
}

// Toutes vérifiées le 07/11/2026 : chaîne officielle (oEmbed), intégration autorisée et LECTURE réelle constatée.
export const OFFICIAL_VIDEOS: OfficialVideo[] = [
  // Grossesse
  { id: 'FeYcx3fvO_Y', by: 'spf', topic: 'pregnancy', key: 'first_1000', words: ['attachement', '1000 premiers jours', 'lien', 'developpement du cerveau', 'eveil'], journeys: ['pregnant', 'newborn'] },            // L'impact des 1 000 premiers jours : un pédiatre nous explique
  { id: 'd2yk55Qsg4k', by: 'spf', topic: 'pregnancy', key: 'small_ailments', words: ['petits maux', 'nausees', 'grossesse', 'fatigue', 'brulures'], cats: ['corps-grossesse', 'sante-grossesse'], journeys: ['pregnant'] }, // [Des pros à votre écoute] Les petits maux ne sont pas si petits que ça !
  { id: 'K_BgbOrgiQM', by: 'spf', topic: 'pregnancy', key: 'play_before_birth', words: ['haptonomie', 'lien', 'bebe in utero', 'grossesse', 'attachement'], journeys: ['pregnant'] },                // Jouer avec bébé avant la naissance : un pédiatre réagit
  // Bébé au quotidien
  { id: '-9O4Go_lidQ', by: 'has', topic: 'baby', key: 'shaken_parents', words: ['bebe secoue', 'pleurs', 'colere', 'epuisement'], journeys: ['newborn'] },        // HAS - Bébé secoué : Ce que savent les jeunes parents
  { id: 'IscZPl8f4oU', by: 'has', topic: 'baby', key: 'shaken_doctor', words: ['bebe secoue', 'pleurs', 'signes d alerte', 'coliques'], not: ['psychose'], journeys: ['newborn'] },          // HAS - Bébé secoué : Les réponses du médecin
  { id: 'HhtKdT4FtHk', by: 'spf', topic: 'baby', key: 'connection', words: ['attachement', 'lien', 'eveil', 'jeu', 'interactions'], cats: ['developpement', 'activites-eveil'], journeys: ['newborn'] }, // L'importance des moments de connexion parent-bébé
  { id: '5c97SHGXZU8', by: 'spf', topic: 'baby', key: 'screens', words: ['ecrans', 'ecran', 'telephone', 'television'], journeys: ['newborn', 'child'] },                // Parents sans écran : un pédiatre nous explique les bienfaits
  { id: '1RNL6FgQFK4', by: 'spf', topic: 'baby', key: 'compare', words: ['developpement', 'etapes', 'comparer', 'marche', 'langage'], cats: ['developpement'], journeys: ['newborn'] }, // [Des pros à votre écoute] Ce n'est pas faute de savoir qu'il ne faut pas comparer son enfant…
  // Sommeil
  { id: 'qG88EmGtSPQ', by: 'spf', topic: 'sleep', key: 'sleep_routine', words: ['sommeil', 'endormir', 'coucher', 'rituel', 'nuit'], cats: ['sommeil'], journeys: ['newborn', 'child'] }, // Une routine miracle pour endormir bébé : un pédiatre nous répond
  // Allaitement et biberon
  { id: 'O2IzhSBA0OI', by: 'spf', topic: 'feeding', key: 'breastfeeding', words: ['allaitement', 'sein', 'tetee', 'lactation'], journeys: ['newborn'] },         // [Des pros à votre écoute] Ma fille n'arrivait plus à prendre le sein
  { id: '3Ug8vL9cLJs', by: 'spf', topic: 'feeding', key: 'weight', words: ['prise de poids', 'poids', 'courbe', 'croissance'], journeys: ['newborn'] },                // [Des pros à votre écoute] La prise de poids de bébé me stresse énormément
  // Repas de l'enfant
  { id: 'RMvvJ2Qd2c0', by: 'spf', topic: 'meals', key: 'portions', words: ['portions', 'quantites', 'repas', 'alimentation'], journeys: ['child'] },             // Petit à petit, les portions de votre enfant augmentent
  { id: 'o_CEPpC5MIo', by: 'spf', topic: 'meals', key: 'appetite', words: ['appetit', 'refuse de manger', 'repas', 'alimentation'], journeys: ['child'] },             // Comment aider votre enfant à écouter son appétit ?
  { id: '0SY_8YtfaCc', by: 'spf', topic: 'meals', key: 'veggies', words: ['legumes', 'fruits', 'neophobie', 'repas'], journeys: ['child'] },              // Comment faire manger plus de fruits et légumes à votre enfant ?
  // Couple
  { id: 'TMqX-8Mo2Vc', by: 'spf', topic: 'couple', key: 'couple_second', words: ['couple', 'charge mentale', 'sexualite apres', 'communication'], journeys: ['pregnant', 'newborn'] }, // [Des pros à votre écoute] Notre couple est passé en second, c'est bébé en priorité
  // Prendre soin de soi
  { id: 'cF5O8Mkz-Is', by: 'spf', topic: 'me', key: 'forget_myself', words: ['post-partum', 'baby blues', 'fatigue', 'retour a la maison'], cats: ['post-partum', 'sante-mentale'] },          // [Des pros à votre écoute] Quand on a accouché… on s'oublie soi
  { id: 'YgmlqgbahtU', by: 'spf', topic: 'me', key: 'pmi_home', words: ['pmi', 'sage-femme', 'visite a domicile', 'retour a la maison'] },                // [Des pros à votre écoute] Des visites à domicile peuvent être proposées par la PMI
  { id: 'IBnkBB46TG0', by: 'ameli', topic: 'me', key: 'not_alone', words: ['sante mentale', 'depression', 'anxiete', 'epuisement'], cats: ['sante-mentale'] },             // Santé mentale : Ne restez pas seul.e avec votre mal-être !
  { id: '3fu2O22bN2c', by: 'ameli', topic: 'me', key: 'psy', words: ['psychologue', 'soutien psy', 'sante mentale', 'depression'], cats: ['sante-mentale'] },                   // Mon soutien psy | L'essentiel
  { id: 'a54dG9wg5uw', by: 'ameli', topic: 'me', key: 'psy_session', words: ['psychologue', 'soutien psy', 'depression du post-partum', 'anxiete', 'sante mentale'], cats: ['sante-mentale'] },        // Mon soutien psy | Entretien avec une psychologue conventionnée
];

export const VIDEO_TOPICS: VideoTopic[] = ['pregnancy', 'baby', 'sleep', 'feeding', 'meals', 'couple', 'me'];

/** Thème à ouvrir en premier selon le moment de vie de la personne. */
export function defaultTopic(journeys: string[]): VideoTopic {
  if (journeys.includes('pregnant')) return 'pregnancy';
  if (journeys.includes('newborn')) return 'baby';
  if (journeys.includes('child')) return 'meals';
  return 'me';
}

const ID = /^[A-Za-z0-9_-]{11}$/;

/** Lecteur YouTube sans cookie (youtube-nocookie.com), lancé à la demande, vidéos proposées limitées à la chaîne. */
export function embedUrl(id: string, opts: { origin?: string; lang?: string } = {}): string {
  if (!ID.test(id)) throw new Error('Identifiant vidéo invalide');
  const p = new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0', modestbranding: '1', hl: opts.lang ?? 'fr', cc_lang_pref: opts.lang ?? 'fr' });
  if (opts.origin) p.set('origin', opts.origin);
  return `https://www.youtube-nocookie.com/embed/${id}?${p.toString()}`;
}

/** Lien pour ouvrir la vidéo sur YouTube (secours si le lecteur intégré ne charge pas). */
export function watchUrl(id: string): string {
  if (!ID.test(id)) throw new Error('Identifiant vidéo invalide');
  return `https://www.youtube.com/watch?v=${id}`;
}

export function videoById(id: string): OfficialVideo | undefined {
  return OFFICIAL_VIDEOS.find((v) => v.id === id);
}

/** Articles de la bibliothèque qui prolongent une vidéo (mêmes règles que les articles des outils). */
export function articlesForVideo<T extends { id: string; title: string; slug: string; tags?: string[]; journeys?: string[]; category_id?: string | null }>(
  video: OfficialVideo, articles: T[], slugOf: Map<string, string | null | undefined>, n = 3,
): T[] {
  const topic = { words: video.words, cats: video.cats, journeys: video.journeys, not: video.not };
  return articles
    .map((a) => ({ a, s: toolArticleScore(topic as never, a as never, slugOf.get(a.category_id ?? '') ?? undefined) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s || x.a.title.length - y.a.title.length)
    .slice(0, n)
    .map((x) => x.a);
}
