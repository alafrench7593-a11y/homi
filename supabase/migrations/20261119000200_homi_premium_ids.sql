-- =====================================================================
-- HOMI Premium : identifiants propres à HOMI (15/11/2026).
-- HOMI est une application SÉPARÉE d'« Au fil de nous » : le droit RevenueCat et les produits ne portent plus son nom.
--   droit RevenueCat   : AU_FIL_DE_NOUS_PREMIUM → HOMI_PREMIUM
--   produits (boutique) : aufildenous_premium_monthly | _6months | _annual
--                         → homi_premium_monthly | homi_premium_6months | homi_premium_annual
--   groupe d'abonnements Apple : « HOMI Premium »
--
-- Les migrations déjà appliquées (dont 20261105000100_subscription_v2.sql) ne sont PAS modifiées : celle-ci les suit.
-- has_premium() / _premium_of() ne filtrent pas sur le nom du droit : une ancienne ligne éventuelle continue de donner
-- ses droits jusqu'à son échéance (aucune en production : la base HOMI est neuve). Le serveur ne réécrit que
-- l'étiquette interne du droit ; l'identifiant de produit d'une ancienne ligne est un fait de la boutique, gardé tel
-- quel (la formule reste reconnue : la règle de période lit « monthly », « 6months », « annual » dans l'identifiant).
-- =====================================================================

alter table public.subscriptions alter column entitlement set default 'HOMI_PREMIUM';

-- Anciennes lignes (robustesse) : même droit, nouveau nom. Le webhook et subscription-sync écrivent déjà HOMI_PREMIUM
-- (REVENUECAT_ENTITLEMENT, valeur par défaut des fonctions).
update public.subscriptions set entitlement = 'HOMI_PREMIUM' where entitlement = 'AU_FIL_DE_NOUS_PREMIUM';

comment on column public.subscriptions.entitlement is
  'Droit RevenueCat du Premium HOMI (HOMI_PREMIUM) ; produits homi_premium_monthly, homi_premium_6months, homi_premium_annual.';

-- Retour arrière (à exécuter à la main si besoin) :
--   alter table public.subscriptions alter column entitlement set default 'AU_FIL_DE_NOUS_PREMIUM';
--   update public.subscriptions set entitlement = 'AU_FIL_DE_NOUS_PREMIUM' where entitlement = 'HOMI_PREMIUM';
