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
export const VIDEOS_CHECKED_ON = '2026-11-07';

export type VideoChannel = 'spf' | 'has' | 'ameli';
export type VideoTopic = 'baby' | 'me' | 'meals';
export interface OfficialVideo {
  /** Identifiant YouTube (11 caractères). */
  id: string;
  by: VideoChannel;
  topic: VideoTopic;
  /** Titre court affiché (clé sol.v.<key>) ; le titre exact de la chaîne reste visible sur YouTube. */
  key: string;
}

export const OFFICIAL_VIDEOS: OfficialVideo[] = [
  // Bébé au quotidien
  { id: '-9O4Go_lidQ', by: 'has', topic: 'baby', key: 'shaken_parents' },        // HAS - Bébé secoué : Ce que savent les jeunes parents
  { id: 'IscZPl8f4oU', by: 'has', topic: 'baby', key: 'shaken_doctor' },         // HAS - Bébé secoué : Les réponses du médecin
  { id: 'qG88EmGtSPQ', by: 'spf', topic: 'baby', key: 'sleep_routine' },         // Une routine miracle pour endormir bébé : un pédiatre nous répond
  { id: 'HhtKdT4FtHk', by: 'spf', topic: 'baby', key: 'connection' },            // L'importance des moments de connexion parent-bébé
  { id: '5c97SHGXZU8', by: 'spf', topic: 'baby', key: 'screens' },               // Parents sans écran : un pédiatre nous explique les bienfaits
  { id: 'O2IzhSBA0OI', by: 'spf', topic: 'baby', key: 'breastfeeding' },         // [Des pros à votre écoute] Ma fille n'arrivait plus à prendre le sein
  { id: '3Ug8vL9cLJs', by: 'spf', topic: 'baby', key: 'weight' },                // [Des pros à votre écoute] La prise de poids de bébé me stresse énormément
  { id: '1RNL6FgQFK4', by: 'spf', topic: 'baby', key: 'compare' },               // [Des pros à votre écoute] Ce n'est pas faute de savoir qu'il ne faut pas comparer son enfant…
  // Pour moi
  { id: 'cF5O8Mkz-Is', by: 'spf', topic: 'me', key: 'forget_myself' },          // [Des pros à votre écoute] Quand on a accouché… on s'oublie soi
  { id: 'YgmlqgbahtU', by: 'spf', topic: 'me', key: 'pmi_home' },                // [Des pros à votre écoute] Des visites à domicile peuvent être proposées par la PMI
  { id: 'IBnkBB46TG0', by: 'ameli', topic: 'me', key: 'not_alone' },             // Santé mentale : Ne restez pas seul.e avec votre mal-être !
  { id: '3fu2O22bN2c', by: 'ameli', topic: 'me', key: 'psy' },                   // Mon soutien psy | L'essentiel
  // Repas de l'enfant
  { id: 'RMvvJ2Qd2c0', by: 'spf', topic: 'meals', key: 'portions' },             // Petit à petit, les portions de votre enfant augmentent
  { id: 'o_CEPpC5MIo', by: 'spf', topic: 'meals', key: 'appetite' },             // Comment aider votre enfant à écouter son appétit ?
  { id: '0SY_8YtfaCc', by: 'spf', topic: 'meals', key: 'veggies' },              // Comment faire manger plus de fruits et légumes à votre enfant ?
];

export const VIDEO_TOPICS: VideoTopic[] = ['baby', 'me', 'meals'];

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
