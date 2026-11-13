-- =====================================================================
-- Premium Famille (migration 20261113000300) : droits du titulaire et d'UN partenaire, fin du partage du Premium Individuel,
-- retrait du partenaire, expiration, écriture réservée au serveur, renoncement à ses propres droits,
-- et confidentialité des données intimes de la maman vis-à-vis du co-parent (RLS).
-- =====================================================================
\set FT '95000000-0000-4000-8000-000000000001'
\set FP '95000000-0000-4000-8000-000000000002'
\set F3 '95000000-0000-4000-8000-000000000003'
\set FC '95000000-0000-4000-8000-000000000004'
\set FX '95000000-0000-4000-8000-000000000005'
\set FO '95000000-0000-4000-8000-000000000006'
\set FH '95000000-0000-4000-8000-0000000000a1'
\set FH2 '95000000-0000-4000-8000-0000000000a2'
reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values
  (:'FT', 'fam-titulaire@exemple.test'), (:'FP', 'fam-partenaire@exemple.test'), (:'F3', 'fam-troisieme@exemple.test'),
  (:'FC', 'fam-nounou@exemple.test'), (:'FX', 'fam-ailleurs@exemple.test'), (:'FO', 'fam-proprio2@exemple.test');

-- Foyer : FT propriétaire (titulaire), FP co-parent (arrivé le premier), F3 co-parent (3e adulte), FC accompagnant
insert into public.households (id, name, created_by) values (:'FH', 'Foyer Famille', :'FT'), (:'FH2', 'Foyer Famille 2', :'FO');
insert into public.household_members (household_id, user_id, role, joined_at) values (:'FH', :'FT', 'owner', '2026-01-01')
  on conflict (household_id, user_id) do update set role = 'owner', joined_at = excluded.joined_at;
insert into public.household_members (household_id, user_id, role, joined_at) values
  (:'FH', :'FP', 'coparent', '2026-02-01'), (:'FH', :'F3', 'coparent', '2026-03-01'), (:'FH', :'FC', 'caregiver', '2026-01-10');

-- Formule Famille active
insert into public.subscriptions (user_id, entitlement, status, product_id, store, period_type, expires_at, will_renew)
values (:'FT', 'AU_FIL_DE_NOUS_FAMILLE', 'active', 'aufildenous_family_monthly', 'app_store', 'monthly', now() + interval '30 days', true);

select tests.ok(public._is_family_plan('AU_FIL_DE_NOUS_FAMILLE', null), 'famille : reconnue par le droit RevenueCat');
select tests.ok(public._is_family_plan('AU_FIL_DE_NOUS_PREMIUM', 'aufildenous_family_monthly'), 'famille : reconnue par le produit (droit Premium attaché au produit Famille)');
select tests.ok(public._is_family_plan(null, 'aufildenous_family_monthly:mensuel'), 'famille : produit Google Play « abonnement:offre-de-base » reconnu');
select tests.ok(not public._is_family_plan('AU_FIL_DE_NOUS_PREMIUM', 'aufildenous_premium_monthly'), 'famille : le Premium Individuel n''est pas une formule Famille');
select tests.ok(not public._is_family_plan(null, 'aufildenousXfamily'), 'famille : le « _ » du préfixe est littéral (pas un joker)');

select tests.ok(public._premium_of(:'FT'), 'famille : le titulaire a Premium');
select tests.ok(public._premium_of(:'FP'), 'famille : le partenaire (co-parent arrivé le premier) a Premium');
select tests.ok(not public._premium_of(:'F3'), 'famille : un 3e adulte du foyer n''a pas Premium');
select tests.ok(not public._premium_of(:'FC'), 'famille : un accompagnant (nounou, grand-parent) n''a pas Premium');
select tests.ok(not public._premium_of(:'FX'), 'famille : une personne hors du foyer n''a pas Premium');
select tests.ok((select count(*) from (values (:'FP'::uuid), (:'F3'::uuid), (:'FC'::uuid), (:'FX'::uuid)) v(u) where public._premium_of(v.u)) = 1,
  'famille : exactement UN compte bénéficiaire en plus du titulaire');

-- Vu de l'application (pour soi seulement)
set role authenticated; set request.jwt.claim.sub = :'FT';
select tests.ok(public.my_premium_share()->>'plan' = 'family', 'mon abonnement : formule Famille indiquée au titulaire');
select tests.ok((public.my_premium_share()->'shared_with'->>'user_id')::uuid = :'FP'::uuid, 'mon abonnement : le titulaire voit avec qui il partage');
select tests.ok(public.my_premium_share()->'family_candidate' = 'null'::jsonb, 'mon abonnement : pas de proposition Famille quand le partage est actif');
reset role;
set role authenticated; set request.jwt.claim.sub = :'FP';
select tests.ok(public.has_premium(), 'famille : has_premium vrai pour le partenaire');
select tests.ok((public.my_premium_share()->'shared_by'->>'plan') = 'family' and (public.my_premium_share()->'shared_by'->>'user_id')::uuid = :'FT'::uuid,
  'famille : le partenaire voit qui lui partage Premium Famille');
reset role;
set role authenticated; set request.jwt.claim.sub = :'F3';
select tests.ok(not public.has_premium() and public.my_premium_share()->'shared_by' = 'null'::jsonb, 'famille : le 3e adulte ne reçoit rien');
reset role; set request.jwt.claim.sub = '';

-- ---------------------------------------------------------------- Écriture réservée au serveur
set role authenticated; set request.jwt.claim.sub = :'FP';
select tests.throws(format($$insert into public.subscriptions (user_id, entitlement, status, product_id, expires_at) values (%L, 'AU_FIL_DE_NOUS_FAMILLE', 'active', 'aufildenous_family_monthly', now() + interval '1 year')$$, :'FP'),
  'famille : un partenaire ne peut pas s''inscrire lui-même une formule Famille');
reset role;
set role authenticated; set request.jwt.claim.sub = :'FT';
select tests.throws(format($$update public.subscriptions set expires_at = now() + interval '10 years' where user_id = %L$$, :'FT'), 'famille : le titulaire ne peut pas prolonger son abonnement');
select tests.throws($$select public._is_family_plan('AU_FIL_DE_NOUS_FAMILLE', null)$$, 'famille : fonction interne _is_family_plan non appelable');
reset role; set request.jwt.claim.sub = '';

-- ---------------------------------------------------------------- Partenaire retiré, changement de partenaire, départ
delete from public.household_members where household_id = :'FH' and user_id = :'FP';
select tests.ok(not public._premium_of(:'FP'), 'famille : partenaire retiré du foyer → plus de Premium, immédiatement');
select tests.ok(public._premium_of(:'F3') and public._premium_partner_of(:'FT') = :'F3', 'famille : changement de partenaire (le co-parent suivant devient bénéficiaire)');
-- Le nouveau partenaire quitte lui-même le foyer
set role authenticated; set request.jwt.claim.sub = :'F3';
delete from public.household_members where household_id = :'FH' and user_id = :'F3';
reset role; set request.jwt.claim.sub = '';
select tests.ok(not public._premium_of(:'F3'), 'famille : partenaire qui quitte le foyer → plus de Premium');
select tests.ok(public._premium_partner_of(:'FT') is null and public._premium_of(:'FT'), 'famille : sans partenaire, le titulaire garde son Premium');
select tests.ok(not public._premium_of(:'FC'), 'famille : sans co-parent, l''accompagnant ne devient jamais bénéficiaire');
-- Aucune donnée supprimée : l'abonnement est intact
select tests.ok((select status = 'active' and product_id = 'aufildenous_family_monthly' from public.subscriptions where user_id = :'FT'), 'famille : départs sans effet sur la ligne d''abonnement');
insert into public.household_members (household_id, user_id, role, joined_at) values (:'FH', :'FP', 'coparent', '2026-02-01'), (:'FH', :'F3', 'coparent', '2026-03-01');
select tests.ok(public._premium_of(:'FP') and not public._premium_of(:'F3'), 'famille : retour du partenaire → Premium rendu (premier arrivé)');

-- ---------------------------------------------------------------- Expiration, résiliation, remboursement, pause
update public.subscriptions set status = 'cancelled', will_renew = false where user_id = :'FT';
select tests.ok(public._premium_of(:'FT') and public._premium_of(:'FP'), 'famille : résiliée (renouvellement coupé) → Premium pour les deux jusqu''à l''échéance');
update public.subscriptions set status = 'expired', expires_at = now() - interval '1 day' where user_id = :'FT';
select tests.ok(not public._premium_of(:'FT') and not public._premium_of(:'FP'), 'famille : abonnement expiré → personne n''a Premium');
update public.subscriptions set status = 'refunded', refunded_at = now(), expires_at = now() + interval '20 days' where user_id = :'FT';
select tests.ok(not public._premium_of(:'FT') and not public._premium_of(:'FP'), 'famille : remboursé → personne n''a Premium, même avant l''échéance');
update public.subscriptions set status = 'grace', refunded_at = null, expires_at = now() + interval '5 days' where user_id = :'FT';
select tests.ok(public._premium_of(:'FT') and public._premium_of(:'FP'), 'famille : période de grâce → Premium maintenu pour les deux');
update public.subscriptions set status = 'active', expires_at = null where user_id = :'FT';
select tests.ok(not public._premium_of(:'FP'), 'famille : échéance inconnue → pas de Premium sans fin');
update public.subscriptions set status = 'active', expires_at = now() + interval '30 days' where user_id = :'FT';

-- ---------------------------------------------------------------- Changement de formule ; Premium Individuel jamais partagé
update public.subscriptions set entitlement = 'AU_FIL_DE_NOUS_PREMIUM', product_id = 'aufildenous_premium_monthly' where user_id = :'FT';
select tests.ok(public._premium_of(:'FT'), 'formule Individuelle : le titulaire garde Premium');
select tests.ok(not public._premium_of(:'FP'), 'Premium Individuel actif : le partenaire n''a PAS Premium (plus aucun partage)');
select tests.ok(not public._premium_of(:'F3') and not public._premium_of(:'FC'), 'Premium Individuel actif : ni 3e adulte ni accompagnant');
set role authenticated; set request.jwt.claim.sub = :'FT';
select tests.ok(public.my_premium_share()->>'plan' = 'individual' and public.my_premium_share()->'shared_with' = 'null'::jsonb, 'mon abonnement : Individuel non partagé');
select tests.ok((public.my_premium_share()->'family_candidate'->>'user_id')::uuid = :'FP'::uuid and public.my_premium_share()->'family_candidate'->>'role' = 'coparent',
  'mon abonnement : partenaire qui profiterait de Premium Famille (rôle seulement)');
reset role; set request.jwt.claim.sub = '';
update public.subscriptions set period_type = 'annual', expires_at = now() + interval '300 days' where user_id = :'FT';
select tests.ok(not public._premium_of(:'FP'), 'Premium Individuel 12 mois actif : le partenaire n''a pas Premium non plus');
update public.subscriptions set period_type = 'monthly', expires_at = now() + interval '30 days' where user_id = :'FT';
select tests.ok(not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'premium_policy' and column_name = 'individual_shares_partner'),
  'aucun interrupteur de partage du Premium Individuel (partage retiré, pas désactivable)');
update public.subscriptions set product_id = 'aufildenous_family_monthly' where user_id = :'FT';
select tests.ok(public._premium_of(:'FP'), 'passage à Famille (produit Famille, droit Premium) : partenaire rétabli immédiatement');
update public.subscriptions set product_id = 'aufildenous_family_monthly:mensuel', entitlement = 'AU_FIL_DE_NOUS_FAMILLE', store = 'play_store' where user_id = :'FT';
select tests.ok(public._premium_of(:'FP'), 'Famille sur Google Play (« abonnement:offre-de-base ») : partenaire Premium');

-- Titulaire Famille co-parent : la propriétaire du foyer en profite
insert into public.household_members (household_id, user_id, role, joined_at) values (:'FH2', :'FO', 'owner', '2026-01-01')
  on conflict (household_id, user_id) do update set role = 'owner', joined_at = excluded.joined_at;
insert into public.household_members (household_id, user_id, role, joined_at) values (:'FH2', :'FX', 'coparent', '2026-02-01');
insert into public.subscriptions (user_id, entitlement, status, product_id, store, period_type, expires_at, will_renew)
values (:'FX', 'AU_FIL_DE_NOUS_FAMILLE', 'trial', 'aufildenous_family_monthly', 'app_store', 'monthly', now() + interval '3 days', true);
select tests.ok(public._premium_of(:'FO'), 'famille : un co-parent titulaire partage avec la propriétaire de son foyer (essai compris)');

-- ---------------------------------------------------------------- Retirer soi-même ses propres autorisations
update public.household_members set can_view = array['daily','health','documents','pregnancy','lists','names','profile'], can_edit = array['daily','lists']
 where household_id = :'FH' and user_id = :'FP';
set role authenticated; set request.jwt.claim.sub = :'FP';
select public.renounce_household_access(:'FH', array['health','lists']);
select tests.ok((select not ('health' = any(can_view)) and not ('lists' = any(can_view)) and not ('lists' = any(can_edit)) and 'daily' = any(can_edit)
  from public.household_members where household_id = :'FH' and user_id = :'FP'), 'renoncer : le partenaire retire lui-même des domaines (voir et modifier)');
select tests.throws(format($$select public.renounce_household_access(%L, array['tout'])$$, :'FH'), 'renoncer : domaine inconnu refusé');
-- Ajouter des droits à soi-même : refusé (la règle d'accès ne laisse rien modifier au membre)
update public.household_members set can_view = array['daily','health','documents','pregnancy','lists','names','profile'] where household_id = :'FH' and user_id = :'FP';
reset role; set request.jwt.claim.sub = '';
select tests.ok((select not ('health' = any(can_view)) from public.household_members where household_id = :'FH' and user_id = :'FP'), 'renoncer : un membre ne peut pas se rendre des droits lui-même');
set role authenticated; set request.jwt.claim.sub = :'FT';
select tests.throws(format($$select public.renounce_household_access(%L, array['daily'])$$, :'FH'), 'renoncer : réservé aux membres invités (pas le propriétaire)');
reset role;
set role anon; set request.jwt.claim.sub = '';
select tests.throws(format($$select public.renounce_household_access(%L, array['daily'])$$, :'FH'), 'renoncer : refusé sans compte');
reset role; set request.jwt.claim.sub = '';

-- ---------------------------------------------------------------- Partage par domaine : la maman choisit
insert into public.family_tasks (household_id, title) values (:'FH', 'Préparer le sac de maternité');
set role authenticated; set request.jwt.claim.sub = :'FP';
select tests.ok(tests.count($$select 1 from public.family_tasks where title = 'Préparer le sac de maternité'$$) = 0, 'partage : sans le domaine « listes », le partenaire ne voit pas les tâches');
reset role; set request.jwt.claim.sub = '';
-- La propriétaire rend l'accès (seule elle peut l'accorder)
set role authenticated; set request.jwt.claim.sub = :'FT';
update public.household_members set can_view = array_append(can_view, 'lists') where household_id = :'FH' and user_id = :'FP';
reset role;
set role authenticated; set request.jwt.claim.sub = :'FP';
select tests.ok(tests.count($$select 1 from public.family_tasks where title = 'Préparer le sac de maternité'$$) = 1, 'partage : domaine « listes » accordé par la maman → tâches visibles');
reset role;
set role authenticated; set request.jwt.claim.sub = :'FT';
update public.household_members set can_view = array_remove(can_view, 'lists'), can_edit = array_remove(can_edit, 'lists') where household_id = :'FH' and user_id = :'FP';
reset role;
set role authenticated; set request.jwt.claim.sub = :'FP';
select tests.ok(tests.count($$select 1 from public.family_tasks where title = 'Préparer le sac de maternité'$$) = 0, 'partage : retrait par la maman → plus visible immédiatement');
reset role; set request.jwt.claim.sub = '';

-- ---------------------------------------------------------------- Données intimes de la maman : jamais visibles par le co-parent
-- Partenaire Premium Famille, TOUS les domaines du foyer en lecture : il ne lit pourtant rien de ce qui suit.
update public.household_members set can_view = array['daily','health','documents','pregnancy','lists','names','profile'], can_edit = array['daily','health','documents','pregnancy','lists','names','profile']
 where household_id = :'FH' and user_id = :'FP';
insert into public.mood_checkins (user_id, mood, journal) values (:'FT', 2, 'Page de journal intime');
insert into public.period_entries (user_id, start_date) values (:'FT', current_date - 3);
insert into public.symptom_logs (user_id, logged_on) values (:'FT', current_date);
insert into public.ovulation_tests (user_id, tested_at, result) values (:'FT', now(), 'positive');
insert into public.contraception_methods (user_id, method) values (:'FT', 'pill');
insert into public.cycle_journal (user_id, entry_on, body) values (:'FT', current_date, 'Note de cycle');
insert into public.postpartum_checkins (user_id, checkin_date) values (:'FT', current_date);
insert into public.my_treatments (user_id, name, dose_text, times, start_date) values (:'FT', 'Traitement privé', '1 comprimé', array['08:00'], current_date);
insert into public.consultation_questions (user_id, household_id, journey, question, shared) values (:'FT', :'FH', 'pregnancy', 'Question privée pour la sage-femme', false);
set role authenticated; set request.jwt.claim.sub = :'FP';
select tests.ok(public.has_premium(), 'confidentialité : le partenaire testé a bien Premium Famille');
select tests.ok(tests.count(format('select 1 from public.mood_checkins where user_id = %L', :'FT')) = 0, 'confidentialité : journal intime / humeur (mood_checkins) invisible du co-parent');
select tests.ok(tests.count(format('select 1 from public.period_entries where user_id = %L', :'FT')) = 0, 'confidentialité : règles (period_entries) invisibles du co-parent');
select tests.ok(tests.count(format('select 1 from public.symptom_logs where user_id = %L', :'FT')) = 0, 'confidentialité : symptômes (symptom_logs) invisibles du co-parent');
select tests.ok(tests.count(format('select 1 from public.ovulation_tests where user_id = %L', :'FT')) = 0, 'confidentialité : tests d''ovulation invisibles du co-parent');
select tests.ok(tests.count(format('select 1 from public.contraception_methods where user_id = %L', :'FT')) = 0, 'confidentialité : contraception invisible du co-parent');
select tests.ok(tests.count(format('select 1 from public.cycle_journal where user_id = %L', :'FT')) = 0, 'confidentialité : notes de cycle invisibles du co-parent');
select tests.ok(tests.count(format('select 1 from public.postpartum_checkins where user_id = %L', :'FT')) = 0, 'confidentialité : bilans post-partum (santé mentale) invisibles du co-parent');
select tests.ok(tests.count(format('select 1 from public.my_treatments where user_id = %L', :'FT')) = 0, 'confidentialité : traitements personnels invisibles du co-parent');
select tests.ok(tests.count(format('select 1 from public.consultation_questions where user_id = %L', :'FT')) = 0, 'confidentialité : questions médicales privées invisibles du co-parent');
select tests.ok(not exists (select 1 from public.cycle_shared_with_me() where owner_id = :'FT'), 'confidentialité : aucun cycle partagé sans partage explicite');
select tests.throws(format('select public.partner_cycle(%L)', :'FT'), 'confidentialité : partner_cycle refusé sans partage explicite');
-- Modification ou suppression à distance : rien n'est touché
update public.mood_checkins set journal = 'modifié' where user_id = :'FT';
delete from public.period_entries where user_id = :'FT';
reset role; set request.jwt.claim.sub = '';
select tests.ok((select journal from public.mood_checkins where user_id = :'FT' limit 1) = 'Page de journal intime'
  and exists (select 1 from public.period_entries where user_id = :'FT'), 'confidentialité : le co-parent ne peut ni modifier ni supprimer ces données');

-- Vérification structurelle : aucune politique de LECTURE des tables intimes n'ouvre l'accès par le foyer
select tests.ok(not exists (
  select 1 from pg_policies p
  where p.schemaname = 'public' and p.permissive = 'PERMISSIVE' and p.cmd in ('SELECT','ALL')
    and p.tablename = any (array['mood_checkins','period_entries','symptom_logs','bleeding_logs','discharge_logs','ovulation_tests','pregnancy_tests',
      'fertility_observations','intercourse_logs','cycle_journal','cycle_custom_items','contraception_methods','contraception_logs',
      'postpartum_checkins','postpartum_actions','exhaustion_checkins','parent_sleep_logs','my_treatments','my_treatment_logs',
      'pregnancy_symptom_logs','maternal_weights','daily_checks'])
    and coalesce(p.qual, '') !~ '^\(?\(?user_id = auth\.uid\(\)\)?\)?$'
), 'confidentialité : 22 tables intimes en lecture « autrice seulement » (aucune ouverture au foyer)');
select tests.ok((select bool_and(c.relrowsecurity) from pg_class c where c.relnamespace = 'public'::regnamespace and c.relname = any (array['mood_checkins','period_entries','symptom_logs','contraception_methods','postpartum_checkins','my_treatments'])),
  'confidentialité : RLS activée sur les tables intimes');

-- Nettoyage
delete from public.subscriptions where user_id in (:'FT', :'FX');
