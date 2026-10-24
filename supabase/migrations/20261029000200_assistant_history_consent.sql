-- =====================================================================
-- Assistant IA : l'historique des conversations n'est conservé qu'avec l'accord explicite de la personne.
--  · nouveaux comptes : historique désactivé par défaut ;
--  · ai_history_consented_at : date à laquelle la personne a elle-même activé l'historique (remise à vide si elle le
--    désactive). La fonction « assistant » n'enregistre les messages que si ai_history_enabled ET cette date existent.
-- Migration additive : aucune donnée supprimée ; les conversations déjà enregistrées restent consultables et
-- supprimables. Retour arrière : alter table public.privacy_settings drop column ai_history_consented_at;
--   alter table public.privacy_settings alter column ai_history_enabled set default true; drop trigger privacy_history_consent.
-- =====================================================================
alter table public.privacy_settings add column if not exists ai_history_consented_at timestamptz;
alter table public.privacy_settings alter column ai_history_enabled set default false;

create or replace function public.privacy_history_consent()
returns trigger language plpgsql as $$
begin
  if new.ai_history_enabled is true and (tg_op = 'INSERT' or old.ai_history_enabled is distinct from true) then
    -- seule une action de la personne (connectée) compte comme un accord
    new.ai_history_consented_at := case when auth.uid() = new.user_id then now() else null end;
  elsif new.ai_history_enabled is not true then
    new.ai_history_consented_at := null;
  end if;
  return new;
end $$;
drop trigger if exists privacy_history_consent on public.privacy_settings;
create trigger privacy_history_consent before insert or update of ai_history_enabled on public.privacy_settings for each row execute function public.privacy_history_consent();
