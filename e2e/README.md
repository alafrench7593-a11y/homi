# Parcours navigateur (Playwright)

Ils tournent sur la version web, contre un **faux Supabase** (`fake_supabase.py`) qui reproduit l'authentification (PKCE, confirmation, mot de passe oublié, renvoi d'e-mail), le déclencheur d'inscription, PostgREST et les RPC utiles. Aucun réseau n'est nécessaire.

```bash
# 1. Version web pointant vers le faux serveur
EXPO_PUBLIC_SUPABASE_URL=http://sb.fake.test EXPO_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
  npx expo export --platform web --output-dir /tmp/dist-e2e
# 2. Serveur web (renvoie index.html pour toutes les routes)
python3 e2e/spa_server.py /tmp/dist-e2e 8811 &
# 3. Parcours de l'étape 1 : inscription, confirmation, lien expiré, reprise de l'onboarding,
#    connexion, mot de passe oublié, invitation d'un coparent sans compte, démo sans compte
python3 e2e/etape1_auth.py
```

Le script affiche un rapport JSON : chaque clé doit valoir `true` et `erreurs` doit être vide. Les captures sont enregistrées dans `$E2E_SHOTS` (par défaut `/tmp/toietmoi-e2e`).
