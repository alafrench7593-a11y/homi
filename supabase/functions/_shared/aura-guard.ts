/**
 * HOMI Aura — contrôle des SORTIES du modèle (module PUR, 5 langues, testé par Jest sur des sorties simulées).
 *
 * Le prompt interdit, ce module VÉRIFIE : une réponse qui se présente comme un professionnel de santé, pose un
 * diagnostic (dépression, TDAH, TSA…), donne une posologie ou un calcul de dose, promet la sécurité, décourage de
 * consulter ou prétend avoir écrit quelque chose à la place de la personne est REMPLACÉE par une réponse prudente
 * (dans la langue de la personne), ses propositions sont retirées, et aucun crédit n'est débité.
 * Complète `auditAnswer` (safety.ts, motifs historiques en français), toujours appliqué en plus.
 */
import { auditAnswer } from './safety.ts';
import type { AuraLang } from './aura-prompt.ts';

const fold = (s: string) => s.replace(/[’‘`´]/g, "'").normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss');

type Rule = [RegExp, string];

/** Se présenter comme un professionnel (ou parler « en tant que »). */
const SELF_PRO: Rule[] = [
  [/\bje suis (un |une |votre |ton |ta )?(medecin|docteur|psychologue|psychiatre|sage-femme|pediatre|therapeute|psychotherapeute|infirmier|infirmiere|pharmacien)/, 'qualité usurpée'],
  [/\ben tant que (medecin|psychologue|psychiatre|sage-femme|pediatre|therapeute|professionnel(le)? de sante)/, 'qualité usurpée'],
  [/\bi am (a |an |your )?(doctor|physician|psychologist|psychiatrist|therapist|midwife|nurse|pediatrician|paediatrician|pharmacist)\b/, 'qualité usurpée'],
  [/\bi'?m (a |an |your )?(doctor|physician|psychologist|psychiatrist|therapist|midwife|nurse|pediatrician|paediatrician)\b/, 'qualité usurpée'],
  [/\bas (a|an|your) (doctor|physician|psychologist|psychiatrist|therapist|midwife|nurse|pediatrician|paediatrician)\b/, 'qualité usurpée'],
  [/\bich bin (ein |eine |ihr |ihre |dein |deine )?(arztin|arzt|psychologin|psychologe|psychiaterin|psychiater|hebamme|therapeutin|therapeut|kinderarztin|kinderarzt|krankenschwester|pflegekraft)\b/, 'qualité usurpée'],
  [/\bals (ihr |ihre |dein |deine )?(arztin|arzt|psychologin|psychologe|psychiaterin|psychiater|hebamme|therapeutin|therapeut)\b/, 'qualité usurpée'],
  [/\bsoy (un |una |tu |su )?(medica|medico|doctora|doctor|psicologa|psicologo|psiquiatra|matrona|comadrona|pediatra|terapeuta|enfermera|enfermero)\b/, 'qualité usurpée'],
  [/\bcomo (tu |su )?(medica|medico|doctora|doctor|psicologa|psicologo|psiquiatra|matrona|pediatra|terapeuta)\b/, 'qualité usurpée'],
  [/\bsono (un |una |il tuo |la tua |il suo |la sua )?(medico|dottoressa|dottore|psicologa|psicologo|psichiatra|ostetrica|pediatra|terapeuta|infermiera|infermiere)\b/, 'qualité usurpée'],
  [/\bcome (tuo |tua |suo |sua )?(medico|psicologa|psicologo|psichiatra|ostetrica|pediatra|terapeuta)\b/, 'qualité usurpée'],
];

/** Conditions qu'Aura ne nomme jamais comme un diagnostic. */
const COND = '(depression|depressi|depresi|post.?partum depress|postnatal depress|burn.?out|tdah|adhd|adhs|tsa\\b|tea\\b|asd\\b|autis|trouble (du spectre|deficitaire|bipolaire|anxieux|de l.attention)|bipolar|psychos|baby.?blues|wochenbettdepression|trastorno|disturbo|stoerung|storung|anxiety disorder|angststorung)';

/** Diagnostic : sujet + verbe d'état + condition (une négation ou une hypothèse juste avant annule : « je ne peux pas dire si… »). */
const DIAG: Rule[] = [
  [new RegExp(`\\b(vous|tu|il|elle|votre (enfant|bebe|fils|fille|conjoint|conjointe|partenaire)|ton (enfant|bebe|fils)|ta fille)\\s+(avez|as|a|etes|es|est|souffre[sz]?|souffrez|presente[sz]?|presentez)\\s+(probablement |sans doute |certainement |clairement |surement |visiblement |bien |peut-etre |peut etre |possiblement )?(en |une |un |d.une |d.un |de la |du |des |les signes d.une |les signes d.un |)?${COND}`), 'diagnostic'],
  [new RegExp(`\\b(c.est|ca ressemble a|cela ressemble a|il s.agit d.)\\s*(probablement |sans doute |clairement |surement )?(une |un |d.une |d.un |de la |du )?${COND}`), 'diagnostic'],
  [new RegExp(`\\b(you|he|she|they|your (child|baby|son|daughter|partner))\\s+(probably |likely |clearly |definitely |certainly )?(have|has|are|is|suffer|suffers)\\s+(probably |likely |clearly |definitely |certainly )?(from |showing signs of )?(an? |the )?${COND}`), 'diagnostic'],
  [new RegExp(`\\b(you|he|she|they|your (child|baby|son|daughter|partner))\\s+(may|might|could|must) (have|be suffering from|be)\\s+(an? )?${COND}`), 'diagnostic'],
  [new RegExp(`\\b(this|it|that) (is|sounds like|looks like)\\s+(probably |likely |clearly |definitely )?(an? )?${COND}`), 'diagnostic'],
  [new RegExp(`\\b(sie|du|er|es|ihr kind|ihr baby|dein kind|dein baby)\\s+(haben|hast|hat|leiden|leidest|leidet|sind|bist|ist)\\s+(wahrscheinlich |vermutlich |eindeutig |sicher )?(an )?(eine[rnm]? )?${COND}`), 'diagnostic'],
  [new RegExp(`\\b(das ist|es handelt sich um)\\s+(wahrscheinlich |vermutlich |eindeutig )?(eine[rnm]? )?${COND}`), 'diagnostic'],
  [new RegExp(`\\b(usted|tu|el|ella|su (hijo|hija|bebe|pareja)|tu (hijo|hija|bebe|pareja))\\s+(tiene|tienes|padece|padeces|sufre|sufres|es)\\s+(probablemente |claramente |seguramente )?(de )?(una? |de )?${COND}`), 'diagnostic'],
  [new RegExp(`\\b(es|se trata de)\\s+(probablemente |claramente |seguramente )?(una? )?${COND}`), 'diagnostic'],
  [new RegExp(`\\b(lei|tu|lui|suo (figlio|bambino|partner)|tuo (figlio|bambino|partner)|sua figlia|tua figlia)\\s+(ha|hai|soffre|soffri|e|sei)\\s+(probabilmente |chiaramente |sicuramente )?(di )?(una? |di )?${COND}`), 'diagnostic'],
  [new RegExp(`\\b(si tratta di)\\s+(probabilmente |chiaramente |sicuramente )?(una? )?${COND}`), 'diagnostic'],
];
/** Mots qui, juste avant, transforment l'affirmation en hypothèse ou en négation. */
const HEDGE = /\b(si|if|whether|ob|se|pas|ne|n'|not|cannot|can't|don't|nicht|kein|keine|no|non|ni|nor|sans|without|ohne|sin|senza|savoir|know|wissen|saber|sapere|decide|determine|evaluer|beurteilen|evaluar|valutare)\b/;

/** Posologie, dose, calcul de dose (5 langues). Un volume de biberon (« 150 ml ») n'est PAS une dose. */
const MEDS = '(paracetamol|doliprane|dafalgan|efferalgan|ibuprofen|ibuprofene|advil|nurofen|spedifen|acetaminophen|tylenol|motrin|aspirin|aspirine|amoxicilline?|antibiotique|antibiotic|antibiotikum|antibiotico|vitamine? d|vitamin d|zymad|uvedose|fer\\b|iron\\b|eisen\\b|hierro\\b|ferro\\b|sertraline|antidepresseur|antidepressant|antidepressivum|antidepresivo|antidepressivo|melatonine?|homeopathi|omeopati)';
const DOSE: Rule[] = [
  [/\b\d+([.,]\d+)?\s?(mg|milligrammes?|milligrams?|milligramm|miligramos?|milligrammi|µg|mcg|microgrammes?|ui|iu|i\.e\.)\b/, 'posologie'],
  [/\b\d+([.,]\d+)?\s?(mg|ml|mcg|µg|ui|iu|gouttes?|drops?|tropfen|gotas?|gocce|goccia)\s?(\/|par|per|pro|por)\s?(kg|kilo)/, 'calcul de dose'],
  [/\b\d+([.,]\d+)?\s?(gouttes?|drops?|tropfen|gotas?|gocce|comprimes?|cachets?|gelules?|tablets?|pills?|capsules?|tabletten?|kapseln?|comprimidos?|pastillas?|compresse?|pastiglie?|sachets?|doses?|dosis|dosi|cuilleres?-mesures?|pipettes?)\b/, 'posologie'],
  [/\b(posologie|dosage|dosierung|posologia|posologia)\b/, 'posologie'],
  [new RegExp(`${MEDS}[^.\\n]{0,60}\\b\\d+([.,]\\d+)?\\s?(ml|fois|times|mal|veces|volte|x|toutes les|every|alle|cada|ogni|h\\b|heures?|hours?|stunden?|horas?|ore)`), 'posologie'],
  [new RegExp(`\\b(toutes les|every|alle|cada|ogni) \\d+\\s?(h|heures?|hours?|stunden?|horas?|ore)\\b[^.\\n]{0,60}${MEDS}`), 'posologie'],
  [/\b(selon|en fonction du|according to|based on|nach|segun|in base al) (son |sa |le |la |its |his |her |the |seinem |ihrem |dem |su |al )?(poids|weight|gewicht|peso)\b[^.\n]{0,50}\b(dose|donner|give|geben|dar|dare)\b/, 'calcul de dose'],
];

/** Garanties, découragement à consulter, actions prétendument faites (5 langues). */
const OTHER: Rule[] = [
  [/\b(inutile de consulter|pas besoin de (consulter|voir un medecin)|no need to (see|consult) a (doctor|professional)|you don'?t need to see a doctor|kein arzt (ist )?notig|sie mussen nicht zum arzt|no hace falta (ir al medico|consultar)|non serve (andare dal medico|consultare))/, 'découragement à consulter'],
  [/\b(aucun risque|sans aucun danger|je vous garantis|no risk at all|i guarantee|kein risiko|ich garantiere|ningun riesgo|te garantizo|nessun rischio|ti garantisco)\b/, 'garantie de sécurité'],
  [/\b(j'ai (ajoute|cree|enregistre|programme|envoye)|i('ve| have) (added|created|saved|scheduled|sent)|ich habe (hinzugefugt|erstellt|gespeichert|eingetragen|gesendet)|he (anadido|creado|guardado|enviado|programado)|ho (aggiunto|creato|salvato|inviato|programmato))\b[^.\n]{0,40}\b(agenda|calendrier|calendar|kalender|calendario|mission|task|aufgabe|tarea|compito|rendez-vous|appointment|termin|cita|appuntamento|rappel|reminder|erinnerung|recordatorio|promemoria|message|nachricht|mensaje|messaggio)/, 'action prétendue'],
];

export interface GuardResult { ok: boolean; flags: string[] }

function hedged(text: string, index: number): boolean {
  const before = text.slice(Math.max(0, index - 48), index);
  return HEDGE.test(before);
}

/** Contrôle d'une sortie du modèle (texte d'Aura, reformulation, analyse). */
export function guardAuraOutput(text: string): GuardResult {
  const raw = text ?? '';
  const t = fold(raw);
  const flags = new Set<string>(auditAnswer(raw));
  for (const [re, f] of [...SELF_PRO, ...DOSE, ...OTHER]) if (re.test(t)) flags.add(f);
  for (const [re, f] of DIAG) {
    const g = new RegExp(re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = g.exec(t))) {
      if (!hedged(t, m.index)) { flags.add(f); break; }
      if (g.lastIndex === m.index) g.lastIndex++;
    }
  }
  return { ok: flags.size === 0, flags: [...flags] };
}

/** Réponse prudente (remplace une sortie refusée), dans la langue de la personne. */
export const AURA_CAUTIOUS: Record<AuraLang, string> = {
  fr: 'Je préfère ne pas répondre précisément : cette question demande l’avis d’une personne qui peut t’écouter et évaluer ta situation (médecin, sage-femme, pédiatre, psychologue ou pharmacien). Je peux t’aider à préparer tes questions ou à trouver l’outil HOMI qui t’aide à noter ce que tu observes. En cas d’urgence : 15 ou 112 (114 par SMS), et le 3114 si tu traverses un moment très difficile.',
  en: 'I would rather not answer this precisely: it needs someone who can listen and assess your situation (a doctor, midwife, paediatrician, psychologist or pharmacist). I can help you prepare your questions or find the HOMI tool to note what you observe. In an emergency, call your local emergency number (112 in Europe).',
  de: 'Darauf möchte ich lieber nicht genau antworten: Diese Frage braucht eine Person, die dir zuhören und deine Lage beurteilen kann (Ärztin, Hebamme, Kinderärztin, Psychologin oder Apotheke). Ich kann dir helfen, deine Fragen vorzubereiten oder das HOMI-Werkzeug zu finden, mit dem du deine Beobachtungen notierst. Im Notfall: 112.',
  es: 'Prefiero no responder con precisión: esta pregunta necesita a alguien que pueda escucharte y valorar tu situación (médico, matrona, pediatra, psicóloga o farmacia). Puedo ayudarte a preparar tus preguntas o a encontrar la herramienta de HOMI para anotar lo que observas. En caso de urgencia: 112.',
  it: 'Preferisco non rispondere con precisione: questa domanda richiede una persona che possa ascoltarti e valutare la tua situazione (medico, ostetrica, pediatra, psicologa o farmacista). Posso aiutarti a preparare le domande o a trovare lo strumento HOMI per annotare ciò che osservi. In caso di emergenza: 112.',
};

/** Mention placée sous chaque réponse générée. */
export const AURA_FOOTER: Record<AuraLang, string> = {
  fr: 'Réponse générée par HOMI Aura, une intelligence artificielle. Elle ne remplace pas l’avis d’un professionnel.',
  en: 'Answer generated by HOMI Aura, an artificial intelligence. It does not replace professional advice.',
  de: 'Antwort von HOMI Aura, einer künstlichen Intelligenz. Sie ersetzt keinen fachlichen Rat.',
  es: 'Respuesta generada por HOMI Aura, una inteligencia artificial. No sustituye el consejo de un profesional.',
  it: 'Risposta generata da HOMI Aura, un’intelligenza artificiale. Non sostituisce il parere di un professionista.',
};
