/**
 * Profils fictifs A–G de la propriétaire (liste_200.md, exigences transverses) — faits d'entrée du moteur, date fixe.
 * Utilisés par personalization.test.ts (attendus), personalizationMatrix.test.ts (matrice générée) et repris par
 * l'e2e de personnalisation (e2e/personnalisation.py, mêmes réponses injectées dans la démonstration).
 */
import { buildFacts, type FactsInput, type ProfileFacts } from '@/lib/personalization';

export const NOW = new Date(2026, 10, 20, 9, 0, 0);

export interface Persona { key: string; title: string; input: FactsInput; facts: ProfileFacts }

const mk = (key: string, title: string, input: FactsInput): Persona => ({ key, title, input, facts: buildFacts({ now: NOW, ...input }) });

export const PERSONAS: Persona[] = [
  mk('A', 'Femme enceinte (24 SA), en couple', {
    role: 'owner', myJourneys: ['pregnancy'], pregnancy: { id: 'p1', mine: true, weeks: 24 },
    answers: { v: 3, profile: ['pregnant'], household: 'partner', invite: false, feeding: null, priorities: ['pregnancy', 'appointments'] },
  }),
  mk('B', 'Maman d’un bébé de 2 mois allaité', {
    role: 'owner', myJourneys: ['postpartum', 'baby'], children: [{ id: 'lina', first_name: 'Lina', birth_date: '2026-09-14' }],
    answers: { v: 3, profile: ['new_baby'], household: 'partner', invite: false, feeding: 'breast', priorities: ['sleep'] },
  }),
  mk('C', 'Papa d’un bébé de 8 mois (co-parent)', {
    role: 'coparent', myJourneys: ['baby'], children: [{ id: 'lina', first_name: 'Lina', birth_date: '2026-03-10' }],
    answers: { v: 3, profile: ['dad'], household: 'partner', invite: false, feeding: null, priorities: ['tasks', 'sleep'] },
  }),
  mk('D', 'Parent d’un enfant de 6 ans', {
    role: 'owner', myJourneys: ['child'], children: [{ id: 'noe', first_name: 'Noé', birth_date: '2020-09-01' }],
    answers: { v: 3, profile: ['kids'], household: 'partner', invite: false, feeding: null, priorities: ['school', 'activities'] },
  }),
  mk('E', 'Nounou autorisée (compte garde seulement)', {
    role: 'caregiver', caregiverOnly: true, children: [{ id: 'lina', first_name: 'Lina', birth_date: '2025-11-02' }],
  }),
  mk('F', 'Parent de trois enfants (4 mois, 4 ans, 7 ans)', {
    role: 'owner', myJourneys: ['baby', 'child'], caregiverLinked: true, activeChildId: 'zoe',
    children: [{ id: 'lea', first_name: 'Léa', birth_date: '2026-07-10' }, { id: 'tom', first_name: 'Tom', birth_date: '2022-05-03' }, { id: 'zoe', first_name: 'Zoé', birth_date: '2019-04-12' }],
    answers: { v: 3, profile: ['kids', 'new_baby'], household: 'partner', invite: false, feeding: 'formula', priorities: ['childcare_days', 'meals'] },
  }),
  mk('G', 'Sans aucune information', {}),
];

export const persona = (k: string) => PERSONAS.find((p) => p.key === k)!;
