// Règles des notifications push envoyées par le serveur (send-push) — logique pure, sans dépendance
// (testée par Jest : src/__tests__/pushRules.test.ts, et par Deno : push-rules_test.ts).
// Voir HOMI_NOTIFICATION_RULES.md.
//  1. Heures calmes du DESTINATAIRE (notification_settings, calculées en SQL par push_quiet_until) :
//     une notification non urgente est différée à la fin des heures calmes, jamais perdue.
//     Une notification « urgent » (posée par le serveur seulement) part tout de suite.
//  2. Écran verrouillé : titre et texte GÉNÉRIQUES par défaut ; le détail seulement si la personne l'a
//     autorisé (lockscreen_details). Communauté et rappels de produits : toujours génériques (un nom de
//     groupe ou de produit peut révéler une naissance, une grossesse, un sujet de santé).
//  3. L'envoi ne marque jamais une notification comme lue (pas de preuve de lecture).

export type PushRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  deep_link: string | null;
  category: string;
  urgent?: boolean | null;
};

export type PushPlan = { action: 'send' } | { action: 'defer'; until: string };

/** Envoi immédiat, ou report à la fin des heures calmes (quietUntil : fin calculée par le serveur, null = hors heures calmes). */
export function planDelivery(row: Pick<PushRow, 'urgent'>, quietUntil: string | null | undefined): PushPlan {
  if (row.urgent === true) return { action: 'send' };
  if (quietUntil) return { action: 'defer', until: quietUntil };
  return { action: 'send' };
}

type TextKey = 'communityTitle' | 'communityBody' | 'recallTitle' | 'recallBody' | 'genericTitle' | 'genericBody' | 'urgentTitle';

/** Textes génériques (écran verrouillé, sans contenu sensible), dans la langue du destinataire. */
export const PUSH_TEXTS: Record<string, Record<TextKey, string>> = {
  fr: { communityTitle: 'Nouvelle activité dans la communauté', communityBody: 'Ouvrez l’application pour lire le message.', recallTitle: 'Alerte sur un produit enregistré', recallBody: 'Ouvrez l’application pour voir le détail du rappel.', genericTitle: 'Nouvelle notification', genericBody: 'Ouvrez l’application pour voir le détail.', urgentTitle: 'Information importante' },
  en: { communityTitle: 'New activity in the community', communityBody: 'Open the app to read the message.', recallTitle: 'Alert about a saved product', recallBody: 'Open the app to see the recall details.', genericTitle: 'New notification', genericBody: 'Open the app to see the details.', urgentTitle: 'Important information' },
  es: { communityTitle: 'Nueva actividad en la comunidad', communityBody: 'Abre la aplicación para leer el mensaje.', recallTitle: 'Alerta sobre un producto guardado', recallBody: 'Abre la aplicación para ver los detalles de la retirada.', genericTitle: 'Nueva notificación', genericBody: 'Abre la aplicación para ver los detalles.', urgentTitle: 'Información importante' },
  de: { communityTitle: 'Neue Aktivität in der Community', communityBody: 'Öffne die App, um die Nachricht zu lesen.', recallTitle: 'Warnung zu einem gespeicherten Produkt', recallBody: 'Öffne die App, um die Details des Rückrufs zu sehen.', genericTitle: 'Neue Benachrichtigung', genericBody: 'Öffne die App, um die Details zu sehen.', urgentTitle: 'Wichtige Information' },
  it: { communityTitle: 'Nuova attività nella community', communityBody: 'Apri l’app per leggere il messaggio.', recallTitle: 'Avviso su un prodotto salvato', recallBody: 'Apri l’app per vedere i dettagli del richiamo.', genericTitle: 'Nuova notifica', genericBody: 'Apri l’app per vedere i dettagli.', urgentTitle: 'Informazione importante' },
};

export function pushText(lang: string | null | undefined, key: TextKey): string {
  return (PUSH_TEXTS[lang ?? 'fr'] ?? PUSH_TEXTS.fr)[key];
}

/** Titre et texte affichés sur l'écran verrouillé. */
export function lockScreenText(row: PushRow, lang: string | null | undefined, showDetails: boolean): { title: string; body?: string } {
  if (row.category.startsWith('community')) return { title: pushText(lang, 'communityTitle'), body: pushText(lang, 'communityBody') };
  if (row.category === 'product_recall') return { title: pushText(lang, 'recallTitle'), body: pushText(lang, 'recallBody') };
  if (showDetails) return { title: row.title, body: row.body ?? undefined };
  return { title: pushText(lang, row.urgent ? 'urgentTitle' : 'genericTitle'), body: pushText(lang, 'genericBody') };
}

/** Canal Android : alertes (rappels produits, urgences) ou canal courant. */
export function channelFor(row: Pick<PushRow, 'category' | 'urgent'>): 'alerts' | 'community' {
  return row.category === 'product_recall' || row.urgent === true ? 'alerts' : 'community';
}
