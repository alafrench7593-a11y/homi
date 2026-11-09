/**
 * « À savoir aujourd'hui » : une seule carte, avec son statut (information générale, tendance observée dans tes
 * données, sécurité), une action utile et deux retours (« Cette information m'aide » / « Cela ne me correspond pas »).
 * Situation d'un rapport (textes exacts) et informations de contraception d'urgence, toujours gratuites.
 */
import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { useToast } from '@/components/Overlays';
import { Button, Icon, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { useInsightFeedbackSave } from '@/lib/data/hooks-cycle3';
import { EC_PHONES, EC_SOURCES, ecWindows, INSIGHT_BADGE, pregnancyTestFrom, type Insight, type IntercourseInfo } from '@/lib/domain/cycleInsights';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const wantsSleep = (i: Insight) => i.action === 'addSleep';

export function insightText(i: Insight): string {
  const params: Record<string, string | number> = { ...i.params };
  if (typeof params.symptom === 'string') params.symptom = tr(`c3.noun.${params.symptom}` as TKey);
  return tr(i.key as TKey, params);
}

const TONE = {
  general: { icon: 'info', key: 'lavender' }, trend: { icon: 'trending-up', key: 'lavender' }, anticipation: { icon: 'trending-up', key: 'lavender' },
  safety: { icon: 'alert-triangle', key: 'warn' }, emergency: { icon: 'alert-circle', key: 'warn' },
} as const;

export function InsightView({ insight, onAction, compact }: { insight: Insight; onAction?: () => void; compact?: boolean }) {
  const t = useTheme();
  const toast = useToast();
  const save = useInsightFeedbackSave();
  const trends = usePremiumAccess('cycle_trends');
  const [answered, setAnswered] = useState(false);
  const warn = insight.kind === 'safety' || insight.kind === 'emergency';
  const accent = warn ? t.colors.danger : t.colors.primary;
  async function feedback(helpful: boolean) {
    try { await save.mutateAsync({ key: insight.id, helpful }); setAnswered(true); toast(tr('c3.home.thanks'), 'success'); } catch { setAnswered(true); }
  }
  const go = (href: string, params?: Record<string, string>) => { onAction?.(); router.push((params ? { pathname: href, params } : href) as never); };
  return (
    <View testID="c3-insight" style={{ gap: spacing.xs, padding: compact ? 0 : spacing.md, borderRadius: 20, backgroundColor: compact ? 'transparent' : t.colors.surfaceAlt }}>
      <Row gap={6}>
        <Icon name={TONE[insight.kind].icon} size={16} color={accent} />
        <Text variant="caption" weight="bold" color={accent} testID="c3-insight-badge">{tr(INSIGHT_BADGE[insight.kind] as TKey)}</Text>
      </Row>
      <Text testID="c3-insight-text">{insightText(insight)}</Text>
      {insight.trendLocked ? (
        <Tappable accessibilityRole="button" onPress={() => trends.showPreview()} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 36 }} testID="c3-trend-locked">
          <Icon name="star" size={14} color={t.colors.gold} />
          <Text variant="small" muted style={{ flex: 1 }}>{tr('c3.home.trendLocked')}</Text>
        </Tappable>
      ) : null}
      {insight.action === 'professional' ? <Button label={tr('c3.home.seeProfessional')} icon="user" size="sm" variant="secondary" onPress={() => go('/cycle/professional')} /> : null}
      {insight.action === 'emergency' ? <Button label={tr('c3.home.seeEmergency')} icon="info" size="sm" onPress={() => go('/cycle/emergency')} testID="c3-insight-ec" /> : null}
      {wantsSleep(insight) ? <Button label={tr('c3.home.addSleep')} icon="moon" size="sm" variant="ghost" onPress={() => go('/', { add: 'sleep' })} /> : null}
      {insight.action === 'summary' ? <Button label={tr('c3.home.addSummary')} icon="file-text" size="sm" variant="ghost" onPress={() => go('/cycle/recap')} /> : null}
      {insight.action === 'reminder' ? <Button label={tr('c3.home.prepareReminder')} icon="bell" size="sm" variant="ghost" onPress={() => go('/contraception/reminders')} /> : null}
      {!warn && !answered ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Button label={tr('c3.home.helps')} size="sm" variant="ghost" icon="thumbs-up" onPress={() => feedback(true)} testID="c3-helpful" />
          <Button label={tr('c3.home.notMe')} size="sm" variant="ghost" icon="x-circle" onPress={() => feedback(false)} testID="c3-notme" />
        </View>
      ) : null}
    </View>
  );
}

/** Situation estimée d'un rapport : textes exacts, protection déclarée, et accès immédiat aux informations d'urgence. */
export function IntercourseView({ info, date }: { info: IntercourseInfo; date: string }) {
  const t = useTheme();
  return (
    <View testID="c3-sex-info" style={{ gap: spacing.xs, padding: spacing.md, borderRadius: 20, borderWidth: 1, borderColor: t.colors.border }}>
      <Text weight="bold">{tr('c3.sex.title')}</Text>
      <Text testID="c3-sex-text">{tr(info.textKey as TKey)}</Text>
      {info.situation === 'near' ? <Text variant="small" muted>{tr('c3.sex.near')}</Text> : null}
      {info.protectionDeclared ? <Row gap={6}><Icon name="shield" size={14} color={t.colors.textMuted} /><Text variant="small" muted testID="c3-sex-protection">{tr('c3.sex.protection')}</Text></Row> : null}
      {info.needsEmergencyInfo ? <EmergencyInfo date={date} hoursSince={info.hoursSince} compact /> : null}
    </View>
  );
}

/** Contraception d'urgence : délais, où demander conseil, quand faire un test, sources officielles datées. */
export function EmergencyInfo({ date, hoursSince, compact }: { date?: string | null; hoursSince?: number | null; compact?: boolean }) {
  const t = useTheme();
  const windows = hoursSince != null ? ecWindows(hoursSince) : null;
  const call = (n: string) => void Linking.openURL(`tel:${n.replace(/\s/g, '')}`).catch(() => undefined);
  return (
    <View testID="c3-ec" style={{ gap: spacing.sm }}>
      <Text variant={compact ? 'body' : 'heading'} weight="bold">{tr('c3.ec.title')}</Text>
      <Text>{tr('c3.ec.intro')}</Text>
      {hoursSince != null && hoursSince >= 1 ? <Text variant="small" weight="bold" testID="c3-ec-hours">{tr('c3.ec.hoursSince', { count: hoursSince })}</Text> : null}
      <View style={{ gap: 4 }}>
        <Text weight="bold">{tr('c3.ec.delays')}</Text>
        {(windows ?? ecWindows(0).map((w) => ({ ...w, open: true }))).map((w) => (
          <Row key={w.id} gap={6} style={{ alignItems: 'flex-start' }}>
            <Icon name={windows ? (w.open ? 'clock' : 'alert-circle') : 'clock'} size={14} color={windows && !w.open ? t.colors.danger : t.colors.textMuted} />
            <Text variant="small" style={{ flex: 1 }}>{windows ? `${tr(w.key as TKey).replace(/\.$/, '')} — ${w.open ? tr('c3.ec.inDelay') : tr('c3.ec.outDelay')}.` : tr(w.key as TKey)}</Text>
          </Row>
        ))}
        <Text variant="small" muted>{tr('c3.ec.sooner')}</Text>
      </View>
      <View style={{ gap: 4 }}>
        <Text weight="bold">{tr('c3.ec.where')}</Text>
        <Text variant="small">{tr('c3.ec.pharmacy')}</Text>
        <Text variant="small">{tr('c3.ec.centres')}</Text>
        {EC_PHONES.map((p) => (
          <Tappable key={p.id} accessibilityRole="link" accessibilityLabel={tr('c3.ec.call', { number: p.number })} onPress={() => call(p.number)} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 40 }}>
            <Icon name="phone" size={14} color={t.colors.primary} />
            <Text variant="small" color={t.colors.primary} style={{ flex: 1 }}>{tr(p.key as TKey, { number: p.number })}</Text>
          </Tappable>
        ))}
      </View>
      <View style={{ gap: 4 }}>
        <Text weight="bold">{tr('c3.ec.test')}</Text>
        <Text variant="small">{date ? tr('c3.ec.testBody', { date: formatDate(`${pregnancyTestFrom(date)}T12:00:00`, { day: 'numeric', month: 'long' }) }) : tr('c3.ec.testBodyNoDate')}</Text>
      </View>
      <View style={{ gap: 4 }} testID="c3-ec-sources">
        <Text weight="bold">{tr('c3.ec.sources')}</Text>
        {EC_SOURCES.map((s) => (
          <Tappable key={s.id} accessibilityRole="link" onPress={() => void Linking.openURL(s.url).catch(() => undefined)}
            // Titre et date l'un sous l'autre (le cadre des liens est en ligne par défaut : le titre était écrasé sur 4 lignes)
            style={{ gap: 2, minHeight: 40, justifyContent: 'center', flexDirection: 'column', alignItems: 'flex-start', borderRadius: 18, paddingVertical: 8 }}>
            <Text variant="small" color={t.colors.primary}>{tr(s.titleKey as TKey)}</Text>
            <Text variant="caption" muted>{tr('c3.ec.srcMeta', { org: s.org, published: formatDate(`${s.published}T12:00:00`), checked: formatDate(`${s.checked}T12:00:00`) })}</Text>
          </Tappable>
        ))}
      </View>
      <Text variant="caption" muted>{tr('c3.ec.free')} {tr('c3.ec.notAdvice')}</Text>
    </View>
  );
}
