/**
 * Famille & partage : membres du foyer, droits par domaine, invitations, rejoindre un foyer, quitter.
 * L'interface masque les actions réservées au propriétaire ; la base (RLS) les refuse de toute façon.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { extractInviteCode, savePendingInvite, takePendingInvite } from '@/lib/authFlow';
import * as Linking from 'expo-linking';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Chip, Divider, Field, ListRow, Loading, Row, Segmented, SectionTitle, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { BRAND } from '@/config/brand';
import { useUserId } from '@/lib/auth';
import { isDemo } from '@/lib/backend';
import { ensureHousehold, useActivePregnancy, useChildren, useHousehold, useHouseholdId, useHouseholdMembers, useInvalidate, useMyMembership } from '@/lib/data/hooks';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import {
  friendlyError, useAcceptInvitation, useCreateInvitation, useInvitations, useRemoveMember, useRenameHousehold, useRevokeInvitation, useSetMemberScope, useUpdateMemberRights,
} from '@/lib/data/hooks-settings';
import { ALL_DOMAINS, type Domain, type HouseholdMember } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, formatDate, formatList, type TKey } from '@/i18n';

const domainLabel = (d: Domain): { title: string; detail: string } => ({ title: tr(`u1.fam.dom.${d}.title` as TKey), detail: tr(`u1.fam.dom.${d}.detail` as TKey) });
const roleLabel = (role: HouseholdMember['role']): string => tr(`u1.fam.role.${role}` as TKey);
const DEFAULT_VIEW: Domain[] = [...ALL_DOMAINS];
const DEFAULT_EDIT: Domain[] = ['daily', 'lists', 'names'];

type Rights = { view: Domain[]; edit: Domain[] };
/** Profils partagés : null = tous les enfants (actuels et à venir). */
type Scope = { children: string[] | null; pregnancy: boolean };

/** Choix des profils accessibles (Lina, Noé, la grossesse). Retirer un profil coupe l'accès à ses données immédiatement. */
function ProfileScopePicker({ value, onChange, disabled }: { value: Scope; onChange: (s: Scope) => void; disabled?: boolean }) {
  const { data: children } = useChildren();
  const pregnancy = useActivePregnancy();
  const kids = children ?? [];
  const all = value.children == null;
  const has = (id: string) => all || value.children!.includes(id);
  const toggle = (id: string) => {
    const cur = all ? kids.map((k) => k.id) : value.children!;
    onChange({ ...value, children: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  };
  return (
    <View style={{ gap: 6 }} testID="profile-scope">
      <Text variant="label">{tr('u1.fam.sharedProfiles')}</Text>
      <Row wrap>
        <Chip label={tr('u1.fam.allChildren')} selected={all} onPress={disabled ? undefined : () => onChange({ ...value, children: all ? kids.map((k) => k.id) : null })} />
        {kids.map((k) => <Chip key={k.id} label={k.first_name} selected={has(k.id)} onPress={disabled ? undefined : () => toggle(k.id)} />)}
        {pregnancy ? <Chip label={tr('u1.fam.myPregnancy')} selected={value.pregnancy} onPress={disabled ? undefined : () => onChange({ ...value, pregnancy: !value.pregnancy })} /> : null}
      </Row>
    </View>
  );
}

/** Tableau Voir / Modifier par domaine. Modifier implique Voir. */
function PermissionMatrix({ value, onChange, disabled }: { value: Rights; onChange: (r: Rights) => void; disabled?: boolean }) {
  const t = useTheme();
  const toggle = (d: Domain, kind: 'view' | 'edit') => {
    const view = new Set(value.view);
    const edit = new Set(value.edit);
    if (kind === 'view') {
      if (view.has(d)) { view.delete(d); edit.delete(d); } else view.add(d);
    } else if (edit.has(d)) edit.delete(d);
    else { edit.add(d); view.add(d); }
    onChange({ view: ALL_DOMAINS.filter((x) => view.has(x)), edit: ALL_DOMAINS.filter((x) => edit.has(x)) });
  };
  return (
    <View style={{ gap: 2 }}>
      {ALL_DOMAINS.map((d) => (
        <View key={d} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: 6, borderBottomWidth: 0.5, borderColor: t.colors.border }}>
          <View style={{ flex: 1 }}>
            <Text weight="medium">{domainLabel(d).title}</Text>
            <Text variant="caption" muted>{domainLabel(d).detail}</Text>
          </View>
          <Chip label={tr('u1.fam.view')} icon="eye" selected={value.view.includes(d)} onPress={disabled ? undefined : () => toggle(d, 'view')} />
          <Chip label={tr('u1.fam.edit')} icon="edit-2" selected={value.edit.includes(d)} onPress={disabled ? undefined : () => toggle(d, 'edit')} />
        </View>
      ))}
    </View>
  );
}

function MemberCard({ member, isMe, amOwner }: { member: HouseholdMember; isMe: boolean; amOwner: boolean }) {
  const toast = useToast();
  const update = useUpdateMemberRights();
  const remove = useRemoveMember();
  const [rights, setRights] = useState<Rights>({ view: member.can_view, edit: member.can_edit });
  const [scope, setScope] = useState<Scope>({ children: member.child_scope ?? null, pregnancy: member.pregnancy_access ?? true });
  const setMemberScope = useSetMemberScope();
  const [open, setOpen] = useState(false);
  useEffect(() => setRights({ view: member.can_view, edit: member.can_edit }), [member.can_view, member.can_edit]);
  const dirty = rights.view.join() !== member.can_view.join() || rights.edit.join() !== member.can_edit.join();
  const editable = amOwner && member.role !== 'owner';

  async function save() {
    try {
      await update.mutateAsync({ householdId: member.household_id, userId: member.user_id, canView: rights.view, canEdit: rights.edit });
      toast(tr('u1.fam.rightsUpdated'));
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  async function saveScope() {
    try {
      await setMemberScope.mutateAsync({ householdId: member.household_id, userId: member.user_id, childScope: scope.children, pregnancyAccess: scope.pregnancy });
      toast(tr('u1.fam.scopeUpdated'));
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  async function revoke() {
    if (!(await confirm(tr('u1.fam.removeTitle'), tr('u1.fam.removeBody'), tr('u1.fam.remove')))) return;
    try {
      await remove.mutateAsync(member);
      toast(tr('u1.fam.accessRemoved'));
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  const summary = member.role === 'owner'
    ? tr('u1.fam.fullAccess')
    : tr('u1.fam.summary', { view: member.can_view.length, total: ALL_DOMAINS.length, edit: member.can_edit.length ? member.can_edit.map((d) => domainLabel(d).title.toLowerCase()).join(', ') : tr('u1.fam.nothing') });

  return (
    <Card>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="bold">{isMe ? tr('u1.fam.youRole', { role: roleLabel(member.role) }) : roleLabel(member.role)}</Text>
          <Text variant="small" muted>{tr('u1.fam.memberSince', { date: formatDate(member.joined_at) })}</Text>
          <Text variant="small" muted>{summary}</Text>
        </View>
        {member.role !== 'owner' ? <Button label={open ? tr('u1.fam.hide') : editable ? tr('u1.fam.manage') : tr('u1.fam.details')} size="sm" variant="ghost" onPress={() => setOpen(!open)} /> : null}
      </Row>
      {open ? (
        <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
          <ProfileScopePicker value={scope} onChange={setScope} disabled={!editable} />
          {editable ? <Button label={tr('u1.fam.saveScope')} size="sm" variant="secondary" loading={setMemberScope.isPending} onPress={saveScope} style={{ alignSelf: 'flex-start' }} /> : null}
          <PermissionMatrix value={rights} onChange={setRights} disabled={!editable} />
          {editable ? (
            <Row wrap>
              <Button label={tr('u1.fam.saveRights')} size="sm" disabled={!dirty} loading={update.isPending} onPress={save} />
              <Button label={tr('u1.fam.removeFromHousehold')} size="sm" variant="ghost" icon="user-x" loading={remove.isPending} onPress={revoke} />
            </Row>
          ) : (
            <Text variant="caption" muted>{tr('u1.fam.ownerOnly')}</Text>
          )}
        </View>
      ) : null}
    </Card>
  );
}

/**
 * Lien d'invitation ouvert sans être connecté·e : le code est gardé pendant l'inscription
 * (ou la connexion), puis proposé automatiquement ensuite.
 */
function InvitedWithoutAccount({ code }: { code: string | null }) {
  useEffect(() => { if (code) void savePendingInvite(code); }, [code]);
  return (
    <Screen back title={tr('u1.fam.invitation')} subtitle={tr('u1.fam.joinOn')}>
      <Card tone="lavender">
        <Text weight="bold">{tr('u1.fam.invitedTitle')}</Text>
        <Text variant="small" style={{ marginTop: 4 }}>{code ? tr('u1.fam.invitedWithCode') : tr('u1.fam.invitedIncomplete')}</Text>
      </Card>
      {code ? (
        <>
          <Button label={tr('u1.fam.createAccount')} size="lg" onPress={() => router.replace('/auth/sign-up')} />
          <Button label={tr('u1.fam.haveAccount')} variant="secondary" onPress={() => router.replace('/auth/sign-in')} />
        </>
      ) : null}
    </Screen>
  );
}

export default function FamilyScreen() {
  const { session, ready } = useAuth();
  const params = useLocalSearchParams<{ code?: string }>();
  if (ready && !session) return <InvitedWithoutAccount code={typeof params.code === 'string' ? extractInviteCode(params.code) : null} />;
  return <FamilyScreenSignedIn />;
}

function FamilyScreenSignedIn() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const me = useUserId();
  const params = useLocalSearchParams<{ code?: string }>();
  const hid = useHouseholdId();
  const household = useHousehold();
  const membership = useMyMembership();
  const { data: members, isLoading } = useHouseholdMembers();
  const amOwner = membership?.role === 'owner';
  const { data: invitations } = useInvitations(hid, amOwner);
  const createInvitation = useCreateInvitation();
  const revokeInvitation = useRevokeInvitation();
  const accept = useAcceptInvitation();
  const removeMember = useRemoveMember();
  const rename = useRenameHousehold();

  const [role, setRole] = useState<'coparent' | 'caregiver'>('coparent');
  const [rights, setRights] = useState<Rights>({ view: DEFAULT_VIEW, edit: DEFAULT_EDIT });
  const [scope, setScope] = useState<Scope>({ children: null, pregnancy: true });
  const inviteAccess = usePremiumAccess('coparent_invite');
  const { data: kidsForPreview } = useChildren();
  const [token, setToken] = useState<string | null>(null);
  const [code, setCode] = useState(typeof params.code === 'string' ? params.code : '');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  useEffect(() => { if (household) setName(household.name); }, [household]);
  useEffect(() => {
    setRights(role === 'caregiver' ? { view: ['daily', 'health', 'lists'], edit: ['daily'] } : { view: DEFAULT_VIEW, edit: DEFAULT_EDIT });
  }, [role]);

  const pending = useMemo(
    () => (invitations ?? []).filter((i) => !i.accepted_at && !i.revoked_at && new Date(i.expires_at) > new Date()),
    [invitations],
  );
  const link = token ? Linking.createURL('/settings/family', { queryParams: { code: token } }) : null;

  async function invite() {
    if (!hid) return;
    if (!rights.view.length) return toast(tr('u1.fam.errDomain'), 'error');
    if (scope.children && !scope.children.length && !scope.pregnancy) return toast(tr('u1.fam.errProfile'), 'error');
    const names = (kidsForPreview ?? []).filter((k) => scope.children == null || scope.children.includes(k.id)).map((k) => k.first_name);
    if (!inviteAccess.require(<Text variant="small">{tr('u1.fam.premiumPreview', { names: formatList(names) || tr('u1.fam.yourProfiles') })}</Text>)) return;
    try {
      const tk = await createInvitation.mutateAsync({ householdId: hid, role, canView: rights.view, canEdit: rights.edit, childScope: scope.children, pregnancyAccess: scope.pregnancy });
      setToken(tk);
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  async function shareInvite() {
    if (!token || !link) return;
    await Share.share({
      title: tr('u1.fam.shareTitle', { app: BRAND.name }),
      message: tr('u1.fam.shareMessage', { app: BRAND.name, link, token }),
    }).catch(() => undefined);
  }

  async function join() {
    const c = code.trim().replace(/\s+/g, '');
    if (c.length < 16) return setCodeError(tr('u1.fam.codeIncomplete'));
    setCodeError(null);
    try {
      await accept.mutateAsync(c);
      setCode('');
      await takePendingInvite(); // l'invitation en attente est utilisée
      toast(tr('u1.fam.welcome'));
      if (params.code) router.replace('/'); // arrivé·e par le lien : on continue (onboarding ou accueil)
    } catch (e) {
      setCodeError(friendlyError(e));
    }
  }

  async function leave() {
    if (!membership) return;
    if (!(await confirm(tr('u1.fam.leaveTitle'), tr('u1.fam.leaveBody'), tr('u1.fam.leave')))) return;
    try {
      await removeMember.mutateAsync(membership);
      toast(tr('u1.fam.left'));
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  async function createHousehold() {
    setCreating(true);
    try {
      await ensureHousehold();
      inv('memberships', 'members', 'household');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setCreating(false);
    }
  }

  async function saveName() {
    if (!household) return;
    const v = name.trim();
    if (v.length < 1 || v.length > 60) return toast(tr('u1.fam.errName'), 'error');
    try {
      await rename.mutateAsync({ id: household.id, name: v });
      toast(tr('u1.fam.nameSaved'));
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  return (
    <Screen back title={tr('u1.fam.title')} subtitle={tr('u1.fam.subtitle')}>
      {params.code && !isDemo ? (
        <Card tone="lavender">
          <Text weight="bold">{tr('u1.fam.joinQuestion')}</Text>
          <Text variant="small" style={{ marginTop: 4 }}>{tr('u1.fam.joinBody')}</Text>
          <Row wrap style={{ marginTop: spacing.sm }}>
            <Button label={tr('u1.fam.joinHousehold')} icon="log-in" loading={accept.isPending} onPress={join} />
            <Button label={tr('u1.fam.later')} variant="ghost" onPress={async () => { await takePendingInvite(); router.replace('/'); }} />
          </Row>
          {codeError ? <Text variant="small" color={t.colors.danger} style={{ marginTop: 4 }}>{codeError}</Text> : null}
        </Card>
      ) : null}
      {isDemo ? (
        <Banner tone="demo" title={tr('u1.fam.demoTitle')}>{tr('u1.fam.demoBody')}</Banner>
      ) : null}

      {/* Ma situation (07/11/2026) : seule → accueil « Maman solo », cercle d'aide pour « Je décroche » */}
      <ListRow icon="heart" title={tr('sol.settings')} subtitle={tr('sol.settingsD')} onPress={() => router.push('/family/solo')} testID="fam-situation" />

      {!hid && !isLoading ? (
        <Card tone="soft">
          <Text weight="bold">{tr('u1.fam.noHousehold')}</Text>
          <Text variant="small" muted style={{ marginTop: 4 }}>{tr('u1.fam.noHouseholdD')}</Text>
          <Button label={tr('u1.fam.createHousehold')} size="sm" loading={creating} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={createHousehold} />
        </Card>
      ) : null}

      {hid ? (
        <>
          <SectionTitle title={household?.name ?? tr('u1.fam.myHousehold')} />
          {amOwner ? (
            <Card>
              <Field label={tr('u1.fam.householdName')} value={name} onChangeText={setName} maxLength={60} />
              <Button label={tr('u1.fam.rename')} size="sm" variant="secondary" disabled={name.trim() === household?.name} loading={rename.isPending} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={saveName} />
            </Card>
          ) : null}
          {isLoading ? <Loading /> : (members ?? []).map((m) => <MemberCard key={m.user_id} member={m} isMe={m.user_id === me} amOwner={amOwner} />)}
          <Text variant="caption" muted>{tr('u1.fam.privacyNote')}</Text>

          {amOwner ? (
            <>
              <SectionTitle title={tr('u1.fam.inviteSomeone')} />
              <Card>
                <View style={{ gap: spacing.sm }}>
                  <Segmented label={tr('u1.fam.inviteeRole')} value={role} onChange={setRole} options={[{ value: 'coparent', label: tr('u1.fam.role.coparent') }, { value: 'caregiver', label: tr('u1.fam.role.caregiver') }]} />
                  <Text variant="small" muted>{tr('u1.fam.chooseRights')}</Text>
                  <ProfileScopePicker value={scope} onChange={setScope} />
                  <PermissionMatrix value={rights} onChange={setRights} />
                  <Button label={tr('u1.fam.createInvitation')} icon="user-plus" loading={createInvitation.isPending} onPress={invite} testID="invite-create" />
                  {!inviteAccess.premium ? <Text variant="caption" muted>{tr('u1.fam.premiumNote')}</Text> : null}
                </View>
              </Card>
              {token ? (
                <Card tone="lavender">
                  <Text weight="bold">{tr('u1.fam.ready')}</Text>
                  <Text variant="small" muted style={{ marginTop: 4 }}>{tr('u1.fam.codeOnce')}</Text>
                  <View style={{ marginVertical: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: t.colors.surface }}>
                    <Text selectable weight="bold" center style={{ letterSpacing: 1 }} accessibilityLabel={tr('u1.fam.codeA11y', { code: token.split('').join(' ') })}>{token}</Text>
                  </View>
                  <Row wrap>
                    <Button label={tr('u1.fam.shareInvitation')} icon="share-2" size="sm" onPress={shareInvite} />
                    <Button label={tr('u1.fam.close')} size="sm" variant="ghost" onPress={() => setToken(null)} />
                  </Row>
                </Card>
              ) : null}
              {pending.length ? (
                <Card>
                  <Text weight="bold">{tr('u1.fam.pendingInvites')}</Text>
                  {pending.map((i, idx) => (
                    <View key={i.id}>
                      {idx > 0 ? <Divider /> : null}
                      <Row style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
                        <View style={{ flex: 1 }}>
                          <Text>{roleLabel(i.role)}</Text>
                          <Text variant="caption" muted>{tr('u1.fam.expires', { date: formatDate(i.expires_at, { day: 'numeric', month: 'long' }) })}</Text>
                        </View>
                        <Button label={tr('u1.fam.revoke')} size="sm" variant="ghost" onPress={async () => {
                          try { await revokeInvitation.mutateAsync(i.id); toast(tr('u1.fam.revoked')); } catch (e) { toast(friendlyError(e), 'error'); }
                        }} />
                      </Row>
                    </View>
                  ))}
                </Card>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      <SectionTitle title={tr('u1.fam.haveCode')} />
      <Card>
        <Field label={tr('u1.fam.inviteCode')} value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} error={codeError} hint={tr('u1.fam.codeHint')} />
        <Button label={tr('u1.fam.joinHousehold')} variant="secondary" icon="log-in" loading={accept.isPending} disabled={!code.trim()} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={join} />
      </Card>

      {membership && !amOwner ? (
        <Button label={tr('u1.fam.leaveBtn')} variant="ghost" icon="log-out" loading={removeMember.isPending} onPress={leave} />
      ) : null}
      {amOwner ? (
        <Text variant="caption" muted>{tr('u1.fam.ownerCantLeave')}</Text>
      ) : null}
    </Screen>
  );
}
