# Conformité : données de santé (brouillon à faire valider)

> **Brouillon préparé à partir du code, pas un avis juridique.** À faire relire et compléter par un ou une juriste / DPO avant toute mise en ligne. Les points marqués « À vérifier » n'ont pas pu être confirmés ici.

## 1. Analyse d'impact (AIPD) — éléments déjà rassemblés

**Pourquoi une AIPD est nécessaire** : traitement de données de santé (cycle, grossesse, santé des enfants, humeur) à grande échelle, concernant aussi des enfants ; la CNIL classe ce type de traitement parmi ceux qui exigent une AIPD (À vérifier : liste CNIL en vigueur).

| Rubrique | Ce que fait l'application |
|---|---|
| Finalités | Suivi personnel et familial (cycle, grossesse, enfants), rappels, communauté, assistant d'information |
| Base légale | Consentement explicite (art. 9.2.a RGPD) : consentements enregistrés et datés (`consents`), dont `health_data`, `ai_assistant`, `intimate_data` |
| Données | Cycle, symptômes, rapports (facultatif, consentement séparé), contraception déclarée, grossesse, mesures et santé des enfants, humeur, documents |
| Destinataires | La personne seule par défaut ; foyer selon les droits choisis ; partenaire pour le cycle (choix élément par élément, révocable) ; jamais la communauté ni des annonceurs |
| Sous-traitants | Supabase (hébergement), Google (Gemini, si l'assistant est utilisé), RevenueCat, Expo, Resend, Sentry (facultatif) |
| Transferts hors UE | À vérifier pour chaque sous-traitant (clauses contractuelles types, Data Privacy Framework) |
| Durées | Réglables (`privacy_settings`), suppression du compte et de tout le cycle à tout moment |
| Droits | Export complet (`export_my_data`), effacement (`delete_my_cycle_data`, `delete_my_intimate_data`, suppression du compte) |
| Sécurité | RLS sur toutes les tables (842+ tests SQL), clés IA côté serveur, photos du cycle chiffrées sur l'appareil, notifications discrètes, verrouillage biométrique, IA sans données d'identification |
| Minimisation | Estimations calculées sur le téléphone ; l'assistant reçoit la phase du cycle seulement, sans dates ni symptômes |

**Risques à évaluer** (gravité / vraisemblance à compléter) : accès illégitime au téléphone (atténué par le verrouillage et les notifications discrètes) ; partage involontaire avec le foyer (atténué par des choix explicites, révocables) ; fuite chez un sous-traitant ; réponses inexactes de l'assistant (contrôles de prudence, sources).

## 2. Hébergement des données de santé (HDS)
En France, héberger des données de santé pour le compte d'autrui peut exiger un hébergeur **certifié HDS** (art. L.1111-8 du Code de la santé publique). **À vérifier** : si le statut de l'application l'impose, et si l'offre Supabase choisie est certifiée HDS (liste officielle sur esante.gouv.fr). Sinon, prévoir une base PostgreSQL chez un hébergeur certifié : les migrations SQL sont portables.

## 3. Documents à rédiger
- [ ] Politique de confidentialité (reprendre le tableau ci-dessus en langage simple).
- [ ] Conditions d'utilisation et mentions légales.
- [ ] Registre des traitements.
- [ ] Contrats de sous-traitance (DPA) signés avec chaque service.
- [ ] Procédure de violation de données (72 h).
- [ ] Mention « ne remplace pas un avis médical » (déjà présente dans l'application).
