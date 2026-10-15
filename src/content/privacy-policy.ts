/**
 * Politique de confidentialité — résumé affiché dans l'application.
 * Texte à faire relire par un juriste / DPO avant publication (coordonnées du responsable de traitement à compléter).
 */
import { BRAND } from '@/config/brand';

export const PRIVACY_POLICY_VERSION = '2026-10';

export const PRIVACY_POLICY: { title: string; body: string }[] = [
  {
    title: 'Qui traite vos données ?',
    body: `L’éditeur de ${BRAND.name} est responsable du traitement. Pour toute question ou pour exercer vos droits : ${BRAND.supportEmail}.`,
  },
  {
    title: 'Quelles données ?',
    body: 'Les informations que vous saisissez : profil, grossesse, enfants, suivi quotidien, rendez-vous, rappels, documents, questions à l’assistant, publications dans la communauté. Certaines sont des données de santé : elles ne sont collectées qu’avec votre consentement explicite.',
  },
  {
    title: 'Pourquoi ?',
    body: 'Uniquement pour vous rendre le service : afficher votre suivi, le partager avec les membres de votre foyer que vous avez invités, vous envoyer vos rappels, répondre à vos questions. Jamais de publicité ciblée, jamais de revente.',
  },
  {
    title: 'Où sont-elles stockées ?',
    body: 'Dans une base de données sécurisée, avec des échanges chiffrés et un contrôle d’accès ligne par ligne. Le lieu d’hébergement est précisé par l’éditeur dans la version publiée de cette politique. Les documents sont conservés dans un espace privé accessible uniquement aux membres autorisés de votre foyer. En mode démonstration, tout reste sur votre appareil.',
  },
  {
    title: 'Qui peut les voir ?',
    body: 'Vous, et les membres de votre foyer selon les droits que vous leur donnez (domaine par domaine). Vos données personnelles (humeur, cycle, poids) ne sont jamais partagées. Dans la communauté, seul votre pseudonyme est visible.',
  },
  {
    title: 'Assistant',
    body: 'Vos questions sont transmises à un service d’intelligence artificielle pour produire une réponse ; votre nom et votre adresse e-mail n’y sont pas joints. Vous pouvez désactiver l’historique des conversations à tout moment.',
  },
  {
    title: 'Durée de conservation',
    body: 'Tant que votre compte est actif ; vous pouvez supprimer chaque entrée à tout moment et indiquer une durée de conservation souhaitée dans les réglages. À la suppression du compte, les données sont effacées définitivement, à l’exception de ce que la loi nous oblige à conserver (facturation, gérée par Apple ou Google).',
  },
  {
    title: 'Vos droits',
    body: 'Accès, rectification, effacement, portabilité, opposition et retrait du consentement à tout moment, directement depuis Réglages › Confidentialité (export et suppression) ou en nous écrivant. Vous pouvez saisir la CNIL (www.cnil.fr).',
  },
];
