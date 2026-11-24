/**
 * Conditions Ambassadeurs version 1 : COPIE de la migration 20261210000100_ambassadeurs.sql, pour la démonstration
 * sans serveur uniquement (l'app réelle lit la vue ambassador_terms_public). Un test vérifie l'égalité avec la migration.
 */
import type { AmbassadorTerms } from './commission';

export const AMBASSADOR_TERMS_V1: AmbassadorTerms = {
  "version": 1,
  "base_rate": 30,
  "max_rate": 35,
  "tiers": [
    {
      "key": "starter",
      "label": "HOMI Starter",
      "rate": 30,
      "min_conversions": 0,
      "enabled": true
    },
    {
      "key": "silver",
      "label": "HOMI Silver",
      "rate": 31,
      "min_conversions": 25,
      "enabled": false
    },
    {
      "key": "gold",
      "label": "HOMI Gold",
      "rate": 33,
      "min_conversions": 100,
      "enabled": false
    },
    {
      "key": "elite",
      "label": "HOMI Elite",
      "rate": 35,
      "min_conversions": 500,
      "enabled": false
    }
  ],
  "commission_months": 6,
  "hold_days": 30,
  "payout_threshold_cents": 5000,
  "eligible_products": [
    "homi_premium_monthly",
    "homi_premium_6months",
    "homi_premium_annual",
    "homi_family_monthly_v2"
  ],
  "reference": {
    "currency": "EUR",
    "vat_rate": 20,
    "store_fee_rate": 15,
    "trial_days": 3,
    "family_supplement": 5,
    "plans": [
      {
        "key": "monthly",
        "label": "HOMI Premium mensuel",
        "price": 14.99,
        "months": 1
      },
      {
        "key": "semiannual",
        "label": "HOMI Premium 6 mois",
        "price": 69.99,
        "months": 6
      },
      {
        "key": "annual",
        "label": "HOMI Premium annuel",
        "price": 119.99,
        "months": 12
      }
    ],
    "note": "Prix de référence en France. Dans l’app, le prix affiché est toujours celui de l’App Store (pays, devise)."
  },
  "product_lines": [
    {
      "key": "store",
      "label": "HOMI Store",
      "kind": "physical",
      "rate": null,
      "enabled": false
    },
    {
      "key": "wear",
      "label": "HOMI Wear",
      "kind": "physical",
      "rate": null,
      "enabled": false
    },
    {
      "key": "smart",
      "label": "HOMI Smart",
      "kind": "physical",
      "rate": null,
      "enabled": false
    },
    {
      "key": "play",
      "label": "HOMI Play",
      "kind": "physical",
      "rate": null,
      "enabled": false
    },
    {
      "key": "books",
      "label": "HOMI Books",
      "kind": "physical",
      "rate": null,
      "enabled": false
    },
    {
      "key": "box",
      "label": "HOMI Box",
      "kind": "physical",
      "rate": null,
      "enabled": false
    },
    {
      "key": "mama",
      "label": "HOMI Mama",
      "kind": "physical",
      "rate": null,
      "enabled": false
    },
    {
      "key": "learn",
      "label": "HOMI Learn",
      "kind": "physical",
      "rate": null,
      "enabled": false
    },
    {
      "key": "home",
      "label": "HOMI Home",
      "kind": "physical",
      "rate": null,
      "enabled": false
    }
  ],
  "conditions_md": "Inscription gratuite. Commission sur les revenus nets éligibles des six premiers mois payants de chaque abonné apporté. Aucune commission sur les téléchargements, les essais non convertis ni les transactions remboursées. Versement mensuel à partir de 50 €. Revenus non garantis. Toute publication doit porter la mention « Publicité » ou « Collaboration commerciale »."
};
