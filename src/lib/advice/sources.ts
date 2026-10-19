/**
 * Sources des conseils (pages officielles consultées le 19/10/2026). Les textes de l'app sont rédigés à partir de ces pages,
 * sans copie. AUCUNE relecture par un professionnel de santé n'a encore eu lieu : `validatedBy` reste null tant que ce n'est pas fait.
 * Procédure de mise à jour : relire chaque page au moins une fois par an (ou à chaque changement de recommandation),
 * ajuster les textes adv.* et `checkedOn`, puis relancer les tests du moteur.
 */
export interface AdviceSource { id: string; org: string; title: string; url: string; lang: 'fr' | 'en'; country: 'FR' | 'GB' | 'US'; checkedOn: string }

export const ADVICE_REVIEWED_ON = '2026-10-19';
export const ADVICE_VALIDATED_BY: string | null = null;

const S = (id: string, org: string, title: string, url: string, lang: 'fr' | 'en', country: 'FR' | 'GB' | 'US'): AdviceSource => ({ id, org, title, url, lang, country, checkedOn: ADVICE_REVIEWED_ON });

export const ADVICE_SOURCES: Record<string, AdviceSource> = {
  spEC: S('spEC', 'Service-Public.fr', 'Contraception d’urgence', 'https://www.service-public.gouv.fr/particuliers/actualites/A16291', 'fr', 'FR'),
  qsEC: S('qsEC', 'QuestionSexualité (Santé publique France)', 'Contraception d’urgence : comment ça marche ?', 'https://questionsexualite.fr/choisir-sa-contraception/la-contraception-d-urgence/contraception-d-urgence-comment-ca-marche', 'fr', 'FR'),
  qsDirectory: S('qsDirectory', 'QuestionSexualité (Santé publique France)', 'Trouver un centre de santé sexuelle', 'https://www.questionsexualite.fr/trouver-un-professionnel', 'fr', 'FR'),
  ameliDirectory: S('ameliDirectory', 'Assurance Maladie', 'Annuaire santé', 'https://annuairesante.ameli.fr/', 'fr', 'FR'),
  santeFrDysmenorrhea: S('santeFrDysmenorrhea', 'Santé.fr', 'Règles douloureuses (dysménorrhées)', 'https://www.sante.fr/regles-douloureuses-dysmenorrhees', 'fr', 'FR'),
  nhsPeriodPain: S('nhsPeriodPain', 'NHS', 'Period pain', 'https://www.nhs.uk/conditions/period-pain/', 'en', 'GB'),
  nhsPID: S('nhsPID', 'NHS', 'Pelvic inflammatory disease', 'https://www.nhs.uk/conditions/pelvic-inflammatory-disease/', 'en', 'GB'),
  nhsEctopic: S('nhsEctopic', 'NHS', 'Ectopic pregnancy', 'https://www.nhs.uk/conditions/ectopic-pregnancy/', 'en', 'GB'),
  nhsDischarge: S('nhsDischarge', 'NHS', 'Vaginal discharge', 'https://www.nhs.uk/symptoms/vaginal-discharge/', 'en', 'GB'),
  nhsBleeding: S('nhsBleeding', 'NHS', 'Vaginal bleeding between periods or after sex', 'https://www.nhs.uk/symptoms/vaginal-bleeding-between-periods-or-after-sex/', 'en', 'GB'),
  nhsPregnancyBleeding: S('nhsPregnancyBleeding', 'NHS', 'Vaginal bleeding in pregnancy', 'https://www.nhs.uk/pregnancy/related-conditions/common-symptoms/vaginal-bleeding/', 'en', 'GB'),
  nhsPregnancyTest: S('nhsPregnancyTest', 'NHS', 'Doing a pregnancy test', 'https://www.nhs.uk/pregnancy/trying-for-a-baby/doing-a-pregnancy-test/', 'en', 'GB'),
  nhsMissedPeriods: S('nhsMissedPeriods', 'NHS', 'Stopped or missed periods', 'https://www.nhs.uk/conditions/stopped-or-missed-periods/', 'en', 'GB'),
  acogVaginitis: S('acogVaginitis', 'ACOG', 'Vaginitis (FAQ)', 'https://www.acog.org/womens-health/faqs/vaginitis', 'en', 'US'),
};

/** Sources dans l'ordre utile : celles du pays et de la langue de l'utilisatrice d'abord. */
export function orderSources(ids: string[], lang: string, region: string | null): AdviceSource[] {
  const list = ids.map((i) => ADVICE_SOURCES[i]).filter(Boolean);
  const score = (s: AdviceSource) => (s.country === region ? 0 : 2) + (s.lang === lang ? 0 : 1);
  return [...list].sort((a, b) => score(a) - score(b));
}
