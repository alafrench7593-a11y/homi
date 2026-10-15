/**
 * Minuteur biberon : composants partagés (choix du délai, carte d'un enfant, réglages de notification).
 * Rien n'est recommandé : délais et quantités sont ceux que le parent choisit ou saisit.
 */
import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import { ProgressRing } from '@/components/Charts';
import { Banner, Button, Card, Chip, Field, Icon, Row, Text, Toggle } from '@/components/ui';
import { useBottleNotificationSettings, useBottleTimer, useNow } from '@/lib/data/hooks-bottle';
import {
  DELAY_PRESETS, formatHM, formatRemaining, parseDelay, remainingMinutes, timerProgress, timerSentence, type ReminderChoice,
} from '@/lib/domain/bottleTimer';
import type { Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export const NO_RECOMMENDATION_NOTE = 'L’application ne propose ni quantité ni rythme : elle affiche uniquement ce que vous avez saisi, ou ce que vous a indiqué un professionnel de santé.';

/** Lecture d'une quantité facultative en ml (vide = non renseignée). */
export function parseMl(text: string): { value: number | null; error: string | null } {
  const s = text.trim();
  if (!s) return { value: null, error: null };
  const n = Number(s.replace(',', '.'));
  if (!Number.isInteger(n) || n < 0 || n > 500) return { value: null, error: 'Quantité attendue entre 0 et 500 ml (nombre entier).' };
  return { value: n, error: null };
}

/**
 * Choix du prochain rappel : « Aucun rappel », « Rappel dans… » (2 h, 3 h, 3 h 30, 4 h, durée personnalisée),
 * « Reprendre l'intervalle précédent » (dernier délai utilisé pour CET enfant).
 */
export function ReminderChoicePicker({ value, onChange, lastInterval, allowNone = true }: { value: ReminderChoice; onChange: (c: ReminderChoice) => void; lastInterval: number | null; allowNone?: boolean }) {
  const isPreset = value.kind === 'delay' && DELAY_PRESETS.some((p) => p.minutes === value.minutes);
  const [custom, setCustom] = useState(value.kind === 'delay' && !isPreset ? formatHM(value.minutes) : '');
  const [customOpen, setCustomOpen] = useState(value.kind === 'delay' && !isPreset);
  const [error, setError] = useState<string | null>(null);
  const applyCustom = (text: string) => {
    setCustom(text);
    if (!text.trim()) return setError(null);
    const m = parseDelay(text);
    if (m == null) return setError('Durée entre 10 min et 12 h, par exemple 3h30 ou 45 min.');
    setError(null);
    onChange({ kind: 'delay', minutes: m });
  };
  return (
    <View style={{ gap: spacing.xs }}>
      <Row wrap>
        {allowNone && <Chip label="Aucun rappel" icon="bell-off" selected={value.kind === 'none'} onPress={() => { setCustomOpen(false); onChange({ kind: 'none' }); }} />}
        {lastInterval != null && (
          <Chip label={`Reprendre l’intervalle précédent (${formatHM(lastInterval)})`} icon="rotate-ccw" selected={value.kind === 'previous'} onPress={() => { setCustomOpen(false); onChange({ kind: 'previous', minutes: lastInterval }); }} />
        )}
      </Row>
      <Text variant="small" muted>Rappel dans…</Text>
      <Row wrap>
        {DELAY_PRESETS.map((p) => (
          <Chip key={p.minutes} label={p.label} selected={!customOpen && value.kind === 'delay' && value.minutes === p.minutes} onPress={() => { setCustomOpen(false); onChange({ kind: 'delay', minutes: p.minutes }); }} />
        ))}
        <Chip label="Durée personnalisée" icon="edit-3" selected={customOpen} onPress={() => { setCustomOpen(true); if (custom) applyCustom(custom); }} />
      </Row>
      {customOpen && (
        <Field label="Durée avant le rappel" placeholder="3h30, 2h15, 45 min…" value={custom} onChangeText={applyCustom} error={error} autoCapitalize="none" autoCorrect={false} />
      )}
    </View>
  );
}

/** Carte « Minuteur biberon » d'un enfant (profil de l'enfant, liste de tous les minuteurs). */
export function BottleTimerCard({ child }: { child: Child }) {
  const t = useTheme();
  const now = useNow(15_000);
  const { active, isLoading } = useBottleTimer(child.id);
  const open = () => router.push({ pathname: '/bottle/[childId]', params: { childId: child.id } });
  if (isLoading) return null;
  if (!active) {
    return (
      <Card onPress={open} accessibilityLabel={`Minuteur biberon de ${child.first_name} : aucun rappel en cours. Ouvrir.`}>
        <Row>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="clock" size={20} color={t.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="medium">Minuteur biberon</Text>
            <Text variant="small" muted>Aucun rappel en cours pour {child.first_name}.</Text>
          </View>
          <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
        </Row>
      </Card>
    );
  }
  const rem = remainingMinutes(active, now);
  return (
    <Card onPress={open} accessibilityLabel={`${timerSentence({ childName: child.first_name, timer: active, now })} Ouvrir le minuteur.`}>
      <Row>
        <ProgressRing progress={timerProgress(active, now)} size={64} label={`Avancement du minuteur de ${child.first_name}`}>
          <Icon name={rem > 0 ? 'clock' : 'bell'} size={20} color={rem > 0 ? t.colors.primary : t.colors.danger} />
        </ProgressRing>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="medium">Minuteur biberon · {child.first_name}</Text>
          <Text variant="heading">{rem > 0 ? `dans ${formatRemaining(rem)}` : `prévu il y a ${formatHM(rem)}`}</Text>
          <Text variant="small" muted numberOfLines={2}>{timerSentence({ childName: child.first_name, timer: active, now })}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
      </Row>
    </Card>
  );
}

/** État de l'autorisation + interrupteur propre à cet appareil. Le minuteur dans l'app fonctionne dans tous les cas. */
export function BottleNotificationSettings() {
  const s = useBottleNotificationSettings();
  const [asking, setAsking] = useState(false);
  if (!s.supported) {
    return (
      <Banner tone="info" icon="bell-off" title="Notifications indisponibles ici">
        {Platform.OS === 'web'
          ? 'Sur la version web, le minuteur s’affiche dans l’application mais aucune notification n’est envoyée. Installez l’application sur votre téléphone pour être prévenu, même application fermée.'
          : 'Ce support ne permet pas les notifications. Le minuteur reste visible dans l’application.'}
      </Banner>
    );
  }
  return (
    <Card>
      <Row>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="medium">Notifications du minuteur biberon</Text>
          <Text variant="small" muted>Sur cet appareil uniquement. Désactivées, le minuteur reste affiché dans l’application.</Text>
        </View>
        <Toggle value={s.enabled} onChange={(v) => { s.setEnabled(v).catch(() => undefined); }} label="Notifications du minuteur biberon sur cet appareil" />
      </Row>
      {s.enabled && s.permission === 'granted' && <Text variant="small" muted style={{ marginTop: spacing.xs }}>Autorisation accordée : vous serez prévenu à l’heure prévue, même application fermée (selon les réglages du téléphone).</Text>}
      {s.enabled && s.permission === 'undetermined' && (
        <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
          <Text variant="small">Pour être prévenu à l’heure du rappel, même quand l’application est fermée, le téléphone doit vous demander l’autorisation d’afficher des notifications. Vous pourrez la retirer à tout moment dans les réglages.</Text>
          <Button label="Autoriser les notifications" icon="bell" size="sm" loading={asking} style={{ alignSelf: 'flex-start' }} onPress={async () => { setAsking(true); await s.request().catch(() => undefined); setAsking(false); }} />
        </View>
      )}
      {s.enabled && s.permission === 'denied' && (
        <Banner tone="warning" icon="bell-off">{'Les notifications sont refusées dans les réglages du téléphone. Le minuteur fonctionne dans l’application ; pour être prévenu, autorisez « Toi & Moi » dans Réglages > Notifications.'}</Banner>
      )}
    </Card>
  );
}

/** Copie dans le presse-papiers quand c'est possible (web) ; sinon false (texte sélectionnable à l'écran). */
export async function copyText(text: string): Promise<boolean> {
  try {
    const nav = (globalThis as { navigator?: { clipboard?: { writeText?: (s: string) => Promise<void> } } }).navigator;
    if (Platform.OS === 'web' && nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }
  } catch {
    // refusé par le navigateur
  }
  return false;
}
