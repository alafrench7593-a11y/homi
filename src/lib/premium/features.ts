/**
 * Offre Premium : ce que chaque fonction apporte, ce qui reste gratuit, et le quota gratuit éventuel.
 * Règle d'or : le Premium AJOUTE de l'analyse, de l'automatisation et du partage ; il ne retire jamais l'accès aux
 * données déjà créées ni à la sécurité. Les droits sont vérifiés côté serveur (has_premium, quotas, déclencheurs).
 */
import { t as tr } from '@/i18n';
import { localized } from '@/i18n/localized';

export type PremiumFeature =
  | 'sleep_insights' | 'bedtime_routine' | 'assistant_more' | 'assistant_saved' | 'assistant_suggestions'
  | 'scanner_more' | 'scanner_compare' | 'coparent_invite' | 'voice_entry' | 'summaries' | 'summary_export'
  | 'weekly_menu' | 'cycle_insights' | 'cycle_export' | 'cycle_trends' | 'cycle_custom' | 'cycle_share' | 'cycle_monthly' | 'family_summary' | 'more_children' | 'more_reminders'
  | 'more_documents' | 'more_lists' | 'premium_content' | 'growth_export' | 'diversification' | 'development_full'
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
  diversification: 'food_discoveries_per_child',
};

export interface FeatureInfo { title: string; benefit: string; free: string; premium: string; icon: string }

/** {name} = prénom du profil affiché (Lina, Noé…), {profile} = « votre grossesse », etc. */
const FEATURES_FR: Record<PremiumFeature, FeatureInfo> = {
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
  cycle_share: { icon: 'users', title: 'Partager votre cycle avec votre partenaire', benefit: 'Vous choisissez quoi partager (règles, fenêtre fertile estimée, humeur, symptômes) avec un membre de votre foyer, en lecture seule ; jamais les rapports, la contraception ni vos notes. Révocable à tout moment.', free: 'Rien n’est partagé', premium: 'Partage choisi et révocable' },
  cycle_monthly: { icon: 'file-text', title: 'Le résumé de votre mois', benefit: 'Règles, durée du cycle, symptômes et humeurs les plus notés du mois, en PDF à garder ou à montrer à votre professionnel. Des faits notés, jamais un diagnostic.', free: 'Calendrier et fiche de chaque jour', premium: 'Résumé mensuel et PDF' },
  cycle_export: { icon: 'download', title: 'Exporter votre suivi de cycle', benefit: 'Un PDF à partager avec votre professionnel de santé.', free: '—', premium: 'Export PDF' },
  family_summary: { icon: 'home', title: 'Le résumé familial du jour', benefit: 'Chaque enfant, ses repas, son sommeil et ses rendez-vous, sans rien mélanger.', free: 'Vue d’ensemble des profils', premium: 'Résumé quotidien familial' },
  more_children: { icon: 'user-plus', title: 'Suivre plus d’enfants', benefit: 'Davantage de profils, chacun avec ses propres données.', free: 'Jusqu’à 3 enfants', premium: 'Profils étendus' },
  more_reminders: { icon: 'bell', title: 'Des rappels personnels sans compter', benefit: 'Rappels entièrement configurables : modifier, reporter, désactiver.', free: '5 rappels personnels ; médicaments prescrits, biberons et vaccins toujours illimités', premium: 'Rappels personnels étendus' },
  more_documents: { icon: 'folder', title: 'Un coffre de documents étendu', benefit: 'Échographies, ordonnances, comptes rendus : tout au même endroit.', free: 'Coffre limité', premium: 'Coffre étendu' },
  more_lists: { icon: 'check-square', title: 'Des listes de préparation illimitées', benefit: 'Valise de maternité, papiers, chambre…', free: 'Quelques listes', premium: 'Listes étendues' },
  premium_content: { icon: 'book-open', title: 'Guides approfondis', benefit: 'Séries et guides adaptés à l’âge exact ou à la semaine de grossesse.', free: 'Toutes les informations de sécurité', premium: 'Guides approfondis' },
  growth_export: { icon: 'download', title: 'Exporter les mesures', benefit: 'Un fichier des mesures de croissance à partager.', free: '—', premium: 'Export des mesures' },
  diversification: { icon: 'coffee', title: 'Toutes les découvertes de {name}', benefit: 'Le catalogue complet des aliments, les recettes qui utilisent ce qu’il a déjà goûté, des idées adaptées à son âge, des filtres avancés et tout l’historique.', free: 'Jusqu’à 15 aliments suivis par enfant, les aliments essentiels de chaque catégorie, les allergènes, les informations de sécurité et l’historique des 30 derniers jours', premium: 'Catalogue complet, recettes associées, idées personnalisées, filtres avancés, historique complet' },
  development_full: { icon: 'trending-up', title: 'Suivre toutes les étapes de {name}', benefit: 'Toutes les étapes de chaque tranche d’âge, avec une activité adaptée pour chacune, et un résumé PDF à montrer au professionnel.', free: 'Les étapes principales, les conseils de sécurité, les sources et le résumé à l’écran', premium: 'Suivi complet, activités adaptées à l’âge, résumé PDF' },
  community_profile: { icon: 'feather', title: 'Personnaliser votre profil communautaire', benefit: 'Une couleur, une bannière, une présentation plus longue, et un badge Premium discret si vous le souhaitez.', free: 'Pseudonyme, identifiant, avatar ou photo, courte présentation, parcours', premium: 'Couleur, bannière, présentation enrichie, badge facultatif' },
  community_groups: { icon: 'lock', title: 'Créez votre groupe privé de parents', benefit: 'Un espace rien qu’à vous, sur invitation : les publications restent invisibles pour le reste de la communauté.', free: 'Rejoindre les groupes thématiques, les groupes par mois et les groupes privés où l’on vous invite', premium: 'Créer des groupes privés et inviter des membres' },
  community_albums: { icon: 'image', title: 'Des albums photo à partager', benefit: 'Des albums privés, ou partagés seulement avec les membres que vous choisissez. Photos nettoyées de leur position GPS.', free: 'Voir les albums que l’on partage avec vous ; jusqu’à 4 photos par publication', premium: 'Créer des albums et les partager' },
  community_search: { icon: 'sliders', title: 'Filtres et recherche avancés', benefit: 'Plusieurs catégories à la fois, sondages, publications avec photos, sans réponse, d’un membre, d’une période.', free: 'Recherche par mots-clés et par catégorie, fils « Pour vous », « Abonnements » et « Récent »', premium: 'Filtres combinés et recherche avancée' },
  community_history: { icon: 'clock', title: 'Votre journal d’activité', benefit: 'La chronologie de vos publications, réponses, réactions et enregistrements.', free: 'Vos publications, réponses, publications aimées et enregistrées restent toutes consultables', premium: 'Chronologie complète et filtrable' },
  saved_folders: { icon: 'folder', title: 'Ranger vos enregistrements', benefit: 'Des dossiers pour retrouver en un instant les discussions utiles (« Sommeil », « Valise »…).', free: 'Enregistrer sans limite', premium: 'Dossiers' },
  community_ai: { icon: 'align-left', title: 'Résumer une longue discussion', benefit: 'L’essentiel d’une discussion de plus de 6 réponses, présenté comme des témoignages. Traduction d’un message si besoin.', free: 'Lire toutes les réponses', premium: 'Résumé et traduction (service d’IA à configurer côté serveur)' },
  community_events: { icon: 'video', title: 'Ateliers et rencontres', benefit: 'Des ateliers et rencontres en visio réservés aux abonné·es, quand l’équipe en programme.', free: 'Toute la communauté et les informations de sécurité', premium: 'Inscription aux ateliers' },
};


const FEATURES_EN: Record<PremiumFeature, FeatureInfo> = {
  sleep_insights: { icon: 'moon', title: 'Discover {name}’s personalised rhythm', benefit: 'After each waking: next nap, routine and bedtime estimated from their age, then from their own records, recalculated in real time, with gentle notifications and 7-day trends.', free: 'Log naps, nights, wakings and night feeds; edit times; today’s totals; night-time help; sleep safety information', premium: 'Personalised estimates, recalculation, notifications, “just right / too early / too late” feedback, averages and trends' },
  bedtime_routine: { icon: 'star', title: 'A bedtime routine for {name}', benefit: 'The steps of your evening, in your order, with an optional reminder at the time you choose.', free: '—', premium: 'Customisable routine and reminder' },
  assistant_more: { icon: 'message-circle', title: 'Ask the assistant all your questions', benefit: 'Many more questions each month, tailored to your journey and the profile shown.', free: 'A few questions per month', premium: 'Many more questions' },
  assistant_saved: { icon: 'bookmark', title: 'Keep the useful answers', benefit: 'Save an answer to find it again in an instant.', free: 'Re-read answers you have already saved', premium: 'Save new answers' },
  assistant_suggestions: { icon: 'compass', title: 'Suggested questions for {name}', benefit: 'Question ideas based on the exact week of pregnancy or the child’s exact age.', free: 'General suggestions', premium: 'Personalised suggestions' },
  scanner_more: { icon: 'maximize', title: 'Analyse all your products', benefit: 'Extended analyses each month, tailored to the chosen profile.', free: 'A few analyses per month; official recall alerts always unlimited', premium: 'Extended analyses' },
  scanner_compare: { icon: 'columns', title: 'Compare these products', benefit: 'Ingredients, allergens and precautions side by side, with no opaque score.', free: '—', premium: 'Comparison and filters by profile' },
  coparent_invite: { icon: 'users', title: 'Share information with your co-parent', benefit: 'Secure invitation, choice of shared profiles, read or edit access, duplicate-free syncing, immediate revocation.', free: 'Remove a member and leave a household at any time', premium: 'Invite and share by profile' },
  voice_entry: { icon: 'mic', title: 'Log simply with your voice', benefit: '“Lina drank 150 ml at 1:10 pm”: the sentence becomes an entry, which you confirm.', free: 'A few tries per month', premium: 'Voice entry, unlimited in practice' },
  summaries: { icon: 'file-text', title: 'Generate {name}’s full summary', benefit: 'Meals, sleep, nappies, symptoms logged, prescribed treatments, measurements: the recorded facts, without interpretation.', free: 'Today’s summary', premium: 'Weekly summaries and pre-appointment summaries' },
  summary_export: { icon: 'share', title: 'Export or share the summary', benefit: 'A clear PDF to show your health professional.', free: '1 export per month', premium: 'Frequent exports' },
  weekly_menu: { icon: 'calendar', title: 'Plan menus for the whole week', benefit: 'A menu suited to each profile, with the shopping list made automatically.', free: 'Recipe library, favourites, filters, shopping list for one recipe', premium: 'Weekly menus and automatic shopping lists' },
  cycle_insights: { icon: 'bar-chart-2', title: 'Understand your cycles', benefit: 'Readable statistics and trends across your whole history (always estimates).', free: 'Calendar, entries, basic estimates', premium: 'Statistics and trends' },
  cycle_trends: { icon: 'trending-up', title: 'Spot what comes back in your cycle', benefit: 'Trends seen in your own data (after several comparable cycles) and, if you wish, a message before a period when you often log a symptom. Never a certainty.', free: 'Calendar, periods, simple estimate, essential symptoms, general and safety information', premium: 'Personal trends and anticipation' },
  cycle_custom: { icon: 'tag', title: 'Customise your cycle tracking', benefit: 'Your own items to track and as many labels as you like.', free: '3 different labels', premium: 'Custom items and unlimited labels' },
  cycle_share: { icon: 'users', title: 'Share your cycle with your partner', benefit: 'You choose what to share (periods, estimated fertile window, mood, symptoms) with a member of your household, read-only; never sex, contraception or your notes. Can be revoked at any time.', free: 'Nothing is shared', premium: 'Chosen, revocable sharing' },
  cycle_monthly: { icon: 'file-text', title: 'Your month at a glance', benefit: 'Periods, cycle length, and the symptoms and moods you logged most this month, as a PDF to keep or show your professional. Recorded facts, never a diagnosis.', free: 'Calendar and a page for each day', premium: 'Monthly summary and PDF' },
  cycle_export: { icon: 'download', title: 'Export your cycle tracking', benefit: 'A PDF to share with your health professional.', free: '—', premium: 'PDF export' },
  family_summary: { icon: 'home', title: 'Today’s family summary', benefit: 'Each child, their meals, sleep and appointments, with nothing mixed up.', free: 'Overview of the profiles', premium: 'Daily family summary' },
  more_children: { icon: 'user-plus', title: 'Track more children', benefit: 'More profiles, each with its own data.', free: 'Up to 3 children', premium: 'Extended profiles' },
  more_reminders: { icon: 'bell', title: 'Personal reminders without counting', benefit: 'Fully configurable reminders: edit, postpone, switch off.', free: '5 personal reminders; prescribed medicines, bottles and vaccines always unlimited', premium: 'Extended personal reminders' },
  more_documents: { icon: 'folder', title: 'An extended document vault', benefit: 'Scans, prescriptions, reports: everything in one place.', free: 'Limited vault', premium: 'Extended vault' },
  more_lists: { icon: 'check-square', title: 'Unlimited preparation lists', benefit: 'Hospital bag, paperwork, nursery…', free: 'A few lists', premium: 'Extended lists' },
  premium_content: { icon: 'book-open', title: 'In-depth guides', benefit: 'Series and guides tailored to the exact age or week of pregnancy.', free: 'All the safety information', premium: 'In-depth guides' },
  growth_export: { icon: 'download', title: 'Export measurements', benefit: 'A file of growth measurements to share.', free: '—', premium: 'Measurement export' },
  diversification: { icon: 'coffee', title: 'All of {name}’s discoveries', benefit: 'The full food catalogue, recipes that use what they have already tasted, age-appropriate ideas, advanced filters and the whole history.', free: 'Up to 15 foods tracked per child, the essential foods in each category, allergens, safety information and the last 30 days of history', premium: 'Full catalogue, matching recipes, personalised ideas, advanced filters, full history' },
  development_full: { icon: 'trending-up', title: 'Follow all of {name}’s milestones', benefit: 'All the milestones for each age range, with a suitable activity for each, and a PDF summary to show your professional.', free: 'The main milestones, safety tips, sources and the on-screen summary', premium: 'Full tracking, age-appropriate activities, PDF summary' },
  community_profile: { icon: 'feather', title: 'Personalise your community profile', benefit: 'A colour, a banner, a longer introduction, and a discreet Premium badge if you like.', free: 'Nickname, handle, avatar or photo, short introduction, journey', premium: 'Colour, banner, richer introduction, optional badge' },
  community_groups: { icon: 'lock', title: 'Create your private parents’ group', benefit: 'A space just for you, by invitation: posts stay hidden from the rest of the community.', free: 'Join the themed groups, the monthly groups and the private groups you are invited to', premium: 'Create private groups and invite members' },
  community_albums: { icon: 'image', title: 'Photo albums to share', benefit: 'Private albums, or shared only with the members you choose. Photos have their GPS location removed.', free: 'See the albums shared with you; up to 4 photos per post', premium: 'Create albums and share them' },
  community_search: { icon: 'sliders', title: 'Advanced filters and search', benefit: 'Several categories at once, polls, posts with photos, unanswered, from one member, from a given period.', free: 'Search by keyword and by category, “For you”, “Following” and “Recent” feeds', premium: 'Combined filters and advanced search' },
  community_history: { icon: 'clock', title: 'Your activity log', benefit: 'The timeline of your posts, replies, reactions and saved items.', free: 'Your posts, replies, liked posts and saved posts all remain viewable', premium: 'Full, filterable timeline' },
  saved_folders: { icon: 'folder', title: 'Organise what you save', benefit: 'Folders to find useful discussions in an instant (“Sleep”, “Hospital bag”…).', free: 'Save without limit', premium: 'Folders' },
  community_ai: { icon: 'align-left', title: 'Summarise a long discussion', benefit: 'The gist of a discussion with more than 6 replies, presented as personal accounts. Translation of a message if needed.', free: 'Read all the replies', premium: 'Summary and translation (AI service to be configured server-side)' },
  community_events: { icon: 'video', title: 'Workshops and meet-ups', benefit: 'Online workshops and meet-ups reserved for subscribers, when the team schedules them.', free: 'The whole community and the safety information', premium: 'Workshop registration' },
};
export const FEATURES: Record<PremiumFeature, FeatureInfo> = localized(FEATURES_FR, FEATURES_EN);

/** Toujours gratuit, quel que soit l'abonnement (affiché sur l'écran d'abonnement et vérifié par les tests). */
const ALWAYS_FREE_FR = [
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

const ALWAYS_FREE_EN = [
  'Emergency information and numbers',
  'Resources on postnatal depression',
  'Official product recall alerts',
  'Account deletion and legal export of your data',
  'Consent management',
  'Reporting and blocking in the community',
  'Community profile, posts with photos, comments, reactions, following members and categories',
  'Access to all the data you have already created, even after a subscription ends',
  'Reminders for prescribed medicines, bottles and vaccines',
];
export const ALWAYS_FREE = localized(ALWAYS_FREE_FR, ALWAYS_FREE_EN);

export const featureTitle = (f: PremiumFeature, name?: string | null) => FEATURES[f].title.replace('{name}', name || tr('l6.prem.yourChild'));

/** Erreur serveur « fonction Premium » ou « limite gratuite atteinte ». */
export const isPremiumRequired = (e: unknown) => {
  const x = e as { hint?: string; message?: string; code?: string; status?: number; isPremiumRequired?: boolean } | null;
  return !!x && (x.isPremiumRequired === true || x.hint === 'premium_required' || x.status === 402 || /Fonction Premium|Limite de la version gratuite/.test(x.message ?? ''));
};
