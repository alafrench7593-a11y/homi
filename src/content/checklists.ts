/** Modèles de listes de préparation (personnalisables ensuite). */
import type { ChecklistKind } from '@/lib/types';

export const CHECKLIST_TEMPLATES: Record<Exclude<ChecklistKind, 'custom'>, { title: string; icon: string; items: string[] }> = {
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
