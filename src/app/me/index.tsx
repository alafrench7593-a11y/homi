/**
 * Espace « Moi aussi » : la santé et le bien-être de l'adulte, notamment après la naissance.
 * Ton doux, aucune injonction. Les numéros d'urgence restent toujours gratuits et visibles.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmergencyList } from '@/components/Family';
import { Banner, Card, Icon, type IconName, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { useAppointments, useArticles, useDocuments, useMoods } from '@/lib/data/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

/** Thèmes de récupération, reliés aux articles de la bibliothèque quand ils existent. */
const REHAB: { key: string; icon: IconName; title: string; text: string; slugs: string[]; tags: string[] }[] = [
  {
    key: 'perinee', icon: 'feather', title: 'Le périnée, en douceur',
    text: 'Après une naissance, par voie basse comme par césarienne, le périnée a besoin de temps. La rééducation se fait avec une sage-femme ou un kinésithérapeute, à votre rythme.',
    slugs: ['perinee-role'], tags: ['perinee'],
  },
  {
    key: 'abdos', icon: 'activity', title: 'Abdominaux et diastasis',
    text: 'Les muscles du ventre se sont écartés pour laisser la place au bébé. Mieux vaut attendre l’avis d’un professionnel avant de reprendre les exercices classiques.',
    slugs: ['diastasis'], tags: ['abdominaux'],
  },
  {
    key: 'emotions', icon: 'cloud', title: 'Les émotions des premières semaines',
    text: 'Larmes, fatigue, inquiétudes : c’est fréquent. Si cela dure ou pèse trop, en parler à un professionnel peut vraiment aider.',
    slugs: ['baby-blues-ou-depression', 'demander-de-l-aide'], tags: ['emotions'],
  },
  {
    key: 'corps', icon: 'sun', title: 'Votre corps qui récupère',
    text: 'Hormones, cicatrice, sommeil morcelé : la récupération prend des semaines, parfois des mois. Il n’y a pas de calendrier à respecter.',
    slugs: ['hormones-apres-naissance', 'cesarienne'], tags: ['hormones'],
  },
];

export default function MeSpace() {
  const t = useTheme();
  const { data: articles } = useArticles();
  const { data: moods } = useMoods(1);
  const { data: appointments } = useAppointments({ upcomingOnly: true });
  const { data: documents } = useDocuments();

  const lastMood = moods?.[0];
  const nextAppt = appointments?.find((a) => a.for_parent) ?? appointments?.[0];

  const links: { icon: IconName; title: string; subtitle: string; to: string }[] = [
    { icon: 'heart', title: 'Comment je me sens', subtitle: lastMood ? `Dernier bilan : ${new Date(lastMood.checked_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : 'Un bilan privé et facultatif', to: '/me/mood' },
    { icon: 'circle', title: 'Mon cycle', subtitle: 'Règles, symptômes et tests — estimations sans garantie', to: '/cycle' },
    { icon: 'calendar', title: 'Mes rendez-vous', subtitle: nextAppt ? `Prochain : ${nextAppt.title}` : 'Postnatal, rééducation, suivi', to: '/appointments' },
    { icon: 'folder', title: 'Mes documents', subtitle: documents?.length ? `${documents.length} document${documents.length > 1 ? 's' : ''}` : 'Ordonnances, comptes rendus, résultats', to: '/documents' },
  ];

  return (
    <Screen back title="Moi aussi" subtitle="Un espace pour vous, sans pression ni objectif.">
      <Card tone="soft">
        <Row style={{ alignItems: 'flex-start' }}>
          <Icon name="heart" color={t.colors.heart} />
          <Text style={{ flex: 1 }}>
            Prendre soin de vous fait aussi partie de prendre soin de votre famille. Tout ici est facultatif : prenez ce qui vous aide, laissez le reste.
          </Text>
        </Row>
      </Card>

      <Card>
        {links.map((l) => (
          <ListRow key={l.to} icon={l.icon} title={l.title} subtitle={l.subtitle} onPress={() => router.push(l.to as never)} />
        ))}
      </Card>

      <SectionTitle title="Récupérer après la naissance" />
      <Text variant="small" muted>Des repères pour comprendre ce qui se passe. Ils ne remplacent pas l’avis de votre sage-femme ou de votre médecin.</Text>
      {REHAB.map((r) => {
        const related = (articles ?? []).filter((a) => r.slugs.includes(a.slug) || a.tags.some((tag) => r.tags.includes(tag)));
        return (
          <Card key={r.key} tone="lavender">
            <Row style={{ alignItems: 'flex-start' }}>
              <Icon name={r.icon} color={t.colors.lavender} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text weight="bold">{r.title}</Text>
                <Text variant="small">{r.text}</Text>
              </View>
            </Row>
            {related.length > 0 && (
              <View style={{ marginTop: spacing.xs }}>
                {related.slice(0, 2).map((a) => (
                  <ListRow key={a.id} icon="book-open" title={a.title} subtitle="Lire l’article" onPress={() => router.push(`/article/${a.slug}` as never)} />
                ))}
              </View>
            )}
          </Card>
        );
      })}

      <Banner tone="info" title="Quand en parler à un professionnel ?">
        {'Fuites urinaires, douleurs, sensation de pesanteur, tristesse qui s’installe, difficulté à dormir même quand le bébé dort : ce sont de bonnes raisons de consulter. Vous n’avez pas à attendre la visite postnatale.'}
      </Banner>

      <SectionTitle title="Besoin d’aide maintenant" />
      <Text variant="small" muted>Ces numéros sont gratuits, joignables 24 h/24, et toujours accessibles dans l’application.</Text>
      <EmergencyList compact />
      <ListRow icon="life-buoy" title="Toutes les ressources d’aide" subtitle="Violences, enfance en danger, SMS…" onPress={() => router.push('/emergency')} />
    </Screen>
  );
}
