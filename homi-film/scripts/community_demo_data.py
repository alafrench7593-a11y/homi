"""Jeu de données FICTIF pour la pub Communauté (aucun membre réel) : 100 profils, 50 publications, 200 commentaires.
Sert UNIQUEMENT à remplir la démo locale du navigateur (localStorage) avant les captures : jamais la production.
Sortie : homi-film/data/community-demo.json (déterministe, graine fixe)."""
import json, os, random
R = random.Random(2026)
FIRST = ['Inès', 'Léa', 'Camille', 'Sarah', 'Manon', 'Chloé', 'Jade', 'Lina', 'Emma', 'Zoé', 'Nora', 'Yasmine', 'Clara', 'Julie', 'Amel', 'Aïcha', 'Lucie', 'Pauline',
         'Mélissa', 'Fatou', 'Anaïs', 'Elsa', 'Mila', 'Romane', 'Salomé', 'Léna', 'Maud', 'Hélène', 'Nadia', 'Sofia', 'Thomas', 'Karim', 'Hugo', 'Julien', 'Mehdi', 'Nicolas',
         'Samuel', 'Théo', 'Antoine', 'Malik']
SUFFIX = ['_maman', '.et.bebe', '_2026', '_de_Lyon', '.ptitloup', '_jumeaux', '_et_Noé', '.nuitsblanches', '_maman2', '_papa', '.rennes', '_nantes', '_bordeaux', '_lille']
CITIES = ['Lyon', 'Nantes', 'Lille', 'Bordeaux', 'Rennes', 'Marseille', 'Toulouse', 'Strasbourg', 'Montpellier', 'Grenoble', 'Paris', 'Nice', 'Tours', 'Dijon']
PRESETS = ['moon', 'sun', 'leaf', 'cloud', 'star', 'heart', 'wave', 'flower', 'bird', 'whale', 'bear', 'rainbow']
JOURNEYS = ['grossesse', 'bebe', 'bebe', 'bebe', 'postpartum', 'enfant', 'famille', 'jumeaux', 'projet']
profiles = []
seen = set()
while len(profiles) < 100:
    n = R.choice(FIRST) + R.choice(SUFFIX)
    if n in seen: continue
    seen.add(n)
    i = len(profiles)
    profiles.append({'user_id': f'demo-film-{i:03d}', 'pseudonym': n, 'handle': n.lower().replace('.', '_').replace('é', 'e').replace('ï', 'i').replace('ë', 'e').replace('è', 'e')[:20],
                     'area_label': R.choice(CITIES), 'bio': None, 'avatar_preset': PRESETS[i % len(PRESETS)], 'journey_label': R.choice(JOURNEYS), 'visibility': 'members'})
# (groupe, titre, texte) — tutoiement, ton naturel, aucune promesse médicale
POSTS = [
 ('sommeil', 'Mon bébé a 3 mois et ne fait toujours pas ses nuits', 'Il se réveille encore deux ou trois fois par nuit. C’est normal à cet âge ? Comment vous avez tenu ?'),
 ('grossesse', 'Des conseils pour préparer la maternité ?', 'Je suis à 32 SA et je commence ma valise. Qu’est-ce qui vous a vraiment servi là-bas ?'),
 ('plusieurs-enfants', 'Comment vous répartissez les nuits avec votre conjoint ?', 'On s’épuise tous les deux. Une nuit chacun ? Des tranches horaires ? Je prends toutes les idées.'),
 ('nouveau-ne', 'Je suis épuisée, mon bébé se réveille toutes les deux heures', 'Trois semaines que ça dure. Je l’aime tellement mais je n’en peux plus. Vous aussi ?'),
 ('allaitement', 'Premières semaines d’allaitement', 'Les tétées s’enchaînent, je me sens un peu perdue. Qui est passé par là ?'),
 ('post-partum', 'Le moral en dents de scie', 'Certains jours je pleure sans raison. J’en ai parlé à ma sage-femme, mais ça fait du bien de vous lire.'),
 ('biberon', 'Passage au biberon à la reprise', 'Je reprends le travail dans un mois. Comment vous avez fait la transition ?'),
 ('diversification', 'Premières purées : vos recettes préférées ?', 'On commence la diversification la semaine prochaine. Carotte ou courgette en premier ?'),
 ('jumeaux-triples', 'Jumeaux : survivre au premier mois', 'Deux bébés, deux rythmes. Vos astuces d’organisation ?'),
 ('neurodeveloppement', 'Diagnostic TDAH pour notre fils', 'On vient d’avoir le diagnostic. Je cherche des parents qui sont passés par là.'),
 ('neurodeveloppement', 'Parents d’enfants autistes, on échange ?', 'Notre fille a 4 ans. Je cherche surtout des retours d’expérience sur l’école.'),
 ('projet-bebe', 'Huit mois d’essais', 'On garde espoir mais c’est long. Comment vous gérez l’attente ?'),
 ('grossesse', 'Premier trimestre et nausées', 'Je n’arrive plus à rien avaler le matin. Ça s’est calmé quand pour vous ?'),
 ('sommeil', 'Rituel du coucher qui marche chez vous ?', 'Bain, histoire, câlin… et toujours des pleurs. Vos routines ?'),
 ('questions-generales', 'Premier vrai week-end à trois', 'On part deux jours pour la première fois. La liste de ce qu’il ne faut pas oublier ?'),
 ('sante-developpement', 'Premiers pas à 14 mois', 'Il marche enfin ! Je voulais juste partager ma joie avec des gens qui comprennent.'),
 ('post-partum', 'Retrouver du temps pour moi', 'Comment vous vous accordez une heure par semaine sans culpabiliser ?'),
 ('allaitement', 'Tire-lait au travail', 'Ma pause tire-lait se passe mal au bureau. Vos solutions ?'),
 ('nouveau-ne', 'Les coliques du soir', 'Tous les soirs vers 19 h, ça pleure pendant une heure. On tient bon.'),
 ('plusieurs-enfants', 'L’aîné jaloux du bébé', 'Notre grande de 3 ans régresse depuis l’arrivée de sa sœur. Des idées ?'),
 ('grossesse', 'Le prénom, quel casse-tête !', 'On ne se met pas d’accord. Comment vous avez choisi ?'),
 ('sommeil', 'Sieste de 20 minutes seulement', 'Elle se réveille dès qu’on la pose. Vous aussi ?'),
 ('biberon', 'Combien de biberons à 2 mois ?', 'Je note tout dans HOMI mais je doute toujours. Vous comptez comment ?'),
 ('diversification', 'Il refuse tous les légumes verts', 'Brocoli, épinards, haricots : non merci. Patience ?'),
 ('jumeaux-triples', 'Sorties avec des jumeaux', 'La poussette double dans le bus… racontez-moi vos aventures.'),
 ('post-partum', 'Rééducation du périnée', 'J’ai commencé les séances, je me sens moins seule en en parlant ici.'),
 ('questions-generales', 'Reprendre le travail sans culpabiliser', 'Dans deux semaines. J’ai le cœur serré.'),
 ('projet-bebe', 'Test positif ce matin !', 'Je n’en reviens pas. Je voulais le dire à quelqu’un avant tout le monde.'),
 ('nouveau-ne', 'Premier bain à la maison', 'On était tellement stressés… et finalement il a adoré.'),
 ('sante-developpement', 'Poussée dentaire difficile', 'Des nuits agitées depuis une semaine. On se serre les coudes ?'),
 ('allaitement', 'Sevrage en douceur', 'Je voudrais arrêter progressivement à 9 mois. Vos expériences ?'),
 ('sommeil', 'Régression des 4 mois', 'Il dormait bien et tout s’est arrêté. Ça passe, promis ?'),
 ('grossesse', 'Échographie du 2e trimestre demain', 'Un peu stressée. Vous l’avez vécue comment ?'),
 ('plusieurs-enfants', 'Trois enfants, une seule salle de bain', 'Le matin est un sport. Votre organisation ?'),
 ('neurodeveloppement', 'Rendez-vous chez l’orthophoniste', 'Premier bilan la semaine prochaine. Comment vous l’avez préparé ?'),
 ('post-partum', 'Je me sens enfin mieux', 'Après des semaines difficiles, j’ai retrouvé de l’énergie. Courage à celles qui traversent ça.'),
 ('nouveau-ne', 'Peau à peau avec papa', 'Mon conjoint ose enfin. Moment magique.'),
 ('questions-generales', 'Trouver une assistante maternelle', 'Vous avez cherché combien de temps avant d’en trouver une ?'),
 ('diversification', 'Morceaux ou purées ?', 'On hésite à proposer des morceaux. Votre avis ?'),
 ('biberon', 'Le biberon de nuit, qui s’en occupe ?', 'Chez nous on alterne grâce au relais. Et chez vous ?'),
 ('jumeaux-triples', 'Allaiter des jumeaux', 'Est-ce que certaines ont réussi en même temps ?'),
 ('sommeil', 'Cododo ou chambre séparée ?', 'On réfléchit à la suite. Comment vous avez décidé ?'),
 ('grossesse', 'Congé maternité : par où commencer ?', 'Les démarches me donnent le tournis.'),
 ('sante-developpement', 'Il dit « maman » !', 'Premier mot ce matin. Je flotte.'),
 ('post-partum', 'Fatigue et couple', 'On se croise plus qu’on ne se parle. Comment vous gardez du lien ?'),
 ('allaitement', 'Crevasses : courage à toutes', 'J’ai demandé de l’aide à une consultante, ça a tout changé.'),
 ('plusieurs-enfants', 'Partager les tâches à la maison', 'On a essayé une liste commune, ça aide vraiment. Vous ?'),
 ('nouveau-ne', 'Sortie de maternité demain', 'Un mélange de joie et de trac. Vos premières nuits à la maison ?'),
 ('projet-bebe', 'Garder le couple soudé pendant les essais', 'Vos petits rituels pour ne pas en faire une obsession ?'),
 ('questions-generales', 'Merci à cette communauté', 'Je suis arrivée perdue il y a six mois. Aujourd’hui c’est moi qui réponds. Merci.'),
]
REPLIES = ['On traverse la même période ❤️', 'Le relais avec mon conjoint nous aide beaucoup.', 'Courage, tu peux aussi demander de l’aide autour de toi.', 'Tu n’es pas seule, vraiment.',
 'Chez nous ça s’est amélioré vers 4 mois, accroche-toi.', 'J’en ai parlé à ma sage-femme, ça m’a rassurée.', 'Pareil ici, je t’envoie plein de courage.', 'Merci pour ce message, je me sens moins seule.',
 'On a fait une nuit chacun, ça nous a sauvés.', 'Prends soin de toi aussi, c’est important.', 'Je te comprends tellement.', 'Ça passe, même si sur le moment ça paraît long.',
 'On note tout dans HOMI, ça nous aide à y voir clair.', 'Si ça t’inquiète, n’hésite pas à en parler à ton médecin.', 'Bravo, quelle belle nouvelle !', 'Félicitations ! 🎉',
 'Même chose chez nous, on tient bon ensemble.', 'Une amie m’a gardé le bébé deux heures, ça m’a fait un bien fou.', 'On se serre les coudes ❤️', 'Je partage ton ressenti.',
 'Le portage nous a beaucoup aidés le soir.', 'Merci de partager, ça fait du bien de lire ça.', 'Un jour après l’autre, tu fais déjà tellement.', 'On a vécu la même chose il y a un an, courage.']
H = R.random
posts, comments = [], []
for i, (g, title, body) in enumerate(POSTS):
    author = profiles[(i * 7) % 100]['user_id']
    posts.append({'key': f'p{i:02d}', 'forum_slug': g, 'author_id': author, 'title': title, 'body': body, 'kind': 'question' if title.endswith('?') or i % 3 else 'testimony',
                  'hours_ago': round(0.3 + i * 1.7 + H() * 2, 1), 'like_count': 3 + int(H() * 60)})
# post 3 (épuisée) : les trois réponses du storyboard, dans l'ordre
fixed = {3: ['On traverse la même période ❤️', 'Le relais avec mon conjoint nous aide beaucoup.', 'Courage, tu peux aussi demander de l’aide autour de toi.']}
ci = 0
for i, p in enumerate(posts):
    n = 3 if i in fixed else 2 + int(H() * 5)
    for k in range(n):
        if len(comments) >= 200: break
        body = fixed[i][k] if i in fixed else REPLIES[(ci * 5 + i) % len(REPLIES)]
        comments.append({'post_key': p['key'], 'author_id': profiles[(ci * 13 + 5) % 100]['user_id'], 'body': body, 'minutes_after': 5 + k * 9})
        ci += 1
while len(comments) < 200:
    p = posts[len(comments) % 50]
    comments.append({'post_key': p['key'], 'author_id': profiles[(len(comments) * 11) % 100]['user_id'], 'body': REPLIES[len(comments) % len(REPLIES)], 'minutes_after': 40})
os.makedirs('homi-film/data', exist_ok=True)
json.dump({'note': 'Données de démonstration fictives (pub Communauté). Aucun membre réel.', 'profiles': profiles, 'posts': posts, 'comments': comments}, open('homi-film/data/community-demo.json', 'w'), ensure_ascii=False, indent=1)
print(len(profiles), len(posts), len(comments))
