/** « Je grandis » — textes affichés en italien (traduits depuis le français ; mêmes clés, mêmes âges, mêmes sources). */
import type { StepSource } from './steps';

type StepText = { title: string; what: string; play: string; safety: string; ask: string };
const T = (title: string, what: string, play: string, safety: string, ask: string): StepText => ({ title, what, play, safety, ask });

export const STEP_SOURCE_LABELS_IT: Record<StepSource, string> = {
  sf_etapes: 'Santé.fr (Santé publique France – 1000 premiers jours) — Le tappe dello sviluppo del bebè',
  sf_lang_2_12: 'Santé.fr (mpedia) — I progressi del linguaggio dai 2 ai 12 mesi',
  sf_lang_1_3: 'Santé.fr (mpedia) — I progressi del linguaggio da 1 a 3 anni',
  mp_3_6: 'mpedia (Dr. Jacques Langue) — Lo sviluppo psicomotorio tra i 3 e i 6 mesi',
  mp_9_12: 'mpedia (Dr. Jacques Langue) — Lo sviluppo psicomotorio tra i 9 e i 12 mesi',
  sf_proprete: 'Santé.fr (mpedia, AFPA) — Come imparerà mio figlio a togliere il pannolino?',
  sf_nuits: 'Santé.fr (mpedia, AFPA) — Ritmo sonno-veglia: quando «dormirà tutta la notte»?',
  sf_sieste: 'Santé.fr (mpedia, AFPA) — Il pisolino, il sonno diurno del bambino',
  sf_diversification: 'Santé.fr (Manger Bouger) — Tra i 4 e i 6 mesi: introdurre gli alimenti con dolcezza',
  spf_diversification: 'Santé publique France — Pas à pas, votre enfant mange comme un grand (opuscolo)',
};

const FLOOR = 'Gioca a terra, su un tappeto; mai su un letto, un divano o un fasciatoio senza tenergli una mano addosso.';
const SMALL = 'Tieni fuori dalla sua portata gli oggetti piccoli che stanno in bocca (batterie a bottone, calamite, biglie).';
const CALM = 'Niente da forzare: si propone, si osserva, si riprova un altro giorno.';

export const STEP_TEXT_IT: Record<string, StepText> = {
  lifts_head: T('Solleva la testa a pancia in giù', 'Sdraiato a pancia in giù e sveglio, solleva la testa e poi le spalle per guardarsi intorno.', 'Qualche minuto a pancia in giù quando è ben sveglio, di fronte al tuo viso o a un giocattolo colorato.', `${FLOOR} Per dormire: sempre a pancia in su.`, 'Quanto tempo a pancia in giù, da sveglio, mi consiglia alla sua età?'),
  holds_head: T('Tiene su la testa', 'In braccio contro di te o seduto con un appoggio, la sua testa resta dritta senza ciondolare.', 'Portalo rivolto verso il mondo per qualche istante, così scopre la stanza.', 'Sostienigli ancora la nuca durante i cambi di posizione rapidi.', 'Come portarlo in braccio perché stia ben sistemato?'),
  rolls_over: T('Si gira', 'Rotola dalla schiena sul fianco, poi passa dalla schiena alla pancia.', 'Metti un giocattolo un po’ di lato per invitarlo a girarsi.', 'Appena si gira, può cadere: non lasciarlo mai da solo in alto.', 'Se di notte si gira a pancia in giù, che cosa faccio?'),
  sits_supported: T('Sta seduto con un appoggio', 'Sostenuto alla schiena da un cuscino o da te, resta seduto e guarda le sue mani e i suoi giocattoli.', 'Fallo sedere tra le tue gambe, con un giocattolo davanti.', 'Circondalo di cuscini: si sbilancia ancora facilmente.', 'Quando posso metterlo seduto per giocare?'),
  sits_alone: T('Sta seduto senza appoggio', 'Sta seduto bene da solo e usa le mani per giocare.', 'Giocattoli da afferrare intorno a lui, così si sporge e si riequilibra.', FLOOR, 'Come aiutarlo a guadagnare equilibrio?'),
  moves_around: T('Si sposta', 'Si sposta a modo suo: strisciando, a gattoni, sul sedere…', 'Un percorso di cuscini a terra, una palla che rotola da andare a prendere.', 'Cancelletti sulle scale, prese protette, detersivi fuori portata. Il girello è sconsigliato (cadute, ustioni).', 'Quali accorgimenti di sicurezza prevedere in casa?'),
  stands_up: T('Si mette in piedi tenendosi', 'Si tira su aggrappandosi ai mobili, poi impara a stare in piedi.', 'Un mobile basso e stabile con dei giocattoli sopra.', 'Fissa al muro i mobili che possono ribaltarsi.', 'Servono le scarpe a questa età?'),
  walks: T('Cammina da solo', 'Fa i primi passi da solo, poi cammina sempre più lontano. Le età variano molto da un bambino all’altro.', 'A piedi nudi in casa su un pavimento non scivoloso; un cavalcabile o un carrellino da spingere.', 'Metti in sicurezza scale, finestre e piscina.', 'Come accompagnarlo nei primi passi?'),
  climbs_stairs: T('Sale le scale', 'Sale i gradini, spesso a gattoni all’inizio, tenendosi.', 'Uno o due gradini con te accanto.', 'Sempre un adulto sulle scale; cancelletto in cima e in fondo.', 'Da quando posso lasciarlo provare da solo?'),
  kicks_ball: T('Calcia un pallone', 'Dà un calcio a un pallone senza cadere.', 'Un pallone leggero al parco, piccole porte fatte con due scarpe.', 'Scegli uno spazio libero, lontano dalla strada.', 'Quali attività fisiche alla sua età?'),
  grasps: T('Afferra un oggetto', 'Afferra di proposito ciò che è alla sua portata e lo tiene in mano.', 'Un sonaglio leggero o un anello di stoffa teso davanti a lui.', SMALL, 'Quali giocattoli sono adatti alla sua età?'),
  hand_to_hand: T('Passa un oggetto da una mano all’altra', 'Passa un cubo o un giocattolo da una mano all’altra.', 'Due cubi di stoffa, uno in ogni mano; scambiateli a turno.', SMALL, 'Come incoraggiarlo a usare entrambe le mani?'),
  empties_fills: T('Svuota e riempie', 'Tira fuori gli oggetti da una borsa o da una scatola, poi comincia a rimetterli dentro.', 'Un cestino di piccoli oggetti quotidiani sicuri (bicchieri, foulard, cucchiai di legno).', SMALL, 'Quali oggetti di uso quotidiano può maneggiare senza pericolo?'),
  smiles: T('Sorride e ti guarda', 'Ti guarda negli occhi e sorride.', 'Faccia a faccia, a 20–30 cm, parlagli dolcemente sorridendo.', CALM, 'Che cosa mi consiglia per comunicare con lui?'),
  reacts_voice: T('Reagisce alla voce', 'Gorgheggia e reagisce quando gli si parla.', 'Rispondi ai suoi suoni, poi fai una pausa per lasciargli «la parola».', CALM, 'Come capire se sente bene?'),
  makes_sounds: T('Emette suoni', 'Vocalizza, gorgheggia, poi lalla con sillabe come «ba-ba».', 'Il gioco del «ognuno al suo turno»: imita il suo suono, aggiungine uno, aspetta la sua risposta.', 'Evita gli schermi: non sostituiscono un vero scambio.', 'Come aiutarlo a lallare?'),
  name: T('Reagisce al suo nome', 'Gira la testa o si ferma quando lo si chiama per nome.', 'Chiamalo dolcemente da un lato della stanza, poi dall’altro.', CALM, 'Che cosa fare se ho un dubbio sul suo udito?'),
  waves_bye: T('Fa «ciao ciao»', 'Fa «ciao ciao» con la manina e saluta.', 'Filastrocche con i gesti, come «Batti batti le manine».', CALM, 'Quali filastrocche con i gesti proporgli?'),
  points: T('Indica con il dito', 'Tende la mano o l’indice verso un oggetto per mostrarlo o chiederne il nome.', 'Dai un nome a ciò che indica; guardate insieme dei libri illustrati.', CALM, 'Come incoraggiarlo a comunicare?'),
  first_words: T('Dice le prime parole', 'Compaiono le prime parole, spesso «papà», «mamma», a volte storpiate.', 'Leggete libri illustrati nominando ogni immagine; cantate.', CALM, 'Come aiutarlo ad arricchire il vocabolario?'),
  understands_simple: T('Capisce frasi semplici', 'Capisce alcune frasi semplici della vita quotidiana («dammi», «vieni»).', 'Descrivi quello che fai durante il bagnetto o i pasti.', CALM, 'Come capire che cosa comprende?'),
  says_words: T('Pronuncia alcune parole', 'Dice diverse parole e piccole espressioni; capisce molte più parole di quante ne dica.', 'Riformula ciò che dice con la parola giusta, senza correggerlo; leggete storie brevi.', CALM, 'Che cosa fare se parla poco?'),
  two_words: T('Unisce due parole', 'Comincia a unire due parole («io mangiare») e dice «io» o il suo nome.', 'Fagli domande a scelta («mela o banana?»).', CALM, 'Come sostenere il suo linguaggio ogni giorno?'),
  sentences: T('Fa frasi', 'Le sue frasi si allungano, dice «io» e fa molte domande.', 'Raccontatevi la giornata a turno; giochi di ruolo (cucina giocattolo, garage).', CALM, 'Come aiutarlo a farsi capire?'),
  familiar_people: T('Riconosce le persone familiari', 'Reagisce in modo diverso alle persone che conosce.', 'Guardate le foto di famiglia nominando ognuno.', CALM, 'Come preparare un nuovo inserimento al nido o con una tata?'),
  strangers: T('Nota le persone sconosciute', 'Nota le persone che non conosce e può rannicchiarsi contro di te.', 'Lasciagli il tempo di osservare prima che qualcuno lo prenda in braccio.', CALM, 'Come aiutarlo davanti a persone nuove?'),
  imitates: T('Imita gli adulti', 'Gli piace fare come te: telefonare, spazzare, cucinare.', 'Dagli un cucchiaio di legno e un’insalatiera mentre cucini.', 'In cucina: tienilo lontano dai fornelli e dalle pentole calde.', 'Quali giochi di imitazione proporgli?'),
  plays_with_adult: T('Ti invita a giocare', 'Imita la vita quotidiana e viene a cercarti per giocare.', 'Cucina giocattolo, bambola, garage: segui la sua storia.', CALM, 'Come aiutarlo a giocare con altri bambini?'),
  shows_emotions: T('Mostra le sue emozioni', 'Esprime gioia, rabbia o paura con il viso e il pianto.', 'Dai un nome a ciò che sembra provare.', CALM, 'Come calmarlo quando piange molto?'),
  laughs: T('Ride a crepapelle', 'Ride di gusto quando si gioca con lui.', 'Cucù, solletico delicato, smorfie.', CALM, 'Quali giochi proporgli a questa età?'),
  soothed_voice: T('Si calma con la tua voce', 'Può smettere di piangere sentendo la tua voce.', 'Una canzone, sempre la stessa, per i momenti tranquilli.', 'Se il pianto ti sfinisce, mettilo al sicuro nel suo lettino e chiama qualcuno: un neonato non si scuote mai.', 'Che cosa fare quando il pianto diventa difficile da sopportare?'),
  says_no: T('Dice «no»', 'Usa sempre più spesso il «no»: afferma i suoi desideri.', 'Proponigli due scelte accettabili invece di una domanda aperta.', CALM, 'Come reagire ai suoi capricci?'),
  mirror: T('Sorride al suo riflesso', 'Sorride alla sua immagine in uno specchio infrangibile.', 'Uno specchio di sicurezza a terra, accanto al tappeto gioco.', 'Solo specchio infrangibile.', 'Quali giochi di stimolazione alla sua età?'),
  throws_toys: T('Lancia i giocattoli perché qualcuno li raccolga', 'Fa cadere i giocattoli e guarda dove vanno… e se tu li raccogli.', 'Un gioco di «cade – raccolgo» con un oggetto morbido.', SMALL, 'Come tenerlo occupato durante i pasti?'),
  explores: T('Esplora l’ambiente', 'Diventa più autonomo e parte alla scoperta della stanza.', 'Una cassetta di «tesori» da frugare: scatole, stoffe, cucchiai.', 'Riponi in alto medicinali, detersivi e oggetti taglienti.', 'Come mettere in sicurezza la casa perché possa esplorarla?'),
  stories: T('Ama che gli si raccontino storie', 'Gli piace che gli si raccontino storie e attira la tua attenzione.', 'Un libro ogni sera, spesso lo stesso: adora la ripetizione.', CALM, 'Quali libri scegliere alla sua età?'),
  says_me: T('Dice «io» o il suo nome', 'Parla di sé dicendo «io» o il suo nome.', 'Lascialo scegliere tra due vestiti.', CALM, 'Come aiutarlo a diventare più autonomo?'),
  spoon_alone: T('Usa il cucchiaio da solo', 'Mangia da solo con il cucchiaio, anche se non tutto arriva in bocca.', 'Un cucchiaio della sua misura e cibi che stanno su bene (purea densa).', 'Sempre seduto e sotto il tuo sguardo durante il pasto.', 'Come incoraggiarlo a mangiare da solo?'),
  potty_interest: T('Si interessa al vasino', 'L’apprendimento per togliere il pannolino inizia spesso tra i 18 e i 24 mesi, a volte più tardi. Può richiedere da pochi giorni a diversi mesi.', 'Proponigli il vasino dopo il pasto o prima del pisolino, per qualche minuto, senza insistere.', 'Mai forzare: la pressione può provocare stitichezza.', 'Come capire se è pronto?'),
  food_interest: T('Si interessa al tuo cibo', 'Tiene su la testa e guarda con interesse ciò che mangi: segnali che possono annunciare lo svezzamento.', 'Fallo stare a tavola con te durante i tuoi pasti.', 'Nessun alimento prima dei 4 mesi; chiedi consiglio per un bebè nato prematuro.', 'Quando e come iniziare lo svezzamento?'),
  soft_pieces: T('Mangia piccoli pezzi morbidi', 'Accetta pezzi molto morbidi che si schiacciano tra lingua e palato.', 'Una sola consistenza nuova per pasto, accanto a un piatto che conosce.', 'Sempre seduto e sotto il tuo sguardo; gli alimenti rotondi tagliati in quattro.', 'Come far evolvere le consistenze?'),
  crunchy_pieces: T('Morde piccoli pezzi', 'Comincia a mordere i pezzi con i denti.', 'Bastoncini di verdure cotte e morbide da tenere in mano.', 'Nessun alimento piccolo, duro e rotondo (arachide intera, noce) prima dei 5 anni.', 'Quali alimenti evitare per limitare il rischio di soffocamento?'),
  longer_nights: T('Dorme più a lungo la notte', 'Tra i 4 e i 6 mesi, in media, molti bebè dormono più a lungo la notte. Prima dei 3–4 mesi, si segue il suo ritmo.', 'Di giorno: luce e rumori normali; di notte: luce bassa, voce dolce.', 'Dormire a pancia in su, in un lettino con le sbarre, senza piumone, cuscino né paracolpi.', 'Come aiutarlo a distinguere il giorno dalla notte?'),
  two_naps: T('Fa due pisolini', 'Verso i 12 mesi fa spesso un pisolino al mattino e uno al pomeriggio.', 'Un piccolo rituale prima del pisolino (canzone, pupazzo).', 'Per il pisolino, lo stesso posto sicuro della notte.', 'Quanto deve durare il pisolino alla sua età?'),
  one_nap: T('Fa un solo pisolino', 'Verso i 18 mesi, il pisolino del mattino scompare a favore di un pisolino più lungo nel primo pomeriggio.', 'Un momento tranquillo dopo pranzo.', 'Un pisolino molto lungo può ritardare l’ora della nanna: chiedi consiglio se serve.', 'Come gestire il passaggio a un solo pisolino?'),
};
