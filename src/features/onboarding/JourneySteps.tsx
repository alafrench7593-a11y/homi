/**
 * Onboarding v3 (20/11/2026) — les 6 étapes demandées par la propriétaire, tutoiement :
 *  1 « Pour commencer, parle-nous un peu de toi » (plusieurs réponses) · 2 « Qui fait partie de ton quotidien ? » ·
 *  3 enfants et grossesse (tout facultatif) · 4 alimentation du nourrisson (si nourrisson) · 5 « Qu'aimerais-tu
 *  simplifier avec HOMI ? » (plusieurs réponses) · 6 tableau de bord personnalisé (aperçu calculé par le moteur réel,
 *  puis la révélation). Mêmes listes calmes (`ChoiceList`) et animations sobres que la v2.
 * Ces étapes servent aussi à « Modifier mes réponses » (src/app/journeys/answers.tsx).
 */
import React from 'react';
import { View } from 'react-native';
import { Button, Chip, Field, Text, type IconName } from '@/components/ui';
import { MattePanel } from '@/features/entry/EntryKit';
import { ChildForm, emptyChild, PregnancyForm, type ChildDraft } from '@/features/profiles';
import type { PregnancyDraft } from '@/features/profiles';
import { useToolHub } from '@/features/toolHub/useToolHub';
import { ToolGlyph } from '@/components/ToolGlyph';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { birthFromAge, dueFromWeeks } from '@/lib/onboarding/v3';
import {
  FEEDING_ANSWERS, HOUSEHOLD_KINDS, PRIORITIES, PROFILE_TAGS, reasonText, recommend, toggleProfileTag, togglePriority,
  type FeedingAnswer, type HouseholdKind, type JourneyAnswers, type Priority, type ProfileFacts, type ProfileTag,
} from '@/lib/personalization';
import { toolLabelKey, resolveTool } from '@/lib/journeys/tools';
import { ChoiceList, ChoiceRow, StepTitle } from './kit';
import { MotionItem, MotionList } from '@/motion/ListMotion';

const TAG_ICON: Record<ProfileTag, IconName> = { ttc: 'sunrise', pregnant: 'moon', new_baby: 'sun', kids: 'users', dad: 'user', discover: 'compass' };
const HOUSE_ICON: Record<HouseholdKind, IconName> = { partner: 'heart', solo: 'user', separated: 'repeat', undisclosed: 'eye-off' };
const FEED_ICON: Record<FeedingAnswer, IconName> = { breast: 'droplet', pumped: 'download', formula: 'plus-circle', mixed: 'shuffle', solids: 'coffee', undisclosed: 'eye-off' };
const PRIO_ICON: Record<Priority, IconName> = {
  pregnancy: 'moon', meals: 'coffee', sleep: 'cloud', growth: 'trending-up', appointments: 'calendar', tasks: 'check-square', communication: 'message-circle',
  find_nanny: 'search', childcare_days: 'book-open', school: 'book', activities: 'sun', meet_parents: 'globe',
};

/** 1 — Pour commencer, parle-nous un peu de toi. */
export function ProfileStep({ value, name, onName, onChange }: { value: ProfileTag[]; name: string; onName: (v: string) => void; onChange: (v: ProfileTag[]) => void }) {
  return (
    <View style={{ gap: spacing.md }}>
      <StepTitle title={tr('o3.profile.title')} lead={tr('o3.profile.lead')} />
      <ChoiceList label={tr('o3.profile.title')} testID="onb-profile">
        {PROFILE_TAGS.map((p) => (
          <ChoiceRow key={p} testID={`onb-tag-${p}`} icon={TAG_ICON[p]} label={tr(`o3.tag.${p}` as TKey)} selected={value.includes(p)} onPress={() => onChange(toggleProfileTag(value, p))} />
        ))}
      </ChoiceList>
      <Field label={tr('o3.profile.name')} optional value={name} onChangeText={onName} maxLength={40} autoCapitalize="words" testID="onb-name" />
    </View>
  );
}

/** 2 — Qui fait partie de ton quotidien ? (aucun droit d'accès n'est déduit ; « inviter » ouvre le lien existant à la fin). */
export function HouseholdChoiceStep({ value, invite, onChange, onInvite }: { value: HouseholdKind | null; invite: boolean; onChange: (v: HouseholdKind | null) => void; onInvite: (v: boolean) => void }) {
  return (
    <View style={{ gap: spacing.md }}>
      <StepTitle title={tr('o3.house.title')} lead={tr('o3.house.lead')} />
      <ChoiceList label={tr('o3.house.title')} testID="onb-house" radio>
        {HOUSEHOLD_KINDS.filter((h) => h !== 'undisclosed').map((h) => (
          <ChoiceRow key={h} radio testID={`onb-house-${h}`} icon={HOUSE_ICON[h]} label={tr(`o3.house.${h}` as TKey)} selected={value === h} onPress={() => onChange(value === h ? null : h)} />
        ))}
      </ChoiceList>
      <ChoiceList label={tr('o3.house.invite')} testID="onb-house-more">
        <ChoiceRow testID="onb-house-invite" icon="user-plus" label={tr('o3.house.invite')} hint={tr('o3.house.inviteHint')} selected={invite} onPress={() => onInvite(!invite)} />
        <ChoiceRow testID="onb-house-undisclosed" icon={HOUSE_ICON.undisclosed} label={tr('o3.house.undisclosed')} selected={value === 'undisclosed'} onPress={() => onChange(value === 'undisclosed' ? null : 'undisclosed')} />
      </ChoiceList>
      <Text variant="small" muted center>{tr('o3.house.noRights')}</Text>
    </View>
  );
}

const AGES = [1, 3, 6, 9, 12, 24, 36, 72, 96];
const STAGES_SA = [8, 12, 20, 28, 36];

/** 3 — Enfants et grossesse : tout est facultatif ; seuls les enfants avec prénom et date seront créés. */
export function FamilyStep({ answers, pregnancy, onPregnancy, pErrors, kids: children, onChildren, cErrors }: {
  answers: JourneyAnswers; pregnancy: PregnancyDraft; onPregnancy: (p: PregnancyDraft) => void; pErrors: Record<string, string>;
  kids: ChildDraft[]; onChildren: (c: ChildDraft[]) => void; cErrors: Record<string, string>[];
}) {
  const askPreg = answers.profile.includes('pregnant');
  const askKids = answers.profile.some((t) => t === 'new_baby' || t === 'kids' || t === 'dad');
  const setChild = (i: number, v: ChildDraft) => onChildren(children.map((x, j) => (j === i ? v : x)));
  const first = children[0]?.birth_date ?? '';
  return (
    <View style={{ gap: spacing.md }}>
      <StepTitle title={tr('o3.family.title')} lead={tr('o3.family.lead')} />
      {askPreg ? (
        <MattePanel>
          <Text weight="bold">{tr('o3.family.pregnancy')}</Text>
          <PregnancyForm value={pregnancy} onChange={onPregnancy} errors={pErrors} />
          <Text variant="small" muted>{tr('o3.family.stage')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {STAGES_SA.map((w) => <Chip key={w} label={tr('o3.family.sa', { n: w })} testID={`onb-stage-${w}`} onPress={() => onPregnancy({ ...pregnancy, dateMode: 'due', date: dueFromWeeks(w) })} />)}
          </View>
        </MattePanel>
      ) : null}
      {askKids ? (
        <>
          <Text variant="label">{tr('o3.family.count', { count: children.length })}</Text>
          {children.map((c, i) => (
            <MattePanel key={i}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text weight="bold">{tr('onb.children.item', { n: i + 1 })}</Text>
                {children.length > 1 ? <Button label={tr('onb.children.remove')} variant="ghost" icon="x" size="sm" onPress={() => onChildren(children.filter((_, j) => j !== i))} /> : null}
              </View>
              <ChildForm value={c} onChange={(v) => setChild(i, v)} errors={cErrors[i] ?? {}} />
              <Text variant="small" muted>{tr('o3.family.orAge')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {AGES.map((m) => <Chip key={m} label={m < 24 ? tr('l8.child.month', { count: m }) : tr('l8.child.year', { count: m / 12 })} testID={`onb-age-${i}-${m}`} onPress={() => setChild(i, { ...c, birth_date: birthFromAge(m) })} />)}
              </View>
              {i > 0 && first && c.birth_date !== first ? (
                <Button label={tr('o3.family.twins')} variant="secondary" size="sm" icon="copy" testID={`onb-twins-${i}`} onPress={() => setChild(i, { ...c, birth_date: first })} />
              ) : null}
            </MattePanel>
          ))}
          <Button label={tr('onb.children.add')} variant="secondary" icon="plus" testID="onb-child-add" onPress={() => onChildren([...children, emptyChild()])} />
        </>
      ) : null}
      <Text variant="small" muted center>{tr('o3.family.optional')}</Text>
    </View>
  );
}

/** 4 — Comment nourris-tu actuellement ton bébé ? */
export function FeedingStep({ value, onChange }: { value: FeedingAnswer | null; onChange: (v: FeedingAnswer | null) => void }) {
  return (
    <View style={{ gap: spacing.md }}>
      <StepTitle title={tr('o3.feed.title')} lead={tr('o3.feed.lead')} />
      <ChoiceList label={tr('o3.feed.title')} testID="onb-feeding" radio>
        {FEEDING_ANSWERS.map((f) => (
          <ChoiceRow key={f} radio testID={`onb-feed-${f}`} icon={FEED_ICON[f]} label={tr(`o3.feed.${f}` as TKey)} selected={value === f} onPress={() => onChange(value === f ? null : f)} />
        ))}
      </ChoiceList>
    </View>
  );
}

/** 5 — Qu'aimerais-tu simplifier avec HOMI ? */
export function PrioritiesStep({ value, onChange }: { value: Priority[]; onChange: (v: Priority[]) => void }) {
  return (
    <View style={{ gap: spacing.md }}>
      <StepTitle title={tr('o3.prio.title')} lead={tr('o3.prio.lead')} />
      <ChoiceList label={tr('o3.prio.title')} testID="onb-priorities">
        {PRIORITIES.map((p) => (
          <ChoiceRow key={p} testID={`onb-prio-${p}`} icon={PRIO_ICON[p]} label={tr(`o3.prio.${p}` as TKey)} selected={value.includes(p)} onPress={() => onChange(togglePriority(value, p))} />
        ))}
      </ChoiceList>
    </View>
  );
}

/**
 * 6 — Ton tableau de bord : les outils que le moteur réel choisit pour ces réponses, avec leur raison. Aperçu (rien
 * n'est encore créé) avant les accords ; repris sur la révélation après la création.
 */
export function DashboardPreview({ facts, max = 6, testID = 'onb-dashboard' }: { facts: ProfileFacts; max?: number; testID?: string }) {
  const hub = useToolHub();
  const recs = recommend(facts, {}, { max });
  return (
    <MotionList style={{ gap: spacing.xs }} testID={testID} accessibilityRole="list">
      {recs.map((r) => {
        const def = resolveTool(r.id)?.def;
        const tool = hub.resolve(r.id)?.tool;
        return (
          <MotionItem key={r.id}><View key={r.id} accessible accessibilityLabel={`${tr(toolLabelKey(r.id))}. ${reasonText(r.reason)}`} testID={`${testID}-${r.id}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <ToolGlyph id={r.id} theme={tool?.theme ?? def?.theme ?? 'resources'} icon={tool?.icon ?? def?.icon ?? 'grid'} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text weight="bold">{tr(toolLabelKey(r.id))}</Text>
              <Text variant="caption" muted>{reasonText(r.reason)}</Text>
            </View>
          </View></MotionItem>
        );
      })}
    </MotionList>
  );
}
