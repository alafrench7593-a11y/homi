/**
 * Guides thématiques (04/11/2026) : des mini-outils qui rangent les articles de la bibliothèque par besoin,
 * pour que l'on trouve en deux gestes « mon enfant a de la fièvre », « quel sport à 6 ans », « mes droits au travail »…
 *
 * Chaque guide = des sections ; chaque section = des articles (identifiants lisibles de la bibliothèque). Un test
 * vérifie que chaque identifiant existe réellement : aucun lien mort possible. Les libellés sont dans i18n (`gd.*`).
 * Les articles restent ceux de la bibliothèque : mêmes sources, même statut de relecture, même écran de lecture.
 */
import type { IconName } from '@/components/ui';
import type { ToolTheme } from '@/lib/domain/toolCatalog';

export interface GuideSection {
  /** Clé i18n `gd.<guide>.<section>` (titre) ; `.sub` facultatif (précision). */
  key: string;
  slugs: string[];
  /** Lien d'outil en plus des articles (ex. urgences, scanner). */
  tool?: { label: string; icon: IconName; href: string };
}
export interface GuideDef {
  id: string;
  theme: ToolTheme;
  icon: IconName;
  /** Bandeau d'avertissement affiché en haut (clé i18n). */
  banner?: 'health' | 'emergency' | 'gentle';
  sections: GuideSection[];
}

const emergency = { label: 'gd.link.emergency', icon: 'life-buoy' as IconName, href: '/emergency' };

export const GUIDES: GuideDef[] = [
  // ------------------------------------------------------------ Maladies de l'enfance
  {
    id: 'illnesses', theme: 'health', icon: 'thermometer', banner: 'health',
    sections: [
      { key: 'fever', slugs: ['fievre-nourrisson-quand-consulter', 'fievre-chez-l-enfant-que-faire', 'bebe-fievreux-a-la-maison-confort-et-surveillance', 'bebe-chaud-ou-fievre-habillage-et-chambre', 'convulsion-febrile-bebe-que-faire', 'bebe-malade-qui-appeler'], tool: emergency },
      { key: 'ent', slugs: ['rhume-enfant-rhinopharyngite-soulager-a-la-maison', 'rhume-et-lavage-de-nez', 'apprendre-a-se-moucher-lavage-de-nez-enfant', 'rhumes-a-repetition-enfant-creche-ecole', 'otite-chez-l-enfant', 'angine-chez-l-enfant', 'mal-de-gorge-enfant-soulager-angine-ou-pas', 'laryngite-enfant-toux-aboyante-nuit', 'enfant-malade-mange-moins'] },
      { key: 'breathing', slugs: ['bronchiolite-du-nourrisson', 'toux-qui-dure-quintes-coqueluche-enfant', 'grippe-enfant-reconnaitre-soigner-surveiller', 'vaccin-grippe-enfant-2-17-ans-questions', 'asthme-de-l-enfant'] },
      { key: 'rash', slugs: ['varicelle-chez-l-enfant', 'scarlatine-chez-l-enfant', 'syndrome-pieds-mains-bouche', 'impetigo-enfant-reconnaitre-soigner-contagion', 'molluscum-contagiosum-enfant', 'verrues-mains-doigts-enfant', 'verrue-plantaire-enfant-piscine-sport', 'bouton-de-fievre-herpes-labial-enfant', 'boutons-de-chaleur-bebe-miliaire', 'roseole-exantheme-subit-fievre-puis-eruption-que-faire', 'rougeole-reconnaitre-contagiosite-vaccin-ror-quand-consulter', 'urticaire-enfant-plaques-demangeaisons-causes-signes-alerte', 'fievre-au-retour-de-voyage-enfant-consulter'] },
      { key: 'belly', slugs: ['gastro-enterite-bebe-deshydratation', 'gastro-enterite-enfant-hydratation', 'constipation-bebe-et-enfant', 'intoxication-alimentaire-famille-signes-que-faire', 'securite-alimentaire-enfant-viande-hachee-lait-cru'] },
      { key: 'eyes', slugs: ['conjonctivite-chez-l-enfant', 'conjonctivite-enfant-nettoyer-yeux-mettre-collyre', 'vue-de-l-enfant-depistage', 'audition-de-l-enfant'] },
      { key: 'parasites', slugs: ['poux-chez-l-enfant', 'oxyures-vers-chez-l-enfant'] },
      { key: 'allergies', slugs: ['allergies-alimentaires-enfant', 'allergie-aux-pollens-rhinite-enfant', 'eczema-atopique-enfant', 'enfant-allergique-anniversaires-sorties-voyages', 'cantine-scolaire-et-pai'] },
      { key: 'school', slugs: ['enfant-malade-creche-ecole-eviction-quand-garder', 'conge-enfant-malade-salarie-jours-par-an', 'enfant-malade-quand-on-travaille-conges-et-solutions', 'enfant-gravement-malade-conge-presence-parentale-ajpp', 'donner-un-medicament-a-bebe-en-pratique', 'expliquer-rendez-vous-examen-medical-enfant-sans-mentir-ni-dramatiser', 'medicaments-maison-armoire-pharmacie-ranger-trier-enfant'] },
    ],
  },
  // ------------------------------------------------------------ Urgences et premiers secours
  {
    id: 'firstaid', theme: 'health', icon: 'life-buoy', banner: 'emergency',
    sections: [
      { key: 'now', slugs: ['etouffement-fausse-route-que-faire', 'bebe-de-moins-d-un-an-qui-s-etouffe-claques-et-compressions', 'brulure-enfant-refroidir-couvrir-appeler', 'noyade-enfant-que-faire-en-attendant-les-secours', 'convulsion-febrile-bebe-que-faire', 'enfant-a-avale-un-produit-ou-un-medicament-que-faire', 'produit-chimique-dans-l-oeil-ou-sur-la-peau-enfant', 'monoxyde-de-carbone-reconnaitre-et-reagir-en-famille'], tool: emergency },
      { key: 'bumps', slugs: ['choc-a-la-tete-commotion-sport-enfant-surveillance', 'dent-cassee-ou-tombee-apres-une-chute-enfant', 'entorse-chute-douleur-sport-enfant-que-faire', 'doigt-coince-dans-une-porte-ongle-noir-enfant', 'saignement-de-nez-enfant-bons-gestes', 'objet-dans-le-nez-enfant-que-faire', 'morsure-de-vipere-enfant-que-faire'] },
      { key: 'prevent', slugs: ['prevenir-accidents-domestiques-tout-petits', 'accidents-domestiques-proteger-son-enfant', 'noyade-prevention-enfant', 'piscine-hors-sol-pataugeoire-seau-bassin-noyade-jeune-enfant', 'fenetres-balcons-prevenir-chutes-defenestration-enfant', 'salle-de-bain-securite-enfant-eau-chaude-glissades-appareils', 'produits-menagers-ranger-pictogrammes-dosettes-lessive-enfant', 'piles-bouton-maison-reperer-ranger-choisir', 'billes-d-eau-billes-aimantees-petits-objets-ressemblant-bonbons', 'cheminee-poele-radiateur-chauffage-appoint-enfant-securite', 'chambre-enfant-securite-meubles-prises-cordons-fenetre', 'jardin-securite-enfant-outils-tondeuse-barbecue-produits'] },
      { key: 'outside', slugs: ['enfant-pieton-en-ville-trottoir-traverser-par-age', 'trajet-de-l-ecole-a-pied-a-velo-securite', 'casque-velo-enfant-choisir-taille-regler', 'enfant-passager-velo-siege-remorque-casque', 'choisir-siege-auto-essayer-installer', 'aire-de-jeux-trampoline-securite-3-6-ans', 'escalade-accrobranche-parc-trampoline-securite-enfant', 'canicule-en-vacances-enfant-reconnaitre-coup-de-chaleur', 'bebe-chaleur-et-soleil'] },
    ],
  },
  // ------------------------------------------------------------ Hygiène et soins du quotidien
  {
    id: 'hygiene', theme: 'growth', icon: 'droplet',
    sections: [
      { key: 'teeth', slugs: ['dents-et-brossage-enfant', 'dentifrice-fluor-quel-dentifrice-selon-age-enfant', 'premiere-visite-chez-le-dentiste-enfant-age-preparer', 'mt-dents-examen-bucco-dentaire-gratuit-enfant-chaque-annee', 'chute-des-dents-de-lait-arrivee-dents-definitives', 'poussees-dentaires-bebe', 'tetine-quand-et-comment-arreter', 'sucer-son-pouce-quand-aider-arreter'], tool: { label: 'gd.link.teeth', icon: 'circle', href: '/teeth' } },
      { key: 'wash', slugs: ['toilette-quotidienne-enfant-1-a-10-ans-mains-douche-cheveux-oreilles-ongles', 'bain-du-bebe-pas-a-pas', 'peau-de-bebe-et-fesses-rouges', 'couper-les-ongles-de-bebe-sans-stress', 'salle-de-bain-securite-enfant-eau-chaude-glissades-appareils', 'hygiene-cuisine-famille-mains-planches-cuisson'] },
      { key: 'skin', slugs: ['eczema-atopique-enfant', 'eczema-du-bebe-est-ce-une-allergie-alimentaire', 'peau-seche-qui-pele-nouveau-ne', 'creme-solaire-enfant-choisir-indice-appliquer-renouveler', 'lunettes-de-soleil-enfant-choisir-categorie-filtre', 'boutons-de-chaleur-bebe-miliaire'] },
      { key: 'noseears', slugs: ['rhume-et-lavage-de-nez', 'apprendre-a-se-moucher-lavage-de-nez-enfant', 'audition-de-l-enfant', 'depistage-auditif-du-nouveau-ne', 'vue-de-l-enfant-depistage'] },
      { key: 'intimate', slugs: ['prepuce-bebe-garcon-toilette-sans-decalotter', 'vulvite-irritations-intimes-petite-fille-hygiene-quand-consulter'] },
      { key: 'potty', slugs: ['proprete-sans-pression', 'pipi-au-lit-enuresie', 'constipation-bebe-et-enfant'] },
    ],
  },
  // ------------------------------------------------------------ Sport et activité physique
  {
    id: 'sport', theme: 'growth', icon: 'activity',
    sections: [
      { key: 'choose', slugs: ['activite-physique-et-sport-enfant', 'une-heure-activite-par-jour-6-10-ans-journee-type', 'choisir-un-sport-a-la-rentree-6-10-ans', 'activites-extrascolaires-3-6-ans-choisir', 'questionnaire-sante-certificat-medical-licence-enfant', 'enfant-veut-arreter-son-sport-ou-n-aime-pas-le-sport', 'enfant-handicap-trouver-activite-sportive-club', 'surpoids-enfant-bouger-sans-culpabiliser', 'asthme-enfant-sport-activite-physique'] },
      { key: 'disciplines', slugs: ['natation-6-10-ans-apprendre-pass-nautique-savoir-nager', 'football-enfant-6-10-ans-ce-qu-il-faut-savoir', 'judo-karate-arts-martiaux-enfant-6-10-ans', 'gymnastique-enfant-6-10-ans-plaisir-et-vigilance', 'danse-enfant-6-10-ans-choisir-son-cours', 'velo-6-10-ans-savoir-rouler-regles-casque', 'tennis-badminton-sports-de-raquette-enfant', 'athletisme-course-a-pied-enfant-6-10-ans', 'equitation-escrime-tir-a-l-arc-enfant'] },
      { key: 'little', slugs: ['bouger-trois-heures-par-jour-1-3-ans', 'bouger-trois-heures-par-jour-3-6-ans', 'jeux-moteurs-courir-sauter-grimper-3-6-ans', 'velo-trottinette-casque-3-6-ans', 'aisance-aquatique-piscine-3-6-ans', 'parcours-motricite-maison-tout-petit', 'jeux-de-ballon-tout-petit'] },
      { key: 'safety', slugs: ['alimentation-hydratation-enfant-sportif-6-10-ans', 'sport-enfant-forte-chaleur-soleil-coup-de-chaleur', 'choc-a-la-tete-commotion-sport-enfant-surveillance', 'entorse-chute-douleur-sport-enfant-que-faire', 'proteger-son-enfant-violences-dans-le-sport-signal-sports', 'verrue-plantaire-enfant-piscine-sport'] },
    ],
  },
  // ------------------------------------------------------------ Activités et jeux par âge
  {
    id: 'activities', theme: 'growth', icon: 'sun',
    sections: [
      { key: 'baby', slugs: ['eveil-bebe-2-3-mois-sourires-gazouillis', 'comptines-jeux-de-doigts-chatouilles-bebe', 'coucou-cache-cache-bebe-permanence-objet', 'bain-jeux-d-eau-eveil-bebe-securite', 'eveil-bebe-10-12-mois-debout-premiers-mots', 'choisir-jouets-bebe-0-12-mois-securite', 'bebe-sans-ecran-alternatives-premiere-annee', 'accompagner-premiers-pas-pieds-nus-chaussures'] },
      { key: 'toddler', slugs: ['idees-jeux-maison-sans-ecran-1-3-ans', 'jeux-pour-aider-a-parler-1-3-ans', 'lire-des-histoires-enfant-1-3-ans', 'peinture-avec-tout-petit', 'musique-danse-tout-petit', 'jeux-imitation-faire-semblant-tout-petit', 'jeux-d-eau-tout-petit-securite', 'jeux-de-sable-tout-petit', 'square-aire-de-jeux-tout-petit', 'balade-nature-foret-tout-petit', 'comptines-jeux-de-doigts-tout-petit', 'jouer-dehors-ete-soleil-chaleur-tout-petit'] },
      { key: 'preschool', slugs: ['jeux-collectifs-dehors-regles-3-6-ans', 'balade-nature-foret-activites-3-6-ans', 'lire-des-histoires-enfant-3-6-ans', 'jeux-de-societe-enfant-3-6-ans', 'jeux-de-construction-puzzles-3-6-ans', 'faire-semblant-deguisements-3-6-ans', 'dessin-coloriage-enfant-3-6-ans', 'peinture-collage-decoupage-3-6-ans', 'bricolage-recup-enfant-3-6-ans', 'musique-chant-instruments-3-6-ans', 'danse-expression-corporelle-3-6-ans', 'activites-calmes-retour-au-calme-3-6-ans', 'ennui-creatif-laisser-enfant-s-ennuyer-3-6-ans', 'sorties-culturelles-musee-spectacle-cinema-3-6-ans', 'decouvrir-aliments-par-les-sens-marche-ferme-3-6-ans'] },
      { key: 'school', slugs: ['jeux-construction-societe-choisir-selon-age-6-12-ans', 'une-heure-activite-par-jour-6-10-ans-journee-type', 'periscolaire-garderie-mercredi-accueil-de-loisirs', 'autonomie-6-11-ans-ecole-seul-rester-seul-sac'], tool: { label: 'gd.link.nearby', icon: 'map-pin', href: '/outings' } },
      { key: 'screens', slugs: ['ecrans-et-jeunes-enfants', 'ecrans-3-6-ans-reperes-alternatives', 'telephone-portable-ecrans-et-ecole-regles', 'repas-en-famille-sans-ecran'] },
    ],
  },
  // ------------------------------------------------------------ Sommeil de l'enfant (1–10 ans)
  {
    id: 'kidsleep', theme: 'sleep', icon: 'moon',
    sections: [
      { key: 'basics', slugs: ['sommeil-enfant-1-6-ans', 'sommeil-de-l-enfant-3-10-ans', 'rituel-du-coucher-tout-petit-construire-etapes', 'routine-du-soir-bebe-rituel-a-deux', 'horaires-de-sommeil-reguliers-week-end-vacances-rentree', 'fatigue-scolaire-sommeil-enfant-rythme'] },
      { key: 'nights', slugs: ['cauchemars-terreurs-nocturnes-somnambulisme', 'peur-du-noir-au-coucher-rassurer-enfant', 'pipi-au-lit-enuresie', 'neuro-sommeil'] },
      { key: 'naps', slugs: ['fin-de-la-sieste-enfant-temps-calme', 'passer-du-lit-a-barreaux-au-lit-de-grand-quand-comment', 'doudou-role-choix-lavage-separation', 'tetine-quand-et-comment-arreter', 'lit-superpose-mezzanine-age-normes-securite', 'decalage-horaire-bebe-enfant-voyage-lointain'] },
    ],
  },
  // ------------------------------------------------------------ Alimentation de l'enfant (1–10 ans)
  {
    id: 'kidfood', theme: 'feeding', icon: 'coffee',
    sections: [
      { key: 'toddler', slugs: ['quel-lait-apres-1-an', 'morceaux-et-mastication-apres-1-an', 'rythme-des-repas-1-3-ans', 'gouter-du-tout-petit-1-3-ans', 'viande-poisson-oeufs-1-3-ans', 'aliments-a-eviter-ou-adapter-avant-3-ans', 'faire-gouter-les-legumes-tout-petit', 'faim-et-satiete-du-tout-petit', 'manger-seul-autonomie-a-table', 'tout-petit-vegetarien'] },
      { key: 'school', slugs: ['repas-equilibres-et-gouter-enfant', 'petit-dejeuner-enfant-3-10-ans-composer', 'gouter-enfant-3-10-ans-idees-equilibrees', 'fruits-legumes-enfant-portions-astuces', 'viande-poisson-oeufs-enfant-quelles-portions', 'produits-laitiers-enfant-combien-lesquels', 'eau-lait-cafeine-boissons-enfant-3-10-ans', 'gouter-pique-nique-enfant-a-emporter-hygiene', 'menu-vegetarien-cantine-et-maison-enfant'] },
      { key: 'refusal', slugs: ['alimentation-enfant-sans-pression', 'neophobie-alimentaire-comprendre', 'faire-aimer-les-legumes-enfant', 'grignotage-enfant-faim-ennui-ecrans', 'repas-en-famille-ambiance-sans-ecran', 'enfant-malade-mange-moins'] },
      { key: 'canteen', slugs: ['cantine-scolaire-et-pai', 'cantine-equilibrer-les-repas-a-la-maison', 'cantine-scolaire-inscription-tarifs-droit-acces', 'repas-creche-assistante-maternelle', 'allergies-alimentaires-enfant'], tool: { label: 'gd.link.meals', icon: 'coffee', href: '/meals' } },
    ],
  },
  // ------------------------------------------------------------ Émotions, comportement, famille
  {
    id: 'behaviour', theme: 'mood', icon: 'smile',
    sections: [
      { key: 'emotions', slugs: ['coleres-du-jeune-enfant', 'emotions-de-l-enfant-colere-peur-tristesse', 'enfant-qui-mord-tape-pousse-reagir', 'confiance-en-soi-et-autonomie-enfant', 'politesse-bonjour-merci-bisou-sans-forcer', 'neuro-emotions'] },
      { key: 'family', slugs: ['freres-et-soeurs-jalousie-disputes', 'separation-des-parents-accompagner-l-enfant', 'separation-residence-de-l-enfant-garde-alternee', 'parent-solo-organiser-quotidien-aides-relais', 'parent-solo-panorama-des-aides'] },
      { key: 'growing', slugs: ['argent-de-poche-et-education-financiere', 'autonomie-6-11-ans-ecole-seul-rester-seul-sac', 'telephone-portable-ecrans-et-ecole-regles', 'devoirs-a-la-maison-primaire-accompagner-sans-conflit'] },
      { key: 'bullying', slugs: ['harcelement-scolaire-que-faire', 'harcelement-scolaire-enfant-temoin-ou-auteur', 'cyberharcelement-enfant-reagir-preuves-3018', 'refus-scolaire-anxieux-angoisse-aller-a-l-ecole'] },
    ],
  },
  // ------------------------------------------------------------ Crèche, nounou, école
  {
    id: 'school', theme: 'tasks', icon: 'book',
    sections: [
      { key: 'care', slugs: ['employer-assistante-maternelle-etapes-pajemploi-cmg', 'cmg-emploi-direct-assistante-maternelle-garde-a-domicile', 'cmg-structure-micro-creche-organisme-habilite', 'tarif-creche-calcul-participation-familiale', 'credit-impot-frais-de-garde-enfant-moins-de-6-ans', 'repas-creche-assistante-maternelle'] },
      { key: 'start', slugs: ['entree-a-l-ecole-maternelle', 'petite-section-premieres-semaines-separation-fatigue', 'routine-du-matin-famille-creche-ecole-sans-course', 'allocation-de-rentree-scolaire-ars-conditions-demarches', 'allocation-de-rentree-scolaire-et-budget-fournitures', 'periscolaire-garderie-mercredi-accueil-de-loisirs'] },
      { key: 'daily', slugs: ['cantine-scolaire-et-pai', 'cantine-scolaire-inscription-tarifs-droit-acces', 'devoirs-a-la-maison-primaire-accompagner-sans-conflit', 'enfant-malade-creche-ecole-eviction-quand-garder', 'trajet-de-l-ecole-a-pied-a-velo-securite', 'telephone-portable-ecrans-et-ecole-regles'] },
      { key: 'needs', slugs: ['neuro-a-qui-parler', 'harcelement-scolaire-que-faire', 'refus-scolaire-anxieux-angoisse-aller-a-l-ecole'] },
    ],
  },
  // ------------------------------------------------------------ Développement 1–3 ans
  {
    id: 'toddler', theme: 'growth', icon: 'trending-up',
    sections: [
      { key: 'language', slugs: ['langage-de-1-a-3-ans', 'jeux-pour-aider-a-parler-1-3-ans', 'langage-3-6-ans-reperes-prononciation-aider', 'neuro-troubles-du-langage'] },
      { key: 'body', slugs: ['accompagner-premiers-pas-pieds-nus-chaussures', 'passer-du-lit-a-barreaux-au-lit-de-grand-quand-comment', 'bouger-trois-heures-par-jour-1-3-ans', 'croissance-2-a-10-ans-taille-poids-imc-reperes', 'proprete-sans-pression', 'tetine-quand-et-comment-arreter', 'doudou-role-choix-lavage-separation'] },
      { key: 'doubt', slugs: ['neuro-premiers-signes-se-poser-des-questions', 'neuro-a-qui-parler', 'consultations-pmi-pour-bebe'] },
    ],
  },
  // ------------------------------------------------------------ Mes droits au travail
  {
    id: 'work', theme: 'resources', icon: 'briefcase',
    sections: [
      { key: 'pregnant', slugs: ['droits-au-travail-pendant-la-grossesse', 'conge-maternite-duree-et-indemnites', 'travail-assis-sur-ecran-enceinte-posture'] },
      { key: 'birth', slugs: ['conge-second-parent-paternite', 'conge-de-paternite-et-d-accueil', 'conge-de-naissance-supplementaire-2026', 'conge-supplementaire-de-naissance-2026-organiser-a-deux', 'conge-parental-et-prepare'] },
      { key: 'back', slugs: ['reprise-du-travail-apres-bebe-check-list-pratique', 'reprise-du-travail-apres-bebe-emotions', 'allaitement-et-reprise-du-travail', 'allaiter-ou-tirer-son-lait-reprise-du-travail-droits-organisation-conservation'] },
      { key: 'sick', slugs: ['conge-enfant-malade-salarie-jours-par-an', 'enfant-malade-quand-on-travaille-conges-et-solutions', 'enfant-gravement-malade-conge-presence-parentale-ajpp', 'amp-prise-en-charge-et-absences-au-travail'] },
    ],
  },
  // ------------------------------------------------------------ Après une perte
  {
    id: 'loss', theme: 'mood', icon: 'heart', banner: 'gentle',
    sections: [
      { key: 'miscarriage', slugs: ['fausse-couche-precoce-comprendre-et-traverser', 'regles-apres-une-fausse-couche', 'nouvelle-grossesse-apres-fausse-couche', 'enceinte-apres-fausse-couche-apprivoiser-inquietude'] },
      { key: 'grief', slugs: ['deuil-perinatal-traverser-la-perte', 'deuil-perinatal-couple-et-freres-et-soeurs', 'deuil-perinatal-demarches-et-droits', 'deuil-perinatal-soutenir-un-proche', 'grossesse-apres-un-deuil-perinatal'] },
      { key: 'support', slugs: ['solitude-isolement-jeunes-parents', 'culpabilite-parentale-parent-suffisamment-bon'], tool: { label: 'gd.link.support', icon: 'phone', href: '/emergency' } },
    ],
  },
  // ------------------------------------------------------------ Parcours PMA
  {
    id: 'pma', theme: 'cycle', icon: 'clipboard',
    sections: [
      { key: 'understand', slugs: ['grossesse-qui-tarde-quand-consulter', 'bilan-infertilite-du-couple', 'bilan-hormonal-feminin-fertilite-explique', 'courbe-temperature-serologies-caryotype-bilan-fertilite', 'infertilite-traitements-et-parcours'] },
      { key: 'amp', slugs: ['amp-qui-peut-y-acceder-et-comment', 'amp-techniques-insemination-fiv-icsi', 'amp-prise-en-charge-et-absences-au-travail', 'autoconservation-des-gametes'] },
      { key: 'living', slugs: ['vivre-un-parcours-d-infertilite', 'age-et-projet-d-enfant', 'mode-de-vie-et-fertilite', 'fertilite-masculine-ce-qui-compte'], tool: { label: 'gd.link.exams', icon: 'clipboard', href: '/fertility/exams' } },
    ],
  },
  // ------------------------------------------------------------ À deux : couple et charge mentale
  {
    id: 'couple', theme: 'relay', icon: 'users',
    sections: [
      { key: 'load', slugs: ['charge-mentale-parentale-mieux-partager', 'parler-contraception-dans-le-couple-charge-contraceptive', 'conge-supplementaire-de-naissance-2026-organiser-a-deux', 'routine-du-soir-bebe-rituel-a-deux'], tool: { label: 'gd.link.tasks', icon: 'check-square', href: '/family' } },
      { key: 'us', slugs: ['couple-apres-bebe-tensions-et-dialogue', 'couple-et-famille-apres-la-naissance', 'desir-fatigue-et-couple-apres-bebe', 'communication-couple-sexualite-grossesse', 'vivre-un-parcours-d-infertilite'] },
      { key: 'solo', slugs: ['parent-solo-organiser-quotidien-aides-relais', 'parent-solo-panorama-des-aides', 'solitude-isolement-jeunes-parents'] },
    ],
  },
  // ------------------------------------------------------------ Mon bébé en néonatologie
  {
    id: 'neonat', theme: 'health', icon: 'heart',
    sections: [
      { key: 'there', slugs: ['bebe-hospitalise-en-neonatologie-parents', 'menace-accouchement-premature-et-prematurite', 'depistage-neonatal-test-au-talon', 'depistage-auditif-du-nouveau-ne'] },
      { key: 'home', slugs: ['age-corrige-bebe-premature-calcul-jusqua-quand-suivi', 'sommeil-sur-du-bebe-couchage', 'peau-a-peau-et-portage', 'consultations-pmi-pour-bebe', 'bebe-malade-qui-appeler'] },
    ],
  },
];

export const GUIDE_BY_ID = Object.fromEntries(GUIDES.map((g) => [g.id, g])) as Record<string, GuideDef>;
export const guideSlugs = (g: GuideDef) => [...new Set(g.sections.flatMap((s) => s.slugs))];
