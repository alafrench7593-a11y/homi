/**
 * Carte de conseil contextualisée : niveau (icône + texte, jamais la couleur seule), titre, explication,
 * « d'après ce que vous avez indiqué » (déclencheurs), question de précision facultative, actions, sources.
 * Apparition douce et légère profondeur ; aucune animation dramatique, aucun clignotement.
 */
import React from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { orderSources, ADVICE_REVIEWED_ON } from '@/lib/advice/sources';
import type { ActionId, Advice, Priority } from '@/lib/advice/types';
import { getLocale, t as tr, type TKey } from '@/i18n';
import { useUiStore } from '@/lib/store';
import { deviceRegion } from '@/i18n';
import { defaultRegion } from '@/i18n/locales';
import { spacing } from '@/theme/tokens';
import { useEmergencyNumbers } from './emergency';
import { fmtDay, fmtDayYear } from './format';
import { CycleIcon, Glass, Ink, Rise, useCyclePalette, type CycleIconName } from './kit';

const PRIO_ICON: Record<Priority, CycleIconName> = { info: 'guide', practical: 'symptoms', followup: 'calendar', consult: 'documents', prompt: 'reminders', emergency: 'bleeding' };

/** Fiche pédagogique la plus proche d'un conseil sur les pertes (pour « En savoir plus »). */
const GUIDE_OF: Record<string, string> = {
  'dis_signs.itch': 'itching', 'dis_signs.odor': 'unusual-odor', 'dis_signs.pain': 'itching', 'dis_color.alone': 'yellow-green',
  'dis_info.clear_fertile': 'stretchy-slippery', 'dis_info.clear': 'clear-fluid', 'dis_info.white': 'white-creamy',
  'dis_blood.near_period': 'pink-brown', 'dis_blood.unexplained': 'pink-brown', 'dis_blood.pain': 'pink-brown',
};
export function editHref(a: Advice): string {
  switch (a.event.type) {
    case 'sex': return `/cycle/intimacy?id=${a.event.id}`;
    case 'pain': return `/cycle/pain?date=${a.event.date}`;
    case 'discharge': return `/cycle/discharge/${a.event.id}`;
    case 'bleeding': return `/cycle/bleeding?id=${a.event.id}`;
    default: return '/cycle?all=1';
  }
}
const EC_URL = { FR: 'https://questionsexualite.fr/choisir-sa-contraception/la-contraception-d-urgence/contraception-d-urgence-comment-ca-marche', other: 'https://www.nhs.uk/contraception/emergency-contraception/' };

export function useRegion() {
  const region = useUiStore((s) => s.region);
  return region ?? defaultRegion(deviceRegion());
}

export function AdviceCard({ advice, isNew, compact, delay = 0 }: { advice: Advice; isNew?: boolean; compact?: boolean; delay?: number }) {
  const c = useCyclePalette();
  const toast = useToast();
  const numbers = useEmergencyNumbers();
  const region = useRegion();
  const loc = getLocale();
  const LANGS = ['fr', 'en', 'es', 'de', 'it'] as const;
  const lang: (typeof LANGS)[number] = (LANGS as readonly string[]).includes(loc) ? (loc as (typeof LANGS)[number]) : 'fr';
  // Les dates passées en paramètre sont affichées dans la langue active
  const params = { ...Object.fromEntries(Object.entries(advice.params).map(([k, v]) => [k, typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? fmtDay(v) : v])), numbers };
  const k = `adv.${advice.ruleId}.${advice.variant}`;
  const urgent = advice.priority === 'emergency';
  const tone = { info: c.lavender, practical: c.beige, followup: c.pearl, consult: c.powder, prompt: c.powder, emergency: c.powder }[advice.priority];
  const sources = orderSources(advice.sources, lang, region);

  const open = (url: string) => Linking.openURL(url).catch(() => toast(tr('pro.openError'), 'error'));
  function act(id: ActionId) {
    switch (id) {
      case 'emergency': return router.push('/emergency');
      case 'find_pro': return router.push(`/cycle/professional?reason=${advice.ruleId}` as never);
      case 'pregnancy_risk': return router.push('/cycle/risk' as never);
      case 'ec_info': return open(region === 'FR' ? EC_URL.FR : EC_URL.other);
      case 'edit': return router.push(editHref(advice) as never);
      case 'review': return router.push('/cycle/calendar' as never);
      case 'learn': {
        const g = GUIDE_OF[`${advice.ruleId}.${advice.variant}`];
        if (g) return router.push(`/cycle/guides/${g}` as never);
        return sources[0] ? open(sources[0].url) : undefined;
      }
    }
  }
  const eventLabel = advice.event.type === 'cycle' ? tr('adv.ui.event.cycle') : tr(`adv.ui.event.${advice.event.type}` as TKey, { date: fmtDay(advice.event.date) });

  return (
    <Rise delay={delay}>
      <Glass style={urgent ? { borderColor: c.danger, borderWidth: 1.5 } : undefined}>
        <View accessibilityRole={urgent ? 'alert' : undefined} style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: tone, maxWidth: '100%' }}>
              <CycleIcon name={PRIO_ICON[advice.priority]} size={16} color={urgent ? c.danger : c.mauve} />
              <Ink variant="caption" weight="bold" style={urgent ? { color: c.danger } : undefined}>{tr(`adv.prio.${advice.priority}` as TKey)}</Ink>
            </View>
            {isNew ? <Ink variant="caption" weight="bold" style={{ color: c.mauve }}>{tr('adv.ui.new')}</Ink> : null}
            <Ink variant="caption" soft style={{ flexShrink: 1 }}>{eventLabel}</Ink>
          </View>
          <Ink variant="heading">{tr(`${k}.title` as TKey, params)}</Ink>
          {!compact ? <Ink>{tr(`${k}.body` as TKey, params)}</Ink> : null}
          {!compact && advice.triggers.length ? (
            <View style={{ gap: 4, padding: spacing.sm, borderRadius: 14, backgroundColor: c.pearl }}>
              <Ink variant="caption" weight="bold" soft>{tr('adv.ui.because')}</Ink>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {advice.triggers.map((t) => (
                  <View key={t.key} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: c.paper, maxWidth: '100%' }}>
                    <Ink variant="caption">{tr(`adv.trig.${t.key}` as TKey, t.params)}</Ink>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          {!compact && advice.clarify ? <Ink variant="small" weight="medium">{tr(`adv.q.${advice.clarify}` as TKey)}</Ink> : null}
          <View style={{ gap: spacing.xs }}>
            {(compact ? advice.actions.slice(0, 1) : advice.actions).map((id, i) => (
              <Button key={id} label={tr(`adv.action.${id}` as TKey)} size="sm" full
                variant={i === 0 ? (urgent ? 'danger' : 'primary') : 'ghost'} onPress={() => act(id)} />
            ))}
          </View>
          {!compact ? (
            <View style={{ gap: 2 }}>
              <Ink variant="caption" soft>{tr('adv.ui.notDiagnosis')}</Ink>
              {sources.length ? (
                <Ink variant="caption" soft>{`${tr('adv.ui.sources')}${lang === 'fr' || lang === 'en' ? ' : ' : ': '}${sources.map((s) => s.org).filter((v, i, arr) => arr.indexOf(v) === i).join(', ')}`}</Ink>
              ) : null}
              {sources.slice(0, 2).map((s) => (
                <Button key={s.id} label={`${s.org} — ${s.title}`} variant="ghost" size="sm" icon="external-link" onPress={() => open(s.url)} />
              ))}
              <Ink variant="caption" soft>{tr('adv.ui.reviewed', { date: fmtDayYear(advice.reviewedOn || ADVICE_REVIEWED_ON) })}</Ink>
            </View>
          ) : null}
        </View>
      </Glass>
    </Rise>
  );
}
