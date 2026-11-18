/**
 * Famille → Mes informations (19/11/2026) : ce que la famille voit de moi, et rien d'autre.
 *  - rôle choisi (« Maman », « Papa », « Co-parent »… : écrit par la personne, jamais déduit) ;
 *  - ce que je partage dans mon profil familial (missions, responsabilités, disponibilités, calendrier, activités) ;
 *  - ma grossesse (si j'en suis la personne enceinte) : partage de l'essentiel puis, à part, du médical ;
 *  - mes notifications (mission terminée, discrétion de « Se comprendre ») ; l'accord grammatical (sur ce téléphone).
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Button, Card, Field, Segmented, SectionTitle, Text, Toggle } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { usePregnancies } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import {
  DEFAULT_SHARE, useCouplePrefs, useGrammar, useMyFamilyProfile, useSaveCouplePrefs, useSaveMyFamilyProfile, useSetPregnancySharing,
  type FamilyMemberProfile,
} from '@/lib/data/hooks-couple';
import type { Grammar } from '@/lib/domain/understand';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

type ShareKey = 'share_missions' | 'share_domains' | 'share_availability' | 'share_calendar' | 'share_activities';
const SHARES: { key: ShareKey; label: TKey }[] = [
  { key: 'share_missions', label: 'cp2.info.shareMissions' },
  { key: 'share_domains', label: 'cp2.info.shareDomains' },
  { key: 'share_availability', label: 'cp2.info.shareAvailability' },
  { key: 'share_calendar', label: 'cp2.info.shareCalendar' },
  { key: 'share_activities', label: 'cp2.info.shareActivities' },
];

export default function MyInfo() {
  const toast = useToast();
  const me = useUserId();
  const { mine } = useMyFamilyProfile();
  const saveProfile = useSaveMyFamilyProfile();
  const prefs = useCouplePrefs().prefs;
  const savePrefs = useSaveCouplePrefs();
  const { grammar, setGrammar } = useGrammar();
  const pregnancy = (usePregnancies().data ?? []).find((p) => p.status === 'active' && p.carrier_user_id === me);
  const sharePreg = useSetPregnancySharing();
  const [label, setLabel] = useState('');
  useEffect(() => { setLabel(mine?.family_label ?? ''); }, [mine?.family_label]);
  const share: Omit<FamilyMemberProfile, 'household_id' | 'user_id'> = { ...DEFAULT_SHARE, ...(mine ?? {}) };

  const run = (p: Promise<unknown>) => p.then(() => toast(tr('cp2.info.saved'))).catch((e) => toast(friendlyError(e), 'error'));

  return (
    <Screen back title={tr('cp2.info.title')} subtitle={tr('cp2.info.sub')}>
      <SectionTitle title={tr('cp2.info.label')} />
      <Card>
        <Field label={tr('cp2.info.label')} hint={tr('cp2.info.labelHint')} value={label} onChangeText={setLabel} maxLength={24} placeholder={tr('cp2.info.labelPh')} testID="info-label" />
        <Button label={tr('common.save')} size="sm" loading={saveProfile.isPending} testID="info-label-save"
          onPress={() => void run(saveProfile.mutateAsync({ ...share, family_label: label.trim() || null }))} />
      </Card>

      <SectionTitle title={tr('cp2.info.share')} />
      <Card testID="info-shares">
        {SHARES.map((s) => (
          <Toggle key={s.key} label={tr(s.label)} value={!!share[s.key]} onChange={(v) => void run(saveProfile.mutateAsync({ ...share, [s.key]: v }))} />
        ))}
      </Card>

      {pregnancy ? (
        <>
          <SectionTitle title={tr('cp2.info.pregnancy')} />
          <Card testID="info-pregnancy">
            <Text variant="small" muted>{tr('cp2.info.pregnancyB')}</Text>
            <Toggle label={tr('cp2.info.pregBasics')} value={!!pregnancy.share_basics}
              onChange={(v) => void run(sharePreg.mutateAsync({ id: pregnancy.id, basics: v, medical: v ? !!pregnancy.share_medical : false }))} />
            {pregnancy.share_basics ? (
              <Toggle label={tr('cp2.info.pregMedical')} value={!!pregnancy.share_medical}
                onChange={(v) => void run(sharePreg.mutateAsync({ id: pregnancy.id, basics: true, medical: v }))} />
            ) : null}
          </Card>
        </>
      ) : null}

      <SectionTitle title={tr('cp2.info.notifs')} />
      <Card testID="info-notifs">
        <Toggle label={tr('cp2.info.notifMissionDone')} value={prefs.mission_done} onChange={(v) => void run(savePrefs.mutateAsync({ mission_done: v }))} />
        <Toggle label={tr('cp2.info.notifDiscreet')} value={prefs.couple_discreet} onChange={(v) => void run(savePrefs.mutateAsync({ couple_discreet: v }))} />
      </Card>

      <SectionTitle title={tr('cp2.info.grammar')} subtitle={tr('cp2.info.grammarB')} />
      <Segmented<Grammar> label={tr('cp2.info.grammar')} value={grammar ?? 'n'} onChange={setGrammar}
        options={(['f', 'm', 'n'] as const).map((g) => ({ value: g, label: tr(`cp2.info.grammar.${g}` as TKey), testID: `info-grammar-${g}` }))} />
      <View style={{ paddingTop: spacing.sm }}><Text variant="caption" muted>{tr('cp2.info.private')}</Text></View>
    </Screen>
  );
}
