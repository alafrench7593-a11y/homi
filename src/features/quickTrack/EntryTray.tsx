/**
 * Fiche d'UNE saisie rapide (biberon, couche) dans le Tray de Reacticx (src/components/reacticx/tray) posé sur le verre
 * HOMI — même gabarit que la fiche d'une sieste (NapSessionTray) :
 *  · vue « entrée » : la valeur en grand (« 150 ml », « Selles »), l'heure, « il y a … », puis « Corriger » et
 *    « Formulaire complet » ;
 *  · vue « edit » : valeurs PROVISOIRES (rien n'est écrit tant qu'on n'a pas appuyé sur Enregistrer), Annuler restitue
 *    les valeurs d'origine, Enregistrer est verrouillé contre le double appui (`inflight`), et si l'écriture échoue
 *    le brouillon reste affiché avec le message.
 * La feuille se tire vers le bas pour se fermer ; Réduire les animations est respecté par le Tray.
 */
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Tray, useTray } from '@/components/reacticx/tray';
import { Glass, GlassButton } from '@/components/glass';
import { Field, Icon, Text, type IconName } from '@/components/ui';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, spacing } from '@/theme/tokens';

export const TABULAR = { fontVariant: ['tabular-nums' as const] };
export const HERO = { fontSize: 56, lineHeight: 62, letterSpacing: -1.5, fontFamily: fonts.display };

export function EntryTray({ open, onOpenChange, testID, title, hero, heroLabel, lines, editor, onFullForm, editLabel, readOnly }: {
  open: boolean; onOpenChange: (v: boolean) => void; testID: string;
  title: string; hero: string; heroLabel?: string; lines: (string | null | undefined)[];
  /** Vue de correction (montée avec une clé : elle repart des valeurs enregistrées à chaque ouverture) */
  editor: React.ReactNode;
  editLabel: string;
  onFullForm?: () => void;
  /** Lecture seule (membre sans droit d'édition) : ni « Corriger » ni « Formulaire complet » */
  readOnly?: boolean;
}) {
  const t = useTheme();
  const palette = { surface: 'transparent', border: t.colors.border, handle: t.colors.textMuted, text: t.colors.text, mutedText: t.colors.textMuted, backdrop: t.colors.overlay };
  return (
    <Tray open={open} onOpenChange={onOpenChange} defaultView="entry" palette={palette} theme={t.isDark ? 'dark' : 'light'} radius={34}
      motion={{ viewAxis: 'x', viewSlide: 60, viewStartScale: 1 }}>
      <Tray.Content surface={<Glass variant="sheet" radius={34} style={{ flex: 1 }} />}>
        <Tray.View id="entry">
          <View testID={testID} style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text variant="label" muted style={{ flex: 1 }} accessibilityRole="header">{title}</Text>
              <Tray.Close><View accessibilityLabel={tr('qt.tray.close')}><Icon name="x" size={20} color={t.colors.text} /></View></Tray.Close>
            </View>
            <Text testID={`${testID}-hero`} maxFontSizeMultiplier={1.3} style={[HERO, { color: t.colors.text }, TABULAR]} accessibilityLabel={heroLabel}>{hero}</Text>
            {lines.filter(Boolean).map((l, i) => (
              <Text key={i} weight={i === 0 ? 'bold' : undefined} variant={i === 0 ? undefined : 'small'} muted={i > 0} style={TABULAR} testID={`${testID}-line-${i}`}>{l}</Text>
            ))}
            {readOnly ? null : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
                <PushView view="edit" icon="clock" label={editLabel} testID={`${testID}-fix`} />
                {onFullForm ? <GlassButton variant="tertiary" icon="edit-2" label={tr('qt.tray.fullForm')} testID={`${testID}-form`} onPress={() => { onOpenChange(false); onFullForm(); }} /> : null}
              </View>
            )}
          </View>
        </Tray.View>
        <Tray.View id="edit">{editor}</Tray.View>
      </Tray.Content>
    </Tray>
  );
}

function PushView({ view, icon, label, testID }: { view: string; icon: IconName; label: string; testID: string }) {
  const { setView } = useTray();
  return <GlassButton variant="primary" icon={icon} label={label} testID={testID} onPress={() => setView(view)} />;
}

/**
 * Enregistrement protégé : un seul appel à la fois (double appui ignoré), message conservé en cas d'échec ; le
 * brouillon n'est jamais remis à zéro par un échec.
 */
export function useGuardedSave() {
  const inflight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<'ok' | string>) => {
    if (inflight.current) return false;
    inflight.current = true; setBusy(true); setError(null);
    try {
      const res = await fn();
      if (res !== 'ok') { setError(res); return false; }
      return true;
    } catch (e) {
      setError(`${tr('qt.edit.failed')}${e instanceof Error && e.message ? ` (${e.message})` : ''}`);
      return false;
    } finally { inflight.current = false; setBusy(false); }
  };
  return { busy, error, setError, run };
}

/** En-tête de la vue de correction : titre + retour. */
export function EditHeader({ title }: { title: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Tray.Back><View accessibilityLabel={tr('qt.tray.back')} testID="qt-edit-back"><Icon name="chevron-left" size={22} color={t.colors.text} /></View></Tray.Back>
      <Text variant="label" style={{ flex: 1 }} accessibilityRole="header">{title}</Text>
    </View>
  );
}

/** Heure provisoire : champ « 14:20 » encadré de −5 / +5 min. */
export function TimeEditor({ text, onText, onStep, valid, testID }: { text: string; onText: (v: string) => void; onStep: (deltaMin: number) => void; valid: boolean; testID: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
      <GlassButton variant="secondary" label={tr('qt.edit.minus5')} testID={`${testID}-earlier`} onPress={() => onStep(-5)} />
      <View style={{ flex: 1 }}>
        <Field label={tr('qt.edit.time')} value={text} onChangeText={onText} keyboardType="numbers-and-punctuation" maxLength={5} testID={`${testID}-time`}
          error={valid ? undefined : tr('qt.edit.badTime')} />
      </View>
      <GlassButton variant="secondary" label={tr('qt.edit.plus5')} testID={`${testID}-later`} onPress={() => onStep(5)} />
    </View>
  );
}

/** Annuler (restitue les valeurs d'origine et revient) / Enregistrer (désactivé sans changement ou pendant l'écriture). */
export function EditActions({ onCancel, onSave, canSave, busy, error, testID }: { onCancel: () => void; onSave: () => void; canSave: boolean; busy: boolean; error: string | null; testID: string }) {
  const t = useTheme();
  return (
    <>
      {error ? <Text variant="small" color={t.colors.danger} testID={`${testID}-error`} accessibilityLiveRegion="assertive">{error}</Text> : null}
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={{ flex: 1 }}><GlassButton variant="tertiary" full label={tr('qt.edit.cancel')} testID={`${testID}-cancel`} onPress={onCancel} /></View>
        <View style={{ flex: 1 }}><GlassButton variant="primary" full label={busy ? tr('qt.edit.saving') : tr('qt.edit.save')} testID={`${testID}-save`} disabled={!canSave || busy} onPress={onSave} /></View>
      </View>
    </>
  );
}
