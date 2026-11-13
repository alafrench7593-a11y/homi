-- =====================================================================
-- Courses et stocks (15/11/2026, phase 6) — types d'événements métier (migration dédiée, comme le prévoit
-- 20261113000400_evenements_foyer.sql : une valeur ajoutée à un énuméré n'est utilisable qu'après validation).
-- Déjà présents : shopping.item_added, shopping.item_checked, stock.low, expense.recorded.
--   stock.restock_confirmed  : un membre autorisé confirme la suggestion de réapprovisionnement (mission créée)
--   stock.restock_dismissed  : suggestion écartée (« pas maintenant »), sans mission
--   stock.purchase_confirmed : achat VALIDÉ explicitement, quantité mise à jour — fait prévu pour le futur module
--                              Budget (aucun montant ici, aucun écran) ; voir HOMI_SHOPPING_STOCKS_SPEC.md § 6
-- Retour arrière : impossible de retirer une valeur d'un énuméré sans le recréer ; les valeurs inutilisées sont sans effet.
-- =====================================================================
alter type public.household_event_type add value if not exists 'stock.restock_confirmed';
alter type public.household_event_type add value if not exists 'stock.restock_dismissed';
alter type public.household_event_type add value if not exists 'stock.purchase_confirmed';
