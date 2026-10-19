/**
 * Fiches pédagogiques sur les pertes vaginales — bibliothèque INTERNE, versionnée.
 * Aucun des organismes cités ne propose d'API de contenus : les textes sont rédigés ici, de façon prudente,
 * à partir des pages publiques citées (vérifiées le 19/10/2026). Ils ne posent aucun diagnostic et ne recommandent
 * aucun traitement. Relecture par un·e professionnel·le de santé à prévoir avant publication.
 */
import type { GuideSlug } from '@/lib/domain/cycleV2';

export const GUIDES_VERSION = '2026-10-19';
export const GUIDES_CHECKED_ON = '2026-10-19';

export interface GuideSource { id: string; org: string; title: string; url: string; lang: 'en' | 'fr' }
export const SOURCES: Record<string, GuideSource> = {
  nhsDischarge: { id: 'nhsDischarge', org: 'NHS', title: 'Vaginal discharge', url: 'https://www.nhs.uk/symptoms/vaginal-discharge/', lang: 'en' },
  nhsBleeding: { id: 'nhsBleeding', org: 'NHS', title: 'Vaginal bleeding between periods or after sex', url: 'https://www.nhs.uk/symptoms/vaginal-bleeding-between-periods-or-after-sex/', lang: 'en' },
  nhsPregnancyBleeding: { id: 'nhsPregnancyBleeding', org: 'NHS', title: 'Vaginal bleeding in pregnancy', url: 'https://www.nhs.uk/pregnancy/related-conditions/common-symptoms/vaginal-bleeding/', lang: 'en' },
  nhsDryness: { id: 'nhsDryness', org: 'NHS', title: 'Vaginal dryness', url: 'https://www.nhs.uk/symptoms/vaginal-dryness/', lang: 'en' },
  acogVaginitis: { id: 'acogVaginitis', org: 'ACOG', title: 'Vaginitis (FAQ)', url: 'https://www.acog.org/womens-health/faqs/vaginitis', lang: 'en' },
};

export interface GuideText { title: string; intro: string; observe: string[]; variations: string[]; note: string[]; limits: string; seek: string[] }
export interface Guide { slug: GuideSlug; tone: 'clear' | 'white' | 'stretchy' | 'more' | 'thick' | 'yellow' | 'odor' | 'pink' | 'itch' | 'dry'; sources: string[]; fr: GuideText; en: GuideText }

const SEEK_FR_COMMON = 'Si vous êtes enceinte ou pensez pouvoir l’être et que vous avez des saignements avec des douleurs, contactez sans attendre un service d’urgence.';
const SEEK_EN_COMMON = 'If you are or might be pregnant and have bleeding with pain, contact emergency services straight away.';

export const GUIDES: Guide[] = [
  {
    slug: 'clear-fluid', tone: 'clear', sources: ['nhsDischarge'],
    fr: {
      title: 'Pertes transparentes et fluides',
      intro: 'Vous remarquez des pertes claires, fluides ou aqueuses. Ce type de pertes est fréquemment décrit et peut varier au fil du cycle.',
      observe: ['Couleur claire ou transparente', 'Consistance fluide ou aqueuse', 'Quantité variable d’un jour à l’autre'],
      variations: ['Elles sont souvent décrites comme plus abondantes à certains moments du cycle, notamment autour de l’ovulation', 'L’activité sexuelle, la grossesse ou certaines contraceptions peuvent en modifier la quantité'],
      note: ['Le jour du cycle', 'La quantité', 'Une odeur inhabituelle, des démangeaisons ou une gêne, s’il y en a'],
      limits: 'L’aspect seul ne permet de rien confirmer, ni l’ovulation, ni l’absence de problème.',
      seek: ['Si l’aspect, l’odeur ou la quantité change nettement par rapport à d’habitude', 'Si des démangeaisons, une irritation ou des douleurs apparaissent'],
    },
    en: {
      title: 'Clear, runny discharge',
      intro: 'You notice clear, runny or watery discharge. This kind of discharge is commonly described and can change through the cycle.',
      observe: ['Clear or see-through colour', 'Runny or watery consistency', 'Amount that varies from day to day'],
      variations: ['It is often described as heavier at certain points in the cycle, especially around ovulation', 'Sex, pregnancy or some contraceptives can change the amount'],
      note: ['Your cycle day', 'The amount', 'Any unusual smell, itching or discomfort'],
      limits: 'Appearance alone can’t confirm anything — neither ovulation nor that everything is fine.',
      seek: ['If the look, smell or amount changes clearly from what is usual for you', 'If itching, irritation or pain appears'],
    },
  },
  {
    slug: 'white-creamy', tone: 'white', sources: ['nhsDischarge'],
    fr: {
      title: 'Pertes blanches et crémeuses',
      intro: 'Vous remarquez des pertes blanches, laiteuses ou crémeuses. Elles sont souvent décrites comme habituelles, sans odeur forte.',
      observe: ['Couleur blanche ou blanc cassé', 'Texture crémeuse, épaisse ou collante', 'Peu ou pas d’odeur'],
      variations: ['La texture et la quantité peuvent changer selon le moment du cycle', 'Elles peuvent sembler plus visibles certains jours'],
      note: ['La texture (crémeuse, collante, grumeleuse…)', 'La présence de démangeaisons ou d’une irritation', 'Toute odeur inhabituelle'],
      limits: 'Des pertes blanches peuvent être habituelles comme accompagner une infection : seule une consultation permet de le dire.',
      seek: ['Si elles deviennent grumeleuses avec des démangeaisons', 'Si une odeur forte ou inhabituelle apparaît', 'Si une gêne persiste'],
    },
    en: {
      title: 'White, creamy discharge',
      intro: 'You notice white, milky or creamy discharge. It is often described as usual when it has no strong smell.',
      observe: ['White or off-white colour', 'Creamy, thick or sticky texture', 'Little or no smell'],
      variations: ['Texture and amount can change with the time of the cycle', 'It may look more noticeable on some days'],
      note: ['The texture (creamy, sticky, lumpy…)', 'Any itching or irritation', 'Any unusual smell'],
      limits: 'White discharge can be usual, or can come with an infection: only a healthcare professional can tell.',
      seek: ['If it becomes lumpy with itching', 'If a strong or unusual smell appears', 'If discomfort continues'],
    },
  },
  {
    slug: 'stretchy-slippery', tone: 'stretchy', sources: ['nhsDischarge'],
    fr: {
      title: 'Pertes filantes et glissantes',
      intro: 'Vous remarquez des pertes transparentes, élastiques et glissantes. Certaines personnes observent ce type de pertes à proximité de leur période fertile. Cet aspect ne suffit toutefois pas à confirmer une ovulation. Vous pouvez enregistrer votre observation et la comparer à votre historique.',
      observe: ['Aspect transparent, parfois comparé à du blanc d’œuf cru', 'Texture élastique : elles s’étirent entre deux doigts', 'Sensation humide ou glissante'],
      variations: ['Leur présence et leur durée varient d’une personne et d’un cycle à l’autre', 'Elles peuvent être absentes même autour de l’ovulation'],
      note: ['Le jour du cycle', 'Le nombre de jours où vous les observez', 'Les éventuels tests d’ovulation du même jour'],
      limits: 'Cette observation n’est ni une preuve d’ovulation, ni une méthode de contraception fiable.',
      seek: ['Si un changement inhabituel s’accompagne de démangeaisons, d’odeur ou de douleur'],
    },
    en: {
      title: 'Stretchy, slippery discharge',
      intro: 'You notice clear, stretchy and slippery discharge. Some people notice this kind of discharge around their fertile time. On its own, though, it doesn’t confirm ovulation. You can log what you see and compare it with your history.',
      observe: ['Clear appearance, sometimes compared to raw egg white', 'Stretchy texture: it stretches between two fingers', 'A wet or slippery feeling'],
      variations: ['Whether it appears, and for how long, varies between people and between cycles', 'It may not appear even around ovulation'],
      note: ['Your cycle day', 'How many days you notice it', 'Any ovulation tests on the same day'],
      limits: 'This observation is neither proof of ovulation nor a reliable method of contraception.',
      seek: ['If an unusual change comes with itching, smell or pain'],
    },
  },
  {
    slug: 'more-abundant', tone: 'more', sources: ['nhsDischarge'],
    fr: {
      title: 'Pertes plus abondantes',
      intro: 'Vous remarquez plus de pertes que d’habitude. La quantité varie naturellement, mais un changement net mérite d’être noté.',
      observe: ['Quantité plus importante qu’à votre habitude', 'Besoin éventuel de changer de sous-vêtement ou de protection plus souvent'],
      variations: ['La quantité augmente souvent autour de l’ovulation, pendant la grossesse ou avec certaines contraceptions', 'L’activité sexuelle peut aussi la modifier temporairement'],
      note: ['Depuis quand', 'La couleur et l’odeur', 'Les symptômes associés (démangeaisons, douleur, gêne urinaire)'],
      limits: 'Une variation de quantité, seule, ne permet pas d’en connaître la cause.',
      seek: ['Si l’augmentation persiste ou s’accompagne d’un changement de couleur, d’odeur, de démangeaisons ou de douleur'],
    },
    en: {
      title: 'Heavier discharge',
      intro: 'You notice more discharge than usual. The amount naturally varies, but a clear change is worth noting.',
      observe: ['More than your usual amount', 'Possibly needing to change underwear or protection more often'],
      variations: ['It often increases around ovulation, in pregnancy or with some contraceptives', 'Sex can also change it for a while'],
      note: ['Since when', 'The colour and smell', 'Related symptoms (itching, pain, discomfort when peeing)'],
      limits: 'A change in amount alone doesn’t tell you the cause.',
      seek: ['If the increase continues or comes with a change in colour or smell, itching or pain'],
    },
  },
  {
    slug: 'thick-lumpy', tone: 'thick', sources: ['nhsDischarge', 'acogVaginitis'],
    fr: {
      title: 'Pertes épaisses ou grumeleuses',
      intro: 'Vous remarquez des pertes épaisses, ou d’aspect grumeleux. Plusieurs causes sont possibles ; certaines demandent un avis médical.',
      observe: ['Texture épaisse ou en petits grumeaux', 'Couleur souvent blanche', 'Présence ou non de démangeaisons'],
      variations: ['Des pertes épaisses peuvent être habituelles à certains moments du cycle', 'Associées à des démangeaisons, elles sont souvent un motif de consultation'],
      note: ['Les démangeaisons, brûlures ou irritations', 'L’odeur', 'Un traitement antibiotique récent'],
      limits: 'L’aspect ne suffit pas pour identifier une cause : évitez l’auto-diagnostic.',
      seek: ['Si des démangeaisons, une brûlure ou une irritation accompagnent ces pertes', 'Si c’est la première fois ou si cela revient souvent'],
    },
    en: {
      title: 'Thick or lumpy discharge',
      intro: 'You notice thick or lumpy-looking discharge. Several causes are possible; some need medical advice.',
      observe: ['Thick texture or small lumps', 'Often white', 'With or without itching'],
      variations: ['Thick discharge can be usual at some points in the cycle', 'With itching, it is often a reason to see a professional'],
      note: ['Any itching, burning or irritation', 'The smell', 'Any recent antibiotics'],
      limits: 'Appearance isn’t enough to find a cause: avoid self-diagnosis.',
      seek: ['If itching, burning or irritation comes with it', 'If it’s the first time, or it keeps coming back'],
    },
  },
  {
    slug: 'yellow-green', tone: 'yellow', sources: ['nhsDischarge', 'acogVaginitis'],
    fr: {
      title: 'Pertes jaunâtres, verdâtres ou grisâtres',
      intro: 'Vous remarquez des pertes d’une couleur jaunâtre, verdâtre ou grisâtre. Un changement de couleur est un motif fréquent de consultation.',
      observe: ['Couleur inhabituelle pour vous', 'Parfois une texture mousseuse ou une odeur différente'],
      variations: ['Une légère teinte jaunâtre en séchant sur un tissu peut être décrite sans autre signe', 'Une couleur franchement verte ou grise, ou associée à une odeur, est à faire examiner'],
      note: ['La couleur la plus fidèle possible', 'L’odeur', 'Les démangeaisons, douleurs ou gêne urinaire', 'Une activité sexuelle récente'],
      limits: 'La couleur ne permet pas, à elle seule, de connaître la cause.',
      seek: ['Consultez un·e professionnel·le de santé ou un centre de santé sexuelle si la couleur change nettement, surtout avec une odeur, des démangeaisons ou une douleur'],
    },
    en: {
      title: 'Yellowish, greenish or greyish discharge',
      intro: 'You notice yellowish, greenish or greyish discharge. A change in colour is a common reason to get checked.',
      observe: ['A colour that is unusual for you', 'Sometimes a frothy texture or a different smell'],
      variations: ['A slight yellow tint when it dries on fabric may be described without other signs', 'A clearly green or grey colour, or one with a smell, should be checked'],
      note: ['The colour as accurately as you can', 'The smell', 'Any itching, pain or discomfort when peeing', 'Recent sexual activity'],
      limits: 'Colour alone can’t tell you the cause.',
      seek: ['See a healthcare professional or a sexual health clinic if the colour clearly changes, especially with a smell, itching or pain'],
    },
  },
  {
    slug: 'unusual-odor', tone: 'odor', sources: ['nhsDischarge', 'acogVaginitis'],
    fr: {
      title: 'Odeur inhabituelle',
      intro: 'Vous remarquez des pertes accompagnées d’une odeur inhabituelle. Plusieurs causes sont possibles. Notez les symptômes et demandez un avis médical si le changement persiste ou s’accompagne d’une gêne.',
      observe: ['Une odeur plus marquée ou différente de d’habitude', 'Parfois un changement de couleur ou de quantité'],
      variations: ['Une légère odeur peut être habituelle', 'Une odeur forte, nouvelle ou désagréable est un motif fréquent de consultation'],
      note: ['Quand l’odeur est apparue', 'La couleur et la texture', 'Les symptômes associés', 'Les produits intimes utilisés récemment'],
      limits: 'L’odeur ne permet pas d’identifier une cause.',
      seek: ['Si l’odeur persiste, est forte ou s’accompagne de démangeaisons, de douleur ou d’un changement de couleur'],
    },
    en: {
      title: 'Unusual smell',
      intro: 'You notice discharge with an unusual smell. Several causes are possible. Note your symptoms and get medical advice if the change continues or comes with discomfort.',
      observe: ['A stronger or different smell than usual', 'Sometimes a change in colour or amount'],
      variations: ['A mild smell can be usual', 'A strong, new or unpleasant smell is a common reason to get checked'],
      note: ['When the smell started', 'The colour and texture', 'Related symptoms', 'Any intimate products used recently'],
      limits: 'Smell alone can’t identify a cause.',
      seek: ['If the smell continues, is strong, or comes with itching, pain or a change in colour'],
    },
  },
  {
    slug: 'pink-brown', tone: 'pink', sources: ['nhsBleeding', 'nhsPregnancyBleeding'],
    fr: {
      title: 'Pertes rosées ou brunâtres',
      intro: 'Vous remarquez des pertes rosées ou brunâtres. Elles contiennent souvent un peu de sang ; le moment où elles apparaissent compte.',
      observe: ['Teinte rosée, brune ou marron', 'Souvent en petite quantité'],
      variations: ['Elles peuvent apparaître juste avant ou après les règles', 'Des saignements entre les règles, après un rapport ou pendant une grossesse doivent être signalés à un·e professionnel·le'],
      note: ['La date et le jour du cycle', 'Une grossesse connue ou possible', 'Un rapport récent', 'Des douleurs'],
      limits: 'Le moment et le contexte comptent plus que la couleur, qui ne permet aucune conclusion.',
      seek: ['Consultez si elles surviennent entre les règles ou après un rapport', 'Demandez une aide urgente si vous avez manqué vos règles, ou êtes enceinte, avec des saignements et des douleurs au ventre', SEEK_FR_COMMON],
    },
    en: {
      title: 'Pink or brown discharge',
      intro: 'You notice pink or brownish discharge. It often contains a little blood; when it appears matters.',
      observe: ['Pink, brown or dark brown tint', 'Often a small amount'],
      variations: ['It can appear just before or after a period', 'Bleeding between periods, after sex or in pregnancy should be checked by a professional'],
      note: ['The date and cycle day', 'A known or possible pregnancy', 'Recent sex', 'Any pain'],
      limits: 'Timing and context matter more than colour, which allows no conclusion.',
      seek: ['See a professional if it happens between periods or after sex', 'Get urgent help if you have missed a period, or are pregnant, with bleeding and tummy pain', SEEK_EN_COMMON],
    },
  },
  {
    slug: 'itching', tone: 'itch', sources: ['nhsDischarge', 'acogVaginitis'],
    fr: {
      title: 'Pertes avec démangeaisons ou irritation',
      intro: 'Vous remarquez des pertes accompagnées de démangeaisons, d’une irritation ou d’une brûlure. Plusieurs causes sont possibles. Notez les symptômes et demandez un avis médical si le changement persiste ou s’accompagne d’une gêne.',
      observe: ['Démangeaisons ou irritation de la vulve ou du vagin', 'Parfois une brûlure, notamment en urinant', 'Un éventuel changement des pertes'],
      variations: ['Des produits parfumés, certains savons ou textiles peuvent irriter', 'Ces signes sont aussi décrits avec plusieurs infections'],
      note: ['L’intensité et la durée', 'L’aspect et l’odeur des pertes', 'Un produit intime ou un traitement antibiotique récent'],
      limits: 'Ces signes ne permettent pas de savoir seule quelle est la cause : évitez de vous traiter sans avis.',
      seek: ['Si les démangeaisons durent, reviennent souvent, ou s’accompagnent de douleur, de brûlure en urinant ou de lésions'],
    },
    en: {
      title: 'Discharge with itching or irritation',
      intro: 'You notice discharge with itching, irritation or burning. Several causes are possible. Note your symptoms and get medical advice if the change continues or comes with discomfort.',
      observe: ['Itching or irritation of the vulva or vagina', 'Sometimes burning, especially when peeing', 'A possible change in discharge'],
      variations: ['Scented products, some soaps or fabrics can irritate', 'These signs are also described with several infections'],
      note: ['How strong it is and how long it lasts', 'The look and smell of the discharge', 'Any recent intimate product or antibiotics'],
      limits: 'These signs alone don’t tell you the cause: avoid treating yourself without advice.',
      seek: ['If itching lasts, keeps coming back, or comes with pain, burning when peeing, or sores'],
    },
  },
  {
    slug: 'dryness', tone: 'dry', sources: ['nhsDryness'],
    fr: {
      title: 'Sécheresse ou diminution des pertes',
      intro: 'Vous remarquez peu de pertes, ou une sensation de sécheresse. Cela peut varier selon le cycle et selon les périodes de la vie.',
      observe: ['Peu ou pas de pertes', 'Sensation de sécheresse, d’inconfort, parfois pendant les rapports'],
      variations: ['Des changements hormonaux (allaitement, grossesse, ménopause), certains médicaments ou des produits parfumés peuvent jouer', 'La quantité de pertes varie aussi naturellement au fil du cycle'],
      note: ['Depuis quand', 'Une gêne pendant les rapports', 'Un allaitement, un traitement en cours'],
      limits: 'Une sensation de sécheresse n’indique pas, seule, sa cause.',
      seek: ['Si la sécheresse dure plusieurs semaines ou gêne votre quotidien', 'Si elle s’accompagne de saignements après un rapport ou entre les règles'],
    },
    en: {
      title: 'Dryness or less discharge',
      intro: 'You notice little discharge, or a dry feeling. This can vary through the cycle and at different times of life.',
      observe: ['Little or no discharge', 'A dry or uncomfortable feeling, sometimes during sex'],
      variations: ['Hormonal changes (breastfeeding, pregnancy, menopause), some medicines or scented products can play a part', 'The amount of discharge also varies naturally through the cycle'],
      note: ['Since when', 'Any discomfort during sex', 'Breastfeeding, or a current treatment'],
      limits: 'A dry feeling alone doesn’t tell you its cause.',
      seek: ['If dryness lasts several weeks or affects daily life', 'If it comes with bleeding after sex or between periods'],
    },
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug) ?? null;
