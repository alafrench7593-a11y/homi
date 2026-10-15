-- =====================================================================
-- Minuteur biberon : un rappel par enfant, partagé dans le foyer.
--
-- L'application n'établit AUCUNE quantité ni AUCUN rythme : elle conserve
-- uniquement ce que le parent (ou son professionnel de santé) a indiqué.
--
-- * bottles : colonnes de saisie garanties (préparé, bu, quantité prévue pour
--   le prochain biberon, type de lait, note ; « enregistré par » = created_by).
-- * bottle_timers : minuteur d'un enfant (dernier biberon, délai choisi,
--   échéance ABSOLUE en timestamptz → correcte quel que soit le fuseau ou le
--   changement d'heure), quantité prévue facultative, statut.
--   Un seul minuteur ACTIF par enfant (index unique partiel) : jumeaux et
--   triplés ont chacun le leur, sans doublon.
-- * Droits : même domaine de permission que les biberons ('daily').
-- * Notifications : programmées LOCALEMENT sur chaque appareil à partir de
--   due_at (voir src/lib/notifications.ts → syncBottleTimers).
-- =====================================================================

-- ---------------------------------------------------------------- biberons
alter table public.bottles add column if not exists prepared_ml int check (prepared_ml between 0 and 500);
alter table public.bottles add column if not exists consumed_ml int check (consumed_ml between 0 and 500);
alter table public.bottles add column if not exists milk_type text check (char_length(milk_type) <= 80);
alter table public.bottles add column if not exists note text check (char_length(note) <= 1000);
alter table public.bottles add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete set null;
-- Quantité prévue pour le prochain biberon, telle que saisie par le parent (jamais calculée)
alter table public.bottles add column if not exists planned_next_ml int check (planned_next_ml between 0 and 500);
comment on column public.bottles.created_by is 'Personne qui a enregistré le biberon (« enregistré par »).';
comment on column public.bottles.planned_next_ml is 'Quantité prévue pour le prochain biberon, saisie par le parent. Jamais calculée par l''application.';

-- ---------------------------------------------------------------- minuteurs
create table public.bottle_timers (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  -- Biberon à l'origine du minuteur (facultatif : un minuteur peut être démarré à la main)
  bottle_id uuid references public.bottles(id) on delete set null,
  last_bottle_at timestamptz not null,
  -- Délai choisi par le parent (10 min à 12 h)
  interval_minutes int not null check (interval_minutes between 10 and 720),
  -- Échéance absolue du rappel (dernier biberon + délai, éventuellement reportée)
  due_at timestamptz not null,
  planned_ml int check (planned_ml between 0 and 500),
  status text not null default 'active' check (status in ('active','cancelled','done')),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bottle_timers_due_after_last check (due_at > last_bottle_at),
  constraint bottle_timers_due_bounded check (due_at <= last_bottle_at + interval '2 days')
);
comment on table public.bottle_timers is 'Minuteur biberon par enfant : délai et quantité tels que saisis par le parent ; aucune recommandation.';

-- Un seul minuteur actif par enfant
create unique index bottle_timers_one_active_per_child on public.bottle_timers(child_id) where status = 'active';
create index bottle_timers_household_idx on public.bottle_timers(household_id) where status = 'active';
create index bottle_timers_child_recent_idx on public.bottle_timers(child_id, created_at desc);

-- household_id toujours recopié depuis l'enfant : impossible de viser un foyer étranger
create trigger bottle_timers_household before insert or update of child_id on public.bottle_timers
  for each row execute function public.set_household_from_child();
create trigger bottle_timers_touch before update on public.bottle_timers
  for each row execute function public.touch_updated_at();

-- Mêmes politiques que les biberons : lecture/écriture selon le domaine 'daily'
select public._apply_household_policies('bottle_timers', 'daily');
revoke all on public.bottle_timers from anon;

-- ---------------------------------------------------------------------
-- Notifications : ce qui fonctionne aujourd'hui, et ce qu'il faudrait pour un push serveur
-- ---------------------------------------------------------------------
-- Aujourd'hui (sans serveur) : chaque appareil qui a accès au foyer (domaine 'daily') programme
-- une notification LOCALE à due_at lors de la synchronisation (ouverture de l'app, action sur un
-- minuteur). Un coparent la reçoit donc s'il a ouvert l'app depuis la création / le dernier report.
--
-- Limites des systèmes :
--  * iOS : notification locale délivrée application fermée et après redémarrage (le système la
--    conserve) ; 64 notifications en attente au maximum pour toute l'app ; en mode Concentration,
--    elle peut être retardée ou masquée ; les boutons « Reporter 15 min » / « Annuler » sont
--    exécutés sans ouvrir l'app quand iOS lance l'app en arrière-plan, sinon au prochain lancement.
--  * Android : canal « Biberons » (importance haute) ; délivrée application fermée ; après un
--    redémarrage, expo-notifications reprogramme les alarmes ; l'économiseur de batterie / « Doze »
--    peut décaler l'alarme de quelques minutes ; Android 13+ exige l'autorisation de notifications ;
--    certaines surcouches (forçage d'arrêt de l'app) suppriment les alarmes jusqu'au prochain lancement.
--
-- Push serveur vers le coparent (non activé, à prévoir si besoin) :
--  1. ajouter une colonne `push_sent_at timestamptz` à bottle_timers ;
--  2. une tâche pg_cron (chaque minute) qui, pour chaque minuteur actif dont due_at <= now()
--     et push_sent_at is null, insère dans public.notifications (category 'reminder',
--     deep_link '/bottle/<child_id>') une ligne par membre du foyer ayant 'daily' dans can_view
--     (sauf préférence contraire), puis renseigne push_sent_at ;
--  3. la fonction existante supabase/functions/send-push (Database Webhook sur INSERT
--     public.notifications, secret PUSH_WEBHOOK_SECRET, EXPO_ACCESS_TOKEN facultatif) envoie le
--     push Expo aux jetons de push_devices — les jetons sont enregistrés par registerPushToken()
--     avec l'identifiant de projet EAS fourni par la configuration (EXPO_PUBLIC_EAS_PROJECT_ID) ;
--  4. pour éviter un doublon avec la notification locale, l'app peut ne pas programmer de locale
--     sur les appareils couverts par le push, ou ignorer le push si la locale a déjà été affichée.
