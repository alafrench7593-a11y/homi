/** Dents de lait : noter la date d'apparition de chaque dent, sans comparaison ni « retard ». */
import { insertOrQueue } from '@/lib/offline';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Card, haptic, Icon, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useActiveSubject, useChildren, useInvalidate } from '@/lib/data/hooks';
import { useMilestones } from '@/lib/data/hooks-family';
import { friendlyError } from '@/lib/data/hooks-settings';
import { todayISO } from '@/lib/domain/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const TEETH = [
  'Incisive centrale en bas, gauche', 'Incisive centrale en bas, droite', 'Incisive centrale en haut, gauche', 'Incisive centrale en haut, droite',
  'Incisive latérale en haut, gauche', 'Incisive latérale en haut, droite', 'Incisive latérale en bas, gauche', 'Incisive latérale en bas, droite',
  'Première molaire en haut, gauche', 'Première molaire en haut, droite', 'Première molaire en bas, gauche', 'Première molaire en bas, droite',
  'Canine en haut, gauche', 'Canine en haut, droite', 'Canine en bas, gauche', 'Canine en bas, droite',
  'Deuxième molaire en bas, gauche', 'Deuxième molaire en bas, droite', 'Deuxième molaire en haut, gauche', 'Deuxième molaire en haut, droite',
];

export default function Teeth() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const params = useLocalSearchParams<{ child?: string }>();
  const { subject } = useActiveSubject();
  const childrenQ = useChildren();
  const { data: children } = childrenQ;
  const [busy, setBusy] = useState<string | null>(null);
  const childId = (typeof params.child === 'string' && params.child) || (subject.type === 'child' ? subject.id : children?.[0]?.id);
  const child = children?.find((c) => c.id === childId);
  const milestonesQ = useMilestones(childId);
  const { data: milestones } = milestonesQ;
  const teeth = useMemo(() => (milestones ?? []).filter((m) => m.kind === 'tooth'), [milestones]);

  const toggle = async (label: string) => {
    if (!child || busy) return;
    haptic('selection');
    const existing = teeth.find((m) => m.title === label);
    setBusy(label);
    try {
      if (existing) {
        if (!(await confirm('Retirer cette dent ?', `${label} (${existing.happened_on ?? 'sans date'})`, 'Retirer'))) return;
        await backend.remove('child_milestones', [eq('id', existing.id)]);
      } else {
        await insertOrQueue('child_milestones', { child_id: child.id, household_id: child.household_id, kind: 'tooth', title: label, happened_on: todayISO(), note: null });
        toast('Dent notée aujourd’hui.', 'success');
      }
      inv('child_milestones');
    } catch (e) {
      toast(friendlyError(e, 'Enregistrement impossible. Réessayez dans un instant.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen back title="Dents" subtitle={child ? `${child.first_name} · ${teeth.length} dent${teeth.length > 1 ? 's' : ''} notée${teeth.length > 1 ? 's' : ''}` : 'Ajoutez d’abord un enfant.'}>
      <Banner tone="info">Chaque enfant a son rythme : les premières dents arrivent souvent entre 6 et 12 mois, parfois plus tôt ou plus tard. En cas de doute, parlez-en à votre pédiatre ou à la PMI.</Banner>
      {childrenQ.isLoading && !children ? <Skeleton rows={4} /> : childrenQ.isError && !children ? (
        <ErrorView error={childrenQ.error} onRetry={() => void childrenQ.refetch()} />
      ) : !child ? (
        <EmptyState icon="smile" title="Aucun enfant pour l’instant" body="Ajoutez le profil de votre enfant pour noter ses premières dents." action={{ label: 'Ajouter un enfant', onPress: () => router.push('/profiles/new?kind=child' as never) }} />
      ) : milestonesQ.isLoading && !milestones ? <Skeleton kind="detail" rows={6} /> : milestonesQ.isError && !milestones ? (
        <ErrorView error={milestonesQ.error} onRetry={() => void milestonesQ.refetch()} title="Impossible d’afficher les dents notées" />
      ) : (
        <Card>
          <View style={{ gap: 4 }}>
            {TEETH.map((label) => {
              const m = teeth.find((x) => x.title === label);
              return (
                <Pressable key={label} accessibilityRole="checkbox" accessibilityState={{ checked: !!m, busy: busy === label }} accessibilityLabel={`${label}${m ? `, apparue le ${m.happened_on}` : ''}`} onPress={() => toggle(label)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingHorizontal: spacing.xs, borderRadius: radius.md, backgroundColor: m ? t.colors.accentSoft : 'transparent', opacity: busy === label ? 0.5 : 1 }}>
                  <Icon name={m ? 'check-circle' : 'circle'} size={20} color={m ? t.colors.primary : t.colors.textMuted} />
                  <Text style={{ flex: 1 }}>{label}</Text>
                  {m?.happened_on ? <Text variant="caption" muted>{new Date(m.happened_on).toLocaleDateString('fr-FR')}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </Card>
      )}
    </Screen>
  );
}
