/** Accueil — scène « Aujourd'hui » : point focal, agenda lisible, pastille « fait » remplaçable et logique pure. */
export { HomeToday, TodayAgenda, TodayNext, useTodayScene, type TodayScene } from './HomeToday';
export { TodayAgendaRow, TodayFocus, requestedByLabel } from './TodayTaskRow';
export { DoneMark, setTodayDoneComponent, getTodayDoneComponent, type DoneMarkProps } from './DoneMark';
export * from './todayModel';
