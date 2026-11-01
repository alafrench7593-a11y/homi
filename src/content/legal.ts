import { onLocaleChange } from '@/i18n';
/**
 * Documents juridiques — BROUILLONS à faire valider par un juriste avant publication.
 * Version acceptée à l'inscription : LEGAL_VERSIONS (src/lib/authFlow.ts).
 */
import { BRAND } from '@/config/brand';
import { inLang, localized } from '@/i18n/localized';

const LEGAL_DRAFT_NOTICE_FR = 'Brouillon — à valider par un juriste avant la mise en ligne.';

export interface LegalDoc { title: string; updated: string; sections: { title: string; body: string }[] }

const TERMS_FR: LegalDoc = {
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

const PRIVACY_FR: LegalDoc = {
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

// ---------------------------------------------------------------- English version (same sections, same order)
const LEGAL_DRAFT_NOTICE_EN = 'Draft — to be reviewed by a lawyer before going live.';

const TERMS_EN: LegalDoc = {
  title: 'Terms of use',
  updated: 'October 2026',
  sections: [
    { title: 'Purpose', body: 'Au fil de nous is an app that supports parents, from the wish for a child through to family life. It helps you record, organise and find information. It never replaces the advice of a health professional.' },
    { title: 'Minimum age', body: 'The app is for people aged 18 or over.' },
    { title: 'Account', body: 'You are responsible for keeping your login details confidential. You can delete your account at any time from Profile › My account: your data and photos are then erased.' },
    { title: 'Health information', body: 'The content and the assistant provide general, sourced and cautious information. They do not make diagnoses, prescribe or calculate doses. In an emergency, call 15 or 112.' },
    { title: 'Community', body: 'Exchanges must remain kind and respectful. Messages that are against the law or these rules may be removed and their authors suspended.' },
    { title: 'Subscription', body: 'Some features are reserved for the Premium subscription, managed by the App Store or Google Play. You cancel from your store’s settings. Safety information always remains available free of charge.' },
    { title: 'Price, trial and renewal', body: 'Monthly Premium: €5.99 per month; annual Premium: €39.99 per year (prices shown in the app as supplied by your store, which prevail). A free trial (3 days for monthly, 7 days for annual) is offered only if your store indicates that you are eligible; otherwise payment starts as soon as you subscribe. The subscription renews automatically for the same period, unless cancelled at least 24 hours before the end of the current period, from your Apple or Google account settings. Any refund is handled by the store under its own rules.' },
    { title: 'Deleting your account ≠ cancelling', body: 'Deleting your Au fil de nous account erases your data but does not stop payment: cancellation is always done in your store’s settings. The “Manage my subscriptions” button (Profile › Subscription) takes you there directly.' },
    { title: 'Children’s data', body: 'Children do not have accounts. Information and photos about them are entered by a parent or an authorised person in the household, who remains responsible for it towards the other holders of parental authority.' },
    { title: 'Liability', body: 'The publisher does its best to provide reliable and up-to-date information, but cannot guarantee that it is free of errors. Always check the instructions on packaging, leaflets and from your health professional.' },
    { title: 'Governing law', body: 'French law applies. In the event of a dispute, an amicable solution will be sought before any legal action.' },
  ],
};

const PRIVACY_EN: LegalDoc = {
  title: 'Privacy policy',
  updated: 'October 2026',
  sections: [
    { title: 'Data controller', body: `The publisher of ${BRAND.name} (contact details to be completed). For any question or to exercise your rights: ${BRAND.supportEmail}.` },
    { title: 'Legal basis', body: 'Health data (cycle, pregnancy, children’s health, mood, intercourse) is processed only with your explicit consent, recorded and dated, which you can withdraw at any time in Profile › Privacy. The account, the subscription and the security of the service rely on performance of the contract; the keeping of invoices (by Apple or Google) relies on a legal obligation.' },
    { title: 'Data collected', body: 'Account (email), profile, information you enter (pregnancy, children, tracking, cycle), time-stamped consents. Health data is processed only with your explicit consent.' },
    { title: 'Purposes', body: 'To provide the app’s features, your reminders, sharing with the members of your household according to the rights you choose, and the security of the service. Never targeted advertising, never resale of your data.' },
    { title: 'Who can see your data', body: 'You, and the members of your household according to the rights you give them, area by area. Your personal data (mood, cycle, weight) is shared only if you choose. In the community, only your pseudonym is visible. In demo mode, everything stays on your device.' },
    { title: 'Hosting', body: 'Database hosted by Supabase in the European Union (to be confirmed when the project is created). Secret keys stay on the server.' },
    { title: 'Artificial intelligence', body: 'Some features use Google Gemini artificial intelligence (paid API tier), only if you turn them on or run them: the assistant (your questions, without name or email), analysis of photos you choose to send, automatic reading of a document you choose, explanation of a scanned product, and, in the community, the summary or translation of a discussion (the public messages of the discussion are then sent). The data is sent from our servers for that single response only. Neither Au fil de nous nor Google uses it to train an AI; however, Google may keep it for up to 55 days to detect abuse, with possible human review if it is flagged.' },
    { title: 'Sensitive photos', body: 'Test photos are analysed on your phone and deleted by default. If you choose to keep them, they are encrypted on the phone before being saved.' },
    { title: 'Children’s photo album', body: 'Photos added to a child’s album are reduced in size on your phone and saved without their metadata (including GPS location), in a private space that is never public. They can be seen only by the members of the household who have access to that child’s profile, or by you alone if you choose “only me”. They are displayed through temporary links (1 hour). They are not sent to any artificial intelligence service.' },
    { title: 'Services used (processors)', body: 'Supabase: hosting of the database, files and accounts. Google (Gemini API): assistant replies and photo analyses that you request. Google (Places): searching for places around you, only when you run it (location sent for that search). Apple and Google: payment for the subscription. RevenueCat: subscription tracking (account identifier and purchases, no health data). Expo: delivery of notifications (neutral text, no health detail). Resend: sign-in emails. Sentry: crash reports, only if you accept them, without personal data. Open Food Facts and RappelConso: only the scanned barcode is sent. OpenStreetMap (Overpass servers, including a third-party mirror, maps and Wikimedia Commons photos): when you search for places near you without Google, your phone contacts these services directly, and they receive your IP address and an approximate location. Hosting locations and safeguards for transfers outside the European Union: to be specified by the publisher for each service.' },
    { title: 'Notifications and lock screen', body: 'Notifications show no medicine name, no dose, no cycle or health detail, and no community pseudonym: the detail is shown only once the app is open.' },
    { title: 'Security', body: 'Row-by-row access control on the server (each person sees only their own data and the household data that has been opened to them), secret keys only on the server side, intimate data never kept in the phone’s cache, encrypted test photos, anonymous posts that are genuinely anonymous, optional Face ID or passcode lock.' },
    { title: 'Retention period', body: 'For as long as your account exists. You can delete each entry at any time and set a preferred retention period in Profile › Privacy. Deleting the account permanently erases your data and files, except what the law requires us to keep (billing, handled by Apple or Google).' },
    { title: 'Your rights', body: 'Access, rectification, erasure, portability (JSON and PDF export in the app), objection and withdrawal of consent at any time. You can complain to the CNIL (cnil.fr), the French data protection authority.' },
  ],
};

export let LEGAL_DRAFT_NOTICE = inLang({ fr: LEGAL_DRAFT_NOTICE_FR, en: LEGAL_DRAFT_NOTICE_EN });
export const TERMS: LegalDoc = localized(TERMS_FR, TERMS_EN);
export const PRIVACY: LegalDoc = localized(PRIVACY_FR, PRIVACY_EN);

// Textes fixes recalculés à chaque changement de langue (les écrans lisent toujours la valeur à jour)
onLocaleChange(() => {
  LEGAL_DRAFT_NOTICE = inLang({ fr: LEGAL_DRAFT_NOTICE_FR, en: LEGAL_DRAFT_NOTICE_EN });
});
