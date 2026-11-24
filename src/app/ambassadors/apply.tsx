/**
 * Candidature HOMI Ambassadors : identité de contact, pays, profil, engagements. Le serveur valide le code
 * (format, unicité) et place la candidature « en attente » ; l'équipe valide ensuite.
 */
import React, { useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Chip, Field, Row, Text } from '@/components/ui';
import { CheckRow, LegalLink } from '@/features/auth';
import { useToast } from '@/components/Overlays';
import { AFFILIATE_CODE } from '@/lib/affiliateReferral';
import { PROFILE_TYPES, useApplyAffiliate, type ProfileType } from '@/lib/data/hooks-ambassadors';
import { friendlyError } from '@/lib/data/hooks-settings';
import { getLocale, t as tr, type TKey } from '@/i18n';

const LANGS = ['fr', 'en', 'es', 'de', 'it'];

export default function AmbassadorApply() {
  const apply = useApplyAffiliate();
  const toast = useToast();
  const [f, setF] = useState({ code: '', firstName: '', lastName: '', email: '', country: '', audience: '', channel: '' });
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [accept, setAccept] = useState(false);
  const [honest, setHonest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (v: string) => { setF((x) => ({ ...x, [k]: v })); setError(null); };
  const codeOk = AFFILIATE_CODE.test(f.code.trim().toLowerCase());

  function submit() {
    if (!codeOk) return setError(tr('amb.apply.invalidCode'));
    if (!f.firstName.trim() || !f.lastName.trim() || !/^\S+@\S+\.\S+$/.test(f.email.trim()) || !/^[a-zA-Z]{2}$/.test(f.country.trim()) || !profile || !accept || !honest) {
      return setError(tr('amb.apply.required'));
    }
    const lang = LANGS.includes(getLocale()) ? getLocale() : 'en';
    const audience = f.audience.trim() ? Math.max(0, Math.floor(Number(f.audience.replace(/\s/g, '')) || 0)) : null;
    apply.mutate({ ...f, profile, language: lang, audience }, {
      onSuccess: () => { toast(tr('amb.apply.sent'), 'success'); router.replace('/ambassadors/dashboard'); },
      onError: (e) => setError(friendlyError(e)),
    });
  }

  return (
    <Screen back title={tr('amb.apply.title')}
      footer={<Button label={tr('amb.apply.send')} size="lg" full loading={apply.isPending} disabled={apply.isPending} onPress={submit} testID="amb-apply-send" />}>
      <Field label={tr('amb.apply.code')} value={f.code} onChangeText={set('code')} autoCapitalize="none" autoCorrect={false} error={f.code && !codeOk ? tr('amb.apply.invalidCode') : undefined} testID="amb-apply-code" />
      <Field label={tr('amb.apply.firstName')} value={f.firstName} onChangeText={set('firstName')} autoComplete="given-name" testID="amb-apply-first" />
      <Field label={tr('amb.apply.lastName')} value={f.lastName} onChangeText={set('lastName')} autoComplete="family-name" testID="amb-apply-last" />
      <Field label={tr('amb.apply.email')} value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" testID="amb-apply-email" />
      <Field label={tr('amb.apply.country')} value={f.country} onChangeText={set('country')} autoCapitalize="characters" maxLength={2} testID="amb-apply-country" />
      <Text variant="label">{tr('amb.apply.profile')}</Text>
      <Row wrap style={{ gap: 6 }}>
        {PROFILE_TYPES.map((p) => <Chip key={p} label={tr(`amb.profile.${p}` as TKey)} selected={profile === p} onPress={() => setProfile(p)} testID={`amb-profile-${p}`} />)}
      </Row>
      <Field label={tr('amb.apply.audience')} value={f.audience} onChangeText={set('audience')} keyboardType="number-pad" optional />
      <Field label={tr('amb.apply.channel')} value={f.channel} onChangeText={set('channel')} maxLength={500} multiline optional />
      <LegalLink doc="ambassadors">{tr('amb.termsLink')}</LegalLink>
      <CheckRow label={tr('amb.apply.accept')} checked={accept} onChange={setAccept}><Text variant="small">{tr('amb.apply.accept')}</Text></CheckRow>
      <CheckRow label={tr('amb.apply.honest')} checked={honest} onChange={setHonest}><Text variant="small">{tr('amb.apply.honest')}</Text></CheckRow>
      {error ? <Banner tone="danger">{error}</Banner> : null}
    </Screen>
  );
}
