# HOMI — Suivi de la mission « Intégration GitHub et refonte premium » (24/11/2026)

## Décisions sur les dépôts proposés
| Dépôt | Décision | Raison |
|---|---|---|
| shadcn/ui, Radix, Mantine, daisyUI, Tailwind, Magic UI, Sonner, Vaul, cmdk, Tremor, Recharts | **Écartés comme dépendances** (inspiration seulement) | Bibliothèques web (DOM) : inutilisables dans l'app React Native ; le site est une page statique HTML/CSS. Leurs équivalents existent déjà dans l'app (verre, feuilles, notifications, recherche, graphiques). |
| Reanimated 4, Skia 2, Victory Native, Gesture Handler, Screens, expo-glass-effect, expo-blur, expo-haptics | **Déjà intégrés** | Présents dans `package.json`, utilisés par `src/components/glass`, `src/motion`, les courbes. |
| FlashList | **Écarté (mesuré)** | 6 000 entrées : affichage < 0,7 s, DOM stable (listes découpées par jour). Aucun gain attendu. À re-mesurer sur iPhone. |
| Gorhom Bottom Sheet, Vaul | Écartés | Les feuilles existent (`Sheet`, `GlassOverlays`) avec décalage clavier. |
| react-native-keyboard-controller | En attente | À n'ajouter que si un champ reste masqué sur iPhone réel (non vérifiable ici). |
| Lucide, Tabler, Lottie | Écartés | Doublons des icônes et animations actuelles ; mélange de styles. |
| Storybook | Écarté | Lourde dépendance de développement ; les états des composants sont couverts par Jest. |
| Maestro | Non exécutable ici | Exige un simulateur ou un iPhone. |
| NativeWind | Écarté | Système de styles concurrent des jetons existants (`src/theme`). |

## Lots réalisés
1. Recherche : faute « ne dor pas » → sommeil du bébé (test) ; « épuisée » propose aussi les tours de nuit (4ᵉ, l'aide d'urgence reste dans les 3 premiers).
2. Listes longues : mesurées (voir ci-dessus), rien à changer.
3. Graphiques : comparaison avec les 7 jours précédents (moyenne des jours notés, jamais de zéro inventé) — `periodCompare.ts`, branchée sous les barres de biberons ; vérifiée en navigateur (+20 %).
4. Confirmations : saisies rapides biberon et couches ont déjà « Annuler » ; les messages de réussite ne s'affichent qu'après l'enregistrement (file hors ligne : message « en attente »).
5. Clavier : feuilles avec décalage clavier et champ ramené à l'écran ; vérification iPhone requise.

## Restant (exige un appareil)
Clavier iOS réel, 60 FPS mesurés, Maestro, Liquid Glass natif sur iOS récent.
