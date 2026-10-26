/**
 * Saisies en un geste pour le quotidien :
 * - `QuickDiaperCard` : « Mouillée », « Selles », « Les deux » enregistrent MAINTENANT, avec « Annuler » quelques secondes ;
 * - `LastSideCard` : rappel du dernier côté noté (allaitement) et démarrage du chronomètre d'un côté en un geste.
 * Rien n'est recommandé : on reprend seulement ce que le parent a noté.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { GlassSurface } from '@/components/Glass';
import { Tappable } from '@/components/Tappable';
import { Icon, Text, haptic, type IconName } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { tint } from '@/components/ToolGlyph';
import { backend, eq } from '@/lib/backend';
import { useAddLog, useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { agoLabel, quickDiaperRow, type QuickDiaper } from '@/lib/domain/dayTimeline';
import { uuid } from '@/lib/uuid';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const UNDO_MS = 8000;

function BigTile({ icon, label, sub, onPress, testID, busy, strong }: { icon: IconName; label: string; sub?: string; onPress: () => void; testID?: string; busy?: boolean; strong?: boolean }) {
  const t = useTheme();
  const accent = t.colors.primary;
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={sub ? `${label}, ${sub}` : label} onPress={onPress} disabled={busy} testID={testID}
      style={{ flex: 1, minWidth: 92, minHeight: 92, borderRadius: 22, padding: spacing.sm, alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: strong ? accent : tint(accent, t.isDark ? 0.18 : 0.1), borderWidth: 1, borderColor: tint(accent, 0.35), opacity: busy ? 0.6 : 1 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: strong ? 'rgba(255,255,255,0.22)' : tint(accent, t.isDark ? 0.25 : 0.15) }}>
        <Icon name={icon} size={20} color={strong ? t.colors.primaryText : accent} />
      </View>
      <Text weight="bold" center color={strong ? t.colors.primaryText : t.colors.text}>{label}</Text>
      {sub ? <Text variant="caption" center color={strong ? t.colors.primaryText : t.colors.textMuted}>{sub}</Text> : null}
    </Tappable>
  );
}

export function QuickDiaperCard({ childId, householdId, name, lastAt }: { childId: string; householdId?: string; name: string; lastAt?: string | null }) {
  const t = useTheme();
  const toast = useToast();
  const add = useAddLog('diaper');
  const inv = useInvalidate();
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState<{ id: string; label: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function log(kind: QuickDiaper, label: string) {
    if (busy) return;
    setBusy(true);
    const id = uuid();
    try {
      const res = await add.mutateAsync({ id, child_id: childId, household_id: householdId, note: null, ...quickDiaperRow(kind) });
      haptic('success');
      toast(res === 'queued' ? `${label} : enregistrée sur l’appareil.` : `${label} : notée pour ${name}.`, res === 'queued' ? 'info' : 'success');
      if (res === 'sent') {
        setUndo({ id, label });
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setUndo(null), UNDO_MS);
      }
    } catch (e) {
      toast(friendlyError(e, 'Enregistrement impossible. Réessayez dans un instant.'), 'error');
    } finally { setBusy(false); }
  }

  async function cancel() {
    if (!undo) return;
    try {
      await backend.remove('diapers', [eq('id', undo.id)]);
      inv('diapers');
      toast('Saisie annulée.', 'info');
    } catch (e) { toast(friendlyError(e), 'error'); }
    setUndo(null);
  }

  return (
    <GlassSurface fill={t.colors.surface} depth={2} radius={26}>
      <View style={{ padding: spacing.md, gap: spacing.sm }} testID="quick-diaper">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.sm }}>
          <Text variant="heading">En un geste</Text>
          {lastAt ? <Text variant="caption" muted>Dernier change {agoLabel(lastAt)}</Text> : null}
        </View>
        <Text variant="caption" muted>Enregistré maintenant ; pour une autre heure ou des détails, utilisez le formulaire plus bas.</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <BigTile icon="droplet" label="Mouillée" onPress={() => log('wet', 'Couche mouillée')} busy={busy} testID="quick-diaper-wet" />
          <BigTile icon="circle" label="Selles" onPress={() => log('stool', 'Couche avec selles')} busy={busy} testID="quick-diaper-stool" />
          <BigTile icon="layers" label="Les deux" onPress={() => log('both', 'Couche mouillée et selles')} busy={busy} testID="quick-diaper-both" strong />
        </View>
        {undo ? (
          <Tappable accessibilityRole="button" accessibilityLabel={`Annuler : ${undo.label}`} onPress={cancel} testID="quick-diaper-undo"
            style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: tint(t.colors.primary, 0.4) }}>
            <Icon name="rotate-ccw" size={14} color={t.colors.primary} />
            <Text variant="caption" weight="bold" color={t.colors.primary}>Annuler « {undo.label} »</Text>
          </Tappable>
        ) : null}
      </View>
    </GlassSurface>
  );
}


/** Dernier côté noté + démarrage du chronomètre d'un côté en un geste. */
export function LastSideCard({ last, onStart, running }: { last: { side: 'left' | 'right' | 'both'; at: string } | null; onStart: (side: 'left' | 'right') => void; running: boolean }) {
  const t = useTheme();
  if (running) return null;
  return (
    <GlassSurface fill={t.colors.surface} depth={2} radius={26}>
      <View style={{ padding: spacing.md, gap: spacing.sm }} testID="quick-feed">
        <Text variant="heading">Démarrer en un geste</Text>
        <Text variant="small" muted testID="quick-feed-last">
          {last ? `Dernier côté noté : ${last.side === 'both' ? 'les deux' : last.side === 'left' ? 'gauche' : 'droit'} · ${agoLabel(last.at)}` : 'Aucune tétée notée pour l’instant.'}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <BigTile icon="play" label="Côté gauche" sub={last?.side === 'left' ? 'noté la dernière fois' : undefined} onPress={() => { haptic('light'); onStart('left'); }} testID="quick-feed-left" />
          <BigTile icon="play" label="Côté droit" sub={last?.side === 'right' ? 'noté la dernière fois' : undefined} onPress={() => { haptic('light'); onStart('right'); }} testID="quick-feed-right" />
        </View>
        <Text variant="caption" muted>Le chronomètre démarre tout de suite ; arrêtez-le pour enregistrer.</Text>
      </View>
    </GlassSurface>
  );
}
