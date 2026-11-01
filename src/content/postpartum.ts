/**
 * Contenus éducatifs du suivi post-partum (mère et conjoint).
 * Sources publiques françaises vérifiées le 18 octobre 2026. Ton : doux, sans culpabilisation,
 * aucune durée qui ferait attendre quelqu'un qui souffre beaucoup.
 */

import { localized } from '@/i18n/localized';

export interface Source { title: string; publisher: string; url: string }

export const SOURCES: Record<string, Source> = {
  mpj: { title: 'Le baby blues et la dépression post-partum', publisher: '1000 premiers jours (Santé publique France)', url: 'https://www.1000-premiers-jours.fr/fr/le-baby-blues-et-la-depression-post-partum' },
  ministere: { title: 'Dépression post-partum : un accompagnement possible', publisher: 'Ministère de la Santé', url: 'https://sante.gouv.fr/prevention-en-sante/sante-des-populations/sante-des-femmes/article/depression-post-partum-un-accompagnement-possible' },
  awhonn: { title: 'Sauvez votre vie : signaux d’alerte post-accouchement (version française)', publisher: 'AWHONN — association américaine des infirmières en santé des femmes et périnatalité', url: 'https://www.stelizabeth.com/care/wp-content/uploads/2025/10/AWOHNN-save-YourLife-Heandout-French.pdf' },
  crise: { title: 'Que faire et à qui s’adresser face à une crise suicidaire ?', publisher: 'Ministère de la Santé', url: 'https://sante.gouv.fr/prevention-en-sante/sante-mentale/la-prevention-du-suicide/article/que-faire-et-a-qui-s-adresser-face-a-une-crise-suicidaire' },
};

export interface Section { id: string; title: string; body: string[]; sources: (keyof typeof SOURCES)[] }

const UNDERSTAND_FR: Section[] = [
  {
    id: 'blues',
    title: 'Le baby blues',
    body: [
      'Dans les jours qui suivent l’accouchement, beaucoup de mères se sentent à fleur de peau : larmes, irritabilité, inquiétudes. C’est fréquent et lié aux grands changements physiques, hormonaux et psychologiques.',
      'Il dure en général de quelques heures à quelques jours, et passe de lui-même.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'signs',
    title: 'Quand cela mérite d’en parler',
    body: [
      'Certains signes peuvent justifier une consultation : une tristesse qui s’installe, la perte d’intérêt ou de plaisir, une anxiété importante, un sentiment de désespoir, une culpabilité excessive, des difficultés à dormir même quand l’occasion de se reposer existe, un épuisement émotionnel, des difficultés à faire face au quotidien, une impression de détachement ou de difficulté à créer un lien avec le bébé, le sentiment d’être dépassée.',
      'Ces manifestations peuvent avoir plusieurs causes. Seul un professionnel peut en faire l’évaluation — cette application ne le fait pas.',
      'Les repères officiels invitent à en parler si cela dure plus de deux semaines, et dans tous les cas au moindre doute. Si c’est intense ou que cela s’aggrave, n’attendez pas : vous pouvez en parler dès aujourd’hui.',
      'La dépression post-partum est fréquente — elle concerne 15 à 20 % des femmes ayant accouché d’après l’enquête nationale périnatale 2021 — et elle se soigne. Elle peut aussi toucher les pères.',
    ],
    sources: ['mpj', 'ministere'],
  },
  {
    id: 'who',
    title: 'À qui en parler',
    body: [
      'Votre sage-femme, votre médecin traitant, un centre de PMI, un psychologue (le dispositif « Mon soutien psy » est pris en charge par l’Assurance maladie) ou une consultation de psychiatrie périnatale à l’hôpital.',
      'L’entretien postnatal précoce, prévu entre la 4e et la 8e semaine après l’accouchement, est un moment dédié pour parler de vous. Vous pouvez aussi demander à en parler avant.',
      'Lieux d’accueil parents-enfants et groupes de parents permettent de rompre l’isolement.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'urgent',
    title: 'Si vous êtes en danger',
    body: [
      'Si vous avez des pensées de vous faire du mal, de ne plus être là, ou de faire du mal à votre bébé, ou si vous vous sentez très confuse : appelez maintenant le 3114 (gratuit, confidentiel, 24 h/24), ou le 15 ou le 112 si le danger est immédiat.',
      'Ce ne sont pas des pensées dont il faut avoir honte. Elles sont un signal qu’il faut de l’aide, tout de suite.',
    ],
    sources: ['crise'],
  },
];

const PARTNER_FR: Section[] = [
  {
    id: 'changes',
    title: 'Ce qui change après une naissance',
    body: [
      'Le corps récupère pendant des semaines, parfois des mois. Le sommeil est morcelé, les hormones bougent beaucoup, et la charge du bébé est permanente.',
      'Larmes et fragilité dans les premiers jours sont fréquentes (baby blues) et passent en général en quelques jours.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'difference',
    title: 'Fatigue, baby blues, ou plus que ça ?',
    body: [
      'Si la tristesse, l’anxiété ou l’épuisement s’installent, s’intensifient, ou l’empêchent de faire face au quotidien, cela mérite l’avis d’un professionnel. Vous n’avez pas à trancher : votre rôle est d’écouter et de faciliter l’accès à l’aide.',
      'Les pères et les co-parents peuvent aussi traverser une dépression après une naissance. Prenez soin de vous également.',
    ],
    sources: ['mpj', 'ministere'],
  },
  {
    id: 'listen',
    title: 'Écouter sans minimiser',
    body: [
      'Évitez « c’est normal, ça va passer » ou « tu as tout pour être heureuse ». Accueillez ce qu’elle dit, sans chercher à corriger ses émotions.',
      'Ne lisez pas en cachette ce qui ne vous est pas destiné : ce qu’elle partage dans l’application, elle l’a choisi.',
    ],
    sources: [],
  },
  {
    id: 'help',
    title: 'Aider concrètement',
    body: [
      'Partagez les nuits (biberons, réveils), prenez en charge les repas, les courses, le linge et les visites sans qu’elle ait à le demander.',
      'Protégez ses temps de repos : vous gérez le bébé, le téléphone et la porte.',
    ],
    sources: [],
  },
  {
    id: 'consult',
    title: 'Encourager une consultation, sans culpabiliser',
    body: [
      'Proposez plutôt qu’imposer : « Si tu le souhaites, je peux t’aider à prendre rendez-vous. » Offrez de garder le bébé pendant le rendez-vous, ou de l’accompagner.',
      'Sage-femme, médecin traitant, PMI ou psychologue peuvent la recevoir.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'urgent',
    title: 'Quand demander une aide urgente',
    body: [
      'Si elle parle de se faire du mal, de ne plus être là, de faire du mal au bébé, ou si elle semble très confuse : ne la laissez pas seule, mettez le bébé en sécurité et appelez le 3114, ou le 15 / 112 si le danger est immédiat.',
    ],
    sources: ['crise'],
  },
];

/** Phrases utiles proposées au conjoint (tutoiement : ce sont ses mots à lui). */
const USEFUL_PHRASES_FR = [
  'Comment te sens-tu vraiment aujourd’hui ?',
  'Qu’est-ce que je peux prendre en charge pour te laisser souffler ?',
  'Veux-tu que je m’occupe du bébé pendant que tu te reposes ?',
  'Si tu le souhaites, je peux t’aider à prendre rendez-vous.',
  'Tu n’as pas besoin de tout gérer seule.',
];

/** Phrases à éviter : utilisées par le test de ton. */
export const PHRASES_TO_AVOID = ['C’est normal, ça va passer', 'Tu as tout pour être heureuse', 'Les autres y arrivent bien', 'Secoue-toi'];

/**
 * Signes physiques qui justifient d'agir vite après l'accouchement (liste POST-BIRTH de l'AWHONN,
 * adaptée aux numéros français). L'application ne juge jamais si un symptôme est « normal ».
 */
const RECOVERY_WARNINGS_FR = {
  call15: ['Douleur dans la poitrine', 'Difficulté à respirer ou essoufflement', 'Convulsions', 'Pensées de vous faire du mal ou de faire du mal à quelqu’un'],
  callPro: [
    'Saignement qui remplit une serviette en une heure, ou caillots de la taille d’un œuf ou plus',
    'Cicatrice (épisiotomie, césarienne) qui ne guérit pas, rouge ou qui suinte',
    'Jambe rouge, gonflée, douloureuse ou chaude',
    'Température de 38 °C ou plus',
    'Maux de tête qui persistent malgré un antidouleur, ou avec des troubles de la vue',
  ],
  source: 'awhonn' as const,
};

const UNDERSTAND_EN: Section[] = [
  {
    id: 'blues',
    title: 'The baby blues',
    body: [
      'In the days after birth, many mothers feel very raw: tears, irritability, worries. This is common and linked to the big physical, hormonal and psychological changes.',
      'It generally lasts from a few hours to a few days, and passes by itself.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'signs',
    title: 'When it is worth talking about',
    body: [
      'Some signs can justify a consultation: sadness that sets in, loss of interest or pleasure, marked anxiety, a feeling of hopelessness, excessive guilt, difficulty sleeping even when there is a chance to rest, emotional exhaustion, difficulty coping with daily life, a feeling of detachment or difficulty bonding with the baby, feeling overwhelmed.',
      'These feelings can have several causes. Only a professional can assess them — this app does not.',
      'Official guidance suggests talking about it if it lasts more than two weeks, and in any case at the slightest doubt. If it is intense or getting worse, do not wait: you can talk about it today.',
      'Postnatal depression is common — it affects 15 to 20% of women who have given birth, according to the 2021 French national perinatal survey — and it can be treated. It can also affect fathers.',
    ],
    sources: ['mpj', 'ministere'],
  },
  {
    id: 'who',
    title: 'Who to talk to',
    body: [
      'Your midwife, your GP, a PMI (maternal and child health) centre, a psychologist (the “Mon soutien psy” scheme is covered by the French health insurance) or a perinatal psychiatry clinic at the hospital.',
      'The early postnatal interview, planned between the 4th and 8th week after the birth, is a time set aside to talk about you. You can also ask to have it sooner.',
      'Parent-and-child drop-in places and parent groups can help break isolation.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'urgent',
    title: 'If you are in danger',
    body: [
      'If you have thoughts of harming yourself, of not being here any more, or of harming your baby, or if you feel very confused: call 3114 now (free, confidential, 24 hours a day), or 15 or 112 if the danger is immediate.',
      'These are not thoughts to be ashamed of. They are a sign that you need help, right now.',
    ],
    sources: ['crise'],
  },
];

const PARTNER_EN: Section[] = [
  {
    id: 'changes',
    title: 'What changes after a birth',
    body: [
      'The body recovers over weeks, sometimes months. Sleep is broken up, hormones shift a great deal, and the baby’s care is constant.',
      'Tears and fragility in the first days are common (baby blues) and generally pass within a few days.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'difference',
    title: 'Tiredness, baby blues, or more than that?',
    body: [
      'If sadness, anxiety or exhaustion set in, grow stronger, or stop her coping with daily life, it deserves a professional’s opinion. You do not have to decide: your role is to listen and make it easier to get help.',
      'Fathers and co-parents can also go through depression after a birth. Look after yourself too.',
    ],
    sources: ['mpj', 'ministere'],
  },
  {
    id: 'listen',
    title: 'Listen without minimising',
    body: [
      'Avoid “it’s fine, it will pass” or “you have everything to be happy about”. Welcome what she says, without trying to correct her emotions.',
      'Do not read in secret what is not meant for you: what she shares in the app, she has chosen to share.',
    ],
    sources: [],
  },
  {
    id: 'help',
    title: 'Helping in practical ways',
    body: [
      'Share the nights (bottles, wakings), take on meals, shopping, laundry and visitors without her having to ask.',
      'Protect her rest time: you handle the baby, the phone and the door.',
    ],
    sources: [],
  },
  {
    id: 'consult',
    title: 'Encouraging a consultation, without guilt',
    body: [
      'Offer rather than impose: “If you’d like, I can help you book an appointment.” Offer to look after the baby during the appointment, or to go with her.',
      'A midwife, GP, PMI centre or psychologist can see her.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'urgent',
    title: 'When to ask for urgent help',
    body: [
      'If she talks about harming herself, about not being here any more, about harming the baby, or if she seems very confused: do not leave her alone, make sure the baby is somewhere secure and call 3114, or 15 / 112 if the danger is immediate.',
    ],
    sources: ['crise'],
  },
];

const USEFUL_PHRASES_EN = [
  'How are you really feeling today?',
  'What can I take on to give you a breather?',
  'Would you like me to look after the baby while you rest?',
  'If you’d like, I can help you book an appointment.',
  'You don’t have to handle everything alone.',
];

const RECOVERY_WARNINGS_EN = {
  call15: ['Chest pain', 'Difficulty breathing or shortness of breath', 'Seizures', 'Thoughts of harming yourself or of harming someone'],
  callPro: [
    'Bleeding that soaks a pad in an hour, or clots the size of an egg or larger',
    'A wound (episiotomy, caesarean) that is not healing, is red or is oozing',
    'A red, swollen, painful or warm leg',
    'A temperature of 38 °C or above',
    'Headaches that persist despite a painkiller, or come with vision problems',
  ],
  source: 'awhonn' as const,
};

export const UNDERSTAND: Section[] = localized(UNDERSTAND_FR, UNDERSTAND_EN);
export const PARTNER: Section[] = localized(PARTNER_FR, PARTNER_EN);
export const USEFUL_PHRASES = localized(USEFUL_PHRASES_FR, USEFUL_PHRASES_EN);
export const RECOVERY_WARNINGS = localized(RECOVERY_WARNINGS_FR, RECOVERY_WARNINGS_EN);
