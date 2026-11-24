-- =====================================================================
-- Modération de la communauté v2 (24/11/2026, audit App Store, règle 1.2) :
--  1. filtre élargi (5 langues) : propos haineux et contenus sexualisant des enfants BLOQUÉS ; insultes, menaces,
--     contenu sexuel explicite et détresse (idées suicidaires) envoyés en relecture (la publication reste possible,
--     elle est marquée « à relire » par la fonction existante community_text_needs_review) ;
--  2. reports.alerted_at : la modératrice est prévenue par e-mail une seule fois par signalement (fonction
--     moderation-alert), jamais deux fois pour le même.
-- Retour arrière : delete from public.moderation_terms where reason like 'v2 · %';
--                  alter table public.reports drop column alerted_at;
-- =====================================================================
insert into public.moderation_terms (pattern, action, reason) values
 -- protection des enfants : toujours bloqué
 ('\m(p[ée]dophil\w*|p[ée]do ?porn\w*|child ?porn\w*|cp ?links?|kinderporn\w*|pedopornogra\w*)\M', 'block', 'v2 · protection des enfants'),
 -- propos haineux (insultes racistes, homophobes, antisémites) : bloqué
 ('\m(n[eè]gros?|bougnoules?|youpins?|nigg(er|a)s?|faggots?|kikes?|sales? (arabes?|noirs?|juifs?|bougnoules?))\M', 'block', 'v2 · propos haineux'),
 -- insultes (fr, en, es, de, it) : relecture
 ('\m(connard|connasse|salope|pute|encul[ée]e?|ta gueule|fdp|fils de pute|b[âa]tard|grosse merde|va te faire foutre|abruti(e)?)\M', 'review', 'v2 · insulte'),
 ('\m(fuck(ing|er)?|bitch|asshole|cunt|motherfucker|dickhead|slut|whore)\M', 'review', 'v2 · insulte'),
 ('\m(puta|gilipollas|cabr[oó]n|hijo de puta|arschloch|hurensohn|schlampe|wichser|stronzo|vaffanculo|puttana|figlio di puttana)\M', 'review', 'v2 · insulte'),
 -- menaces : relecture
 ('\m(je vais te (tuer|buter|frapper|retrouver|faire du mal)|i(''ll| will) (kill|hurt|find) you|te voy a matar|ich bring(e)? dich um|ti ammazzo)\M', 'review', 'v2 · menace'),
 -- contenu sexuel explicite : relecture
 ('\m(porno\w*|nudes?|onlyfans|sexe anal|fellation|sextape|plan cul)\M', 'review', 'v2 · contenu sexuel'),
 -- détresse : relecture prioritaire (la modératrice peut orienter vers le 3114)
 ('\m(me suicider|en finir avec (la|ma) vie|envie de mourir|kill myself|want to die|suicidarme|mich umbringen|uccidermi)\M', 'review', 'v2 · détresse')
on conflict (pattern) do nothing;

alter table public.reports add column if not exists alerted_at timestamptz;
comment on column public.reports.alerted_at is 'Moment où la modératrice a été prévenue par e-mail (fonction moderation-alert) ; null = pas encore.';
