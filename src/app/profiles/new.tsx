/** Ajouter une grossesse ou un enfant (et, après une naissance, les profils des bébés). */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PremiumGate } from '@/components/Family';
import { Banner, Button, Card, haptic, Segmented, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { ensureHousehold, useActivePregnancy, useActiveSubject, useChildren, useExpectedBabies, useHouseholdId, useInvalidate, usePregnancies, usePremium } from '@/lib/data/hooks';
import { errorMessage, isPremiumError, usePlanLimit } from '@/lib/data/hooks-family';
import { ChildForm, createChild, createPregnancy, emptyChild, emptyPregnancy, PregnancyForm, validateChild, validatePregnancy, type ChildDraft } from '@/features/profiles';
import { todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { uuid } from '@/lib/uuid';
import { spacing } from '@/theme/tokens';

type Kind = 'pregnancy' | 'child';

export default function NewProfile() {
  const params = useLocalSearchParams<{ kind?: Kind; fromPregnancy?: string }>();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const hid = useHouseholdId();
  const premium = usePremium();
  const childLimit = usePlanLimit('children_count');
  const { setSubject } = useActiveSubject();
  const activePregnancy = useActivePregnancy();
  const { data: pregnancies } = usePregnancies();
  const { data: children } = useChildren();
  const fromPregnancy = pregnancies?.find((p) => p.id === params.fromPregnancy) ?? null;
  const { data: babies } = useExpectedBabies(fromPregnancy?.id);

  const [kind, setKind] = useState<Kind>(params.kind === 'child' || params.fromPregnancy ? 'child' : params.kind === 'pregnancy' ? 'pregnancy' : 'child');
  const [pregnancy, setPregnancy] = useState(emptyPregnancy());
  const [drafts, setDrafts] = useState<ChildDraft[]>([emptyChild()]);
  const [errors, setErrors] = useState<Record<string, string>[]>([{}]);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  // Après une naissance : un profil par bébé attendu, prénoms et date du jour pré-remplis
  useEffect(() => {
    if (prefilled || !fromPregnancy || !babies) return;
    const n = Math.max(1, babies.length);
    setDrafts(Array.from({ length: n }, (_, i) => ({ ...emptyChild(), first_name: babies[i]?.nickname ?? '', birth_date: toFrDate(todayISO()) })));
    setErrors(Array.from({ length: n }, () => ({})));
    setPrefilled(true);
  }, [babies, fromPregnancy, prefilled]);

  const existingChildren = children?.length ?? 0;
  const overLimit = !premium && existingChildren + drafts.length > childLimit;
  const remaining = Math.max(0, childLimit - existingChildren);
  const birthFlow = !!fromPregnancy;

  const title = useMemo(() => (birthFlow ? (drafts.length > 1 ? 'Bienvenue aux bébés' : 'Bienvenue, bébé') : 'Ajouter un profil'), [birthFlow, drafts.length]);

  async function household() {
    return hid ?? (await ensureHousehold());
  }

  async function savePregnancy() {
    const v = validatePregnancy(pregnancy);
    setErrors([v.errors]);
    if (!v.due) return;
    setSaving(true);
    try {
      const p = await createPregnancy(await household(), userId, pregnancy);
      inv('pregnancies', 'expected_babies', 'checklists', 'checklist_items', 'memberships');
      setSubject({ type: 'pregnancy', id: p.id });
      haptic('success');
      toast('Grossesse ajoutée.');
      router.replace('/pregnancy');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function saveChildren() {
    const results = drafts.map(validateChild);
    setErrors(results.map((r) => r.errors));
    if (results.some((r) => Object.keys(r.errors).length)) return;
    setSaving(true);
    setError(null);
    const created: string[] = [];
    try {
      const h = await household();
      const group = birthFlow && drafts.length > 1 ? uuid() : null;
      for (const d of drafts) {
        const c = await createChild(h, d);
        created.push(c.id);
        if (birthFlow) {
          await backend.update('children', { from_pregnancy_id: fromPregnancy!.id, multiple_group: group }, [eq('id', c.id)]).catch(() => undefined);
        }
      }
      inv('children', 'memberships');
      setSubject({ type: 'child', id: created[0] });
      haptic('success');
      toast(created.length > 1 ? 'Profils créés.' : 'Profil créé.');
      router.replace({ pathname: '/child/[id]', params: { id: created[0] } });
    } catch (e) {
      if (created.length) inv('children');
      if (isPremiumError(e)) setLimitReached(true);
      else setError(errorMessage(e));
      if (created.length) {
        // Les profils déjà créés sont conservés : on retire les brouillons correspondants
        setDrafts((ds) => ds.slice(created.length));
        setErrors((es) => es.slice(created.length));
      }
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <Button
      label={kind === 'pregnancy' ? 'Ajouter la grossesse' : drafts.length > 1 ? `Créer les ${drafts.length} profils` : 'Créer le profil'}
      size="lg"
      loading={saving}
      disabled={(kind === 'pregnancy' && !!activePregnancy) || (kind === 'child' && overLimit)}
      onPress={kind === 'pregnancy' ? savePregnancy : saveChildren}
    />
  );

  return (
    <Screen back title={title} subtitle={birthFlow ? 'Créez leur profil pour commencer le suivi. Tout reste modifiable ensuite.' : 'Une grossesse en cours ou un enfant à suivre.'} footer={footer}>
      {!birthFlow && (
        <Segmented
          label="Type de profil"
          value={kind}
          onChange={(v) => { setKind(v); setError(null); setErrors(v === 'child' ? drafts.map(() => ({})) : [{}]); }}
          options={[{ value: 'child', label: 'Un enfant' }, { value: 'pregnancy', label: 'Une grossesse' }]}
        />
      )}
      {error ? <Banner tone="danger">{error}</Banner> : null}

      {kind === 'pregnancy' ? (
        activePregnancy ? (
          <Banner tone="info" title="Une grossesse est déjà en cours" action={<Button label="Modifier la grossesse" size="sm" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => router.replace('/pregnancy/edit')} />}>
            {'Pour des jumeaux ou des triplés, indiquez simplement le nombre de bébés dans la grossesse en cours.'}
          </Banner>
        ) : (
          <PregnancyForm value={pregnancy} onChange={setPregnancy} errors={errors[0] ?? {}} />
        )
      ) : (
        <>
          {(overLimit || limitReached) && (
            <View style={{ gap: spacing.sm }}>
              <Banner tone="warning" title="Limite de la version gratuite">
                {remaining > 0
                  ? `La version gratuite permet de suivre ${childLimit} enfants par foyer. Vous pouvez encore en ajouter ${remaining}.`
                  : `La version gratuite permet de suivre ${childLimit} enfants par foyer.`}
              </Banner>
              <PremiumGate feature="Suivre plus d’enfants"><View /></PremiumGate>
            </View>
          )}
          {drafts.map((d, i) => (
            <Card key={i} tone={drafts.length > 1 ? 'surface' : 'soft'}>
              <View style={{ gap: spacing.md }}>
                {drafts.length > 1 && <Text variant="heading" accessibilityRole="header">Bébé {i + 1}</Text>}
                <ChildForm value={d} onChange={(v) => setDrafts((ds) => ds.map((x, j) => (j === i ? v : x)))} errors={errors[i] ?? {}} />
                {birthFlow && drafts.length > 1 && (
                  <Button label="Ne pas créer ce profil maintenant" variant="ghost" size="sm" icon="x" onPress={() => { setDrafts((ds) => ds.filter((_, j) => j !== i)); setErrors((es) => es.filter((_, j) => j !== i)); }} />
                )}
              </View>
            </Card>
          ))}
          {birthFlow && (
            <Text variant="caption" muted>Vous pourrez ajouter les mesures de naissance (poids, taille) dans l’onglet Croissance de chaque profil.</Text>
          )}
        </>
      )}
    </Screen>
  );
}
