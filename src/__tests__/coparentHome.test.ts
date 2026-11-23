/**
 * Espace du co-parent (19/11/2026) : situation d'accueil « coparent » (déclarative, coparentHome.ts) et action rapide
 * des missions (« Je m'en occupe » → « Mission terminée »), seulement pour la personne à qui la mission est confiée.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { COPARENT_PRESET, coparentSituation } from '@/features/homeToday/coparentHome';
import { HOME_PRESETS, HOME_SITUATIONS, withToolSections } from '@/features/homeToday/homeLayout';
import { quickActionFor } from '@/features/missions/MissionQuickAction';
import { DICTIONARIES } from '@/i18n/dictionaries';

describe('accueil du co-parent', () => {
  it('situation déclarative, branchée par homeLayout', () => {
    expect(HOME_SITUATIONS).toContain('coparent');
    expect(HOME_PRESETS.coparent).toEqual(withToolSections(COPARENT_PRESET));
    for (const l of ['fr', 'en', 'es', 'de', 'it']) expect(typeof DICTIONARIES[l]['hm.situation.coparent']).toBe('string');
  });
  it('« Moi » / « couple » d’un co-parent → « coparent » ; son propre cycle, un enfant, la famille : inchangés ; propriétaire : inchangé', () => {
    expect(coparentSituation('me', 'coparent')).toBe('coparent');
    expect(coparentSituation('couple', 'coparent')).toBe('coparent');
    expect(coparentSituation('cycle', 'coparent')).toBe('cycle');
    expect(coparentSituation('child', 'coparent')).toBe('child');
    expect(coparentSituation('me', 'owner')).toBe('me');
    expect(coparentSituation('me', 'caregiver')).toBe('me');
  });
  it('aucun module de cycle ou de grossesse dans l’accueil par défaut du co-parent', () => {
    expect(COPARENT_PRESET).toEqual(expect.arrayContaining(['next', 'agenda', 'familyTasks']));
    expect(COPARENT_PRESET).not.toContain('upcoming');
  });
});

describe('missions : action rapide de la ligne', () => {
  const m = { assignee_id: 'sam', created_by: 'camille' } as const;
  it('destinataire : À faire → « Je m’en occupe », En cours → « Mission terminée »', () => {
    expect(quickActionFor({ ...m, mission_state: 'pending' }, 'sam')).toBe('start');
    expect(quickActionFor({ ...m, mission_state: 'accepted' }, 'sam')).toBe('start');
    expect(quickActionFor({ ...m, mission_state: 'in_progress' }, 'sam')).toBe('complete');
  });
  it('rien pour l’autrice, une autre personne, ou une mission finie / annulée / refusée', () => {
    expect(quickActionFor({ ...m, mission_state: 'in_progress' }, 'camille')).toBeNull();
    expect(quickActionFor({ ...m, mission_state: 'in_progress' }, 'nounou')).toBeNull();
    for (const s of ['done', 'cancelled', 'declined'] as const) expect(quickActionFor({ ...m, mission_state: s }, 'sam')).toBeNull();
  });
});
