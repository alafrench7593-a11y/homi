/**
 * Maman solo (07/11/2026) : tout ce qui aide quand on élève seule ses enfants.
 *  - Ma situation (en couple / seule / parents séparés) : adapte l'accueil et « Je décroche ».
 *  - Mon cercle d'aide : mamie, amie, voisine… PRIVÉ (jamais visible du foyer) ; appel ou SMS prérempli envoyé
 *    par la personne elle-même depuis Messages (l'appli n'envoie rien à sa place).
 *  - Les aides auxquelles penser : vérifiées le 07/11/2026 sur les sites officiels, SANS montant (ils changent),
 *    avec le lien officiel, le simulateur mes-aides.gouv.fr et la préparation du dossier dans « Papiers de la famille ».
 *  - Gestes du quotidien : textes écrits pour l'appli + source officielle (et la vidéo de prévention de la HAS).
 *  - Alléger ma charge mentale : les outils déjà là (vider ma tête, échéances, papiers, carnet, je décroche…).
 */
import React, { useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, Icon, ListRow, Row, Segmented, SectionTitle, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { backend, eq } from '@/lib/backend';
import { useUserId } from '@/lib/auth';
import { useChildren, useInvalidate, useProfile, useUpdateProfile } from '@/lib/data/hooks';
import { useSupportCircle, type HelpKind, type SupportContact } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { todayISO } from '@/lib/domain/dates';
import { AIDS_CHECKED_ON, HELP_KINDS, ageYears, aidsFor, gesturesFor, helpersFor, smsLink, type Gesture } from '@/lib/domain/soloParent';
import { callNumber, openLink } from '@/lib/links';
import { OFFICIAL_VIDEOS, VIDEOS_CHECKED_ON, videoById, type VideoTopic } from '@/lib/domain/officialVideos';

const SOLO_TOPICS: VideoTopic[] = ['baby', 'sleep', 'feeding', 'meals', 'me'];
import { VideoCard } from '@/components/video/VideoCard';
import type { FamilySituation } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

const platform = (): 'ios' | 'android' | 'web' => (Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web');
const PHONE = /^[0-9 +().-]{3,25}$/;

function ContactSheet({ contact, visible, onClose }: { contact?: SupportContact; visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const inv = useInvalidate();
  const uid = useUserId();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [helps, setHelps] = useState<HelpKind[]>([]);
  const [busy, setBusy] = useState(false);
  React.useEffect(() => {
    if (!visible) return;
    setName(contact?.name ?? ''); setPhone(contact?.phone ?? ''); setRelation(contact?.relation ?? ''); setHelps(contact?.helps ?? []);
  }, [visible, contact]);
  async function save() {
    if (!name.trim()) return toast(tr('sol.circle.errName'), 'error');
    if (phone.trim() && !PHONE.test(phone.trim())) return toast(tr('sol.circle.errPhone'), 'error');
    setBusy(true);
    try {
      const row = { name: name.trim().slice(0, 60), phone: phone.trim() || null, relation: relation.trim().slice(0, 40) || null, helps };
      if (contact) await backend.update('support_circle', row, [eq('id', contact.id)]);
      else await backend.insert('support_circle', { ...row, user_id: uid });
      inv('support_circle'); onClose();
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function remove() {
    if (!contact || !(await confirm(tr('common.delete'), tr('sol.circle.deleteQ', { name: contact.name }), tr('common.delete')))) return;
    try { await backend.remove('support_circle', [eq('id', contact.id)]); inv('support_circle'); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={contact ? contact.name : tr('sol.circle.add')}>
      <Field label={tr('sol.circle.name')} value={name} onChangeText={setName} maxLength={60} placeholder={tr('sol.circle.namePh')} testID="sc-name" />
      <Field label={tr('sol.circle.phone')} optional value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={25} testID="sc-phone" />
      <Field label={tr('sol.circle.relation')} optional value={relation} onChangeText={setRelation} maxLength={40} placeholder={tr('sol.circle.relationPh')} />
      <Text variant="label">{tr('sol.circle.canHelp')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {HELP_KINDS.map((k) => <Chip key={k} label={tr(`sol.help.${k}` as TKey)} selected={helps.includes(k)} onPress={() => setHelps((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k]))} testID={`sc-help-${k}`} />)}
      </View>
      <Button label={tr('common.save')} loading={busy} onPress={() => void save()} testID="sc-save" />
      {contact ? <Button label={tr('common.delete')} variant="ghost" onPress={() => void remove()} /> : null}
      <Text variant="caption" muted>{tr('sol.circle.private')}</Text>
    </Sheet>
  );
}

function GestureCard({ g }: { g: Gesture }) {
  const t = useTheme();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <Card padded={false} testID={`sol-g-${g.key}`}>
      <Tappable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} testID={`sol-g-open-${g.key}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="bold">{tr(`sol.g.${g.key}` as TKey)}</Text>
          <Text variant="small" muted>{tr(`sol.g.${g.key}.d` as TKey)}</Text>
          {g.solo ? <Text variant="caption" color={t.colors.gold}>{tr('sol.g.soloTag')}</Text> : null}
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={t.colors.textMuted} />
      </Tappable>
      {open ? (
        <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: 6 }}>
          {Array.from({ length: g.steps }, (_, i) => (
            <Row key={i} style={{ gap: spacing.xs, alignItems: 'flex-start' }}>
              <Text weight="bold" color={t.colors.gold}>{i + 1}.</Text>
              <Text style={{ flex: 1 }}>{tr(`sol.g.${g.key}.s${i + 1}` as TKey)}</Text>
            </Row>
          ))}
          {g.care ? <Banner tone="info" icon="user-check">{tr(`sol.g.${g.key}.care` as TKey)}</Banner> : null}
          {g.videoId && videoById(g.videoId) ? <View testID={`sol-g-video-${g.key}`}><VideoCard video={videoById(g.videoId)!} compact /></View> : null}
          {g.url ? <Button label={tr('sol.g.source')} icon="external-link" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => openLink(g.url!, toast)} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

export default function Solo() {
  const toast = useToast();
  const today = todayISO();
  const profile = useProfile().data;
  const update = useUpdateProfile();
  const children = useChildren().data ?? [];
  const circle = useSupportCircle().data ?? [];
  const [sheet, setSheet] = useState<{ contact?: SupportContact } | null>(null);
  const [ask, setAsk] = useState<HelpKind | null>(null);
  const [topic, setTopic] = useState<VideoTopic>('baby');
  const situation = profile?.family_situation ?? null;
  const ages = children.map((c) => ageYears(c.birth_date, today));
  const known = ages.filter((a): a is number => a != null);
  const aids = aidsFor({ separated: situation !== 'couple', youngestAge: known.length ? Math.min(...known) : null });
  const gestures = useMemo(() => gesturesFor(ages), [ages.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const helpers = ask ? helpersFor(circle, ask) : [];

  function setSituation(v: FamilySituation) {
    update.mutate({ family_situation: v }, { onError: (e) => toast(friendlyError(e), 'error') });
  }
  function sms(c: SupportContact, kind: HelpKind) {
    if (c.phone) openLink(smsLink(c.phone, tr(`sol.ask.${kind}` as TKey, { name: c.name }), platform()), toast);
  }

  return (
    <Screen back title={tr('tool.solo_parent')} subtitle={tr('tool.solo_parent.sub')}>
      <Text muted>{tr('sol.intro')}</Text>

      <Card testID="sol-situation">
        <Segmented label={tr('sol.situation')} value={situation ?? 'none'} onChange={(v) => v !== 'none' && setSituation(v as FamilySituation)}
          options={[
            { value: 'solo', label: tr('sol.sit.solo'), testID: 'sol-sit-solo' },
            { value: 'coparenting', label: tr('sol.sit.coparenting'), testID: 'sol-sit-coparenting' },
            { value: 'couple', label: tr('sol.sit.couple'), testID: 'sol-sit-couple' },
          ] as { value: FamilySituation | 'none'; label: string; testID: string }[]} />
        <Text variant="caption" muted>{tr('sol.situationHint')}</Text>
      </Card>

      {/* Cercle d'aide */}
      <SectionTitle title={tr('sol.circle.title')} />
      <Text variant="small" muted>{tr('sol.circle.intro')}</Text>
      <Card padded={false} testID="sol-circle">
        {circle.map((c) => (
          <ListRow key={c.id} icon="user" title={c.name} testID={`sol-c-${c.name}`}
            subtitle={[c.relation, c.helps.map((h) => tr(`sol.help.${h}` as TKey)).join(', ')].filter(Boolean).join(' · ') || undefined}
            onPress={() => setSheet({ contact: c })}
            right={c.phone ? <Button label={tr('sol.circle.call')} icon="phone" size="sm" variant="ghost" onPress={() => callNumber(c.phone!, toast)} /> : undefined} />
        ))}
        <ListRow icon="user-plus" title={tr('sol.circle.add')} onPress={() => setSheet({})} testID="sol-circle-add" />
      </Card>
      {circle.length ? (
        <Card>
          <Text weight="bold">{tr('sol.ask.title')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.xs }}>
            {HELP_KINDS.filter((k) => k !== 'emergency').map((k) => <Chip key={k} label={tr(`sol.help.${k}` as TKey)} selected={ask === k} onPress={() => setAsk(ask === k ? null : k)} testID={`sol-ask-${k}`} />)}
          </View>
          {ask ? (helpers.length ? helpers.map((c) => (
            <Row key={c.id} style={{ justifyContent: 'space-between', marginTop: spacing.xs }}>
              <Text style={{ flex: 1 }}>{c.name}</Text>
              {c.phone ? <Button label={tr('sol.ask.sms')} icon="message-circle" size="sm" variant="secondary" onPress={() => sms(c, ask)} testID={`sol-sms-${c.name}`} /> : <Text variant="small" muted>{tr('sol.ask.noPhone')}</Text>}
            </Row>
          )) : <Text variant="small" muted style={{ marginTop: spacing.xs }} testID="sol-ask-none">{tr('sol.ask.nobody')}</Text>) : null}
          <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{tr('sol.ask.youSend')}</Text>
        </Card>
      ) : null}

      {/* Aides */}
      <SectionTitle title={tr('sol.aids.title')} />
      <Text variant="small" muted>{tr('sol.aids.intro')}</Text>
      {aids.map((a) => (
        <Card key={a.key} testID={`sol-aid-${a.key}`}>
          <Text weight="bold">{tr(`sol.aid.${a.key}` as TKey)}</Text>
          <Text variant="small">{tr(`sol.aid.${a.key}.d` as TKey)}</Text>
          <Row wrap style={{ gap: spacing.xs, marginTop: spacing.xs }}>
            <Button label={tr('sol.aids.official')} icon="external-link" size="sm" variant="secondary" onPress={() => openLink(a.url, toast)} />
            {a.procedure ? <Button label={tr('sol.aids.prepare')} icon="folder" size="sm" variant="ghost" onPress={() => router.push({ pathname: '/family/papers', params: { proc: a.procedure } })} testID={`sol-aid-prep-${a.key}`} /> : null}
          </Row>
        </Card>
      ))}
      <Text variant="caption" muted>{tr('sol.aids.checked', { date: formatDate(AIDS_CHECKED_ON, { day: 'numeric', month: 'long', year: 'numeric' }) })}</Text>

      {/* Gestes */}
      <SectionTitle title={tr('sol.g.title')} />
      <Text variant="small" muted>{tr('sol.g.intro')}</Text>
      {gestures.map((g) => <GestureCard key={g.key} g={g} />)}

      {/* Vidéos officielles, lues dans l'appli */}
      <SectionTitle title={tr('sol.v.title')} />
      <Text variant="small" muted>{tr('sol.v.intro')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {SOLO_TOPICS.map((k) => <Chip key={k} label={tr(`vid.topic.${k}` as TKey)} selected={topic === k} onPress={() => setTopic(k)} testID={`sol-v-topic-${k}`} />)}
      </View>
      <Card testID="sol-videos">
        <View style={{ gap: spacing.md }}>
          {OFFICIAL_VIDEOS.filter((v) => v.topic === topic).map((v) => <VideoCard key={v.id} video={v} />)}
        </View>
      </Card>
      <Button label={tr('vid.seeAll', { count: OFFICIAL_VIDEOS.length })} icon="play-circle" variant="secondary" onPress={() => router.push({ pathname: '/videos', params: { topic } })} testID="sol-videos-all" />
      <Text variant="caption" muted>{tr('sol.v.checked', { date: formatDate(VIDEOS_CHECKED_ON, { day: 'numeric', month: 'long', year: 'numeric' }) })}</Text>

      {/* Charge mentale */}
      <SectionTitle title={tr('sol.load.title')} />
      <Card padded={false}>
        <ListRow icon="edit-3" title={tr('tool.brain_dump')} subtitle={tr('sol.load.dump')} onPress={() => router.push('/family/brain-dump')} testID="sol-load-dump" />
        <ListRow icon="calendar" title={tr('tool.family_prep')} subtitle={tr('sol.load.prep')} onPress={() => router.push('/family/prep')} />
        <ListRow icon="folder" title={tr('tool.family_papers')} subtitle={tr('sol.load.papers')} onPress={() => router.push('/family/papers')} />
        <ListRow icon="book" title={tr('tool.house_notebook')} subtitle={tr('sol.load.notebook')} onPress={() => router.push('/family/notebook')} />
        <ListRow icon="moon" title={tr('tool.offduty')} subtitle={tr('sol.load.offduty')} onPress={() => router.push('/family/offduty')} testID="sol-load-offduty" />
        <ListRow icon="battery" title={tr('tool.exhaustion_check')} subtitle={tr('sol.load.exhausted')} onPress={() => router.push('/family/exhausted')} />
      </Card>
      <Banner tone="info" icon="heart">{tr('sol.load.permission')}</Banner>

      {/* Si ça ne va pas */}
      <Banner tone="danger" icon="alert-octagon">{tr('sol.urgent')}</Banner>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={{ flex: 1 }}><Button label="3114" icon="phone" variant="secondary" onPress={() => callNumber('3114', toast)} /></View>
        <View style={{ flex: 1 }}><Button label="15" icon="phone" variant="secondary" onPress={() => callNumber('15', toast)} /></View>
      </View>
      <Button label={tr('cm.ex.allo')} icon="phone" variant="ghost" onPress={() => callNumber('0800003456', toast)} />

      {sheet ? <ContactSheet contact={sheet.contact} visible onClose={() => setSheet(null)} /> : null}
    </Screen>
  );
}
