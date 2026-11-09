-- Premium strict : installé mais EN ATTENTE jusqu'à la sortie (10/11/2026, décision de David).
-- Les produits d'abonnement ne sont pas encore créés dans l'App Store et Google Play : personne ne pourrait payer.
-- Le verrouillage reste donc désactivé ; l'offre Premium reste visible dans l'app (écran Premium, réglages).
-- Activation le jour de la sortie (réversible) : update public.premium_policy set strict = true;
-- Retour arrière : update public.premium_policy set strict = false;
update public.premium_policy set strict = false where id;
