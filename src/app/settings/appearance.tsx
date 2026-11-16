/**
 * Réglages → Apparence (HOMI v5 « Lumière corail »).
 *
 * Une seule commande : Système, Clair, Sombre. Il n'y a plus de palette au choix ni d'Auto selon l'heure : HOMI a
 * UNE identité (corail, rose chaud, touches de lilas). Les anciennes préférences de palette sont migrées
 * (`migratePalette`, src/lib/store.ts). Aperçu immédiat (l'écran entier suit le choix) ; choix propre à chaque compte.
 *
 * Écran de vérification du design system v5 : couleurs de l'identité (avec le rouge d'alerte, distinct), halo corail
 * et bouton `onHero`, famille de boutons et leurs états, liste groupée (`ListGroup` / `ListRow`), filtres et statuts
 * (`Chip`), sélecteur, interrupteur.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { CoralHalo } from '@/components/CoralHalo';
import { Banner, Button, Card, Chip, Icon, type IconName, ListGroup, ListRow, Row, SectionTitle, Segmented, Text, Toggle } from '@/components/ui';
import { ChoiceGroup, DataTile, SensitiveButton } from '@/components/controls';
import { useToast } from '@/components/Overlays';
import { CompletionCheck } from '@/motion';
import { useUiStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, IDENTITY, radius, spacing } from '@/theme/tokens';
import { formatNumber, t as tr } from '@/i18n';

type Mode = 'system' | 'light' | 'dark';
const MODES: Mode[] = ['system', 'light', 'dark'];

/** Statut : icône + libellé + couleur (jamais la couleur seule). */
function StatusPill({ icon, label, color }: { icon: IconName; label: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, minHeight: 30, borderRadius: radius.pill, borderWidth: 1, borderColor: alpha(color, 0.35), backgroundColor: alpha(color, 0.1) }}>
      <Icon name={icon} size={14} color={color} />
      <Text variant="caption" weight="bold" color={color}>{label}</Text>
    </View>
  );
}

/** Couleurs de l'identité : trois teintes (décor) + le rouge d'alerte santé, distinct, avec son icône. */
function IdentitySwatches() {
  const t = useTheme();
  const items: { color: string; label: string; icon?: IconName }[] = [
    { color: IDENTITY.coral, label: tr('v5.identity.coral') },
    { color: IDENTITY.rose, label: tr('v5.identity.rose') },
    { color: IDENTITY.lilac, label: tr('v5.identity.lilac') },
    { color: t.colors.danger, label: tr('v5.identity.alert'), icon: 'alert-octagon' },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }} testID="identity-swatches">
      {items.map((i) => (
        <View key={i.label} style={{ alignItems: 'center', gap: 6, minWidth: 64, flexGrow: 1, flexBasis: '20%' }}>
          <View style={{ width: 44, height: 44, borderRadius: radius.control, backgroundColor: i.color, alignItems: 'center', justifyContent: 'center' }}>
            {i.icon ? <Icon name={i.icon} size={20} color="#FFFFFF" /> : null}
          </View>
          <Text variant="caption" center>{i.label}</Text>
        </View>
      ))}
    </View>
  );
}

function ComponentsPreview() {
  const toast = useToast();
  const [filter, setFilter] = useState<'all' | 'mine' | 'done'>('all');
  const [duration, setDuration] = useState<'15' | '30' | '60'>('30');
  const [toggle, setToggle] = useState(true);
  const [done, setDone] = useState(false);
  const [deleted, setDeleted] = useState(false);
  return (
    <View style={{ gap: spacing.md }} testID="controls-preview">
      <Text variant="label">{tr('v5.ds.buttons')}</Text>
      <Button label={tr('settings.ds.save')} full testID="ds-primary" onPress={() => new Promise<void>((r) => setTimeout(() => { r(); toast(tr('settings.ds.saved')); }, 900))} />
      <Row wrap>
        <Button label={tr('settings.ds.cancel')} variant="secondary" testID="ds-secondary" onPress={() => undefined} />
        <Button label={tr('v5.ds.link')} variant="link" testID="ds-link" onPress={() => undefined} />
      </Row>
      <Row wrap>
        <Button label={tr('v5.ds.share')} variant="icon" icon="share-2" testID="ds-icon" onPress={() => undefined} />
        <Button label={tr('settings.ds.add')} variant="icon" icon="plus" onPress={() => undefined} />
        <Button label={tr('settings.ds.disabled')} size="sm" disabled onPress={() => undefined} testID="ds-disabled" />
        <Button label={tr('v5.ds.loading')} size="sm" variant="secondary" loading testID="ds-loading" />
      </Row>
      <Button label={tr('settings.ds.fail')} variant="outline" icon="alert-triangle" size="sm" style={{ alignSelf: 'flex-start' }} testID="ds-fail"
        onPress={() => new Promise<void>((_r, reject) => setTimeout(() => reject(new Error(tr('settings.ds.failMsg'))), 700))} />
      {!deleted ? (
        <SensitiveButton label={tr('settings.ds.delete')} icon="trash-2" confirmMessage={tr('settings.ds.deleteMsg')} size="sm" style={{ alignSelf: 'flex-start' }} testID="ds-sensitive"
          onPress={() => { setDeleted(true); toast(tr('settings.ds.deleted')); }} />
      ) : null}

      <ListGroup title={tr('v5.ds.list')} testID="ds-list">
        <ListRow icon="calendar" title={tr('v5.ds.rowAgenda')} subtitle={tr('v5.ds.rowAgendaSub')} onPress={() => undefined} />
        <ListRow icon="shopping-cart" title={tr('v5.ds.rowShopping')} value={tr('v5.ds.rowShoppingSub')} onPress={() => undefined} />
        <ListRow icon="bell" title={tr('v5.ds.rowReminders')} right={<Toggle label={tr('v5.ds.rowReminders')} value={toggle} onChange={setToggle} />} />
      </ListGroup>

      <Text variant="label">{tr('v5.ds.filters')}</Text>
      <Row wrap gap={spacing.xs}>
        <Chip label={tr('v5.ds.filterAll')} selected={filter === 'all'} onPress={() => setFilter('all')} testID="ds-filter-all" />
        <Chip label={tr('v5.ds.filterMine')} selected={filter === 'mine'} onPress={() => setFilter('mine')} />
        <Chip label={tr('v5.ds.filterDone')} selected={filter === 'done'} onPress={() => setFilter('done')} />
      </Row>
      <ChoiceGroup label={tr('settings.ds.duration')} value={duration} onChange={setDuration} testID="ds-duration"
        options={[{ value: '15', label: tr('settings.ds.d15'), testID: 'ds-d15' }, { value: '30', label: tr('settings.ds.d30'), testID: 'ds-d30' }, { value: '60', label: tr('settings.ds.d60'), testID: 'ds-d60' }]} />
      <Card>
        <Row>
          <CompletionCheck done={done} onToggle={setDone} label={tr('settings.preview.taskA11y', { task: tr('settings.preview.task') })} testID="preview-task" />
          <Text style={{ flex: 1, textDecorationLine: done ? 'line-through' : 'none' }} muted={done}>{tr('settings.preview.task')}</Text>
        </Row>
      </Card>
      <DataTile label={tr('settings.ds.tileSleep')} icon="moon" value={formatNumber(7.4, { maximumFractionDigits: 1 })} unit={tr('settings.ds.tileSleepUnit')}
        context={tr('settings.ds.tileWeek')} series={[6.8, 7.1, 6.5, 7.6, 7.2, 7.9, 7.4]} trendLabel={tr('settings.ds.tileTrend')} testID="ds-tile-sleep" />
    </View>
  );
}

export default function AppearanceScreen() {
  const t = useTheme();
  const preference = useUiStore((s) => s.themePreference);
  const setTheme = useUiStore((s) => s.setTheme);
  const mode: Mode = preference === 'light' || preference === 'dark' ? preference : 'system';
  const status = t.tokens.status;
  const hint = mode === 'light' ? tr('v5.appearance.lightHint') : mode === 'dark' ? tr('v5.appearance.darkHint') : tr('settings.appearance.systemHint');

  return (
    <Screen back title={tr('settings.appearance.row')}>
      <SectionTitle title={tr('settings.appearance')} />
      <Segmented
        label={tr('settings.appearance.label')}
        value={mode}
        onChange={(v) => setTheme(v)}
        options={MODES.map((m) => ({ value: m, label: tr(`settings.appearance.${m}` as const), testID: `appearance-${m}` }))}
      />
      <Text variant="small" muted>{hint}</Text>

      <SectionTitle title={tr('v5.identity.title')} />
      <Text variant="small" muted>{tr('v5.identity.body')}</Text>
      <IdentitySwatches />
      <Row wrap gap={spacing.xs}>
        <StatusPill icon="check-circle" label={tr('settings.preview.ok')} color={status.success} />
        <StatusPill icon="alert-triangle" label={tr('settings.preview.warn')} color={status.warning} />
        <StatusPill icon="alert-octagon" label={tr('settings.preview.err')} color={status.danger} />
        <StatusPill icon="info" label={tr('settings.preview.info')} color={status.info} />
      </Row>

      {/* Halo corail : réservé à l'accueil, à l'entrée et à l'onboarding ; ici, aperçu avec le bouton « sur le halo » */}
      <View testID="appearance-preview" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 220, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: t.colors.background, borderWidth: 1, borderColor: t.colors.border }}>
        <CoralHalo size={260} style={{ position: 'absolute' }} testID="appearance-halo" />
        <Button label={tr('v5.ds.onHero')} variant="onHero" testID="preview-primary" onPress={() => undefined} />
      </View>

      <SectionTitle title={tr('v5.ds.title')} />
      <ComponentsPreview />

      <Banner tone="info">{tr('settings.appearance.private')}</Banner>
      <Text variant="caption" muted>{tr('settings.appearance.nightNote')}</Text>
    </Screen>
  );
}
