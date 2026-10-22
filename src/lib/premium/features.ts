/**
 * Offre Premium : ce que chaque fonction apporte, ce qui reste gratuit, et le quota gratuit éventuel.
 * Règle d'or : le Premium AJOUTE de l'analyse, de l'automatisation et du partage ; il ne retire jamais l'accès aux
 * données déjà créées ni à la sécurité. Les droits sont vérifiés côté serveur (has_premium, quotas, déclencheurs).
 */
export type PremiumFeature =
  | 'sleep_insights' | 'bedtime_routine' | 'assistant_more' | 'assistant_saved' | 'assistant_suggestions'
  | 'scanner_more' | 'scanner_compare' | 'coparent_invite' | 'voice_entry' | 'summaries' | 'summary_export'
  | 'weekly_menu' | 'cycle_insights' | 'cycle_export' | 'cycle_trends' | 'cycle_custom' | 'family_summary' | 'more_children' | 'more_reminders'
  | 'more_documents' | 'more_lists' | 'premium_content' | 'growth_export' | 'diversification'
  | 'community_profile' | 'community_groups' | 'community_albums' | 'community_search' | 'community_history' | 'saved_folders' | 'community_ai' | 'community_events';

/** Quota mensuel (clé de plan_limits) : la version gratuite permet d'essayer. */
export const QUOTA_OF: Partial<Record<PremiumFeature, string>> = {
  assistant_more: 'assistant_questions_per_month',
  scanner_more: 'product_scans_per_month',
  voice_entry: 'voice_entries_per_month',
  summary_export: 'summary_exports_per_month',
  more_children: 'children_count',
  more_reminders: 'custom_reminders_count',
  more_documents: 'documents_count',
  more_lists: 'checklists_count',
};

export interface FeatureInfo { title: string; benefit: string; free: string; premium: string; icon: string }

/** {name} = prénom du profil affiché (Lina, Noé…), {profile} = « votre grossesse », etc. */
export const FEATURES: Record<PremiumFeature, FeatureInfo> = {
  sleep_insights: { icon: 'moon', title: 'Découvrez le rythme personnalisé de {name}', benefit: 'Après chaque réveil : prochaine sieste, routine et coucher estimés d’après son âge puis ses propres relevés, recalculés en temps réel, avec des notifications douces et des tendances sur 7 jours.', free: 'Noter siestes, nuits, réveils et repas de nuit ; modifier les horaires ; totaux du jour ; aide pour la nuit ; couchage en sécurité', premium: 'Estimations personnalisées, recalcul, notifications, retours « juste / trop tôt / trop tard », moyennes et évolution' },
  bedtime_routine: { icon: 'star', title: 'Une routine du coucher pour {name}', benefit: 'Les étapes de votre soirée, dans votre ordre, avec un rappel facultatif à l’heure choisie.', free: '—', premium: 'Routine personnalisable et rappel' },
  assistant_more: { icon: 'message-circle', title: 'Poser toutes vos questions à l’assistant', benefit: 'Beaucoup plus de questions chaque mois, adaptées à votre parcours et au profil affiché.', free: 'Quelques questions par mois', premium: 'Questions beaucoup plus nombreuses' },
  assistant_saved: { icon: 'bookmark', title: 'Garder les réponses utiles', benefit: 'Enregistrez une réponse pour la retrouver en un instant.', free: 'Relire les réponses déjà enregistrées', premium: 'Enregistrer de nouvelles réponses' },
  assistant_suggestions: { icon: 'compass', title: 'Des questions suggérées pour {name}', benefit: 'Des idées de questions selon la semaine de grossesse ou l’âge exact de l’enfant.', free: 'Suggestions générales', premium: 'Suggestions personnalisées' },
  scanner_more: { icon: 'maximize', title: 'Analyser tous vos produits', benefit: 'Analyses étendues chaque mois, adaptées au profil choisi.', free: 'Quelques analyses par mois ; alertes officielles de rappel toujours illimitées', premium: 'Analyses étendues' },
  scanner_compare: { icon: 'columns', title: 'Comparez ces produits', benefit: 'Composition, allergènes et précautions côte à côte, sans note opaque.', free: '—', premium: 'Comparaison et filtres par profil' },
  coparent_invite: { icon: 'users', title: 'Partagez les informations avec votre coparent', benefit: 'Invitation sécurisée, choix des profils partagés, lecture ou modification, synchronisation sans doublon, révocation immédiate.', free: 'Retirer un membre et quitter un foyer à tout moment', premium: 'Inviter et partager par profil' },
  voice_entry: { icon: 'mic', title: 'Enregistrer simplement avec votre voix', benefit: '« Lina a bu 150 ml à 13 h 10 » : la phrase devient une saisie, que vous confirmez.', free: 'Quelques essais par mois', premium: 'Saisie vocale illimitée en pratique' },
  summaries: { icon: 'file-text', title: 'Générez le résumé complet de {name}', benefit: 'Repas, sommeil, couches, symptômes notés, traitements prescrits, mesures : les faits enregistrés, sans interprétation.', free: 'Résumé du jour', premium: 'Résumés de la semaine et avant rendez-vous' },
  summary_export: { icon: 'share', title: 'Exporter ou partager le résumé', benefit: 'Un PDF clair à montrer au professionnel de santé.', free: '1 export par mois', premium: 'Exports fréquents' },
  weekly_menu: { icon: 'calendar', title: 'Préparez les menus de toute la semaine', benefit: 'Un menu adapté à chaque profil, la liste de courses faite automatiquement.', free: 'Bibliothèque de recettes, favoris, filtres, courses d’une recette', premium: 'Menus hebdomadaires et courses automatiques' },
  cycle_insights: { icon: 'bar-chart-2', title: 'Comprendre vos cycles', benefit: 'Statistiques lisibles et tendances sur tout votre historique (toujours des estimations).', free: 'Calendrier, saisies, estimations de base', premium: 'Statistiques et tendances' },
  cycle_trends: { icon: 'trending-up', title: 'Repérer ce qui revient dans votre cycle', benefit: 'Les tendances observées dans vos propres données (après plusieurs cycles comparables) et, si vous le souhaitez, un message avant une période où vous notez souvent un symptôme. Jamais une certitude.', free: 'Calendrier, règles, estimation simple, symptômes essentiels, informations générales et de sécurité', premium: 'Tendances personnelles et anticipation' },
  cycle_custom: { icon: 'tag', title: 'Personnaliser votre suivi du cycle', benefit: 'Vos propres éléments à suivre et autant d’étiquettes que vous le souhaitez.', free: '3 étiquettes différentes', premium: 'Éléments personnalisés et étiquettes illimitées' },
  cycle_export: { icon: 'download', title: 'Exporter votre suivi de cycle', benefit: 'Un PDF à partager avec votre professionnel de santé.', free: '—', premium: 'Export PDF' },
  family_summary: { icon: 'home', title: 'Le résumé familial du jour', benefit: 'Chaque enfant, ses repas, son sommeil et ses rendez-vous, sans rien mélanger.', free: 'Vue d’ensemble des profils', premium: 'Résumé quotidien familial' },
  more_children: { icon: 'user-plus', title: 'Suivre plus d’enfants', benefit: 'Davantage de profils, chacun avec ses propres données.', free: 'Jusqu’à 3 enfants', premium: 'Profils étendus' },
  more_reminders: { icon: 'bell', title: 'Des rappels personnels sans compter', benefit: 'Rappels entièrement configurables : modifier, reporter, désactiver.', free: '5 rappels personnels ; médicaments prescrits, biberons et vaccins toujours illimités', premium: 'Rappels personnels étendus' },
  more_documents: { icon: 'folder', title: 'Un coffre de documents étendu', benefit: 'Échographies, ordonnances, comptes rendus : tout au même endroit.', free: 'Coffre limité', premium: 'Coffre étendu' },
  more_lists: { icon: 'check-square', title: 'Des listes de préparation illimitées', benefit: 'Valise de maternité, papiers, chambre…', free: 'Quelques listes', premium: 'Listes étendues' },
  premium_content: { icon: 'book-open', title: 'Guides approfondis', benefit: 'Séries et guides adaptés à l’âge exact ou à la semaine de grossesse.', free: 'Toutes les informations de sécurité', premium: 'Guides approfondis' },
  growth_export: { icon: 'download', title: 'Exporter les mesures', benefit: 'Un fichier des mesures de croissance à partager.', free: '—', premium: 'Export des mesures' },
  diversification: { icon: 'coffee', title: 'Suivre la diversification', benefit: 'Aliments introduits, réactions notées, textures.', free: '—', premium: 'Suivi de la diversification' },
  community_profile: { icon: 'feather', title: 'Personnaliser votre profil communautaire', benefit: 'Une couleur, une bannière, une présentation plus longue, et un badge Premium discret si vous le souhaitez.', free: 'Pseudonyme, identifiant, avatar ou photo, courte présentation, parcours', premium: 'Couleur, bannière, présentation enrichie, badge facultatif' },
  community_groups: { icon: 'lock', title: 'Créez votre groupe privé de parents', benefit: 'Un espace rien qu’à vous, sur invitation : les publications restent invisibles pour le reste de la communauté.', free: 'Rejoindre les groupes thématiques, les groupes par mois et les groupes privés où l’on vous invite', premium: 'Créer des groupes privés et inviter des membres' },
  community_albums: { icon: 'image', title: 'Des albums photo à partager', benefit: 'Des albums privés, ou partagés seulement avec les membres que vous choisissez. Photos nettoyées de leur position GPS.', free: 'Voir les albums que l’on partage avec vous ; jusqu’à 4 photos par publication', premium: 'Créer des albums et les partager' },
  community_search: { icon: 'sliders', title: 'Filtres et recherche avancés', benefit: 'Plusieurs catégories à la fois, sondages, publications avec photos, sans réponse, d’un membre, d’une période.', free: 'Recherche par mots-clés et par catégorie, fils « Pour vous », « Abonnements » et « Récent »', premium: 'Filtres combinés et recherche avancée' },
  community_history: { icon: 'clock', title: 'Votre journal d’activité', benefit: 'La chronologie de vos publications, réponses, réactions et enregistrements.', free: 'Vos publications, réponses, publications aimées et enregistrées restent toutes consultables', premium: 'Chronologie complète et filtrable' },
  saved_folders: { icon: 'folder', title: 'Ranger vos enregistrements', benefit: 'Des dossiers pour retrouver en un instant les discussions utiles (« Sommeil », « Valise »…).', free: 'Enregistrer sans limite', premium: 'Dossiers' },
  community_ai: { icon: 'align-left', title: 'Résumer une longue discussion', benefit: 'L’essentiel d’une discussion de plus de 6 réponses, présenté comme des témoignages. Traduction d’un message si besoin.', free: 'Lire toutes les réponses', premium: 'Résumé et traduction (service d’IA à configurer côté serveur)' },
  community_events: { icon: 'video', title: 'Ateliers et rencontres', benefit: 'Des ateliers et rencontres en visio réservés aux abonné·es, quand l’équipe en programme.', free: 'Toute la communauté et les informations de sécurité', premium: 'Inscription aux ateliers' },
};

/** Toujours gratuit, quel que soit l'abonnement (affiché sur l'écran d'abonnement et vérifié par les tests). */
export const ALWAYS_FREE = [
  'Informations et numéros d’urgence',
  'Ressources sur la dépression du post-partum',
  'Alertes officielles de rappel de produits',
  'Suppression du compte et export légal de vos données',
  'Gestion des consentements',
  'Signalement et blocage dans la communauté',
  'Profil communautaire, publications avec photos, commentaires, réactions, abonnements à des membres et à des catégories',
  'Accès à toutes les données que vous avez déjà créées, même après la fin d’un abonnement',
  'Rappels de médicaments prescrits, de biberon et de vaccins',
];

export const featureTitle = (f: PremiumFeature, name?: string | null) => FEATURES[f].title.replace('{name}', name || 'votre enfant');

/** Erreur serveur « fonction Premium » ou « limite gratuite atteinte ». */
export const isPremiumRequired = (e: unknown) => {
  const x = e as { hint?: string; message?: string; code?: string; status?: number; isPremiumRequired?: boolean } | null;
  return !!x && (x.isPremiumRequired === true || x.hint === 'premium_required' || x.status === 402 || /Fonction Premium|Limite de la version gratuite/.test(x.message ?? ''));
};
