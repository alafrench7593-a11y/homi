-- =====================================================================
-- 08/11/2026 : contenus partagés en espagnol, allemand et italien.
-- ADDITIF : colonnes facultatives (articles, thèmes, espaces de la communauté) + interrupteur de publication par langue.
--  - Articles : les traductions (à relire par une personne compétente) sont versées par des migrations générées
--    (scripts/gen-articles-i18n.ts). Elles ne s'affichent que lorsque la langue est PUBLIÉE (content_locales) :
--    décision de la fondatrice du 08/11/2026 — d'ici là l'appli montre la version anglaise.
--  - Thèmes et espaces : textes courts traduits ici (visibles tout de suite, ce ne sont pas des contenus médicaux).
-- Le texte français (et anglais) n'est jamais modifié.
-- Retour arrière (après accord) :
--   alter table public.articles drop column if exists title_es, drop column if exists summary_es, drop column if exists body_md_es,
--     drop column if exists title_de, drop column if exists summary_de, drop column if exists body_md_de,
--     drop column if exists title_it, drop column if exists summary_it, drop column if exists body_md_it;
--   alter table public.content_categories drop column if exists label_es, drop column if exists label_de, drop column if exists label_it;
--   alter table public.forums drop column if exists title_es, drop column if exists description_es, drop column if exists title_de,
--     drop column if exists description_de, drop column if exists title_it, drop column if exists description_it;
--   drop function if exists public.es_ready(public.articles); drop function if exists public.de_ready(public.articles);
--   drop function if exists public.it_ready(public.articles); drop table if exists public.content_locales;
-- =====================================================================
alter table public.articles add column if not exists title_es text, add column if not exists summary_es text, add column if not exists body_md_es text,
  add column if not exists title_de text, add column if not exists summary_de text, add column if not exists body_md_de text,
  add column if not exists title_it text, add column if not exists summary_it text, add column if not exists body_md_it text;
alter table public.content_categories add column if not exists label_es text, add column if not exists label_de text, add column if not exists label_it text;
alter table public.forums add column if not exists title_es text, add column if not exists description_es text,
  add column if not exists title_de text, add column if not exists description_de text,
  add column if not exists title_it text, add column if not exists description_it text;

-- Champs calculés pour les listes (même règle que english_ready)
create or replace function public.es_ready(a public.articles) returns boolean language sql stable set search_path = public as $$
  select coalesce(a.title_es, '') <> '' and coalesce(a.body_md_es, '') <> ''; $$;
create or replace function public.de_ready(a public.articles) returns boolean language sql stable set search_path = public as $$
  select coalesce(a.title_de, '') <> '' and coalesce(a.body_md_de, '') <> ''; $$;
create or replace function public.it_ready(a public.articles) returns boolean language sql stable set search_path = public as $$
  select coalesce(a.title_it, '') <> '' and coalesce(a.body_md_it, '') <> ''; $$;
grant execute on function public.es_ready(public.articles), public.de_ready(public.articles), public.it_ready(public.articles) to anon, authenticated;

-- Publication des articles traduits, langue par langue, après relecture humaine (administration seulement)
create table if not exists public.content_locales (
  locale text primary key check (locale in ('es', 'de', 'it')),
  articles_published boolean not null default false,
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create index if not exists content_locales_published_by_idx on public.content_locales(published_by);
alter table public.content_locales enable row level security;
create policy content_locales_read on public.content_locales for select to anon, authenticated using (true);
create policy content_locales_admin on public.content_locales for update to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));
revoke insert, delete, truncate on public.content_locales from anon, authenticated;
insert into public.content_locales (locale) values ('es'), ('de'), ('it') on conflict do nothing;

-- Thèmes de la bibliothèque
update public.content_categories c set label_es = v.es, label_de = v.de, label_it = v.it
from (values
  ('grossesse', 'Embarazo', 'Schwangerschaft', 'Gravidanza'),
  ('accouchement', 'Parto', 'Geburt', 'Parto'),
  ('post-partum', 'Después del parto', 'Nach der Geburt', 'Dopo il parto'),
  ('sante-mentale', 'Emociones y salud mental', 'Gefühle & psychische Gesundheit', 'Emozioni e salute mentale'),
  ('bebe', 'El día a día con el bebé', 'Alltag mit Baby', 'La vita di tutti i giorni con il bebè'),
  ('alimentation', 'Alimentación', 'Ernährung', 'Alimentazione'),
  ('enfant', 'Niño', 'Kind', 'Bambino'),
  ('cycle', 'Ciclo y anticoncepción', 'Zyklus & Verhütung', 'Ciclo e contraccezione'),
  ('reeducation', 'Rehabilitación posparto', 'Rückbildung', 'Riabilitazione post-partum'),
  ('sexualite', 'Sexualidad y pareja', 'Sexualität & Partnerschaft', 'Sessualità e coppia'),
  ('sommeil', 'Sueño', 'Schlaf', 'Sonno'),
  ('neurodeveloppement', 'Neurodesarrollo', 'Neurologische Entwicklung', 'Neurosviluppo'),
  ('fertilite', 'Fertilidad y ciclo', 'Fruchtbarkeit & Zyklus', 'Fertilità e ciclo'),
  ('preparer-grossesse', 'Preparar el embarazo', 'Schwangerschaft vorbereiten', 'Prepararsi alla gravidanza'),
  ('difficultes-conception', 'Dificultades para concebir, reproducción asistida', 'Schwierigkeiten beim Schwangerwerden, Kinderwunschbehandlung', 'Difficoltà a concepire, PMA'),
  ('suivi-grossesse', 'Seguimiento y pruebas del embarazo', 'Vorsorge & Untersuchungen', 'Controlli ed esami in gravidanza'),
  ('alimentation-grossesse', 'Alimentación, alcohol, tabaco', 'Ernährung, Alkohol, Rauchen', 'Alimentazione, alcol, fumo'),
  ('corps-grossesse', 'Cuerpo y pequeñas molestias', 'Körper & kleine Beschwerden', 'Corpo e piccoli disturbi'),
  ('sante-grossesse', 'Salud, enfermedades, medicamentos', 'Gesundheit, Krankheiten, Medikamente', 'Salute, malattie, farmaci'),
  ('quotidien-grossesse', 'Trabajo, deporte, viajes', 'Arbeit, Sport, Reisen', 'Lavoro, sport, viaggi'),
  ('droits-demarches', 'Derechos, trámites y ayudas', 'Rechte, Formalitäten & Leistungen', 'Diritti, pratiche e aiuti'),
  ('alimentation-bebe', 'Lactancia, biberón, diversificación', 'Stillen, Fläschchen, Beikost', 'Allattamento, biberon, svezzamento'),
  ('sante-bebe', 'Salud del bebé y pequeñas preocupaciones', 'Gesundheit des Babys & kleine Sorgen', 'Salute del bebè e piccole preoccupazioni'),
  ('developpement', 'Desarrollo y estimulación', 'Entwicklung & Spiel', 'Sviluppo e stimolazione'),
  ('securite', 'Seguridad y accidentes', 'Sicherheit & Unfälle', 'Sicurezza e incidenti'),
  ('sante-enfant', 'Salud del niño', 'Gesundheit des Kindes', 'Salute del bambino'),
  ('education', 'Comportamiento y educación', 'Verhalten & Erziehung', 'Comportamento ed educazione'),
  ('ecole-garde', 'Cuidado infantil y escuela', 'Betreuung & Schule', 'Custodia e scuola'),
  ('maladies-chroniques', 'Enfermedades crónicas y discapacidad', 'Chronische Krankheiten & Behinderung', 'Malattie croniche e disabilità'),
  ('activites-eveil', 'Actividades, juegos y estimulación', 'Aktivitäten, Spiele & Förderung', 'Attività, giochi e stimolazione'),
  ('sport', 'Deporte y actividad física', 'Sport & Bewegung', 'Sport e attività fisica'),
  ('materiel', 'Elegir el material', 'Ausstattung wählen', 'Scegliere l’attrezzatura'),
  ('vie-pratique', 'Vida práctica y organización', 'Alltag & Organisation', 'Vita pratica e organizzazione'),
  ('premiers-secours', 'Primeros auxilios y golpes', 'Erste Hilfe & Beulen', 'Primo soccorso e botte'),
  ('regles', 'Regla', 'Periode', 'Mestruazioni'),
  ('cycle-ages', 'El ciclo a lo largo de la vida', 'Der Zyklus in jedem Lebensalter', 'Il ciclo nelle diverse età'),
  ('sante-intime', 'Salud íntima', 'Intimgesundheit', 'Salute intima'),
  ('contraception', 'Anticoncepción e interrupción del embarazo', 'Verhütung & Schwangerschaftsabbruch', 'Contraccezione e interruzione di gravidanza')
) as v(slug, es, de, it)
where c.slug = v.slug;

-- Espaces de la communauté (noms et descriptions)
update public.forums f set title_es = v.t_es, description_es = v.d_es, title_de = v.t_de, description_de = v.d_de, title_it = v.t_it, description_it = v.d_it
from (values
  ('suivi-cycle', 'Seguimiento del ciclo', 'Ciclo, regla, anticoncepción, síntomas: comparte tu experiencia.', 'Zyklus-Tracking', 'Zyklus, Periode, Verhütung, Symptome: teile deine Erfahrungen.', 'Monitoraggio del ciclo', 'Ciclo, mestruazioni, contraccezione, sintomi: condividi la tua esperienza.'),
  ('projet-bebe', 'Buscando un bebé', 'Intentar tener un hijo, reproducción asistida, esperar, ilusionarse, apoyarse.', 'Kinderwunsch', 'Versuchen, ein Kind zu bekommen, Kinderwunschbehandlung, warten, hoffen, sich gegenseitig stützen.', 'Desiderio di un bambino', 'Provare ad avere un figlio, percorso di PMA, attendere, sperare, sostenersi.'),
  ('grossesse', 'Embarazo', 'Preguntas y testimonios durante el embarazo, hasta el parto.', 'Schwangerschaft', 'Fragen und Erfahrungen während der Schwangerschaft bis zur Geburt.', 'Gravidanza', 'Domande e testimonianze durante la gravidanza, fino al parto.'),
  ('jumeaux-triples', 'Gemelos y trillizos', 'Embarazos múltiples y familias con gemelos o trillizos.', 'Zwillinge und Drillinge', 'Mehrlingsschwangerschaften und Familien mit Zwillingen oder Drillingen.', 'Gemelli e trigemini', 'Gravidanze multiple e famiglie con gemelli o trigemini.'),
  ('nouveau-ne', 'Recién nacido', 'Las primeras semanas y los primeros meses con el bebé.', 'Neugeborenes', 'Die ersten Wochen und Monate mit Baby.', 'Neonato', 'Le prime settimane e i primi mesi con il bebè.'),
  ('allaitement', 'Lactancia', 'Lactancia materna, sacaleches, destete, lactancia mixta.', 'Stillen', 'Stillen, Milchpumpe, Abstillen, Zufüttern.', 'Allattamento', 'Allattamento, tiralatte, svezzamento dal seno, allattamento misto.'),
  ('biberon', 'Biberón', 'Preparación, cantidades, elección de la leche, paso al biberón.', 'Fläschchen', 'Zubereitung, Mengen, Wahl der Milch, Umstieg aufs Fläschchen.', 'Biberon', 'Preparazione, quantità, scelta del latte, passaggio al biberon.'),
  ('sommeil', 'Sueño', 'Noches, siestas, rituales para dormir, cansancio de los padres.', 'Schlaf', 'Nächte, Mittagsschlaf, Einschlafrituale, Müdigkeit der Eltern.', 'Sonno', 'Notti, sonnellini, rituali della nanna, stanchezza dei genitori.'),
  ('diversification', 'Alimentación complementaria y comidas', 'Primeras comidas, texturas, ideas de menús, comidas en familia.', 'Beikost und Mahlzeiten', 'Erste Mahlzeiten, Konsistenzen, Menüideen, Essen mit der Familie.', 'Svezzamento e pasti', 'Primi pasti, consistenze, idee di menù, pasti in famiglia.'),
  ('sante-developpement', 'Salud y desarrollo', 'Crecimiento, etapas, pequeñas preocupaciones del día a día: testimonios, no diagnósticos.', 'Gesundheit und Entwicklung', 'Wachstum, Meilensteine, kleine Alltagssorgen: Erfahrungen, keine Diagnosen.', 'Salute e sviluppo', 'Crescita, tappe, piccole preoccupazioni quotidiane: testimonianze, non diagnosi.'),
  ('neurodeveloppement', 'Trastornos del neurodesarrollo', 'TDAH, TEA, trastornos «dys», lenguaje… trayectorias, trámites y apoyo entre padres.', 'Neurologische Entwicklungsstörungen', 'ADHS, Autismus, Lese-Rechtschreib- und andere Teilleistungsstörungen, Sprache… Wege, Formalitäten und Unterstützung unter Eltern.', 'Disturbi del neurosviluppo', 'ADHD, autismo, DSA, linguaggio… percorsi, pratiche e sostegno tra genitori.'),
  ('post-partum', 'Posparto y bienestar de la madre', 'Después del nacimiento: recuperación, emociones, cansancio, pedir ayuda.', 'Wochenbett und Wohlbefinden der Mutter', 'Nach der Geburt: Erholung, Gefühle, Müdigkeit, sich helfen lassen.', 'Post-partum e benessere della mamma', 'Dopo la nascita: recupero, emozioni, stanchezza, farsi aiutare.'),
  ('plusieurs-enfants', 'Padres de varios hijos', 'Organizar la vida con varios hijos, hermanos, celos.', 'Eltern mehrerer Kinder', 'Den Alltag mit mehreren Kindern organisieren, Geschwister, Eifersucht.', 'Genitori di più figli', 'Organizzare la vita con più figli, fratelli e sorelle, gelosia.'),
  ('questions-generales', 'Preguntas generales', 'Todo lo demás: organización, escuela, cuidado infantil, vida familiar.', 'Allgemeine Fragen', 'Alles andere: Organisation, Schule, Betreuung, Familienleben.', 'Domande generali', 'Tutto il resto: organizzazione, scuola, custodia, vita familiare.')
) as v(slug, t_es, d_es, t_de, d_de, t_it, d_it)
where f.slug = v.slug;
