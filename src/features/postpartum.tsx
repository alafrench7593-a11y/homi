/**
 * Briques d'interface du suivi post-partum : échelle 1–5, panneau d'urgence,
 * propositions de soutien, mini-tendance animée, sources.
 * Couleurs : uniquement celles du thème existant.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Linking, Pressable, View } from 'react-native';
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

// ------------------------------------------------------------------ échelle 1 à 5
export function Scale({ label, value, onChange, low, high }: { label: string; value: number | null; onChange: (v: number | null) => void; low: string; high: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text weight="medium">{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => <ScaleDot key={n} n={n} selected={value === n} onPress={() => { haptic('selection'); onChange(value === n ? null : n); }} label={`${label} : ${n} sur 5${n === 1 ? ` (${low})` : n === 5 ? ` (${high})` : ''}`} />)}
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
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={label} onPress={onPress} style={{ flex: 1 }}>
      <Animated.View style={[{
        minHeight: MIN_TOUCH, borderRadius: radius.md, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center',
        borderColor: selected ? t.colors.primary : t.colors.border, backgroundColor: selected ? t.colors.primary : t.colors.surface,
      }, pop]}>
        <Text weight="bold" color={selected ? t.colors.primaryText : t.colors.text}>{n}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ------------------------------------------------------------------ urgence
export function DangerPanel({ country = 'FR' }: { country?: string }) {
  const t = useTheme();
  const toast = useToast();
  return (
    <Banner tone="danger" title="Vous méritez d’être aidée tout de suite">
      <Text variant="small">
        Appelez maintenant. Si vous le pouvez, demandez à quelqu’un de rester avec vous et de garder le bébé en sécurité. Vous n’avez rien à justifier.
      </Text>
      <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
        {emergencyContacts(country).map((e) => (
          <Pressable
            key={e.phone}
            accessibilityRole="button"
            accessibilityLabel={`Appeler le ${e.phone.split('').join(' ')}, ${e.label}`}
            onPress={() => { haptic('warning'); Linking.openURL(`tel:${e.phone}`).catch(() => toast(`Composez le ${e.phone} depuis votre téléphone.`, 'error')); }}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH + 8, padding: spacing.sm, borderRadius: radius.md, backgroundColor: t.colors.surface, opacity: pressed ? 0.85 : 1 })}
          >
            <Text weight="bold" color={t.colors.danger} style={{ fontSize: 20, minWidth: 52 }}>{e.phone}</Text>
            <View style={{ flex: 1 }}>
              <Text weight="bold">{e.label}</Text>
              <Text variant="caption" muted>{e.when}</Text>
            </View>
            <Icon name="phone" size={18} color={t.colors.danger} />
          </Pressable>
        ))}
      </View>
      <Text variant="caption" style={{ marginTop: 6 }}>L’application ne prévient personne à votre place : une notification ne remplace jamais une aide humaine.</Text>
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
      <Text variant="caption" muted style={{ marginTop: 6 }}>Des pistes, pas des obligations. Rien n’est envoyé à personne sans votre accord.</Text>
    </Card>
  );
}

// ------------------------------------------------------------------ mini-tendance (14 jours)
export function MiniTrend({ label, points, positive, description }: { label: string; points: TrendPoint[]; positive: boolean; description: string }) {
  const t = useTheme();
  const summary = points.filter((p) => p.value != null).map((p) => `${new Date(`${p.date}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : ${p.value}`).join(', ');
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${label}. ${summary || 'Aucun jour noté'}. ${description}`} style={{ gap: 6 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text weight="medium">{label}</Text>
        <Text variant="caption" muted>14 derniers jours</Text>
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
              <Pressable key={k} accessibilityRole="link" onPress={() => void Linking.openURL(SOURCES[k].url)} style={{ minHeight: 32, justifyContent: 'center' }}>
                <Text variant="caption" color={t.colors.primary}>Source : {SOURCES[k].publisher} — {SOURCES[k].title}</Text>
              </Pressable>
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
    <Banner tone="warning" title="Quand agir vite">
      <Text variant="small" weight="bold" style={{ marginTop: 2 }}>Appelez le 15 (ou le 112) :</Text>
      {RECOVERY_WARNINGS.call15.map((x) => <Text key={x} variant="small">• {x}</Text>)}
      <Text variant="small" weight="bold" style={{ marginTop: 6 }}>Contactez le jour même votre sage-femme ou votre médecin (sinon le 15) :</Text>
      {RECOVERY_WARNINGS.callPro.map((x) => <Text key={x} variant="small">• {x}</Text>)}
      <Text variant="caption" muted style={{ marginTop: 6 }}>Cette application ne peut pas dire si un symptôme fait partie d’une récupération normale.</Text>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(src.url)} style={{ minHeight: 32, justifyContent: 'center' }}>
        <Text variant="caption" color={t.colors.primary}>Source : {src.publisher}</Text>
      </Pressable>
    </Banner>
  );
}

// ------------------------------------------------------------------ carte d'accueil
/**
 * Sur l'accueil : pour la mère, une invitation douce (jamais insistante) ; pour le conjoint,
 * uniquement ce qu'elle a choisi de partager (demande de relais, besoin de repos).
 */
export function PostpartumHomeCard({ youngestChildMonths, journeys }: { youngestChildMonths: number | null; journeys: string[] }) {
  const t = useTheme();
  const shared = useSharedWithMe();
  const { data: settings } = usePostpartumSettings();
  const checkins = usePostpartumCheckins(1);
  const ask = shared.data.find((s) => s.relay_requested || s.rest_need === 'high' || s.rest_need === 'some');
  if (ask) {
    return (
      <Card onPress={() => router.push('/postpartum/partner')} accessibilityLabel="Votre partenaire a partagé un besoin. Voir comment l’aider">
        <Row>
          <Icon name={ask.relay_requested ? 'repeat' : 'moon'} color={t.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text weight="bold">{ask.relay_requested ? 'Votre partenaire demande un relais' : 'Votre partenaire a besoin de repos'}</Text>
            <Text variant="small" muted>{ask.relay_note ?? 'Voir des gestes concrets pour l’aider.'}</Text>
          </View>
          <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
        </Row>
      </Card>
    );
  }
  const eligible = (settings?.active ?? false) || (journeys.includes('mother') && youngestChildMonths != null && youngestChildMonths < 12);
  if (!eligible || settings?.active === false) return null;
  const doneToday = checkins.data?.[0]?.checkin_date === todayISO();
  return (
    <Card tone="soft" onPress={() => router.push('/postpartum')} accessibilityLabel="Après la naissance : votre espace privé">
      <Row>
        <Icon name="sun" color={t.colors.heart} />
        <View style={{ flex: 1 }}>
          <Text weight="bold">{doneToday ? 'Après la naissance' : 'Et vous, comment ça va ?'}</Text>
          <Text variant="small" muted>{doneToday ? 'Votre point du jour est noté. Votre plan de soutien est là si besoin.' : 'Un point d’une minute, si vous en avez envie. Privé.'}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
      </Row>
    </Card>
  );
}
