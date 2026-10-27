/** Guide complet « grossesse » (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
/** Pages officielles françaises réellement lues le 2026-10-27. `published` = date affichée par la page (publication ou vérification). */
const S = {
  spDeclaration: { label: 'Service-Public.fr — Déclaration de grossesse', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F968', consulted_on: C, published: '2025-10-24' },
  ameliDemarches: { label: 'ameli.fr — Grossesse : démarches et accompagnement', url: 'https://www.ameli.fr/assure/droits-demarches/famille/maternite-paternite-adoption/grossesse', consulted_on: C, published: '2017-05-02' },
  ameliProgramme: { label: 'ameli.fr — Grossesse : le programme de suivi et la première consultation', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse/grossesse-soins-dentaires-dentiste-consultation', consulted_on: C, published: '2026-07-14' },
  ameliMensuel: { label: 'ameli.fr — Suivi mensuel de la grossesse à partir du 4e mois', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse/consultation-suivi-mensuel', consulted_on: C, published: '2026-06-02' },
  santeEpp: { label: 'Santé.fr — L’entretien prénatal précoce', url: 'https://www.sante.fr/node/19940569', consulted_on: C },
  ameliPreparation: { label: 'ameli.fr — Se préparer à l’arrivée de bébé (préparation à la naissance, choix de la maternité)', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse/preparation-parentalite', consulted_on: C, published: '2026-06-02' },
  ameliInfectionsRecherche: { label: 'ameli.fr — Infection maternelle pendant la grossesse : recherche et prévention', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/infections/recherche-prevention', consulted_on: C, published: '2024-12-02' },
  ameliInfectionsBact: { label: 'ameli.fr — Les infections bactériennes pendant la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/infections/infections-bacteriennes', consulted_on: C, published: '2025-05-21' },
  hasT21: { label: 'HAS — Trisomie 21 : la HAS actualise ses recommandations concernant le dépistage prénatal', url: 'https://www.has-sante.fr/jcms/c_2768535/fr/trisomie-21-la-has-actualise-ses-recommandations-concernant-le-depistage-prenatal-de-la-trisomie-21', consulted_on: C, published: '2017-05-17' },
  sante8eMois: { label: 'Santé.fr — Grossesse : la consultation du 8e mois', url: 'https://www.sante.fr/grossesse-la-consultation-de-8eme-mois', consulted_on: C },
  santeCalendrier: { label: 'Santé.fr — Le calendrier de grossesse', url: 'https://www.sante.fr/le-calendrier-de-grossesse', consulted_on: C },
  sante6eMois: { label: 'Santé.fr — 6e mois, suivi de grossesse semaine après semaine', url: 'https://www.sante.fr/6eme-mois-suivi-de-grossesse-semaine-apres-semaine', consulted_on: C, published: '2025-07-09' },
  sante7eMois: { label: 'Santé.fr — 7e mois, suivi de grossesse semaine après semaine', url: 'https://www.sante.fr/7eme-mois-suivi-de-grossesse-semaine-apres-semaine', consulted_on: C, published: '2025-07-09' },
  sante9eMois: { label: 'Santé.fr — 9e mois, suivi de grossesse semaine après semaine', url: 'https://www.sante.fr/9eme-mois-suivi-de-grossesse-semaine-apres-semaine', consulted_on: C },
  santePoids: { label: 'Santé.fr — La prise de poids pendant la grossesse', url: 'https://www.sante.fr/la-prise-de-poids-pendant-la-grossesse', consulted_on: C, published: '2022-04-01' },
  ameliSurpoids: { label: 'ameli.fr — Surpoids ou obésité : particularités du suivi de la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/surpoids-obesite-et-grossesse/surpoids-obesite-suivi-grossesse', consulted_on: C },
  santeAlimentation: { label: 'Santé.fr — Enceinte, une alimentation saine et équilibrée durant la grossesse', url: 'https://www.sante.fr/enceinte-une-alimentation-saine-et-equilibree-durant-la-grossesse', consulted_on: C, published: '2025-08-28' },
  santeAliments: { label: 'Santé.fr — Quels aliments éviter et quelles précautions prendre quand on est enceinte ?', url: 'https://www.sante.fr/node/7070507', consulted_on: C },
  santeListeriose: { label: 'Santé.fr — Listériose pendant la grossesse, quels aliments éviter ?', url: 'https://www.sante.fr/listeriose-pendant-la-grossesse-quels-aliments-eviter', consulted_on: C },
  ameliToxo: { label: 'ameli.fr — Toxoplasmose : gestes de prévention à adopter lors de la grossesse', url: 'https://www.ameli.fr/assure/sante/themes/toxoplasmose/prevention', consulted_on: C, published: '2024-05-28' },
  santeEnvironnement: { label: 'Santé.fr — Grossesse et environnement : comment repérer les produits nocifs et situations à risque', url: 'https://www.sante.fr/grossesse-et-environnement-comment-reperer-les-produits-nocifs-et-situations-risque', consulted_on: C },
  ameliAlcool: { label: 'ameli.fr — Zéro alcool de la conception à la fin de la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/tabac-alcool-drogue-et-grossesse/zero-alcool-pendant-la-grossesse', consulted_on: C },
  ameliTabac: { label: 'ameli.fr — Tabac et grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/tabac-alcool-drogue-et-grossesse/conduites-risques-tabac-drogues', consulted_on: C },
  ameliDrogues: { label: 'ameli.fr — Drogues et grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/tabac-alcool-drogue-et-grossesse/drogues-et-grossesse', consulted_on: C },
  ameliMedicaments: { label: 'ameli.fr — Médicaments et grossesse', url: 'https://www.ameli.fr/assure/sante/medicaments/medicaments-et-situation-de-vie/medicament-grossesse', consulted_on: C, published: '2025-04-28' },
  santeVaccins: { label: 'Santé.fr — Vaccination des femmes enceintes : quels vaccins recommandés et contre-indiqués ?', url: 'https://www.sante.fr/node/1139269', consulted_on: C },
  santeDiabete: { label: 'Santé.fr — Diabète gestationnel', url: 'https://www.sante.fr/diabete-gestationnel', consulted_on: C, published: '2026-08-13' },
  ameliDigestion: { label: 'ameli.fr — Nausées, vomissements, remontées acides et constipation lors de la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse-alimentation/enceinte-problemes-de-digestion', consulted_on: C, published: '2026-06-19' },
  ameliJambes: { label: 'ameli.fr — Jambes lourdes et chevilles qui enflent : que faire au quotidien ?', url: 'https://www.ameli.fr/assure/sante/themes/jambes-lourdes/bons-reflexes-quotidiens', consulted_on: C, published: '2025-05-07' },
  ameliDents: { label: 'ameli.fr — Un rendez-vous chez le chirurgien-dentiste offert pendant votre maternité', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse/femme-enceinte-soins-dentaire-mtdents', consulted_on: C },
  santeChaleur: { label: 'Santé.fr — Fortes chaleurs et canicule : se protéger et protéger ses proches', url: 'https://www.sante.fr/fortes-chaleurs-et-canicule-se-proteger-et-proteger-ses-proches', consulted_on: C, published: '2026-08-03' },
  arsVoyageurs: { label: 'ARS Occitanie — Voyageurs : les bons gestes avant le départ et au retour', url: 'https://www.occitanie.ars.sante.fr/voyageurs-les-bons-gestes-avant-le-depart-et-au-retour', consulted_on: C, published: '2026-04-30' },
  spCongeMaternite: { label: 'Service-Public.fr — Congé de maternité d’une salariée du secteur privé', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2265', consulted_on: C, published: '2026-06-01' },
  spAbsences: { label: 'Service-Public.fr — Une salariée a-t-elle droit à des absences liées à sa grossesse ?', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2330', consulted_on: C },
  spLicenciement: { label: 'Service-Public.fr — Licenciement d’une salariée enceinte ou en congé de maternité', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2873', consulted_on: C, published: '2025-03-26' },
  spPaternite: { label: 'Service-Public.fr — Congé de paternité et d’accueil de l’enfant (secteur privé)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F3156', consulted_on: C },
  spPrime: { label: 'Service-Public.fr — Prestation d’accueil du jeune enfant (Paje) : prime à la naissance', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2550', consulted_on: C, published: '2026-04-01' },
  spReconnaissance: { label: 'Service-Public.fr — Reconnaissance d’un enfant (couple non marié) : démarche', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F887', consulted_on: C, published: '2026-01-27' },
  santePmi: { label: 'Santé.fr (1000 premiers jours) — Qu’est-ce qu’un centre de Protection Maternelle et Infantile (PMI) ?', url: 'https://www.sante.fr/quest-ce-quun-centre-de-protection-maternelle-et-infantile-pmi', consulted_on: C, published: '2024-08-26' },
  ameliAccouchement: { label: 'ameli.fr — Comment se déroule un accouchement ?', url: 'https://www.ameli.fr/assure/sante/devenir-parent/accouchement-et-nouveau-ne/accouchement', consulted_on: C },
  santeCesarienne: { label: 'Santé.fr (HAS) — La césarienne programmée à terme : est-ce que cela me concerne ?', url: 'https://www.sante.fr/la-cesarienne-programmee-terme-est-ce-que-cela-me-concerne-que-dois-je-savoir', consulted_on: C, published: '2012-01-09' },
  santePrematures: { label: 'Santé.fr — Prématurés : des bébés sous surveillance', url: 'https://www.sante.fr/prematures-des-bebes-sous-surveillance', consulted_on: C, published: '2025-12-02' },
  santePremiereTetee: { label: 'Santé.fr — La première tétée', url: 'https://www.sante.fr/la-premiere-tetee', consulted_on: C, published: '2025-06-16' },
  santeRythmeTetees: { label: 'Santé.fr — Rythme des tétées', url: 'https://www.sante.fr/rythme-des-tetees', consulted_on: C, published: '2025-12-11' },
  spAllo: { label: 'Service-Public.fr — Missions et valeurs (mention d’Allô Service Public 3939, renseignement administratif par téléphone)', url: 'https://entreprendre.service-public.gouv.fr/P10002', consulted_on: C, published: '2025-09-26' },
  infoViolences: { label: 'info.gouv.fr — Violences faites aux femmes : quels recours pour les victimes ?', url: 'https://www.info.gouv.fr/actualite/violences-faites-aux-femmes-quels-recours-pour-les-victimes', consulted_on: C, published: '2025-11-24' },
  santeTabac: { label: 'Santé.fr (Santé publique France — Tabac Info Service) — 9 conseils pour arrêter de fumer', url: 'https://www.sante.fr/node/1134744', consulted_on: C, published: '2023-05-23' },
  santeCannabis: { label: 'Santé.fr (Santé publique France — 1000 premiers jours) — Savoir dire non au cannabis pendant la grossesse', url: 'https://www.sante.fr/node/1871143', consulted_on: C, published: '2019-06-19' },
  arsCap: { label: 'ARS Île-de-France — Centre antipoison et de toxicovigilance d’Île-de-France', url: 'https://www.iledefrance.ars.sante.fr/centre-antipoison-et-de-toxicovigilance-dile-de-france-captv', consulted_on: C, published: '2023-05-30' },
  hasAntiD: { label: 'HAS — Commission de la transparence : avis sur une immunoglobuline anti-D (indications pendant la grossesse)', url: 'https://has-sante.fr/upload/docs/application/pdf/2010-04/rhophylac_-_ct-7715.pdf', consulted_on: C, published: '2010-03-31' },
  efsRhd: { label: 'Établissement français du sang — Génotypage RHD fœtal sur sang maternel (fiche pour les praticiens)', url: 'https://www.efs.sante.fr/sites/default/files/2024-08/Fiche%20Foetal_praticien_2023.pdf', consulted_on: C },
  santeJumeaux: { label: 'Santé.fr — Allaiter des jumeaux', url: 'https://www.sante.fr/allaiter-des-jumeaux', consulted_on: C, published: '2022-11-07' },
} satisfies Record<string, ArticleSource>;

/** Phrase de fin commune : l'article informe, il ne remplace pas un professionnel. */
const FIN = '_Cet article vous informe ; il ne remplace pas l’avis de la sage-femme ou du médecin qui vous suit._';
const URG = 'En cas d’urgence, appelez le **15** (SAMU) ou le **112**.';

const a = (x: Omit<LibArticle, 'status' | 'journeys'> & { journeys?: LibArticle['journeys'] }): LibArticle => ({ journeys: ['pregnant'], status: 'to_review', ...x });

export const GUIDE_GROSSESSE: LibArticle[] = [
  // ------------------------------------------------------------------ droits et démarches
  a({
    slug: 'declaration-de-grossesse-premieres-demarches',
    title: 'Déclarer sa grossesse : les premières démarches',
    summary: 'Quand et comment déclarer votre grossesse, et ce que cette déclaration vous ouvre auprès de l’Assurance Maladie et de la Caf.',
    category: 'droits-demarches', tags: ['démarches', 'déclaration', 'caf', 'assurance maladie'], max_week: 16,
    sources: [S.spDeclaration, S.ameliDemarches, S.ameliProgramme],
    body_md: `## En bref
- La déclaration de grossesse se fait dans les **14 premières semaines**, à l’issue du premier examen prénatal.
- C’est le médecin ou la sage-femme qui l’établit, le plus souvent **en ligne** : elle part alors directement à l’Assurance Maladie et à la Caf.
- Elle ouvre la prise en charge des frais liés à la grossesse et le droit aux prestations familiales.
- Pensez à **mettre à jour votre carte Vitale** ensuite.

## Comprendre
Le premier examen prénatal a lieu avant la fin du 3e mois, avec un médecin (généraliste ou gynécologue) ou une sage-femme. C’est lors de ce rendez-vous que la grossesse est déclarée. Cette déclaration n’est pas une simple formalité : elle permet à l’Assurance Maladie de prendre en charge les examens de suivi et à la Caf d’étudier vos droits, par exemple la prime à la naissance.

Deux façons de faire existent. **En ligne**, le professionnel s’en charge avec votre carte Vitale : vous n’avez rien à envoyer. **Sur papier**, il vous remet un formulaire : la partie rose est à adresser à votre caisse d’Assurance Maladie, les deux volets bleus à la Caf. Si vous dépendez du régime agricole, tout est envoyé à la MSA.

Une fois la grossesse déclarée, l’Assurance Maladie vous accompagne : guide « Ma maternité », calendrier personnalisé des examens, informations dans votre compte ameli, ateliers collectifs selon les départements.

## Au quotidien
- **Prenez rendez-vous tôt** pour le premier examen : il comprend aussi des prises de sang et l’échographie de datation se programme entre 11 et 13 semaines d’aménorrhée.
- **Gardez une trace** de la date de déclaration et vérifiez dans votre compte ameli qu’elle a bien été reçue.
- **Carte Vitale** : mettez-la à jour en pharmacie ou en borne pour faciliter les remboursements.
- **Employeur** : vous n’êtes pas obligée d’annoncer votre grossesse tout de suite, mais l’information est nécessaire pour bénéficier des protections prévues par le Code du travail (voir l’article sur vos droits au travail).
- Si vous êtes travailleuse indépendante ou conjointe collaboratrice, la déclaration ouvre aussi des indemnités spécifiques ; renseignez-vous auprès de votre caisse.

### Pas à pas
1. **Premier rendez-vous** avant la fin du 3e mois : examen, prises de sang, prescription de vitamine B9.
2. **Déclaration** faite par le professionnel, en ligne ou sur papier.
3. **Vérification** dans votre compte ameli et, si vous êtes allocataire, dans votre espace Caf.
4. **Carte Vitale** mise à jour.
5. **Calendrier de suivi** : notez les dates des échographies, de l’entretien prénatal précoce et des consultations mensuelles.
Pour les démarches liées au travail (annonce à l’employeur, congé maternité), voyez les articles dédiés.

## Questions fréquentes
**Que se passe-t-il si je déclare ma grossesse après 14 semaines ?**
Parlez-en sans attendre avec votre médecin ou votre sage-femme et contactez votre caisse : certaines aides, comme la prime à la naissance, sont liées à une déclaration dans les délais.

**Dois-je envoyer quelque chose si la déclaration est faite en ligne ?**
Non. Elle est transmise automatiquement à l’Assurance Maladie et à la Caf.

**Je dépends de la MSA, est-ce différent ?**
Le principe est le même ; la déclaration est simplement adressée à la MSA.

**Qui peut faire le premier examen ?**
Un médecin généraliste, un gynécologue ou une sage-femme, en cabinet, en maternité ou en centre de PMI.

**Ma déclaration ouvre-t-elle d’autres aides ?**
Elle permet à la Caf d’étudier vos droits, comme la prime à la naissance (sous conditions de ressources). Faites une simulation sur caf.fr.

## Quand demander conseil
Si vous avez des saignements, de fortes douleurs dans le bas du ventre ou une forte fièvre en début de grossesse, consultez sans attendre. ${URG} Pour toute question administrative, votre caisse d’Assurance Maladie (36 46) et la Caf peuvent vous renseigner.

${FIN}`,
  }),
  a({
    slug: 'grossesse-ce-qui-est-pris-en-charge',
    title: 'Grossesse : ce qui est remboursé, et à partir de quand',
    summary: 'Consultations, échographies, examens et préparation à la naissance : ce que prend en charge l’Assurance Maladie selon les mois de grossesse.',
    category: 'droits-demarches', tags: ['remboursement', '100 %', 'assurance maladie', 'tiers payant'],
    sources: [S.ameliDemarches, S.ameliProgramme, S.ameliDents],
    body_md: `## En bref
- Dès le début de la grossesse, les **consultations prénatales obligatoires**, la préparation à la naissance et les examens biologiques prévus sont pris en charge à 100 %.
- À partir du **1er jour du 6e mois** et jusqu’à 12 jours après l’accouchement, les frais remboursables sont pris en charge à 100 %, avec dispense d’avance de frais.
- L’**examen bucco-dentaire** de prévention est offert à partir du 4e mois.
- L’**entretien prénatal précoce** est pris en charge à 100 %.

## Comprendre
Le suivi d’une grossesse comprend 7 consultations, 3 échographies recommandées, un entretien prénatal précoce, un bilan prénatal de prévention avec une sage-femme, 7 séances de préparation à la naissance et à la parentalité, ainsi que des vaccinations. L’Assurance Maladie organise leur prise en charge en deux temps.

**Jusqu’à la fin du 5e mois**, ce sont les actes spécifiques au suivi de grossesse qui sont couverts à 100 % : consultations prénatales obligatoires, séances de préparation, examens biologiques obligatoires. Les deux premières échographies sont, selon la page de l’Assurance Maladie, remboursées au taux habituel. **À partir du 6e mois**, l’ensemble de vos frais médicaux remboursables, même sans lien avec la grossesse, est pris en charge à 100 % jusqu’à 12 jours après la naissance.

## Au quotidien
- **Déclarez votre grossesse dans les délais** : c’est elle qui déclenche ces droits.
- **Mettez à jour votre carte Vitale** après la déclaration, pour bénéficier du tiers payant sur les soins pris en charge à 100 %.
- **Dépassements d’honoraires** : ils ne sont pas couverts par le 100 % ; renseignez-vous avant un rendez-vous, et interrogez votre complémentaire santé.
- **Maternité privée** : la prise en charge porte sur le tarif de base ; vérifiez les tarifs et ce que rembourse votre complémentaire.
- **Dentiste** : l’examen offert est valable du 4e mois de grossesse jusqu’à 6 mois après l’accouchement ; les soins qui en découlent sont remboursés au taux habituel.

### Récapitulatif par période
- **Du début au 5e mois** : consultations prénatales obligatoires, séances de préparation, examens biologiques obligatoires à 100 % ; entretien prénatal précoce à 100 % ; deux premières échographies au taux habituel.
- **À partir du 4e mois** : examen bucco-dentaire de prévention offert.
- **Du 1er jour du 6e mois à 12 jours après la naissance** : tous les frais médicaux remboursables à 100 %, avec dispense d’avance de frais ; la 3e échographie est concernée.
- **Après la naissance** : l’examen postnatal et les séances de rééducation prescrites ont aussi leur prise en charge propre ; renseignez-vous auprès de votre caisse.

## Questions fréquentes
**Les consultations chez la sage-femme sont-elles prises en charge comme chez le médecin ?**
Oui, les consultations prénatales obligatoires peuvent être faites par une sage-femme et sont prises en charge de la même façon.

**Et si je consulte pour autre chose (rhume, dentiste) avant le 6e mois ?**
Ces soins sont remboursés au taux habituel jusqu’au 6e mois, puis à 100 % ensuite.

**J’ai perdu le formulaire pour l’examen dentaire ?**
Demandez-en un nouveau à votre caisse ou à votre chirurgien-dentiste.

**Les ateliers proposés par ma caisse sont-ils payants ?**
Ils sont proposés gratuitement par certaines caisses, sur inscription ; le 36 46 vous dira ce qui existe dans votre département.

**Les séances de préparation à la naissance sont-elles toutes remboursées ?**
Les 7 séances prévues sont prises en charge à 100 % lorsqu’elles sont réalisées par une sage-femme ou un médecin.

## Quand demander conseil
Pour une question de remboursement, contactez votre caisse (36 46) ou votre complémentaire santé. Pour toute question médicale, adressez-vous à votre sage-femme ou à votre médecin. ${URG}

${FIN}`,
  }),
  a({
    slug: 'conge-maternite-duree-et-indemnites',
    title: 'Le congé maternité : durée, report et indemnités',
    summary: 'Combien de semaines avant et après la naissance, comment décaler une partie du congé et comment sont versées les indemnités.',
    category: 'droits-demarches', tags: ['congé maternité', 'travail', 'indemnités journalières'],
    sources: [S.spCongeMaternite, S.spAllo],
    body_md: `## En bref
- Le congé maternité est **obligatoire** : il comprend un congé prénatal (avant) et un congé postnatal (après).
- Pour un 1er ou un 2e enfant : **6 semaines avant + 10 semaines après**, soit 16 semaines.
- Il est plus long à partir du 3e enfant et en cas de jumeaux ou de triplés.
- Une partie du congé prénatal peut être **reportée après la naissance**, sur avis favorable du professionnel de santé.

## Comprendre
Pendant le congé maternité, votre contrat de travail est suspendu et vous percevez, sous conditions, des indemnités journalières versées par l’Assurance Maladie (ou la MSA). Vous ne pouvez pas y renoncer totalement : il faut cesser de travailler au moins 8 semaines, dont 6 après l’accouchement.

**Durées prévues pour une salariée du secteur privé :**
- 1er ou 2e enfant : 6 semaines avant + 10 semaines après (16 semaines) ;
- 3e enfant ou plus : 8 semaines avant + 18 semaines après (26 semaines) ;
- jumeaux : 12 semaines avant + 22 semaines après (34 semaines) ;
- triplés ou plus : 24 semaines avant + 22 semaines après (46 semaines).
Une convention collective peut prévoir mieux.

**Aménagements possibles.** Vous pouvez décaler jusqu’à **3 semaines** du congé prénatal sur le congé postnatal, avec un avis favorable de votre professionnel de santé et une demande à votre caisse au plus tard la veille ; l’accord de l’employeur n’est pas nécessaire. À l’inverse, le congé prénatal peut être avancé (jusqu’à 2 semaines pour un 3e enfant, 4 semaines pour des naissances multiples), le congé postnatal étant alors réduit d’autant. En cas de **grossesse pathologique**, le médecin peut prescrire jusqu’à 2 semaines supplémentaires avant et 4 semaines après.

**Indemnités.** Elles sont calculées à partir de vos 3 derniers salaires bruts, avec un abattement forfaitaire, entre un minimum et un maximum journaliers fixés chaque année, et versées tous les 14 jours. Leur ouverture dépend de conditions d’affiliation et d’activité.

## Au quotidien
- **Prévenez votre employeur** par lettre recommandée avec accusé de réception (ou remise contre récépissé), avec un certificat médical indiquant la date présumée d’accouchement.
- **Faites une simulation** sur ameli.fr pour estimer vos indemnités.
- **Accouchement prématuré, tardif ou hospitalisation du bébé** : des règles particulières de report ou de prolongation existent ; renseignez-vous auprès de votre caisse.
- Pensez à **organiser le relais** de vos dossiers quelques semaines avant le départ, sans attendre la dernière minute.

## Questions fréquentes
**Puis-je travailler plus longtemps avant la naissance ?**
Oui, dans la limite du report de 3 semaines sur le congé postnatal, avec l’avis favorable de votre médecin ou sage-femme.

**Mon employeur peut-il refuser le report ?**
Non, son accord n’est pas nécessaire ; la demande se fait auprès de votre caisse.

**Que se passe-t-il si mon bébé naît avant la date prévue ?**
Des règles spécifiques permettent de ne pas perdre de jours de congé ; votre caisse vous indiquera votre situation.

**Je suis fonctionnaire ou indépendante ?**
Les règles diffèrent : consultez les fiches Service-Public dédiées ou votre administration.

## Quand demander conseil
Pour vos droits, contactez votre caisse d’Assurance Maladie, Allô Service Public (39 39) ou les représentants du personnel. Si votre état de santé vous inquiète pendant la grossesse, parlez-en à la sage-femme ou au médecin. ${URG}

${FIN}`,
  }),
  a({
    slug: 'droits-au-travail-pendant-la-grossesse',
    title: 'Enceinte et salariée : vos droits au travail',
    summary: 'Absences pour les examens, protection contre le licenciement, annonce de la grossesse : ce que prévoit le Code du travail.',
    category: 'droits-demarches', tags: ['travail', 'employeur', 'licenciement', 'absences'],
    sources: [S.spAbsences, S.spLicenciement, S.spAllo],
    body_md: `## En bref
- Vous pouvez vous absenter pour les **examens médicaux obligatoires** de la grossesse, **sans perte de salaire**.
- La personne qui vit en couple avec vous peut s’absenter pour **3 de ces examens**.
- Vous n’êtes pas obligée d’annoncer votre grossesse, mais c’est nécessaire pour être **protégée contre le licenciement**.
- Pendant le congé maternité, le licenciement est **interdit**.

## Comprendre
**Les absences.** Les examens prénataux obligatoires, puis l’examen postnatal, peuvent avoir lieu sur votre temps de travail. Ces absences ne réduisent pas votre rémunération et comptent comme du temps de travail pour les congés payés et l’ancienneté. Votre employeur peut demander un justificatif. Si vous êtes en parcours d’assistance médicale à la procréation, des absences sont aussi prévues pour les actes médicaux.

**La protection contre le licenciement.** Elle fonctionne en deux niveaux :
- **protection absolue** pendant le congé maternité et les congés payés pris juste après (ainsi que pendant un arrêt de travail lié à la grossesse, dans certaines limites) : aucun licenciement possible ;
- **protection relative** dès que l’employeur est informé de la grossesse, puis pendant 10 semaines après la fin du congé : le licenciement n’est possible que pour faute grave ou impossibilité de maintenir le contrat pour un motif étranger à la grossesse.

**Annoncer sa grossesse.** Aucune obligation, mais pour être protégée, il faut envoyer un certificat médical indiquant la date présumée d’accouchement, par lettre recommandée avec accusé de réception. Si un licenciement vous est notifié alors que votre employeur ignorait la grossesse, vous disposez de **15 jours** pour lui envoyer ce certificat.

## Au quotidien
- **Choisissez votre moment** pour annoncer la grossesse, en sachant que la protection démarre à partir de l’information.
- **Gardez des copies** de vos courriers et justificatifs d’absence.
- **Poste de travail** : si certaines tâches vous paraissent difficiles ou exposantes (port de charges, produits chimiques, travail de nuit), parlez-en au médecin du travail.
- **Allaitement** : pendant 1 an après la naissance, des pauses pour allaiter sont prévues (non rémunérées sauf disposition plus favorable de votre convention collective).

### Exemple de courrier
« Madame, Monsieur, je vous informe que je suis enceinte et que la date présumée de mon accouchement est fixée au … Vous trouverez ci-joint un certificat médical l’attestant. » Envoyez-le en recommandé avec accusé de réception, et gardez-en une copie.

## Questions fréquentes
**Mon employeur peut-il me demander si je suis enceinte à l’embauche ?**
Vous n’avez pas à le déclarer ; la grossesse ne peut pas motiver un refus d’embauche.

**Mon conjoint peut-il venir aux échographies ?**
La personne qui vit en couple avec vous a droit à une autorisation d’absence pour 3 examens prénataux.

**Une rupture conventionnelle est-elle possible pendant la grossesse ?**
Oui, si vous et votre employeur êtes d’accord.

**Que faire en cas de licenciement abusif ?**
Le licenciement peut être annulé ; il faut saisir le conseil de prud’hommes. Faites-vous accompagner.

**Puis-je demander à changer de poste ?**
Parlez-en au médecin du travail : selon votre activité, un aménagement temporaire peut être proposé.

## Quand demander conseil
Pour une situation précise, contactez Allô Service Public (39 39), l’inspection du travail, les représentants du personnel ou un professionnel du droit. Si le stress au travail pèse sur votre moral, parlez-en à votre sage-femme ou à votre médecin ; en cas de détresse, le **3114** répond jour et nuit. ${URG}

${FIN}`,
  }),
  a({
    slug: 'conge-second-parent-paternite',
    title: 'Le congé du second parent (paternité et accueil de l’enfant)',
    summary: 'Durée, partie obligatoire, délais pour prévenir l’employeur et indemnisation du congé de paternité et d’accueil de l’enfant.',
    category: 'droits-demarches', tags: ['congé paternité', 'second parent', 'coparent', 'travail'],
    sources: [S.spPaternite, S.spAbsences, S.spAllo],
    body_md: `## En bref
- Le second parent a droit à **3 jours de congé de naissance**, puis à un **congé de paternité et d’accueil de l’enfant**.
- Ce congé dure **25 jours calendaires** pour une naissance (32 pour des naissances multiples).
- **4 jours** sont obligatoires et se prennent tout de suite après le congé de naissance ; le reste peut être pris plus tard, dans les 6 mois.
- L’employeur doit être prévenu **au moins un mois avant**.

## Comprendre
Le congé concerne le père de l’enfant, ou la personne qui vit en couple avec la mère (conjoint, partenaire de Pacs, concubin), quel que soit le contrat de travail et sans condition d’ancienneté. Dans un couple de femmes ayant fait une reconnaissance conjointe anticipée, la mère qui n’accouche pas en bénéficie aussi.

Il s’organise ainsi :
- **3 jours de congé de naissance**, obligatoires ;
- puis **4 jours obligatoires** de congé de paternité, pris immédiatement après ;
- puis **21 jours** (ou 28 pour des naissances multiples), qui peuvent être pris en une fois ou en deux périodes d’au moins 5 jours chacune, dans les **6 mois** suivant la naissance.

Pendant ce congé, le contrat de travail est suspendu ; l’Assurance Maladie verse des indemnités journalières sous conditions (durée d’affiliation, activité), dans la limite d’un minimum et d’un maximum journaliers.

## Au quotidien
- **Prévenez l’employeur** au moins un mois avant la date prévue de naissance, puis au moins un mois avant chaque période de congé, en indiquant les dates. S’il est prévenu dans ces délais, il ne peut pas refuser.
- **Bébé en avance ?** Le congé peut commencer plus tôt, en prévenant l’employeur sans délai.
- **Pendant la grossesse**, le second parent peut s’absenter pour assister à 3 examens prénataux.
- **Organisez-vous à deux** : les premières semaines, la présence du second parent aide la récupération après l’accouchement, l’allaitement si vous le choisissez, et la mise en place des nuits.

### Exemple d’organisation
Pour une naissance un mardi : 3 jours de congé de naissance (mercredi, jeudi, vendredi), puis les 4 jours obligatoires à la suite. Les 21 jours restants peuvent par exemple être pris en une fois quand la mère reprend des forces, ou partagés en deux périodes (au retour de maternité puis au moment d’une reprise du travail). L’essentiel est de prévenir l’employeur dans les délais et de choisir ce qui vous aide le plus à deux.

## Questions fréquentes
**Faut-il être marié pour en bénéficier ?**
Non, vivre en couple avec la mère suffit.

**Puis-je fractionner tout le congé ?**
Seuls les 4 premiers jours sont obligatoires à la suite du congé de naissance ; le reste peut être pris en une ou deux fois.

**Que se passe-t-il si le bébé est hospitalisé ?**
Des règles de prolongation existent ; renseignez-vous auprès de votre caisse.

**Je suis fonctionnaire ou indépendant ?**
Les règles sont proches mais les démarches diffèrent : consultez les fiches Service-Public correspondantes.

**Le congé est-il possible si nous ne vivons pas ensemble ?**
Le père de l’enfant peut en bénéficier même s’il ne vit pas avec la mère ; pour les autres situations, la condition est de vivre en couple avec elle.

## Quand demander conseil
Pour vos droits : Allô Service Public (39 39) ou votre caisse d’Assurance Maladie. Après la naissance, si l’un de vous se sent épuisé ou très triste, parlez-en à la sage-femme, au médecin ou à la PMI ; en cas de détresse, le **3114** répond jour et nuit. ${URG}

${FIN}`,
  }),
  a({
    slug: 'prime-a-la-naissance-caf',
    title: 'La prime à la naissance de la Caf',
    summary: 'Qui peut toucher la prime à la naissance, sous quelles conditions et quand elle est versée.',
    category: 'droits-demarches', tags: ['caf', 'paje', 'prime', 'aides'],
    sources: [S.spPrime, S.spDeclaration],
    body_md: `## En bref
- La prime à la naissance fait partie de la **prestation d’accueil du jeune enfant (Paje)**.
- Elle est versée **pendant la grossesse**, sous **conditions de ressources**.
- Il faut avoir passé le premier examen prénatal et **déclaré la grossesse avant la fin du 3e mois**.
- Elle est versée **avant la fin du mois qui suit le 6e mois** de grossesse.

## Comprendre
Cette prime aide à faire face aux dépenses liées à l’arrivée d’un enfant. Elle n’est pas automatique : la Caf (ou la MSA) étudie vos ressources. Les plafonds dépendent de votre situation (couple ou parent isolé, nombre d’enfants à charge, nés ou à naître, un ou deux revenus d’activité dans le couple). Les ressources prises en compte sont celles d’une année antérieure (par exemple, celles de 2024 pour 2026).

Il faut aussi résider en France plus de 9 mois dans l’année civile du versement. En cas de **grossesse multiple**, une prime est versée **par enfant à naître**, sur présentation d’un certificat médical. Si la grossesse s’interrompt à partir du mois qui suit le 5e mois, la prime reste due.

## Au quotidien
- **Déclarez la grossesse dans les délais** : c’est une condition pour la prime.
- **Faites la demande en ligne** sur caf.fr (ou msa.fr) une fois la grossesse déclarée ; la démarche diffère selon que vous êtes déjà allocataire ou non.
- **Simulez vos droits** sur le site de la Caf ou de Service-Public avant de compter dessus dans votre budget.
- **Signalez tout changement** de situation (déménagement, séparation, mariage, naissance) à la Caf.
- D’autres aides existent ensuite (allocation de base, aides à la garde) : un point avec la Caf vers la fin de la grossesse peut être utile.

### Les autres aides à connaître
- **Allocation de base** de la Paje après la naissance, sous conditions de ressources.
- **Aides à la garde** (complément de libre choix du mode de garde) si vous faites garder votre enfant par une assistante maternelle ou une garde à domicile.
- **Prestation partagée d’éducation de l’enfant** si vous réduisez ou arrêtez votre activité pour vous occuper de votre enfant.
Chaque aide a ses conditions : la Caf et Service-Public les détaillent, et un rendez-vous avec un conseiller Caf peut aider à faire le tour de vos droits.

## Questions fréquentes
**Je n’ai jamais eu affaire à la Caf, puis-je quand même la demander ?**
Oui, un formulaire est prévu pour les personnes non allocataires.

**Et si mes revenus dépassent le plafond ?**
La prime n’est pas versée, mais d’autres prestations peuvent être ouvertes selon la situation ; une simulation permet de le vérifier.

**Pour des jumeaux, est-ce une seule prime ?**
Non, une prime par enfant à naître, sur certificat médical.

**Quand l’argent arrive-t-il ?**
Avant la fin du mois qui suit le 6e mois de grossesse.

**Dois-je refaire une demande pour chaque grossesse ?**
Oui, chaque grossesse fait l’objet d’une déclaration et d’une étude des droits.

## Quand demander conseil
Pour votre dossier, contactez votre Caf ou la MSA. Une assistante sociale (à la mairie, à la PMI ou à la maternité) peut aussi vous aider si votre situation financière est difficile. ${URG}

${FIN}`,
  }),
  a({
    slug: 'reconnaissance-anticipee-de-l-enfant',
    title: 'Reconnaître son enfant avant la naissance',
    summary: 'Pour les couples non mariés : où et comment faire une reconnaissance anticipée, et à quoi elle sert.',
    category: 'droits-demarches', tags: ['reconnaissance', 'filiation', 'mairie', 'état civil'],
    sources: [S.spReconnaissance, S.spAllo],
    body_md: `## En bref
- Dans un couple **non marié**, la reconnaissance établit le lien de filiation, notamment avec le père.
- Elle peut être faite **avant la naissance**, dans **n’importe quelle mairie**.
- Il suffit d’une pièce d’identité et d’un justificatif de domicile ; **aucun certificat de grossesse** n’est demandé.
- Pour un couple de femmes, la démarche est la **reconnaissance conjointe anticipée**.

## Comprendre
Pour la mère, la filiation est établie automatiquement dès que son nom figure dans l’acte de naissance. Pour l’autre parent d’un couple non marié, une démarche est nécessaire : la reconnaissance. Elle peut se faire avant la naissance (on parle de reconnaissance anticipée), au moment de la déclaration de naissance, ou plus tard.

La faire avant la naissance présente un avantage pratique : tout est prêt le jour J. L’officier d’état civil rédige immédiatement l’acte, que vous signez ; vous recevez une copie à présenter lors de la déclaration de naissance. L’acte ne mentionne ni le prénom ni le nom de l’enfant à naître.

La reconnaissance est un acte **volontaire et personnel** : elle ne nécessite pas l’accord de l’autre parent. Chaque parent peut la faire séparément ou ensemble. Elle peut aussi se faire chez un notaire (démarche payante), par exemple si vous souhaitez qu’elle reste confidentielle, ou dans une ambassade ou un consulat si vous êtes à l’étranger.

## Au quotidien
- **Renseignez-vous auprès de la mairie** choisie : certaines demandent un rendez-vous.
- **Apportez** l’original d’une pièce d’identité et un justificatif de domicile de moins de 3 mois.
- **Gardez la copie de l’acte** avec les papiers pour la maternité, afin de la présenter lors de la déclaration de naissance.
- **Le nom de famille** de l’enfant se choisit au moment de la déclaration de naissance ; informez-vous en mairie sur les possibilités.

### Le jour de la déclaration de naissance
La naissance doit être déclarée à la mairie du lieu de naissance dans les jours qui suivent ; souvent, la maternité vous indique comment faire. Apportez l’acte de reconnaissance anticipée, vos pièces d’identité et, le cas échéant, la déclaration conjointe de choix de nom. Le livret de famille est remis à la naissance du premier enfant, selon votre situation.

## Questions fréquentes
**Faut-il être deux pour la faire ?**
Non, chaque parent peut reconnaître l’enfant seul ; vous pouvez aussi y aller ensemble.

**Est-ce utile si nous sommes mariés ?**
Dans un couple hétérosexuel marié, la filiation du mari est établie automatiquement : la reconnaissance n’est pas nécessaire.

**Combien ça coûte ?**
La page de Service-Public n’indique pas de frais en mairie ; la voie notariale, elle, est payante.

**Couple de femmes : comment faire ?**
Il faut passer par une reconnaissance conjointe anticipée, devant notaire, dans le cadre d’une assistance médicale à la procréation.

**Peut-on reconnaître l’enfant si la mère ne le souhaite pas ?**
La reconnaissance est un acte personnel qui ne nécessite pas l’autorisation de l’autre parent ; en cas de conflit, rapprochez-vous d’un professionnel du droit.

## Quand demander conseil
Pour une situation particulière (parent étranger, séparation, couple de femmes), renseignez-vous auprès de la mairie, d’un notaire ou d’Allô Service Public (39 39). ${URG}

${FIN}`,
  }),
  a({
    slug: 'pmi-centre-protection-maternelle-infantile',
    title: 'La PMI : un suivi gratuit pendant la grossesse et après',
    summary: 'Les centres de Protection Maternelle et Infantile proposent gratuitement suivi de grossesse, préparation à la naissance et suivi de l’enfant.',
    category: 'suivi-grossesse', tags: ['pmi', 'gratuit', 'sage-femme', 'suivi'],
    sources: [S.santePmi, S.santeEpp],
    body_md: `## En bref
- Les centres de **PMI** sont gérés par les départements, **gratuits** et **ouverts à tous**.
- Ils accueillent les **femmes enceintes**, les parents et les **enfants jusqu’à 6 ans**.
- On peut y faire le **suivi de grossesse**, l’entretien prénatal précoce, la préparation à la naissance, puis le suivi du bébé.
- Selon les départements, une **sage-femme ou une puéricultrice peut venir à domicile**.

## Comprendre
La Protection Maternelle et Infantile est un service public de santé. Pendant la grossesse, vous pouvez y réaliser les sept consultations prénatales prises en charge et obtenir la prescription des examens (prises de sang, analyses d’urine, échographies). L’entretien prénatal précoce, qui permet de parler de vos besoins et de vos attentes, peut aussi s’y dérouler.

Après la naissance, la PMI propose des consultations pour la mère (suivi, contraception) et pour l’enfant jusqu’à 6 ans : vaccinations, poids, taille, développement psychomoteur, dépistages. Elle organise souvent des ateliers (éveil, massage bébé, langue des signes) et des séances de préparation à la naissance et à la parentalité.

Les équipes réunissent sages-femmes, médecins, puéricultrices, auxiliaires de puériculture, infirmières, et parfois psychologues, diététiciens, psychomotriciens ou assistants sociaux.

## Au quotidien
- **Trouvez votre centre** sur le site de votre département ou sur l’annuaire de Service-Public.
- **La PMI n’est pas réservée** à certaines familles : tout le monde peut s’y adresser, même avec un suivi ailleurs.
- **Isolement, précarité, inquiétudes** : la PMI peut vous orienter vers des aides concrètes et un accompagnement à domicile.
- **Après la naissance**, c’est un lieu simple pour peser bébé, poser vos questions sur l’allaitement, le biberon ou le sommeil.

### Ce que vous pouvez y demander pendant la grossesse
- Une consultation prénatale ou l’entretien prénatal précoce.
- Des conseils pratiques : alimentation, sommeil, préparation du retour à la maison.
- Une orientation vers une assistante sociale pour les démarches et les aides.
- Une préparation à la naissance et à la parentalité, en groupe ou individuelle.
- Un accompagnement si vous vous sentez seule, débordée ou inquiète.

## Questions fréquentes
**Faut-il payer quelque chose ?**
Non, les consultations en PMI sont gratuites.

**Puis-je être suivie à la fois par la PMI et par une maternité ?**
Oui, il suffit que les professionnels communiquent entre eux ; gardez vos comptes rendus.

**La PMI peut-elle venir chez moi ?**
Selon les départements, un suivi à domicile peut être proposé, en particulier après la sortie de maternité.

**Jusqu’à quel âge suit-elle les enfants ?**
Jusqu’à 6 ans.

**La PMI s’occupe-t-elle aussi des vaccins du bébé ?**
Oui, les vaccinations de l’enfant peuvent être faites en PMI, gratuitement.

## Quand demander conseil
N’hésitez pas à appeler la PMI pour toute question sur votre grossesse ou votre bébé. Pour un signe inquiétant (saignements, douleurs fortes, fièvre, bébé qui bouge moins), contactez sans attendre la maternité. En cas de détresse psychologique, le **3114** répond jour et nuit. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ suivi médical
  a({
    slug: 'entretien-prenatal-precoce',
    title: 'L’entretien prénatal précoce : un temps pour vous',
    summary: 'Obligatoire et pris en charge à 100 %, cet entretien permet de parler de vos besoins, de vos questions et de votre projet de naissance.',
    category: 'suivi-grossesse', tags: ['entretien prénatal', 'epp', '1000 premiers jours', 'projet de naissance'], max_week: 30,
    sources: [S.santeEpp, S.ameliPreparation, S.infoViolences],
    body_md: `## En bref
- L’**entretien prénatal précoce** (EPP) est **obligatoire** depuis 2020 et **pris en charge à 100 %**.
- Il a lieu une fois la grossesse déclarée, idéalement **tôt** (conseillé dès le 4e mois).
- Ce n’est **pas un examen médical** : c’est un temps d’échange, seule ou en couple.
- Il permet d’exprimer vos attentes, vos inquiétudes et de construire votre accompagnement.

## Comprendre
L’entretien prénatal précoce est la première étape du parcours des « 1000 premiers jours ». Vous le réalisez avec une sage-femme ou un médecin, en libéral, en PMI ou à la maternité. Il dure généralement plus longtemps qu’une consultation et ne comprend aucun examen physique.

Pour vous, c’est l’occasion de comprendre les étapes de la grossesse, de poser toutes vos questions (même celles qui paraissent petites), de dire ce que vous souhaitez pour l’accouchement et le retour à la maison, et de créer un lien de confiance avec les professionnels. Pour eux, c’est un moyen de comprendre votre situation, de repérer ce qui pourrait vous fragiliser (isolement, stress, difficultés matérielles, antécédents) et de vous orienter vers les bonnes ressources : psychologue, assistante sociale, consultation d’aide à l’arrêt du tabac, association…

## Au quotidien
- **Préparez-le** : notez vos questions au fil des jours (alimentation, travail, peurs, couple, allaitement, sommeil, budget).
- **Venez en couple** si vous le souhaitez : le second parent a aussi sa place.
- **Parlez de votre vécu** : grossesses précédentes, émotions, soutien autour de vous. Rien n’est jugé.
- **Pensez à l’après** : qui sera là au retour de maternité ? Qui pourra vous relayer la nuit ?
- Vous pouvez reparler de votre **projet de naissance** au fil des consultations : il peut évoluer.

### Exemples de questions à aborder
- Comment je vis cette grossesse, ce qui me réjouit, ce qui m’inquiète.
- Mon travail, mes trajets, mon logement, mes moyens.
- Mes habitudes : tabac, alcool, médicaments, sommeil, alimentation.
- L’accouchement que j’imagine, et ce que je redoute.
- Allaitement ou biberon, retour à la maison, aide disponible.
- Les ressources près de chez moi : PMI, associations, groupes de parents.

## Questions fréquentes
**Est-ce obligatoire ?**
Oui, il fait partie du suivi de grossesse, mais il reste un temps d’échange adapté à vous.

**Avec qui le faire ?**
Avec une sage-femme ou un médecin, en cabinet, en PMI ou à la maternité.

**Dois-je venir avec mon partenaire ?**
C’est possible et souvent apprécié, mais pas obligatoire.

**Et si je n’ai pas de questions particulières ?**
L’entretien reste utile : il permet de faire le point sur votre santé, votre organisation et les ressources disponibles près de chez vous.

**Puis-je en faire un second si ma situation change ?**
Parlez-en à votre sage-femme : le suivi peut être complété par d’autres temps d’échange et d’accompagnement.

## Quand demander conseil
Si vous vous sentez très anxieuse, triste, épuisée ou en insécurité chez vous, dites-le lors de l’entretien ou à tout moment à votre sage-femme ou à votre médecin. En cas de détresse ou d’idées noires, appelez le **3114** (jour et nuit). En cas de violences, le **3919** est gratuit et anonyme. ${URG}

${FIN}`,
  }),
  a({
    slug: 'premiere-consultation-et-bilan-sanguin',
    title: 'La première consultation et les premières prises de sang',
    summary: 'Ce qui se passe au premier rendez-vous de grossesse et ce que recherchent les analyses du début.',
    category: 'suivi-grossesse', tags: ['première consultation', 'prise de sang', 'groupe sanguin', 'sérologies'], max_week: 16,
    sources: [S.ameliProgramme, S.ameliInfectionsRecherche, S.santeCalendrier],
    body_md: `## En bref
- La première consultation a lieu **avant la fin du 3e mois**, avec un médecin ou une sage-femme.
- Elle comprend un examen, une **prescription de vitamine B9**, un **bilan sanguin** et l’organisation de l’échographie de datation.
- Les prises de sang recherchent notamment le **groupe sanguin et le rhésus**, l’immunité contre la **rubéole** et la **toxoplasmose**, la **syphilis**, l’**hépatite B**, et proposent le dépistage du **VIH**.
- C’est aussi le moment de **déclarer la grossesse**.

## Comprendre
Ce premier rendez-vous pose les bases du suivi. Le professionnel vous interroge sur vos antécédents (santé, grossesses précédentes, traitements, mode de vie), mesure votre poids et votre tension, et peut réaliser un frottis si besoin. Il prescrit des folates (vitamine B9) jusqu’à 12 semaines de grossesse, une bandelette urinaire et une prise de sang.

**Pourquoi ces analyses ?**
- Le **groupe sanguin et le rhésus** servent à anticiper une éventuelle incompatibilité avec le bébé et à préparer l’accouchement.
- La **rubéole** et la **toxoplasmose** : si vous n’êtes pas immunisée, des précautions et des contrôles sont prévus.
- La **syphilis**, l’**hépatite B** et le **VIH** : un dépistage permet, si besoin, de protéger le bébé.
- La **numération** recherche une anémie.
Un prélèvement vaginal peut aussi rechercher certaines infections (chlamydia, gonocoque), et d’autres tests peuvent être proposés selon votre situation.

L’échographie de datation se fait entre **11 et 13 semaines d’aménorrhée** ; c’est aussi à ce moment que le **dépistage de la trisomie 21** vous est proposé.

## Au quotidien
- **Apportez** votre carte Vitale, votre carte de groupe sanguin si vous en avez une, vos traitements et comptes rendus médicaux.
- **Notez vos questions** à l’avance : nausées, travail, sport, alimentation, médicaments.
- **Signalez tout traitement** en cours : ne l’arrêtez pas sans avis médical.
- **Gardez les résultats** dans un même dossier : ils vous seront demandés à la maternité.

### À la fin du rendez-vous, vous repartez généralement avec
- une ordonnance de prises de sang et d’analyse d’urine ;
- une prescription de vitamine B9 ;
- une ordonnance pour l’échographie de datation (11–13 SA) ;
- les informations pour le dépistage de la trisomie 21 ;
- la déclaration de grossesse faite ou à envoyer ;
- des conseils d’hygiène alimentaire selon vos résultats (toxoplasmose, listériose).

## Questions fréquentes
**Puis-je choisir entre un médecin et une sage-femme ?**
Oui, les deux peuvent suivre une grossesse sans complication.

**Pourquoi refaire une prise de sang plus tard ?**
Certaines analyses sont répétées : contrôles de toxoplasmose si vous n’êtes pas immunisée, recherche d’anticorps (RAI) si vous êtes rhésus négatif, numération vers le 6e mois.

**Le dépistage du VIH est-il obligatoire ?**
Il est proposé ; vous pouvez en parler librement avec le professionnel.

**Et si je ne suis pas immunisée contre la rubéole ?**
Un contrôle est prévu au cours de la grossesse, et la vaccination pourra être proposée après l’accouchement.

**Les nausées ou la fatigue sont-elles abordées ?**
Oui, n’hésitez pas à en parler : des conseils, et si besoin un traitement, peuvent vous aider.

## Quand demander conseil
Consultez sans attendre en cas de saignements, de douleurs importantes dans le bas du ventre, de fièvre ou de malaise. ${URG}

${FIN}`,
  }),
  a({
    slug: 'consultations-mensuelles-du-4e-au-9e-mois',
    title: 'Les consultations mensuelles, du 4e au 9e mois',
    summary: 'Ce que vérifie chaque consultation mensuelle, les échographies du 2e et du 3e trimestre et les analyses répétées.',
    category: 'suivi-grossesse', tags: ['consultation', 'tension', 'hauteur utérine', 'échographie'], min_week: 15,
    sources: [S.ameliMensuel, S.sante8eMois],
    body_md: `## En bref
- À partir du 4e mois, une **consultation par mois**, avec un médecin ou une sage-femme.
- À chaque fois : **poids, tension, hauteur de l’utérus, cœur du bébé, bandelette urinaire**.
- Deux échographies : **morphologique** (20 à 24 SA) et **du 3e trimestre** (30 à 35 SA).
- Une **consultation d’anesthésie** au 8e mois, obligatoire même sans projet de péridurale.

## Comprendre
Chaque consultation mensuelle suit le même fil : on vous demande comment vous allez, on vérifie votre tension (une tension élevée peut être un signe d’alerte), votre poids, la hauteur de l’utérus (qui reflète la croissance du bébé), on écoute le cœur du bébé et on contrôle les urines (recherche de sucre, d’albumine et d’infection).

**Les analyses répétées :**
- vers le 5e–6e mois, une **numération** recherche une anémie ;
- si vous n’êtes pas immunisée contre la **toxoplasmose**, une sérologie est faite **chaque mois** ;
- si vous n’êtes pas immunisée contre la **rubéole**, un contrôle est prévu vers 20 SA ;
- si vous êtes **rhésus négatif**, une recherche d’agglutinines irrégulières (RAI) est faite aux 6e et 8e mois.

**Les échographies :** la morphologique vérifie l’anatomie du bébé, sa croissance, le liquide amniotique et la position du placenta ; celle du 3e trimestre contrôle la croissance, la position du bébé et du placenta.

**Le 8e mois** est un rendez-vous important : il prépare l’accouchement (position du bébé, prélèvement vaginal pour le streptocoque B, consultation d’anesthésie). La 7e et dernière consultation a lieu au 9e mois.

## Au quotidien
- **Notez entre deux rendez-vous** ce qui vous interroge : douleurs, contractions, sommeil, moral.
- **Mesurez votre tension** seulement si on vous l’a demandé ; sinon, laissez le suivi au professionnel.
- **Préparez la consultation d’anesthésie** : liste de vos traitements, allergies et antécédents.
- **Pensez aux vaccins** recommandés pendant la grossesse (coqueluche, grippe, VRS selon la saison) : demandez où vous en êtes.

### Les signes de pré-éclampsie à connaître
Une tension élevée peut s’accompagner de maux de tête intenses, de troubles de la vue (mouches, éclairs), de douleurs en haut du ventre, d’un gonflement brutal du visage ou des mains. Ces signes justifient de consulter le jour même, même entre deux rendez-vous.

## Questions fréquentes
**La consultation d’anesthésie m’engage-t-elle à avoir une péridurale ?**
Non. Elle est obligatoire pour la sécurité de toutes les femmes, quel que soit le projet.

**Le toucher vaginal est-il systématique ?**
Non, il n’est pas réalisé à chaque consultation.

**Pourquoi me pèse-t-on à chaque fois ?**
Le poids fait partie des repères de suivi ; il est interprété avec vous, sans jugement.

**Et si une échographie montre quelque chose d’inhabituel ?**
Des examens complémentaires peuvent être proposés ; l’équipe vous explique chaque étape.

**Puis-je venir accompagnée aux consultations ?**
Oui, et la personne qui vit avec vous peut s’absenter de son travail pour 3 examens prénataux.

## Quand demander conseil
N’attendez pas la consultation suivante si vous avez : maux de tête intenses, troubles de la vue, gonflement brutal du visage ou des mains, saignements, perte de liquide, contractions régulières avant 37 SA, fièvre, ou si le bébé bouge moins. Appelez la maternité. ${URG}

${FIN}`,
  }),
  a({
    slug: 'depistage-trisomie-21',
    title: 'Le dépistage de la trisomie 21 : comment ça marche',
    summary: 'Dépistage combiné, test ADN, caryotype : les étapes du dépistage prénatal, proposé à toutes et jamais obligatoire.',
    category: 'suivi-grossesse', tags: ['trisomie 21', 'dépistage', 'clarté nucale', 'adn libre'], max_week: 22,
    sources: [S.hasT21, S.ameliProgramme],
    body_md: `## En bref
- Le dépistage de la trisomie 21 est **proposé à toutes les femmes enceintes** ; il n’est **pas obligatoire**.
- Il commence par le **dépistage combiné du 1er trimestre** : échographie (clarté nucale), prise de sang et âge maternel.
- Selon le **niveau de risque** calculé, un **test ADN** sur prise de sang ou un **caryotype** peut être proposé.
- Seul le **caryotype fœtal** (amniocentèse ou choriocentèse) permet un **diagnostic**.

## Comprendre
Un dépistage ne pose pas de diagnostic : il estime une probabilité. C’est pourquoi on parle de « risque », exprimé sous forme de fraction (par exemple 1/1000).

**Étape 1 — le dépistage combiné.** Lors de l’échographie de datation, entre 11 et 13 SA, on mesure la clarté nucale. Une prise de sang dose des marqueurs sériques. Ces résultats, associés à votre âge, permettent de calculer un risque. Si l’échographie du 1er trimestre n’a pas pu être faite dans les délais, les marqueurs sériques seuls peuvent être utilisés au 2e trimestre.

**Étape 2 — selon le résultat**, d’après les recommandations de la HAS :
- risque **inférieur à 1/1000** : le dépistage s’arrête en général là ;
- risque **entre 1/1000 et 1/51** : un **test ADN libre circulant** (prise de sang chez la mère) est proposé ;
- risque **égal ou supérieur à 1/50** : un **caryotype fœtal** est proposé d’emblée ; vous pouvez choisir de faire d’abord le test ADN.

**Étape 3 — le diagnostic.** Le caryotype nécessite un prélèvement (amniocentèse ou choriocentèse). C’est le seul examen qui confirme ou écarte la trisomie 21. L’équipe vous en explique les modalités et les risques avant toute décision.

## Au quotidien
- **Prenez le temps de décider** : vous pouvez accepter ou refuser chaque étape, et demander toutes les explications nécessaires.
- **Faites l’échographie dans la bonne fenêtre** (11–13 SA) : elle conditionne le dépistage combiné.
- **Venez accompagnée** au rendez-vous de résultats si vous le souhaitez.
- **Un résultat « à risque » n’est pas un diagnostic** : il ouvre seulement la possibilité d’examens complémentaires.

### Ce que le dépistage ne dit pas
Le dépistage de la trisomie 21 ne recherche pas toutes les particularités possibles. L’échographie morphologique du 2e trimestre vérifie ensuite l’anatomie du bébé. Si vous avez des antécédents familiaux particuliers, parlez-en dès le début : un conseil génétique peut être proposé.

## Questions fréquentes
**Le dépistage est-il obligatoire ?**
Non. La HAS insiste sur le libre choix éclairé des femmes enceintes.

**Le test ADN remplace-t-il l’amniocentèse ?**
Non. Il affine le dépistage, mais seul le caryotype pose un diagnostic.

**Que signifie un risque de 1/300 ?**
Qu’environ une grossesse sur 300 présentant ce résultat serait concernée : c’est une probabilité, pas une certitude.

**Puis-je en parler avec quelqu’un avant de décider ?**
Oui : sage-femme, médecin, et dans certains cas un centre pluridisciplinaire de diagnostic prénatal.

**Le test ADN est-il remboursé ?**
Il est pris en charge lorsqu’il est prescrit dans les indications prévues ; renseignez-vous auprès de votre professionnel.

## Quand demander conseil
Si l’attente d’un résultat ou une annonce vous bouleverse, parlez-en à votre équipe : un soutien psychologique peut vous être proposé. En cas de détresse, le **3114** répond jour et nuit. ${URG}

${FIN}`,
  }),
  a({
    slug: 'consultation-du-8e-mois-et-anesthesie',
    title: 'Le 8e mois : préparer l’accouchement avec l’équipe',
    summary: 'Position du bébé, streptocoque B, consultation d’anesthésie, voie d’accouchement : ce qui se décide au 8e mois.',
    category: 'suivi-grossesse', tags: ['8e mois', 'anesthésie', 'siège', 'streptocoque b'], min_week: 32, max_week: 37,
    sources: [S.sante8eMois, S.ameliMensuel],
    body_md: `## En bref
- La consultation du 8e mois a lieu entre **33 et 36 SA** environ.
- On vérifie la **tension**, la **hauteur utérine**, la **position du bébé** et on fait un **prélèvement vaginal** (streptocoque B).
- La **consultation d’anesthésie** est **obligatoire**, même si vous ne souhaitez pas de péridurale.
- Si le bébé est **en siège**, une **version par manœuvre externe** peut être proposée vers 36–37 SA.

## Comprendre
À ce stade, l’objectif est de préparer les conditions de l’accouchement. L’examen recherche des signes d’hypertension, mesure la hauteur utérine, suit votre poids et vos éventuelles contractions. Des analyses complètent le bilan : sérologie de la toxoplasmose si vous n’êtes pas immunisée, recherche d’un manque de fer, bandelette urinaire.

**Le streptocoque B** est une bactérie que certaines femmes portent sans symptôme. S’il est retrouvé au prélèvement, un antibiotique vous sera donné pendant le travail pour protéger le bébé.

**La position du bébé.** Le plus souvent, le bébé a la tête en bas. S’il est en siège, l’équipe en recherche d’abord la cause, puis peut proposer des méthodes douces et une **version par manœuvre externe** (le médecin aide le bébé à se retourner en appuyant sur le ventre) ; elle réussit environ une fois sur deux. Selon la situation, un accouchement par voie basse ou une césarienne programmée (souvent vers 39 SA) sera discuté.

**La consultation d’anesthésie** fait le point sur vos antécédents, allergies et éventuelles contre-indications. Elle n’engage à rien : vous pourrez décider le jour J.

## Au quotidien
- **Apportez** vos derniers résultats, vos traitements, et la liste de vos allergies.
- **Posez vos questions** sur la péridurale et les autres moyens de soulager la douleur.
- **Préparez votre valise** et les papiers pour la maternité.
- **Organisez le trajet** vers la maternité et le relais pour les aînés ou les animaux.

### Les papiers à préparer pour la maternité
- Carte Vitale et attestation de mutuelle.
- Dossier de grossesse, résultats d’analyses et d’échographies.
- Carte de groupe sanguin.
- Résultat du prélèvement du streptocoque B.
- Acte de reconnaissance anticipée si vous en avez fait un.
- Pièce d’identité et, le cas échéant, livret de famille.

## Questions fréquentes
**Si mon bébé est en siège, aurai-je forcément une césarienne ?**
Non. Selon la situation, une voie basse peut être envisagée ; l’équipe en discute avec vous.

**La version est-elle douloureuse ?**
Elle peut être inconfortable ; elle se fait sous surveillance, et vous pouvez toujours la refuser.

**Dois-je arrêter de travailler au 8e mois ?**
Le congé prénatal commence en général 6 semaines avant le terme pour un 1er ou 2e enfant ; un arrêt supplémentaire n’est possible que sur prescription médicale.

**Le toucher vaginal est-il obligatoire ?**
Il n’est pas systématique.

**Puis-je visiter la salle de naissance ?**
Certaines maternités organisent des visites ou des réunions d’information : renseignez-vous.

## Quand demander conseil
Appelez la maternité en cas de perte de liquide, de saignements, de contractions régulières avant 37 SA, de maux de tête intenses avec troubles de la vue, de fièvre, ou si le bébé bouge moins. ${URG}

${FIN}`,
  }),
  a({
    slug: 'semaines-d-amenorrhee-et-calendrier',
    title: 'Semaines d’aménorrhée, semaines de grossesse : bien compter',
    summary: 'Pourquoi on parle en « SA », comment se calcule le terme et quelles sont les grandes étapes, mois par mois.',
    category: 'grossesse', tags: ['calendrier', 'sa', 'terme', 'mois par mois'],
    sources: [S.santeCalendrier, S.ameliProgramme],
    body_md: `## En bref
- Les professionnels comptent en **semaines d’aménorrhée (SA)**, à partir du **1er jour des dernières règles**.
- La **fécondation** a lieu environ **2 semaines plus tard** : on ajoute donc 2 semaines aux « semaines de grossesse ».
- Le **terme** se situe autour de **41 SA** ; l’accouchement a lieu le plus souvent entre 37 et 42 SA.
- L’**échographie de datation** (11–13 SA) précise la date.

## Comprendre
Parce que le jour exact de la fécondation est rarement connu, la médecine utilise une date repère : le premier jour des dernières règles. Une grossesse dure ainsi environ 41 SA, soit à peu près 39 semaines après la fécondation, ou neuf mois. Vous entendrez donc « 24 SA » pour une grossesse de 22 semaines. L’échographie du premier trimestre mesure l’embryon et permet de corriger la date si besoin, notamment quand les cycles sont irréguliers.

**Quelques repères :**
- **vers 7 SA**, le cœur commence à battre ;
- **vers 13 SA**, on parle de fœtus (et non plus d’embryon) ;
- **entre 11 et 13 SA**, échographie de datation et proposition de dépistage de la trisomie 21 ;
- **à partir du 4e mois**, consultations mensuelles ;
- **vers 20–24 SA**, échographie morphologique ;
- **vers 30–35 SA**, échographie du 3e trimestre ;
- **vers 34 SA**, début du congé prénatal pour un 1er ou 2e enfant ;
- **autour de 41 SA**, terme : le bébé mesure souvent autour de 50 cm et pèse environ 3,2 à 3,5 kg, avec de grandes différences d’un bébé à l’autre.

## Au quotidien
- **Notez la date de vos dernières règles** dès que vous pensez être enceinte.
- **Retenez la date de terme** donnée après l’échographie : c’est elle qui compte pour vos droits et votre suivi.
- **Côté démarches** : déclaration avant 14 semaines, inscription à la maternité tôt, préparation à la naissance vers le 5e–6e mois, valise au 3e trimestre.
- **Utilisez le calendrier de l’application** pour suivre vos rendez-vous, sans vous comparer à d’autres grossesses.

### Trimestre par trimestre
- **1er trimestre** (jusqu’à 14 SA environ) : fatigue, nausées, seins sensibles, envies fréquentes d’uriner ; déclaration de grossesse et échographie de datation.
- **2e trimestre** (jusqu’à 28 SA environ) : souvent une période plus confortable ; premiers mouvements du bébé, échographie morphologique, préparation à la naissance.
- **3e trimestre** : ventre plus lourd, essoufflement, sommeil plus difficile, jambes lourdes, remontées acides ; 3e échographie, consultation d’anesthésie, congé prénatal.

## Questions fréquentes
**Pourquoi mon terme a-t-il changé après l’échographie ?**
La mesure de l’embryon est plus précise que la date des règles, surtout si vos cycles sont irréguliers.

**Neuf mois, c’est combien de SA ?**
Environ 41 SA, soit 39 semaines après la fécondation.

**Le bébé peut-il naître avant le terme sans problème ?**
Un bébé né à partir de 37 SA est considéré à terme ; avant, on parle de prématurité, avec des niveaux différents selon l’âge.

**Comment savoir à quel mois je suis ?**
Votre sage-femme ou votre médecin peut vous l’indiquer, et l’application affiche la correspondance SA / mois.

**Pourquoi les applis et la maternité ne donnent-elles pas la même semaine ?**
Certaines comptent en semaines de grossesse, d’autres en SA : vérifiez l’unité utilisée.

## Quand demander conseil
En cas de doute sur votre date de grossesse, de saignements ou de douleurs, contactez votre sage-femme ou votre médecin. ${URG}

${FIN}`,
  }),
  a({
    slug: 'mouvements-du-bebe-pendant-la-grossesse',
    title: 'Les mouvements du bébé : ce qu’on ressent, quand s’inquiéter',
    summary: 'Quand on commence à sentir le bébé bouger, comment ses mouvements évoluent et pourquoi une diminution doit faire appeler la maternité.',
    category: 'grossesse', tags: ['mouvements', 'bébé bouge', 'fin de grossesse'], min_week: 16, safety_critical: true,
    sources: [S.sante6eMois, S.sante7eMois, S.sante9eMois],
    body_md: `## En bref
- Les mouvements sont d’abord **légers** (comme des bulles), puis deviennent nets au fil du 2e trimestre.
- Au **6e mois**, le bébé est très actif ; le **7e mois** est souvent celui où on le sent **le plus**.
- En fin de grossesse, il a **moins de place** : les mouvements changent d’amplitude, mais il continue de bouger.
- **Un bébé qui bouge moins que d’habitude** est une raison d’**appeler la maternité sans attendre**.

## Comprendre
Le bébé bouge bien avant que vous le sentiez. Les premières sensations sont souvent décrites comme des effleurements ou des bulles ; elles arrivent plus tôt quand on a déjà été enceinte. Au 6e mois, il peut faire beaucoup de mouvements par demi-heure, tout en dormant une grande partie de la journée, sans suivre votre rythme. Au 7e mois, ses mouvements sont généralement perçus au maximum ; il réagit aussi aux bruits (sursauts, accélération du cœur).

Au 9e mois, il prend beaucoup de poids et de place dans l’utérus : ses mouvements deviennent moins amples (plutôt des poussées, des étirements) et il peut avoir de longues phases de sommeil. Ce qui compte, c’est que **son activité reste présente** et que vous reconnaissiez **son rythme habituel**.

## Au quotidien
- **Apprenez son rythme** : beaucoup de bébés sont plus actifs le soir, quand vous êtes au repos.
- **Si vous avez un doute**, allongez-vous sur le côté au calme, une main sur le ventre, et soyez attentive pendant un moment.
- **Ne comptez pas sur une appli ou un appareil** pour vous rassurer : votre ressenti et l’avis de la maternité priment.
- **Notez ce qui change** pour pouvoir le décrire précisément si vous appelez.

### Ce qui peut changer vos sensations
- La **position du placenta** à l’avant de l’utérus peut amortir les mouvements.
- Votre **activité** : quand vous bougez beaucoup, vous sentez moins le bébé.
- Le **sommeil du bébé** : il alterne de longues phases de repos et d’activité.
- Le **moment de la journée** : beaucoup de femmes le sentent davantage le soir, au calme.
Malgré ces variations, une baisse nette de ses mouvements par rapport à d’habitude reste un signal pour appeler la maternité.

## Questions fréquentes
**Je ne sens encore rien au 5e mois, est-ce inquiétant ?**
Les premières sensations varient beaucoup selon les femmes, la position du placenta et la grossesse ; parlez-en à votre prochain rendez-vous, ou plus tôt si cela vous préoccupe.

**Le bébé a le hoquet, c’est quoi ces petits coups réguliers ?**
De petits mouvements rythmés sont souvent décrits par les femmes enceintes ; parlez-en si vous avez une question.

**Il bouge moins à la fin : est-ce parce qu’il a moins de place ?**
Ses mouvements changent de forme, mais il doit continuer à bouger. Une diminution nette de son activité doit faire appeler la maternité.

**Puis-je appeler la maternité « pour rien » ?**
Oui. Les équipes préfèrent vous voir pour vérifier plutôt que vous laisser attendre avec une inquiétude.

**Faut-il manger du sucre pour le faire bouger ?**
Ne vous fiez pas à ce type d’astuce : en cas de doute sur ses mouvements, appelez la maternité.

## Quand demander conseil
Appelez la maternité **le jour même**, à toute heure, si le bébé bouge **moins que d’habitude** ou si vous ne le sentez **plus bouger**, ainsi qu’en cas de perte de liquide, de saignements ou de douleurs inhabituelles. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ alimentation, alcool, tabac
  a({
    slug: 'prise-de-poids-pendant-la-grossesse',
    title: 'La prise de poids pendant la grossesse',
    summary: 'Combien prend-on en moyenne, pourquoi les régimes sont déconseillés et comment manger et bouger sans se mettre la pression.',
    category: 'alimentation-grossesse', tags: ['poids', 'fringales', 'alimentation', 'activité'],
    sources: [S.santePoids, S.ameliSurpoids, S.santeAlimentation],
    body_md: `## En bref
- En moyenne, la prise de poids totale est d’**environ 13 kg**, avec de **grandes différences** d’une femme à l’autre.
- Elle est **plus importante en fin de grossesse**.
- Les **régimes amaigrissants sont contre-indiqués** pendant la grossesse.
- Se peser **une à deux fois par mois** suffit le plus souvent ; le suivi se fait avec votre sage-femme ou votre médecin.

## Comprendre
Le poids pris pendant la grossesse ne correspond pas qu’au bébé : il y a aussi le placenta, le liquide amniotique, l’augmentation du volume de sang, l’utérus, les seins et des réserves utiles pour l’allaitement. C’est pourquoi une prise de poids est attendue et nécessaire.

L’objectif n’est pas un chiffre à atteindre mais une évolution régulière, adaptée à votre corpulence de départ. Si vous étiez en surpoids ou en situation d’obésité, un objectif personnalisé est fixé avec vous dès le début de la grossesse, avec des conseils adaptés ; un dépistage du diabète gestationnel peut être proposé. Une prise de poids très rapide, ou au contraire une perte de poids, mérite d’en parler.

## Au quotidien
- **Mangez varié et équilibré** : fruits, légumes et légumineuses plus souvent ; boissons sucrées, aliments gras et produits ultra-transformés moins souvent.
- **Trois repas par jour**, sans en sauter ; à partir du 2e trimestre, une collation équilibrée l’après-midi peut aider.
- **Fringales** : misez sur les fibres aux repas, un fruit entier plutôt qu’un jus, et de l’eau à volonté.
- **Bougez** selon votre forme : marche, natation, gymnastique douce, yoga prénatal, sauf contre-indication ; limitez les longues périodes assises.
- **Pesez-vous sans excès** : une à deux fois par mois, toujours dans les mêmes conditions.

### Activité physique : des repères
Sauf contre-indication, une activité régulière est recommandée pendant toute la grossesse. En cas de surpoids, l’Assurance Maladie indique par exemple 30 à 60 minutes, 3 à 5 jours par semaine, à une intensité qui permet de tenir une conversation. Les sports à risque de chute ou de choc (sports collectifs, équitation, ski, arts martiaux) et la plongée sous-marine sont à éviter.

## Questions fréquentes
**Faut-il manger pour deux ?**
Non. Les besoins augmentent surtout en fin de grossesse, et de façon modérée ; c’est la qualité de l’alimentation qui compte.

**Je prends du poids trop vite, que faire ?**
Parlez-en à votre sage-femme ou votre médecin : il examinera la situation avec vous (alimentation, activité, tension, glycémie) sans jugement.

**Puis-je faire un régime si j’étais déjà en surpoids ?**
Non, pas de régime amaigrissant ; un accompagnement diététique peut être proposé pour limiter la prise de poids.

**Et si je n’arrive pas à manger à cause des nausées ?**
Mangez de petites quantités fréquentes ; si vous perdez du poids ou ne gardez rien, consultez.

**Vais-je perdre ce poids après l’accouchement ?**
Une partie est perdue à la naissance, le reste progressivement ; c’est un sujet à aborder sans pression lors du suivi postnatal.

## Quand demander conseil
Consultez si vous perdez du poids, si vous vomissez au point de ne rien garder, si votre poids augmente brutalement avec un gonflement du visage ou des mains, ou si votre rapport à la nourriture devient une source de souffrance. ${URG}

${FIN}`,
  }),
  a({
    slug: 'bien-manger-enceinte-fer-calcium-vitamines',
    title: 'Bien manger enceinte : fer, calcium, vitamines et iode',
    summary: 'Les nutriments importants pendant la grossesse, où les trouver et pourquoi éviter les compléments non prescrits.',
    category: 'alimentation-grossesse', tags: ['fer', 'calcium', 'vitamine d', 'b9', 'iode', 'oméga-3'],
    sources: [S.santeAlimentation, S.ameliProgramme],
    body_md: `## En bref
- Une **alimentation variée** couvre la plupart des besoins ; les compléments ne sont **pas systématiques**.
- La **vitamine B9** est prescrite dès le projet de grossesse et jusqu’à 12 semaines.
- La **vitamine D** est souvent prescrite au 3e trimestre.
- **Poisson deux fois par semaine**, dont un poisson gras, pour les oméga-3.

## Comprendre
Pendant la grossesse, certains nutriments deviennent particulièrement importants pour vous et pour le développement du bébé :
- **Fer** : viande (surtout rouge), abats, légumineuses, œufs, pain complet, cacao. Il est mieux absorbé avec de la vitamine C (fruits, légumes crus) et moins bien si l’on boit du thé ou du café au cours du repas.
- **Calcium** : produits laitiers, chou vert, oranges, certaines eaux minérales. Avec une consommation laitière suffisante, aucun complément n’est nécessaire.
- **Vitamine D** : poissons gras, œufs, beurre ; les apports alimentaires étant souvent insuffisants, une supplémentation est recommandée au 3e trimestre, sur prescription.
- **Iode** : produits de la mer, œufs, produits laitiers ; un complément peut être envisagé selon votre situation, sur avis médical.
- **Vitamine B9 (folates)** : légumes verts, légumineuses, œufs, fruits secs ; une supplémentation est idéalement commencée environ trois mois avant la conception et poursuivie jusqu’à la fin du 1er trimestre.
- **Oméga-3 (DHA)** : poissons gras comme le maquereau, la sardine ou le saumon.

Les compléments « spécial grossesse » vendus librement sont déconseillés : ils sont souvent inutiles et exposent à des surdosages.

## Au quotidien
- **Repères quotidiens** : 5 portions de fruits et légumes, un féculent à chaque repas, 3 produits laitiers, des protéines 1 à 2 fois par jour.
- **Buvez de l’eau** à volonté, ou des tisanes.
- **Poisson** : deux fois par semaine, un gras et un maigre, en évitant les grands prédateurs (voir l’article sur le poisson).
- **Végétarienne ou végétalienne ?** Parlez-en tôt : un bilan et des compléments adaptés peuvent être nécessaires.
- **Soja** : limitez-le à un produit par jour au maximum.

### Exemple de journée équilibrée
- **Matin** : pain complet, produit laitier, fruit.
- **Midi** : crudités bien lavées, viande ou poisson bien cuit, légumes, féculent, fromage à pâte pressée cuite.
- **Goûter** : fruit et yaourt.
- **Soir** : soupe ou légumes, œufs bien cuits ou légumineuses, féculent, fruit cuit.

## Questions fréquentes
**Dois-je prendre du fer systématiquement ?**
Non. Une prise de sang vers le 6e mois recherche une anémie ; un traitement est prescrit seulement si besoin.

**Puis-je prendre des compléments que j’avais avant la grossesse ?**
Demandez avant à votre médecin, sage-femme ou pharmacien.

**Le café empêche-t-il l’absorption du fer ?**
Il la freine ; évitez-le pendant les repas.

**Faut-il boire plus ?**
Boire régulièrement dans la journée aide aussi en cas de constipation ; l’eau reste la boisson de référence.

**Le sel iodé est-il utile ?**
Utiliser du sel iodé, sans en abuser, contribue aux apports en iode ; demandez conseil à votre professionnel.

## Quand demander conseil
Consultez si vous êtes très fatiguée, essoufflée, pâle, si vous avez des vertiges, ou si votre alimentation est très restreinte (régime particulier, nausées importantes, troubles alimentaires). ${URG}

${FIN}`,
  }),
  a({
    slug: 'listeriose-aliments-a-eviter-enceinte',
    title: 'Listériose : les aliments à éviter et les bons gestes',
    summary: 'La listériose est rare mais grave pendant la grossesse : la liste des aliments à éviter et les règles de conservation au réfrigérateur.',
    category: 'alimentation-grossesse', tags: ['listériose', 'fromage', 'charcuterie', 'hygiène alimentaire'], safety_critical: true,
    sources: [S.santeListeriose, S.santeAliments, S.ameliInfectionsBact],
    body_md: `## En bref
- La listériose est une infection d’origine **alimentaire**, rare mais **grave** pour le bébé.
- Chez la mère, elle peut passer inaperçue ou ressembler à une **grippe avec fièvre**.
- **À éviter** : lait cru et fromages au lait cru, fromages à pâte molle, croûtes, charcuteries artisanales, poissons fumés ou crus, coquillages crus, graines germées.
- **Fièvre pendant la grossesse = consultation**, sans attendre.

## Comprendre
La bactérie *Listeria* se développe même au froid, dans certains aliments. Toutes les femmes enceintes sont concernées, car on ne s’immunise pas contre elle. Le risque principal est pour le bébé : accouchement prématuré, fausse couche ou infection grave du nouveau-né. Une infection traitée tôt par antibiotique se soigne bien : c’est pourquoi toute fièvre doit faire consulter.

**Aliments à éviter :**
- lait cru et fromages au lait cru, y compris râpés en sachet ;
- fromages à pâte molle (type camembert, brie) et à pâte pressée non cuite et affinage court (type reblochon, morbier), même pasteurisés ;
- la croûte des fromages ;
- charcuteries cuites à conserver au froid et charcuteries « maison » : pâtés, rillettes, foie gras, produits en gelée ;
- viande, poisson et coquillages crus, poissons fumés, crustacés déjà cuits ;
- graines germées crues.
Les **pâtes pressées cuites** (comté, emmental, parmesan) restent possibles.

## Au quotidien
- **Cuisez** bien les aliments d’origine animale.
- **Séparez** aliments crus et cuits ; lavez mains et ustensiles après manipulation.
- **Réchauffez** les restes et plats cuisinés jusqu’à ce qu’ils soient bien chauds, et consommez-les tout de suite ; gardez les restes au maximum 3 jours.
- **Réfrigérateur** : à 4 °C maximum, nettoyé et désinfecté régulièrement ; respectez les dates limites.
- **Au restaurant ou chez des amis**, n’hésitez pas à demander comment un plat est préparé.

### Liste de courses rassurante
- Fromages à pâte pressée cuite (comté, emmental, parmesan), yaourts et fromage blanc.
- Viandes et poissons à cuire à cœur, œufs cuits.
- Légumes et fruits à laver soigneusement.
- Plats préparés à réchauffer jusqu’à ce qu’ils soient bien chauds.
En cas de doute sur un produit, demandez à votre sage-femme ou à votre médecin.

## Questions fréquentes
**Les fromages pasteurisés à pâte molle sont-ils permis ?**
Non, ils sont à éviter pendant toute la grossesse, même pasteurisés.

**Le jambon blanc sous vide est-il concerné ?**
Les charcuteries cuites à conserver au froid sont listées parmi les aliments à éviter ; en cas de doute, préférez des préparations cuites et consommées chaudes.

**J’ai mangé un aliment à éviter, que faire ?**
Pas de panique : surveillez l’apparition de fièvre, de courbatures ou de maux de tête dans les semaines qui suivent et consultez si cela arrive, en signalant ce que vous avez mangé.

**Les plats cuits maison posent-ils problème ?**
Non, s’ils sont bien cuits, conservés au froid et consommés rapidement.

**La listériose est-elle fréquente ?**
Elle est rare, mais ses conséquences peuvent être graves pour le bébé : d’où l’importance des précautions et de consulter en cas de fièvre.

## Quand demander conseil
Consultez **rapidement** en cas de **fièvre**, même isolée, de courbatures, de maux de tête ou de troubles digestifs pendant la grossesse : votre médecin pourra rechercher la bactérie et vous traiter. ${URG}

${FIN}`,
  }),
  a({
    slug: 'toxoplasmose-chat-jardinage-grossesse',
    title: 'Toxoplasmose : cuisine, chat, jardinage',
    summary: 'Si vous n’êtes pas immunisée, quelques gestes simples protègent votre bébé : cuisson de la viande, lavage des légumes, litière et gants.',
    category: 'alimentation-grossesse', tags: ['toxoplasmose', 'chat', 'jardinage', 'viande'],
    sources: [S.ameliToxo, S.santeAliments, S.ameliMensuel],
    body_md: `## En bref
- La toxoplasmose est un parasite surtout dangereux pour le bébé si la mère s’infecte **pendant** la grossesse.
- Une prise de sang au début de la grossesse indique si vous êtes **immunisée** ; sinon, une **sérologie mensuelle** est réalisée.
- Si vous n’êtes pas immunisée : **viande bien cuite**, **crudités bien lavées**, **gants pour jardiner**, et **litière confiée à quelqu’un d’autre**.
- Il n’existe **pas de vaccin**.

## Comprendre
Le parasite se trouve dans la terre, dans certaines viandes insuffisamment cuites et dans les déjections des chats qui chassent ou mangent de la viande crue. Beaucoup de femmes ont déjà été en contact avec lui sans le savoir : elles sont alors protégées. Les autres doivent appliquer des précautions du début de la grossesse jusqu’à l’accouchement, et une sérologie est contrôlée chaque mois pour repérer une éventuelle infection et la prendre en charge.

## Au quotidien
**En cuisine**
- Lavez-vous les mains au savon (au moins 30 secondes) avant de cuisiner, après avoir touché de la viande crue, de la terre ou un animal.
- Cuisez la viande à cœur ; le micro-ondes n’est pas plus efficace. Évitez viande crue, marinée, fumée, salée ou grillée peu cuite.
- La congélation (au moins 3 jours à –18 °C) réduit le risque.
- Rincez soigneusement crudités, herbes et fruits ; au restaurant ou chez des amis, évitez les crudités.
- Évitez les mollusques crus (huîtres, moules).

**Avec un chat**
- Confiez le nettoyage de la litière à une autre personne. Si c’est impossible : tous les jours, avec des gants et de l’eau très chaude.
- Un chat d’intérieur nourri uniquement de croquettes ou de conserves présente très peu de risque de transmission.
- Inutile de vous séparer de votre animal.

**Au jardin**
- Portez des gants pour jardiner ou toucher la terre, et lavez-vous les mains ensuite, même gantée.

### Résumé en 6 gestes
1. Viande cuite à cœur.
2. Crudités, herbes et fruits soigneusement lavés.
3. Mains lavées au savon après la viande crue, la terre, les animaux.
4. Gants pour jardiner.
5. Litière confiée à quelqu’un d’autre.
6. Prises de sang mensuelles si vous n’êtes pas immunisée.

## Questions fréquentes
**Je suis immunisée, dois-je faire attention ?**
Les précautions contre la toxoplasmose ne sont alors plus nécessaires, mais celles contre la listériose s’appliquent à toutes.

**Mon chat doit-il être testé ?**
Ce n’est pas la démarche conseillée ; appliquez simplement les gestes d’hygiène autour de la litière.

**Je travaille avec des animaux ou en extérieur ?**
Parlez-en au médecin du travail pour vérifier l’adaptation de votre poste.

**Et si la sérologie devient positive ?**
Votre médecin vous expliquera la conduite à tenir : examens complémentaires et traitement si nécessaire.

**Puis-je manger du jambon cru ou du saucisson ?**
Les charcuteries crues sont à éviter si vous n’êtes pas immunisée ; le saucisson sec est aussi déconseillé à toutes en raison du risque de salmonellose.

## Quand demander conseil
Consultez en cas de fièvre, de fatigue inhabituelle ou de ganglions pendant la grossesse, et faites bien vos sérologies mensuelles si vous n’êtes pas immunisée. ${URG}

${FIN}`,
  }),
  a({
    slug: 'cytomegalovirus-cmv-et-jeunes-enfants',
    title: 'Cytomégalovirus (CMV) : les gestes si vous côtoyez de jeunes enfants',
    summary: 'Le CMV se transmet surtout par la salive des jeunes enfants : quelques gestes d’hygiène simples réduisent le risque pendant la grossesse.',
    category: 'sante-grossesse', tags: ['cmv', 'cytomégalovirus', 'hygiène', 'aîné', 'crèche'],
    sources: [S.santeAliments, S.ameliInfectionsRecherche],
    body_md: `## En bref
- Le **cytomégalovirus** (CMV) est un virus courant, souvent transmis par la **salive** et les sécrétions des **jeunes enfants**.
- Une infection pendant la grossesse peut parfois toucher le bébé.
- Si vous côtoyez de jeunes enfants (aînés, métier en crèche ou à l’école) : **ne partagez pas couverts ni affaires de toilette**, évitez les **baisers sur la bouche**, **lavez-vous souvent les mains**.
- Votre **partenaire** peut appliquer les mêmes précautions.

## Comprendre
Le CMV donne le plus souvent peu ou pas de symptômes chez l’adulte. Il circule beaucoup chez les tout-petits, qui l’éliminent dans leur salive et leurs urines pendant longtemps. Le risque, pendant la grossesse, est que le virus passe au bébé. Il n’existe pas de vaccin : la prévention repose donc sur des gestes d’hygiène, en particulier autour des enfants de moins de 3 ans.

Le CMV ne fait pas partie des dépistages systématiques de début de grossesse, mais votre médecin ou votre sage-femme peut en parler avec vous selon votre situation.

## Au quotidien
- **Lavez-vous les mains** après avoir changé une couche, mouché un enfant, ou ramassé ses jouets.
- **Ne finissez pas** le repas de votre enfant avec sa cuillère, ne goûtez pas son biberon ou sa tétine.
- **Embrassez-le** sur le front ou les joues plutôt que sur la bouche.
- **Brosses à dents, gants, serviettes** : chacun les siens.
- **Nettoyez** régulièrement les surfaces et jouets qui passent souvent à la bouche.

### Pour le second parent et l’entourage
Le virus peut aussi être rapporté à la maison par le partenaire, par exemple s’il s’occupe beaucoup d’un aîné ou travaille avec de jeunes enfants. Les mêmes gestes valent pour lui : lavage des mains après les changes et le mouchage, pas de partage de couverts ni de verres avec les tout-petits. Les grands-parents qui gardent des enfants peuvent aussi être informés.

### Quand vous êtes professionnelle de la petite enfance
Auxiliaires de puériculture, assistantes maternelles, enseignantes de maternelle : le risque d’exposition est plus élevé. Parlez-en tôt avec le médecin du travail ou votre médecin pour adapter certaines tâches (changes, repas) et renforcer l’hygiène des mains.

## Questions fréquentes
**Dois-je éviter de faire des câlins à mon aîné ?**
Non, les câlins sont précieux. Il s’agit seulement d’éviter les contacts avec la salive.

**Je travaille en crèche, que faire ?**
Parlez-en tôt au médecin du travail et à votre sage-femme ou médecin : des adaptations peuvent être envisagées.

**Le CMV est-il dépisté pendant la grossesse ?**
Il ne fait pas partie des dépistages systématiques ; votre professionnel peut en discuter avec vous.

**Ces gestes sont-ils utiles toute la grossesse ?**
Oui, du début jusqu’à l’accouchement.

**Le CMV se transmet-il par l’air ?**
Il se transmet surtout par contact avec la salive, les sécrétions nasales et les urines ; les gestes d’hygiène sont donc efficaces.

## Quand demander conseil
Consultez si vous avez de la fièvre, une grande fatigue ou des symptômes grippaux pendant la grossesse, et signalez que vous êtes au contact de jeunes enfants. ${URG}

${FIN}`,
  }),
  a({
    slug: 'poisson-soja-et-produits-du-quotidien-enceinte',
    title: 'Poisson, soja, produits du quotidien : limiter les expositions',
    summary: 'Quels poissons privilégier, pourquoi limiter le soja et comment réduire les substances indésirables à la maison.',
    category: 'alimentation-grossesse', tags: ['poisson', 'mercure', 'soja', 'perturbateurs endocriniens', 'cosmétiques'],
    sources: [S.santeEnvironnement, S.santeAliments, S.santeAlimentation],
    body_md: `## En bref
- **Poisson deux fois par semaine**, un gras et un maigre : c’est bénéfique.
- **À éviter** : espadon, requin (mercure), anguille, carpe (PCB) ; **à limiter** : thon, bar et autres grands prédateurs.
- **Soja** : évitez boissons et compléments au soja ; la sauce soja reste possible de temps en temps.
- À la maison : **aérez** chaque jour, **limitez** cosmétiques et produits ménagers, évitez travaux et peintures.

## Comprendre
Le poisson apporte des protéines, de l’iode et des oméga-3 utiles au développement du cerveau du bébé. Certains grands poissons prédateurs accumulent cependant du méthylmercure ou des PCB : il vaut mieux les éviter ou les limiter.

Le soja contient des substances qui agissent comme des hormones : par prudence, les boissons et compléments à base de soja sont déconseillés pendant la grossesse.

Plus largement, certaines substances du quotidien (solvants, perturbateurs endocriniens, plomb) peuvent traverser le placenta. Sans tomber dans l’angoisse, quelques choix simples réduisent l’exposition.

## Au quotidien
- **Aérez votre logement** au moins 10 minutes par jour, même l’hiver.
- **Cosmétiques et produits ménagers** : moins de produits, des formules simples ; des applications permettent de lire les compositions.
- **Travaux et bricolage** : évitez peintures, décapants, solvants ; si c’est inévitable, masque, gants et pièce aérée.
- **Cuisine** : évitez de chauffer des aliments dans du plastique au micro-ondes, préférez le verre ; évitez les ustensiles abîmés et la vaisselle ancienne pouvant contenir du plomb.
- **Air extérieur** : les jours de pollution, limitez les efforts dehors ; des outils publics donnent la qualité de l’air locale.

### Préparer la chambre du bébé
Si vous prévoyez de peindre ou de meubler la chambre, faites-le de préférence tôt, confiez les travaux à quelqu’un d’autre et aérez longuement avant l’arrivée du bébé. Privilégiez des peintures et meubles peu émissifs, et laissez « dégazer » les meubles neufs dans une pièce aérée.

### Au travail
Coiffure, esthétique, nettoyage, laboratoires, agriculture, industrie : certains métiers exposent à des produits chimiques. Signalez votre grossesse au médecin du travail pour faire le point sur les postes et les protections.

## Questions fréquentes
**Le thon en boîte est-il interdit ?**
Il fait partie des poissons à limiter, pas à supprimer : variez les espèces.

**Puis-je me teindre les cheveux ou me faire faire les ongles ?**
Il est conseillé de limiter les produits chimiques ; aérez bien et parlez-en à votre sage-femme si vous avez un doute.

**Les produits « naturels » sont-ils plus sûrs ?**
Pas forcément : les huiles essentielles, par exemple, sont vivement déconseillées pendant la grossesse.

**Je travaille avec des produits chimiques ?**
Parlez-en au médecin du travail dès le début de la grossesse.

**Les bougies parfumées et désodorisants sont-ils à éviter ?**
Ils participent à la pollution de l’air intérieur : mieux vaut les limiter et aérer régulièrement.

## Quand demander conseil
Si votre travail ou votre logement vous expose à des produits (solvants, peintures anciennes au plomb, pesticides), parlez-en à votre médecin, à votre sage-femme et au médecin du travail. ${URG}

${FIN}`,
  }),
  a({
    slug: 'cafe-the-cafeine-grossesse',
    title: 'Café, thé, boissons : que boire pendant la grossesse ?',
    summary: 'Eau à volonté, café avec modération, alcool jamais : les repères simples pour vos boissons.',
    category: 'alimentation-grossesse', tags: ['café', 'caféine', 'thé', 'boissons'],
    sources: [S.santeAlimentation, S.santeChaleur, S.ameliAlcool],
    body_md: `## En bref
- **L’eau** (et les tisanes) **à volonté** tout au long de la journée.
- **Café** : **pas plus de 3 tasses par jour**.
- **Thé et café** freinent l’absorption du fer : évitez-les **pendant les repas**.
- **Alcool** : **aucun**, pendant toute la grossesse.

## Comprendre
Bien s’hydrater aide le corps à faire face à l’augmentation du volume sanguin, limite la constipation et la fatigue. L’eau est la boisson de référence.

La caféine passe chez le bébé. Au-delà de quelques tasses par jour, elle peut accélérer son rythme cardiaque et freiner l’absorption du fer chez vous : d’où la limite de 3 tasses de café par jour. Le thé, les boissons au cola et les boissons « énergisantes » contiennent aussi de la caféine : il faut les additionner.

Pour l’alcool, aucune quantité n’a été reconnue comme sûre pendant la grossesse : c’est zéro, dès le projet de grossesse.

## Au quotidien
- **Gardez une bouteille d’eau** près de vous, au travail comme à la maison.
- **Alternez** avec des tisanes, de l’eau gazeuse, des eaux aromatisées maison (agrumes, menthe).
- **Café** : passez au déca pour certaines tasses, ou espacez-les loin des repas.
- **Boissons énergisantes** : évitez-les.
- **Par fortes chaleurs**, buvez au moins 1,5 à 2 litres d’eau par jour, sans attendre la soif.

### Repères pratiques
- **Une tasse de café** n’a pas la même teneur en caféine selon la préparation (expresso, filtre, soluble) : restez large dans vos estimations.
- **Thé, chocolat, boissons au cola** contiennent aussi de la caféine ou des substances proches : comptez-les.
- **Boissons énergisantes** : elles concentrent caféine et autres stimulants, à éviter.
- **Le soir**, réduire la caféine peut aussi améliorer un sommeil souvent perturbé en fin de grossesse.

### Les jus de fruits et boissons sucrées
Les jus, même « 100 % pur jus », apportent beaucoup de sucre et peu de fibres : un fruit entier est préférable. Les sirops et sodas sont à garder occasionnels, en particulier en cas de diabète gestationnel ou de prise de poids rapide.

## Questions fréquentes
**Le thé compte-t-il comme du café ?**
Il contient aussi de la caféine (théine) : modérez-le et évitez-le pendant les repas.

**Puis-je boire des tisanes ?**
Oui, des tisanes courantes, sans en faire un traitement ; demandez conseil pour toute plante prise à visée médicinale.

**Une coupe de champagne à une fête, c’est vraiment non ?**
Oui : aucune quantité d’alcool n’est considérée comme sûre pendant la grossesse. Proposez-vous un cocktail sans alcool.

**Et les sodas ?**
Ils sont sucrés et parfois caféinés : à garder occasionnels.

**Le déca est-il possible ?**
Oui, il contient très peu de caféine ; il reste préférable de ne pas le boire au cours des repas si vous manquez de fer.

## Quand demander conseil
Consultez si vous n’arrivez pas à boire (vomissements répétés), si vous urinez très peu ou très foncé, ou en cas de malaise par forte chaleur. Si l’arrêt de l’alcool est difficile, parlez-en à votre sage-femme ou à votre médecin, ou appelez Alcool Info Service (0 980 980 930). ${URG}

${FIN}`,
  }),
  a({
    slug: 'zero-alcool-pendant-la-grossesse',
    title: 'Zéro alcool pendant la grossesse : pourquoi, et comment se faire aider',
    summary: 'L’alcool passe chez le bébé et agit sur son cerveau tout au long de la grossesse : il n’existe pas de quantité sûre.',
    category: 'alimentation-grossesse', tags: ['alcool', 'saf', 'tcaf', 'addiction'],
    sources: [S.ameliAlcool, S.santeAliments],
    body_md: `## En bref
- L’alcool passe **presque entièrement** dans le sang du bébé.
- Il peut provoquer des **malformations** (surtout au 1er trimestre) et agit sur le **cerveau** pendant **toute** la grossesse.
- **Aucun seuil** en dessous duquel le risque serait nul n’a été établi : c’est **zéro alcool**.
- Avoir bu avant de savoir qu’on était enceinte : le risque reste **très faible** après des consommations légères ; l’important est d’**arrêter dès maintenant**.

## Comprendre
Le placenta ne filtre pas l’alcool. Le bébé y est exposé au même taux que sa mère, alors que son organisme ne sait pas l’éliminer. Les conséquences possibles vont de troubles des apprentissages, de l’adaptation et du comportement (on parle de troubles causés par l’alcoolisation fœtale, TCAF) jusqu’au syndrome d’alcoolisation fœtale (SAF) en cas de consommation importante, avec un retard de croissance, des particularités du visage et des difficultés cognitives.

Ces effets sont évitables : c’est pour cela que la recommandation est « zéro alcool » dès le projet de grossesse et jusqu’à la fin, y compris l’alcool utilisé dans les plats cuisinés.

## Au quotidien
- **Préparez vos réponses** pour les invitations : « Je ne bois pas en ce moment », sans avoir à vous justifier.
- **Ayez vos alternatives** : jus, eaux pétillantes, cocktails sans alcool.
- **Impliquez votre entourage** : un partenaire qui arrête aussi rend les choses plus faciles.
- **En cuisine**, évitez les plats où l’alcool est ajouté en fin de préparation.

### Et après la naissance ?
Si vous allaitez, l’alcool passe aussi dans le lait : parlez-en avec votre sage-femme ou votre médecin pour connaître la conduite à tenir. Pour le second parent, la grossesse peut être une bonne occasion de réduire sa propre consommation : c’est plus facile à deux, et cela compte pour la sécurité de la famille (conduite, nuits, soins au bébé).

### Les mots pour le dire
« Je fais une pause en ce moment », « je conduis », ou simplement « non merci » : vous n’avez pas à vous justifier. Proposer vous-même une boisson sans alcool que vous aimez rend les repas plus simples.

## Questions fréquentes
**J’ai bu à une soirée avant de savoir que j’étais enceinte. Le bébé est-il en danger ?**
Le risque de malformation après des consommations légères ou un épisode isolé en tout début de grossesse reste très faible. Parlez-en à votre sage-femme ou à votre médecin, sans culpabilité, et arrêtez désormais.

**Un verre de temps en temps en fin de grossesse ?**
Non : l’alcool reste toxique pour le cerveau du bébé jusqu’au terme.

**Les bières ou vins « sans alcool » ?**
Certains contiennent un peu d’alcool : lisez l’étiquette et préférez les boissons à 0,0 %.

**J’ai du mal à arrêter.**
C’est fréquent et ce n’est pas une faute. Des professionnels peuvent vous accompagner sans jugement.

**Les plats cuisinés au vin sont-ils concernés ?**
Oui, l’alcool ne s’évapore pas toujours complètement à la cuisson : mieux vaut les éviter pendant la grossesse.

## Quand demander conseil
Parlez-en à votre médecin, à votre sage-femme ou à votre gynécologue. **Alcool Info Service** : 0 980 980 930, de 8 h à 2 h, 7 jours sur 7, anonyme. Votre caisse (36 46) peut vous orienter vers une structure spécialisée. ${URG}

${FIN}`,
  }),
  a({
    slug: 'arreter-de-fumer-enceinte',
    title: 'Arrêter de fumer quand on est enceinte : c’est bénéfique à tout moment',
    summary: 'Risques du tabac et de la cigarette électronique pendant la grossesse, et les aides concrètes pour arrêter.',
    category: 'alimentation-grossesse', tags: ['tabac', 'cigarette électronique', 'vapotage', 'sevrage'],
    sources: [S.ameliTabac, S.santeAliments, S.santeTabac],
    body_md: `## En bref
- **Arrêter de fumer est bénéfique à tout moment** de la grossesse.
- Le tabac augmente notamment les risques de **fausse couche**, d’**accouchement prématuré** et de **retard de croissance** du bébé.
- La **cigarette électronique** ne doit pas être utilisée pendant la grossesse.
- Les **substituts nicotiniques** sont possibles, **sous contrôle médical** (médecin ou sage-femme).

## Comprendre
La nicotine et le monoxyde de carbone de la fumée passent le placenta. Le monoxyde de carbone réduit l’oxygène disponible pour le bébé : c’est la principale cause de retard de croissance lié au tabac. Le tabagisme augmente aussi le risque de grossesse extra-utérine, d’hématome rétroplacentaire et de placenta prævia. Après la naissance, il est la première cause de mort inattendue du nourrisson, et l’exposition à la fumée favorise infections respiratoires et otites.

Le tabagisme passif compte aussi : la fumée des autres expose le bébé, à un degré moindre.

Beaucoup de femmes réduisent ou arrêtent pendant leur grossesse : chaque cigarette en moins compte, mais l’objectif est l’arrêt complet, car même un petit nombre de cigarettes reste nocif.

## Au quotidien
- **Parlez-en** dès le premier rendez-vous : sage-femme et médecin peuvent prescrire des substituts nicotiniques adaptés.
- **Demandez une consultation d’aide à l’arrêt** : votre caisse d’Assurance Maladie vous donne les coordonnées.
- **Repérez vos moments à risque** (café, pause, stress) et préparez une alternative (marche, eau fraîche, respiration).
- **Votre entourage** : demandez qu’on ne fume pas près de vous, ni dans la voiture, ni dans le logement.
- **Rechute ?** Ce n’est pas un échec : recommencez, avec de l’aide.

### Quelques repères pour tenir
- **Les premiers jours** sont souvent les plus difficiles : prévoyez des activités, de l’eau fraîche, des en-cas sains.
- **Le stress** est le déclencheur le plus fréquent : respiration lente, marche, appel à un proche ou à Tabac Info Service.
- **Les substituts** sont adaptés au fil du temps par votre professionnel ; n’hésitez pas à dire si vous ressentez encore un fort manque.
- **Chaque jour sans tabac** améliore l’oxygénation de votre bébé.

## Questions fréquentes
**Arrêter brutalement est-il dangereux pour le bébé ?**
Non, l’arrêt est bénéfique ; un accompagnement aide à gérer le manque.

**Les patchs sont-ils compatibles avec la grossesse ?**
Oui, sous contrôle médical : ils sont moins nocifs que la fumée.

**Je vapote à la place, c’est mieux ?**
La cigarette électronique ne doit pas être utilisée pendant la grossesse ; parlez-en pour trouver une autre aide.

**Et après l’accouchement ?**
Rester non-fumeuse protège votre bébé (mort inattendue du nourrisson, infections) et le lait si vous allaitez.

**Mon conjoint fume, cela compte-t-il ?**
Oui, le tabagisme passif expose aussi le bébé ; il peut se faire aider de la même façon.

## Quand demander conseil
Votre sage-femme, votre médecin, votre pharmacien et **Tabac Info Service (39 89)** peuvent vous accompagner gratuitement. Consultez sans attendre en cas de saignements, de douleurs ou si le bébé bouge moins. ${URG}

${FIN}`,
  }),
  a({
    slug: 'cannabis-et-drogues-pendant-la-grossesse',
    title: 'Cannabis et autres drogues pendant la grossesse : en parler sans crainte',
    summary: 'Les effets possibles sur le bébé, et pourquoi en parler à un professionnel permet un accompagnement adapté, sans jugement.',
    category: 'alimentation-grossesse', tags: ['cannabis', 'drogues', 'addiction', 'accompagnement'],
    sources: [S.ameliDrogues, S.santeCannabis],
    body_md: `## En bref
- Le **THC** du cannabis **traverse le placenta** et passe dans le **lait maternel**.
- Une consommation **régulière et importante** est associée à la prématurité, à une croissance plus lente du bébé et à des troubles plus tard.
- Les opiacés, la cocaïne et le crack exposent à des **complications graves** (placenta, prématurité, sevrage du nouveau-né).
- **N’arrêtez pas brutalement** certains produits seule : **parlez-en**, un accompagnement existe et il est confidentiel.

## Comprendre
Les études n’ont pas retrouvé d’effet malformatif du cannabis au premier trimestre, mais une consommation régulière (plusieurs fois par semaine) est associée à un risque accru de prématurité, de retard de croissance, de tremblements chez le nouveau-né (qui disparaissent en général en quelques semaines) et de troubles du comportement plus tard dans l’enfance.

Les opiacés (comme l’héroïne), la cocaïne et le crack augmentent le risque de fausse couche, de placenta prævia, d’hématome rétroplacentaire, d’accouchement prématuré et de retard de croissance. Après une exposition aux opiacés, plus de la moitié des nouveau-nés présentent un syndrome de sevrage, qui demande une surveillance et des soins à la maternité.

Le plus important : un arrêt brutal de certains produits peut être risqué. Un accompagnement médical permet d’adapter les choses en sécurité pour vous et le bébé.

## Au quotidien
- **Dites-le à votre sage-femme ou à votre médecin**, idéalement tôt : le but est de vous aider, pas de vous juger.
- **Faites-vous accompagner** par une structure spécialisée (CSAPA) : des équipes ont l’habitude d’accompagner des femmes enceintes.
- **Préparez la naissance** avec l’équipe : si un sevrage du nouveau-né est possible, il sera anticipé.
- **Entourage** : demandez qu’on ne fume pas près de vous.

### Ce qu’un accompagnement peut proposer
- Un suivi de grossesse coordonné entre la maternité, la sage-femme et une équipe d’addictologie.
- Selon les produits, un traitement de substitution adapté, qui protège mieux le bébé qu’un arrêt brutal.
- Une préparation de la naissance : surveillance du nouveau-né, choix de l’alimentation.
- Un soutien psychologique et social, sans jugement, pour vous et votre entourage.

## Questions fréquentes
**Si j’en parle, va-t-on me retirer mon bébé ?**
Le but du suivi est de vous accompagner et de protéger votre santé et celle du bébé. Parlez de vos craintes : les professionnels sont tenus au secret.

**J’ai fumé du cannabis avant de savoir que j’étais enceinte.**
Parlez-en lors de votre prochain rendez-vous ; les études ne montrent pas d’effet malformatif au 1er trimestre, mais il est préférable d’arrêter.

**Le CBD est-il concerné ?**
Les pages officielles consultées ne donnent pas de repère spécifique sur le CBD pendant la grossesse : n’en consommez pas sans en avoir parlé à votre médecin, à votre sage-femme ou à votre pharmacien.

**Et pendant l’allaitement ?**
Le THC passe dans le lait : parlez-en avant la naissance pour préparer l’allaitement ou le biberon.

**Puis-je demander de l’aide de façon anonyme ?**
Oui : Drogues Info Service est anonyme, et les consultations en CSAPA sont gratuites et confidentielles.

## Quand demander conseil
**Drogues Info Service** : 0 800 23 13 13, gratuit et anonyme, 7 jours sur 7 de 8 h à 2 h (selon Santé.fr). Parlez-en à votre médecin, à votre sage-femme ou à la PMI. Consultez sans attendre en cas de saignements, de douleurs, de contractions ou si le bébé bouge moins. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ santé, maladies, médicaments
  a({
    slug: 'medicaments-et-automedication-enceinte',
    title: 'Médicaments pendant la grossesse : les bons réflexes',
    summary: 'Pourquoi éviter l’automédication, ce que signifient les pictogrammes sur les boîtes et pourquoi ne jamais arrêter seule un traitement.',
    category: 'sante-grossesse', tags: ['médicaments', 'automédication', 'anti-inflammatoires', 'pictogramme'],
    sources: [S.ameliMedicaments, S.santeEnvironnement, S.arsCap],
    body_md: `## En bref
- **Pas d’automédication** : demandez conseil à votre médecin, sage-femme ou pharmacien **avant tout médicament**, même sans ordonnance.
- Les **anti-inflammatoires** (AINS) sont **contre-indiqués à partir du 6e mois** et, avant, réservés à une nécessité absolue.
- Deux **pictogrammes** sur les boîtes signalent un danger ou une interdiction pendant la grossesse.
- **Ne jamais arrêter seule** un traitement de fond : parlez-en d’abord au médecin.

## Comprendre
Beaucoup de médicaments passent chez le bébé. Le risque de malformation est le plus important au premier trimestre, mais certains produits restent dangereux jusqu’au terme. C’est le cas des anti-inflammatoires non stéroïdiens (ibuprofène, kétoprofène, aspirine à partir d’une certaine dose…) : à partir de 24 semaines d’aménorrhée, ils sont contre-indiqués, y compris en gel ou en crème, car ils peuvent avoir des effets graves sur le bébé.

Sur les boîtes, deux pictogrammes vous alertent :
- « **Médicament + grossesse = danger** » : à n’utiliser que s’il n’existe pas d’autre solution, sur avis médical ;
- « **Médicament + grossesse = interdit** » : à ne jamais prendre pendant la grossesse.

Les plantes, les **huiles essentielles** et les compléments alimentaires ne sont pas anodins : les huiles essentielles sont vivement déconseillées.

À l’inverse, **arrêter brutalement** un traitement de fond (épilepsie, asthme, dépression, thyroïde, hypertension…) peut faire réapparaître des symptômes dangereux pour vous et le bébé. Le médecin évaluera le traitement le plus adapté.

## Au quotidien
- **Faites le tri** dans votre armoire à pharmacie et mettez de côté les anti-inflammatoires.
- **Dites toujours que vous êtes enceinte** à un médecin, un dentiste, un pharmacien, un kinésithérapeute.
- **Douleur, fièvre, rhume** : demandez au pharmacien ou à votre sage-femme ce qui est adapté, plutôt que de reprendre « ce qui marche d’habitude ».
- **Projet de grossesse avec un traitement** : une consultation avant la conception permet d’ajuster.
- **Gardez la liste** de vos traitements à jour pour les rendez-vous.

### Si vous avez une maladie chronique
Prenez rendez-vous avec le médecin qui suit votre maladie dès que vous savez être enceinte, voire avant la grossesse. Certains traitements doivent être changés pour une alternative compatible ; d’autres sont poursuivis, car une maladie mal contrôlée est elle-même un risque pour la grossesse.

## Questions fréquentes
**Puis-je prendre un antidouleur courant ?**
Demandez au préalable à votre médecin, sage-femme ou pharmacien : ils vous indiqueront ce qui convient, à quelle dose et combien de temps.

**J’ai pris un médicament avant de savoir que j’étais enceinte.**
Ne paniquez pas et parlez-en rapidement au médecin ou à la sage-femme : ils évalueront la situation, si besoin avec un centre de référence.

**Un gel anti-inflammatoire pour le dos, c’est possible ?**
Non à partir du 6e mois, et pas sans avis avant : la forme locale est aussi concernée.

**Et les traitements homéopathiques ou à base de plantes ?**
Demandez conseil avant toute utilisation.

**Où trouver une information fiable ?**
Votre médecin, votre sage-femme et votre pharmacien peuvent consulter les centres de référence sur les agents tératogènes.

## Quand demander conseil
Consultez avant tout nouveau médicament et immédiatement si vous avez pris un produit déconseillé. En cas d’intoxication ou de prise accidentelle importante, appelez un **centre antipoison** ou le 15. ${URG}

${FIN}`,
  }),
  a({
    slug: 'vaccins-pendant-la-grossesse',
    title: 'Les vaccins pendant la grossesse : grippe, coqueluche, Covid, VRS',
    summary: 'Quels vaccins sont recommandés pendant la grossesse, à quel moment, et lesquels sont contre-indiqués.',
    category: 'sante-grossesse', tags: ['vaccin', 'coqueluche', 'grippe', 'vrs', 'bronchiolite', 'covid'],
    sources: [S.santeVaccins, S.ameliProgramme],
    body_md: `## En bref
- **Grippe** : recommandée pendant la saison, **à n’importe quel trimestre**.
- **Coqueluche** : à **chaque grossesse**, de préférence **entre 20 et 36 SA**.
- **VRS (bronchiolite)** : une dose **entre 32 et 36 SA**, pendant la saison (de septembre à janvier).
- **Covid-19** : recommandée selon la situation épidémique, dès le 1er trimestre.
- Les **vaccins vivants** (rougeole, oreillons, rubéole, varicelle, BCG…) sont **contre-indiqués** pendant la grossesse.

## Comprendre
Certains vaccins protègent à la fois la future mère et le bébé : les anticorps produits par la mère passent par le placenta et protègent le nouveau-né pendant ses premiers mois, avant qu’il puisse être vacciné lui-même.

- La **grippe** peut être plus sévère pendant la grossesse : la vaccination est conseillée en saison.
- La **coqueluche** est très dangereuse pour les nourrissons ; vacciner la mère au cours de chaque grossesse les protège dès la naissance. La vaccination de l’entourage (« cocooning ») est aussi recommandée.
- Le **VRS** est le principal virus de la bronchiolite ; la vaccination de la mère en fin de grossesse protège le bébé pendant la saison.

Les vaccins **vivants atténués** ne sont pas faits pendant la grossesse. Une vaccination faite par erreur ne justifie pas, à elle seule, d’interrompre la grossesse : aucun effet malformatif n’a été confirmé. D’autres vaccins (hépatites, méningocoque, rage…) peuvent se discuter selon les situations à risque.

## Au quotidien
- **Faites le point** sur votre carnet de vaccination dès le début du suivi.
- **Programmez** les vaccins aux bons moments : notez-les dans votre calendrier de grossesse.
- **Entourage** : conjoint, grands-parents, personnes qui garderont le bébé peuvent faire le point sur la coqueluche.
- **Après la naissance**, si vous n’êtes pas immunisée contre la rubéole, la vaccination pourra vous être proposée.

### Calendrier indicatif
- **Dès le début** : point sur le carnet de vaccination ; grippe en saison ; Covid-19 selon la situation.
- **Entre 20 et 36 SA** : coqueluche, à chaque grossesse.
- **Entre 32 et 36 SA**, de septembre à janvier : VRS.
- **Après la naissance** : rattrapage éventuel (rubéole, rougeole) si vous n’êtes pas immunisée, et vaccinations de l’entourage.

## Questions fréquentes
**Les vaccins sont-ils pris en charge ?**
Ils font partie du programme de suivi de grossesse ; demandez à votre professionnel ou à votre caisse les modalités.

**Qui peut me vacciner ?**
Médecin, sage-femme, et selon les vaccins le pharmacien.

**J’ai été vaccinée contre la coqueluche lors d’une grossesse précédente.**
La recommandation est de se faire vacciner à **chaque** grossesse.

**Le vaccin VRS est-il fait toute l’année ?**
Il est recommandé pendant la saison épidémique, entre 32 et 36 SA ; selon les situations, une protection du bébé à la naissance peut être proposée à la place.

**Puis-je me faire vacciner si j’allaite ?**
La plupart des vaccins sont possibles pendant l’allaitement ; demandez à votre professionnel.

## Quand demander conseil
Parlez-en à votre sage-femme, votre médecin ou votre pharmacien, qui évalueront votre bilan vaccinal. En cas de forte fièvre ou de difficultés respiratoires pendant la grossesse, consultez rapidement. ${URG}

${FIN}`,
  }),
  a({
    slug: 'diabete-gestationnel',
    title: 'Le diabète gestationnel : dépistage, suivi et quotidien',
    summary: 'Qui est concernée, comment se fait le dépistage et comment l’alimentation, l’activité et l’auto-surveillance aident à le contrôler.',
    category: 'sante-grossesse', tags: ['diabète', 'glycémie', 'hgpo', 'alimentation'], min_week: 12,
    sources: [S.santeDiabete, S.ameliSurpoids],
    body_md: `## En bref
- C’est une **glycémie trop élevée** qui apparaît pendant la grossesse, le plus souvent vers la **fin du 2e trimestre**.
- Le dépistage est proposé aux femmes **à risque** (surpoids, antécédents familiaux, âge, gros bébé précédent…).
- Il repose sur une **prise de sang avec boisson sucrée (HGPO)**, souvent au **5e–6e mois**.
- La prise en charge associe **alimentation adaptée**, **activité physique** et **auto-surveillance** de la glycémie.

## Comprendre
Pendant la grossesse, les hormones du placenta rendent l’organisme moins sensible à l’insuline. Chez certaines femmes, le pancréas ne compense pas suffisamment : la glycémie s’élève. Parfois, ce dépistage révèle aussi un diabète de type 2 qui existait avant la grossesse.

**Facteurs de risque :** surpoids ou obésité, antécédents personnels ou familiaux de diabète, âge supérieur à 35 ans, bébé de plus de 4 kg lors d’une grossesse précédente, bébé grand pour son âge à l’échographie, excès de liquide amniotique, traitement prolongé par corticoïdes.

**Pourquoi le surveiller ?** Pour la mère, il augmente le risque de pré-éclampsie. Pour le bébé, il est associé à un poids de naissance élevé, à des difficultés respiratoires ou de glycémie à la naissance, et à un risque plus élevé de diabète de type 2 plus tard. Bien suivi, il est le plus souvent bien contrôlé.

## Au quotidien
- **Répartissez vos repas** : trois repas et deux collations, sans en sauter.
- **Choisissez** des aliments riches en fibres (légumes, légumineuses, féculents complets), moins de sucres rapides et de graisses.
- **Bougez** régulièrement, selon votre forme : marche après les repas, natation, vélo d’appartement.
- **Mesurez votre glycémie** comme on vous l’a appris (lecteur et bandelettes) et notez les résultats pour le suivi.
- **Faites-vous accompagner** : diététicien, endocrinologue, sage-femme ; si l’alimentation ne suffit pas, un traitement peut être proposé.

### Une journée type (exemple à adapter avec votre diététicien)
- **Petit-déjeuner** : pain complet, produit laitier, fruit entier.
- **Collation** : yaourt nature ou poignée d’oléagineux.
- **Déjeuner et dîner** : moitié de l’assiette en légumes, une portion de féculents complets ou de légumineuses, une protéine.
- **Collation de l’après-midi** : fruit et produit laitier.
- **Après les repas** : une petite marche si vous le pouvez.
Notez vos glycémies et ce que vous avez mangé : cela aide l’équipe à ajuster les conseils.

## Questions fréquentes
**Le diabète gestationnel est-il de ma faute ?**
Non. Il dépend surtout des changements hormonaux de la grossesse et de facteurs que vous ne contrôlez pas.

**Dois-je supprimer tous les sucres ?**
Non : il s’agit de les répartir et de choisir des aliments qui font monter la glycémie plus lentement, avec l’aide d’un professionnel.

**Va-t-il disparaître après l’accouchement ?**
Le plus souvent, oui ; un contrôle est prévu après la naissance, et un suivi régulier ensuite, car le risque de diabète plus tard est plus élevé.

**Aurai-je forcément une césarienne ?**
Non ; la voie d’accouchement est discutée selon la situation de chaque grossesse.

**Le diabète gestationnel peut-il revenir lors d’une prochaine grossesse ?**
Le risque est plus élevé : un dépistage précoce sera proposé lors d’une grossesse suivante.

## Quand demander conseil
Consultez si vos glycémies restent au-dessus des objectifs fixés, si vous avez très soif, urinez beaucoup, ou si vous avez des maux de tête intenses avec troubles de la vue et gonflement. ${URG}

${FIN}`,
  }),
  a({
    slug: 'remontees-acides-brulures-estomac-grossesse',
    title: 'Remontées acides et brûlures d’estomac pendant la grossesse',
    summary: 'Pourquoi elles sont fréquentes, surtout en fin de grossesse, et les gestes qui soulagent au quotidien.',
    category: 'corps-grossesse', tags: ['reflux', 'brûlures', 'digestion', 'sommeil'],
    sources: [S.ameliDigestion, S.ameliMedicaments],
    body_md: `## En bref
- Les remontées acides sont **fréquentes** pendant la grossesse, surtout en **fin de grossesse**.
- **Fractionnez** les repas, évitez les repas copieux et **ne vous couchez pas** juste après manger.
- **Surélevez la tête** du lit et évitez de vous pencher en avant après les repas.
- **Pas de médicament sans avis** : demandez à votre sage-femme, médecin ou pharmacien.

## Comprendre
Les hormones de la grossesse relâchent le muscle qui ferme le haut de l’estomac, et l’utérus qui grandit pousse sur l’estomac. Le contenu acide remonte alors plus facilement vers l’œsophage, provoquant une sensation de brûlure derrière le sternum ou un goût acide dans la bouche, souvent après les repas ou en position allongée.

## Au quotidien
- **Plusieurs petits repas** plutôt que trois gros ; mangez lentement.
- **Couchez-vous environ trois heures après le dîner.**
- **Surélevez la tête du lit** (cales sous les pieds du lit plutôt qu’oreillers empilés).
- **Évitez les efforts et de vous pencher** juste après avoir mangé : pliez les genoux pour ramasser un objet.
- **Repérez ce qui aggrave** chez vous (plats gras, épicés, agrumes, café, boissons gazeuses) et adaptez.
- **Vêtements** : évitez ceux qui serrent la taille.

### Pour mieux dormir malgré le reflux
- Dînez plus tôt et plus léger.
- Évitez de boire de grandes quantités juste avant de vous coucher.
- Testez la position semi-assise ou sur le côté gauche, avec un coussin de grossesse.
- Gardez un verre d’eau près du lit.
Si le reflux vous empêche de dormir ou de manger, parlez-en : des solutions compatibles avec la grossesse existent.

### Ce qui peut aussi aider
- Mâcher lentement et poser la fourchette entre les bouchées.
- Boire plutôt entre les repas qu’au cours du repas.
- Garder une activité douce, comme une marche tranquille, à distance des repas.
- Noter quelques jours ce que vous mangez et quand les brûlures apparaissent, pour repérer vos propres déclencheurs.

## Questions fréquentes
**Puis-je prendre un pansement gastrique ?**
Demandez d’abord conseil : certains traitements sont possibles pendant la grossesse, mais le choix doit être fait avec un professionnel.

**Est-ce mauvais pour le bébé ?**
Les remontées acides sont inconfortables pour vous mais ne touchent pas le bébé.

**Pourquoi c’est pire la nuit ?**
En position allongée, l’acide remonte plus facilement ; la tête surélevée aide.

**Est-ce que ça va passer ?**
Elles diminuent généralement après l’accouchement.

**Le lait soulage-t-il ?**
Il peut apaiser sur le moment chez certaines femmes, mais n’est pas un traitement ; demandez conseil si les brûlures persistent.

## Quand demander conseil
Consultez si les douleurs sont intenses, si vous vomissez souvent, si vous ne pouvez plus manger, ou si une **douleur en haut du ventre** (sous les côtes, à droite) s’accompagne de **maux de tête, de troubles de la vue ou de gonflements** : ces signes peuvent évoquer une complication et demandent une consultation rapide à la maternité. ${URG}

${FIN}`,
  }),
  a({
    slug: 'constipation-hemorroides-grossesse',
    title: 'Constipation et hémorroïdes pendant la grossesse',
    summary: 'Les gestes qui aident vraiment : fibres progressives, eau, marche, horaires réguliers — et pourquoi éviter les laxatifs sans avis.',
    category: 'corps-grossesse', tags: ['constipation', 'hémorroïdes', 'fibres', 'transit'],
    sources: [S.ameliDigestion],
    body_md: `## En bref
- La **constipation** est fréquente pendant la grossesse.
- **Fibres** (légumes, fruits, légumineuses, céréales complètes), **eau** (au moins 1,5 L par jour) et **marche** sont les trois piliers.
- **Ne retenez pas** une envie et allez aux toilettes à **heure régulière**.
- **Pas de laxatif sans avis médical** : certains peuvent déclencher des contractions.

## Comprendre
Les hormones de la grossesse ralentissent le transit, et l’utérus comprime l’intestin. Le fer, quand il est prescrit, peut aussi constiper. Les efforts de poussée répétés favorisent les **hémorroïdes** (veines dilatées autour de l’anus) et les fissures, et fragilisent le périnée. Prévenir la constipation, c’est donc aussi protéger ces zones.

## Au quotidien
- **Fibres progressivement** : augmentez-les sur 8 à 10 jours (légumes verts, fruits frais, légumes secs, céréales complètes, fruits secs) pour éviter les ballonnements.
- **Buvez** au moins 1,5 litre de liquides par jour, soupes comprises.
- **Bougez** : la marche quotidienne stimule le transit, sauf contre-indication médicale.
- **Horaires** : installez-vous aux toilettes une demi-heure à une heure après un repas, sans forcer ; un petit tabouret sous les pieds peut aider.
- **Hémorroïdes** : douche fraîche, toilette douce, pas de grattage ; demandez conseil pour un traitement local.
- **Limitez** les aliments très gras et sucrés.

### Exemple de journée « transit »
- **Au réveil** : un grand verre d’eau.
- **Petit-déjeuner** : pain complet ou flocons d’avoine, fruit frais.
- **Midi et soir** : légumes à chaque repas, légumineuses deux à trois fois par semaine.
- **Collation** : fruits secs (pruneaux, abricots) ou fruit frais.
- **Activité** : 20 à 30 minutes de marche.
- **Toilettes** : à heure fixe, sans forcer, pieds surélevés.

### Après l’accouchement
La première selle peut faire appréhender, surtout après une déchirure ou une épisiotomie. Continuer à boire, manger des fibres, marcher, et demander à la maternité un traitement adapté si besoin rend souvent les choses plus simples. Ne restez pas avec une douleur : parlez-en à l’équipe.

## Questions fréquentes
**Quels laxatifs sont possibles ?**
Si les mesures simples ne suffisent pas, le médecin ou la sage-femme peut prescrire de préférence des laxatifs « de lest » ou « osmotiques ». Ne choisissez pas seule.

**Le fer prescrit me constipe, puis-je l’arrêter ?**
Parlez-en avant : une autre forme ou un autre moment de prise peut être proposé.

**Les hémorroïdes vont-elles disparaître ?**
Elles s’améliorent souvent après l’accouchement ; un traitement peut soulager en attendant.

**Le pruneau, ça marche ?**
Les fruits secs font partie des aliments riches en fibres qui peuvent aider.

**La constipation peut-elle durer après l’accouchement ?**
Elle est fréquente les premiers jours ; les mêmes gestes aident, et un traitement peut être proposé à la maternité.

## Quand demander conseil
Consultez en cas de saignement anal, de douleur intense, d’absence de selles depuis plusieurs jours avec ventre gonflé ou douloureux, ou de vomissements. Toute **douleur abdominale avec contractions** doit faire appeler la maternité. ${URG}

${FIN}`,
  }),
  a({
    slug: 'jambes-lourdes-crampes-gonflements-grossesse',
    title: 'Jambes lourdes, chevilles qui gonflent, crampes',
    summary: 'Les bons réflexes pour soulager les jambes pendant la grossesse, et les signes qui doivent faire consulter rapidement.',
    category: 'corps-grossesse', tags: ['jambes lourdes', 'varices', 'œdème', 'crampes', 'contention'],
    sources: [S.ameliJambes, S.santeCalendrier],
    body_md: `## En bref
- Jambes lourdes, **chevilles gonflées** et **varices** sont fréquentes pendant la grossesse.
- **Marchez** au moins 20 minutes par jour, **surélevez le pied du lit** et évitez la **chaleur** sur les jambes.
- Des **bas de contention** peuvent être prescrits, notamment pour les longs trajets.
- Un **gonflement brutal** du visage ou des mains, ou **une jambe douloureuse, chaude et gonflée**, doivent faire **consulter rapidement**.

## Comprendre
Pendant la grossesse, le volume de sang augmente, les hormones dilatent les veines et l’utérus gêne le retour du sang des jambes vers le cœur. Résultat : sensation de lourdeur, chevilles qui gonflent en fin de journée, parfois varices. Les crampes, souvent nocturnes, sont aussi fréquentes.

La plupart de ces gênes se soulagent avec des gestes simples. Certains signes demandent toutefois un avis rapide : un gonflement brutal (surtout du visage et des mains) peut être lié à une hypertension, et une jambe douloureuse, rouge, chaude et gonflée d’un seul côté peut évoquer une phlébite.

## Au quotidien
- **Bougez** : marche, natation, vélo doux ; préférez les escaliers.
- **Au repos**, gardez les jambes allongées plutôt que pliées ; surélevez le pied du lit de 10 à 15 cm plutôt que de mettre un oreiller sous les pieds.
- **Pendant les pauses**, faites des flexions et rotations des pieds.
- **Évitez la chaleur** : bains chauds, sauna, hammam, épilation à la cire chaude, soleil prolongé ; terminez la douche par un jet frais sur les jambes.
- **Vêtements** : rien de serrant aux jambes ; talons de 3 cm maximum.
- **Crampes** : étirez doucement le mollet (pointe du pied vers vous) ; parlez-en si elles sont fréquentes.
- **Longs trajets** : pauses régulières, marche, et contention si elle vous a été prescrite.

### Exercices simples (à faire plusieurs fois par jour)
- Assise : pointes de pied vers vous puis vers l’avant, 10 fois.
- Rotations des chevilles dans les deux sens.
- Allongée, jambes surélevées sur un coussin pendant quelques minutes.
- Marche sur la pointe des pieds quelques pas, si vous êtes stable.
Arrêtez au moindre malaise ou douleur inhabituelle.

## Questions fréquentes
**Les bas de contention sont-ils remboursés ?**
Ils sont pris en charge sur prescription ; demandez à votre médecin ou sage-femme.

**Les veinotoniques sont-ils efficaces ?**
Ils peuvent soulager temporairement mais ne préviennent pas l’aggravation ; ils ne remplacent ni les bons gestes ni la contention. Demandez conseil avant tout médicament.

**Mes varices vont-elles disparaître ?**
Elles s’améliorent souvent après l’accouchement ; parlez-en au suivi postnatal si elles persistent.

**Est-ce grave si mes chevilles gonflent le soir ?**
Un gonflement progressif des chevilles en fin de journée est fréquent ; un gonflement brutal ou du visage doit faire consulter.

**Faut-il porter la contention toute la journée ?**
Suivez la prescription : elle s’enfile en général le matin, avant que les jambes ne gonflent.

## Quand demander conseil
Consultez **en urgence** (maternité, médecin) en cas de gonflement brutal du visage ou des mains, de maux de tête intenses, de troubles de la vue, ou si une jambe devient douloureuse, chaude et gonflée. **Essoufflement brutal ou douleur dans la poitrine : appelez le 15.** ${URG}

${FIN}`,
  }),
  a({
    slug: 'infections-urinaires-et-pertes-vaginales-grossesse',
    title: 'Infections urinaires et pertes vaginales pendant la grossesse',
    summary: 'Pourquoi les infections urinaires sont surveillées chaque mois, et quand des pertes doivent faire consulter.',
    category: 'sante-grossesse', tags: ['infection urinaire', 'cystite', 'pertes', 'mycose', 'vaginite'],
    sources: [S.ameliInfectionsBact, S.ameliMensuel],
    body_md: `## En bref
- Les **infections urinaires** sont **fréquentes** pendant la grossesse et parfois **sans symptôme**.
- Une **bandelette urinaire** est faite **chaque mois** à partir du 4e mois ; si elle est positive, un **ECBU** confirme l’infection.
- Le risque principal est l’infection des **reins**, qui peut entraîner un accouchement prématuré : une cystite se **traite rapidement**.
- Des **pertes inhabituelles** (odeur, couleur, démangeaisons) demandent un **prélèvement**, car le traitement peut protéger le bébé.

## Comprendre
Pendant la grossesse, les voies urinaires se dilatent et le flux est ralenti : les bactéries s’installent plus facilement. Les signes typiques (brûlures en urinant, envies fréquentes, douleurs du bas du ventre) peuvent être discrets. C’est pourquoi on surveille les urines à chaque consultation. Une infection traitée tôt par un antibiotique adapté à la grossesse évite qu’elle remonte vers les reins ; un ECBU de contrôle est fait après le traitement.

Les pertes vaginales augmentent souvent pendant la grossesse : des pertes blanches, sans odeur ni gêne, sont fréquentes. En revanche, des pertes qui changent de couleur, d’odeur, ou s’accompagnent de démangeaisons ou de brûlures peuvent révéler une **vaginite**, dont la moitié environ sont des **mycoses**. Le diagnostic se fait par prélèvement vaginal ; une infection bactérienne est traitée, car elle peut se transmettre au bébé à l’accouchement.

## Au quotidien
- **Buvez régulièrement** et **ne retenez pas** l’envie d’uriner ; urinez après les rapports.
- **Toilette intime** : à l’eau ou avec un produit doux, d’avant en arrière, sans douche vaginale.
- **Sous-vêtements** en coton, pas trop serrés.
- **Ne prenez pas** de traitement contre une mycose ou une cystite sans avis : demandez à votre sage-femme, médecin ou pharmacien.

### Comment se passe un ECBU ?
On vous demande de recueillir les urines du milieu du jet dans un flacon stérile, après une toilette intime, idéalement avec les premières urines du matin. Le laboratoire recherche des bactéries et teste les antibiotiques efficaces. Le résultat guide le traitement ; un contrôle est fait après la fin du traitement.

## Questions fréquentes
**Pourquoi traiter une infection sans symptôme ?**
Parce qu’elle peut remonter vers les reins et favoriser un accouchement prématuré.

**J’ai beaucoup de pertes blanches, est-ce un problème ?**
Des pertes plus abondantes sont fréquentes ; consultez si elles changent d’aspect ou d’odeur, ou si elles vous gênent.

**Comment distinguer pertes et perte des eaux ?**
La perte des eaux est un écoulement de liquide clair, souvent continu ; en cas de doute, appelez la maternité.

**Les canneberges suffisent-elles ?**
Elles ne remplacent pas un traitement : une infection pendant la grossesse doit être soignée.

**Puis-je avoir des rapports avec une mycose ?**
Il est préférable d’attendre la fin du traitement ; parlez-en à votre professionnel, le traitement du partenaire peut parfois être proposé.

## Quand demander conseil
Consultez rapidement en cas de brûlures urinaires, de sang dans les urines, de pertes inhabituelles. Consultez **en urgence** en cas de **fièvre**, de **douleur dans le dos ou sur le côté** (signes d’infection du rein), de **perte de liquide** ou de **contractions** avant 37 SA. ${URG}

${FIN}`,
  }),
  a({
    slug: 'streptocoque-b-grossesse',
    title: 'Le streptocoque B : un prélèvement en fin de grossesse',
    summary: 'Pourquoi un prélèvement vaginal est fait entre 35 et 38 SA, et ce qui se passe s’il est positif.',
    category: 'suivi-grossesse', tags: ['streptocoque b', 'prélèvement', 'antibiotique', 'accouchement'], min_week: 33,
    sources: [S.ameliInfectionsBact, S.sante8eMois],
    body_md: `## En bref
- Le **streptocoque B** est une bactérie que **3 à 5 %** des femmes enceintes portent **sans symptôme**.
- Un **prélèvement vaginal** est fait **systématiquement entre 35 et 38 SA**.
- S’il est positif, un **antibiotique** est donné **pendant le travail** (ou à la rupture de la poche des eaux) pour protéger le bébé.
- Ce n’est **pas une maladie** chez vous et cela ne dit rien de votre hygiène.

## Comprendre
Cette bactérie vit naturellement dans l’intestin et le vagin de certaines personnes, sans les rendre malades. Le risque concerne le nouveau-né, qui peut être contaminé au moment de l’accouchement et, rarement, développer une infection grave. Le dépistage en fin de grossesse permet d’identifier les femmes porteuses et de leur donner un antibiotique au bon moment, ce qui protège le bébé.

## Au quotidien
- **Faites le prélèvement** à la date prévue : c’est un geste simple et rapide, que vous pouvez parfois réaliser vous-même selon les consignes.
- **Notez le résultat** et vérifiez qu’il figure dans votre dossier de maternité.
- **Le jour J**, rappelez-le à l’équipe si vous êtes positive, surtout si vous perdez les eaux.
- **Pas de traitement avant** : l’antibiotique est donné pendant le travail, pas pendant la grossesse.

### Ce qui se passe le jour de l’accouchement
Si vous êtes porteuse, l’antibiotique est administré par perfusion pendant le travail, idéalement quelques heures avant la naissance pour être le plus efficace. Il est aussi proposé si la poche des eaux se rompt avant le travail. Si vous arrivez avec un travail très rapide, l’équipe adapte la surveillance du bébé après la naissance.

### Et sans résultat ?
Si le prélèvement n’a pas été fait ou que le résultat n’est pas disponible, l’équipe décide selon la situation (prématurité, fièvre, durée depuis la rupture de la poche des eaux).

### Le prélèvement en pratique
Il s’agit d’un écouvillon passé dans le vagin, parfois aussi près de l’anus selon les consignes. Il est indolore et rapide. Le résultat arrive en quelques jours et est versé à votre dossier ; vérifiez qu’il est bien disponible avant la date prévue d’accouchement.

## Questions fréquentes
**Je suis positive : vais-je devoir accoucher autrement ?**
Non, la voie d’accouchement n’est pas modifiée ; l’antibiotique est simplement donné pendant le travail.

**Mon bébé sera-t-il surveillé ?**
Une surveillance adaptée est organisée à la naissance selon la situation.

**J’étais positive lors d’une grossesse précédente.**
Signalez-le : l’équipe en tiendra compte.

**Pourquoi pas plus tôt dans la grossesse ?**
Le portage peut varier ; le prélèvement fait en fin de grossesse reflète mieux la situation au moment de l’accouchement.

**Le bébé doit-il recevoir un traitement ?**
Pas systématiquement ; une surveillance est organisée et un traitement n’est donné qu’en cas de besoin.

## Quand demander conseil
Si vous perdez les eaux, allez à la maternité, en particulier si vous êtes porteuse du streptocoque B ou si vous n’avez pas encore le résultat. Consultez en cas de fièvre. ${URG}

${FIN}`,
  }),
  a({
    slug: 'groupe-sanguin-rhesus-negatif-grossesse',
    title: 'Rhésus négatif : ce que cela change pendant la grossesse',
    summary: 'Pourquoi on recherche des anticorps (RAI) quand on est rhésus négatif, et à quoi sert l’injection d’immunoglobulines anti-D.',
    category: 'suivi-grossesse', tags: ['rhésus', 'groupe sanguin', 'rai', 'anti-d'],
    sources: [S.ameliMensuel, S.hasAntiD, S.efsRhd],
    body_md: `## En bref
- Le **groupe sanguin et le rhésus** sont déterminés au début de la grossesse.
- Si vous êtes **rhésus négatif**, une **recherche d’agglutinines irrégulières (RAI)** est faite au **6e et au 8e mois**.
- Des **immunoglobulines anti-D** peuvent vous être injectées dans certaines situations, pour éviter que votre organisme fabrique des anticorps contre les globules rouges du bébé.
- Ce suivi protège surtout les **grossesses suivantes**.

## Comprendre
Le rhésus est une caractéristique des globules rouges : positif ou négatif. Si vous êtes rhésus négatif et que le bébé est rhésus positif (hérité de l’autre parent), un passage de sang du bébé vers vous (lors d’un saignement, d’un choc, d’un geste comme la version ou au moment de l’accouchement) peut amener votre organisme à produire des anticorps. Ces anticorps peuvent, lors d’une grossesse suivante, attaquer les globules rouges d’un bébé rhésus positif.

C’est pourquoi on surveille l’apparition éventuelle de ces anticorps (RAI) et on peut injecter des **immunoglobulines anti-D**, qui empêchent cette « immunisation ». L’équipe vous indiquera quand cette injection est utile (par exemple après un saignement, un choc sur le ventre, une version par manœuvre externe, ou après l’accouchement selon le rhésus du bébé).

## Au quotidien
- **Gardez votre carte de groupe sanguin** avec votre dossier de grossesse.
- **Signalez immédiatement** tout saignement ou choc sur le ventre (chute, accident) : une injection peut être nécessaire rapidement.
- **Faites les RAI** aux dates prévues.
- **Lors d’une prochaine grossesse**, rappelez les injections reçues.

### Situations où l’injection peut être proposée
D’après les indications rappelées par la Haute Autorité de santé : saignement pendant la grossesse, choc sur le ventre, version par manœuvre externe, certains examens invasifs (amniocentèse, biopsie de trophoblaste), fausse couche, grossesse extra-utérine ou interruption de grossesse, et après l’accouchement si le bébé est rhésus positif. Une injection systématique vers 28 semaines d’aménorrhée est aussi recommandée ; votre équipe vous dira si elle vous concerne.

## Questions fréquentes
**Je suis rhésus négatif, mon bébé est-il en danger ?**
Lors d’une première grossesse, le risque est faible ; le suivi sert surtout à éviter une immunisation qui toucherait les grossesses suivantes.

**Et si mon partenaire est aussi rhésus négatif ?**
Le bébé sera alors rhésus négatif ; parlez-en avec l’équipe, qui adaptera le suivi.

**L’injection est-elle risquée ?**
Elle est utilisée depuis longtemps ; l’équipe vous en explique l’intérêt et les modalités.

**Faut-il refaire le groupe sanguin ?**
Deux déterminations sont nécessaires ; votre carte de groupe sanguin les indique.

**Faut-il connaître le rhésus du bébé ?**
Selon l’Établissement français du sang, une prise de sang chez la mère (génotypage RHD fœtal) peut être proposée à partir de 11 semaines d’aménorrhée : si le bébé est rhésus négatif, l’injection préventive peut être évitée. Votre équipe vous dira si cet examen vous est proposé.

## Quand demander conseil
Consultez rapidement à la maternité en cas de **saignement**, de **choc sur le ventre** ou de **chute**, en signalant que vous êtes rhésus négatif. ${URG}

${FIN}`,
  }),
  a({
    slug: 'dents-et-gencives-pendant-la-grossesse',
    title: 'Dents et gencives pendant la grossesse',
    summary: 'Gencives qui saignent, examen dentaire offert, vomissements et émail : comment prendre soin de sa bouche quand on est enceinte.',
    category: 'sante-grossesse', tags: ['dents', 'gingivite', 'dentiste', 'hygiène bucco-dentaire'],
    sources: [S.ameliDents, S.ameliProgramme],
    body_md: `## En bref
- Un **examen bucco-dentaire** est **offert** du **4e mois de grossesse** jusqu’à **6 mois après l’accouchement**.
- Une **gingivite de grossesse** (gencives rouges, gonflées, qui saignent) peut apparaître entre le 3e et le 9e mois.
- **Brossez** après chaque repas avec une brosse souple et un dentifrice fluoré.
- Après un **vomissement**, **rincez** la bouche et attendez **au moins une heure** avant de vous brosser les dents.

## Comprendre
Les hormones de la grossesse rendent les gencives plus sensibles et plus réactives à la plaque dentaire : elles peuvent gonfler et saigner au brossage. Cette gingivite disparaît généralement après l’accouchement, mais elle mérite un suivi, car des gencives en bonne santé sont importantes pour vous. Les vomissements répétés exposent aussi l’émail à l’acidité.

Le rendez-vous chez le chirurgien-dentiste permet de vérifier dents et gencives, de soigner si besoin et de recevoir des conseils, y compris pour la santé dentaire de votre enfant. L’examen est pris en charge à 100 % ; les soins éventuels sont remboursés au taux habituel.

## Au quotidien
- **Brossez doucement** mais soigneusement, en insistant sur la jonction dent-gencive.
- **Fil dentaire** avec précaution, ou **brossettes** si les espaces sont larges.
- **Après un vomissement** : rinçage à l’eau (ou bain de bouche au bicarbonate ou au fluor), puis brossage une heure après.
- **Grignotage sucré** : limitez-le, surtout en cas de nausées qui poussent à manger souvent.
- **Rendez-vous** : présentez votre carte Vitale et le formulaire de prise en charge reçu de votre caisse (ou demandez-le au dentiste).

### Penser déjà aux dents du bébé
Le rendez-vous chez le dentiste est aussi l’occasion de parler de la santé bucco-dentaire de votre enfant : éviter de goûter sa tétine ou sa cuillère, ne pas l’endormir avec un biberon sucré, commencer le brossage dès les premières dents. Des parents attentifs à leurs propres dents transmettent plus facilement les bonnes habitudes.

## Questions fréquentes
**Peut-on soigner une carie pendant la grossesse ?**
Oui, les soins dentaires sont possibles ; dites au dentiste que vous êtes enceinte, il adaptera les gestes et les médicaments.

**Mes gencives saignent, dois-je moins brosser ?**
Non, continuez à brosser, plus doucement sur la zone sensible, et consultez le dentiste.

**J’ai perdu le formulaire de l’examen offert.**
Demandez-le à votre caisse ou à votre dentiste.

**Et après l’accouchement ?**
L’examen reste offert jusqu’à la fin du 6e mois après la naissance.

**Les radiographies dentaires sont-elles possibles ?**
Signalez votre grossesse : le dentiste décidera si elles sont nécessaires et prendra les précautions adaptées.

## Quand demander conseil
Consultez rapidement en cas de douleur dentaire intense, de gonflement de la joue, de fièvre ou d’abcès : une infection dentaire doit être soignée pendant la grossesse. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ vie quotidienne
  a({
    slug: 'fortes-chaleurs-canicule-enceinte',
    title: 'Enceinte pendant une canicule : se protéger de la chaleur',
    summary: 'Boire, se rafraîchir, garder le logement frais et reconnaître les signes d’un coup de chaleur.',
    category: 'quotidien-grossesse', tags: ['chaleur', 'canicule', 'été', 'hydratation'],
    sources: [S.santeChaleur, S.ameliJambes],
    body_md: `## En bref
- Enceinte, **buvez au moins 1,5 à 2 litres d’eau par jour**, sans attendre la soif.
- **Évitez de sortir** aux heures les plus chaudes (12 h–18 h) et limitez les efforts.
- **Rafraîchissez-vous** plusieurs fois par jour et gardez le logement frais.
- Fièvre au-delà de 39 °C, peau chaude et sèche, malaise : **appelez le 15**.

## Comprendre
Pendant la grossesse, le corps produit plus de chaleur et le volume de sang augmente : la chaleur est souvent plus mal supportée, avec davantage de fatigue, de jambes lourdes et de risque de déshydratation. Une déshydratation peut aussi favoriser des contractions. Les recommandations générales en cas de fortes chaleurs s’appliquent, avec une vigilance particulière pour l’hydratation.

## Au quotidien
- **Eau** : gardez une bouteille à portée de main ; buvez régulièrement, par petites quantités.
- **Évitez** alcool (de toute façon exclu pendant la grossesse), café en excès et sodas, qui favorisent la déshydratation.
- **Rafraîchissez** visage et avant-bras, prenez des douches tièdes ; un brumisateur ou un linge humide aident.
- **Logement** : volets fermés côté soleil en journée, aération la nuit ; ventilateur ou pièce plus fraîche.
- **Sorties** : tôt le matin ou le soir, à l’ombre, chapeau et vêtements amples et clairs.
- **Jambes** : jets d’eau fraîche, jambes surélevées au repos, pas de bains chauds.
- **Repas** : légers, riches en fruits et légumes ; attention à la conservation des aliments au frais.

### Si vous devez travailler ou vous déplacer
- Emportez de l’eau et faites des pauses à l’ombre.
- Évitez les transports bondés aux heures chaudes si vous le pouvez ; asseyez-vous dès que possible.
- En voiture, ne restez jamais dans un véhicule en plein soleil ; aérez avant de partir.
- Au travail, signalez les difficultés : des aménagements peuvent être discutés avec l’employeur ou le médecin du travail.

## Questions fréquentes
**Puis-je utiliser la climatisation ?**
Oui, en évitant les écarts trop importants avec la température extérieure.

**Le soleil favorise-t-il le masque de grossesse ?**
Les taches brunes du visage sont fréquentes pendant la grossesse ; une protection solaire et un chapeau limitent leur apparition.

**Dois-je arrêter le sport l’été ?**
Adaptez : privilégiez la natation ou des séances tôt le matin, et arrêtez au moindre malaise.

**Je travaille dans un lieu très chaud.**
Parlez-en au médecin du travail.

**Les crampes et jambes lourdes sont-elles pires l’été ?**
La chaleur dilate les veines : gestes de fraîcheur et jambes surélevées soulagent.

## Quand demander conseil
Appelez le **15** en cas de température corporelle supérieure à 39 °C, de peau chaude, rouge et sèche, de maux de tête intenses, de vertiges, de confusion ou de perte de connaissance. Consultez rapidement en cas de contractions, de fièvre ou si le bébé bouge moins. **Canicule Info Service** : 0 800 06 66 66 (gratuit, 9 h–19 h). ${URG}

${FIN}`,
  }),
  a({
    slug: 'voyager-enceinte-avion-voiture-moustiques',
    title: 'Voyager enceinte : voiture, avion, destinations',
    summary: 'Préparer un trajet ou un séjour pendant la grossesse : avis médical, ceinture, pauses, moustiques et zones à risque.',
    category: 'quotidien-grossesse', tags: ['voyage', 'avion', 'voiture', 'moustiques', 'zika'],
    sources: [S.arsVoyageurs, S.ameliJambes, S.santeVaccins],
    body_md: `## En bref
- **Parlez de votre projet** de voyage à votre sage-femme ou à votre médecin, surtout en fin de grossesse ou en cas de grossesse à risque.
- En **voiture** : ceinture **toujours**, pauses **régulières** pour marcher.
- **Longs trajets** : bougez les jambes, buvez, et portez une **contention** si elle vous a été prescrite.
- **Zones à moustiques** (dengue, chikungunya, Zika) : le **report** du voyage est à envisager ; sinon, protection stricte et consultation avant le départ.

## Comprendre
La grossesse n’empêche pas de voyager, mais elle invite à anticiper : où se trouve la maternité la plus proche sur place, quelle assurance vous couvre, et quelle est la politique de la compagnie aérienne en fin de grossesse (chacune a ses règles et peut demander un certificat). Les longs trajets assis favorisent les jambes lourdes et la formation de caillots : il faut bouger régulièrement.

Certaines destinations exposent à des maladies transmises par les moustiques. Le **virus Zika** peut entraîner des atteintes chez le bébé et se transmet aussi par voie sexuelle : c’est pourquoi le report d’un voyage en zone concernée est à envisager, et l’usage du préservatif est recommandé pendant toute la grossesse en cas d’exposition du partenaire. Les vaccins « vivants » (comme celui de la fièvre jaune dans la plupart des cas) se discutent avec un médecin.

## Au quotidien
- **Avant de partir** : consultez les conseils aux voyageurs du ministère des Affaires étrangères, votre sage-femme ou un centre de vaccinations internationales.
- **Dans la voiture** : sangle du bas **sous le ventre**, sur les hanches, sangle du haut entre les seins ; pause toutes les deux heures environ.
- **En avion** : siège côté couloir pour se lever facilement, eau, mouvements des chevilles, contention si prescrite.
- **Moustiques** : vêtements couvrants, répulsif adapté à la grossesse sur avis du pharmacien, moustiquaire, climatisation ou ventilateur.
- **Emportez** votre dossier de grossesse, votre carte de groupe sanguin et la liste de vos traitements.

### Check-list avant le départ
- Avis de votre sage-femme ou de votre médecin, et certificat si la compagnie le demande.
- Assurance voyage couvrant la grossesse et l’accouchement.
- Adresse de la maternité la plus proche sur place.
- Dossier de grossesse, carte de groupe sanguin, traitements.
- Contention prescrite pour les longs trajets.
- Répulsifs adaptés et moustiquaire si nécessaire.

## Questions fréquentes
**Jusqu’à quand puis-je prendre l’avion ?**
Cela dépend de votre santé et des règles de chaque compagnie ; demandez l’avis de votre professionnel et vérifiez auprès de la compagnie.

**La ceinture de sécurité peut-elle faire mal au bébé ?**
Bien positionnée sous le ventre, elle vous protège tous les deux : ne roulez jamais sans.

**Puis-je partir en zone de paludisme ?**
Le report est souvent conseillé ; sinon, une consultation spécialisée est indispensable avant le départ.

**Au retour, que surveiller ?**
Pendant 3 semaines, consultez en cas de fièvre, d’éruption, de douleurs articulaires ou de maux de tête, en précisant votre voyage.

**Puis-je faire de la randonnée en altitude ?**
Demandez l’avis de votre professionnel : l’altitude, l’effort et l’éloignement des soins sont à prendre en compte.

## Quand demander conseil
Pendant le voyage, consultez sans attendre en cas de saignements, de douleurs, de contractions, de perte de liquide, de fièvre, d’une jambe douloureuse et gonflée, ou si le bébé bouge moins. ${URG} En Europe, le 112 fonctionne partout.

${FIN}`,
  }),
  // ------------------------------------------------------------------ préparer la naissance et accoucher
  a({
    slug: 'choisir-et-s-inscrire-en-maternite',
    title: 'Choisir sa maternité et s’y inscrire',
    summary: 'Niveaux de maternité, critères de choix, tarifs dans le privé et dispositif pour les femmes qui vivent loin.',
    category: 'accouchement', tags: ['maternité', 'inscription', 'niveau 1 2 3', 'engagement maternité'], max_week: 28,
    sources: [S.ameliPreparation, S.santePrematures, S.ameliAccouchement],
    body_md: `## En bref
- Il existe **trois niveaux** de maternité, selon l’**équipement** (et non la qualité) : du niveau 1 (grossesses sans complication) au niveau 3 (réanimation néonatale).
- Le choix se fait **avec votre médecin ou votre sage-femme**, selon votre santé et celle du bébé.
- **Inscrivez-vous tôt** : dans certaines villes, les places partent vite.
- Si vous habitez à **plus de 45 minutes** d’une maternité, le dispositif **« Engagement maternité »** peut prendre en charge hébergement et transports.

## Comprendre
**Les niveaux.** Une maternité de niveau 1 accueille les grossesses sans complication prévisible. Le niveau 2 dispose d’un service de néonatalogie pour les bébés qui ont besoin de soins sans réanimation. Le niveau 3 possède une réanimation néonatale, pour les grandes prématurités et les situations les plus à risque. En cas de risque particulier (prématurité annoncée, grossesse multiple compliquée…), l’équipe vous orientera vers un niveau adapté, parfois en cours de grossesse.

**Les critères de choix.** Au-delà de la distance, comparez : les services proposés, les possibilités d’accompagnement par le professionnel de votre choix, les méthodes d’accouchement et de soulagement de la douleur, l’accompagnement de l’allaitement, la présence du second parent, les chambres individuelles.

**Le coût.** Dans le privé, la prise en charge à 100 % porte sur le tarif de base : renseignez-vous sur les dépassements d’honoraires et les suppléments (chambre individuelle), et sur ce que rembourse votre complémentaire santé.

## Au quotidien
- **Renseignez-vous** au début de la grossesse : site de la maternité, réunions d’information, visites.
- **Posez vos questions** : accompagnement, salle nature, péridurale, peau à peau, durée du séjour, suivi à domicile.
- **Gardez votre dossier** à jour et emportez-le si vous devez consulter dans une autre maternité en urgence.
- **Vous vivez loin ?** Parlez de l’« Engagement maternité » à votre médecin dès le début.

### Questions à poser lors d’une visite
- Qui m’accompagnera pendant le travail ? Puis-je être suivie par ma sage-femme libérale ?
- Quels moyens pour soulager la douleur, en plus de la péridurale ?
- Le peau à peau et la première tétée sont-ils favorisés, y compris après une césarienne ?
- Combien de temps dure le séjour ? Un suivi à domicile est-il organisé ensuite ?
- Le second parent peut-il rester la nuit ?
- Comment se passe l’accueil en cas d’urgence ?

## Questions fréquentes
**Une maternité de niveau 3 est-elle « meilleure » ?**
Non, les niveaux reflètent l’équipement pour les bébés malades ou prématurés, pas la qualité. Pour une grossesse sans complication, un niveau 1 convient.

**Puis-je changer de maternité en cours de grossesse ?**
Oui, prévenez l’équipe et transmettez votre dossier.

**En cas d’urgence, dois-je aller dans « ma » maternité ?**
En urgence, rendez-vous à la plus proche ou appelez le 15, qui vous orientera.

**Mon conjoint peut-il rester la nuit ?**
Cela dépend des établissements : posez la question lors de l’inscription.

**Puis-je accoucher en maison de naissance ?**
Des maisons de naissance existent pour certaines grossesses sans complication ; renseignez-vous auprès de votre sage-femme.

## Quand demander conseil
Pour le choix, parlez-en à votre sage-femme ou à votre médecin. Pendant la grossesse, en cas de saignements, de contractions, de perte de liquide ou si le bébé bouge moins, appelez la maternité. ${URG}

${FIN}`,
  }),
  a({
    slug: 'quand-partir-a-la-maternite',
    title: 'Contractions, perte des eaux : quand partir à la maternité ?',
    summary: 'Reconnaître le début du travail, ce qu’est le bouchon muqueux, et les situations où il faut partir tout de suite.',
    category: 'accouchement', tags: ['travail', 'contractions', 'perte des eaux', 'bouchon muqueux'], min_week: 30, safety_critical: true,
    sources: [S.ameliAccouchement, S.sante9eMois],
    body_md: `## En bref
- Le travail commence le plus souvent par des **contractions** qui deviennent **régulières**, **plus fortes** et **plus rapprochées**.
- La **perte des eaux** (écoulement de liquide clair) : **partez à la maternité**, même sans contractions.
- La **perte du bouchon muqueux** (glaires parfois teintées de sang) annonce que l’accouchement approche, sans urgence.
- **Saignements rouges, fièvre, bébé qui bouge moins, douleur continue** : **partez ou appelez tout de suite**.

## Comprendre
En fin de grossesse, l’utérus se contracte souvent de façon irrégulière : ces contractions « d’entraînement » durcissent le ventre sans s’intensifier. Les contractions du travail, elles, reviennent à intervalles réguliers, se rapprochent, durent plus longtemps et deviennent plus intenses : elles font progressivement ouvrir le col de l’utérus. Pour un premier bébé, la phase de dilatation dure en moyenne autour de 8 heures ; elle est souvent plus courte pour les accouchements suivants.

La poche des eaux peut se rompre avant ou pendant le travail. Une fois rompue, il faut aller à la maternité, même si les contractions ne sont pas encore fortes, pour vérifier le bien-être du bébé et prévenir une infection.

La plupart des naissances ont lieu entre 37 et 42 SA.

## Au quotidien
- **Chronométrez** les contractions (début de l’une au début de la suivante) et notez leur durée.
- **Prenez une douche ou un bain** si les eaux ne sont pas rompues, marchez, changez de position, respirez : cela aide à vivre les premières contractions.
- **Buvez** ; pendant le travail à la maternité, seuls les liquides clairs sont généralement autorisés.
- **Préparez** la valise, les papiers (carte Vitale, dossier, carte de groupe sanguin, acte de reconnaissance) et le trajet à l’avance.
- **Demandez à votre maternité** à partir de quel rythme de contractions elle souhaite vous voir : les consignes peuvent varier.

### Le trajet
Repérez le trajet à l’avance et prévoyez une solution de secours (proche, taxi). Le transport vers la maternité peut, dans certaines situations, faire l’objet d’une prise en charge : renseignez-vous auprès de votre caisse. Ne conduisez pas vous-même pendant le travail.

## Questions fréquentes
**Je ne sais pas si j’ai perdu les eaux.**
Mettez une protection et observez ; en cas de doute, appelez la maternité : un examen simple permet de vérifier.

**J’ai perdu le bouchon muqueux, dois-je partir ?**
Pas forcément ; attendez des contractions régulières, sauf si vous perdez du sang rouge ou du liquide.

**Le liquide est verdâtre ou teinté.**
Partez à la maternité sans attendre.

**Mes contractions sont irrégulières depuis des heures et je suis épuisée.**
Appelez la maternité : elle vous dira si vous devez venir.

**Puis-je manger avant de partir ?**
Un repas léger en début de travail est souvent possible ; à la maternité, seuls les liquides clairs sont généralement autorisés.

## Quand demander conseil
Partez à la maternité (ou appelez-la) **sans attendre** en cas de perte des eaux, de saignements, de contractions régulières **avant 37 SA**, de fièvre, de douleur continue du ventre, de maux de tête intenses avec troubles de la vue, ou si le bébé **bouge moins**. Si vous ne pouvez pas vous déplacer ou si l’accouchement semble imminent, appelez le **15**. ${URG}

${FIN}`,
  }),
  a({
    slug: 'peridurale-et-soulager-la-douleur-accouchement',
    title: 'Péridurale et autres moyens de soulager la douleur',
    summary: 'Comment fonctionne la péridurale, ce qu’apportent la mobilité, l’eau ou les massages, et comment en discuter avant le jour J.',
    category: 'accouchement', tags: ['péridurale', 'douleur', 'accouchement', 'anesthésie'], min_week: 24,
    sources: [S.ameliAccouchement, S.sante8eMois, S.ameliPreparation],
    body_md: `## En bref
- La **péridurale** soulage la douleur des contractions **sans perte de conscience**.
- Elle est posée par un **médecin anesthésiste**, et une **pompe** permet souvent d’ajuster soi-même, sous contrôle.
- La **consultation d’anesthésie** du 8e mois est **obligatoire**, mais **ne vous engage pas** à en avoir une.
- D’autres moyens aident : **bouger**, **bain ou douche**, **massages**, respiration, présence de l’accompagnant.

## Comprendre
La péridurale (analgésie locorégionale) consiste à placer un fin cathéter dans le bas du dos, au début du travail. Un produit anesthésiant y diffuse et diminue fortement la douleur des contractions, tout en vous laissant consciente de la naissance. Dans de nombreuses maternités, une petite pompe vous permet de vous administrer des doses supplémentaires, dans des limites fixées par l’équipe.

Elle n’est pas obligatoire : certaines femmes préfèrent s’en passer, d’autres la demandent dès que possible, d’autres changent d’avis en cours de travail. La consultation d’anesthésie au 8e mois sert à vérifier qu’il n’y a pas de contre-indication, pour que ce choix reste possible le jour J, et aussi pour votre sécurité si une césarienne devenait nécessaire.

Les autres moyens ne s’opposent pas à la péridurale : la **mobilité** (marcher, changer de position, ballon), l’**eau chaude** (bain, douche), les **massages**, la **respiration** apprise pendant la préparation à la naissance, l’ambiance calme et le soutien de la personne qui vous accompagne.

## Au quotidien
- **Préparez vos questions** pour la consultation d’anesthésie : antécédents, allergies, traitements, peurs.
- **Renseignez-vous** sur ce que propose votre maternité : salle nature, baignoire, ballons, accompagnement.
- **Entraînez-vous** aux respirations et positions vues en préparation à la naissance.
- **Notez vos souhaits** dans votre projet de naissance, en gardant de la souplesse.

### Le rôle de l’accompagnant
La personne qui vous accompagne peut beaucoup : vous rappeler de respirer, vous masser le bas du dos, vous proposer à boire, vous aider à changer de position, parler à l’équipe quand vous n’en avez pas la force. Préparez ensemble vos souhaits et vos signaux : comment lui dire que vous voulez de l’aide, du silence, ou la péridurale.

## Questions fréquentes
**La péridurale peut-elle me rendre l’accouchement plus long ?**
Elle peut modifier le déroulement du travail ; l’équipe adapte la surveillance et vous accompagne pour la poussée.

**Puis-je la demander à tout moment ?**
Elle est posée pendant le travail, selon l’avancée et la disponibilité de l’anesthésiste ; parlez-en tôt à la sage-femme.

**Est-ce que je sentirai encore quelque chose ?**
Souvent une sensation de pression ou de poussée, avec une douleur bien moindre.

**Et si je ne veux pas de péridurale ?**
C’est votre choix ; dites-le à l’équipe et à votre accompagnant.

**La péridurale est-elle possible si j’ai un tatouage dans le bas du dos ?**
Parlez-en lors de la consultation d’anesthésie : le médecin vous dira ce qui est possible.

## Quand demander conseil
Parlez de vos craintes de l’accouchement à votre sage-femme dès la grossesse : une peur très forte peut s’accompagner. En cas de détresse, le **3114** répond jour et nuit. Pendant la grossesse, en cas de contractions avant 37 SA, de saignements ou de perte de liquide, appelez la maternité. ${URG}

${FIN}`,
  }),
  a({
    slug: 'cesarienne-programmee-ou-en-urgence',
    title: 'La césarienne : programmée ou en cours de travail',
    summary: 'Dans quelles situations une césarienne est proposée, comment elle se déroule et ce qu’il faut savoir pour la suite.',
    category: 'accouchement', tags: ['césarienne', 'accouchement', 'anesthésie', 'siège'], min_week: 28,
    sources: [S.santeCesarienne, S.ameliAccouchement, S.sante8eMois],
    body_md: `## En bref
- La césarienne est une **intervention chirurgicale** qui permet la naissance par une incision du ventre et de l’utérus.
- Elle peut être **programmée** (souvent vers **39 SA**) ou décidée **pendant le travail**.
- Elle se fait le plus souvent sous **anesthésie locorégionale** : vous êtes **consciente** à la naissance.
- Une césarienne antérieure n’impose pas toujours une nouvelle césarienne : une **voie basse** est souvent proposée.

## Comprendre
**Césarienne programmée.** Elle peut être proposée quand des difficultés sont prévisibles : certaines présentations du bébé (siège dans certaines situations, présentation transverse), certaines grossesses gémellaires selon la position des bébés, un poids estimé très élevé (notamment en cas de diabète), un placenta mal positionné, certaines infections. Une demande de la mère, seule, n’est pas en soi une indication systématique : elle se discute avec l’équipe. Elle est programmée au plus près du terme pour limiter les difficultés respiratoires du bébé.

**Césarienne pendant le travail.** Elle est décidée si le travail ne progresse pas, si le bébé supporte mal les contractions (signes au monitoring) ou en cas de complication.

**Déroulement.** Au bloc opératoire, l’anesthésie est le plus souvent une rachianesthésie ou une péridurale : seul le bas du corps est endormi. Une anesthésie générale reste possible en urgence. L’accompagnant peut souvent être présent, selon les maternités et la situation.

Comme toute chirurgie, la césarienne comporte des risques (dont la phlébite) et demande une récupération : on se lève assez vite après l’intervention, mais la cicatrice et la fatigue demandent de l’aide les premières semaines. Lors d’une grossesse suivante, l’équipe tient compte de la cicatrice de l’utérus.

## Au quotidien
- **Posez vos questions** à l’avance : présence de l’accompagnant, peau à peau au bloc, allaitement.
- **Préparez l’après** : aide à la maison, éviter de porter lourd au début, organisation des nuits.
- **Après la naissance**, levez-vous et marchez dès que l’équipe le propose : cela aide la récupération et limite le risque de phlébite.
- **Soutien émotionnel** : une césarienne non prévue peut être difficile à vivre ; en parler aide.

### Les premiers jours après une césarienne
Une sonde urinaire et une perfusion sont souvent retirées dans les heures qui suivent. Le lever se fait rapidement, avec de l’aide. La douleur est traitée par des médicaments compatibles avec l’allaitement. Pour porter le bébé, installez-vous assise avec des coussins ; demandez de l’aide pour le changer ou le baigner les premiers jours.

## Questions fréquentes
**Pourrai-je faire du peau à peau ?**
Souvent oui, au bloc ou en salle de réveil, selon votre état et celui du bébé ; dites que vous le souhaitez.

**Pourrai-je allaiter ?**
Oui, l’allaitement est possible après une césarienne ; demandez de l’aide pour trouver des positions confortables.

**Aurai-je forcément une césarienne la prochaine fois ?**
Non, une voie basse est souvent possible ; cela se discute selon votre situation.

**Combien de temps reste-t-on à la maternité ?**
En général un peu plus longtemps qu’après une voie basse ; la durée dépend de votre récupération.

**Quand pourrai-je conduire ?**
Demandez au professionnel qui vous suit : cela dépend de votre douleur et de votre récupération.

## Quand demander conseil
Après une césarienne, consultez rapidement en cas de fièvre, de cicatrice rouge, chaude ou qui coule, de saignements abondants, de douleur importante, ou d’une jambe douloureuse et gonflée. **Essoufflement brutal ou douleur dans la poitrine : appelez le 15.** ${URG}

${FIN}`,
  }),
  a({
    slug: 'declenchement-et-terme-depasse',
    title: 'Déclenchement de l’accouchement et terme dépassé',
    summary: 'Pourquoi un accouchement peut être déclenché, comment se passe la surveillance après la date prévue et ce que vous pouvez demander.',
    category: 'accouchement', tags: ['déclenchement', 'terme dépassé', 'ocytocine', 'surveillance'], min_week: 37,
    sources: [S.ameliAccouchement, S.sante9eMois, S.santeCalendrier],
    body_md: `## En bref
- La plupart des accouchements ont lieu **entre 37 et 42 SA** ; le terme se situe autour de **41 SA**.
- Après la date prévue, une **surveillance rapprochée** du bébé et de la grossesse est organisée par la maternité.
- Un **déclenchement** peut être décidé pour **raison médicale**, ou parfois **à la demande** (déclenchement « de convenance »), selon les conditions.
- Le déclenchement se fait avec des **méthodes** qui préparent le col et/ou provoquent des contractions.

## Comprendre
Le « terme » n’est pas une date exacte mais une période. Quand la date prévue est dépassée, la maternité vous propose des consultations rapprochées pour vérifier que le bébé va bien (monitoring, quantité de liquide amniotique) et pour discuter de la suite. Au-delà d’un certain délai, ou si la surveillance montre un besoin, un déclenchement est proposé.

Un déclenchement peut aussi être décidé avant le terme pour une raison médicale (hypertension, diabète, rupture prolongée de la poche des eaux, croissance du bébé…). Le déclenchement « de convenance », sans raison médicale, peut parfois être discuté en fin de grossesse lorsque les conditions sont favorables.

Les méthodes varient : préparation du col, rupture de la poche des eaux, perfusion d’ocytocine pour provoquer ou renforcer les contractions. L’équipe vous explique celle qui est proposée et le temps que cela peut prendre.

## Au quotidien
- **Gardez vos rendez-vous** de surveillance après la date prévue, même si tout va bien.
- **Soyez attentive aux mouvements** du bébé ; même s’il a moins de place, il doit continuer à bouger.
- **Préparez-vous à une attente** : un déclenchement peut prendre plusieurs heures, voire plus ; emportez de quoi vous occuper.
- **Posez vos questions** : raisons, méthode, possibilité de péridurale, délais.

### Ce qui peut se passer en pratique
Après la date prévue, on vous propose en général des rendez-vous rapprochés à la maternité, avec un enregistrement du rythme cardiaque du bébé et une évaluation du liquide amniotique. Entre deux rendez-vous, vous restez attentive aux mouvements du bébé, aux contractions et aux pertes. Si un déclenchement est décidé, on vous indique quand venir, quoi apporter et combien de temps cela peut prendre.

## Questions fréquentes
**Un déclenchement est-il plus douloureux ?**
Le ressenti varie ; les moyens de soulager la douleur, dont la péridurale, restent possibles.

**Puis-je refuser un déclenchement ?**
Vous pouvez en discuter et demander des explications ; l’équipe vous présente les bénéfices et les risques selon votre situation.

**Les méthodes « naturelles » font-elles venir le travail ?**
Demandez conseil avant d’essayer quoi que ce soit, en particulier tout produit ou plante.

**Le bébé grossit-il encore après le terme ?**
Il continue de grandir ; la surveillance permet d’évaluer sa croissance et son bien-être.

**Vais-je devoir rester hospitalisée pendant tout le déclenchement ?**
Cela dépend de la méthode et de la maternité ; demandez comment cela se passe chez vous.

## Quand demander conseil
Allez à la maternité sans attendre si le bébé **bouge moins**, si vous perdez du liquide (surtout teinté), en cas de saignements, de fièvre ou de contractions régulières. ${URG}

${FIN}`,
  }),
  a({
    slug: 'menace-accouchement-premature-et-prematurite',
    title: 'Accouchement prématuré : les signes et la prise en charge',
    summary: 'Ce qu’est la prématurité, les signes qui doivent faire consulter avant 37 SA et comment sont accueillis les bébés nés tôt.',
    category: 'accouchement', tags: ['prématurité', 'contractions', 'néonatalogie', 'maternité niveau 3'], max_week: 37, safety_critical: true,
    sources: [S.santePrematures, S.ameliInfectionsBact, S.ameliPreparation],
    body_md: `## En bref
- Un bébé est **prématuré** s’il naît **avant 37 SA**.
- On distingue la **prématurité moyenne** (33–37 SA), la **grande** (28–33 SA) et la **très grande** prématurité (avant 28 SA).
- **Contractions régulières, perte de liquide, saignements** avant 37 SA : **consultez sans attendre**.
- En cas de menace d’accouchement très prématuré, une **injection de corticoïdes** à la mère peut aider à mûrir les poumons du bébé.

## Comprendre
Le suivi de grossesse permet de repérer certaines situations à risque (infection urinaire, grossesse multiple, col qui se modifie…). Une infection urinaire non traitée, par exemple, peut favoriser un accouchement prématuré : c’est une des raisons de la bandelette mensuelle.

Lorsqu’un accouchement très prématuré se prépare, la future mère est orientée vers une maternité adaptée (niveau 2 ou 3 selon l’âge de la grossesse), qui dispose de soins pour les nouveau-nés. Les grands et très grands prématurés sont accueillis en réanimation néonatale, puis en soins intensifs et en néonatalogie : incubateur, aide respiratoire si besoin, alimentation adaptée, surveillance attentive. Les parents sont associés aux soins, et le peau à peau est encouragé dès que possible. Le retour à la maison a lieu quand le bébé respire et se nourrit de façon autonome, avec ensuite un suivi de sa croissance et de son développement.

## Au quotidien
- **Faites vos bandelettes** et analyses d’urine aux dates prévues.
- **Reposez-vous** si on vous l’a prescrit, et respectez les consignes de l’équipe (arrêt de travail, limitation des efforts).
- **Connaissez votre maternité** et le trajet, et gardez votre dossier à portée de main.
- **Si votre bébé naît prématurément**, demandez à participer aux soins, au peau à peau, et à recevoir du soutien : associations de parents, psychologues de service.

### Si votre bébé est hospitalisé en néonatalogie
- Demandez à participer aux soins (change, toilette, peau à peau) dès que possible.
- Tirez votre lait si vous souhaitez allaiter : l’équipe vous montrera comment.
- Gardez du temps pour vous reposer : les journées à l’hôpital sont fatigantes.
- N’hésitez pas à rencontrer le psychologue du service et des associations de parents de prématurés.
- Renseignez-vous sur vos droits (congé maternité, congé du second parent prolongés en cas d’hospitalisation).

## Questions fréquentes
**Des contractions avant 37 SA, est-ce forcément un accouchement prématuré ?**
Non, mais des contractions régulières ou douloureuses doivent être vérifiées rapidement à la maternité.

**Mon bébé sera-t-il transféré dans une autre maternité ?**
Si le niveau de votre maternité ne correspond pas aux besoins prévus, un transfert peut être organisé, de préférence avant la naissance.

**Pourrai-je allaiter un bébé prématuré ?**
Oui, le lait maternel est encouragé ; l’équipe vous aide à tirer votre lait et à démarrer quand le bébé est prêt.

**Le congé maternité est-il adapté ?**
Des règles particulières existent en cas d’accouchement prématuré ou d’hospitalisation du bébé ; renseignez-vous auprès de votre caisse.

**Un bébé né à 35 SA va-t-il en réanimation ?**
Pas forcément : beaucoup de bébés nés à la fin de la prématurité moyenne restent avec leur mère, avec une surveillance adaptée.

## Quand demander conseil
Allez à la maternité ou appelez-la **sans attendre** en cas de contractions régulières ou douloureuses avant 37 SA, de perte de liquide, de saignements, de fièvre ou de douleurs dans le dos ou le ventre. Si vous ne pouvez pas vous déplacer, appelez le **15**. ${URG}

${FIN}`,
  }),
  a({
    slug: 'preparer-l-allaitement-et-la-premiere-tetee',
    title: 'Se préparer à l’allaitement : la première tétée et les premiers jours',
    summary: 'Le peau à peau, la première tétée dans les heures qui suivent la naissance, le rythme à la demande et les signes qu’un bébé boit bien.',
    category: 'accouchement', tags: ['allaitement', 'première tétée', 'peau à peau', 'tétées'], min_week: 24,
    sources: [S.santePremiereTetee, S.santeRythmeTetees, S.spAbsences],
    body_md: `## En bref
- Idéalement, la **première tétée** a lieu dans les **deux heures** qui suivent la naissance, en **peau à peau**.
- Les premiers temps, l’allaitement se fait **à la demande** : souvent **8 à 12 tétées par 24 heures**.
- Le meilleur repère pour savoir si le bébé boit bien est sa **prise de poids**, suivie par un professionnel.
- Allaiter ou non est **votre choix** : vous serez accompagnée dans les deux cas.

## Comprendre
Juste après la naissance, si tout va bien, le bébé est posé nu contre vous, séché et couvert avec vous d’un linge chaud. Pendant ces premières heures, il est souvent en éveil calme, avec des réflexes de succion et de reptation très actifs : guidé par l’odeur, il peut ramper jusqu’au sein et le prendre seul. Cela peut prendre de quelques minutes à plus d’une heure ; le calme, une lumière douce et peu d’interruptions l’aident.

Les premiers jours, le bébé tète souvent et parfois peu à la fois : c’est cette fréquence qui lance et entretient la production de lait. Il donne des **signes d’éveil** avant de pleurer (yeux qui bougent, mains à la bouche, langue qui sort, petite agitation) : le proposer au sein à ce moment-là facilite la tétée. Une succion ample et lente avec des déglutitions régulières sont de bons signes ; la durée de la tétée n’est pas un critère en soi.

## Au quotidien
- **Pendant la grossesse** : renseignez-vous auprès de votre sage-femme, d’une réunion d’information ou d’une association de soutien à l’allaitement ; notez vos questions.
- **Dans le projet de naissance**, indiquez votre souhait de peau à peau et de première tétée précoce.
- **À la maternité**, demandez à être aidée pour la position et la prise du sein ; ne restez pas avec une douleur.
- **Au retour**, faites évaluer les tétées et la prise de poids (sage-femme, PMI, médecin).
- **Reprise du travail** : des pauses pour allaiter sont prévues pendant un an après la naissance (non rémunérées, sauf disposition plus favorable).

### Ce qui aide les premiers jours
- Garder le bébé près de vous, jour et nuit (cohabitation).
- Proposer le sein dès les premiers signes d’éveil.
- Varier les positions (madone, ballon de rugby, allongée) pour trouver la plus confortable.
- Vérifier la prise du sein : bouche grande ouverte, lèvres retroussées, menton contre le sein.
- Se reposer quand le bébé dort et accepter l’aide pour le reste.

## Questions fréquentes
**Faut-il préparer ses seins pendant la grossesse ?**
Il n’y a pas de préparation physique particulière à faire ; s’informer et être bien entourée aident davantage.

**Et si le bébé ne tète pas tout de suite ?**
Le peau à peau prolongé et l’aide de l’équipe permettent souvent de démarrer ; parlez-en sans attendre.

**Allaiter fait-il mal ?**
Une douleur persistante signale souvent un problème de position ou de prise du sein : demandez de l’aide rapidement.

**Je ne souhaite pas allaiter.**
C’est votre choix ; l’équipe vous accompagnera pour l’alimentation au biberon.

**Le colostrum suffit-il au bébé les premiers jours ?**
Le premier lait, en petite quantité, est adapté aux besoins du nouveau-né ; des tétées fréquentes stimulent la montée de lait.

## Quand demander conseil
Consultez rapidement si le bébé tète très peu, dort sans se réveiller pour manger, a peu de couches mouillées, ou si vous avez de la fièvre avec un sein rouge et douloureux. Pour un nouveau-né qui respire mal, devient très mou ou difficile à réveiller, appelez le **15**. ${URG}

${FIN}`,
  }),
  a({
    slug: 'attendre-des-jumeaux',
    title: 'Attendre des jumeaux : ce qui change',
    summary: 'Suivi plus rapproché, congé maternité plus long, accouchement, allaitement : les particularités d’une grossesse gémellaire.',
    category: 'grossesse', tags: ['jumeaux', 'grossesse multiple', 'gémellaire'],
    sources: [S.spCongeMaternite, S.ameliAccouchement, S.santeCesarienne, S.santeJumeaux],
    body_md: `## En bref
- Une grossesse gémellaire bénéficie d’un **suivi plus rapproché**, adapté à votre situation.
- Le **congé maternité** est plus long : **12 semaines avant** et **22 semaines après** la naissance.
- La **voie basse** est privilégiée quand c’est possible ; une **césarienne** peut être proposée selon la position des bébés.
- **Allaiter des jumeaux est possible**, avec de l’aide et de l’organisation.

## Comprendre
Porter deux bébés demande davantage à l’organisme : fatigue, nausées parfois plus marquées, ventre qui grossit plus vite, et un risque plus élevé de certaines complications (accouchement prématuré, hypertension, diabète gestationnel). Le suivi est donc adapté : échographies plus fréquentes, consultations rapprochées, et choix d’une maternité en mesure d’accueillir des bébés qui naîtraient avant terme.

Pour l’accouchement, la voie basse reste à privilégier lorsque c’est possible ; la position des bébés (notamment celle du premier) et d’autres éléments peuvent conduire l’équipe à proposer une césarienne. Ce choix se prépare avec vous au cours du 3e trimestre.

Après la naissance, l’allaitement de jumeaux est possible, parfois longtemps : l’organisme s’adapte et produit environ deux fois plus de lait quand les deux bébés tètent régulièrement. Les tétées peuvent être simultanées (gain de temps, stimulation de la lactation) ou successives (souvent plus simple au début).

## Au quotidien
- **Reposez-vous** davantage et acceptez l’aide qu’on vous propose.
- **Anticipez** : congé maternité, prime à la naissance (une par enfant à naître, sur certificat), aides de la Caf, mode de garde.
- **Préparez l’équipement** progressivement, sans tout acheter en double au départ : demandez conseil à d’autres parents de jumeaux.
- **Allaitement** : coussin adapté, positions « berceuse » ou « ballon de rugby », réveil du second bébé quand le premier s’éveille pour garder un rythme commun.
- **Entourez-vous** : associations de parents de jumeaux et d’aide à l’allaitement, PMI, proches pour les tâches ménagères.

### Organiser l’arrivée
- Pensez tôt au mode de garde et à la reprise du travail, plus complexes avec deux enfants.
- Prévoyez de l’aide concrète pour les premières semaines : repas, courses, linge.
- Renseignez-vous sur les aides de la Caf et, selon les situations, sur l’aide à domicile.
- Préparez un carnet ou une application pour noter tétées et sommeil de chaque bébé.

## Questions fréquentes
**Le congé maternité est-il vraiment plus long ?**
Oui : 34 semaines au total pour des jumeaux (12 avant, 22 après) pour une salariée du secteur privé.

**Vais-je forcément accoucher avant terme ?**
Le risque est plus élevé, mais beaucoup de jumeaux naissent proches du terme ; le suivi permet d’anticiper.

**Puis-je allaiter les deux ?**
Oui, avec un bon accompagnement ; les compléments de lait sans avis médical sont déconseillés au démarrage.

**Le second parent a-t-il un congé plus long ?**
Oui, le congé de paternité et d’accueil de l’enfant est de 32 jours pour des naissances multiples.

**Les jumeaux sont-ils toujours suivis dans une maternité de niveau 3 ?**
Pas forcément : le niveau dépend de la situation de la grossesse et du terme prévu.

## Quand demander conseil
Appelez la maternité sans attendre en cas de contractions régulières, de perte de liquide, de saignements, de maux de tête intenses avec troubles de la vue, ou si l’un des bébés bouge moins. ${URG}

${FIN}`,
  }),
];
