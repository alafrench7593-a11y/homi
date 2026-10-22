/**
 * Créer ou modifier mon profil communautaire : avatar (illustration ou photo sans métadonnées), pseudonyme,
 * identifiant unique « @ », courte présentation, parcours facultatif, visibilité du profil, règles de la communauté.
 * Jamais le prénom, le nom, l'adresse e-mail, ni aucune donnée de suivi.
 */
import { PremiumSection } from '@/components/Premium';
import { ACCENT_COLOR } from '@/features/communitySocial';
import { backend, eq } from '@/lib/backend';
import { useInvalidate, usePremium } from '@/lib/data/hooks';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { useClearTopicViews, useTopicViews } from '@/lib/data/hooks-social';
import { ACCENT_LABEL, BANNER_LABEL, PROFILE_ACCENTS, PROFILE_BANNERS } from '@/lib/domain/communitySocial';
import { isPremiumRequired } from '@/lib/premium/features';
import type { CommunityProfile } from '@/lib/types';
import { MIN_TOUCH } from '@/theme/tokens';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, Row, SectionTitle, Segmented, Text, Toggle } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Avatar, PresetAvatar } from '@/features/community';
import { useAuth } from '@/lib/auth';
import { useCommunityProfile, useProfile } from '@/lib/data/hooks';
import { pseudonymError, useSaveCommunityProfile, useSetAvatarPhoto } from '@/lib/data/hooks-community';
import { friendlyError } from '@/lib/data/hooks-settings';
import { AVATAR_PRESETS, handleBase, handleError, JOURNEY_LABELS, normalizeHandle } from '@/lib/domain/communityRules';
import { pickPhotos } from '@/lib/documents/io';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { localeTag, t as tr } from '@/i18n';

export default function CommunityProfileScreen() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ next?: string }>();
  const { session } = useAuth();
  const meQ = useCommunityProfile();
  const me = meQ.data;
  const { data: profile } = useProfile();
  const saveM = useSaveCommunityProfile();
  const avatarM = useSetAvatarPhoto();
  const [pseudo, setPseudo] = useState('');
  const [handle, setHandle] = useState('');
  const [handleTouched, setHandleTouched] = useState(false);
  const [bio, setBio] = useState('');
  const [journey, setJourney] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'members' | 'minimal'>('members');
  const [preset, setPreset] = useState<string>('moon');
  const [rules, setRules] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handleErr, setHandleErr] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    setPseudo(me.pseudonym); setHandle(me.handle ?? ''); setHandleTouched(true); setBio(me.bio ?? ''); setJourney(me.journey_label ?? null);
    setVisibility(me.visibility ?? 'members'); setPreset(me.avatar_preset ?? 'moon');
  }, [me?.user_id, me?.handle]); // eslint-disable-line react-hooks/exhaustive-deps
  // Identifiant proposé d'après le pseudonyme tant que la personne ne l'a pas modifié
  useEffect(() => { if (!handleTouched && pseudo.trim()) setHandle(handleBase(pseudo)); }, [pseudo, handleTouched]);
  const bioLeft = 280 - bio.length;
  const creating = !me;
  const preview = useMemo(() => normalizeHandle(handle), [handle]);

  async function save() {
    if (saveM.isPending) return;
    const e = pseudonymError(pseudo, { displayName: profile?.display_name, email: session?.email });
    const he = handleError(handle);
    setError(e); setHandleErr(he);
    if (e || he) return;
    if (creating && !rules) { setError(tr('cm2.profile.acceptRules')); return; }
    try {
      await saveM.mutateAsync({ pseudonym: pseudo, handle: preview, bio, journeyLabel: journey, visibility, avatarPreset: preset, acceptRules: creating, exists: !creating, areaLabel: me?.area_label ?? null });
      toast(creating ? tr('cm2.profile.welcome') : tr('cm2.profile.saved'));
      if (params.next === 'new') router.replace('/community/new');
      else if (params.next === 'groups') router.replace('/community/groups' as never);
      else if (router.canGoBack()) router.back();
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      const msg = friendlyError(err, tr('cm2.profile.saveFailed'));
      if (/handle|identifiant/i.test(raw)) setHandleErr(/duplicate|pris|unique/i.test(raw) ? tr('cm2.profile.handleTaken') : raw);
      else setError(/existe|duplicate|unique/i.test(raw) ? tr('cm2.profile.pseudoTaken') : msg);
    }
  }

  async function pickPhoto() {
    const res = await pickPhotos(false);
    if (res === 'denied') { toast(tr('cm2.photosDenied'), 'error'); return; }
    if (!res.length) return;
    try {
      await avatarM.mutateAsync({ uri: res[0].uri, previous: me?.avatar_path ?? null });
      toast(tr('cm2.profile.photoUpdated'));
    } catch (e) { toast(friendlyError(e, tr('cm2.profile.photoFailed')), 'error'); }
  }
  async function removePhoto() {
    if (!(await confirm(tr('cm2.profile.removePhotoTitle'), tr('cm2.profile.removePhotoBody'), tr('cm2.profile.remove')))) return;
    try { await avatarM.mutateAsync({ uri: null, previous: me?.avatar_path ?? null }); toast(tr('cm2.profile.photoDeleted')); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  if (meQ.isLoading && !me) return <Screen back title={tr('cm2.profile.title')}><Skeleton kind="detail" rows={4} /></Screen>;
  if (meQ.isError && !me) return <Screen back title={tr('cm2.profile.title')}><ErrorView error={meQ.error} onRetry={() => void meQ.refetch()} /></Screen>;

  return (
    <Screen back title={creating ? tr('cm2.profile.create') : tr('cm2.profile.edit')} subtitle={tr('cm2.profile.subtitle')}>
      {me?.suspended_until && new Date(me.suspended_until) > new Date() ? <Banner tone="warning">{tr('cm2.profile.suspended', { date: new Date(me.suspended_until).toLocaleDateString(localeTag()) })}</Banner> : null}

      <SectionTitle title={tr('cm2.profile.avatar')} />
      <Card>
        <Row style={{ alignItems: 'center' }}>
          <Avatar path={me?.avatar_path} preset={preset} size={72} label={tr('cm2.profile.avatarPreview')} />
          <View style={{ flex: 1, gap: 6 }}>
            {me ? (
              <Row wrap>
                <Button label={me.avatar_path ? tr('cm2.profile.changePhoto') : tr('cm2.profile.choosePhoto')} size="sm" variant="secondary" icon="image" loading={avatarM.isPending} onPress={pickPhoto} testID="profile-photo-pick" />
                {me.avatar_path ? <Button label={tr('cm2.profile.removePhoto')} size="sm" variant="ghost" icon="trash-2" onPress={removePhoto} testID="profile-photo-remove" /> : null}
              </Row>
            ) : <Text variant="small" muted>{tr('cm2.profile.photoLater')}</Text>}
          </View>
        </Row>
        <Text variant="small" weight="bold" style={{ marginTop: spacing.sm }}>{tr('cm2.profile.orIllustration')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }} testID="profile-presets">
          {AVATAR_PRESETS.map((p) => (
            <Tappable key={p} accessibilityRole="radio" accessibilityState={{ selected: preset === p }} accessibilityLabel={tr('cm2.profile.illustration', { name: p })} onPress={() => setPreset(p)} testID={`preset-${p}`}
              style={{ borderRadius: 28, padding: 2, borderWidth: 2, borderColor: preset === p ? t.colors.primary : 'transparent' }}>
              <PresetAvatar preset={p} size={44} />
            </Tappable>
          ))}
        </View>
        {me?.avatar_path ? <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('cm2.profile.photoFirst')}</Text> : null}
      </Card>

      <SectionTitle title={tr('cm2.profile.identity')} />
      <Card>
        <Field label={tr('cm2.profile.pseudonym')} value={pseudo} onChangeText={setPseudo} maxLength={24} autoCorrect={false} error={error ?? undefined} hint={tr('cm2.profile.pseudonymHint')} testID="profile-pseudo" />
        <Field label={tr('cm2.profile.handle')} value={handle} onChangeText={(v) => { setHandle(v); setHandleTouched(true); setHandleErr(null); }} maxLength={21} autoCapitalize="none" autoCorrect={false}
          error={handleErr ?? undefined} hint={tr('cm2.profile.handleHint', { handle: preview || tr('cm2.profile.handlePlaceholder') })} testID="profile-handle" />
        <Field label={tr('cm2.profile.bio')} optional value={bio} onChangeText={(v) => setBio(v.slice(0, 280))} multiline maxLength={280} placeholder={tr('cm2.profile.bioPlaceholder')} hint={tr('cm2.profile.bioLeft', { count: String(bioLeft) })} testID="profile-bio-input" />
        <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }}>{tr('cm2.profile.journey')}</Text>
        <Row wrap>
          <Chip label={tr('cm2.profile.hideJourney')} selected={!journey} onPress={() => setJourney(null)} />
          {Object.entries(JOURNEY_LABELS).map(([k, l]) => <Chip key={k} label={l} selected={journey === k} onPress={() => setJourney(k)} testID={`journey-${k}`} />)}
        </Row>
      </Card>

      <SectionTitle title={tr('cm2.profile.visibility')} />
      <Card>
        <Segmented label={tr('cm2.profile.visibility')} value={visibility} onChange={setVisibility} options={[{ value: 'members', label: tr('cm2.profile.members') }, { value: 'minimal', label: tr('cm2.profile.minimal') }]} />
        <Text variant="small" muted style={{ marginTop: 6 }} testID="profile-visibility-help">
          {visibility === 'members'
            ? tr('cm2.profile.membersHelp')
            : tr('cm2.profile.minimalHelp')}
        </Text>
        <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('cm2.profile.neverVisible')}</Text>
      </Card>

      {creating ? (
        <Card tone="soft">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flex: 1 }}><Text weight="medium">{tr('cm2.profile.rulesAccept')}</Text></View>
            <Toggle label={tr('cm2.profile.rulesAccept')} value={rules} onChange={setRules} />
          </View>
          <Button label={tr('cm2.profile.readRules')} size="sm" variant="ghost" icon="book-open" style={{ alignSelf: 'flex-start' }} onPress={() => router.push('/community/rules' as never)} />
        </Card>
      ) : null}
      <Button label={creating ? tr('cm2.profile.create') : tr('cm2.profile.save')} size="lg" loading={saveM.isPending} onPress={save} testID="profile-save" />
      {!creating && me ? <Customization me={me} /> : null}
      {!creating ? <FeedPersonalization /> : null}
      {!creating ? <Button label={tr('cm2.profile.viewPublic')} variant="ghost" icon="eye" onPress={() => router.push(`/community/u/${me!.handle}` as never)} testID="profile-view-public" /> : null}
    </Screen>
  );
}


/** Personnalisation Premium : couleur, bannière, présentation enrichie, badge facultatif. Toujours retirable. */
function Customization({ me }: { me: CommunityProfile }) {
  const t = useTheme();
  const toast = useToast();
  const premium = usePremium();
  const access = usePremiumAccess('community_profile');
  const inv = useInvalidate();
  const [accent, setAccent] = useState<string | null>(me.accent ?? null);
  const [banner, setBanner] = useState<string | null>(me.banner ?? null);
  const [about, setAbout] = useState(me.about ?? '');
  const [badge, setBadge] = useState(!!me.show_premium_badge);
  const [busy, setBusy] = useState(false);
  const hasAny = !!(me.accent || me.banner || me.about || me.show_premium_badge);
  async function persist(patch: Record<string, unknown>, ok: string) {
    setBusy(true);
    try { await backend.update('community_profiles', patch, [eq('user_id', me.user_id)], { returning: 'user_id' }); inv('community_profiles', 'forum_feed', 'comment_feed'); toast(ok); }
    catch (e) { if (isPremiumRequired(e)) access.showPreview(); else toast(friendlyError(e), 'error'); }
    finally { setBusy(false); }
  }
  if (!premium) {
    return (
      <View style={{ gap: spacing.sm }}>
        <PremiumSection feature="community_profile" preview={<Text variant="small">{tr('cm2.profile.customPreview', { handle: String(me.handle) })}</Text>}>
          <View />
        </PremiumSection>
        {hasAny ? <Button label={tr('cm2.profile.customRemove')} variant="ghost" icon="x" loading={busy} onPress={() => void persist({ accent: null, banner: null, about: null, show_premium_badge: false }, tr('cm2.profile.customRemoved'))} testID="profile-custom-remove" /> : null}
      </View>
    );
  }
  return (
    <>
      <SectionTitle title={tr('cm2.profile.customize')} />
      <Card testID="profile-custom">
        <Text variant="label" muted>{tr('cm2.profile.color')}</Text>
        <Row wrap gap={6} style={{ marginTop: 4 }}>
          <Chip label={tr('cm2.profile.noColor')} selected={!accent} onPress={() => setAccent(null)} />
          {PROFILE_ACCENTS.map((a) => (
            <Tappable key={a} accessibilityRole="radio" accessibilityState={{ checked: accent === a }} accessibilityLabel={ACCENT_LABEL[a]} onPress={() => setAccent(a)} testID={`accent-${a}`}
              style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: ACCENT_COLOR[a], borderWidth: accent === a ? 3 : 0, borderColor: t.colors.text }} />
            </Tappable>
          ))}
        </Row>
        <Text variant="label" muted style={{ marginTop: spacing.sm }}>{tr('cm2.profile.banner')}</Text>
        <Row wrap gap={6} style={{ marginTop: 4 }}>
          <Chip label={tr('cm2.profile.defaultBanner')} selected={!banner} onPress={() => setBanner(null)} />
          {PROFILE_BANNERS.map((b) => <Chip key={b} label={BANNER_LABEL[b]} selected={banner === b} onPress={() => setBanner(b)} testID={`banner-${b}`} />)}
        </Row>
        <View style={{ marginTop: spacing.sm }}>
          <Field label={tr('cm2.profile.about')} value={about} onChangeText={setAbout} multiline maxLength={1200} hint={`${about.length} / 1200`} testID="profile-about" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
          <View style={{ flex: 1 }}><Text weight="medium">{tr('cm2.profile.badge')}</Text><Text variant="caption" muted>{tr('cm2.profile.badgeHint')}</Text></View>
          <Toggle label={tr('cm2.profile.badgeToggle')} value={badge} onChange={setBadge} />
        </View>
        <Button label={tr('cm2.profile.customSave')} icon="check" style={{ marginTop: spacing.sm }} loading={busy}
          onPress={() => void persist({ accent, banner, about: about.trim() || null, show_premium_badge: badge }, tr('cm2.profile.customSaved'))} testID="profile-custom-save" />
      </Card>
    </>
  );
}

/** Ce qui sert à classer « Pour vous » : visible, effaçable. Calculé sur le téléphone. */
function FeedPersonalization() {
  const toast = useToast();
  const views = useTopicViews();
  const clear = useClearTopicViews();
  const count = (views.data ?? []).length;
  return (
    <Card tone="soft" testID="feed-personalization">
      <Text weight="bold">{tr('cm2.profile.feedTitle')}</Text>
      <Text variant="small" muted style={{ marginTop: 4 }}>
        {tr('cm2.profile.feedBody')}
      </Text>
      <Text variant="small" style={{ marginTop: 4 }}>{count ? tr('cm2.profile.topicsCount', { count: String(count) }) : tr('cm2.profile.noTopics')}</Text>
      {count ? <Button label={tr('cm2.profile.clearTopics')} size="sm" variant="ghost" icon="trash-2" style={{ alignSelf: 'flex-start' }} onPress={() => clear.mutate(undefined, { onSuccess: () => toast(tr('cm2.profile.topicsCleared')), onError: (e) => toast(friendlyError(e), 'error') })} testID="clear-topic-views" /> : null}
    </Card>
  );
}
