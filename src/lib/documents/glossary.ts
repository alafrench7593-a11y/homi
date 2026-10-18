/**
 * Petit glossaire pour l'« explication simple » : définitions GÉNÉRALES des termes courants,
 * jamais une interprétation du résultat de la personne. Chaque explication est marquée comme telle à l'écran.
 */
import { getLocale } from '@/i18n';

interface Entry { re: RegExp; term: string; fr: string; en: string }

const G: Entry[] = [
  { re: /\bh[ée]moglobine\b/i, term: 'Hémoglobine', fr: 'Protéine des globules rouges qui transporte l’oxygène dans le sang.', en: 'Protein in red blood cells that carries oxygen around the body.' },
  { re: /\bferritine\b/i, term: 'Ferritine', fr: 'Protéine qui stocke le fer ; son dosage renseigne sur les réserves en fer.', en: 'Protein that stores iron; its level gives an idea of the body’s iron stores.' },
  { re: /\bplaquettes\b/i, term: 'Plaquettes', fr: 'Cellules du sang qui participent à la coagulation.', en: 'Blood cells involved in clotting.' },
  { re: /\bleucocytes|globules blancs\b/i, term: 'Leucocytes', fr: 'Globules blancs, cellules de défense de l’organisme.', en: 'White blood cells, part of the immune system.' },
  { re: /\b(nfs|num[ée]ration formule sanguine|h[ée]mogramme)\b/i, term: 'NFS', fr: 'Numération formule sanguine : comptage des différentes cellules du sang.', en: 'Full blood count: a count of the different cells in the blood.' },
  { re: /\bglyc[ée]mie\b/i, term: 'Glycémie', fr: 'Taux de sucre (glucose) dans le sang au moment du prélèvement.', en: 'Blood sugar (glucose) level at the time of the sample.' },
  { re: /\bhba1c\b/i, term: 'HbA1c', fr: 'Hémoglobine glyquée : reflet moyen de la glycémie sur environ trois mois.', en: 'Glycated haemoglobin: reflects average blood sugar over roughly three months.' },
  { re: /\btsh\b/i, term: 'TSH', fr: 'Hormone qui pilote la thyroïde ; souvent utilisée pour en surveiller le fonctionnement.', en: 'Hormone that controls the thyroid; often used to monitor how it works.' },
  { re: /\bcrp\b/i, term: 'CRP', fr: 'Protéine C réactive : marqueur utilisé lorsqu’on recherche une inflammation.', en: 'C-reactive protein: a marker used when looking for inflammation.' },
  { re: /\bcr[ée]atinine\b/i, term: 'Créatinine', fr: 'Déchet éliminé par les reins ; son dosage sert à évaluer leur fonctionnement.', en: 'Waste product cleared by the kidneys; used to assess kidney function.' },
  { re: /\b(b[êe]ta-?hcg|β-?hcg|hcg)\b/i, term: 'hCG', fr: 'Hormone produite pendant la grossesse ; son dosage sert notamment à la confirmer.', en: 'Hormone produced during pregnancy; measured notably to confirm it.' },
  { re: /\bs[ée]rologie\b/i, term: 'Sérologie', fr: 'Recherche d’anticorps dans le sang, pour savoir si l’on a été en contact avec un microbe ou si l’on est protégé.', en: 'Test for antibodies in the blood, to see whether you have met an infection or are protected.' },
  { re: /\btoxoplasmose\b/i, term: 'Toxoplasmose', fr: 'Infection due à un parasite ; elle est surveillée pendant la grossesse.', en: 'Infection caused by a parasite; it is monitored during pregnancy.' },
  { re: /\brub[ée]ole\b/i, term: 'Rubéole', fr: 'Maladie virale contre laquelle on vérifie l’immunité avant ou pendant la grossesse.', en: 'Viral illness; immunity is checked before or during pregnancy.' },
  { re: /\brh[ée]sus\b/i, term: 'Rhésus', fr: 'Caractéristique du groupe sanguin (positif ou négatif).', en: 'Part of the blood group (positive or negative).' },
  { re: /\bagglutinines irr[ée]guli[èe]res|\brai\b/i, term: 'RAI', fr: 'Recherche d’agglutinines irrégulières : anticorps recherchés pendant la grossesse.', en: 'Irregular antibody screen, done during pregnancy.' },
  { re: /\becbu\b/i, term: 'ECBU', fr: 'Examen des urines au laboratoire, notamment pour rechercher une infection.', en: 'Urine test done in a lab, notably to look for an infection.' },
  { re: /\bprot[ée]inurie\b/i, term: 'Protéinurie', fr: 'Présence de protéines dans les urines.', en: 'Protein in the urine.' },
  { re: /\bglycosurie\b/i, term: 'Glycosurie', fr: 'Présence de sucre dans les urines.', en: 'Sugar in the urine.' },
  { re: /\b[ée]chographie\b/i, term: 'Échographie', fr: 'Examen d’imagerie par ultrasons.', en: 'Imaging test that uses ultrasound.' },
  { re: /\bbiom[ée]trie\b/i, term: 'Biométrie', fr: 'Mesures du bébé réalisées pendant l’échographie.', en: 'Measurements of the baby taken during the scan.' },
  { re: /\bbip\b/i, term: 'BIP', fr: 'Diamètre bipariétal : largeur de la tête du bébé mesurée à l’échographie.', en: 'Biparietal diameter: width of the baby’s head measured on the scan.' },
  { re: /\blcc\b/i, term: 'LCC', fr: 'Longueur crânio-caudale : longueur de l’embryon, mesurée en début de grossesse.', en: 'Crown–rump length: length of the embryo, measured early in pregnancy.' },
  { re: /\bclart[ée] nucale\b/i, term: 'Clarté nucale', fr: 'Mesure réalisée à l’échographie du premier trimestre, à la nuque du fœtus.', en: 'Nuchal translucency: a measurement taken at the first-trimester scan.' },
  { re: /\bsa\b/, term: 'SA', fr: 'Semaines d’aménorrhée : semaines comptées depuis le premier jour des dernières règles.', en: 'Weeks of amenorrhoea: weeks counted from the first day of the last period.' },
  { re: /\bpercentile\b/i, term: 'Percentile', fr: 'Position d’une mesure par rapport à une population de référence (sur 100).', en: 'Where a measurement sits compared with a reference population (out of 100).' },
  { re: /\bp[ée]rim[èe]tre cr[âa]nien\b/i, term: 'Périmètre crânien', fr: 'Tour de tête de l’enfant.', en: 'Head circumference.' },
  { re: /\bposologie\b/i, term: 'Posologie', fr: 'Quantité et rythme de prise d’un médicament, tels qu’écrits par le prescripteur.', en: 'Amount and frequency of a medicine, as written by the prescriber.' },
  { re: /\bqsp\b/i, term: 'QSP', fr: '« Quantité suffisante pour » : durée couverte par l’ordonnance.', en: '“Quantity sufficient for”: the period the prescription covers.' },
  { re: /\bdose-poids\b/i, term: 'Dose-poids', fr: 'Graduation de la pipette correspondant au poids de l’enfant.', en: 'Dosing syringe mark that matches the child’s weight.' },
  { re: /\bcp\b|\bcomprim[ée]/i, term: 'cp', fr: 'Abréviation de « comprimé ».', en: 'Short for “tablet”.' },
  { re: /\b\d-\d-\d\b/, term: '1-0-1', fr: 'Notation matin-midi-soir : nombre de prises à chaque moment de la journée.', en: 'Morning–noon–evening notation: number of doses at each time of day.' },
  { re: /\bras\b/i, term: 'RAS', fr: '« Rien à signaler ».', en: '“Nothing to report”.' },
  { re: /\batcd\b/i, term: 'ATCD', fr: 'Antécédents : problèmes de santé passés.', en: 'Medical history.' },
  { re: /\bfrottis\b/i, term: 'Frottis', fr: 'Prélèvement de cellules du col de l’utérus, pour le dépistage.', en: 'Cervical screening sample.' },
  { re: /\bhpv\b/i, term: 'HPV', fr: 'Papillomavirus humain, recherché lors du dépistage du col de l’utérus.', en: 'Human papillomavirus, tested for in cervical screening.' },
  { re: /\bror\b/i, term: 'ROR', fr: 'Vaccin rougeole, oreillons, rubéole.', en: 'MMR vaccine (measles, mumps, rubella).' },
  { re: /\bdtp|dtca\b/i, term: 'DTP', fr: 'Vaccin diphtérie, tétanos, poliomyélite (parfois associé à la coqueluche : dTca).', en: 'Diphtheria, tetanus and polio vaccine (sometimes with whooping cough).' },
  { re: /\brappel\b/i, term: 'Rappel', fr: 'Nouvelle dose d’un vaccin pour entretenir la protection.', en: 'Booster: a further dose that maintains protection.' },
  { re: /\bpmi\b/i, term: 'PMI', fr: 'Protection maternelle et infantile : service public de suivi des femmes enceintes et des jeunes enfants.', en: 'Mother and child health service (France).' },
  { re: /\bimc\b/i, term: 'IMC', fr: 'Indice de masse corporelle : poids rapporté à la taille.', en: 'Body mass index: weight relative to height.' },
  { re: /\bvaleurs? de r[ée]f[ée]rence|\bnormes?\b/i, term: 'Valeurs de référence', fr: 'Intervalle indiqué par le laboratoire pour situer un résultat ; il dépend de la méthode et du laboratoire.', en: 'Range given by the lab to place a result; it depends on the method and the lab.' },
];

export interface GlossaryHit { term: string; explanation: string }

/** Termes du document expliqués de façon générale, dans la langue active, sans doublon. */
export function glossaryFor(text: string): GlossaryHit[] {
  const en = getLocale() === 'en';
  const seen = new Set<string>();
  const out: GlossaryHit[] = [];
  for (const e of G) {
    if (e.re.test(text) && !seen.has(e.term)) {
      seen.add(e.term);
      out.push({ term: e.term, explanation: en ? e.en : e.fr });
    }
  }
  return out;
}
