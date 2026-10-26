/**
 * Documents juridiques — BROUILLONS à faire valider par un juriste avant publication.
 * Version acceptée à l'inscription : LEGAL_VERSIONS (src/lib/authFlow.ts).
 */
export const LEGAL_DRAFT_NOTICE = 'Brouillon — à valider par un juriste avant la mise en ligne.';

export interface LegalDoc { title: string; updated: string; sections: { title: string; body: string }[] }

export const TERMS: LegalDoc = {
  title: 'Conditions générales d’utilisation',
  updated: 'Octobre 2026',
  sections: [
    { title: 'Objet', body: 'Au fil de nous est une application d’accompagnement des parents, du désir d’enfant à la vie de famille. Elle aide à noter, organiser et s’informer. Elle ne remplace en aucun cas l’avis d’un professionnel de santé.' },
    { title: 'Âge minimum', body: 'L’application est réservée aux personnes de 18 ans ou plus.' },
    { title: 'Compte', body: 'Vous êtes responsable de la confidentialité de vos identifiants. Vous pouvez supprimer votre compte à tout moment depuis Profil › Mon compte : vos données et vos photos sont alors effacées.' },
    { title: 'Informations de santé', body: 'Les contenus et l’assistant fournissent une information générale, sourcée et prudente. Ils ne posent pas de diagnostic, ne prescrivent pas et ne calculent pas de dose. En cas d’urgence, appelez le 15 ou le 112.' },
    { title: 'Communauté', body: 'Les échanges doivent rester bienveillants. Les messages contraires à la loi ou à ces règles peuvent être retirés et leurs auteurs suspendus.' },
    { title: 'Abonnement', body: 'Certaines fonctions sont réservées à l’abonnement Premium, géré par l’App Store ou Google Play. La résiliation se fait depuis les réglages de votre store. Les informations de sécurité restent toujours accessibles gratuitement.' },
    { title: 'Responsabilité', body: 'L’éditeur met tout en œuvre pour fournir une information fiable et à jour, sans pouvoir garantir l’absence d’erreur. Vérifiez toujours les indications des emballages, des notices et de votre professionnel de santé.' },
    { title: 'Droit applicable', body: 'Droit français. En cas de litige, une solution amiable sera recherchée avant toute action.' },
  ],
};

export const PRIVACY: LegalDoc = {
  title: 'Politique de confidentialité',
  updated: 'Octobre 2026',
  sections: [
    { title: 'Responsable du traitement', body: 'L’éditeur de Au fil de nous (coordonnées à compléter).' },
    { title: 'Données collectées', body: 'Compte (e-mail), profil, informations que vous saisissez (grossesse, enfants, suivis, cycle), consentements horodatés. Les données de santé ne sont traitées qu’avec votre consentement explicite.' },
    { title: 'Finalités', body: 'Fournir les fonctions de l’application, vos rappels, le partage avec les membres de votre foyer selon les droits que vous choisissez, et la sécurité du service.' },
    { title: 'Hébergement', body: 'Base de données hébergée par Supabase dans l’Union européenne (à confirmer lors de la création du projet). Les clés secrètes restent sur le serveur.' },
    { title: 'Intelligence artificielle', body: 'Les questions posées à l’assistant et les photos que vous choisissez d’envoyer sont transmises à Google Gemini pour cette seule réponse. Au fil de nous ne les utilise pas pour entraîner une IA.' },
    { title: 'Photos sensibles', body: 'Les photos de tests sont analysées sur votre téléphone et supprimées par défaut. Si vous choisissez de les garder, elles sont chiffrées sur le téléphone avant d’être enregistrées.' },
    { title: 'Durée de conservation', body: 'Tant que votre compte existe, dans la limite de la durée choisie dans Profil › Confidentialité. La suppression du compte efface vos données.' },
    { title: 'Vos droits', body: 'Accès, rectification, effacement, portabilité (export JSON et PDF dans l’application), opposition et retrait du consentement à tout moment. Vous pouvez saisir la CNIL (cnil.fr).' },
  ],
};
