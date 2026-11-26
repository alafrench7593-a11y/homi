# HOMI — Règles anti « design générique » (permanentes)

Sources : skill **Anti UI Slop** (uizze, Apache-2.0 : playbooks iOS, polish, audit, craft) et skills **Emil Kowalski**
(animate-expo, design-eng), lus le 26/11/2026. ThinkUI et uizze.com n'étaient pas joignables depuis l'environnement :
aucune règle n'en est tirée. Ces guides orientent Claude ; **aucun n'est une dépendance de l'app**.

## 1. Partir du produit
- Étendre le système existant (`DESIGN_SYSTEM.md`, `HOMI_DESIGN_SYSTEM.md`, `DESIGN_TOKENS.md`) ; ne pas en inventer un autre.
- Chaque écran a UNE tâche principale qui se lit en premier. La hiérarchie vient de la taille, de la graisse et du
  regroupement avant d'ajouter des cartes.
- Langage réel de l'app (tutoiement, phrases courtes). Données d'exemple signalées comme telles. Jamais d'avis, de
  témoignage, de chiffre d'utilisateurs ou de performance inventés.

## 2. Habitudes à refuser (sauf si elles servent la tâche)
- Cartes icône + titre + texte répétées sans information propre.
- Dégradés décoratifs sur les titres, verre partout, pastilles en capsule pour tout (`radius.pill` = filtres et statuts seulement).
- Graphiques décoratifs sans donnée, panneaux imbriqués, bordures pleines là où une ombre translucide suffit.
- Entrées identiques sur chaque section, animations qui retardent le contenu.
- Écrans « tableau de bord SaaS » : HOMI est une app de famille, chaleureuse, pas un back-office.

## 3. Plancher de qualité (vérifié à chaque écran)
- Texte : ≥ 4,5:1 (3:1 si grand), lisible jusqu'à la taille de texte 1,3 du téléphone, pas de coupure de mot ni de troncature non voulue.
- Cibles tactiles ≥ 44 × 44 pt (sinon `hitSlop`, sans agrandir le visuel).
- États : chargement (squelette, jamais d'écran blanc), vide, erreur avec reprise, succès, désactivé, hors ligne.
- Clavier : le champ actif reste visible ; aucune donnée saisie perdue sur erreur (brouillons).
- Chiffres comparés en chiffres tabulaires. Images au bon cadrage, nettes à leur taille.
- Couleur jamais seule porteuse de sens.

## 4. Porte de fin (« finish gate »)
Un écran n'est « terminé » qu'après : rendu réel inspecté (petit iPhone 320 × 568 et 390 × 844, texte 1 et 1,3, clair
et sombre, clavier ouvert), états importants exercés, `e2e/audit_ux.py` sans constat bloquant, tests Jest du domaine
verts. Dire clairement ce qui n'a pas pu être vérifié (iPhone réel, Instruments) au lieu de le compter comme réussi.
