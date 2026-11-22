/**
 * Laboratoire du verre liquide : panneau posé AU-DESSUS de l'Accueil réel (la vraie barre, les vraies cartes qui
 * défilent dessous). Réglages en direct (`useLensStore`), thème clair / sombre, « Réinitialiser » (préréglage HOMI),
 * « Copier les réglages JSON » et « Appliquer ce JSON » (le même JSON fixe exactement le rendu du composant de l'app).
 * Repliable en une pastille pour juger le rendu en plein écran. Ouvert par `/dev/liquid-glass` (mode développeur ou
 * démonstration).
 */
import React, { useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, TextInput, View, type GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tappable } from '@/components/Tappable';
import { GlassButton, GlassSegmentedControl } from '@/components/glass';
import { Icon, IconButton, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { useLensStore } from '@/components/glass/liquid/store';
import { LENS_SPECS, parseLens, serializeLens, type LensParams, type LensParamSpec } from '@/components/glass/liquid/params';
import { supportsSvgBackdrop } from '@/components/glass/liquid/LiquidLens';
import { NativeGlass } from '@/components/surfaces/nativeGlass';
import { useUiStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, fonts, radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

const fmt = (v: number, s: LensParamSpec) => `${s.step < 1 ? String(Math.round(v * 100) / 100) : Math.round(v)}${s.unit ? ` ${s.unit}` : ''}`;

/** Curseur sans dépendance : glisser sur la piste (souris, doigt), ou −/+ (pas exact), accessible comme « réglable ». */
function LabSlider({ spec, value, onChange }: { spec: LensParamSpec; value: number; onChange: (v: number) => void }) {
  const t = useTheme();
  const [w, setW] = useState(1);
  const name = tr(`lq.p.${spec.key}` as TKey);
  const k = (value - spec.min) / (spec.max - spec.min);
  const at = (e: GestureResponderEvent) => onChange(spec.min + Math.max(0, Math.min(1, e.nativeEvent.locationX / w)) * (spec.max - spec.min));
  const step = (d: number) => onChange(value + d * spec.step);
  return (
    <View style={{ gap: 2 }} testID={`lq-${spec.key}`}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text variant="small" weight="medium" style={{ flex: 1 }}>{name}</Text>
        <Text variant="small" weight="bold" style={{ fontVariant: ['tabular-nums'] }} testID={`lq-${spec.key}-value`}>{fmt(value, spec)}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <IconButton icon="minus" label={tr('lq.less', { name })} size={16} onPress={() => step(-1)} testID={`lq-${spec.key}-less`} />
        <View onLayout={(e) => setW(Math.max(1, e.nativeEvent.layout.width))} style={{ flex: 1, height: 32, justifyContent: 'center' }}
          accessible accessibilityRole="adjustable" accessibilityLabel={name} accessibilityValue={{ text: fmt(value, spec) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
          onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderTerminationRequest={() => false}
          onResponderGrant={at} onResponderMove={at} testID={`lq-${spec.key}-track`}>
          <View pointerEvents="none" style={{ height: 4, borderRadius: 2, backgroundColor: t.colors.border }}>
            <View style={{ width: `${k * 100}%`, height: 4, borderRadius: 2, backgroundColor: t.colors.primary }} />
          </View>
          <View pointerEvents="none" style={{ position: 'absolute', left: k * w - 10, width: 20, height: 20, borderRadius: 10, backgroundColor: t.colors.surface, borderWidth: 2, borderColor: t.colors.primary }} />
        </View>
        <IconButton icon="plus" label={tr('lq.more', { name })} size={16} onPress={() => step(1)} testID={`lq-${spec.key}-more`} />
      </View>
    </View>
  );
}

export function LiquidLabPanel() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { params, setParam, setAll, reset, labCollapsed, setCollapsed, setLab } = useLensStore();
  const theme = useUiStore((s) => s.themePreference);
  const setTheme = useUiStore((s) => s.setTheme);
  const [paste, setPaste] = useState('');
  const json = serializeLens(params);
  const mode = Platform.OS === 'web' ? (supportsSvgBackdrop() ? 'svg' : 'blur') : NativeGlass ? 'native' : 'blur';

  const copy = async () => {
    try {
      if (Platform.OS === 'web') { await navigator.clipboard.writeText(json); toast(tr('lq.copied'), 'success'); }
      else { await Share.share({ message: json }); }
    } catch { toast(tr('lq.copyFallback'), 'info'); }
  };
  const apply = () => {
    const p = parseLens(paste);
    if (!p) { toast(tr('lq.invalid'), 'error'); return; }
    setAll(p); setPaste(''); toast(tr('lq.applied'), 'success');
  };

  if (labCollapsed) {
    return (
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 6, alignItems: 'flex-end', paddingRight: 12 }]}>
        <Tappable accessibilityRole="button" accessibilityLabel={tr('lq.expandA11y')} testID="lq-expand" onPress={() => setCollapsed(false)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 36, borderRadius: 18, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border }}>
          <Icon name="sliders" size={14} color={t.colors.text} />
          <Text variant="small" weight="bold">{tr('lq.expand')}</Text>
        </Tappable>
      </View>
    );
  }
  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 6, paddingHorizontal: 10 }]}>
      <View testID="lq-panel" style={{ maxHeight: '58%', maxWidth: 440, alignSelf: 'center', width: '100%', borderRadius: radius.xl, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, overflow: 'hidden',
        boxShadow: `0 12px 32px ${alpha(t.tokens.shadowColor, 0.18)}` }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.md, paddingRight: 4, paddingVertical: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border }}>
          <Text weight="bold" style={{ flex: 1 }} accessibilityRole="header">{tr('lq.title')}</Text>
          <IconButton icon="chevron-up" label={tr('lq.collapse')} onPress={() => setCollapsed(true)} testID="lq-collapse" />
          <IconButton icon="x" label={tr('lq.close')} onPress={() => setLab(false)} testID="lq-close" />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }} keyboardShouldPersistTaps="handled">
          <Text variant="caption" muted testID="lq-mode">{tr(`lq.mode.${mode}` as TKey)} · {tr('lq.hint')}</Text>
          <GlassSegmentedControl label={tr('lq.theme')} value={theme} onChange={(v) => setTheme(v)} testID="lq-theme"
            options={[{ value: 'light', label: tr('lq.light'), testID: 'lq-theme-light' }, { value: 'dark', label: tr('lq.dark'), testID: 'lq-theme-dark' }, { value: 'system', label: tr('lq.system'), testID: 'lq-theme-system' }]} />
          {LENS_SPECS.map((s) => <LabSlider key={s.key} spec={s} value={params[s.key]} onChange={(v) => setParam(s.key, v as LensParams[typeof s.key])} />)}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            <GlassButton variant="secondary" size="sm" icon="rotate-ccw" label={tr('lq.reset')} onPress={reset} testID="lq-reset" />
            <GlassButton variant="primary" size="sm" icon="copy" label={tr('lq.copy')} onPress={() => void copy()} testID="lq-copy" />
          </View>
          <Text variant="caption" muted>{tr('lq.json')}</Text>
          <TextInput value={json} editable={false} multiline selectTextOnFocus testID="lq-json" accessibilityLabel={tr('lq.json')}
            style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11, color: t.colors.text, backgroundColor: t.colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm, minHeight: 120 }} />
          <TextInput value={paste} onChangeText={setPaste} multiline placeholder={tr('lq.paste')} placeholderTextColor={t.colors.textMuted} testID="lq-paste" accessibilityLabel={tr('lq.paste')}
            style={{ fontFamily: fonts.body, fontSize: 13, color: t.colors.text, borderWidth: 1, borderColor: t.colors.border, borderRadius: radius.md, padding: spacing.sm, minHeight: 64 }} />
          <GlassButton variant="secondary" size="sm" icon="check" label={tr('lq.apply')} onPress={apply} disabled={!paste.trim()} testID="lq-apply" style={{ alignSelf: 'flex-start' }} />
        </ScrollView>
      </View>
    </View>
  );
}
