/** Script du film : minutage (secondes), voix off et sous-titres. Source unique pour l'image, les SRT/VTT et la future voix. */
export type Cue = { from: number; to: number; text: string };
export type SceneDef = { id: string; title: string; from: number; to: number; vo?: Cue[] };
export const SCENES: SceneDef[] = [
  { id: 's01', title: 'Devenir parent', from: 0, to: 12, vo: [{ from: 1.5, to: 6, text: 'Devenir parent change tout.' }, { from: 6.5, to: 11.5, text: 'Mais personne ne devrait avoir à tout gérer seul.' }] },
  { id: 's02', title: 'Voici HOMI', from: 12, to: 23, vo: [{ from: 16, to: 22, text: 'Toute votre vie familiale. Enfin réunie.' }] },
  { id: 's03', title: 'De la grossesse aux 10 ans', from: 23, to: 36, vo: [{ from: 24, to: 30, text: 'Du projet bébé aux 10 ans de votre enfant,' }, { from: 30, to: 35.5, text: 'HOMI vous accompagne à chaque étape.' }] },
  { id: 's04', title: 'Le quotidien du bébé', from: 36, to: 52, vo: [{ from: 37, to: 44, text: 'Chaque biberon, chaque sieste, chaque progrès.' }, { from: 44.5, to: 51.5, text: 'Retrouvez tout, sans avoir à vous souvenir de tout.' }] },
  { id: 's05', title: 'La santé familiale', from: 52, to: 65, vo: [{ from: 53, to: 59, text: 'Vaccins, médicaments, rendez-vous, documents :' }, { from: 59, to: 64.5, text: 'tout est rangé, et rien n’est jamais calculé à votre place.' }] },
  { id: 's06', title: 'Rencontrez Aura', from: 65, to: 88, vo: [{ from: 72, to: 79, text: 'Aura connaît vos outils, comprend votre contexte' }, { from: 79, to: 87, text: 'et vous aide à agir. Directement dans HOMI.' }] },
  { id: 's07', title: 'Tout est connecté', from: 88, to: 105, vo: [{ from: 90, to: 96.5, text: 'Dans HOMI, les outils ne fonctionnent pas séparément.' }, { from: 97, to: 104, text: 'Ils travaillent ensemble.' }] },
  { id: 's08', title: 'Deux parents, une même équipe', from: 105, to: 120, vo: [{ from: 108, to: 119, text: 'Moins d’oublis. Moins de questions répétées. Plus de coordination.' }] },
  { id: 's09', title: 'Le foyer', from: 120, to: 133, vo: [{ from: 121, to: 132, text: 'Repas, courses, tâches, agenda, garde : tout le foyer au même endroit.' }] },
  { id: 's10', title: 'Mon histoire', from: 133, to: 150, vo: [{ from: 135, to: 142, text: 'Chaque photo, chaque première fois, chaque souvenir.' }, { from: 142.5, to: 149.5, text: 'Une histoire qui grandit avec votre enfant.' }] },
  { id: 's11', title: 'Chaque famille est unique', from: 150, to: 160, vo: [{ from: 151, to: 159, text: 'Chaque enfant a ses outils, selon son âge. Les vôtres s’adaptent.' }] },
  { id: 's12', title: 'La communauté', from: 160, to: 170, vo: [{ from: 163, to: 169, text: 'Vous n’êtes pas seuls.' }] },
  { id: 's13', title: 'Final', from: 170, to: 180, vo: [{ from: 171, to: 175, text: 'Moins de charge mentale. Plus de moments ensemble.' }, { from: 175.5, to: 179.5, text: 'HOMI. La famille, autrement.' }] },
];
export const DURATION = 180;
