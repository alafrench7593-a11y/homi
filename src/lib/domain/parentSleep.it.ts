/** « Il mio sonno » — versione italiana dei consigli (stessa forma di quella francese). */
import type { SleepTip } from './parentSleep';

export const POSTPARTUM_TIPS_IT: SleepTip[] = [
  { key: 'sieste-bebe', icon: 'moon', title: 'Dormire quando il bambino dorme, quando è possibile', text: 'Sdraiarti durante un sonnellino del bambino conta, anche solo 20 minuti. Il bucato e i piatti possono aspettare.' },
  { key: 'relais', icon: 'users', title: 'Chiedere il cambio di notte', text: 'Condividere le notti con l’altro genitore o con una persona vicina (cambio, ninna, biberon) permette a ciascuno di avere un blocco di sonno più lungo.' },
  { key: 'aide', icon: 'gift', title: 'Accettare l’aiuto offerto', text: 'Un pasto portato a casa, una commissione, un’ora di custodia: accettare è anche prendersi cura della tua famiglia.' },
];

export const GENERAL_TIPS_IT: SleepTip[] = [
  { key: 'ecrans', icon: 'smartphone', title: 'Limitare gli schermi la sera', text: 'Se puoi, posa il telefono un po’ prima di dormire e abbassa la luminosità. La modalità notte dell’app è pensata per i risvegli.' },
  { key: 'rituel', icon: 'feather', title: 'Un piccolo rituale serale', text: 'Luce soffusa, una bevanda calda senza caffeina, qualche respiro lento: un punto di riferimento semplice a volte aiuta a lasciarsi andare.' },
  { key: 'cafeine', icon: 'coffee', title: 'La caffeina meglio al mattino', text: 'Caffè, tè, bibite gassate: tenerli per l’inizio della giornata può facilitare l’addormentamento.' },
];
