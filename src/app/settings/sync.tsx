/**
 * Synchronisation : saisies faites hors ligne, en attente d'envoi, et saisies refusées par le serveur
 * (jamais supprimées en silence : à réessayer ou à retirer explicitement).
 */
import React, { useState } from 'react';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState } from '@/components/States';
import { Banner, Button, Card, IconButton, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { discardConflict, flushQueue, retryConflict, useOfflineStore, type PendingOp } from '@/lib/offline';
import { friendlyError } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';

const TABLE_LABEL: Record<string, string> = {
  bottles: 'Biberon', breastfeeds: 'Tétée', pumpings: 'Tire-lait', diapers: 'Couche', sleeps: 'Sommeil', meals: 'Repas',
  child_observations: 'Observation', period_entries: 'Règles', symptom_logs: 'Symptômes', ovulation_tests: 'Test d’ovulation',
  pregnancy_tests: 'Test de grossesse', fertility_observations: 'Température ou glaire', intercourse_logs: 'Rapport',
  mood_checkins: 'Humeur', maternal_weights: 'Poids', child_measurements: 'Mesure', child_milestones: 'Étape', food_introductions: 'Aliment',
  child_health_items: 'Santé',
};

const when = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function SyncScreen() {
  const toast = useToast();
  const { online, pending, conflicts, syncing } = useOfflineStore();
  const [busy, setBusy] = useState(false);

  async function syncNow() {
    setBusy(true);
    try {
      const n = await flushQueue();
      toast(n ? `${n} saisie${n > 1 ? 's' : ''} envoyée${n > 1 ? 's' : ''}.` : online ? 'Rien à envoyer pour le moment.' : 'Toujours hors ligne : nouvel essai automatique au retour du réseau.');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  const row = (op: PendingOp, conflict: boolean) => (
    <ListRow
      key={op.id}
      icon={conflict ? 'alert-circle' : 'clock'}
      title={TABLE_LABEL[op.table] ?? 'Saisie'}
      subtitle={`Notée le ${when(op.queuedAt)}${op.error ? ` · ${op.error}` : ''}`}
      right={conflict ? (
        <Row gap={0}>
          <IconButton icon="refresh-cw" label="Réessayer l’envoi" onPress={() => retryConflict(op.id).catch((e) => toast(friendlyError(e), 'error'))} />
          <IconButton icon="trash-2" label="Retirer cette saisie" onPress={async () => {
            if (await confirm('Retirer cette saisie ?', 'Elle n’a pas pu être enregistrée sur le serveur. La retirer la supprime définitivement de ce téléphone.', 'Retirer')) await discardConflict(op.id);
          }} />
        </Row>
      ) : undefined}
    />
  );

  return (
    <Screen back title="Synchronisation" subtitle="Vos saisies faites hors connexion">
      <Banner tone={online ? 'success' : 'warning'} title={online ? 'En ligne' : 'Hors ligne'}>
        {online ? 'Les saisies en attente sont envoyées automatiquement.' : 'Vous pouvez continuer à tout noter : rien n’est perdu, l’envoi se fera au retour du réseau.'}
      </Banner>
      <Button label="Synchroniser maintenant" icon="refresh-cw" loading={busy || syncing} disabled={!pending.length} onPress={syncNow} />

      <SectionTitle title={`En attente (${pending.length})`} />
      {pending.length ? <Card>{pending.map((op) => row(op, false))}</Card> : <EmptyState icon="check-circle" title="Tout est envoyé" body="Aucune saisie en attente sur ce téléphone." />}

      {conflicts.length ? (
        <>
          <SectionTitle title={`À vérifier (${conflicts.length})`} />
          <Text variant="small" muted>Le serveur a refusé ces saisies (droits retirés, doublon, valeur non acceptée…). Réessayez ou retirez-les.</Text>
          <Card style={{ marginTop: spacing.xs }}>{conflicts.map((op) => row(op, true))}</Card>
        </>
      ) : null}
    </Screen>
  );
}
