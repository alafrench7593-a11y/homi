/**
 * Confidentialité du cycle : ce qui est visible (rien pour le foyer, la communauté ou des annonceurs), masquage sur l'accueil,
 * suivi facultatif de la sexualité, ce que l'assistant peut recevoir, export, et effacement de TOUTES les données du cycle
 * (règles, symptômes, pertes, saignements, journal, observations, tests, rapports, photos chiffrées) sans supprimer le compte.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { backend, eq } from '@/lib/backend';
import { useUserId } from '@/lib/auth';
import { useInvalidate } from '@/lib/data/hooks';
import { useCyclePreferences, useSaveCyclePreferences } from '@/lib/data/hooks-cycle';
import { friendlyError } from '@/lib/data/hooks-settings';
import { deleteEncryptedPhoto } from '@/lib/cycleAnalysis/privacy';
import { CycleIcon, Glass, Ink, Rise, SwitchRow, useCyclePalette } from '@/features/cycle/kit';
import { t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

const PHOTO_TABLES = ['fertility_observations', 'ovulation_tests', 'pregnancy_tests'] as const;
const CYCLE_TABLES = ['period_entries', 'symptom_logs', 'discharge_logs', 'bleeding_logs', 'cycle_journal', 'fertility_observations', 'ovulation_tests', 'pregnancy_tests', 'intercourse_logs'];

export default function CyclePrivacy() {
  const c = useCyclePalette();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const { prefs } = useCyclePreferences();
  const save = useSaveCyclePreferences();
  const [busy, setBusy] = useState(false);

  async function setPref(p: { hide_on_home?: boolean; track_intercourse?: boolean; advice_enabled?: boolean; detailed_notifications?: boolean }) {
    try { await save.mutateAsync(p); toast(tr('cy.pv.saved')); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function wipe() {
    if (!(await confirm(tr('cy.pv.wipeTitle'), tr('cy.pv.wipeBody'), tr('cy.pv.wipeConfirm')))) return;
    setBusy(true);
    try {
      // Photos chiffrées d'abord (le stockage n'est pas effacé par la base), puis toutes les lignes, côté serveur.
      for (const t of PHOTO_TABLES) {
        const rows = await backend.select<{ photo_path?: string | null }>({ table: t, filters: [eq('user_id', userId ?? '')], limit: 1000 });
        for (const r of rows ?? []) if (r.photo_path) await deleteEncryptedPhoto(r.photo_path).catch(() => undefined);
      }
      await backend.rpc('delete_my_cycle_data');
      CYCLE_TABLES.forEach((t) => inv(t));
      toast(tr('cy.pv.wiped'));
      router.replace('/cycle?all=1' as never);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  const Line = ({ text }: { text: string }) => (
    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
      <CycleIcon name="privacy" color={c.success} size={18} />
      <Ink variant="small" style={{ flex: 1 }}>{text}</Ink>
    </View>
  );

  return (
    <Screen back title={tr('cy.pv.title')} subtitle={tr('cy.pv.subtitle')}>
      <Rise>
        <Glass>
          <Ink variant="heading">{tr('cy.pv.whoTitle')}</Ink>
          <Line text={tr('cy.pv.who1')} />
          <Line text={tr('cy.pv.who2')} />
          <Line text={tr('cy.pv.who3')} />
          <Line text={tr('cy.pv.who4')} />
        </Glass>
      </Rise>
      <Rise delay={60}>
        <Glass>
          <SwitchRow label={tr('cy.pv.hideOnHome')} hint={tr('cy.pv.hideOnHomeHint')} value={!!prefs.hide_on_home} onChange={(v) => setPref({ hide_on_home: v })} />
          <SwitchRow label={tr('cy.pv.trackSex')} hint={tr('cy.pv.trackSexHint')} value={!!prefs.track_intercourse} onChange={(v) => setPref({ track_intercourse: v })} />
          <SwitchRow label={tr('cy.pv.advice')} hint={tr('cy.pv.adviceHint')} value={prefs.advice_enabled !== false} onChange={(v) => setPref({ advice_enabled: v })} />
          <SwitchRow label={tr('cy.pv.detailedNotif')} hint={tr('cy.pv.detailedNotifHint')} value={!!prefs.detailed_notifications} onChange={(v) => setPref({ detailed_notifications: v })} />
        </Glass>
      </Rise>
      <Rise delay={120}>
        <Glass>
          <Ink variant="heading">{tr('cy.pv.assistantTitle')}</Ink>
          <Ink variant="small">{tr('cy.pv.assistantBody')}</Ink>
        </Glass>
      </Rise>
      <Button label={tr('cy.pv.export')} variant="secondary" icon="file-text" onPress={() => router.push('/cycle/export' as never)} full />
      <Banner tone="danger" title={tr('cy.pv.wipeTitle')}>{tr('cy.pv.wipeHint')}</Banner>
      <Button label={tr('cy.pv.wipe')} variant="danger" icon="trash-2" loading={busy} onPress={wipe} full />
    </Screen>
  );
}
