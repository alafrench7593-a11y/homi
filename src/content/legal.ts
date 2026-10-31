/**
 * Documents juridiques — BROUILLONS à faire valider par un juriste avant publication.
 * Version acceptée à l'inscription : LEGAL_VERSIONS (src/lib/authFlow.ts).
 */
import { BRAND } from '@/config/brand';

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
    { title: 'Prix, essai et renouvellement', body: 'Premium mensuel : 5,99 € par mois ; Premium annuel : 39,99 € par an (prix affichés dans l’application tels que transmis par votre store, qui font foi). Un essai gratuit (3 jours pour le mensuel, 7 jours pour l’annuel) n’est proposé que si votre store indique que vous y avez droit ; sinon le paiement commence dès la souscription. L’abonnement se renouvelle automatiquement à la même durée, sauf résiliation au moins 24 heures avant la fin de la période en cours, depuis les réglages de votre compte Apple ou Google. Le remboursement éventuel est traité par le store selon ses propres règles.' },
    { title: 'Supprimer son compte ≠ résilier', body: 'Supprimer votre compte Au fil de nous efface vos données mais n’arrête pas le paiement : la résiliation se fait toujours dans les réglages de votre store. Le bouton « Gérer mes abonnements » (Profil › Abonnement) y mène directement.' },
    { title: 'Données des enfants', body: 'Les enfants n’ont pas de compte. Les informations et photos les concernant sont saisies par un parent ou une personne autorisée du foyer, qui en reste responsable vis-à-vis des autres titulaires de l’autorité parentale.' },
    { title: 'Responsabilité', body: 'L’éditeur met tout en œuvre pour fournir une information fiable et à jour, sans pouvoir garantir l’absence d’erreur. Vérifiez toujours les indications des emballages, des notices et de votre professionnel de santé.' },
    { title: 'Droit applicable', body: 'Droit français. En cas de litige, une solution amiable sera recherchée avant toute action.' },
  ],
};

export const PRIVACY: LegalDoc = {
  title: 'Politique de confidentialité',
  updated: 'Octobre 2026',
  sections: [
    { title: 'Responsable du traitement', body: `L’éditeur de ${BRAND.name} (coordonnées à compléter). Pour toute question ou pour exercer vos droits : ${BRAND.supportEmail}.` },
    { title: 'Base légale', body: 'Les données de santé (cycle, grossesse, santé des enfants, humeur, rapports) ne sont traitées qu’avec votre consentement explicite, enregistré et daté, que vous pouvez retirer à tout moment dans Profil › Confidentialité. Le compte, l’abonnement et la sécurité du service reposent sur l’exécution du contrat ; la conservation des factures (par Apple ou Google) sur une obligation légale.' },
    { title: 'Données collectées', body: 'Compte (e-mail), profil, informations que vous saisissez (grossesse, enfants, suivis, cycle), consentements horodatés. Les données de santé ne sont traitées qu’avec votre consentement explicite.' },
    { title: 'Finalités', body: 'Fournir les fonctions de l’application, vos rappels, le partage avec les membres de votre foyer selon les droits que vous choisissez, et la sécurité du service. Jamais de publicité ciblée, jamais de revente de vos données.' },
    { title: 'Qui peut voir vos données', body: 'Vous, et les membres de votre foyer selon les droits que vous leur donnez, domaine par domaine. Vos données personnelles (humeur, cycle, poids) ne sont partagées que si vous le choisissez. Dans la communauté, seul votre pseudonyme est visible. En mode démonstration, tout reste sur votre appareil.' },
    { title: 'Hébergement', body: 'Base de données hébergée par Supabase dans l’Union européenne (à confirmer lors de la création du projet). Les clés secrètes restent sur le serveur.' },
    { title: 'Intelligence artificielle', body: 'Certaines fonctions utilisent l’intelligence artificielle Google Gemini (offre payante de l’API), seulement si vous les activez ou les lancez : l’assistant (vos questions, sans nom ni e-mail), l’analyse des photos que vous choisissez d’envoyer, la lecture automatique d’un document que vous choisissez, l’explication d’un produit scanné, et, dans la communauté, le résumé ou la traduction d’une discussion (les messages publics de la discussion sont alors transmis). Les données sont envoyées depuis nos serveurs pour cette seule réponse. Ni Au fil de nous ni Google ne les utilisent pour entraîner une IA ; Google peut toutefois les conserver jusqu’à 55 jours pour détecter les abus, avec une relecture humaine possible en cas de signalement.' },
    { title: 'Photos sensibles', body: 'Les photos de tests sont analysées sur votre téléphone et supprimées par défaut. Si vous choisissez de les garder, elles sont chiffrées sur le téléphone avant d’être enregistrées.' },
    { title: 'Album photo des enfants', body: 'Les photos ajoutées à l’album d’un enfant sont réduites sur votre téléphone et enregistrées sans leurs métadonnées (dont la position GPS), dans un espace privé jamais public. Elles ne sont visibles que par les membres du foyer qui ont accès au profil de cet enfant, ou par vous seule si vous choisissez « moi seulement ». L’affichage passe par des liens temporaires (1 heure). Elles ne sont envoyées à aucun service d’intelligence artificielle.' },
    { title: 'Services utilisés (sous-traitants)', body: 'Supabase : hébergement de la base, des fichiers et des comptes. Google (API Gemini) : réponses de l’assistant et analyses de photos que vous demandez. Google (Places) : recherche de lieux autour de vous, seulement quand vous la lancez (position envoyée pour cette recherche). Apple et Google : paiement de l’abonnement. RevenueCat : suivi de l’abonnement (identifiant de compte et achats, sans données de santé). Expo : acheminement des notifications (texte neutre, sans détail de santé). Resend : e-mails de connexion. Sentry : rapports de plantage, uniquement si vous l’acceptez, sans données personnelles. Open Food Facts et RappelConso : seul le code-barres scanné est transmis. OpenStreetMap (serveurs Overpass, dont un miroir tiers, cartes et photos Wikimedia Commons) : quand vous cherchez des lieux près de vous sans Google, votre téléphone contacte directement ces services, qui reçoivent votre adresse IP et une position arrondie. Lieux d’hébergement et garanties de transfert hors Union européenne : à préciser par l’éditeur pour chaque service.' },
    { title: 'Notifications et écran verrouillé', body: 'Les notifications n’affichent ni nom de médicament, ni dose, ni détail de cycle ou de santé, ni pseudonyme de la communauté : le détail ne s’affiche qu’une fois l’application ouverte.' },
    { title: 'Sécurité', body: 'Accès contrôlé ligne par ligne sur le serveur (chaque personne ne voit que ses données et celles de son foyer qu’on lui a ouvertes), clés secrètes uniquement côté serveur, données intimes jamais conservées dans le cache du téléphone, photos de tests chiffrées, publications anonymes réellement anonymes, verrouillage par Face ID ou code possible.' },
    { title: 'Durée de conservation', body: 'Tant que votre compte existe. Vous pouvez supprimer chaque entrée à tout moment et indiquer une durée de conservation souhaitée dans Profil › Confidentialité. La suppression du compte efface définitivement vos données et vos fichiers, sauf ce que la loi impose de conserver (facturation, gérée par Apple ou Google).' },
    { title: 'Vos droits', body: 'Accès, rectification, effacement, portabilité (export JSON et PDF dans l’application), opposition et retrait du consentement à tout moment. Vous pouvez saisir la CNIL (cnil.fr).' },
  ],
};
