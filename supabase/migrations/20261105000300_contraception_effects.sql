-- =====================================================================
-- Journal de ma contraception (04/11/2026, script 13 « Elle ne me convient plus »)
--  * Nouveau type d'entrée « effect » dans contraception_logs : un effet ressenti (humeur, saignements, douleurs…),
--    daté, avec une note, à montrer au gynécologue. Plusieurs effets possibles le même jour (hors index unique,
--    comme « treatment »).
--  * Additif et réversible : retour arrière = remettre la contrainte sans 'effect' après avoir supprimé ces lignes
--    (delete from public.contraception_logs where kind = 'effect').
-- =====================================================================
alter table public.contraception_logs drop constraint if exists contraception_logs_kind_check;
alter table public.contraception_logs add constraint contraception_logs_kind_check
  check (kind in ('pill_taken','pill_missed','patch_changed','ring_inserted','ring_removed','condom','device_declared','emergency_taken','treatment','effect'));
drop index if exists public.contraception_logs_daily_key;
create unique index if not exists contraception_logs_daily_key on public.contraception_logs(user_id, logged_on, kind) where kind not in ('treatment','effect');
