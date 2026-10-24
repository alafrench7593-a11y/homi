-- =====================================================================
-- « Sorties près de chez moi » sert uniquement à découvrir des lieux publics : l'application ne crée, ne publie et
-- ne gère plus aucun rendez-vous entre membres (demande du 24/10/2026).
-- Migration additive et réversible : aucune donnée supprimée. Les annonces et inscriptions déjà enregistrées restent
-- lisibles par leur autrice et incluses dans l'export RGPD ; plus aucune création, inscription ni modification.
-- Retour arrière : recréer les politiques meetups_insert, meetups_update et meetup_part_insert de
-- 20261028000100_outings_meetups.sql et supprimer le déclencheur meetups_closed.
-- =====================================================================
drop policy if exists meetups_insert on public.community_meetups;
drop policy if exists meetups_update on public.community_meetups;
drop policy if exists meetup_part_insert on public.meetup_participants;

-- Même pour un appel avec des droits élevés : plus de nouvelle rencontre ni de nouvelle inscription
create or replace function public.meetups_closed()
returns trigger language plpgsql as $$
begin
  raise exception 'Les rencontres entre membres ne sont pas proposées dans Toi & Moi.' using errcode = 'P0001';
end $$;
drop trigger if exists meetups_closed on public.community_meetups;
create trigger meetups_closed before insert on public.community_meetups for each row execute function public.meetups_closed();
drop trigger if exists meetups_closed on public.meetup_participants;
create trigger meetups_closed before insert on public.meetup_participants for each row execute function public.meetups_closed();

-- Les anciennes annonces ne sont plus montrées aux autres membres (seulement à leur autrice et à la modération)
drop policy if exists meetups_read on public.community_meetups;
create policy meetups_read on public.community_meetups for select to authenticated using (organizer_id = auth.uid() or public.has_role('moderator'));
