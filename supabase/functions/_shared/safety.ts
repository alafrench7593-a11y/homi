/**
 * Détection des situations qui demandent une aide HUMAINE immédiate.
 * Module pur (sans dépendance) : utilisé par la fonction « assistant »
 * ET par l'application (bilan émotionnel), testé par Jest.
 *
 * Principe : en cas de doute, on affiche les ressources. Un faux positif
 * affiche des numéros utiles ; un faux négatif pourrait coûter une vie.
 */

export type SafetyLevel = 'none' | 'medical_urgent' | 'crisis';

export interface SafetyResult {
  level: SafetyLevel;
  reasons: string[];
  /** Langue des motifs reconnus (la première) : repli quand l'application n'a pas transmis sa langue. */
  lang?: SafetyLang;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[’'`´]/g, ' ')
    .replace(/[¿¡]/g, ' ')
    .replace(/\s+/g, ' ');

type Rule = [RegExp, string];

// ===================================================================================================== FRANÇAIS
// Idées suicidaires, auto-agression, peur de faire du mal à soi ou à l'enfant
const FR_CRISIS: Rule[] = [
  [/\b(suicid|sucid|suicd|me suicider|me tuer|en finir|mettre fin a (mes jours|ma vie))/, 'idées suicidaires'],
  [/\b(me pendre|me jeter (sous|du|d un|par la)|sauter (du|d un|par la) (pont|fenetre|balcon|toit)|avaler (tous|toutes) (mes|les) (cachets|medicaments|comprimes))/, 'idées suicidaires'],
  [/\b(envie|besoin|pense|penser|idee) (de|a) (mourir|disparaitre|ne plus (etre la|me reveiller))/, 'idées de mort'],
  [/\b(je veux|j ai envie de|voudrais|j veux|jveux|je veu) (mourir|disparaitre|crever)/, 'idées de mort'],
  [/\b(je (ne )?veux plus|j veux plus|jveux plus|je voudrais ne plus) (vivre|exister|etre la|me reveiller)/, 'idées de mort'],
  [/\b(me faire du mal|me blesser|me scarifier|me mutiler|me taillader|me couper (les bras|les poignets|les veines))/, 'auto-agression'],
  [/\bje me (scarifie|mutile|taillade|fais du mal|coupe (les bras|les poignets|les veines))/, 'auto-agression'],
  [/\b(faire du mal|blesser|secouer|frapper|etouffer) (a |à )?(mon|ma|mes|le|la) ?(bebe|enfant|fils|fille|jumeaux|petit|petite)/, 'peur de faire du mal à l’enfant'],
  [/\bpeur de (lui|leur) faire du mal/, 'peur de faire du mal à l’enfant'],
  [/\b(sans moi (il|elle|ils|elles) seraient mieux|(mon|ma) (bebe|famille) serait mieux sans moi|serai(en)?t mieux sans moi|je suis un poids pour)/, 'sentiment d’être un fardeau'],
  [/\b(plus envie de vivre|plus de raison de vivre|la vie n a plus de sens)/, 'perte du sens de la vie'],
  [/\b(il|elle|on) me (frappe|bat|menace)|violence(s)? conjugale/, 'violences'],
  [/\b(mon|ma) (mari|conjoint|conjointe|compagnon|compagne|copain|copine|ex|femme) me (frappe|bat|menace|etrangle|viole|tape)/, 'violences'],
  [/\b(il|elle|mon (mari|conjoint|compagnon|copain|ex)|ma (femme|conjointe|compagne|copine)) (frappe|secoue|bat|maltraite|etrangle) (mon|ma|mes|le|la|les|notre|nos) ?(bebe|enfant|enfants|fils|fille|petit|petite)/, 'enfant en danger'],
  [/\b(j entends des voix|des voix me disent|je ne me reconnais plus du tout|je ne suis plus moi[- ]meme).{0,80}(bebe|enfant|accouchement|naissance)?/, 'détresse psychique aiguë'],
  [/\b(envie|peur) de (secouer|jeter|lacher) (mon|ma|le|la) ?(bebe|enfant)/, 'peur de faire du mal à l’enfant'],
];

// Signes d'urgence médicale : on oriente vers le 15 / 112, sans interpréter
const FR_MEDICAL: Rule[] = [
  [/\b(ne respire (plus|pas|mal)|respire (tres )?mal|arret (de la )?respiration|devient (bleu|violet)|levres bleues)/, 'difficulté respiratoire'],
  [/\b(convuls|crise d epilepsie|tremble de tout son corps)/, 'convulsions'],
  [/\b(inconscient|ne reagit (plus|pas)|perte de connaissance|s est evanoui|malaise grave)/, 'perte de connaissance'],
  [/\b(saigne (beaucoup|abondamment)|hemorragie|perd (beaucoup )?de sang|caillots? (enormes|tres gros))/, 'saignement important'],
  [/\b(gonfle(ment)? (du visage|des levres|de la langue|de la gorge)|choc anaphylactique|urticaire geante)/, 'réaction allergique grave'],
  [/\b(a avale|a ingere|a bu) (un |une |des |du |de la )?(medicament|produit menager|pile|aimant|javel|lessive)/, 'ingestion dangereuse'],
  [/\b(ne sens plus (le |mon |mes )?(bebe|bouger)|(bebe|il|elle) ne bouge plus)/, 'mouvements fœtaux diminués'],
  [/\bperte des eaux.{0,30}(verte|marron|teintee)|\beaux (vertes|teintees)/, 'liquide amniotique teinté'],
  [/\b((mal|maux) de tete (tres )?(violents?|intenses?)|voit des (mouches|eclairs)).{0,60}(enceinte|grossesse)|(enceinte|grossesse).{0,60}((mal|maux) de tete (tres )?(violents?|intenses?)|voit des (mouches|eclairs))/, 'signes possibles de pré-éclampsie'],
  [/\b(vois|voit) des (mouches|eclairs|points lumineux)|\b(visage|mains|pieds) (tres |tout )?gonfles? (d un coup|brutalement|soudainement)/, 'signes possibles de pré-éclampsie'],
  // Grossesse
  [/\b(j ai perdu|je perds|j ai une perte des|elle a perdu|elle perd) (les eaux|du liquide|beaucoup de liquide)|\bpoche des eaux (est |s est )?(rompue|percee|fissuree)/, 'rupture de la poche des eaux'],
  [/\bcontractions?\b.{0,60}\b(avant (le )?terme|premature|prematurees|a ([1-9]|[12][0-9]|3[0-6]) ?(sa|semaines))\b|\bmenace d accouchement premature/, 'contractions avant terme'],
  [/\bcordon (qui )?(sort|est sorti|depasse)|\bprocidence/, 'procidence du cordon'],
  [/\b(chute|tombee?|accident|choc|coup) (sur le|sur|au|dans le) ventre\b.{0,60}(enceinte|grossesse|sa\b)|(enceinte|grossesse).{0,60}\b(chute|tombee?|accident|choc|coup) (sur le|sur|au|dans le) ventre/, 'traumatisme pendant la grossesse'],
  // Post-partum
  [/\b(douleur (dans la|a la|a) poitrine|douleur thoracique|essouffl(e|ement) (brutal|soudain|d un coup)|crache du sang)/, 'douleur thoracique ou essoufflement brutal'],
  [/\b(mollet|jambe)\b.{0,20}\b(gonfle|chaud|douloureux|dur)\b.{0,80}(enceinte|grossesse|accouch|cesarienne|post[- ]?partum)|(enceinte|grossesse|accouch|cesarienne|post[- ]?partum).{0,80}\b(mollet|jambe)\b.{0,20}\b(gonfle|chaud|douloureux|dur)\b/, 'signes possibles de phlébite'],
  [/\bfievre\b.{0,60}(accouchement|cesarienne|post[- ]?partum|cicatrice)|(accouchement|cesarienne|post[- ]?partum|cicatrice).{0,60}\bfievre/, 'fièvre après l’accouchement'],
  [/\b(je remplis|remplit|trempe) (une |plus d une |plusieurs )?(serviette|protection)s? (par|en|toutes? les) (heure|moins d une heure)/, 'saignement important'],
  // Bébé / enfant
  [/\b(bebe|nourrisson|nouveau[- ]?ne|enfant|fils|fille)\b.{0,60}\b(tout mou|mou comme|ne se reveille (pas|plus)|difficile a reveiller|tres somnolent|ne reagit pas|geint|gemit sans arret)/, 'enfant inhabituellement somnolent ou mou'],
  [/\bfontanelle\b.{0,30}\b(bombee|gonflee|tendue)/, 'fontanelle bombée'],
  [/\b(taches?|boutons?) (violet(te)?s?|violace(e)?s?|rouges? fonces?) qui ne (s effacent|disparaissent) pas|\bpurpura/, 'taches violacées (purpura)'],
  [/\bvomi(t|ssements?|e)? (vert|verts|bilieux)|\bvomissements? en jet\b.{0,40}(bebe|nourrisson|nouveau)/, 'vomissements verts ou en jet'],
  [/\b(bebe|nourrisson|nouveau[- ]?ne)\b.{0,60}\b(ne boit plus|refuse (de boire|tous les biberons|le sein depuis)|plus de couches? mouillees?|couches? seches? depuis)/, 'risque de déshydratation'],
  [/\b(bebe|nourrisson|nouveau[- ]?ne|enfant|fils|fille)\b.{0,60}\b(est tombee?|chute)\b.{0,40}\b(tete|table a langer|lit|escalier)/, 'chute chez le jeune enfant'],
];

// ===================================================================================================== ENGLISH
const EN_CRISIS: Rule[] = [
  [/\b(suicid|sucid|suicd|kil+(ing)? my ?self|kms\b|end (it all|my life|my own life)|take my (own )?life|off my ?self|unalive)/, 'idées suicidaires'],
  [/\b(hang my ?self|jump (off|from) (a|the) (bridge|building|roof|balcony)|overdose on|swallow (all )?(my|the) (pills|tablets))/, 'idées suicidaires'],
  [/\b(want|wanna|wish( i (was|were|could))?|would like|d like|d love) (to )?(die|be dead|dead|disappear|not (be here|exist|wake up)|never wake up|sleep forever)/, 'idées de mort'],
  [/\b(thoughts?|thinking|think|thought) (of|about) (suicide|dying|death|ending (it|my life)|killing my ?self|hurting my ?self)/, 'idées de mort'],
  [/\b(don t|do not|dont|no longer) (want to|wanna) (live|be alive|exist|go on|be here|wake up)/, 'idées de mort'],
  [/\b(want|wanna|urge|urges|tempted|keep|started|afraid i ll|scared i ll|might|going to|gonna|need) (to )?(hurt|harm|cut|burn)(ing)? my ?self|\bself[- ]?harm|\bcutting my ?self|\bcut my ?self (again|on purpose|deliberately)/, 'auto-agression'],
  [/\b(shake|smother|suffocate|strangle|kill|drown) (my|our|the) ?(baby|babies|child|kid|son|daughter|newborn|twins|little one)/, 'peur de faire du mal à l’enfant'],
  [/\bi (could|might|will|want to|wanna|m going to|am going to|m gonna|feel like i (could|might))( really)? (hurt|harm|hit|shake|throw|drop) (my|our|the|him|her|them)\b/, 'peur de faire du mal à l’enfant'],
  [/\b(afraid|scared|terrified|urge|tempted|thoughts?|worried)\b.{0,30}\b(hurt|harm|shake|hit|smother|drop|throw|kill)\b.{0,15}\b(him|her|them|baby|child|kid|son|daughter)/, 'peur de faire du mal à l’enfant'],
  [/\b(better off without me|(be|been) better without me|i m a burden|i am a burden|(a )?burden (to|on) (everyone|my family|them))/, 'sentiment d’être un fardeau'],
  [/\b(no (reason|point) (to|in) (live|living|going on)|(life|living) (is|feels) (pointless|meaningless|not worth)|not worth living|can t go on (anymore|like this|living)|cannot go on (anymore|like this|living))/, 'perte du sens de la vie'],
  [/\b(he|she|my (husband|partner|boyfriend|wife|girlfriend|ex)) (hits|beats|chokes|strangles|threatens|abuses|kicks|rapes) me|domestic (violence|abuse)|abusive (partner|husband|relationship)|i m (being )?(abused|beaten)/, 'violences'],
  [/\b(he|she|my (husband|partner|boyfriend|wife|girlfriend|ex)) (hits|beats|shakes|abuses|hurts) (my|our|the) (baby|child|kid|son|daughter|children|kids)/, 'enfant en danger'],
  [/\b(i hear voices|hearing voices|voices (tell|telling) me|i don t recognise myself|i don t recognize myself|i m not myself anymore)/, 'détresse psychique aiguë'],
];

const EN_MEDICAL: Rule[] = [
  [/\b(not breathing|isn t breathing|stopped breathing|struggling to breathe|can t breathe|trouble breathing|turning (blue|purple|grey|gray)|blue lips|lips (are |turning )?blue)/, 'difficulté respiratoire'],
  [/\b(seizure|convuls|having a fit)/, 'convulsions'],
  [/\b(unconscious|unresponsive|not responding|passed out|fainted|won t wake up|can t wake (him|her|them|the baby))/, 'perte de connaissance'],
  [/\b(bleeding (heavily|a lot|so much)|heavy bleeding|haemorrhag|hemorrhag|soak(ing|ed|s)? (a |one |through )?(pad|pads|maternity pad)|huge (blood )?clots|large (blood )?clots)/, 'saignement important'],
  [/\b(swollen (face|lips|tongue|throat)|(face|lips|tongue|throat) (is |are )?(swelling|swollen)|anaphyla)/, 'réaction allergique grave'],
  [/\b(swallowed|ingested|drank|ate) (a |an |some |the |my |his |her )?(button )?(battery|batteries|magnet|magnets|bleach|detergent|pills|medicine|medication|tablets|laundry pod|cleaning product)/, 'ingestion dangereuse'],
  [/\b(baby|bump)( is| has)? (not moving|stopped moving|moving less|hasn t moved)|(can t|cannot|don t) feel (the |my )?baby (move|moving|kick)|reduced (fetal|foetal) movement/, 'mouvements fœtaux diminués'],
  [/\b(waters?|water) (broke|has broken|have broken|just broke)|(green|brown) (waters|fluid)/, 'rupture de la poche des eaux'],
  [/\bcontractions?\b.{0,60}\b(preterm|premature|at ([1-9]|[12][0-9]|3[0-6]) weeks)/, 'contractions avant terme'],
  [/\bcord (is )?(coming out|sticking out)|cord prolapse/, 'procidence du cordon'],
  [/\b(seeing (spots|flashing lights|stars)|flashing lights|blurred vision)\b.{0,60}(pregnan|weeks)|pregnan.{0,60}(severe headache|seeing (spots|flashing lights)|blurred vision)|(severe|terrible|worst) headache.{0,60}pregnan/, 'signes possibles de pré-éclampsie'],
  [/\b(chest pain|pain in my chest|cough(ing)? (up )?blood|sudden(ly)? (short of breath|breathless))/, 'douleur thoracique ou essoufflement brutal'],
  [/\b(calf|leg)\b.{0,20}\b(swollen|hot|painful|red)\b.{0,80}(pregnan|birth|c[- ]?section|postpartum|delivery)|(pregnan|birth|c[- ]?section|postpartum|delivery).{0,80}\b(calf|leg)\b.{0,20}\b(swollen|hot|painful|red)\b/, 'signes possibles de phlébite'],
  [/\bfever\b.{0,60}(birth|c[- ]?section|postpartum|delivery|scar)|(birth|c[- ]?section|postpartum|delivery).{0,60}\bfever/, 'fièvre après l’accouchement'],
  [/\b(baby|newborn|infant|son|daughter|child)\b.{0,60}\b(floppy|limp|hard to wake|won t wake|very (sleepy|drowsy)|not responding|unresponsive|moaning constantly)/, 'enfant inhabituellement somnolent ou mou'],
  [/\b(soft spot|fontanel+e?)\b.{0,30}\b(bulging|swollen|tense)/, 'fontanelle bombée'],
  [/\b(rash|spots)\b.{0,40}\b(doesn t|does not|don t|do not|won t) fade|purple (spots|rash)|\bpurpura/, 'taches violacées (purpura)'],
  [/\b(vomit\w*|throwing up|being sick|sick) (green|bile)|projectile vomit\w*.{0,40}(baby|newborn|infant)|(baby|newborn|infant).{0,40}projectile vomit/, 'vomissements verts ou en jet'],
  [/\b(baby|newborn|infant)\b.{0,60}\b(not feeding|won t feed|refus\w* (to feed|all feeds|the breast|the bottle|every bottle)|no wet (nappies|diapers)|dry (nappies|diapers))/, 'risque de déshydratation'],
  [/\b(baby|newborn|infant|son|daughter|child|toddler)\b.{0,60}\b(fell|fallen)\b.{0,40}\b(head|changing table|bed|stairs|sofa|couch)/, 'chute chez le jeune enfant'],
];

// ===================================================================================================== DEUTSCH
// Texte ohne Umlaute (normalize) ; « ae / oe / ue » sont aussi essayés repliés (cf. assessSafety).
const DE_CRISIS: Rule[] = [
  [/\b(suizid|selbstmord|suicid|mich (selbst )?(umbringen|toten|umzubringen|zu toten)|mir (das leben|etwas|was) (zu )?(nehmen|antun)|meinem leben ein ende|schluss machen mit (allem|mir|dem leben)|mich (aufhangen|erhangen|vor den zug werfen))/, 'idées suicidaires'],
  [/\b(will|mochte|wurde gern|wunsche mir|wunschte|ich wunsch)\b.{0,20}\b(sterben|tot sein|verschwinden|nicht mehr (leben|da sein|aufwachen|existieren))/, 'idées de mort'],
  [/\b(nicht mehr leben|lebensmud|todessehnsucht|einfach (sterben|verschwinden)|nie mehr aufwachen)/, 'idées de mort'],
  [/\b(mich (selbst )?(verletzen|ritzen|schneiden)|selbstverletz|ritze mich|schneide mich)/, 'auto-agression'],
  [/\b(mein(em|en)?|unser(em|en)?|das|dem) (baby|kind|sohn|tochter|neugeborene\w*|zwillinge\w*|kleine\w*)\b.{0,30}\b(weh ?(zu ?)?tun|wehzutun|schutteln|ersticken|verletzen|toten|umbringen|(etwas|was) antun)/, 'peur de faire du mal à l’enfant'],
  [/\bich (konnte|will|wurde|mochte|muss)\b.{0,25}\b(baby|kind|sohn|tochter)\b.{0,15}\b(schlagen|werfen|schutteln|wegwerfen)/, 'peur de faire du mal à l’enfant'],
  [/\b(angst|drang|gedanken?)\b.{0,40}\b(weh ?zu ?tun|wehzutun|zu schutteln|zu schlagen|zu verletzen|zu toten|(etwas|was) anzutun)/, 'peur de faire du mal à l’enfant'],
  [/\b(ohne mich (waren|ware) (sie|alle|es|er|meine familie)? ?besser dran|(meine familie|mein baby|alle|sie) (ware|waren) ohne mich besser( dran)?|ich bin (nur )?eine last)/, 'sentiment d’être un fardeau'],
  [/\b(keinen sinn mehr|(kein|keinen) grund mehr zu leben|das leben (hat|macht) keinen sinn|will nicht mehr leben|kann nicht mehr weiterleben)/, 'perte du sens de la vie'],
  [/\b(er|sie|mein (mann|partner|freund|ex)|meine (frau|partnerin|freundin)) (schlagt|verprugelt|bedroht|wurgt|misshandelt|tritt|vergewaltigt) mich|hausliche gewalt|gewalt in der (ehe|beziehung)/, 'violences'],
  [/\b(er|sie|mein (mann|partner|freund|ex)|meine (frau|partnerin|freundin)) (schlagt|schuttelt|misshandelt|verletzt) (mein|meine|unser|unsere|das|die) (baby|kind|kinder|sohn|tochter)/, 'enfant en danger'],
  [/\b(ich hore stimmen|hore stimmen|stimmen sagen mir|ich erkenne mich (selbst )?nicht (mehr|wieder)|ich bin nicht mehr ich( selbst)?)/, 'détresse psychique aiguë'],
];

const DE_MEDICAL: Rule[] = [
  [/\b(atmet (nicht|kaum|schwer|schlecht)|hort auf zu atmen|bekommt keine luft|kriegt keine luft|atemnot|lauft blau an|wird blau|blaue lippen|lippen (sind |werden )?blau)/, 'difficulté respiratoire'],
  [/\b(krampfanfall|krampft|zuckt am ganzen korper|epileptisch)/, 'convulsions'],
  [/\b(bewusstlos|reagiert (nicht|kaum)|ohnmachtig|wacht nicht (mehr )?auf|nicht (mehr )?wach zu (kriegen|bekommen))/, 'perte de connaissance'],
  [/\b(blute (stark|sehr stark|sehr viel|viel)|starke blutung|blutet (stark|sehr stark)|verliere (sehr )?viel blut|grosse blutklumpen|binde (pro|in einer) stunde)/, 'saignement important'],
  [/\b(geschwollen\w* (gesicht|lippen|zunge)|(gesicht|lippen|zunge|hals) (ist |sind )?(stark )?(geschwollen|schwillt|schwellen)|anaphyla|allergischer schock)/, 'réaction allergique grave'],
  [/\b(batterie|knopfzelle|magnet|tablette|medikament|putzmittel|spulmittel|bleiche|waschmittel|reiniger)\w*\b.{0,40}\b(verschluckt|geschluckt|getrunken|gegessen)|\b(verschluckt|geschluckt|getrunken)\b.{0,40}\b(batterie|knopfzelle|magnet|tablette|medikament|putzmittel|waschmittel)/, 'ingestion dangereuse'],
  [/\b(baby|kind) (bewegt sich|regt sich|tritt) (nicht mehr|kaum( noch)?|weniger)|(keine|weniger) kindsbewegungen|spure (mein |das )?baby (nicht|kaum)( mehr)?/, 'mouvements fœtaux diminués'],
  [/\b(fruchtblase (ist )?geplatzt|blasensprung|fruchtwasser (ist )?(grun|braun|abgegangen|lauft))/, 'rupture de la poche des eaux'],
  [/\bwehen\b.{0,60}\b(zu fruh|fruhgeburt|in der ([1-9]|[12][0-9]|3[0-6])\.? ?ssw)/, 'contractions avant terme'],
  [/\b(sehe (flimmern|blitze|sternchen|flecken)|augenflimmern)|(starke|heftige) kopfschmerzen.{0,60}(schwanger|ssw)|(schwanger|ssw).{0,60}(starke|heftige) kopfschmerzen/, 'signes possibles de pré-éclampsie'],
  [/\b(brustschmerz|schmerzen in der brust|huste blut|hustet blut|plotzlich (atemnot|kurzatmig))/, 'douleur thoracique ou essoufflement brutal'],
  [/\bfieber\b.{0,60}(geburt|kaiserschnitt|wochenbett|narbe)|(geburt|kaiserschnitt|wochenbett).{0,60}\bfieber/, 'fièvre après l’accouchement'],
  [/\b(baby|saugling|neugeborene\w*|kind|sohn|tochter)\b.{0,60}\b(ganz schlapp|schlapp|apathisch|schwer zu wecken|nicht wach zu (kriegen|bekommen)|wimmert (standig|ununterbrochen))/, 'enfant inhabituellement somnolent ou mou'],
  [/\bfontanelle\b.{0,30}\b(gewolbt|vorgewolbt|gespannt|prall)/, 'fontanelle bombée'],
  [/\b(flecken|punkte|ausschlag)\b.{0,40}\b(verschwinden|verblassen|gehen) nicht|lila flecken|purpura/, 'taches violacées (purpura)'],
  [/\b(erbricht|spuckt|kotzt|erbrechen)\b.{0,20}\b(grun|galle)|schwallartig\w* (erbrechen|erbricht)/, 'vomissements verts ou en jet'],
  [/\b(baby|saugling|neugeborene\w*)\b.{0,60}\b(trinkt (nicht|kaum)|verweigert (die flasche|die brust|das trinken|jede flasche)|keine nassen windeln|trockene windeln)/, 'risque de déshydratation'],
  [/\b(baby|saugling|kind|sohn|tochter)\b.{0,80}\b(wickeltisch|bett|treppe|sofa|kopf)\b.{0,40}\b(gefallen|gesturzt|aufgeschlagen)|\b(baby|saugling|kind|sohn|tochter)\b.{0,60}\b(gefallen|gesturzt)\b.{0,40}\b(kopf|wickeltisch|treppe)/, 'chute chez le jeune enfant'],
];

// ===================================================================================================== ESPAÑOL
const ES_CRISIS: Rule[] = [
  [/\b(suicid|sucid|matarme|me quiero matar|quitarme la vida|acabar con (todo|mi vida)|terminar con (todo|mi vida)|ahorcarme|tirarme (por la ventana|de un puente|del balcon|a las vias))/, 'idées suicidaires'],
  [/\b(quiero|quisiera|me gustaria|ganas de) (morir(me)?|desaparecer|estar muert[oa]|no despertar(me)?)/, 'idées de mort'],
  [/\b(no quiero|ya no quiero) (vivir|seguir viviendo|estar aqui|despertar(me)?|existir)/, 'idées de mort'],
  [/\b(pienso|pensando|pensamientos?) (en )?(el )?(suicidio|morir(me)?|matarme)/, 'idées de mort'],
  [/\b(hacerme (dano|danio)|lastimarme|herirme|autolesion|cortarme (los brazos|las munecas|las venas|la piel)|me corto (los brazos|las munecas|las venas))/, 'auto-agression'],
  [/\b(zarandear|sacudir|asfixiar|ahogar|matar) (a )?(mi|mis|nuestro|nuestra) (bebe|hijo|hija|nino|nina|hijos|mellizos|gemelos|peque)/, 'peur de faire du mal à l’enfant'],
  [/\b(miedo|ganas|impulso) (de|a) (hacerle (dano|danio)|lastimar(lo|la|le)?|sacudir(lo|la|le)?|zarandear(lo|la|le)?|golpear(lo|la|le)?|tirar(lo|la|le)?|asfixiar(lo|la|le)?)/, 'peur de faire du mal à l’enfant'],
  [/\b(podria|voy a|quiero|me dan ganas de) (hacerle (dano|danio)|lastimar|golpear|tirar)\b.{0,8}\b(a )?(mi|mis|nuestro|nuestra) (bebe|hijo|hija|nino|nina|hijos|peque)/, 'peur de faire du mal à l’enfant'],
  [/\b(estarian|estaria) mejor sin mi|soy una carga/, 'sentiment d’être un fardeau'],
  [/\b(no tiene sentido (vivir|seguir)|ya no tengo (ganas|razones) de vivir|sin ganas de vivir|no vale la pena vivir|la vida no tiene sentido)/, 'perte du sens de la vie'],
  [/\b(el|ella|mi (marido|pareja|novio|esposo|ex|mujer|esposa|novia)) me (pega|golpea|maltrata|amenaza|ahorca|estrangula|viola)|violencia (de genero|domestica|machista)/, 'violences'],
  [/\b(el|ella|mi (marido|pareja|novio|esposo|ex|mujer|esposa|novia)) (le )?(pega|golpea|sacude|zarandea|maltrata) (a )?(mi|mis|nuestro|nuestra|el|la) (bebe|hijo|hija|nino|nina|hijos)/, 'enfant en danger'],
  [/\b(oigo voces|escucho voces|las voces me dicen|no me reconozco|ya no soy yo( misma| mismo)?)/, 'détresse psychique aiguë'],
];

const ES_MEDICAL: Rule[] = [
  [/\b(no respira|respira (mal|con dificultad)|le cuesta respirar|dificultad para respirar|se (pone|esta poniendo|puso|ha puesto) (azul|morad[oa])|labios (azules|morados))/, 'difficulté respiratoire'],
  [/\b(convuls|ataque epileptico|crisis epileptica|tiembla todo el cuerpo)/, 'convulsions'],
  [/\b(inconsciente|no reacciona|no responde|perdio el conocimiento|ha perdido el conocimiento|se desmayo|se ha desmayado|no se despierta)/, 'perte de connaissance'],
  [/\b(sangro (mucho|muchisimo)|sangrado (abundante|muy fuerte|fuerte)|hemorragia|pierdo mucha sangre|coagulos (enormes|muy grandes)|empapo (una|mas de una) compresa)/, 'saignement important'],
  [/\b(se le (hincha|hinchan|ha hinchado|han hinchado) (la cara|los labios|la lengua|la garganta)|(cara|labios|lengua|garganta) hinchad|anafila)/, 'réaction allergique grave'],
  [/\b(se ha tragado|se trago|trago|ha tragado|ha bebido|bebio|ingirio|ha ingerido)\b.{0,20}\b(pila|iman|lejia|detergente|medicamento|pastillas|producto de limpieza|capsula de detergente)/, 'ingestion dangereuse'],
  [/\b(no siento (a mi bebe|al bebe|que el bebe se mueva|moverse al bebe|al bebe moverse)|el bebe (no se mueve|se mueve (menos|mucho menos)|ya no se mueve)|no noto (al bebe|a mi bebe|movimientos))/, 'mouvements fœtaux diminués'],
  [/\b(he roto aguas|rompi (la )?(fuente|aguas|bolsa)|se me ha roto la (bolsa|fuente)|liquido (amniotico )?(verde|marron))/, 'rupture de la poche des eaux'],
  [/\bcontracciones\b.{0,60}\b(prematur\w*|antes de tiempo|a las ([1-9]|[12][0-9]|3[0-6]) semanas)/, 'contractions avant terme'],
  [/\b(veo (lucecitas|destellos|puntitos|manchas))|dolor de cabeza (muy )?(fuerte|intenso).{0,60}(embaraz|semanas)|embaraz.{0,60}dolor de cabeza (muy )?(fuerte|intenso)/, 'signes possibles de pré-éclampsie'],
  [/\b(dolor (en el|de) pecho|dolor toracico|toso sangre|tose sangre|me ahogo de repente)/, 'douleur thoracique ou essoufflement brutal'],
  [/\bfiebre\b.{0,60}(parto|cesarea|posparto|cicatriz)|(parto|cesarea|posparto).{0,60}\bfiebre/, 'fièvre après l’accouchement'],
  [/\b(bebe|recien nacid\w*|nino|nina|hijo|hija)\b.{0,60}\b(muy (blandit[oa]|floj[oa]|decaid[oa]|somnolient[oa])|flacid[oa]|cuesta (mucho )?despertar|no se despierta|no reacciona|gime sin parar)/, 'enfant inhabituellement somnolent ou mou'],
  [/\bfontanela\b.{0,30}\b(abombada|hinchada|tensa)/, 'fontanelle bombée'],
  [/\b(manchas|puntitos|puntos)\b.{0,40}\b(morad\w*|violace\w*|rojo oscuro)\b.{0,40}\bno (desaparecen|se van)|no desaparecen al (presionar|apretar)|purpura/, 'taches violacées (purpura)'],
  [/\bvomit\w* (verde|bilios\w*)|vomit\w* en (escopetazo|proyectil|chorro)/, 'vomissements verts ou en jet'],
  [/\b(bebe|recien nacid\w*)\b.{0,60}\b(no (quiere )?(comer|beber|tomar)|rechaza (el pecho|los biberones|todas las tomas)|no moja (el panal|los panales)|panales secos)/, 'risque de déshydratation'],
  [/\b(bebe|nino|nina|hijo|hija)\b.{0,60}\b(se cayo|se ha caido|cayo)\b.{0,40}\b(cabeza|cambiador|cama|escalera|sofa)/, 'chute chez le jeune enfant'],
];

// ===================================================================================================== ITALIANO
const IT_CRISIS: Rule[] = [
  [/\b(suicid|sucid|uccidermi|ammazzarmi|farla finita|togliermi la vita|porre fine alla mia vita|impiccarmi|buttarmi (dal ponte|dalla finestra|dal balcone|sotto un treno))/, 'idées suicidaires'],
  [/\b(voglio|vorrei|ho voglia di) (morire|sparire|scomparire|essere mort[oa]|non svegliarmi)/, 'idées de mort'],
  [/\b(non voglio piu|non ho piu voglia di) (vivere|svegliarmi|esserci|esistere)/, 'idées de mort'],
  [/\b(penso|pensando|pensieri) (al|di|a) (suicidio|morire|uccidermi|farla finita)/, 'idées de mort'],
  [/\b(farmi del male|farmi male|ferirmi|autolesion|tagliarmi (le braccia|i polsi|le vene)|mi taglio (le braccia|i polsi))/, 'auto-agression'],
  [/\b(scuotere|scrollare|soffocare|strozzare|uccidere|ammazzare) (il |la |i )?(mio |mia |miei |nostro |nostra )?(bambin[oa]|figli[oa]|neonat[oa]|bebe|bimb[oa]|gemelli|piccol[oa])/, 'peur de faire du mal à l’enfant'],
  [/\b(paura di|voglia di|potrei|vorrei|l impulso di|penso di) (fare del male|far(e)? male|picchiare|colpire|scuotere|soffocare|buttare)\b.{0,15}\b(bambin[oa]|figli[oa]|neonat[oa]|bebe|bimb[oa]|gemelli|piccol[oa])/, 'peur de faire du mal à l’enfant'],
  [/\bpaura di (fargli|farle|far loro) (del )?male/, 'peur de faire du mal à l’enfant'],
  [/\b(starebbero meglio senza di me|stareb+e meglio senza di me|sono un peso)/, 'sentiment d’être un fardeau'],
  [/\b(non ha (piu )?senso vivere|nessun motivo per vivere|non ho piu voglia di vivere|la vita non ha (piu )?senso)/, 'perte du sens de la vie'],
  [/\b(lui|lei|mio (marito|compagno|ragazzo|ex)|mia (moglie|compagna|ragazza)) mi (picchia|minaccia|maltratta|strangola|mena|violenta)|violenza domestica/, 'violences'],
  [/\b(lui|lei|mio (marito|compagno|ragazzo|ex)|mia (moglie|compagna|ragazza)) (picchia|scuote|maltratta|mena) (il |la |i )?(mio |mia |miei |nostro |nostra )?(bambin[oaie]|figli[oaie]?|neonat[oa]|bimb[oaie])/, 'enfant en danger'],
  [/\b(sento (delle )?voci|le voci mi dicono|non mi riconosco piu|non sono piu (io|me stess[oa]))/, 'détresse psychique aiguë'],
];

const IT_MEDICAL: Rule[] = [
  [/\b(non respira|respira (male|a fatica)|fa fatica a respirare|difficolta a respirare|diventa (blu|viola|cianotic\w*)|labbra (blu|viola))/, 'difficulté respiratoire'],
  [/\b(convulsion|crisi epilettica|attacco epilettico|trema tutto)/, 'convulsions'],
  [/\b(incoscient\w*|privo di sensi|priva di sensi|non reagisce|non risponde|ha perso conoscenza|e svenut\w*|non si sveglia)/, 'perte de connaissance'],
  [/\b(sanguino (molto|tantissimo)|perdo (molto|tanto) sangue|emorragia|sanguinamento (abbondante|forte)|coaguli (enormi|molto grandi))/, 'saignement important'],
  [/\b(gonfi\w* (il viso|la faccia|le labbra|la lingua|la gola)|(viso|faccia|labbra|lingua|gola) (gonfi\w*|si gonfia)|anafila)/, 'réaction allergique grave'],
  [/\b(ha ingoiato|ha inghiottito|ha bevuto|ha ingerito)\b.{0,20}\b(pila|batteria|calamita|magnete|candeggina|detersivo|medicin\w*|farmac\w*|pastigl\w*|capsula)/, 'ingestion dangereuse'],
  [/\b(non sento (piu )?(il bambino|il bebe|la bambina) muovere|non sento (piu )?muovere|(il bambino|la bambina|il bebe) (non si muove|si muove (meno|molto meno))|non lo sento (piu )?muovere|movimenti fetali ridotti)/, 'mouvements fœtaux diminués'],
  [/\b(mi si sono rotte le acque|ho rotto le acque|si sono rotte le acque|liquido (amniotico )?(verde|marrone|tinto))/, 'rupture de la poche des eaux'],
  [/\bcontrazioni\b.{0,60}\b(premature|pretermine|a ([1-9]|[12][0-9]|3[0-6]) settimane)/, 'contractions avant terme'],
  [/\b(vedo (lampi|puntini|mosche|lucine))|mal di testa (molto )?(forte|fortissimo|intenso).{0,60}(incinta|gravidanza|settimane)|(incinta|gravidanza).{0,60}mal di testa (molto )?(forte|fortissimo|intenso)/, 'signes possibles de pré-éclampsie'],
  [/\b(dolore al petto|dolore toracico|tossisco sangue|tossisce sangue)/, 'douleur thoracique ou essoufflement brutal'],
  [/\bfebbre\b.{0,60}(parto|cesareo|post[- ]?partum|cicatrice)|(parto|cesareo|post[- ]?partum).{0,60}\bfebbre/, 'fièvre après l’accouchement'],
  [/\b(bambin\w*|neonat\w*|bebe|figli\w*|bimb\w*)\b.{0,60}\b(molle|floscio|flaccid\w*|difficile da svegliare|non si sveglia|molto (sonnolent\w*|assonnat\w*)|geme di continuo|non reagisce)/, 'enfant inhabituellement somnolent ou mou'],
  [/\bfontanella\b.{0,30}\b(bombat\w*|gonfi\w*|tesa)/, 'fontanelle bombée'],
  [/\b(macchie|macchioline|puntini)\b.{0,40}\b(viola|violac\w*|rosso scuro)\b.{0,40}\bnon (scompaiono|spariscono)|non scompaiono (se premo|alla pressione)|porpora/, 'taches violacées (purpura)'],
  [/\bvomit\w* (verde|bile)|vomito a getto/, 'vomissements verts ou en jet'],
  [/\b(bambin\w*|neonat\w*|bebe)\b.{0,60}\b(non (mangia|beve|prende il latte)|rifiuta (il seno|il biberon|tutte le poppate)|pannolini asciutti|non bagna (il pannolino|i pannolini))/, 'risque de déshydratation'],
  [/\b(bambin\w*|neonat\w*|figli\w*|bimb\w*)\b.{0,60}\b(e caduto|e caduta|caduto|caduta)\b.{0,40}\b(testa|fasciatoio|letto|scale|divano)/, 'chute chez le jeune enfant'],
];

/** Langues couvertes (celles de l'application) et leurs motifs. */
export type SafetyLang = 'fr' | 'en' | 'de' | 'es' | 'it';
export const SAFETY_LANGS: readonly SafetyLang[] = ['fr', 'en', 'de', 'es', 'it'];
export const toSafetyLang = (v: unknown): SafetyLang | undefined =>
  typeof v === 'string' && (SAFETY_LANGS as readonly string[]).includes(v.slice(0, 2).toLowerCase()) ? (v.slice(0, 2).toLowerCase() as SafetyLang) : undefined;

const RULES: Record<SafetyLang, { crisis: Rule[]; medical: Rule[] }> = {
  fr: { crisis: FR_CRISIS, medical: FR_MEDICAL },
  en: { crisis: EN_CRISIS, medical: EN_MEDICAL },
  de: { crisis: DE_CRISIS, medical: DE_MEDICAL },
  es: { crisis: ES_CRISIS, medical: ES_MEDICAL },
  it: { crisis: IT_CRISIS, medical: IT_MEDICAL },
};

// Fièvre chez un nourrisson de moins de 3 mois : toujours un avis médical rapide (toutes langues)
const FEVER = /\b(fievre|fever|fieber|fiebre|febbre|calentura)\b|\b(38|39|40)([.,][0-9])? ?(°|degres|degrees|grad|grados|gradi)/;
const INFANT_SUBJECT = '(nouveau[ -]?ne|nourrisson|bebe|fille|fils|enfant|il|elle|baby|newborn|infant|son|daughter|he|she|saugling|neugeborene\\w*|kind|sohn|tochter|recien nacid\\w*|nino|nina|hijo|hija|neonat\\w*|bambin\\w*|figli\\w*|bimb\\w*)';
const INFANT_AGE = '((de |a |a peine |of |von |di )?([0-9]|1[0-2]) (jours?|semaines?|days?|weeks?|tage\\w*|wochen|dias|semanas|giorni|settimane)'
  + '|(de |a |of |di )?(moins de |under |less than |unter |menos de |meno di )?(1|2|un|deux|one|two|ein\\w*|zwei|uno|una|dos|due) (mois|months?|monat\\w*|mes(es)?|mes[ei])'
  + '|3 (mois|months?|monat\\w*|meses|mesi))';
const INFANT_UNDER_3M = new RegExp(
  `\\b${INFANT_SUBJECT}\\b.{0,20}\\b${INFANT_AGE}\\b`
  + '|\\b([0-9]|1[0-2])[ -](days?|weeks?)[ -]old\\b|\\b(1|2|one|two)[ -]months?[ -]old\\b'
  + '|\\b([0-9]|1[0-2]) (tage|wochen) alt|\\b(1|2|ein|einen|zwei) monat\\w* alt'
  + '|\\b(nouveau[ -]?ne|newborn|neugeboren\\w*|recien nacid\\w*|neonat\\w*)\\b',
);

// Expressions figées qui ne disent pas une détresse (« mort de rire », « dying laughing »…) : retirées avant l'analyse.
// Liste volontairement courte : en cas de doute, on affiche le message de soutien.
const IDIOMS: RegExp[] = [
  /\b(mort|morte|morts|mortes) de (rire|fatigue|faim|froid|chaud|honte|peur|ennui)\b/g,
  /\bje (suis|me sens) mort[e]? de (rire|fatigue)\b/g,
  /\b(dying|die|died|dead) (of |from |with )?(laughter|laughing|embarrassment|boredom)\b/g,
  /\bdead tired\b|\bdying to (know|try|see|meet|hear)\b/g,
  /\b(tot ?mude|todmude|totgelacht|tot ?lachen|sterbe vor (lachen|langeweile|hunger|mudigkeit|neugier))\b/g,
  /\b(muert[oa]s? de (risa|sueno|cansancio|hambre|verguenza|miedo|frio|calor)|me muero de (risa|sueno|hambre|ganas|cansancio|frio|calor))\b/g,
  /\b(mort[oa] (dal|di|dalle|dalla) (ridere|risate|sonno|stanchezza|fame|freddo|caldo|vergogna|paura)|da morire)\b/g,
];

export function assessSafety(text: string): SafetyResult {
  let t = normalize(text);
  for (const re of IDIOMS) t = t.replace(re, ' ');
  // Allemand tapé sans tréma (« moechte », « schuetteln ») : on essaie aussi la forme repliée
  const folded = t.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
  const hits = (kind: 'crisis' | 'medical') => {
    const reasons: string[] = [];
    let lang: SafetyLang | undefined;
    for (const l of SAFETY_LANGS) {
      for (const [re, reason] of RULES[l][kind]) {
        if (re.test(t) || (l === 'de' && re.test(folded))) { reasons.push(reason); lang ??= l; }
      }
    }
    return { reasons, lang };
  };
  const crisis = hits('crisis');
  if (crisis.reasons.length) return { level: 'crisis', reasons: unique(crisis.reasons), lang: crisis.lang };
  const medical = hits('medical');
  if (FEVER.test(t) && INFANT_UNDER_3M.test(t)) medical.reasons.push('fièvre chez un nourrisson');
  if (medical.reasons.length) return { level: 'medical_urgent', reasons: unique(medical.reasons), lang: medical.lang };
  return { level: 'none', reasons: [] };
}

const unique = (a: string[]) => [...new Set(a)];

// ===================================================================================================== RESSOURCES
/**
 * Numéros d'urgence par pays de résidence : COPIE de REGIONS (src/i18n/locales.ts, champ « emergency »), sans aucun
 * numéro ajouté (vérifié par src/__tests__/safetyMultilang.test.ts). Hors de France, l'application ne dispose
 * d'aucune ligne d'écoute sourcée : on oriente vers le numéro d'urgence du pays, le médecin et l'entourage.
 */
export const REGION_EMERGENCY: Record<string, string[]> = {
  FR: ['15', '112', '3114'], BE: ['112'], CH: ['144', '112'], LU: ['112'], CA: ['911'], GB: ['999', '112'], IE: ['112', '999'],
  US: ['911'], ES: ['112'], IT: ['112'], DE: ['112'], PT: ['112'], AE: ['999', '998'], MA: ['15', '19', '112'], OTHER: ['112'],
};

export interface SafetyOptions {
  /** Langue d'affichage (celle de l'application) ; à défaut, le français. */
  lang?: SafetyLang | string | null;
  /** Pays de résidence choisi dans l'application (code de REGIONS) ; à défaut : France en français, sinon 112. */
  region?: string | null;
}

const resolve = (o?: SafetyOptions) => {
  const lang = toSafetyLang(o?.lang) ?? 'fr';
  const r = typeof o?.region === 'string' ? o.region.toUpperCase() : '';
  const region = REGION_EMERGENCY[r] ? r : lang === 'fr' ? 'FR' : 'OTHER';
  return { lang, region };
};
const bold = (nums: string[], or: string) => nums.map((n) => `**${n}**`).join(` ${or} `);

type Txt = {
  crisisFR: string[]; medicalFR: string[];
  crisisIntl: (n: string) => string[]; medicalIntl: (n: string) => string[];
  or: string;
  samu: [string, string]; eu: [string, string]; suicide: [string, string]; deaf: [string, string]; local: [string, string];
};

const TXT: Record<SafetyLang, Txt> = {
  fr: {
    crisisFR: [
      'Ce que tu traverses compte, et tu n’as pas à le porter seule ou seul.',
      '',
      'Si tu penses au suicide, si tu as peur de te faire du mal ou de faire du mal à quelqu’un :',
      '• appelle le **3114** (prévention du suicide, gratuit, 24 h/24) ;',
      '• en cas de danger immédiat, appelle le **15** ou le **112** ;',
      '• si un enfant est en danger, le **119** répond aussi 24 h/24 ;',
      '• personnes sourdes ou malentendantes : le **114** par SMS (ou application / visio).',
      '',
      'Si tu le peux, ne reste pas seule ou seul : appelle une personne de confiance et demande-lui de venir.',
      'Je suis une intelligence artificielle : je ne peux pas t’aider comme une personne le ferait, mais ces professionnels le peuvent, maintenant.',
    ],
    medicalFR: [
      'Ce que tu décris peut nécessiter une aide médicale **rapide**.',
      '',
      '• Appelle le **15** (SAMU) ou le **112** sans attendre.',
      '• Personnes sourdes ou malentendantes : envoie un SMS au **114**.',
      '• En cas de détresse psychologique ou d’idées suicidaires : le **3114** (24 h/24, gratuit).',
      '• Si tu as un doute, appelle quand même : ce sont les professionnels qui évalueront la situation.',
      '',
      'Je suis une intelligence artificielle et je ne peux pas évaluer une urgence. Je reste disponible ensuite pour t’aider à préparer les informations à transmettre.',
    ],
    crisisIntl: (n) => [
      'Ce que tu traverses compte, et tu n’as pas à le porter seule ou seul.',
      '',
      'Si tu penses au suicide, si tu as peur de te faire du mal ou de faire du mal à ton enfant ou à quelqu’un :',
      `• en cas de danger immédiat, appelle le numéro d’urgence : ${n} ;`,
      '• si un enfant est en danger, appelle aussi le numéro d’urgence ;',
      '• dès que possible, contacte ton médecin, ta sage-femme ou une ligne d’écoute de ton pays.',
      '',
      'Si tu le peux, ne reste pas seule ou seul : appelle une personne de confiance et demande-lui de venir.',
      'Je suis une intelligence artificielle : je ne peux pas t’aider comme une personne le ferait, mais ces professionnels le peuvent, maintenant.',
    ],
    medicalIntl: (n) => [
      'Ce que tu décris peut nécessiter une aide médicale **rapide**.',
      '',
      `• Appelle le numéro d’urgence ${n} sans attendre.`,
      '• Si tu as un doute, appelle quand même : ce sont les professionnels qui évalueront la situation.',
      '',
      'Je suis une intelligence artificielle et je ne peux pas évaluer une urgence. Je reste disponible ensuite pour t’aider à préparer les informations à transmettre.',
    ],
    or: 'ou',
    samu: ['SAMU', 'Urgence médicale, 24 h/24'],
    eu: ['Numéro d’urgence européen', 'Toute urgence, depuis tout téléphone'],
    suicide: ['Prévention du suicide', 'Détresse psychologique, idées suicidaires — gratuit, 24 h/24'],
    deaf: ['Urgence par SMS', 'Personnes sourdes ou malentendantes'],
    local: ['Numéro d’urgence', 'Urgence médicale ou danger immédiat, 24 h/24'],
  },
  en: {
    crisisFR: [
      'What you are going through matters, and you do not have to carry it alone.',
      '',
      'If you are thinking about suicide, or are afraid of hurting yourself or someone else:',
      '• call **3114** (French suicide prevention line, free, 24/7);',
      '• if there is immediate danger, call **15** or **112**;',
      '• if a child is in danger, **119** also answers 24/7;',
      '• deaf or hard-of-hearing people: **114** by text message (or app / video call).',
      '',
      'If you can, do not stay alone: call someone you trust and ask them to come over.',
      'I am an artificial intelligence: I cannot help you the way a person can, but these professionals can, right now.',
    ],
    medicalFR: [
      'What you describe may need **urgent** medical help.',
      '',
      '• Call **15** (SAMU, emergency medical service) or **112** straight away.',
      '• Deaf or hard-of-hearing people: send a text message to **114**.',
      '• Psychological distress or suicidal thoughts: **3114** (24/7, free).',
      '• If in doubt, call anyway: the professionals will assess the situation.',
      '',
      'I am an artificial intelligence and cannot assess an emergency. I am still here afterwards to help you prepare the information to pass on.',
    ],
    crisisIntl: (n) => [
      'What you are going through matters, and you do not have to carry it alone.',
      '',
      'If you are thinking about suicide, or are afraid of hurting yourself, your child or someone else:',
      `• if there is immediate danger, call the emergency number: ${n};`,
      '• if a child is in danger, call the emergency number too;',
      '• as soon as you can, contact your doctor, your midwife or a crisis line in your country.',
      '',
      'If you can, do not stay alone: call someone you trust and ask them to come over.',
      'I am an artificial intelligence: I cannot help you the way a person can, but these professionals can, right now.',
    ],
    medicalIntl: (n) => [
      'What you describe may need **urgent** medical help.',
      '',
      `• Call the emergency number ${n} straight away.`,
      '• If in doubt, call anyway: the professionals will assess the situation.',
      '',
      'I am an artificial intelligence and cannot assess an emergency. I am still here afterwards to help you prepare the information to pass on.',
    ],
    or: 'or',
    samu: ['SAMU (France)', 'Medical emergency, 24/7'],
    eu: ['European emergency number', 'Any emergency, from any phone'],
    suicide: ['Suicide prevention (France)', 'Psychological distress, suicidal thoughts — free, 24/7'],
    deaf: ['Emergency by text', 'Deaf or hard-of-hearing people'],
    local: ['Emergency number', 'Medical emergency or immediate danger, 24/7'],
  },
  de: {
    crisisFR: [
      'Was du gerade durchmachst, zählt – und du musst das nicht allein tragen.',
      '',
      'Wenn du an Suizid denkst oder Angst hast, dir oder jemand anderem etwas anzutun:',
      '• ruf die **3114** an (französische Suizidprävention, kostenlos, rund um die Uhr);',
      '• bei unmittelbarer Gefahr ruf die **15** oder die **112** an;',
      '• wenn ein Kind in Gefahr ist, ist auch die **119** rund um die Uhr erreichbar;',
      '• gehörlose oder schwerhörige Menschen: die **114** per SMS (oder App / Video).',
      '',
      'Wenn du kannst, bleib nicht allein: Ruf eine Vertrauensperson an und bitte sie zu kommen.',
      'Ich bin eine künstliche Intelligenz: Ich kann dir nicht helfen wie ein Mensch, aber diese Fachleute können es – jetzt.',
    ],
    medicalFR: [
      'Was du beschreibst, kann **schnelle** medizinische Hilfe erfordern.',
      '',
      '• Ruf sofort die **15** (SAMU, medizinischer Notruf) oder die **112** an.',
      '• Gehörlose oder schwerhörige Menschen: SMS an die **114**.',
      '• Bei seelischer Not oder Suizidgedanken: die **3114** (rund um die Uhr, kostenlos).',
      '• Im Zweifel trotzdem anrufen: Die Fachleute schätzen die Lage ein.',
      '',
      'Ich bin eine künstliche Intelligenz und kann keinen Notfall beurteilen. Danach helfe ich dir gern, die Informationen für die Fachleute vorzubereiten.',
    ],
    crisisIntl: (n) => [
      'Was du gerade durchmachst, zählt – und du musst das nicht allein tragen.',
      '',
      'Wenn du an Suizid denkst oder Angst hast, dir, deinem Kind oder jemand anderem etwas anzutun:',
      `• bei unmittelbarer Gefahr ruf den Notruf an: ${n};`,
      '• wenn ein Kind in Gefahr ist, ruf ebenfalls den Notruf an;',
      '• wende dich so bald wie möglich an deine Ärztin, deinen Arzt, deine Hebamme oder ein Krisentelefon in deinem Land.',
      '',
      'Wenn du kannst, bleib nicht allein: Ruf eine Vertrauensperson an und bitte sie zu kommen.',
      'Ich bin eine künstliche Intelligenz: Ich kann dir nicht helfen wie ein Mensch, aber diese Fachleute können es – jetzt.',
    ],
    medicalIntl: (n) => [
      'Was du beschreibst, kann **schnelle** medizinische Hilfe erfordern.',
      '',
      `• Ruf sofort den Notruf ${n} an.`,
      '• Im Zweifel trotzdem anrufen: Die Fachleute schätzen die Lage ein.',
      '',
      'Ich bin eine künstliche Intelligenz und kann keinen Notfall beurteilen. Danach helfe ich dir gern, die Informationen für die Fachleute vorzubereiten.',
    ],
    or: 'oder',
    samu: ['SAMU (Frankreich)', 'Medizinischer Notfall, rund um die Uhr'],
    eu: ['Europäischer Notruf', 'Jeder Notfall, von jedem Telefon'],
    suicide: ['Suizidprävention (Frankreich)', 'Seelische Not, Suizidgedanken – kostenlos, rund um die Uhr'],
    deaf: ['Notruf per SMS', 'Gehörlose oder schwerhörige Menschen'],
    local: ['Notruf', 'Medizinischer Notfall oder unmittelbare Gefahr, rund um die Uhr'],
  },
  es: {
    crisisFR: [
      'Lo que estás viviendo importa, y no tienes que cargar con ello sola o solo.',
      '',
      'Si piensas en el suicidio o tienes miedo de hacerte daño o de hacer daño a alguien:',
      '• llama al **3114** (prevención del suicidio en Francia, gratuito, 24 h);',
      '• si hay un peligro inmediato, llama al **15** o al **112**;',
      '• si un niño está en peligro, el **119** también responde las 24 h;',
      '• personas sordas o con dificultades auditivas: el **114** por SMS (o aplicación / videollamada).',
      '',
      'Si puedes, no te quedes sola o solo: llama a una persona de confianza y pídele que venga.',
      'Soy una inteligencia artificial: no puedo ayudarte como lo haría una persona, pero estos profesionales sí pueden, ahora.',
    ],
    medicalFR: [
      'Lo que describes puede necesitar ayuda médica **rápida**.',
      '',
      '• Llama al **15** (SAMU, urgencias médicas) o al **112** sin esperar.',
      '• Personas sordas o con dificultades auditivas: envía un SMS al **114**.',
      '• En caso de angustia psicológica o ideas suicidas: el **3114** (24 h, gratuito).',
      '• Si tienes dudas, llama de todos modos: los profesionales evaluarán la situación.',
      '',
      'Soy una inteligencia artificial y no puedo evaluar una urgencia. Después sigo aquí para ayudarte a preparar la información que debes transmitir.',
    ],
    crisisIntl: (n) => [
      'Lo que estás viviendo importa, y no tienes que cargar con ello sola o solo.',
      '',
      'Si piensas en el suicidio o tienes miedo de hacerte daño, de hacer daño a tu hijo o hija o a alguien:',
      `• si hay un peligro inmediato, llama al número de emergencias: ${n};`,
      '• si un niño está en peligro, llama también al número de emergencias;',
      '• en cuanto puedas, contacta con tu médico, tu matrona o una línea de ayuda de tu país.',
      '',
      'Si puedes, no te quedes sola o solo: llama a una persona de confianza y pídele que venga.',
      'Soy una inteligencia artificial: no puedo ayudarte como lo haría una persona, pero estos profesionales sí pueden, ahora.',
    ],
    medicalIntl: (n) => [
      'Lo que describes puede necesitar ayuda médica **rápida**.',
      '',
      `• Llama al número de emergencias ${n} sin esperar.`,
      '• Si tienes dudas, llama de todos modos: los profesionales evaluarán la situación.',
      '',
      'Soy una inteligencia artificial y no puedo evaluar una urgencia. Después sigo aquí para ayudarte a preparar la información que debes transmitir.',
    ],
    or: 'o',
    samu: ['SAMU (Francia)', 'Urgencia médica, 24 h'],
    eu: ['Número de emergencias europeo', 'Cualquier urgencia, desde cualquier teléfono'],
    suicide: ['Prevención del suicidio (Francia)', 'Angustia psicológica, ideas suicidas — gratuito, 24 h'],
    deaf: ['Urgencias por SMS', 'Personas sordas o con dificultades auditivas'],
    local: ['Número de emergencias', 'Urgencia médica o peligro inmediato, 24 h'],
  },
  it: {
    crisisFR: [
      'Quello che stai vivendo conta, e non devi portarlo da sola o da solo.',
      '',
      'Se pensi al suicidio o hai paura di farti del male o di fare del male a qualcuno:',
      '• chiama il **3114** (prevenzione del suicidio in Francia, gratuito, 24 ore su 24);',
      '• in caso di pericolo immediato, chiama il **15** o il **112**;',
      '• se un bambino è in pericolo, risponde anche il **119**, 24 ore su 24;',
      '• persone sorde o con problemi di udito: il **114** via SMS (o app / videochiamata).',
      '',
      'Se puoi, non restare da sola o da solo: chiama una persona di fiducia e chiedile di venire.',
      'Sono un’intelligenza artificiale: non posso aiutarti come farebbe una persona, ma questi professionisti sì, adesso.',
    ],
    medicalFR: [
      'Quello che descrivi può richiedere un aiuto medico **rapido**.',
      '',
      '• Chiama subito il **15** (SAMU, emergenza medica) o il **112**.',
      '• Persone sorde o con problemi di udito: invia un SMS al **114**.',
      '• In caso di sofferenza psicologica o pensieri suicidi: il **3114** (24 ore su 24, gratuito).',
      '• Nel dubbio, chiama comunque: saranno i professionisti a valutare la situazione.',
      '',
      'Sono un’intelligenza artificiale e non posso valutare un’emergenza. Dopo resto disponibile per aiutarti a preparare le informazioni da trasmettere.',
    ],
    crisisIntl: (n) => [
      'Quello che stai vivendo conta, e non devi portarlo da sola o da solo.',
      '',
      'Se pensi al suicidio o hai paura di farti del male, di fare del male a tuo figlio o a qualcuno:',
      `• in caso di pericolo immediato, chiama il numero di emergenza: ${n};`,
      '• se un bambino è in pericolo, chiama anche il numero di emergenza;',
      '• appena puoi, contatta il tuo medico, la tua ostetrica o una linea di ascolto del tuo paese.',
      '',
      'Se puoi, non restare da sola o da solo: chiama una persona di fiducia e chiedile di venire.',
      'Sono un’intelligenza artificiale: non posso aiutarti come farebbe una persona, ma questi professionisti sì, adesso.',
    ],
    medicalIntl: (n) => [
      'Quello che descrivi può richiedere un aiuto medico **rapido**.',
      '',
      `• Chiama subito il numero di emergenza ${n}.`,
      '• Nel dubbio, chiama comunque: saranno i professionisti a valutare la situazione.',
      '',
      'Sono un’intelligenza artificiale e non posso valutare un’emergenza. Dopo resto disponibile per aiutarti a preparare le informazioni da trasmettere.',
    ],
    or: 'o',
    samu: ['SAMU (Francia)', 'Emergenza medica, 24 ore su 24'],
    eu: ['Numero di emergenza europeo', 'Qualsiasi emergenza, da qualsiasi telefono'],
    suicide: ['Prevenzione del suicidio (Francia)', 'Sofferenza psicologica, pensieri suicidi — gratuito, 24 ore su 24'],
    deaf: ['Emergenza via SMS', 'Persone sorde o con problemi di udito'],
    local: ['Numero di emergenza', 'Emergenza medica o pericolo immediato, 24 ore su 24'],
  },
};

/** Réponse humaine immédiate, sans appel à l'IA, toujours gratuite (langue et pays de la personne). */
export function crisisMessage(level: Exclude<SafetyLevel, 'none'>, opts?: SafetyOptions): string {
  const { lang, region } = resolve(opts);
  const x = TXT[lang];
  if (region === 'FR') return (level === 'crisis' ? x.crisisFR : x.medicalFR).join('\n');
  const n = bold(REGION_EMERGENCY[region], x.or);
  return (level === 'crisis' ? x.crisisIntl(n) : x.medicalIntl(n)).join('\n');
}

/** Formulations interdites dans une réponse de l'assistant (posologies, garanties). */
const FORBIDDEN_OUTPUT: [RegExp, string][] = [
  [/\b\d+([.,]\d+)?\s?(mg|milligrammes?|µg|mcg|ui)\b(?!.*(cm|kg de poids))/i, 'posologie'],
  [/\b\d+([.,]\d+)?\s?mg\s?\/\s?kg\b/i, 'posologie'],
  [/\b(il n'?est pas (utile|necessaire|nécessaire) de consulter|inutile de consulter|pas besoin de (consulter|voir un medecin|voir un médecin))/i, 'découragement à consulter'],
  [/\b(tout va bien|c'?est (tout a fait|totalement) normal|aucun danger|sans (aucun )?danger|je (?:vous|te) garantis)\b/i, 'garantie de sécurité'],
  [/\bje suis (medecin|médecin|sage-femme|pediatre|pédiatre|infirmi[eè]re?)\b/i, 'usurpation de qualité'],
  // Cycle et contraception : jamais dénigrer la contraception d'urgence, jamais de certitude
  [/(contraception d'urgence|pilule du lendemain)[^.]{0,40}\b(inutile|ne sert (a|à) rien|pas (utile|necessaire|nécessaire))|(pas|aucun) besoin (de|d'une?) (contraception d'urgence|pilule du lendemain)/i, 'contraception d’urgence dénigrée'],
  [/\b(aucun risque|jours? sans (danger|risque)|grossesse (est )?impossible)\b/i, 'garantie contraceptive'],
  [/\b(tu as|vous avez) ovulé|\b(tu es|vous êtes|vous etes) enceinte\b(?! ?\?)/i, 'certitude non vérifiable'],
];

export function auditAnswer(answer: string): string[] {
  const a = answer.replace(/[’‘]/g, "'");
  return FORBIDDEN_OUTPUT.filter(([re]) => re.test(a)).map(([, r]) => r);
}

/** Numéros affichés dans la carte d'orientation urgente (ordre selon la situation). */
export interface UrgentContact {
  number: string;
  label: string;
  /** « tel » = appel, « sms » = SMS (114) */
  channel: 'tel' | 'sms';
  detail: string;
}

export function urgentContacts(level: Exclude<SafetyLevel, 'none'>, opts?: SafetyOptions): UrgentContact[] {
  const { lang, region } = resolve(opts);
  const x = TXT[lang];
  const c = (number: string, [label, detail]: [string, string], channel: 'tel' | 'sms' = 'tel'): UrgentContact => ({ number, label, channel, detail });
  if (region === 'FR') {
    const samu = c('15', x.samu), eu = c('112', x.eu), suicide = c('3114', x.suicide), deaf = c('114', x.deaf, 'sms');
    return level === 'crisis' ? [suicide, samu, eu, deaf] : [samu, eu, deaf, suicide];
  }
  // Hors de France : seulement les numéros d'urgence du pays (REGIONS), aucune ligne d'écoute inventée
  return REGION_EMERGENCY[region].map((n) => c(n, n === '112' ? x.eu : x.local));
}
