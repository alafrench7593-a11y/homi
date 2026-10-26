/**
 * « Ma prise du jour » (Gérer ma contraception), en un geste :
 * - pilule : « J'ai pris ma pilule aujourd'hui » coche le jour tout de suite (seconde touche : retirer) ;
 * - série de jours consécutifs cochés et bande des 7 derniers jours (perles d'or) ;
 * - patch / anneau : le geste note le changement ou la pose du jour.
 * Ne remplace pas la notice ni l'avis d'un professionnel ; un oubli se signale dans la saisie détaillée.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Card, Chip, haptic, Icon, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { tint } from '@/components/ToolGlyph';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { useContraceptionLogs } from '@/lib/data/hooks-cycle3';
import { insertOrQueue } from '@/lib/offline';
import { friendlyError } from '@/lib/data/hooks-settings';
import { dayStreak, lastWeek } from '@/lib/domain/cycleQuick';
import { todayISO } from '@/lib/domain/dates';
import type { ContraceptionMethodKind } from '@/lib/types-fertility';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const DAILY: Partial<Record<ContraceptionMethodKind, { kind: string; label: string; done: string; icon: 'check-circle' | 'refresh-cw' | 'circle' }>> = {
  pill: { kind: 'pill_taken', label: 'J’ai pris ma pilule aujourd’hui', done: 'Pilule prise aujourd’hui', icon: 'check-circle' },
  patch: { kind: 'patch_changed', label: 'J’ai changé mon patch aujourd’hui', done: 'Patch changé aujourd’hui', icon: 'refresh-cw' },
  ring: { kind: 'ring_inserted', label: 'J’ai posé mon anneau aujourd’hui', done: 'Anneau posé aujourd’hui', icon: 'circle' },
};
const LETTERS = ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'];

/** Méthode qui se prend ou se change à un jour précis, sinon null (rien à cocher). */
export function dailyKindFor(method: ContraceptionMethodKind | null | undefined) {
  return method ? DAILY[method] ?? null : null;
}

export function PillToday({ method }: { method: ContraceptionMethodKind }) {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const logsQ = useContraceptionLogs(120);
  const [busy, setBusy] = useState(false);
  const spec = dailyKindFor(method);
  if (!spec) return null;
  const today = todayISO();
  const rows = (logsQ.data ?? []).filter((l) => l.kind === spec.kind);
  const todayRow = rows.find((l) => l.logged_on === today) ?? null;
  const days = rows.map((l) => l.logged_on);
  const streak = dayStreak(days, today);
  const week = lastWeek(days, today);
  const gold = t.colors.gold;
  const daily = method === 'pill';

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (todayRow) {
        await backend.remove('contraception_logs', [eq('id', todayRow.id)]);
        toast('Prise du jour retirée.');
      } else {
        await insertOrQueue('contraception_logs', { user_id: userId, logged_on: today, kind: spec!.kind, label: null, note: null });
        toast(daily ? 'Prise du jour notée.' : 'Noté pour aujourd’hui.');
      }
      inv('contraception_logs');
      haptic('success');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <View style={{ gap: spacing.sm }} testID="contra-today">
        <Tappable bare accessibilityRole="button" accessibilityState={{ checked: !!todayRow, busy }} accessibilityLabel={todayRow ? `${spec.done}. Toucher pour retirer.` : spec.label}
          onPress={() => void toggle()} testID="contra-today-toggle"
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 22,
            backgroundColor: todayRow ? tint(gold, t.isDark ? 0.28 : 0.16) : tint(t.colors.primary, t.isDark ? 0.14 : 0.07),
            borderWidth: 1.5, borderColor: todayRow ? gold : tint(t.colors.primary, 0.3) }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: todayRow ? gold : 'transparent', borderWidth: todayRow ? 0 : 2, borderColor: t.colors.primary }}>
            <Icon name={todayRow ? 'check' : spec.icon} size={22} color={todayRow ? '#FFFFFF' : t.colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text weight="bold">{todayRow ? spec.done : spec.label}</Text>
            <Text variant="caption" muted>{todayRow ? 'Touchez pour retirer si c’est une erreur.' : 'Un geste suffit, c’est enregistré tout de suite.'}</Text>
          </View>
        </Tappable>

        {daily ? (
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text variant="label" muted>7 derniers jours</Text>
              <Text variant="caption" weight="bold" color={gold} testID="contra-streak">{streak > 0 ? `${streak} jour${streak > 1 ? 's' : ''} d’affilée` : '—'}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {week.map((d) => (
                <View key={d.date} style={{ alignItems: 'center', gap: 4 }} accessibilityLabel={`${d.date} : ${d.done ? 'prise notée' : 'rien de noté'}`}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: d.done ? gold : 'transparent', borderWidth: d.done ? 0 : 1.5, borderColor: tint(gold, 0.6), borderStyle: d.done ? 'solid' : 'dashed' }}>
                    {d.done ? <Icon name="check" size={13} color="#FFFFFF" /> : null}
                  </View>
                  <Text variant="caption" muted>{LETTERS[new Date(`${d.date}T12:00:00`).getDay()]}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        <View style={{ alignSelf: 'flex-start' }}>
          <Chip icon="alert-circle" label="Un oubli ou un incident ? Le noter" onPress={() => router.push('/cycle/calendar' as never)} testID="contra-today-incident" />
        </View>
      </View>
    </Card>
  );
}
