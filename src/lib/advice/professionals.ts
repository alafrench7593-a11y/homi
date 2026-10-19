/**
 * Recherche d'un professionnel : liste de destinations OFFICIELLES par pays (modulaire, remplaçable par une intégration
 * autorisée plus tard). Aucun paramètre de recherche n'est inventé : on ouvre la page d'accueil de l'annuaire.
 * Doctolib n'est pas listé : aucune API publique pour une application grand public et ses conditions d'utilisation
 * (version avril 2026) demandent une autorisation écrite préalable pour tout lien. À ajouter ici seulement après accord.
 */
import type { CycleIconName } from '@/features/cycle/kit';

export interface ProfessionalProvider { id: string; label: string; hint: string; url: string | null; icon: CycleIconName }

const AMELI: ProfessionalProvider = { id: 'ameli', label: 'pro.ameli', hint: 'pro.ameliHint', url: 'https://annuairesante.ameli.fr/', icon: 'documents' };
const QS: ProfessionalProvider = { id: 'qs', label: 'pro.qs', hint: 'pro.qsHint', url: 'https://www.questionsexualite.fr/trouver-un-professionnel', icon: 'privacy' };
const PHARMACY: ProfessionalProvider = { id: 'pharmacy', label: 'pro.pharmacy', hint: 'pro.pharmacyHint', url: null, icon: 'reminders' };
const NHS: ProfessionalProvider = { id: 'nhs', label: 'pro.nhs', hint: 'pro.otherRegion', url: 'https://www.nhs.uk/service-search', icon: 'documents' };
const OTHER: ProfessionalProvider = { id: 'other', label: 'pro.title', hint: 'pro.otherRegion', url: null, icon: 'documents' };

/** Pour un rapport à risque, les centres de santé sexuelle et le pharmacien passent en premier (contraception d'urgence). */
export function providersFor(region: string | null, reason: string | null): ProfessionalProvider[] {
  if (region === 'FR') {
    const sexual = reason?.startsWith('sex_') ?? false;
    return sexual ? [QS, PHARMACY, AMELI] : [AMELI, QS, PHARMACY];
  }
  if (region === 'GB') return [NHS, PHARMACY];
  return [OTHER, PHARMACY];
}
