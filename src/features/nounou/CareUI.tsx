/**
 * Espace Nounou — éléments d'interface partagés : chronologie du carnet, récapitulatif sans invention, mention fixe,
 * rappel d'urgence, vignette de photo (lien signé de quelques minutes), en-tête de l'enfant.
 * Jetons du thème uniquement ; textes via t() ; lisibles à 320 pt et en grande taille de texte.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Banner, Button, Card, Icon, Text, Toggle, type IconName } from '@/components/ui';
import { Tappable } from '@/components/Tappable';

/** Interrupteur avec son libellé visible (le libellé de Toggle n'est lu que par VoiceOver). */
export function ToggleRow({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs }}>
      <Text style={{ flex: 1 }} importantForAccessibility="no" accessibilityElementsHidden>{label}</Text>
      <Toggle value={value} onChange={onChange} label={label} />
    </View>
  );
}
import { t as tr, type TKey } from '@/i18n';
import { formatDuration, formatTime } from '@/lib/domain/dates';
import { sleepMinutes, summarizeDay, type CareItem } from '@/lib/domain/nounou';
import { useCarePhotoUrl, type MemberName } from '@/lib/data/hooks-nounou';
import { useUserId } from '@/lib/auth';

export const KIND_ICON: Record<CareItem['kind'], IconName> = {
  bottle: 'droplet', meal: 'coffee', sleep: 'moon', diaper: 'refresh-cw', activity: 'sun', observation: 'eye',
  arrival: 'log-in', departure: 'log-out', photo: 'camera',
};
export const KIND_LABEL: Record<CareItem['kind'], TKey> = {
  bottle: 'nn.kind.bottle', meal: 'nn.kind.meal', sleep: 'nn.kind.sleep', diaper: 'nn.kind.diaper', activity: 'nn.kind.activity',
  observation: 'nn.kind.observation', arrival: 'nn.kind.arrival', departure: 'nn.kind.departure', photo: 'nn.kind.photo',
};

/** Nom de l'auteur d'une saisie : « Vous », le prénom, ou le rôle (jamais l'adresse e-mail). */
export function useAuthorLabel(names: MemberName[] | undefined) {
  const me = useUserId();
  return (authorId: string | null, origin: string | null) => {
    if (authorId && authorId === me) return tr('nn.author.you');
    const n = names?.find((x) => x.user_id === authorId);
    if (n?.display_name) return n.display_name;
    if (origin === 'caregiver' || n?.role === 'caregiver') return tr('nn.author.caregiver');
    if (origin === 'custody') return tr('nn.author.custody');
    return tr('nn.author.parent');
  };
}

/** Mention fixe et sobre, affichée avec le carnet et le récapitulatif. */
export function AbsenceNote() {
  return <Text variant="small" muted testID="care-absence-note">{tr('nn.absence')}</Text>;
}

/** Rappel fixe de l'écran « Information importante » : HOMI ne remplace pas une procédure d'urgence. */
export function EmergencyNote() {
  return (
    <Banner tone="danger" title={tr('nn.emergency.title')}
      action={<Button label={tr('nn.emergency.numbers')} icon="phone" size="sm" variant="secondary" style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }} onPress={() => router.push('/emergency' as never)} testID="care-emergency-numbers" />}>
      {tr('nn.emergency.body')}
    </Banner>
  );
}

/** Détail lisible d'une saisie (valeurs saisies seulement). */
export function itemDetail(it: CareItem): string {
  const r = it.row;
  const parts: string[] = [];
  const s = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  switch (it.kind) {
    case 'bottle':
      if (typeof r.consumed_ml === 'number') parts.push(tr('nn.detail.ml', { n: r.consumed_ml }));
      else parts.push(tr('nn.detail.noAmount'));
      if (s(r.milk_type)) parts.push(milkLabel(String(r.milk_type)));
      if (s(r.note)) parts.push(String(r.note));
      break;
    case 'meal':
      if (Array.isArray(r.foods) && r.foods.length) parts.push((r.foods as string[]).join(', '));
      else if (s(r.description)) parts.push(String(r.description));
      if (s(r.eaten_amount)) parts.push(tr(`nn.amount.${String(r.eaten_amount)}` as TKey));
      if (s(r.reaction_note)) parts.push(String(r.reaction_note));
      break;
    case 'sleep': {
      const m = sleepMinutes(it.at, it.endAt);
      parts.push(m == null ? tr('nn.detail.sleepOngoing') : `${formatTime(it.at)} → ${formatTime(String(it.endAt))} · ${formatDuration(m)}`);
      if (s(r.note)) parts.push(String(r.note));
      break;
    }
    case 'diaper':
      parts.push(r.wet && r.stool ? tr('nn.diaper.both') : r.stool ? tr('nn.diaper.stool') : r.wet ? tr('nn.diaper.wet') : tr('nn.diaper.other'));
      if (s(r.note)) parts.push(String(r.note));
      break;
    case 'activity':
      if (s(r.activity_type)) parts.push(tr(`nn.act.${String(r.activity_type)}` as TKey));
      if (s(r.note)) parts.push(String(r.note));
      break;
    case 'observation':
      if (it.important && s(r.important_kind) && r.kind !== 'temperature') parts.push(tr(`nn.imp.${String(r.important_kind)}` as TKey));
      if (r.kind === 'temperature' && typeof r.value_num === 'number') parts.push(tr('nn.detail.temp', { v: String(r.value_num).replace('.', ',') }));
      if (s(r.mood)) parts.push(tr(`nn.mood.${String(r.mood)}` as TKey));
      if (s(r.difficulty)) parts.push(String(r.difficulty));
      if (s(r.to_share)) parts.push(String(r.to_share));
      if (s(r.note)) parts.push(String(r.note));
      break;
    case 'photo':
      if (s(r.caption)) parts.push(String(r.caption));
      break;
    default:
      if (s(r.note)) parts.push(String(r.note));
  }
  return parts.join(' · ');
}
export function milkLabel(v: string) {
  return v === 'breast_milk' ? tr('nn.milk.breast') : v === 'infant_formula' ? tr('nn.milk.formula') : v === 'other' ? tr('nn.milk.other') : v;
}

/** Une ligne de la chronologie : heure, type, détail, auteur ; « en attente d'envoi » si elle est encore sur le téléphone. */
export function CareRow({ item, author, onEndSleep, ending }: { item: CareItem; author: string; onEndSleep?: () => void; ending?: boolean }) {
  const t = useTheme();
  const important = item.important === true;
  const detail = itemDetail(item);
  const label = important ? tr('nn.kind.important') : tr(KIND_LABEL[item.kind]);
  return (
    <View testID={`care-row-${item.kind}`} accessible accessibilityLabel={`${formatTime(item.at)}, ${label}${detail ? `, ${detail}` : ''}, ${tr('nn.by', { name: author })}${item.pending ? `, ${tr('nn.pending')}` : ''}`}
      style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm, borderLeftWidth: important ? 4 : 0, borderLeftColor: t.colors.danger, paddingLeft: important ? spacing.sm : 0 }}>
      <View style={{ width: 52 }}>
        <Text weight="bold">{formatTime(item.at)}</Text>
      </View>
      <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: important ? t.colors.dangerSoft : t.colors.surfaceAlt }}>
        <Icon name={important ? 'alert-triangle' : KIND_ICON[item.kind]} size={16} color={important ? t.colors.danger : t.colors.text} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="bold" color={important ? t.colors.danger : undefined}>{label}</Text>
        {detail ? <Text variant="small">{detail}</Text> : null}
        <Text variant="caption" muted>{tr('nn.by', { name: author })}{item.pending ? ` · ${tr('nn.pending')}` : ''}</Text>
        {item.kind === 'sleep' && !item.endAt && onEndSleep && !item.pending ? (
          <Button label={tr('nn.sleep.end')} icon="sunrise" size="sm" loading={ending} style={{ alignSelf: 'flex-start', marginTop: spacing.xxs }} onPress={onEndSleep} testID="care-end-sleep" />
        ) : null}
      </View>
    </View>
  );
}

/** Vignette d'une photo : le lien signé (quelques minutes) est demandé à l'affichage. */
export function CarePhotoThumb({ path, size = 120, onPress, label }: { path: string; size?: number; onPress?: () => void; label: string }) {
  const t = useTheme();
  const url = useCarePhotoUrl(path);
  const body = url.data ? (
    <Image source={{ uri: url.data }} style={{ width: size, height: size, borderRadius: radius.md }} contentFit="cover" accessibilityLabel={label} transition={0} />
  ) : (
    <View style={{ width: size, height: size, borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={url.isError ? 'image' : 'loader'} size={18} color={t.colors.textMuted} />
    </View>
  );
  if (!onPress) return body;
  return <Tappable onPress={onPress} accessibilityRole="imagebutton" accessibilityLabel={label} testID="care-photo-thumb">{body}</Tappable>;
}

/** Récapitulatif « La journée de … » : enregistré / non renseigné, aucune estimation. */
export function DaySummaryCard({ name, items }: { name: string; items: CareItem[] }) {
  const t = useTheme();
  const s = summarizeDay(items);
  const none = tr('nn.sum.none');
  const lines: { icon: IconName; label: string; value: string; recorded: boolean; testID: string }[] = [
    { icon: 'log-in', label: tr('nn.kind.arrival'), value: s.arrival ? formatTime(s.arrival) : none, recorded: !!s.arrival, testID: 'sum-arrival' },
    { icon: 'droplet', label: tr('nn.sum.bottles'), recorded: s.bottles.count > 0, testID: 'sum-bottles',
      value: s.bottles.count === 0 ? none : [tr('nn.sum.count', { count: s.bottles.count }), s.bottles.totalMl != null ? tr('nn.sum.totalMl', { n: s.bottles.totalMl }) : null, s.bottles.withoutAmount ? tr('nn.sum.noAmount', { count: s.bottles.withoutAmount }) : null].filter(Boolean).join(' · ') },
    { icon: 'coffee', label: tr('nn.sum.meals'), value: s.meals.count ? tr('nn.sum.count', { count: s.meals.count }) : none, recorded: s.meals.count > 0, testID: 'sum-meals' },
    { icon: 'moon', label: tr('nn.sum.sleep'), recorded: s.sleep.count > 0, testID: 'sum-sleep',
      value: s.sleep.count === 0 ? none : [s.sleep.totalMinutes != null ? tr('nn.sum.sleepTotal', { d: formatDuration(s.sleep.totalMinutes) }) : null, s.sleep.ongoing ? tr('nn.sum.sleepOngoing') : null].filter(Boolean).join(' · ') },
    { icon: 'refresh-cw', label: tr('nn.sum.diapers'), value: s.diapers.count ? tr('nn.sum.count', { count: s.diapers.count }) : none, recorded: s.diapers.count > 0, testID: 'sum-diapers' },
    { icon: 'sun', label: tr('nn.sum.activities'), value: s.activities.count ? tr('nn.sum.count', { count: s.activities.count }) : none, recorded: s.activities.count > 0, testID: 'sum-activities' },
    { icon: 'eye', label: tr('nn.sum.observations'), recorded: s.observations.count > 0, testID: 'sum-observations',
      value: s.observations.count ? [tr('nn.sum.count', { count: s.observations.count }), s.observations.important ? tr('nn.sum.important', { count: s.observations.important }) : null].filter(Boolean).join(' · ') : none },
    { icon: 'camera', label: tr('nn.sum.photos'), value: s.photos.count ? tr('nn.sum.count', { count: s.photos.count }) : none, recorded: s.photos.count > 0, testID: 'sum-photos' },
    { icon: 'log-out', label: tr('nn.kind.departure'), value: s.departure ? formatTime(s.departure) : none, recorded: !!s.departure, testID: 'sum-departure' },
  ];
  return (
    <Card testID="care-day-summary">
      <Text variant="heading" style={{ marginBottom: spacing.xs }}>{tr('nn.sum.title', { name })}</Text>
      {lines.map((l) => (
        <View key={l.testID} testID={l.testID} accessible accessibilityLabel={`${l.label} : ${l.value}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: 6 }}>
          <View style={{ paddingTop: 3 }}><Icon name={l.icon} size={16} color={l.recorded ? t.colors.text : t.colors.textMuted} /></View>
          <View style={{ flex: 1 }}>
            <Text weight={l.recorded ? 'bold' : undefined}>{l.label}</Text>
            <Text variant="small" muted={!l.recorded}>{l.value}</Text>
          </View>
        </View>
      ))}
      <View style={{ marginTop: spacing.xs }}><AbsenceNote /></View>
    </Card>
  );
}

/** Erreur lisible, sans détail technique. */
export function careErrorKey(e: unknown): TKey | null {
  const m = (e as { message?: string } | null)?.message ?? '';
  if (/premium/i.test(m)) return 'nn.err.premium';
  if (/row-level security|42501|Accès refusé/i.test(m)) return 'nn.err.denied';
  return null;
}
