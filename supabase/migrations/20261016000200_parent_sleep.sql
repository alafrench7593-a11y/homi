-- =====================================================================
-- « Mon sommeil » : le sommeil du parent lui-même (distinct de celui du bébé).
-- Donnée PERSONNELLE et PRIVÉE : visible uniquement par la personne qui l'a
-- saisie, jamais par les autres membres du foyer (même règle que l'humeur).
-- Aucun objectif, aucune « norme » : un carnet descriptif.
-- =====================================================================
create table public.parent_sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- Jour du réveil : la « nuit du 14 au 15 » est rangée au 15 ; les siestes sont celles de ce jour
  log_date date not null,
  bedtime timestamptz,
  wake_time timestamptz,
  -- Réveils nocturnes : un nombre, et facultativement le détail [{ "at": "03:10", "minutes": 20 }]
  night_wakings smallint not null default 0 check (night_wakings between 0 and 30),
  waking_details jsonb not null default '[]'::jsonb
    check (jsonb_typeof(waking_details) = 'array' and jsonb_array_length(waking_details) <= 30),
  -- Durée approximative de sommeil (calculée puis modifiable)
  sleep_minutes smallint check (sleep_minutes between 0 and 1440),
  duration_edited boolean not null default false,
  -- Siestes : [{ "start": "14:00", "end": "14:45" }]
  naps jsonb not null default '[]'::jsonb
    check (jsonb_typeof(naps) = 'array' and jsonb_array_length(naps) <= 12),
  quality smallint check (quality between 1 and 5),
  fatigue smallint check (fatigue between 1 and 5),
  mood smallint check (mood between 1 and 5),
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parent_sleep_logs_order check (bedtime is null or wake_time is null or (wake_time > bedtime and wake_time - bedtime <= interval '24 hours')),
  constraint parent_sleep_logs_one_per_day unique (user_id, log_date)
);
create index parent_sleep_logs_idx on public.parent_sleep_logs(user_id, log_date desc);

create trigger parent_sleep_logs_touch before update on public.parent_sleep_logs
  for each row execute function public.touch_updated_at();

-- Propriétaire uniquement : pas de politique « foyer », donc aucun coparent ni proche ne peut lire
alter table public.parent_sleep_logs enable row level security;
create policy parent_sleep_logs_owner on public.parent_sleep_logs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.parent_sleep_logs from anon;
