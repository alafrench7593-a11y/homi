/**
 * Refonte de l'onboarding et du paywall (21/11/2026) : textes demandés, réponses rapides tirées des données réelles,
 * preuve sociale tracée, histoire de l'équipe.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { setLocale, t as tr } from '@/i18n';
import { DICTIONARIES } from '@/i18n/dictionaries';
import { FOUNDER_STORY, TESTER_PROOF } from '@/config/socialProof';
import { DEMO_OF, NEEDS, PAYWALL_AURA, USE_CTA, type NeedId } from '@/features/firstWin/model';
import { offerCards } from '@/features/firstWin/offer';
import { helpAnswers } from '@/features/firstWin/PaywallWhite';
import { demoFamilyPlans, demoPlans } from '@/lib/premium/plans';

const nb = (s: string) => s.replace(/[  ]/g, ' ');
const NOW = new Date('2026-12-03T10:30:00');

beforeAll(() => setLocale('fr'));

describe('onboarding : consigne d’Aura et bouton liés au besoin', () => {
  it('consigne courte de la démo bébé et bouton « Utiliser ce suivi pour mon bébé »', () => {
    expect(tr('fw.demo.sleepLog.aura')).toBe('Ajoute la sieste. Tu verras où retrouver l’heure du réveil.');
    expect(tr(USE_CTA.feed_sleep)).toBe('Utiliser ce suivi pour mon bébé');
  });
  it('chaque besoin proposé a une démo, un bouton et un message d’Aura sur le paywall', () => {
    const needs = [...new Set(Object.values(NEEDS).flat())] as NeedId[];
    for (const n of needs) {
      expect(DEMO_OF[n]).toBeTruthy();
      expect(tr(USE_CTA[n])).not.toMatch(/^fw\./);
      expect(tr(PAYWALL_AURA[n])).not.toMatch(/^fw\./);
    }
  });
});

describe('paywall : message d’Aura (prédéfini, deux lignes au plus)', () => {
  it('textes demandés, mot pour mot', () => {
    expect(tr(PAYWALL_AURA.feed_sleep)).toBe('Tu viens de noter une sieste. Tu peux retrouver son heure de réveil à côté du dernier repas.');
    expect(tr(PAYWALL_AURA.relay)).toBe('Quand vous vous relayez, chacun peut retrouver les infos qui lui sont partagées.');
    expect(tr(PAYWALL_AURA.prepare_birth)).toBe('Ta première tâche est cochée. Tu peux retrouver le reste de ta préparation au même endroit.');
    expect(tr(PAYWALL_AURA.mornings)).toBe('Tu viens de cocher une étape. Tu vois tout de suite ce qu’il reste à faire.');
  });
  it('deux lignes au plus à la largeur d’un iPhone (≈ 120 caractères), dans les 5 langues', () => {
    for (const dict of Object.values(DICTIONARIES)) {
      for (const k of Object.values(PAYWALL_AURA)) expect(String(dict[k]).length).toBeLessThanOrEqual(120);
    }
  });
});

describe('« Une question ? » : réponses rapides tirées de la formule choisie et des droits réels', () => {
  const cards = offerCards(demoPlans('fr-FR'), demoFamilyPlans('fr-FR'), 'fr-FR');
  const monthly = cards.find((c) => c.key === 'premium:monthly')!;
  it('essai : durée, date du premier prélèvement, crédits Aura au premier paiement', () => {
    const [trial, billing, coparent] = helpAnswers(monthly, NOW).map((x) => nb(x.a));
    expect(trial).toContain('pendant 3 jours');
    expect(trial).toContain('avant le 6 décembre');
    expect(trial).toContain('1 000 crédits Aura arrivent avec le premier paiement');
    expect(billing).toContain('14,99 € par mois');
    expect(billing).toContain('au moins 24 h avant l’échéance');
    expect(coparent).toContain('Premium inclut toi et un autre adulte du foyer');
    expect(coparent).toContain('Avec Famille : tous les adultes du foyer');
  });
  it('sans essai : paiement immédiat annoncé', () => {
    const [trial] = helpAnswers({ ...monthly, trialDays: 0, plan: { ...monthly.plan, trialDays: 0 } }, NOW).map((x) => nb(x.a));
    expect(trial).toContain('n’a pas d’essai : 14,99 € sont prélevés aujourd’hui');
  });
  it('aucune formule : aucune réponse inventée', () => expect(helpAnswers(null, NOW)).toEqual([]));
});

describe('preuve sociale et histoire : sources tracées', () => {
  it('note du programme de test : moyenne et dénominateur validés, présentée comme un retour de test', () => {
    expect(TESTER_PROOF).toMatchObject({ rating: 4.8, ratingCount: 100, validatedOn: '2026-11-21' });
    expect(nb(tr('fw.pw.proof.score', { rating: '4,8', count: TESTER_PROOF.ratingCount }))).toBe('4,8/5 · 100 parents testeurs');
    expect(tr('fw.pw.proof.source')).toBe('Retours du programme de test HOMI');
  });
  it('histoire de l’équipe validée : titre, première phrase et signature', () => {
    expect(FOUNDER_STORY.validatedOn).toBe('2026-11-21');
    expect(tr('fw.pw.story.title')).toBe('Un mot de l’équipe');
    expect(tr('fw.pw.story.body').startsWith('Tout est parti d’une maman et de son idée.')).toBe(true);
    expect(tr('fw.pw.story.sign')).toBe('— L’équipe HOMI');
    // une intention et une expérience vécue, jamais une promesse de résultat
    expect(tr('fw.pw.story.body')).not.toMatch(/sauv|garanti|promet/i);
  });
});
