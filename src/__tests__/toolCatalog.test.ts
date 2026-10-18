import { toolCategories } from '@/lib/domain/journeys';
import { favoriteTools, groupByTheme, searchTools, THEMES, toggleFavorite, toolCatalog, toolId } from '@/lib/domain/toolCatalog';
import type { Journey } from '@/lib/types';

const CTXS: { journeys: Journey[]; hasPregnancy: boolean; childId?: string; childCount: number }[] = [
  { journeys: [], hasPregnancy: false, childCount: 0 },
  { journeys: ['ttc'], hasPregnancy: false, childCount: 0 },
  { journeys: ['avoid'], hasPregnancy: false, childCount: 0 },
  { journeys: ['pregnant'], hasPregnancy: true, childCount: 0 },
  { journeys: ['newborn'], hasPregnancy: false, childId: 'c1', childCount: 1 },
  { journeys: ['family', 'pregnant', 'ttc', 'avoid'], hasPregnancy: true, childId: 'c1', childCount: 3 },
];

describe('catalogue des outils', () => {
  it.each(CTXS.map((c, i) => [i, c] as const))('conserve chaque écran des catégories historiques (contexte %i)', (_i, ctx) => {
    const cat = toolCatalog(ctx);
    for (const c of toolCategories(ctx)) for (const it of c.items) expect(cat.some((x) => x.href === it.href)).toBe(true);
  });
  it('donne un thème connu à chaque outil, sans doublon d’identifiant', () => {
    const keys = new Set(THEMES.map((x) => x.key));
    for (const ctx of CTXS) {
      const cat = toolCatalog(ctx);
      expect(new Set(cat.map((x) => x.id)).size).toBe(cat.length);
      for (const x of cat) expect(keys.has(x.theme)).toBe(true);
    }
  });
  it('n’envoie aucun outil historique dans la catégorie par défaut faute de correspondance', () => {
    const cat = toolCatalog(CTXS[5]);
    const res = cat.filter((x) => x.theme === 'resources').map((x) => x.label);
    for (const l of res) expect(['Articles sur la conception', 'Communauté Projet bébé', 'Communauté', 'Communauté grossesse', 'Communauté parents', 'Questions', 'Préparation à l’accouchement', 'Bibliothèque', 'Rééducation']).toContain(l);
  });
  it('ajoute les outils existants absents (relais, temps pour soi, souvenirs, vaccins…)', () => {
    const hrefs = toolCatalog(CTXS[4]).map((x) => x.href);
    for (const h of ['/family/nights', '/family/me-time', '/journal', '/child/c1/vaccines', '/scanner/avoid', '/notifications']) expect(hrefs).toContain(h);
  });
  it('signale les outils qui demandent d’abord un profil enfant, et les urgences', () => {
    const cat = toolCatalog({ journeys: ['newborn'], hasPregnancy: false, childCount: 0 });
    expect(cat.filter((x) => x.theme === 'growth').every((x) => x.needsChild)).toBe(true);
    expect(cat.find((x) => x.label === 'Repas et diversification')?.needsChild).toBe(true);
    expect(cat.find((x) => x.href === '/emergency')?.urgent).toBe(true);
  });
  it('identifiant stable quel que soit l’enfant (favoris)', () => {
    expect(toolId('growth', '/child/abc?tab=growth')).toBe(toolId('growth', '/child/xyz?tab=growth'));
    expect(toolId('feeding', '/bottle/abc')).toBe(toolId('feeding', '/bottle/def'));
    expect(toolId('teeth', '/teeth?child=a')).toBe(toolId('teeth', '/teeth?child=b'));
  });
  it('regroupe dans l’ordre des thèmes et recherche sans tenir compte des accents', () => {
    const cat = toolCatalog(CTXS[5]);
    const g = groupByTheme(cat);
    expect(g[0].key).toBe('feeding');
    expect(searchTools(cat, 'evolution bebe').map((x) => x.label)).toContain('Évolution du bébé');
    expect(searchTools(cat, 'SOMMEIL').length).toBeGreaterThan(1);
    expect(searchTools(cat, 'zzzzz')).toEqual([]);
  });
  it('favoris : ordre conservé, identifiants obsolètes ignorés', () => {
    const cat = toolCatalog(CTXS[4]);
    const a = cat[3].id; const b = cat[0].id;
    let favs = toggleFavorite([], a); favs = toggleFavorite(favs, b); favs = toggleFavorite(favs, 'x:obsolete');
    expect(favoriteTools(cat, favs).map((x) => x.id)).toEqual([a, b]);
    expect(toggleFavorite(favs, a)).not.toContain(a);
  });
});

import { statusKeyFor, toolStatuses } from '@/lib/domain/toolCatalog';
describe('état affiché sur les cartes', () => {
  const now = new Date('2026-10-18T15:00:00');
  it('n’affiche rien sans donnée réelle', () => {
    expect(toolStatuses({ now })).toEqual({});
  });
  it('priorise la prise en cours, puis le rappel, puis le dernier biberon', () => {
    expect(toolStatuses({ now, bottleRunningSince: '2026-10-18T14:52:00', reminderDueAt: '2026-10-18T17:00:00' }).bottleTimer).toMatchObject({ text: 'En cours depuis 8 min', active: true });
    expect(toolStatuses({ now, reminderDueAt: '2026-10-18T17:30:00', lastBottleAt: '2026-10-18T13:00:00' }).bottleTimer?.text).toBe('Rappel à 17:30');
    expect(toolStatuses({ now, reminderDueAt: '2026-10-18T14:30:00' }).bottleTimer?.text).toBe('C’est l’heure prévue');
    expect(toolStatuses({ now, lastBottleAt: '2026-10-18T12:45:00' }).bottleTimer?.text).toBe('Dernier il y a 2 h 15');
  });
  it('relais, tâches, calendrier (le plus proche), notifications', () => {
    const s = toolStatuses({ now, tasksTodayLeft: 0, nextNight: { starts_at: '2026-10-18T22:00:00', who: 'Vous' }, nextAppointment: '2026-10-19T09:30:00', unreadNotifications: 2 });
    expect(s.family?.text).toBe('Rien d’autre aujourd’hui');
    expect(s.nights).toMatchObject({ text: 'Vous · à 22:00', active: true });
    expect(s.calendar?.text).toBe('Prochain à 22:00');
    expect(s.appointments?.text).toBe('Prochain demain 09:30');
    expect(s.notifications?.text).toBe('2 non lues');
    expect(toolStatuses({ now, nextAppointment: '2026-10-27T15:53:00' }).appointments?.text).toBe('Prochain mar. 27 oct.');
  });
  it('associe chaque état à la bonne carte', () => {
    expect(statusKeyFor({ href: '/bottle/abc', theme: 'feeding' })).toBe('bottleTimer');
    expect(statusKeyFor({ href: '/bottle/history?child=a', theme: 'feeding' })).toBeNull();
    expect(statusKeyFor({ href: '/(tabs)/track', theme: 'diapers' })).toBe('diapers');
    expect(statusKeyFor({ href: '/(tabs)/track', theme: 'feeding' })).toBe('feeding');
  });
});
