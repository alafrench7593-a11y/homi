/**
 * « Après la naissance » : l'espace post-partum de la mère.
 * Privé par défaut. Le suivi ne s'arrête jamais tout seul : il continue tant qu'elle le souhaite.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Skeleton, ErrorView } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Field, Icon, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { DangerPanel, SupportPlanCard } from '@/features/postpartum';
import { usePostpartumCheckins, usePostpartumSettings, useSaveSettings } from '@/lib/data/hooks-postpartum';
import { useReminders } from '@/lib/data/hooks';
import { friendlyError, useDeleteReminder, useSaveReminder } from '@/lib/data/hooks-settings';
import { NEEDS, persistentLowDays, supportPlan } from '@/lib/domain/postpartum';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const CHECKIN_LINK = '/postpartum/checkin';

export default function PostpartumHome() {
  const t = useTheme();
  const toast = useToast();
  const today = todayISO();
  const settingsQ = usePostpartumSettings();
  const checkinsQ = usePostpartumCheckins(30);
  const saveSettings = useSaveSettings();
  const { data: reminders } = useReminders();
  const saveReminder = useSaveReminder();
  const deleteReminder = useDeleteReminder();
  const [showDanger, setShowDanger] = useState(false);
  const [dateText, setDateText] = useState('');

  const settings = settingsQ.data;
  const checkins = checkinsQ.data ?? [];
  const todayCheckin = checkins.find((c) => c.checkin_date === today);
  const lowDays = persistentLowDays(checkins, today);
  const plan = useMemo(() => (todayCheckin ? supportPlan(todayCheckin, { persistentLowDays: lowDays, country: settings?.country }) : null), [todayCheckin, lowDays, settings?.country]);
  const reminder = reminders?.find((r) => r.deep_link === CHECKIN_LINK);
  const daysSince = settings?.delivery_date ? Math.floor((Date.parse(today) - Date.parse(settings.delivery_date)) / 86400000) : null;

  async function toggleReminder(on: boolean) {
    try {
      if (on) {
        const [h, m] = (settings?.reminder_time ?? '20:00').split(':').map(Number);
        // Texte volontairement neutre : rien de personnel sur l'écran verrouillé
        await saveReminder.mutateAsync({ draft: { title: 'Un moment pour vous', body: 'Si vous en avez envie.', category: 'postnatal', schedule: { type: 'daily', hour: h, minute: m }, enabled: true, deep_link: CHECKIN_LINK } });
      } else if (reminder) await deleteReminder.mutateAsync(reminder.id);
      await saveSettings.mutateAsync({ existing: !!settings, patch: { reminders_enabled: on } });
      toast(on ? 'Rappel discret activé, chaque soir. Vous pouvez l’ignorer.' : 'Rappel désactivé.');
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  async function saveDelivery() {
    const iso = frToISO(dateText);
    if (!iso || iso > today) return toast('Date invalide (jj/mm/aaaa, pas dans le futur).', 'error');
    try {
      await saveSettings.mutateAsync({ existing: !!settings, patch: { delivery_date: iso } });
      setDateText('');
      toast('Date enregistrée.');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const loading = settingsQ.isLoading || checkinsQ.isLoading;
  const failed = (settingsQ.isError && !settingsQ.data) || (checkinsQ.isError && !checkinsQ.data);

  return (
    <Screen back title="Après la naissance" subtitle="Votre espace. Privé par défaut, sans score ni jugement.">
      <Banner tone="info" icon="lock">
        {'Ce que vous notez ici reste visible uniquement par vous. Votre conjoint ou votre famille ne voient que ce que vous décidez de partager, et vous pouvez l’arrêter à tout moment.'}
      </Banner>

      <Card tone="soft" onPress={() => setShowDanger((v) => !v)} accessibilityLabel="Besoin d’aide tout de suite ? Afficher les numéros d’urgence">
        <Row>
          <Icon name="life-buoy" color={t.colors.danger} />
          <Text weight="bold" style={{ flex: 1 }}>Besoin d’aide tout de suite ?</Text>
          <Icon name={showDanger ? 'chevron-up' : 'chevron-down'} size={18} color={t.colors.textMuted} />
        </Row>
      </Card>
      {showDanger ? <DangerPanel country={settings?.country} /> : null}

      {loading ? <Skeleton kind="card" rows={2} /> : null}
      {failed ? <ErrorView error={settingsQ.error ?? checkinsQ.error} onRetry={() => { void settingsQ.refetch(); void checkinsQ.refetch(); }} /> : null}

      {!loading && !failed ? (
        <>
          <SectionTitle title="Aujourd’hui" />
          {todayCheckin ? (
            <>
              <Card onPress={() => router.push(CHECKIN_LINK)} accessibilityLabel="Modifier mon point du jour">
                <Row>
                  <Icon name="check-circle" color={t.colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text weight="bold">Point du jour noté</Text>
                    <Text variant="small" muted>
                      {todayCheckin.needs.filter((n) => n !== 'no_answer').map((n) => NEEDS.find((x) => x.value === n)?.label).filter(Boolean).join(' · ') || 'Touchez pour le relire ou le modifier.'}
                    </Text>
                  </View>
                  <Icon name="edit-2" size={18} color={t.colors.textMuted} />
                </Row>
              </Card>
              {plan ? <SupportPlanCard plan={plan} country={settings?.country} /> : null}
            </>
          ) : (
            <Card>
              <Text weight="bold">Comment ça va, vraiment ?</Text>
              <Text variant="small" muted style={{ marginTop: 4 }}>Moins d’une minute, et tout est facultatif. Vous pouvez aussi ne rien noter : il n’y a pas de « bonne » fréquence.</Text>
              <Row style={{ marginTop: spacing.sm }} wrap>
                <Button label="Faire le point" icon="feather" onPress={() => router.push(CHECKIN_LINK)} />
                <Button label="Pas aujourd’hui" variant="ghost" onPress={() => toast('D’accord. Prenez soin de vous.')} />
              </Row>
            </Card>
          )}

          {!todayCheckin && lowDays >= 5 ? <SupportPlanCard plan={supportPlan({}, { persistentLowDays: lowDays })} /> : null}

          <SectionTitle title="Mon espace" />
          <Card>
            {[
              { icon: 'trending-up' as const, title: 'Mon évolution', subtitle: 'Humeur, fatigue, sommeil, soutien — sur plusieurs semaines', to: '/postpartum/history' },
              { icon: 'book-open' as const, title: 'Comprendre ce que je traverse', subtitle: 'Baby blues, signes qui méritent d’en parler — sources officielles', to: '/postpartum/understand' },
              { icon: 'users' as const, title: 'Mon plan de soutien', subtitle: 'Contacts de confiance, professionnels, tâches à confier, questions', to: '/postpartum/support' },
              { icon: 'share-2' as const, title: 'Ce que je partage', subtitle: settings && (settings.share_rest_need || settings.share_availability || settings.share_relay_requests || settings.share_summary) ? 'Partage actif — vous gardez la main' : 'Rien n’est partagé', to: '/postpartum/sharing' },
              { icon: 'heart' as const, title: 'Ma récupération physique', subtitle: 'Périnée, cicatrice, douleurs : repères et rendez-vous', to: '/me' },
            ].map((l, i) => (
              <StaggerItem key={l.to} index={i}>
                <ListRow icon={l.icon} title={l.title} subtitle={l.subtitle} onPress={() => router.push(l.to as never)} />
              </StaggerItem>
            ))}
          </Card>

          <SectionTitle title="Réglages" />
          <Card>
            <Row>
              <View style={{ flex: 1 }}>
                <Text weight="medium">Rappel discret chaque soir</Text>
                <Text variant="caption" muted>« Un moment pour vous » — rien de personnel sur l’écran verrouillé.</Text>
              </View>
              <Toggle label="Rappel discret chaque soir" value={!!reminder?.enabled} onChange={(v) => void toggleReminder(v)} />
            </Row>
            <View style={{ marginTop: spacing.sm, gap: 6 }}>
              <Text weight="medium">Date de l’accouchement</Text>
              {settings?.delivery_date ? (
                <Text variant="small" muted>
                  {toFrDate(settings.delivery_date)}{daysSince != null && daysSince >= 0 ? ` — il y a ${daysSince} jour${daysSince > 1 ? 's' : ''}` : ''}. Le suivi continue aussi longtemps que vous le souhaitez.
                </Text>
              ) : (
                <Text variant="small" muted>Facultatif. Vous pouvez aussi préparer votre plan de soutien avant la naissance.</Text>
              )}
              <Row>
                <View style={{ flex: 1 }}><Field label="Date (jj/mm/aaaa)" optional value={dateText} onChangeText={setDateText} keyboardType="numbers-and-punctuation" placeholder="12/09/2026" /></View>
                <Button label="Enregistrer" size="sm" variant="secondary" onPress={saveDelivery} disabled={!dateText} loading={saveSettings.isPending} style={{ alignSelf: 'flex-end' }} />
              </Row>
            </View>
          </Card>
          <Text variant="caption" muted>Cet espace aide à exprimer vos besoins et à trouver du soutien. Il ne remplace ni une consultation médicale ni un suivi psychologique.</Text>
        </>
      ) : null}
    </Screen>
  );
}
