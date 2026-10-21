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
import { Banner, Button, Card, Chip, Divider, Field, Loading, Row, Segmented, SectionTitle, Text } from '@/components/ui';
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

const DOMAIN_LABEL: Record<Domain, { title: string; detail: string }> = {
  daily: { title: 'Quotidien', detail: 'Tétées, biberons, couches, sommeil, repas' },
  health: { title: 'Santé', detail: 'Mesures, rendez-vous, vaccins, traitements' },
  documents: { title: 'Documents', detail: 'Coffre de documents partagés' },
  pregnancy: { title: 'Grossesse', detail: 'Suivi de grossesse' },
  lists: { title: 'Listes et organisation', detail: 'Valise, achats, tâches, relais, routines, agenda familial' },
  names: { title: 'Prénoms', detail: 'Favoris et votes' },
  profile: { title: 'Profils', detail: 'Fiches des enfants' },
};
const ROLE_LABEL: Record<HouseholdMember['role'], string> = { owner: 'Propriétaire', coparent: 'Coparent', caregiver: 'Proche ou garde' };
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
      <Text variant="label">Profils partagés</Text>
      <Row wrap>
        <Chip label="Tous les enfants" selected={all} onPress={disabled ? undefined : () => onChange({ ...value, children: all ? kids.map((k) => k.id) : null })} />
        {kids.map((k) => <Chip key={k.id} label={k.first_name} selected={has(k.id)} onPress={disabled ? undefined : () => toggle(k.id)} />)}
        {pregnancy ? <Chip label="Ma grossesse" selected={value.pregnancy} onPress={disabled ? undefined : () => onChange({ ...value, pregnancy: !value.pregnancy })} /> : null}
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
            <Text weight="medium">{DOMAIN_LABEL[d].title}</Text>
            <Text variant="caption" muted>{DOMAIN_LABEL[d].detail}</Text>
          </View>
          <Chip label="Voir" icon="eye" selected={value.view.includes(d)} onPress={disabled ? undefined : () => toggle(d, 'view')} />
          <Chip label="Modifier" icon="edit-2" selected={value.edit.includes(d)} onPress={disabled ? undefined : () => toggle(d, 'edit')} />
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
      toast('Droits mis à jour.');
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  async function saveScope() {
    try {
      await setMemberScope.mutateAsync({ householdId: member.household_id, userId: member.user_id, childScope: scope.children, pregnancyAccess: scope.pregnancy });
      toast('Profils partagés mis à jour.');
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  async function revoke() {
    if (!(await confirm('Retirer ce membre ?', 'Cette personne n’aura plus accès aux informations du foyer. Ses propres données personnelles ne sont pas supprimées.', 'Retirer'))) return;
    try {
      await remove.mutateAsync(member);
      toast('Accès retiré.');
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  const summary = member.role === 'owner'
    ? 'Accès complet'
    : `Voit ${member.can_view.length}/${ALL_DOMAINS.length} domaines · modifie ${member.can_edit.length ? member.can_edit.map((d) => DOMAIN_LABEL[d].title.toLowerCase()).join(', ') : 'rien'}`;

  return (
    <Card>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="bold">{isMe ? `Vous · ${ROLE_LABEL[member.role]}` : ROLE_LABEL[member.role]}</Text>
          <Text variant="small" muted>{`Membre depuis le ${new Date(member.joined_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}</Text>
          <Text variant="small" muted>{summary}</Text>
        </View>
        {member.role !== 'owner' ? <Button label={open ? 'Masquer' : editable ? 'Gérer' : 'Détails'} size="sm" variant="ghost" onPress={() => setOpen(!open)} /> : null}
      </Row>
      {open ? (
        <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
          <ProfileScopePicker value={scope} onChange={setScope} disabled={!editable} />
          {editable ? <Button label="Enregistrer les profils partagés" size="sm" variant="secondary" loading={setMemberScope.isPending} onPress={saveScope} style={{ alignSelf: 'flex-start' }} /> : null}
          <PermissionMatrix value={rights} onChange={setRights} disabled={!editable} />
          {editable ? (
            <Row wrap>
              <Button label="Enregistrer les droits" size="sm" disabled={!dirty} loading={update.isPending} onPress={save} />
              <Button label="Retirer du foyer" size="sm" variant="ghost" icon="user-x" loading={remove.isPending} onPress={revoke} />
            </Row>
          ) : (
            <Text variant="caption" muted>Seul le propriétaire du foyer peut modifier ces droits.</Text>
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
    <Screen back title="Invitation" subtitle="Rejoindre un foyer sur Toi & Moi">
      <Card tone="lavender">
        <Text weight="bold">Vous êtes invité·e à rejoindre un foyer</Text>
        <Text variant="small" style={{ marginTop: 4 }}>{code ? 'Créez votre compte ou connectez-vous : l’invitation vous attendra, puis vous la confirmerez en un geste.' : 'Ce lien d’invitation est incomplet. Demandez à la personne qui vous a invité·e de vous le renvoyer.'}</Text>
      </Card>
      {code ? (
        <>
          <Button label="Créer mon compte" size="lg" onPress={() => router.replace('/auth/sign-up')} />
          <Button label="J’ai déjà un compte" variant="secondary" onPress={() => router.replace('/auth/sign-in')} />
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
    if (!rights.view.length) return toast('Choisissez au moins un domaine visible.', 'error');
    if (scope.children && !scope.children.length && !scope.pregnancy) return toast('Choisissez au moins un profil à partager.', 'error');
    const names = (kidsForPreview ?? []).filter((k) => scope.children == null || scope.children.includes(k.id)).map((k) => k.first_name);
    if (!inviteAccess.require(<Text variant="small">{`${names.join(' et ') || 'Vos profils'} : biberons, sommeil, couches et rendez-vous synchronisés sur les deux téléphones, avec « qui a noté » sur chaque saisie.`}</Text>)) return;
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
      title: `Rejoindre notre famille sur ${BRAND.name}`,
      message: `Je t’invite à rejoindre notre famille sur ${BRAND.name}.\n\nOuvre ce lien depuis ton téléphone : ${link}\n\nOu saisis ce code dans Réglages › Famille & partage › « J’ai un code » :\n${token}\n\nL’invitation expire dans 7 jours.`,
    }).catch(() => undefined);
  }

  async function join() {
    const c = code.trim().replace(/\s+/g, '');
    if (c.length < 16) return setCodeError('Ce code paraît incomplet : copiez-le en entier.');
    setCodeError(null);
    try {
      await accept.mutateAsync(c);
      setCode('');
      await takePendingInvite(); // l'invitation en attente est utilisée
      toast('Bienvenue dans ce foyer !');
      if (params.code) router.replace('/'); // arrivé·e par le lien : on continue (onboarding ou accueil)
    } catch (e) {
      setCodeError(friendlyError(e));
    }
  }

  async function leave() {
    if (!membership) return;
    if (!(await confirm('Quitter ce foyer ?', 'Vous n’aurez plus accès aux informations partagées de ce foyer. Vos données personnelles (humeur, cycle, poids…) restent à vous.', 'Quitter'))) return;
    try {
      await removeMember.mutateAsync(membership);
      toast('Vous avez quitté le foyer.');
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
    if (v.length < 1 || v.length > 60) return toast('Le nom doit compter de 1 à 60 caractères.', 'error');
    try {
      await rename.mutateAsync({ id: household.id, name: v });
      toast('Nom du foyer enregistré.');
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  return (
    <Screen back title="Famille & partage" subtitle="Suivez à plusieurs, chacun avec les accès choisis.">
      {params.code && !isDemo ? (
        <Card tone="lavender">
          <Text weight="bold">Rejoindre le foyer qui vous a invité·e ?</Text>
          <Text variant="small" style={{ marginTop: 4 }}>Vous verrez et modifierez seulement ce que la personne a choisi de partager. Vos données personnelles restent à vous.</Text>
          <Row wrap style={{ marginTop: spacing.sm }}>
            <Button label="Rejoindre le foyer" icon="log-in" loading={accept.isPending} onPress={join} />
            <Button label="Plus tard" variant="ghost" onPress={async () => { await takePendingInvite(); router.replace('/'); }} />
          </Row>
          {codeError ? <Text variant="small" color={t.colors.danger} style={{ marginTop: 4 }}>{codeError}</Text> : null}
        </Card>
      ) : null}
      {isDemo ? (
        <Banner tone="demo" title="Mode démonstration">{'Un seul compte existe sur cet appareil : vous pouvez préparer une invitation, mais la rejoindre nécessite la connexion à Supabase.'}</Banner>
      ) : null}

      {!hid && !isLoading ? (
        <Card tone="soft">
          <Text weight="bold">Vous n’avez pas encore de foyer</Text>
          <Text variant="small" muted style={{ marginTop: 4 }}>Créez-le pour inviter un coparent, ou rejoignez celui d’un proche avec un code.</Text>
          <Button label="Créer mon foyer" size="sm" loading={creating} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={createHousehold} />
        </Card>
      ) : null}

      {hid ? (
        <>
          <SectionTitle title={household?.name ?? 'Mon foyer'} />
          {amOwner ? (
            <Card>
              <Field label="Nom du foyer" value={name} onChangeText={setName} maxLength={60} />
              <Button label="Renommer" size="sm" variant="secondary" disabled={name.trim() === household?.name} loading={rename.isPending} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={saveName} />
            </Card>
          ) : null}
          {isLoading ? <Loading /> : (members ?? []).map((m) => <MemberCard key={m.user_id} member={m} isMe={m.user_id === me} amOwner={amOwner} />)}
          <Text variant="caption" muted>Pour protéger la vie privée de chacun, seul le rôle des membres est affiché. Les données personnelles (humeur, cycle, poids) ne sont jamais partagées.</Text>

          {amOwner ? (
            <>
              <SectionTitle title="Inviter quelqu’un" />
              <Card>
                <View style={{ gap: spacing.sm }}>
                  <Segmented label="Rôle de la personne invitée" value={role} onChange={setRole} options={[{ value: 'coparent', label: 'Coparent' }, { value: 'caregiver', label: 'Proche ou garde' }]} />
                  <Text variant="small" muted>Choisissez ce que cette personne pourra voir et modifier. Vous pourrez changer ces droits à tout moment.</Text>
                  <ProfileScopePicker value={scope} onChange={setScope} />
                  <PermissionMatrix value={rights} onChange={setRights} />
                  <Button label="Créer l’invitation" icon="user-plus" loading={createInvitation.isPending} onPress={invite} testID="invite-create" />
                  {!inviteAccess.premium ? <Text variant="caption" muted>Inviter un coparent fait partie de Premium. Retirer un membre ou quitter un foyer reste toujours possible.</Text> : null}
                </View>
              </Card>
              {token ? (
                <Card tone="lavender">
                  <Text weight="bold">Invitation prête</Text>
                  <Text variant="small" muted style={{ marginTop: 4 }}>Ce code n’est affiché qu’une seule fois. Il est valable 7 jours et ne peut servir qu’une fois.</Text>
                  <View style={{ marginVertical: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: t.colors.surface }}>
                    <Text selectable weight="bold" center style={{ letterSpacing: 1 }} accessibilityLabel={`Code d’invitation : ${token.split('').join(' ')}`}>{token}</Text>
                  </View>
                  <Row wrap>
                    <Button label="Partager l’invitation" icon="share-2" size="sm" onPress={shareInvite} />
                    <Button label="Fermer" size="sm" variant="ghost" onPress={() => setToken(null)} />
                  </Row>
                </Card>
              ) : null}
              {pending.length ? (
                <Card>
                  <Text weight="bold">Invitations en attente</Text>
                  {pending.map((i, idx) => (
                    <View key={i.id}>
                      {idx > 0 ? <Divider /> : null}
                      <Row style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
                        <View style={{ flex: 1 }}>
                          <Text>{ROLE_LABEL[i.role]}</Text>
                          <Text variant="caption" muted>{`Expire le ${new Date(i.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}</Text>
                        </View>
                        <Button label="Révoquer" size="sm" variant="ghost" onPress={async () => {
                          try { await revokeInvitation.mutateAsync(i.id); toast('Invitation révoquée.'); } catch (e) { toast(friendlyError(e), 'error'); }
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

      <SectionTitle title="J’ai un code" />
      <Card>
        <Field label="Code d’invitation" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} error={codeError} hint="Reçu de la personne qui gère le foyer." />
        <Button label="Rejoindre le foyer" variant="secondary" icon="log-in" loading={accept.isPending} disabled={!code.trim()} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={join} />
      </Card>

      {membership && !amOwner ? (
        <Button label="Quitter ce foyer" variant="ghost" icon="log-out" loading={removeMember.isPending} onPress={leave} />
      ) : null}
      {amOwner ? (
        <Text variant="caption" muted>En tant que propriétaire, vous ne pouvez pas quitter ce foyer. Si vous supprimez votre compte, le foyer partagé est transmis à un coparent.</Text>
      ) : null}
    </Screen>
  );
}
