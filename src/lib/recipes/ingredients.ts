/**
 * Dictionnaire des ingrédients : allergènes (14 allergènes réglementaires de l'UE), rayon pour la liste de
 * courses, précautions (grossesse, âge, étouffement), termes reconnus par le scanner et « ce que j'ai ».
 * Les allergènes d'une recette sont DÉDUITS de ce dictionnaire (vérification automatique).
 */
import type { IngredientDef } from './types';

const I = (d: IngredientDef) => d;

export const INGREDIENTS: Record<string, IngredientDef> = {
  // ---------------------------------------------------------------- légumes
  carrot: I({ name: 'carotte', stem: 'carott', aisle: 'fruits_legumes', color: '#F08A2B', terms: ['carotte'], choking: 'Crue : à râper finement avant 4 ans.' }),
  zucchini: I({ name: 'courgette', stem: 'courgett', aisle: 'fruits_legumes', color: '#7DA548', terms: ['courgette'] }),
  potato: I({ name: 'pomme de terre', stem: 'pomme de terre|pommes de terre', aisle: 'fruits_legumes', color: '#E8CF8E', terms: ['pomme de terre', 'patate'] }),
  sweet_potato: I({ name: 'patate douce', stem: 'patate douce|patates douces', aisle: 'fruits_legumes', color: '#E8823A', terms: ['patate douce'] }),
  peas: I({ name: 'petits pois', stem: 'petits pois', aisle: 'surgeles', color: '#8CC152', terms: ['petits pois', 'petit pois'] }),
  green_beans: I({ name: 'haricots verts', stem: 'haricots verts', aisle: 'surgeles', color: '#5E9E3A', terms: ['haricot vert', 'haricots verts'] }),
  broccoli: I({ name: 'brocoli', stem: 'brocoli', aisle: 'fruits_legumes', color: '#3E8E41', terms: ['brocoli'] }),
  cauliflower: I({ name: 'chou-fleur', stem: 'chou-fleur', aisle: 'fruits_legumes', color: '#F2EAD3', terms: ['chou-fleur', 'chou fleur'] }),
  spinach: I({ name: 'épinards', stem: 'epinard', aisle: 'surgeles', color: '#2F6B2F', terms: ['epinard'] }),
  leek: I({ name: 'poireau', stem: 'poireau', aisle: 'fruits_legumes', color: '#A8C686', terms: ['poireau'] }),
  pumpkin: I({ name: 'potiron', stem: 'potiron', aisle: 'fruits_legumes', color: '#E07B24', terms: ['potiron', 'courge', 'potimarron'] }),
  onion: I({ name: 'oignon', stem: 'oignon', aisle: 'fruits_legumes', color: '#E9D8B4', terms: ['oignon'] }),
  garlic: I({ name: 'ail', stem: 'ail', aisle: 'fruits_legumes', color: '#F4EBDD', terms: ['ail'] }),
  tomato: I({ name: 'tomate', stem: 'tomate', aisle: 'fruits_legumes', color: '#D9432B', terms: ['tomate'] }),
  canned_tomato: I({ name: 'tomates concassées en conserve', stem: 'tomates concassees', aisle: 'epicerie', color: '#C7381F', terms: ['tomates concassees', 'tomate concassee', 'coulis de tomate', 'tomate'] }),
  cucumber: I({ name: 'concombre', stem: 'concombre', aisle: 'fruits_legumes', color: '#7FB36A', terms: ['concombre'] }),
  bell_pepper: I({ name: 'poivron rouge', stem: 'poivron', aisle: 'fruits_legumes', color: '#D8342A', terms: ['poivron'] }),
  corn: I({ name: 'maïs doux', stem: 'mais', aisle: 'epicerie', color: '#F2C83B', terms: ['mais'] }),
  lettuce: I({ name: 'salade verte', stem: 'salade', aisle: 'fruits_legumes', color: '#7CB24A', terms: ['salade', 'laitue', 'mache'] }),
  beetroot: I({ name: 'betterave cuite', stem: 'betterave', aisle: 'fruits_legumes', color: '#8E1F4A', terms: ['betterave'] }),
  mushroom: I({ name: 'champignons de Paris', stem: 'champignon', aisle: 'fruits_legumes', color: '#CDB79E', terms: ['champignon'] }),
  ginger: I({ name: 'gingembre frais', stem: 'gingembre', aisle: 'fruits_legumes', color: '#D9B36C', terms: ['gingembre'] }),
  parsley: I({ name: 'persil', stem: 'persil', aisle: 'fruits_legumes', color: '#3F8F3F', terms: ['persil'] }),
  chives: I({ name: 'ciboulette', stem: 'ciboulette', aisle: 'fruits_legumes', color: '#4E9A3E', terms: ['ciboulette'] }),
  // ---------------------------------------------------------------- fruits
  apple: I({ name: 'pomme', stem: 'pommes?(?! de terre)', aisle: 'fruits_legumes', color: '#E5B94E', terms: ['pomme'], choking: 'Crue : à râper avant 4 ans.' }),
  pear: I({ name: 'poire', stem: 'poire', aisle: 'fruits_legumes', color: '#D8D27A', terms: ['poire'] }),
  banana: I({ name: 'banane', stem: 'banane', aisle: 'fruits_legumes', color: '#F3D86B', terms: ['banane'] }),
  kiwi: I({ name: 'kiwi', stem: 'kiwi', aisle: 'fruits_legumes', color: '#8DB33A', terms: ['kiwi'] }),
  orange: I({ name: 'orange', stem: 'orange', aisle: 'fruits_legumes', color: '#F39A2B', terms: ['orange'] }),
  lemon: I({ name: 'citron', stem: 'citron', aisle: 'fruits_legumes', color: '#F2DC4B', terms: ['citron'] }),
  mango: I({ name: 'mangue', stem: 'mangue', aisle: 'fruits_legumes', color: '#F5A623', terms: ['mangue'] }),
  strawberry: I({ name: 'fraises', stem: 'fraise', aisle: 'fruits_legumes', color: '#E0383E', terms: ['fraise'] }),
  apricot: I({ name: 'abricots', stem: 'abricot', aisle: 'fruits_legumes', color: '#F2A54A', terms: ['abricot'] }),
  raisins: I({ name: 'raisins secs', stem: 'raisins secs', aisle: 'epicerie', color: '#6B3A2A', terms: ['raisin sec', 'raisins secs'], choking: 'Entiers : risque d\'étouffement avant 4 ans.', allergens: ['sulphites'] }),
  // ---------------------------------------------------------------- féculents, légumineuses, céréales
  rice: I({ name: 'riz', stem: 'riz', aisle: 'epicerie', color: '#F5F1E6', terms: ['riz'] }),
  brown_rice: I({ name: 'riz complet', stem: 'riz', aisle: 'epicerie', color: '#D9C9A3', terms: ['riz complet', 'riz'] }),
  round_rice: I({ name: 'riz rond', stem: 'riz', aisle: 'epicerie', color: '#F7F3EA', terms: ['riz rond', 'riz'] }),
  pasta: I({ name: 'pâtes', stem: 'pate', aisle: 'epicerie', allergens: ['gluten'], color: '#EBCB7A', terms: ['pates', 'spaghetti', 'penne', 'coquillettes'] }),
  wholewheat_pasta: I({ name: 'pâtes complètes', stem: 'pate', aisle: 'epicerie', allergens: ['gluten'], color: '#C9A35C', terms: ['pates completes', 'pates'] }),
  small_pasta: I({ name: 'petites pâtes sans œuf (étoiles)', stem: 'pate', aisle: 'epicerie', allergens: ['gluten'], color: '#EED38E', terms: ['petites pates', 'vermicelle', 'pates'] }),
  vermicelli: I({ name: 'vermicelles sans œuf', stem: 'vermicelle', aisle: 'epicerie', allergens: ['gluten'], color: '#F0D9A0', terms: ['vermicelle'] }),
  semolina: I({ name: 'semoule fine de blé', stem: 'semoule', aisle: 'epicerie', allergens: ['gluten'], color: '#F1DFA6', terms: ['semoule', 'couscous'] }),
  oats: I({ name: "flocons d'avoine", stem: 'avoine', aisle: 'epicerie', allergens: ['gluten'], color: '#D8C08E', terms: ['avoine', 'flocons'] }),
  flour: I({ name: 'farine de blé', stem: 'farine', aisle: 'epicerie', allergens: ['gluten'], color: '#F4EEDF', terms: ['farine'] }),
  buckwheat_flour: I({ name: 'farine de sarrasin (traces de blé possibles : vérifiez l’étiquette)', stem: 'sarrasin', aisle: 'epicerie', color: '#9C8468', terms: ['sarrasin', 'farine de sarrasin'] }),
  wholemeal_bread: I({ name: 'pain complet', stem: 'pain', aisle: 'boulangerie', allergens: ['gluten'], color: '#A9764A', terms: ['pain complet', 'pain'] }),
  bread: I({ name: 'pain de mie', stem: 'pain', aisle: 'boulangerie', allergens: ['gluten', 'milk'], color: '#E8C994', terms: ['pain de mie', 'pain'] }),
  tortilla: I({ name: 'galettes de blé (wraps)', stem: 'galette', aisle: 'epicerie', allergens: ['gluten'], color: '#EBD3A2', terms: ['wrap', 'tortilla'] }),
  rice_cakes: I({ name: 'galettes de riz soufflé', stem: 'galette', aisle: 'epicerie', color: '#F0E4C8', terms: ['galette de riz'] }),
  pizza_dough: I({ name: 'pâte à pizza', stem: 'pate', aisle: 'frais', allergens: ['gluten'], color: '#E9C98F', terms: ['pate a pizza'] }),
  shortcrust: I({ name: 'pâte brisée', stem: 'pate', aisle: 'frais', allergens: ['gluten', 'milk'], color: '#E5C48A', terms: ['pate brisee'] }),
  breadcrumbs: I({ name: 'chapelure (vérifiez l’étiquette : lait ou sésame possibles)', stem: 'chapelure', aisle: 'epicerie', allergens: ['gluten'], color: '#D7A65E', terms: ['chapelure'] }),
  red_lentils: I({ name: 'lentilles corail', stem: 'lentille', aisle: 'epicerie', color: '#E58B4A', terms: ['lentille corail', 'lentilles corail', 'lentille'] }),
  green_lentils: I({ name: 'lentilles vertes', stem: 'lentille', aisle: 'epicerie', color: '#6B6B3A', terms: ['lentille verte', 'lentilles', 'lentille'] }),
  chickpeas: I({ name: 'pois chiches cuits', stem: 'pois chiche', aisle: 'epicerie', color: '#D9B56B', terms: ['pois chiche'] }),
  kidney_beans: I({ name: 'haricots rouges cuits', stem: 'haricots rouges', aisle: 'epicerie', color: '#8B2E2A', terms: ['haricot rouge', 'haricots rouges'] }),
  infant_cereal: I({ name: 'céréales infantiles sans sucre ajouté', stem: 'cereales', aisle: 'epicerie', allergens: ['gluten'], color: '#EFE3C3', terms: ['cereales infantiles'] }),
  // ---------------------------------------------------------------- produits laitiers (pasteurisés)
  milk: I({ name: 'lait demi-écrémé (pasteurisé ou UHT)', stem: 'lait(?! de coco)', aisle: 'cremerie', allergens: ['milk'], color: '#FAF7F0', terms: ['lait'], minMonths: 12 }),
  infant_milk: I({ name: 'lait infantile (2e âge ou croissance)', stem: 'lait', aisle: 'epicerie', allergens: ['milk'], color: '#FBF8F1', terms: ['lait infantile', 'lait de croissance'] }),
  yogurt: I({ name: 'yaourt nature', stem: 'yaourt', aisle: 'cremerie', allergens: ['milk'], color: '#FBFAF5', terms: ['yaourt', 'yogourt'] }),
  fromage_blanc: I({ name: 'fromage blanc nature au lait pasteurisé', stem: 'fromage blanc', aisle: 'cremerie', allergens: ['milk'], color: '#FAF8F2', terms: ['fromage blanc', 'petit suisse'] }),
  cream_cheese: I({ name: 'fromage frais au lait pasteurisé (type carré frais)', stem: 'fromage frais', aisle: 'cremerie', allergens: ['milk'], color: '#FAF6EC', terms: ['fromage frais', 'carre frais'] }),
  emmental: I({ name: 'emmental en bloc (râpé à la maison)', stem: 'emmental', aisle: 'cremerie', allergens: ['milk'], color: '#F3DC8A', terms: ['emmental', 'gruyere', 'comte', 'fromage rape'] }),
  parmesan: I({ name: 'parmesan en bloc (râpé à la maison)', stem: 'parmesan', aisle: 'cremerie', allergens: ['milk'], color: '#EFD98F', terms: ['parmesan'] }),
  butter: I({ name: 'beurre', stem: 'beurre', aisle: 'cremerie', allergens: ['milk'], color: '#F6DE8D', terms: ['beurre'] }),
  cream: I({ name: 'crème fraîche épaisse pasteurisée', stem: 'creme', aisle: 'cremerie', allergens: ['milk'], color: '#FBF5E6', terms: ['creme fraiche', 'creme'] }),
  // ---------------------------------------------------------------- viandes, poissons, œufs
  egg: I({ name: 'œuf', stem: 'oeuf', aisle: 'cremerie', allergens: ['eggs'], color: '#F6C443', terms: ['oeuf'], mustCook: true }),
  chicken: I({ name: 'blanc de poulet', stem: 'poulet', aisle: 'boucherie', meat: true, color: '#E9C7A0', terms: ['poulet', 'volaille'], mustCook: true }),
  chicken_thigh: I({ name: 'cuisses de poulet', stem: 'poulet', aisle: 'boucherie', meat: true, color: '#C98B54', terms: ['poulet', 'cuisse de poulet'], mustCook: true }),
  ground_beef: I({ name: 'bœuf haché 5 % MG', stem: 'boeuf', aisle: 'boucherie', meat: true, color: '#8E3B2E', terms: ['boeuf', 'steak hache', 'viande hachee'], mustCook: true }),
  turkey_ham: I({ name: 'blanc de dinde cuit', stem: 'dinde', aisle: 'boucherie', meat: true, color: '#F0C9B4', terms: ['dinde', 'blanc de dinde'] }),
  ham: I({ name: 'jambon cuit préemballé (vérifiez l’étiquette)', stem: 'jambon', aisle: 'boucherie', meat: true, pork: true, allergens: ['milk'], color: '#F2A9A4', terms: ['jambon'] }),
  salmon: I({ name: 'pavé de saumon frais', stem: 'saumon', aisle: 'poissonnerie', fish: true, allergens: ['fish'], color: '#F28C6B', terms: ['saumon'], mustCook: true }),
  white_fish: I({ name: 'filet de cabillaud ou de colin', stem: 'poisson|cabillaud|colin', aisle: 'poissonnerie', fish: true, allergens: ['fish'], color: '#F4EEE6', terms: ['cabillaud', 'colin', 'poisson blanc', 'merlu'], mustCook: true }),
  mackerel: I({ name: 'filets de maquereau frais', stem: 'maquereau', aisle: 'poissonnerie', fish: true, allergens: ['fish'], color: '#7E8C9A', terms: ['maquereau'], mustCook: true }),
  sardines: I({ name: "sardines à l'huile en conserve", stem: 'sardine', aisle: 'epicerie', fish: true, allergens: ['fish'], color: '#8D97A3', terms: ['sardine'] }),
  tuna: I({ name: 'thon au naturel en conserve', stem: 'thon', aisle: 'epicerie', fish: true, allergens: ['fish'], color: '#C9A890', terms: ['thon'] }),
  // ---------------------------------------------------------------- épicerie
  olive_oil: I({ name: "huile d'olive", stem: 'huile', aisle: 'epicerie', color: '#C9B23B', terms: ['huile d olive', 'huile'] }),
  rapeseed_oil: I({ name: 'huile de colza', stem: 'huile', aisle: 'epicerie', color: '#E2C64A', terms: ['huile de colza', 'huile'] }),
  coconut_milk: I({ name: 'lait de coco', stem: 'coco', aisle: 'epicerie', color: '#F7F2E7', terms: ['lait de coco', 'coco'] }),
  vegetable_stock: I({ name: 'bouillon de légumes sans sel ajouté (vérifiez l’étiquette)', stem: 'bouillon', aisle: 'epicerie', allergens: ['celery', 'gluten'], color: '#D8B65A', terms: ['bouillon'] }),
  tahini: I({ name: 'purée de sésame (tahini)', stem: 'sesame|tahini', aisle: 'epicerie', allergens: ['sesame'], color: '#D6B88A', terms: ['tahini', 'sesame'] }),
  almond_powder: I({ name: "poudre d'amande", stem: 'amande', aisle: 'epicerie', allergens: ['nuts'], color: '#E8D2AE', terms: ['amande', 'poudre d amande'] }),
  walnuts: I({ name: 'cerneaux de noix', stem: 'noix', aisle: 'epicerie', allergens: ['nuts'], color: '#9A6A3E', terms: ['noix'], choking: 'Entiers : jamais avant 4 ans ; à donner en poudre.' }),
  sugar: I({ name: 'sucre', stem: 'sucre', aisle: 'epicerie', color: '#FBFBF7', terms: ['sucre'], addedSaltSugar: true }),
  salt: I({ name: 'sel', stem: 'sel', aisle: 'epicerie', color: '#FFFFFF', terms: ['sel'], addedSaltSugar: true }),
  honey: I({ name: 'miel', stem: 'miel', aisle: 'epicerie', color: '#E2A52B', terms: ['miel'], minMonths: 12, addedSaltSugar: true }),
  cumin: I({ name: 'cumin', stem: 'cumin', aisle: 'epicerie', color: '#B8873E', terms: ['cumin'] }),
  curry: I({ name: 'curry doux', stem: 'curry', aisle: 'epicerie', allergens: ['mustard', 'celery'], color: '#D9A21B', terms: ['curry'] }),
  cinnamon: I({ name: 'cannelle', stem: 'cannelle', aisle: 'epicerie', color: '#A0612A', terms: ['cannelle'] }),
  ras_el_hanout: I({ name: 'ras-el-hanout doux sans piment', stem: 'ras-el-hanout', aisle: 'epicerie', color: '#B2572B', terms: ['ras el hanout'] }),
  paprika: I({ name: 'paprika doux', stem: 'paprika', aisle: 'epicerie', color: '#C9432A', terms: ['paprika'] }),
  herbs: I({ name: 'herbes de Provence', stem: 'herbes', aisle: 'epicerie', color: '#6C7F3A', terms: ['herbes de provence', 'thym', 'origan'] }),
  baking_powder: I({ name: 'levure chimique', stem: 'levure', aisle: 'epicerie', color: '#FFFFFF', terms: ['levure'] }),
  vanilla: I({ name: 'extrait de vanille', stem: 'vanille', aisle: 'epicerie', color: '#4A2F1E', terms: ['vanille'] }),
  frozen_veg_mix: I({ name: 'mélange de légumes surgelés (carottes, petits pois, haricots)', stem: 'legumes', aisle: 'surgeles', color: '#7AA64A', terms: ['legumes surgeles', 'jardiniere'] }),
};

export const ing = (key: string) => {
  const d = INGREDIENTS[key];
  if (!d) throw new Error(`Ingrédient inconnu : ${key}`);
  return d;
};
