/** Assistant — textes italiens (questions suggérées, présentation), traduits depuis le français. */
import type { Journey } from '@/lib/types';

export const ASSISTANT_INTRO_IT =
  'Stai parlando con un assistente di intelligenza artificiale specializzato in informazioni su salute e genitorialità. Non sostituisce un medico, un’ostetrica, un pediatra né i servizi di emergenza.';

export const SUGGESTIONS_BY_JOURNEY_IT: Record<Journey, { label: string; questions: string[] }> = {
  avoid: {
    label: 'Contraccezione',
    questions: [
      'Quali sono i diversi metodi contraccettivi?',
      'Cosa fare se dimentico la pillola?',
      'Come funziona la contraccezione d’emergenza?',
      'Quale contraccezione è possibile dopo un parto?',
    ],
  },
  cycle: {
    label: 'Il mio ciclo',
    questions: [
      'Qual è la durata abituale di un ciclo?',
      'Le mestruazioni irregolari sono frequenti?',
      'Quali sintomi possono accompagnare le mestruazioni?',
      'Quando farsi visitare per mestruazioni dolorose?',
    ],
  },
  ttc: {
    label: 'Desiderio di un bebè',
    questions: [
      'Quali esami fare prima di concepire?',
      'Perché assumere acido folico prima di una gravidanza?',
      'Quanto tempo serve in media per concepire?',
      'Quando rivolgersi a un medico se la gravidanza non arriva?',
    ],
  },
  pregnant: {
    label: 'Gravidanza',
    questions: [
      'Cosa devo mettere nella borsa per il parto?',
      'Quali alimenti evitare in gravidanza?',
      'Quali segni devono farmi chiamare il reparto maternità?',
      'Come si segue una gravidanza gemellare?',
    ],
  },
  newborn: {
    label: 'Neonato',
    questions: [
      'Come capire se il mio bambino mangia abbastanza?',
      'Come mettere a dormire il bambino in sicurezza?',
      'Il mio bambino rigurgita: cosa devo osservare?',
      'Quali sono le prime visite di controllo del neonato?',
    ],
  },
  child: {
    label: 'Bambino',
    questions: [
      'Come iniziare lo svezzamento?',
      'Quante ore di sonno servono a un bambino di 2 anni?',
      'Quali informazioni annotare prima della visita dal pediatra?',
      'Come limitare gli schermi nei bambini piccoli?',
    ],
  },
  family: {
    label: 'Famiglia',
    questions: [
      'Come preparare i miei figli all’arrivo del bebè?',
      'Come organizzare le notti con due gemelli?',
      'Come riconoscere l’esaurimento genitoriale?',
      'A cosa serve la riabilitazione del pavimento pelvico?',
    ],
  },
};
