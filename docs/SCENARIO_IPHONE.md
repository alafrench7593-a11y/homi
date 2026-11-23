# Scénario à rejouer sur un vrai iPhone — HOMI

Pas d'iPhone physique dans l'environnement d'audit : ce scénario est à rejouer à la main. Ce point reste OUVERT tant
qu'il n'a pas été joué et noté. Durée : 30 à 40 minutes. Données : comptes fictifs uniquement.

## Préparation

- **Appareils** : un petit iPhone (SE 2e/3e génération ou 13 mini, iOS 26) ET un grand (15/16/17 Pro Max). Si un seul
  appareil : le petit.
- **Build** : le dernier build de production iOS (TestFlight interne), construit depuis `homi/fondations` à partir du
  commit `b63e1f9` ou plus récent.
- **Compte** : un compte de test avec deux enfants (« Lina » ~13 mois, « Noé » ~3 ans) et Premium de test ; un second
  compte co-parent limité à Lina (pour l'étape 6).
- **Réglages iPhone** à basculer pendant le test : Réglages › Accessibilité › Affichage et taille du texte › Texte plus
  grand (curseur au maximum, puis « Tailles plus grandes » activé) ; Réduire la transparence (étape 5).
- Filmer l'écran (Centre de contrôle › Enregistrement de l'écran) : la vidéo est la preuve.

Noter pour chaque étape : **OK / KO + capture ou minute de la vidéo**.

## 1. Aura → outil → saisie → sauvegarde → retour au chat

1. Onglet Aura. Écrire « il vient de finir son bib ». Attendu : carte « Ouvrir Noter un biberon · Lina » (ou question
   « Pour quel enfant ? » si aucun enfant n'est affiché). Aucun crédit consommé (mention « sans IA ni crédit »).
2. Toucher la carte. Attendu : l'écran Biberon de Lina s'ouvre ; rien n'est enregistré à l'ouverture.
3. Dans « Noter un biberon » : −10 ml trois fois, puis Enregistrer **deux fois très vite**. Attendu : UNE seule ligne
   dans l'historique (vérifier la liste « Aujourd'hui »).
4. Toucher la ligne → « Corriger » → +10 ml → Enregistrer. Attendu : la ligne affiche la nouvelle quantité, toujours une
   seule ligne.
5. Bouton retour (en haut à gauche) puis **geste de retour** (glisser depuis le bord gauche). Attendu : retour dans le
   fil d'Aura, la conversation est toujours là, la carte est toujours visible.
6. Écrire « J'ai mis 14 h 35 mais elle s'est réveillée à 14 h 20 » (si une sieste finit à 14 h 35). Attendu : fiche de
   la sieste ouverte en modification, « Fin proposée à 14 h 20 », rien d'enregistré avant d'avoir touché Enregistrer.

## 2. Clavier numérique et dernier champ

1. Enfant › Croissance (ou carte Aura « Où j'ajoute son poids ? »). Attendu : curseur dans « Poids », pavé numérique
   décimal, barre au-dessus du clavier avec « Suivant ».
2. Taper « 9,85 » → « Suivant » → Taille « 80 » → « Suivant » → Périmètre crânien → **« OK »** sur le DERNIER champ :
   le clavier se ferme et le bouton « Enregistrer la mesure » est visible, pas caché sous le clavier.
3. Allaitement › « Ajouter » (saisie détaillée) › champ Durée : pavé numérique, champ visible au-dessus du clavier.
4. Relais (Famille › Relais) › « Un mot pour le relais » : texte long sur plusieurs lignes ; le champ reste visible ;
   relire le message ; le mot apparaît en bas.
5. Aura : message long (3 lignes) ; le champ grandit, le bouton Envoyer reste touchable, le dernier message reste
   visible au-dessus du clavier.

## 3. Gestes

- Tiroirs (fiche de biberon, de sieste, de tétée) : glisser vers le bas ferme sans enregistrer ; la valeur n'a pas
  changé.
- Bande de la journée (Sommeil, Allaitement) : faire glisser le doigt lit chaque saisie ; toucher en ouvre la fiche.
- Courbe de croissance : glisser le doigt affiche la bulle valeur + date.
- Défilement rapide de l'accueil : la barre d'onglets en verre reste lisible et répond au premier toucher.

## 4. Texte agrandi (taille maximale)

Rejouer les étapes 1.1 à 1.4 et 2.1 à 2.2 avec le texte au maximum. Attendu : aucun libellé coupé au point de perdre le
sens, aucun bouton caché ou superposé, la carte d'Aura reste entièrement lisible, les nombres en grand (« 180 ml »,
« 1 h 10 ») restent sur une ligne.

## 5. Lisibilité du Liquid Glass

- Accueil, défiler pour que photos et cartes passent sous la barre d'onglets : les libellés (Aujourd'hui, Moi, Enfant,
  Famille) restent lisibles en mode clair ET sombre.
- Ouvrir une fiche (tiroir) au-dessus d'un écran chargé : le texte de la fiche se lit sans effort.
- Activer « Réduire la transparence » : les verres deviennent opaques, rien ne disparaît.
- Mode nuit (Sommeil › écran nuit) : rien ne brille, le bouton « Lina s'endort » est lisible.

## 6. Confidentialité sur le téléphone (après déploiement des migrations en production)

1. Se connecter avec le co-parent limité à Lina : seule Lina apparaît (accueil, Mes apps, Aura « changer d'enfant »).
2. Sur un autre appareil, la propriétaire lui retire Lina puis lui rend. Rouvrir l'app du co-parent : les données de
   l'enfant retiré ne s'affichent plus, même hors connexion (mode Avion avant de rouvrir).
3. Se déconnecter, se connecter avec un autre compte sur le même iPhone : aucun favori, raccourci, brouillon ni
   donnée du compte précédent.

## Résultat

Le point « app iPhone » est levé quand les étapes 1 à 5 sont OK sur le petit iPhone, avec la vidéo jointe.
