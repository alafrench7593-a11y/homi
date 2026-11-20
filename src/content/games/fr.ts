/**
 * Jeux et activités HOMI — texte source (français, tutoiement), écrit à l'avance pour HOMI (rédaction : Claude,
 * Anthropic, 30/11/2026). Matériel du quotidien ; aucune promesse de « développement » ni de résultat : des idées
 * pour jouer.
 */
import type { GameTexts } from './types';

const SMALL = 'Rien d’assez petit pour entrer dans un rouleau de papier toilette : risque d’étouffement avant 3 ans.';

export const GAMES_FR: GameTexts = {
  // ---------------------------------------------------------------- 0–1 an
  coucou_cache: { title: 'Coucou-caché', how: 'Cache ton visage derrière un foulard, puis réapparais en disant « Coucou ! ». Ensuite, cache à moitié un jouet sous le tissu et laisse ton bébé le retrouver.', material: 'Un foulard ou un linge léger', safety: 'Le tissu ne reste jamais sur le visage de bébé ; range-le après le jeu.' },
  jeu_des_sons: { title: 'Le jeu des sons', how: 'Face à face, répète les sons que fait ton bébé et attends sa réponse, comme une petite conversation. Ajoute un nouveau son de temps en temps.', material: 'Rien' },
  boite_tresors: { title: 'La boîte à trésors', how: 'Remplis une boîte d’objets aux textures différentes : cuillère en bois, gant de toilette, brosse douce, boîte en carton. Ton bébé explore, tu nommes chaque objet.', material: 'Une boîte et des objets de la maison', safety: SMALL },
  sur_le_ventre: { title: 'Sur le ventre', how: 'Pose bébé sur le ventre sur un tapis, allonge-toi face à lui avec un jouet ou un miroir incassable pour attirer son regard. Quelques minutes suffisent.', material: 'Un tapis, un jouet', safety: 'Toujours éveillé et surveillé ; pour dormir, bébé est couché sur le dos.' },
  petit_orchestre: { title: 'Le petit orchestre', how: 'Une casserole retournée et une cuillère en bois : on tape, on frotte, on écoute. Jouez doucement puis plus fort, chacun son tour.', material: 'Une casserole, une cuillère en bois', safety: 'Ustensiles froids et propres, loin de la cuisinière.' },
  comptines_gestes: { title: 'Comptines à gestes', how: 'Chante « Ainsi font, font, font » ou « Bateau sur l’eau » en faisant les gestes avec les mains de ton bébé. Les mêmes comptines, souvent : il les reconnaîtra.', material: 'Rien' },
  balle_roule: { title: 'La balle qui roule', how: 'Assis face à face, jambes écartées, fais rouler une balle douce vers ton bébé et encourage-le à la toucher ou à la renvoyer.', material: 'Une balle souple', safety: 'Une balle trop grosse pour entrer dans la bouche.' },
  promenade_mots: { title: 'La promenade des mots', how: 'Pendant la balade, nomme ce que tu vois et entends : un arbre, un chien, une voiture, le vent. Montre du doigt, laisse-le regarder.', material: 'Poussette ou porte-bébé', safety: 'Protège-le du soleil, du froid et du vent.' },
  // ---------------------------------------------------------------- 1–3 ans
  transvaser: { title: 'Transvaser', how: 'Passer de grosses pâtes crues ou de l’eau d’un bol à l’autre, avec les mains puis avec une cuillère. Une serviette sous les bols, et c’est parti.', material: 'Deux bols, une cuillère, de grosses pâtes', safety: 'Pas de haricots secs, de perles ni de petits grains avant 3 ans ; reste à côté.' },
  tri_couleurs: { title: 'Trier les couleurs', how: 'Range des chaussettes ou des cubes par couleur dans des boîtes ou des paniers. Nommez les couleurs ensemble, sans chercher la bonne réponse à tout prix.', material: 'Chaussettes ou cubes, quelques boîtes', safety: SMALL },
  parcours_coussins: { title: 'Le parcours de coussins', how: 'Un chemin de coussins à enjamber, un tunnel sous la table, un carton à traverser. Fais le parcours avec lui, puis laisse-le inventer le sien.', material: 'Coussins, une table, un grand carton', safety: 'Écarte les coins de meubles et dégage le sol.' },
  faire_semblant: { title: 'Faire semblant', how: 'Préparer un « repas » pour le doudou avec des boîtes vides et des ustensiles, lui donner à manger, le mettre au lit. Suis son histoire.', material: 'Boîtes vides propres, ustensiles en plastique, un doudou' },
  bulles: { title: 'Les bulles de savon', how: 'Souffle des bulles et laisse ton enfant les suivre, les attraper, les éclater. Essaie de grosses bulles lentes, puis plein de petites.', material: 'Liquide vaisselle dilué, une paille ou un anneau', safety: 'Le mélange ne se boit pas : flacon hors de portée.' },
  imagier: { title: 'L’imagier maison', how: 'Feuillette un imagier ou un catalogue : « Où est le chat ? », « Qu’est-ce que c’est ? ». Laisse-le tourner les pages et montrer à son tour.', material: 'Un imagier, un vieux magazine' },
  tresors_parc: { title: 'Les petits trésors du parc', how: 'Ramassez des feuilles, des cailloux, des bâtons ; comparez les grands et les petits, les lisses et les rugueux. Rapportez un trésor à la maison.', material: 'Un sac', safety: 'Rien à la bouche ; lavage des mains au retour.' },
  pate_a_sel: { title: 'La pâte à sel', how: 'Mélange deux verres de farine, un verre de sel et un verre d’eau. On malaxe, on écrase, on fait des boudins et des empreintes.', material: 'Farine, sel, eau, un saladier', safety: 'Très salée : elle ne se mange pas. Mains lavées après.' },
  // ---------------------------------------------------------------- 3–6 ans
  jacques_a_dit: { title: 'Jacques a dit', how: 'On fait le geste seulement si la consigne commence par « Jacques a dit ». Chacun son tour pour donner les consignes.', material: 'Rien' },
  memory_maison: { title: 'Le memory maison', how: 'Dessinez ensemble des paires de cartes (soleil, chat, maison…), retournez-les face cachée et retrouvez les paires.', material: 'Carton découpé, crayons' },
  chasse_couleurs: { title: 'La chasse aux couleurs', how: 'Trouver dans la maison trois objets rouges, puis trois bleus, puis trois jaunes. On les pose sur une feuille de la bonne couleur.', material: 'Feuilles de couleur (facultatif)' },
  course_cuillere: { title: 'La course à la cuillère', how: 'Transporter une balle de ping-pong ou une petite pomme de terre dans une cuillère jusqu’à l’arrivée, sans la faire tomber.', material: 'Des cuillères, une balle de ping-pong', safety: 'Terrain plat et sans obstacle.' },
  histoire_trois_mots: { title: 'L’histoire en trois mots', how: 'Ton enfant choisit trois mots (un dragon, une chaussette, la lune) et vous inventez l’histoire ensemble, une phrase chacun.', material: 'Rien' },
  marelle: { title: 'La marelle', how: 'Dessine une marelle à la craie, lance un caillou et saute à cloche-pied sans marcher sur la case du caillou.', material: 'Une craie, un caillou', safety: 'Dans une cour ou un jardin, loin de la rue.' },
  bateau_papier: { title: 'Le bateau en papier', how: 'Pliez un bateau ensemble et faites-le flotter dans une bassine. Soufflez dessus pour le faire avancer.', material: 'Une feuille, une bassine d’eau', safety: 'Jamais seul près de l’eau, même peu profonde ; vide la bassine après.' },
  graine: { title: 'Planter une graine', how: 'Pose quelques lentilles sur du coton humide dans un pot. Chaque jour, regardez ce qui change et dessinez-le.', material: 'Coton, lentilles, un petit pot', safety: 'Les graines ne se mangent pas crues.' },
  // ---------------------------------------------------------------- 6–10 ans
  marchande: { title: 'La marchande', how: 'Installez un magasin avec des boîtes vides et de vrais prix. On achète, on rend la monnaie, on change de rôle.', material: 'Boîtes vides, pièces ou jetons, papier', safety: 'Petites pièces hors de portée des plus jeunes de la fratrie.' },
  cuisiner: { title: 'Cuisiner ensemble', how: 'Choisissez une recette simple : ton enfant lit les étapes, pèse et mesure, tu t’occupes du four.', material: 'Une balance, une recette, les ingrédients', safety: 'Four, plaques et couteaux avec un adulte.' },
  carte_tresor: { title: 'La carte au trésor', how: 'Dessine le plan de la maison, cache un objet et marque-le d’une croix. Ensuite, c’est ton enfant qui cache et dessine.', material: 'Papier, crayons' },
  quiz_famille: { title: 'Le quiz en famille', how: 'Chacun prépare cinq questions sur un thème qu’il aime (animaux, sport, la famille…) et les pose aux autres.', material: 'Papier, crayon' },
  mots_caches: { title: 'Les mots cachés', how: 'Écris un long mot (« papillonner ») et cherchez ensemble tous les mots qu’on peut former avec ses lettres.', material: 'Papier, crayon' },
  jeu_de_piste: { title: 'Le jeu de piste', how: 'Prépare des indices à suivre (« Va au pied du grand arbre », « Compte dix pas vers le banc ») jusqu’à une petite surprise.', material: 'Papier, crayon', safety: 'Zone définie et point de rendez-vous convenu à l’avance.' },
  coule_flotte: { title: 'Coule ou flotte ?', how: 'Avant chaque essai, on parie : cet objet va-t-il couler ou flotter ? Puis on teste et on note les résultats dans un tableau.', material: 'Une bassine d’eau, des objets de la maison', safety: 'On essuie l’eau au sol pour ne pas glisser.' },
  ombres: { title: 'Les ombres chinoises', how: 'Dans une pièce sombre, une lampe de poche et tes mains : un lapin, un oiseau, un loup. Inventez une petite histoire avec les ombres.', material: 'Une lampe de poche', safety: 'On ne regarde pas la lampe en face.' },
};
