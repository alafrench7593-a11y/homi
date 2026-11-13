/** Fiabilité des données (audit 08) : conflits d'édition, envois en attente à la déconnexion. Ton neutre, jamais de reproche. */
export const reliability = {
  'rel.task.conflict': 'Cette tâche a été modifiée entre-temps par une autre personne du foyer. Rien n’a été écrasé : la version à jour est affichée, vérifiez-la puis recommencez.',
  'rel.task.notFound': 'Cette tâche n’existe plus ou ne vous est plus accessible.',
  'rel.queued': 'Gardé sur ce téléphone : envoi automatique dès que la connexion revient.',
  'rel.signOut.pending': {
    one: '{count} saisie n’est pas encore envoyée (pas de réseau). Elle partira à votre prochaine connexion sur ce téléphone avec ce compte ; elle sera effacée si un autre compte s’y connecte.',
    other: '{count} saisies ne sont pas encore envoyées (pas de réseau). Elles partiront à votre prochaine connexion sur ce téléphone avec ce compte ; elles seront effacées si un autre compte s’y connecte.',
  },
} as const;
