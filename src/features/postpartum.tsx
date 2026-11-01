/**
 * Briques d'interface du suivi post-partum : échelle 1–5, panneau d'urgence,
 * propositions de soutien, mini-tendance animée, sources.
 * Couleurs : uniquement celles du thème existant.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Linking, View } from 'react-native';
import { router } from 'expo-router';
import { StaggerItem, usePop } from '@/components/Motion';
import { useToast } from '@/components/Overlays';
import { Banner, Card, haptic, Icon, ListRow, Row, Text } from '@/components/ui';
import { timeTo, duration } from '@/theme/motion';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { RECOVERY_WARNINGS, SOURCES, type Section } from '@/content/postpartum';
import { emergencyContacts, type SupportPlan, type TrendPoint } from '@/lib/domain/postpartum';
import { usePostpartumCheckins, usePostpartumSettings, useSharedWithMe } from '@/lib/data/hooks-postpartum';
import { todayISO } from '@/lib/domain/dates';
import { Tappable } from '@/components/Tappable';
import { t as tr, formatDate } from '@/i18n';

// ------------------------------------------------------------------ échelle 1 à 5
export function Scale({ label, value, onChange, low, high }: { label: string; value: number | null; onChange: (v: number | null) => void; low: string; high: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text weight="medium">{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => <ScaleDot key={n} n={n} selected={value === n} onPress={() => { haptic('selection'); onChange(value === n ? null : n); }} label={n === 1 || n === 5 ? tr('u1.pp.scaleNote', { label, n, note: n === 1 ? low : high }) : tr('u1.pp.scale', { label, n })} />)}
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption" muted>{low}</Text>
        <Text variant="caption" muted>{high}</Text>
      </Row>
    </View>
  );
}

function ScaleDot({ n, selected, onPress, label }: { n: number; selected: boolean; onPress: () => void; label: string }) {
  const t = useTheme();
  const pop = usePop(selected);
  return (
    <Tappable accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={label} onPress={onPress} style={{ flex: 1 }}>
      <Animated.View style={[{
        minHeight: MIN_TOUCH, borderRadius: radius.md, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center',
        borderColor: selected ? t.colors.primary : t.colors.border, backgroundColor: selected ? t.colors.primary : t.colors.surface,
      }, pop]}>
        <Text weight="bold" color={selected ? t.colors.primaryText : t.colors.text}>{n}</Text>
      </Animated.View>
    </Tappable>
  );
}

// ------------------------------------------------------------------ urgence
export function DangerPanel({ country = 'FR' }: { country?: string }) {
  const t = useTheme();
  const toast = useToast();
  return (
    <Banner tone="danger" title={tr('u1.pp.dangerTitle')}>
      <Text variant="small">
        {tr('u1.pp.dangerBody')}
      </Text>
      <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
        {emergencyContacts(country).map((e) => (
          <Tappable
            key={e.phone}
            accessibilityRole="button"
            accessibilityLabel={tr('u1.pp.callA11y', { phone: e.phone.split('').join(' '), label: e.label })}
            onPress={() => { haptic('warning'); Linking.openURL(`tel:${e.phone}`).catch(() => toast(tr('u1.pp.dial', { phone: e.phone }), 'error')); }}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH + 8, padding: spacing.sm, borderRadius: radius.md, backgroundColor: t.colors.surface, opacity: pressed ? 0.85 : 1 })}
          >
            <Text weight="bold" color={t.colors.danger} style={{ fontSize: 20, minWidth: 52 }}>{e.phone}</Text>
            <View style={{ flex: 1 }}>
              <Text weight="bold">{e.label}</Text>
              <Text variant="caption" muted>{e.when}</Text>
            </View>
            <Icon name="phone" size={18} color={t.colors.danger} />
          </Tappable>
        ))}
      </View>
      <Text variant="caption" style={{ marginTop: 6 }}>{tr('u1.pp.noNotify')}</Text>
    </Banner>
  );
}

// ------------------------------------------------------------------ propositions de soutien
export function SupportPlanCard({ plan, country }: { plan: SupportPlan; country?: string }) {
  if (plan.level === 'danger') return <DangerPanel country={country} />;
  if (plan.level === 'none') return <Banner tone="success" title={plan.title}>{plan.message}</Banner>;
  return (
    <Card tone="soft">
      <Text weight="bold">{plan.title}</Text>
      <Text variant="small" style={{ marginTop: 4 }}>{plan.message}</Text>
      <View style={{ marginTop: spacing.xs }}>
        {plan.actions.map((a, i) => (
          <StaggerItem key={a.key} index={i}>
            <ListRow icon={a.to ? 'arrow-right-circle' : 'check-circle'} title={a.label} subtitle={a.detail} onPress={a.to ? () => router.push(a.to as never) : undefined} />
          </StaggerItem>
        ))}
      </View>
      <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('u1.pp.leads')}</Text>
    </Card>
  );
}

// ------------------------------------------------------------------ mini-tendance (14 jours)
export function MiniTrend({ label, points, positive, description }: { label: string; points: TrendPoint[]; positive: boolean; description: string }) {
  const t = useTheme();
  const summary = points.filter((p) => p.value != null).map((p) => `${formatDate(`${p.date}T12:00:00`, { day: 'numeric', month: 'short' })} : ${p.value}`).join(', ');
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={tr('u1.pp.trendA11y', { label, summary: summary || tr('u1.pp.noDay'), description })} style={{ gap: 6 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text weight="medium">{label}</Text>
        <Text variant="caption" muted>{tr('u1.pp.last14')}</Text>
      </Row>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 54 }}>
        {points.map((p, i) => <TrendBar key={p.date} index={i} value={p.value} color={positive ? t.colors.lavender : t.colors.accent} empty={t.colors.border} />)}
      </View>
      <Text variant="caption" muted>{description}</Text>
    </View>
  );
}

function TrendBar({ value, index, color, empty }: { value: number | null; index: number; color: string; empty: string }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = timeTo(v, 1, duration.slow, reduce);
    const id = setTimeout(() => a.start(), reduce ? 0 : index * 30);
    return () => { clearTimeout(id); a.stop(); };
  }, [v, value, index, reduce]);
  const h = value == null ? 4 : 8 + (value / 5) * 46;
  return (
    <Animated.View style={{ flex: 1, height: h, borderRadius: 4, backgroundColor: value == null ? empty : color, opacity: value == null ? 0.6 : 1, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [h / 2, 0] }) }, { scaleY: v }] }} />
  );
}

// ------------------------------------------------------------------ contenus sourcés
export function SectionCard({ s, index }: { s: Section; index: number }) {
  const t = useTheme();
  return (
    <StaggerItem index={index}>
      <Card tone={s.id === 'urgent' ? 'soft' : 'surface'}>
        <Text weight="bold" accessibilityRole="header">{s.title}</Text>
        <View style={{ gap: 6, marginTop: 6 }}>
          {s.body.map((p, i) => <Text key={i} variant="small">{p}</Text>)}
        </View>
        {s.sources.length ? (
          <View style={{ marginTop: spacing.xs, gap: 2 }}>
            {s.sources.map((k) => (
              <Tappable key={k} accessibilityRole="link" onPress={() => void Linking.openURL(SOURCES[k].url)} style={{ minHeight: 32, justifyContent: 'center' }}>
                <Text variant="caption" color={t.colors.primary}>{tr('u1.pp.source', { publisher: SOURCES[k].publisher, title: SOURCES[k].title })}</Text>
              </Tappable>
            ))}
          </View>
        ) : null}
      </Card>
    </StaggerItem>
  );
}

// ------------------------------------------------------------------ récupération physique : signes d'alerte
export function RecoveryWarnings() {
  const t = useTheme();
  const src = SOURCES[RECOVERY_WARNINGS.source];
  return (
    <Banner tone="warning" title={tr('u1.pp.actFast')}>
      <Text variant="small" weight="bold" style={{ marginTop: 2 }}>{tr('u1.pp.call15')}</Text>
      {RECOVERY_WARNINGS.call15.map((x) => <Text key={x} variant="small">• {x}</Text>)}
      <Text variant="small" weight="bold" style={{ marginTop: 6 }}>{tr('u1.pp.callPro')}</Text>
      {RECOVERY_WARNINGS.callPro.map((x) => <Text key={x} variant="small">• {x}</Text>)}
      <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('u1.pp.cannotTell')}</Text>
      <Tappable accessibilityRole="link" onPress={() => void Linking.openURL(src.url)} style={{ minHeight: 32, justifyContent: 'center' }}>
        <Text variant="caption" color={t.colors.primary}>{tr('u1.pp.sourceOnly', { publisher: src.publisher })}</Text>
      </Tappable>
    </Banner>
  );
}

// ------------------------------------------------------------------ carte d'accueil
/**
 * Sur l'accueil : pour la mère, une invitation douce (jamais insistante) ; pour le conjoint,
 * uniquement ce qu'elle a choisi de partager (demande de relais, besoin de repos).
 */
export function PostpartumHomeCard({ main }: { main?: boolean }) {
  const t = useTheme();
  const shared = useSharedWithMe();
  const checkins = usePostpartumCheckins(1);
  const ask = shared.data.find((s) => s.relay_requested || s.rest_need === 'high' || s.rest_need === 'some');
  if (ask) {
    return (
      <Card onPress={() => router.push('/postpartum/partner')} accessibilityLabel={tr('u1.pp.partnerA11y')}>
        <Row>
          <Icon name={ask.relay_requested ? 'repeat' : 'moon'} color={t.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text weight="bold">{ask.relay_requested ? tr('u1.pp.partnerRelay') : tr('u1.pp.partnerRest')}</Text>
            <Text variant="small" muted>{ask.relay_note ?? tr('u1.pp.partnerHelp')}</Text>
          </View>
          <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
        </Row>
      </Card>
    );
  }
  // Parcours post-partum actif = carte principale ; ailleurs, seulement ce que la partenaire a choisi de partager
  if (!main) return null;
  const doneToday = checkins.data?.[0]?.checkin_date === todayISO();
  return (
    <Card tone="soft" onPress={() => router.push('/postpartum')} accessibilityLabel={tr('u1.pp.homeA11y')}>
      <Row>
        <Icon name="sun" color={t.colors.heart} />
        <View style={{ flex: 1 }}>
          <Text weight="bold">{doneToday ? tr('u1.pp.afterBirth') : tr('u1.pp.howAreYou')}</Text>
          <Text variant="small" muted>{doneToday ? tr('u1.pp.doneToday') : tr('u1.pp.oneMinute')}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
      </Row>
    </Card>
  );
}
