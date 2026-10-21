/**
 * Questions suggérées à l'assistant, selon la semaine de grossesse exacte ou l'âge exact de l'enfant (Premium).
 * Ce sont des idées de questions générales : l'assistant ne pose aucun diagnostic et ne recommande aucune dose.
 */
export function pregnancySuggestions(weeksSA: number, multiple: boolean): string[] {
  const out: string[] = [];
  if (weeksSA < 14) out.push('Quels examens sont habituellement proposés au premier trimestre ?', 'Comment préparer ma première échographie ?');
  else if (weeksSA < 28) out.push('Que vérifie l’échographie du 2e trimestre ?', 'Comment organiser la liste de naissance sans me disperser ?');
  else out.push('Que mettre dans la valise de maternité, et quand la préparer ?', 'Quels signes doivent me faire appeler la maternité ?');
  if (weeksSA >= 20) out.push('Comment préparer le projet de naissance à présenter à la sage-femme ?');
  if (multiple) out.push('Quelles questions poser à l’équipe pour une grossesse gémellaire ?');
  return out.slice(0, 4);
}

export function childSuggestions(name: string, months: number): string[] {
  if (months < 3) return [`Comment organiser les nuits avec ${name} à deux ?`, `Quelles questions préparer pour la prochaine visite de ${name} chez le pédiatre ?`, 'Comment reconnaître les signes de faim et de fatigue ?'];
  if (months < 7) return [`Comment savoir si ${name} est prêt·e pour commencer la diversification ?`, 'Quels aliments proposer en premier, et sous quelle texture ?', `Comment adapter la routine du coucher de ${name} ?`];
  if (months < 13) return [`Quelles idées de repas pour ${name} avec des petits morceaux ?`, 'Comment rendre le coucher plus serein quand les réveils reviennent ?', 'Quels rendez-vous et vaccins sont habituellement prévus avant 1 an ?'];
  if (months < 36) return [`Quelles idées de repas en famille adaptées à ${name} ?`, 'Comment accompagner les colères de cet âge ?', `Comment préparer ${name} à l’entrée en crèche ou à l’école ?`];
  return [`Quelles idées de repas rapides et équilibrés pour ${name} ?`, `Comment organiser les devoirs et le coucher de ${name} ?`, 'Comment parler des écrans en famille ?'];
}
