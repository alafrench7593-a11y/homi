# Revue des applications de référence (mission V6, 13/11/2026)

Agent E « Recherche ».

**Limite principale : aucune de ces applications n'a été installée ni inspectée directement.** Tout vient des pages publiques consultées le 13/11/2026 (sites officiels, fiches App Store américaines, communiqué Apple). Une fiche App Store décrit ce que l'éditeur **annonce**, pas ce que l'application fait réellement. Les prix cités sont ceux affichés sur ces pages, à titre de constat — **ils ne doivent pas servir à fixer un prix dans Au fil de nous**. Rien n'est à copier : on retient des principes, pas des écrans ni des textes.

## 1. Ce que disent les sources, application par application

### Huckleberry (suivi bébé, sommeil)
Sources : https://huckleberrycare.com/ ; https://apps.apple.com/us/app/huckleberry-baby-child/id1169136078
- Saisie « en un geste » pour sommeil, couches, repas, tire-lait, croissance, médicaments ; minuteur d'allaitement **par côté** ; rappels gratuits. *(App Store)*
- Synchronisation entre **plusieurs aidants** incluse dans l'offre gratuite ; profil par enfant. *(App Store)*
- Widget d'écran d'accueil, Live Activities, Siri (démarrer un côté, changer de côté), Apple Watch. *(App Store)*
- Gratuit : résumés et moyennes de sommeil, historique. Payant (« Plus ») : prévision de sieste « SweetSpot » (à partir de 2 mois), rapports détaillés, saisie par texte / voix / photo ; (« Premium ») : assistant conversationnel, plans de sommeil. *(App Store)*
- L'utilisateur choisit ce qu'il suit et masque le reste. *(site officiel)*

### Nara Baby
Source : https://apps.apple.com/us/app/nara-baby-pregnancy-tracker/id1444639029
- Minuteur d'allaitement gauche / droite qui **indique le côté de la dernière tétée** ; minuteur de tire-lait **séparé par côté** ; couches « en un toucher ».
- Sommeil par minuteur **ou** saisie manuelle début / fin ; graphiques automatiques, comparaison jour / semaine.
- Masquer les activités non suivies ; invitations partenaire, grands-parents, aidants ; **l'aidant voit l'activité récente quand il prend le relais** ; plusieurs enfants / jumeaux.
- Live Activities (écran verrouillé, Dynamic Island) : démarrer / arrêter sans déverrouiller ; Siri ; Apple Watch.
- Suivi du parent (grossesse et post-partum : hydratation, repas, sommeil, humeur) avec partage au partenaire et au médecin.

### Baby Tracker – Newborn Log (éditeur non relevé)
Source : https://apps.apple.com/us/app/baby-tracker-newborn-log/id779656557
- Dernier côté et durée par côté ; heure du dernier change affichée.
- Vues jour / semaine / mois ; **export PDF**, envoi ou impression pour les soignants.
- Synchronisation multi-appareils ; widgets d'accueil et d'écran verrouillé ; Live Activities ; Apple Watch ; raccourcis Siri.
- Repères de timing calculés **sur l'appareil** à partir des saisies récentes, **masquables** dans les réglages.
- Abonnement « Group Plus » : un abonnement débloque l'option pour tout le groupe de synchronisation. Contient de la publicité dans la version gratuite.

### Clue (cycle)
Source : https://helloclue.com/
- Modes de vie distincts (règles, santé menstruelle, conception, grossesse, périménopause) et suivi **sans règles** possible.
- Prévisions de base gratuites ; analyses avancées payantes ; algorithme de conception présenté comme « fondé sur des preuves ».
- Promesse de confidentialité forte : données jamais vendues ni transmises « à aucune autorité », protection selon le droit européen.
- Partage du cycle avec un proche (« Clue Connect ») dans l'offre payante.

### Flo (cycle)
Source : https://flo.health/
- « Anonymous Mode » annoncé (non détaillé sur la page) ; portail de confidentialité.
- « Flo for Partners » : explications destinées au partenaire.
- Plus de 100 médecins et experts cités comme relecteurs des contenus.

### Ovia (fertilité, grossesse)
Sources : https://www.ovuline.com/ ; https://www.oviahealth.com/
- Modèle principal : **avantage proposé par l'employeur ou la mutuelle** (plus de 2 000 clients annoncés), « Care Team » joignable par messagerie / téléphone / vidéo.
- Suivi des symptômes comparé à des repères cliniques ; synchronisation Apple Santé / Google Fit.
- Chiffres d'efficacité **auto-déclarés** par l'éditeur (non vérifiés).

### Cozi (organisation familiale)
Source : https://www.cozi.com/
- Agenda familial **codé par couleur par personne** ; rappels ; e-mail d'agenda.
- Listes de courses et de tâches mises à jour pour tous en temps réel ; planificateur de repas qui envoie les ingrédients à la liste.
- Gratuit avec publicité ; offre payante sans publicité avec vue mensuelle mobile et notifications de modification.

### FamilyWall (organisation familiale)
Source : https://www.familywall.com/
- Agenda partagé synchronisé avec Google Agenda ; listes ; messagerie de groupe.
- Partage de position et alertes d'arrivée (maison, école).
- Planificateur de repas et budget marqués « Premium ».

### Apple Journal
Source : https://www.apple.com/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments/ (la page d'aide https://support.apple.com/guide/iphone/get-started-with-journal-iph0e5ef4bd3/ios n'affichait que des titres de rubriques)
- Suggestions d'écriture tirées des photos, lieux, entraînements, **calculées sur l'appareil** ; l'utilisateur choisit ce qui est ajouté.
- Invitations de réflexion (gratitude, bienveillance…).
- Verrouillage par code / Face ID ; entrées chiffrées de bout en bout dans iCloud.
- Notifications programmées pour installer une habitude.

## 2. Principes de conception utiles pour Au fil de nous

Chaque principe renvoie à la source qui l'inspire et à ce qu'il signifie ici. Aucun n'impose une nouvelle dépendance.

### Navigation
1. **Masquer ce qu'on ne suit pas** (Huckleberry, Nara). Ici : l'accueil personnalisable existe (`/settings/home`) ; l'étendre aux catégories de `/track` répond aussi au besoin « suivi léger » de la recherche Reddit (T1, T4, T5).
2. **Modes de vie séparés** (Clue). Ici : déjà le cas avec les parcours par profil (cycle, grossesse, post-partum, enfant). Garder une seule porte d'entrée par moment de vie.

### Saisie rapide (la nuit surtout)
3. **Afficher « dernier côté » et « depuis combien de temps »** avant même d'ouvrir la saisie (Nara, Baby Tracker). C'est l'information la plus demandée à 3 h du matin.
4. **Minuteur par côté + saisie manuelle début / fin** (Nara) : le minuteur ne doit pas être le seul moyen, on oublie souvent de le lancer.
5. **Démarrer / arrêter sans déverrouiller** (Live Activities, widgets : Huckleberry, Nara, Baby Tracker). Ici : des widgets existent (`src/widgets`) ; les Live Activities demanderaient du natif — à évaluer plus tard, non prioritaire.
6. **Saisie « un toucher » pour les couches** (Nara) : un geste, puis correction possible.

### Partage entre parents
7. **L'aidant qui prend le relais voit l'activité récente** (Nara). Ici : relais de nuit (`/family/nights`) + résumé des dernières heures pour celui qui se lève.
8. **Partage gratuit entre aidants** (Huckleberry, Baby Tracker « Group Plus »). Les concurrents ne font pas payer la synchronisation de base : à garder en tête pour la frontière gratuit / Premium (décision du propriétaire, sans prix inventé).
9. **Partage choisi élément par élément** (Clue Connect, Flo for Partners, Nara « partager au médecin »). Ici : déjà le principe de `/cycle/share` et `/postpartum/sharing` ; la règle du propriétaire (rien d'intime visible automatiquement, contrôle serveur RLS) va **plus loin** que ce que ces pages décrivent.
10. **Couleur par personne** dans l'agenda familial (Cozi).

### Graphiques et rapports
11. **Vues jour / semaine / mois descriptives** (Nara, Baby Tracker) — sans score ni comparaison à une moyenne, conformément aux règles du projet.
12. **Export PDF pour le soignant** (Baby Tracker). Ici : `/summary`, `/documents/export`, `/cycle/export` existent.
13. **Les prévisions sont présentées comme facultatives et masquables, calculées sur l'appareil** (Baby Tracker). Si Au fil de nous propose un jour une estimation de sieste, la dire « estimation à partir de vos saisies », masquable — cohérent avec la méfiance envers les « fenêtres d'éveil » relevée sur Reddit (S8, S9).

### Confiance et intimité
14. **Calcul sur l'appareil + verrouillage biométrique + chiffrement** (Apple Journal) : bon modèle pour le journal intime de la mère.
15. **Relecture médicale affichée** (Flo) et **sources visibles** (Clue) : ici, `/sources` existe ; afficher la source au pied de chaque fiche santé.
16. **Pas de publicité dans les moments sensibles** : Cozi et Baby Tracker gratuits contiennent de la publicité ; la recherche Reddit (T7) montre le rejet de la surcharge. Ne rien introduire de tel.

## 3. Ce qu'il ne faut pas reprendre
- Chiffres d'efficacité non vérifiables (« concevoir 3 fois plus vite ») : interdit par les règles du projet.
- Assistant conversationnel donnant des conseils de santé non encadrés.
- Partage de localisation en continu (FamilyWall) : hors périmètre et sensible.
- Toute norme « par âge » présentée comme un objectif.
