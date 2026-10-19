-- =====================================================================
-- Cycle : informations FACULTATIVES pour des conseils adaptés (aucune nouvelle table pour les mêmes données).
--  - Rapports (intercourse_logs, déjà réservés à leur propriétaire) : protection, incidents, contraception,
--    contraception d'urgence, souhait de grossesse, consultation. Chaque réponse est facultative ;
--    « je ne sais pas » et « je préfère ne pas répondre » sont des réponses distinctes d'une absence de réponse.
--  - Douleurs : dans la fiche du jour (symptom_logs) — intensité 0–10, zones, durée, début, évolution, retentissement,
--    signes associés, soulagement, médicaments (simple suivi).
--  - Pertes : nouvelles valeurs (quantité habituelle, présence de sang, texture incertaine, douleur pelvienne, fièvre,
--    saignement inhabituel).
--  - Préférences : conseils personnalisés activables/désactivables ; notifications neutres par défaut.
-- Toutes les colonnes ajoutées sont facultatives (NULL ou valeur par défaut) : les données existantes restent valides.
--
-- Retour arrière (si nécessaire) :
--   alter table public.intercourse_logs drop column occurred_time, drop column kind, drop column condom, drop column condom_incident,
--     drop column usual_contraception, drop column contraception_type, drop column contraception_incident, drop column ejaculation,
--     drop column ec_taken, drop column pregnancy_wish, drop column professional_seen, drop column updated_at;
--   alter table public.symptom_logs drop column pain_intensity, drop column pain_locations, drop column pain_duration, drop column pain_onset,
--     drop column pain_pattern, drop column pain_impact, drop column pain_associated, drop column pain_pregnancy, drop column pain_relief,
--     drop column pain_meds;
--   alter table public.cycle_preferences drop column advice_enabled, drop column detailed_notifications;
--   (puis rétablir les anciennes listes de valeurs des pertes, après avoir converti les nouvelles valeurs éventuelles.)
-- =====================================================================

-- 1. Rapports : réponses facultatives
alter table public.intercourse_logs
  add column if not exists occurred_time time,
  add column if not exists kind text check (kind in ('vaginal','other','prefer_not')),
  add column if not exists condom text check (condom in ('yes','no','unsure','prefer_not')),
  add column if not exists condom_incident text check (condom_incident in ('none','broke','slipped','other','unsure')),
  add column if not exists usual_contraception text check (usual_contraception in ('yes','no','unsure','prefer_not')),
  add column if not exists contraception_type text check (contraception_type in ('pill','iud_copper','iud_hormonal','implant','patch','ring','injection','other')),
  add column if not exists contraception_incident text check (contraception_incident in ('none','missed','late','misuse','other','unsure')),
  add column if not exists ejaculation text check (ejaculation in ('yes','no','unsure','prefer_not')),
  add column if not exists ec_taken text check (ec_taken in ('yes','no','unsure')),
  add column if not exists pregnancy_wish text check (pregnancy_wish in ('yes','no','unsure','prefer_not')),
  add column if not exists professional_seen text check (professional_seen in ('yes','no')),
  add column if not exists updated_at timestamptz not null default now();
alter table public.intercourse_logs drop constraint if exists intercourse_logs_note_check;
alter table public.intercourse_logs add constraint intercourse_logs_note_check check (char_length(note) <= 1000);
-- Un incident de préservatif n'a de sens que si un préservatif a été utilisé (ou si c'est incertain)
alter table public.intercourse_logs add constraint intercourse_logs_condom_incident_coherent
  check (condom_incident is null or condom in ('yes','unsure'));

-- 2. Douleurs, dans la fiche du jour
alter table public.symptom_logs
  add column if not exists pain_intensity smallint check (pain_intensity between 0 and 10),
  add column if not exists pain_locations text[] not null default '{}'
    check (pain_locations <@ array['lower_abdomen','lower_left','lower_right','upper_abdomen','lower_back','thighs','chest','head','other']::text[]),
  add column if not exists pain_duration text check (pain_duration in ('lt_hour','hours','day','days')),
  add column if not exists pain_onset text check (pain_onset in ('before_period','during_period','outside_period','unsure')),
  add column if not exists pain_pattern text check (pain_pattern in ('usual','new','worse','unsure')),
  add column if not exists pain_impact text[] not null default '{}'
    check (pain_impact <@ array['none','sleep','work','studies','daily','stopped']::text[]),
  add column if not exists pain_associated text[] not null default '{}'
    check (pain_associated <@ array['nausea','vomiting','faint','fever','unusual_bleeding','outside_period','painful_sex']::text[]),
  add column if not exists pain_pregnancy text check (pain_pregnancy in ('no','known','possible','unknown')),
  add column if not exists pain_relief text check (pain_relief in ('helped','not_helped','none')),
  add column if not exists pain_meds text check (char_length(pain_meds) <= 200);
alter table public.symptom_logs add constraint symptom_logs_pain_impact_none check (not ('none' = any(pain_impact)) or cardinality(pain_impact) = 1);

-- 3. Pertes : listes de valeurs élargies (les anciennes valeurs restent valides)
alter table public.discharge_logs drop constraint if exists discharge_logs_amount_check;
alter table public.discharge_logs add constraint discharge_logs_amount_check
  check (amount in ('very_low','low','usual','moderate','heavy','very_heavy','unsure'));
alter table public.discharge_logs drop constraint if exists discharge_logs_color_check;
alter table public.discharge_logs add constraint discharge_logs_color_check
  check (color in ('clear','white','creamy_white','milky','pink','brown','blood','yellowish','greenish','greyish','other','unsure'));
alter table public.discharge_logs drop constraint if exists discharge_logs_textures_check;
alter table public.discharge_logs add constraint discharge_logs_textures_check
  check (textures <@ array['fluid','watery','creamy','sticky','elastic','stringy','slippery','thick','lumpy','other','unsure']::text[]);
alter table public.discharge_logs drop constraint if exists discharge_logs_symptoms_check;
alter table public.discharge_logs add constraint discharge_logs_symptoms_check
  check (symptoms <@ array['none','itching','irritation','burning','pain','pelvic_pain','urinary','painful_sex','dryness','fever','bleeding','other']::text[]);

-- 4. Préférences
alter table public.cycle_preferences
  add column if not exists advice_enabled boolean not null default true,
  add column if not exists detailed_notifications boolean not null default false;

-- Horodatage des modifications des rapports
drop trigger if exists intercourse_logs_touch on public.intercourse_logs;
create trigger intercourse_logs_touch before update on public.intercourse_logs for each row execute function public.touch_updated_at();
