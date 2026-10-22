# Contenus à faire relire par un professionnel de santé

Liste générée le 22 octobre 2026 à partir du code. **Aucun de ces contenus n’a encore été relu par un professionnel** (`reviewer_name` vide, statut « À vérifier »). Les informations de sécurité (urgences, contraception d’urgence) ont été vérifiées contre des sources officielles datées, mais doivent aussi être relues.

Pour chaque contenu : relire, corriger si besoin, puis renseigner `reviewer_name`, `reviewer_qualification` et `validated_at` (et passer le statut à `published`).

## Priorité 1 — informations de sécurité

- Contraception d’urgence (`src/lib/domain/cycleInsights.ts` › `EC_SOURCES`, textes `c3.ec.*` dans `src/i18n/fr/cycle3.ts`) — sources : Santé.fr (18/06/2024), Assurance Maladie (07/2023).
- Conseils « À savoir aujourd’hui » et messages de sécurité du cycle (`c3.ins.*`).
- Réponses d’urgence de l’assistant (`supabase/functions/_shared/safety.ts`) et numéros (15, 112, 3114, 119, 3919, 114).
- Article de démonstration « Baby blues ou dépression du post-partum ? » (`baby-blues-ou-depression`)
- Article de démonstration « Contraception d'urgence » (`contraception-urgence`)
- Article de démonstration « Le cycle et la « fenêtre fertile » : des estimations » (`cycle-fenetre-fertile`)
- Article de démonstration « Comment demander de l'aide quand on n'y arrive plus » (`demander-de-l-aide`)
- Article de démonstration « Reconnaître les signes du travail » (`signes-du-travail`)

## Priorité 2 — articles de la bibliothèque

| Fichier | Identifiant | Titre | Relu par | Date |
|---|---|---|---|---|
| library | `comprendre-fenetre-fertile` | Comprendre la fenêtre fertile |  |  |
| library | `acide-folique-avant-conception` | Acide folique (vitamine B9) : dès le projet de grossesse |  |  |
| library | `grossesse-qui-tarde-quand-consulter` | Quand la grossesse se fait attendre : quand consulter ? |  |  |
| library | `tests-ovulation-ce-quils-indiquent` | Tests d’ovulation : ce qu’ils indiquent, et ce qu’ils ne disent pas |  |  |
| library | `mode-de-vie-et-fertilite` | Mode de vie et fertilité : ce qui peut aider |  |  |
| library | `test-de-grossesse-quand-le-faire` | Test de grossesse : quand le faire ? |  |  |
| library | `contraception-methodes-efficacite` | Méthodes de contraception : comparer leur efficacité |  |  |
| library | `calendrier-pas-une-contraception-fiable` | Pourquoi un calendrier seul n’est pas une contraception fiable |  |  |
| library | `oubli-de-pilule-que-faire` | Oubli de pilule : que faire ? |  |  |
| library | `contraception-urgence-ou-et-quand` | Contraception d’urgence : où et quand ? |  |  |
| library | `suivi-grossesse-rendez-vous-examens` | Le suivi de grossesse : rendez-vous et examens |  |  |
| library | `echographies-de-grossesse` | Les trois échographies de la grossesse |  |  |
| library | `nausees-de-grossesse` | Nausées de grossesse : ce qui peut soulager |  |  |
| library | `sommeil-pendant-la-grossesse` | Mieux dormir pendant la grossesse |  |  |
| library | `grossesse-signes-qui-doivent-faire-consulter` | Pendant la grossesse : les signes qui doivent faire consulter |  |  |
| library | `activite-physique-pendant-la-grossesse` | Bouger pendant la grossesse |  |  |
| library | `preparation-naissance-parentalite` | La préparation à la naissance et à la parentalité |  |  |
| library | `humeur-pendant-la-grossesse` | Humeur et émotions pendant la grossesse |  |  |
| library | `rapports-pendant-la-grossesse-faq` | Les rapports sont-ils possibles pendant la grossesse ? |  |  |
| library | `sexualite-grossesse-idees-recues` | Sexualité et grossesse : démêler les idées reçues |  |  |
| library | `desir-pendant-la-grossesse` | Les changements du désir pendant la grossesse |  |  |
| library | `communication-couple-sexualite-grossesse` | Parler de sexualité dans le couple pendant la grossesse |  |  |
| library | `sexualite-grossesse-quand-demander-conseil` | Sexualité pendant la grossesse : quand demander conseil |  |  |
| library | `sommeil-sur-du-bebe-couchage` | Coucher bébé en sécurité |  |  |
| library | `pleurs-du-nourrisson-et-bebe-secoue` | Les pleurs du nourrisson, et quand on est à bout |  |  |
| library | `allaitement-debuter` | Allaitement : bien démarrer |  |  |
| library | `biberons-preparation-hygiene` | Biberons : préparation et hygiène |  |  |
| library | `fievre-nourrisson-quand-consulter` | Fièvre du nourrisson : quand consulter ? |  |  |
| library | `mere-apres-la-naissance` | Prendre soin de vous après la naissance |  |  |
| library | `nuits-avec-un-nouveau-ne` | Les nuits avec un nouveau-né |  |  |
| library | `peau-a-peau-et-portage` | Peau à peau et portage |  |  |
| library | `sommeil-enfant-1-6-ans` | Le sommeil de l’enfant de 1 à 6 ans |  |  |
| library | `ecrans-et-jeunes-enfants` | Les écrans et les jeunes enfants |  |  |
| library | `dents-et-brossage-enfant` | Les dents de l’enfant : brossage et habitudes |  |  |
| library | `coleres-du-jeune-enfant` | Les colères du jeune enfant |  |  |
| library | `proprete-sans-pression` | La propreté, sans pression |  |  |
| library | `alimentation-enfant-sans-pression` | Quand votre enfant refuse de manger |  |  |
| library | `fatigue-des-parents` | La fatigue des parents : normale, mais pas à porter seul |  |  |
| library | `se-relayer-la-nuit` | Se relayer la nuit |  |  |
| library | `siestes-des-parents` | Les siestes des parents |  |  |
| library | `fatigue-parent-quand-consulter` | Quand la fatigue doit faire consulter |  |  |
| neuro | `neuro-premiers-signes-se-poser-des-questions` | Se poser des questions sur le développement de son enfant |  |  |
| neuro | `neuro-tdah-comprendre` | Le TDAH : comprendre l’attention et l’agitation |  |  |
| neuro | `neuro-autisme-tsa-comprendre` | L’autisme (TSA) : repères pour les parents |  |  |
| neuro | `neuro-troubles-dys` | Les troubles « dys » : quand apprendre demande plus d’efforts |  |  |
| neuro | `neuro-troubles-du-langage` | Langage : quand en parler et comment l’encourager |  |  |
| neuro | `neuro-difficultes-sensorielles` | Bruits, lumières, textures : les particularités sensorielles |  |  |
| neuro | `neuro-sommeil` | Sommeil difficile : des pistes pour toute la famille |  |  |
| neuro | `neuro-alimentation-selectivite` | Repas compliqués : sélectivité et particularités alimentaires |  |  |
| neuro | `neuro-emotions` | Colères et émotions débordantes : accompagner son enfant |  |  |
| neuro | `neuro-a-qui-parler` | Un doute sur le développement : à qui en parler ? |  |  |
| neuro | `neuro-preparer-un-rendez-vous` | Bien préparer un rendez-vous au sujet de son enfant |  |  |
| neuro | `neuro-professionnels-concernes` | Qui fait quoi ? Les professionnels qui peuvent accompagner votre enfant |  |  |
| neuro | `neuro-ecole-pap-pps-aesh` | À l’école : PAP, PPS, AESH… s’y retrouver |  |  |
| neuro | `neuro-mdph-demarches` | La MDPH : à quoi elle sert et comment faire une demande |  |  |
| neuro | `neuro-accompagnement-au-quotidien` | Au quotidien : petites adaptations, grands effets |  |  |
| neuro | `neuro-soutien-aux-parents` | Prendre soin de soi quand on accompagne son enfant |  |  |
| neuro | `neuro-vous-netes-pas-seuls` | Vous n’êtes pas seuls |  |  |

## Priorité 3 — articles de démonstration

| Identifiant | Titre | Relu par | Date |
|---|---|---|---|
| `cesarienne` | Césarienne programmée ou en urgence |  |  |
| `debut-diversification` | Commencer la diversification |  |  |
| `diastasis` | Diastasis des grands droits : comprendre |  |  |
| `fromages-grossesse` | Fromages et grossesse : ce qu'il faut savoir |  |  |
| `hormones-apres-naissance` | Hormones après la naissance : ce qui change |  |  |
| `nuits-jumeaux` | Organiser les nuits avec des jumeaux |  |  |
| `perinee-role` | À quoi sert le périnée ? |  |  |
| `premiers-jours-retour-maison` | Les premiers jours à la maison |  |  |
| `valise-maternite` | Préparer sa valise de maternité |  |  |

## Autres contenus

- Recettes (`src/content/recipes/v2.ts`) : statut « À vérifier » pour la conservation et la diversification.
- Aide de nuit (`src/content/nightHelp.ts`).
- Illustrations du bébé (images générées) : à valider avant publication.
