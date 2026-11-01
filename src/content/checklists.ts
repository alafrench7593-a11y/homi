/** Modèles de listes de préparation (personnalisables ensuite). */
import type { ChecklistKind } from '@/lib/types';
import { localized } from '@/i18n/localized';

type Templates = Record<Exclude<ChecklistKind, 'custom'>, { title: string; icon: string; items: string[] }>;

const CHECKLIST_TEMPLATES_FR: Templates = {
  maternity_bag: {
    title: 'Valise de maternité',
    icon: 'briefcase',
    items: ['Carte Vitale et pièce d’identité', 'Dossier de suivi de grossesse et résultats d’examens', 'Carte de groupe sanguin (si vous l’avez)', 'Vêtements confortables et chaussons', 'Protections et sous-vêtements adaptés', 'Nécessaire de toilette', 'Chargeur de téléphone', 'Bodies, pyjamas, bonnet et chaussettes pour bébé', 'Gigoteuse ou couverture', 'Siège auto adapté pour le retour'],
  },
  baby_items: {
    title: 'Affaires de bébé',
    icon: 'gift',
    items: ['Couchage adapté (matelas ferme, sans tour de lit ni couette)', 'Gigoteuses', 'Bodies et pyjamas', 'Table ou matelas à langer', 'Couches et liniment ou eau', 'Thermomètre', 'Siège auto', 'Porte-bébé ou poussette'],
  },
  home: { title: 'Préparation du logement', icon: 'home', items: ['Préparer le coin nuit', 'Prévoir un espace de change', 'Organiser les rangements', 'Vérifier le détecteur de fumée'] },
  admin: {
    title: 'Démarches administratives',
    icon: 'file-text',
    items: ['Déclarer la grossesse (avant la fin du 3e mois)', 'Informer l’employeur si vous le souhaitez', 'Préparer la déclaration de naissance (dans les 5 jours)', 'Prévenir la caisse d’assurance maladie et la CAF', 'Choisir un mode de garde'],
  },
  purchases: { title: 'Achats utiles', icon: 'shopping-bag', items: ['Siège auto', 'Lit ou berceau', 'Baignoire ou transat de bain', 'Tire-lait (si besoin)', 'Biberons (si besoin)'] },
  coparent: { title: 'Préparation du coparent', icon: 'users', items: ['Se renseigner sur le congé de naissance / paternité', 'Préparer l’organisation des premières semaines', 'Participer à un rendez-vous de préparation', 'Savoir reconnaître les signes de détresse après la naissance'] },
  siblings: { title: 'Organisation avec les aînés', icon: 'smile', items: ['Annoncer l’arrivée du bébé avec des mots simples', 'Prévoir qui garde les aînés pendant l’accouchement', 'Garder un moment rien qu’avec chaque aîné', 'Lire un livre sur l’arrivée d’un petit frère ou d’une petite sœur'] },
  multiples: { title: 'Jumeaux & triplés', icon: 'copy', items: ['Deux (ou trois) sièges auto adaptés', 'Poussette double ou triple', 'Organisation des nuits en relais', 'Solliciter l’aide de l’entourage', 'Se renseigner sur les associations de parents de multiples'] },
};

const CHECKLIST_TEMPLATES_EN: Templates = {
  maternity_bag: {
    title: 'Hospital bag',
    icon: 'briefcase',
    items: ['Health insurance card (Carte Vitale) and ID', 'Pregnancy notes and test results', 'Blood group card (if you have one)', 'Comfortable clothes and slippers', 'Maternity pads and suitable underwear', 'Toiletries', 'Phone charger', 'Babygrows, pyjamas, hat and socks for the baby', 'Sleeping bag or blanket', 'Car seat suitable for the journey home'],
  },
  baby_items: {
    title: 'Baby essentials',
    icon: 'gift',
    items: ['Suitable sleeping space (firm mattress, no bumper or duvet)', 'Baby sleeping bags', 'Bodysuits and pyjamas', 'Changing table or mat', 'Nappies and cleansing lotion or water', 'Thermometer', 'Car seat', 'Baby carrier or pushchair'],
  },
  home: { title: 'Getting the home ready', icon: 'home', items: ['Set up the sleeping area', 'Plan a changing space', 'Organise storage', 'Check the smoke alarm'] },
  admin: {
    title: 'Paperwork',
    icon: 'file-text',
    items: ['Declare the pregnancy (before the end of the 3rd month)', 'Tell your employer if you wish', 'Prepare the birth registration (within 5 days)', 'Notify the health insurance fund and the family allowance office (CAF)', 'Choose childcare'],
  },
  purchases: { title: 'Useful purchases', icon: 'shopping-bag', items: ['Car seat', 'Cot or crib', 'Baby bath or bath seat', 'Breast pump (if needed)', 'Bottles (if needed)'] },
  coparent: { title: 'Co-parent preparation', icon: 'users', items: ['Find out about birth / paternity leave', 'Plan how the first weeks will work', 'Go to a preparation appointment', 'Know the signs of distress after birth'] },
  siblings: { title: 'Planning with older children', icon: 'smile', items: ['Tell them about the baby in simple words', 'Decide who looks after them during the birth', 'Keep some time just with each older child', 'Read a book about a new little brother or sister'] },
  multiples: { title: 'Twins & triplets', icon: 'copy', items: ['Two (or three) suitable car seats', 'Double or triple pushchair', 'Night shifts in relay', 'Ask family and friends for help', 'Find out about parent associations for multiples'] },
};

export const CHECKLIST_TEMPLATES: Templates = localized(CHECKLIST_TEMPLATES_FR, CHECKLIST_TEMPLATES_EN);
