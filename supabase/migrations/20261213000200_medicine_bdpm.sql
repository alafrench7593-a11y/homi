-- =====================================================================
-- Boîte de médicaments (Aura Vision, lot 3 — 24/11/2026) : identification par la Base de données publique des
-- médicaments (BDPM, ANSM / HAS / Assurance maladie, licence ouverte). AUCUNE IA, AUCUNE posologie : la fiche donne
-- le nom officiel, la forme, la présentation, le titulaire, l'état de commercialisation et le lien vers la notice
-- officielle. Données importées par scripts/bdpm-import.mjs (fichiers CIS_bdpm.txt et CIS_CIP_bdpm.txt).
-- =====================================================================

create table if not exists public.medicine_presentations (
  cip13 text primary key check (cip13 ~ '^[0-9]{13}$'),
  cip7 text check (cip7 ~ '^[0-9]{7}$'),
  cis text not null check (cis ~ '^[0-9]{8}$'),
  name text not null check (char_length(name) between 1 and 400),
  form text,
  routes text,
  presentation text,
  holder text,
  marketed boolean not null default true,
  reinforced_monitoring boolean not null default false,
  imported_at timestamptz not null default now()
);
create index if not exists medicine_presentations_cis on public.medicine_presentations (cis);
create index if not exists medicine_presentations_cip7 on public.medicine_presentations (cip7);
create index if not exists medicine_presentations_name on public.medicine_presentations (lower(name) text_pattern_ops);
alter table public.medicine_presentations enable row level security;
revoke all on public.medicine_presentations from anon, authenticated;
-- Lecture par les seules fonctions ci-dessous (données publiques, mais pas d'aspiration de la table entière).

create or replace function public._medicine_json(m public.medicine_presentations)
returns jsonb language sql immutable as $$
  select jsonb_build_object('cip13', m.cip13, 'cis', m.cis, 'name', m.name, 'form', m.form, 'routes', m.routes,
    'presentation', m.presentation, 'holder', m.holder, 'marketed', m.marketed,
    'reinforced_monitoring', m.reinforced_monitoring,
    'notice_url', 'https://base-donnees-publique.medicaments.gouv.fr/medicament/' || m.cis || '/extrait',
    'source', 'BDPM', 'imported_at', m.imported_at);
$$;

/** Code lu sur la boîte : EAN-13 « 3400… », GTIN-14 du Data Matrix « 03400… », ou CIP7. */
create or replace function public.medicine_lookup(p_code text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare c text := regexp_replace(coalesce(p_code, ''), '[^0-9]', '', 'g'); m public.medicine_presentations;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if length(c) = 14 and left(c, 1) = '0' then c := substr(c, 2); end if;
  if length(c) = 13 then select * into m from public.medicine_presentations where cip13 = c;
  elsif length(c) = 7 then select * into m from public.medicine_presentations where cip7 = c limit 1;
  else return null; end if;
  if m.cip13 is null then return null; end if;
  return public._medicine_json(m);
end $$;

/** Recherche par nom (début du nom, 3 lettres minimum, 10 résultats, une ligne par médicament). */
create or replace function public.medicine_search(p_query text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare q text := lower(btrim(coalesce(p_query, '')));
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if char_length(q) < 3 or char_length(q) > 80 then return '[]'::jsonb; end if;
  q := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_');
  return coalesce((select jsonb_agg(public._medicine_json(y) order by y.marketed desc, y.name)
    from (select * from (select distinct on (cis) * from public.medicine_presentations
                         where lower(name) like q || '%' order by cis, marketed desc, cip13) x
          order by x.marketed desc, x.name limit 10) y), '[]'::jsonb);
end $$;

revoke all on function public.medicine_lookup(text) from public, anon;
revoke all on function public.medicine_search(text) from public, anon;
grant execute on function public.medicine_lookup(text) to authenticated;
grant execute on function public.medicine_search(text) to authenticated;
