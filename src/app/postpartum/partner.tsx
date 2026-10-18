/**
 * Espace conjoint : comprendre le post-partum et « Comment l'aider ? ».
 * Les gestes proposés reposent UNIQUEMENT sur ce que la mère a choisi de partager :
 * aucune lecture ni interprétation de ses réponses privées (le serveur ne les lui donne pas).
 */
import React from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { Banner, Card, Icon, ListRow, SectionTitle, Text } from '@/components/ui';
import { SectionCard } from '@/features/postpartum';
import { EmergencyList } from '@/components/Family';
import { PARTNER, USEFUL_PHRASES } from '@/content/postpartum';
import { useHouseholdMembers } from '@/lib/data/hooks';
import { useSharedWithMe } from '@/lib/data/hooks-postpartum';
import { AVAILABILITY_LABEL, REST_LABEL, helpIdeas } from '@/lib/domain/postpartum';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function PartnerSpace() {
  const t = useTheme();
  const shared = useSharedWithMe();
  const { data: members } = useHouseholdMembers();
  // Les profils ne sont pas exposés entre membres : on parle du rôle, sans nom
  const nameOf = (uid: string) => (members?.find((m) => m.user_id === uid)?.role === 'caregiver' ? 'Une personne du foyer' : 'Votre partenaire');

  return (
    <Screen back title="Soutenir après la naissance" subtitle="Pour le conjoint et les proches.">
      <SectionTitle title="Comment l’aider ?" />
      {shared.isLoading && !shared.data.length ? <Skeleton rows={1} /> : null}
      {!shared.isLoading && shared.data.length === 0 ? (
        <Card tone="soft">
          <Text variant="small">Rien n’a été partagé avec vous pour l’instant. C’est son choix, et il se respecte. Vous pouvez toujours demander simplement : « Qu’est-ce que je peux prendre en charge pour te laisser souffler ? »</Text>
        </Card>
      ) : null}
      {shared.data.map((s, i) => (
        <StaggerItem key={s.user_id} index={i}>
          <Card>
            <Text weight="bold">{nameOf(s.user_id)} a choisi de partager</Text>
            <Text variant="caption" muted>Mis à jour le {new Date(s.updated_at).toLocaleString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
            <View style={{ marginTop: spacing.xs }}>
              {s.relay_requested ? <ListRow icon="repeat" title="Demande un relais" subtitle={s.relay_note ?? undefined} /> : null}
              {s.rest_need ? <ListRow icon="moon" title={REST_LABEL[s.rest_need]} /> : null}
              {s.availability ? <ListRow icon="clock" title={AVAILABILITY_LABEL[s.availability]} /> : null}
              {s.summary ? <ListRow icon="message-circle" title="Son message" subtitle={s.summary} /> : null}
            </View>
            <Text weight="medium" style={{ marginTop: spacing.sm }}>Gestes concrets</Text>
            {helpIdeas(s).map((idea) => (
              <View key={idea} style={{ flexDirection: 'row', gap: spacing.xs, marginTop: 6 }}>
                <Icon name="check" size={16} color={t.colors.success} />
                <Text variant="small" style={{ flex: 1 }}>{idea}</Text>
              </View>
            ))}
          </Card>
        </StaggerItem>
      ))}

      <SectionTitle title="Des phrases qui aident" />
      <Card tone="lavender">
        {USEFUL_PHRASES.map((p) => (
          <View key={p} style={{ flexDirection: 'row', gap: spacing.xs, paddingVertical: 4 }}>
            <Icon name="message-circle" size={16} color={t.colors.lavender} />
            <Text style={{ flex: 1 }}>« {p} »</Text>
          </View>
        ))}
      </Card>

      <SectionTitle title="Comprendre" />
      {PARTNER.map((s, i) => <SectionCard key={s.id} s={s} index={i} />)}

      <Banner tone="danger" title="Si elle est en danger">
        {'Ne la laissez pas seule, mettez le bébé en sécurité et appelez. Une notification ou un message ne remplacent jamais une aide humaine.'}
      </Banner>
      <EmergencyList compact />
    </Screen>
  );
}
