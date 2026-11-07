/**
 * Contenu du widget « Bébé » (logique pure, testée) :
 *  - discret par défaut : nom de l'application + « Ouvrir l'application » (rien de lisible par un tiers) ;
 *  - détaillé si la personne le choisit : heure du prochain biberon (et prénom), heure de la prochaine prise
 *    (« Traitement » + pour qui), JAMAIS le nom du médicament ni la dose.
 * Le widget est une image figée mise à jour par l'application : on affiche des HEURES, jamais « dans 40 min ».
 */
export interface BabyWidgetContent { title: string; line1: string; line2: string }
export interface BabyWidgetTexts { appName: string; open: string; bottle: (time: string, name: string) => string; dose: (time: string, who: string) => string; nothing: string }

export function babyWidgetContent(o: {
  detailed: boolean; now: Date;
  bottles: { due_at: string; childName: string }[];
  doses: { at: Date; who: string }[];
  fmt: (d: Date) => string;
}, tx: BabyWidgetTexts): BabyWidgetContent {
  if (!o.detailed) return { title: tx.appName, line1: tx.open, line2: '' };
  const soon = o.now.getTime() - 2 * 3600_000; // un biberon en retard reste affiché 2 h
  const b = [...o.bottles].filter((x) => Date.parse(x.due_at) >= soon).sort((a, z) => a.due_at.localeCompare(z.due_at))[0];
  const d = [...o.doses].filter((x) => x.at.getTime() >= o.now.getTime() - 30 * 60_000).sort((a, z) => a.at.getTime() - z.at.getTime())[0];
  const line1 = b ? tx.bottle(o.fmt(new Date(b.due_at)), b.childName) : '';
  const line2 = d ? tx.dose(o.fmt(d.at), d.who) : '';
  if (!line1 && !line2) return { title: tx.appName, line1: tx.nothing, line2: '' };
  return { title: tx.appName, line1: line1 || line2, line2: line1 ? line2 : '' };
}
