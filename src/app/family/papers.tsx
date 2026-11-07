/**
 * Papiers de la famille : chaque papier important (livret de famille, acte de naissance, carte d'identité, passeport,
 * carte Vitale, mutuelle, carnet de vaccination, justificatif de domicile, avis d'imposition, attestation CAF,
 * assurance scolaire…) pris en PHOTO une fois (rangé dans « Mes documents », privé au foyer), avec sa date
 * d'expiration. Par démarche (inscription à l'école, CAF, carte d'identité de l'enfant, cantine, voyage, santé) :
 * la liste INDICATIVE des papiers, ce qui manque ou expire, et l'envoi du dossier en un PDF.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useChildren, useHouseholdId, useInvalidate } from '@/lib/data/hooks';
import { useFamilyPapers, type FamilyPaper } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { todayISO, frToISO } from '@/lib/domain/dates';
import { EXPIRING, PAPER_KINDS, PER_CHILD, PROCEDURE_PAPERS, PROCEDURES, paperStatus, type PaperKind, type PaperStatus, type Procedure } from '@/lib/domain/mentalLoad';
import { toFrDate } from '@/lib/validation';
import { openLink } from '@/lib/links';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

const PARENT_TOO: PaperKind[] = ['id_card', 'passport', 'id_photo'];

const STATUS_ICON: Record<PaperStatus, 'check-circle' | 'clock' | 'alert-triangle' | 'camera' | 'plus-circle'> = {
  ok: 'check-circle', expiring: 'clock', expired: 'alert-triangle', no_photo: 'camera', missing: 'plus-circle',
};

function PaperSheet({ kind, childId, paper, visible, onClose }: { kind: PaperKind; childId: string | null; paper?: FamilyPaper; visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const inv = useInvalidate();
  const hid = useHouseholdId();
  const [expires, setExpires] = useState('');
  const [busy, setBusy] = useState(false);
  React.useEffect(() => { if (visible) setExpires(paper?.expires_on ? toFrDate(paper.expires_on) : ''); }, [visible, paper]);
  async function ensure(): Promise<FamilyPaper | null> {
    if (paper) return paper;
    if (!hid) return null;
    const [row] = await backend.insert<FamilyPaper>('family_papers', { household_id: hid, kind, child_id: childId });
    inv('family_papers');
    return row ?? null;
  }
  async function saveDate() {
    const iso = expires.trim() ? frToISO(expires) : null;
    if (expires.trim() && !iso) return toast(tr('pma.errDate'), 'error');
    setBusy(true);
    try {
      const p = await ensure();
      if (p) await backend.update('family_papers', { expires_on: iso }, [eq('id', p.id)]);
      inv('family_papers'); onClose();
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function photo() {
    try {
      const p = await ensure();
      if (!p) return;
      onClose();
      router.push({ pathname: '/documents/scan', params: { paper: p.id, title: tr(`cm.pp.k.${kind}` as TKey), cat: 'admin', ...(childId ? { child: childId } : {}) } });
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={tr(`cm.pp.k.${kind}` as TKey)}>
      <Text variant="small" muted>{tr(`cm.pp.k.${kind}.d` as TKey)}</Text>
      <Button label={paper?.document_id ? tr('cm.pp.rephoto') : tr('cm.pp.photo')} icon="camera" onPress={() => void photo()} testID="pp-photo" />
      {paper?.document_id ? <Button label={tr('cm.pp.open')} icon="file" variant="secondary" onPress={() => { onClose(); router.push(`/documents/${paper.document_id}`); }} /> : null}
      {EXPIRING.includes(kind) ? (
        <>
          <Field label={tr('cm.pp.expires')} optional value={expires} onChangeText={setExpires} keyboardType="numbers-and-punctuation" placeholder={tr('u1.rem.phDate')} hint={tr('cm.pp.expiresHint')} testID="pp-expires" />
          <Button label={tr('common.save')} variant="secondary" loading={busy} onPress={() => void saveDate()} testID="pp-save" />
        </>
      ) : null}
    </Sheet>
  );
}

export default function Papers() {
  const t = useTheme();
  const today = todayISO();
  const children = useChildren().data ?? [];
  const papers = useFamilyPapers().data ?? [];
  const [who, setWho] = useState<string | null>(null); // null = la famille
  // « Préparer le dossier » depuis Maman solo (?proc=caf) ouvre directement la démarche
  const { proc: procParam } = useLocalSearchParams<{ proc?: string }>();
  const [proc, setProc] = useState<Procedure | null>(PROCEDURES.includes(procParam as Procedure) ? (procParam as Procedure) : null);
  const [sheet, setSheet] = useState<{ kind: PaperKind; childId: string | null } | null>(null);
  // Carte d'identité, passeport et photo existent aussi pour les parents : visibles dans « La famille » comme pour chaque enfant.
  const kinds = PAPER_KINDS.filter((k) => (who ? PER_CHILD.includes(k) : !PER_CHILD.includes(k) || PARENT_TOO.includes(k) || !children.length));
  const find = (k: PaperKind, childId: string | null) => papers.find((p) => p.kind === k && (PER_CHILD.includes(k) && children.length ? p.child_id === childId : true));
  const alerts = papers.filter((p) => ['expiring', 'expired'].includes(paperStatus(p, today)));
  const procList = useMemo(() => (proc ? PROCEDURE_PAPERS[proc].map((k) => {
    const childId = PER_CHILD.includes(k) ? who ?? children[0]?.id ?? null : null;
    return { k, childId, p: find(k, childId) };
  }) : []), [proc, who, papers, children]); // eslint-disable-line react-hooks/exhaustive-deps
  const procIds = procList.map((x) => x.p?.document_id).filter(Boolean) as string[];
  const color = (s: PaperStatus) => (s === 'ok' ? t.colors.success : s === 'missing' || s === 'no_photo' ? t.colors.textMuted : t.colors.danger);

  return (
    <Screen back title={tr('tool.family_papers')} subtitle={tr('tool.family_papers.sub')}>
      <Text muted>{tr('cm.pp.intro')}</Text>
      {alerts.length ? <Banner tone="warning" icon="clock" title={tr('cm.pp.alerts', { count: alerts.length })}>{alerts.map((p) => `${tr(`cm.pp.k.${p.kind}` as TKey)}${p.child_id ? ` (${children.find((c) => c.id === p.child_id)?.first_name ?? ''})` : ''} : ${formatDate(p.expires_on!, { day: 'numeric', month: 'short', year: 'numeric' })}`).join('\n')}</Banner> : null}

      <SectionTitle title={tr('cm.pp.procedures')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {PROCEDURES.map((p) => <Chip key={p} label={tr(`cm.pp.p.${p}` as TKey)} selected={proc === p} onPress={() => setProc(proc === p ? null : p)} testID={`pp-proc-${p}`} />)}
      </View>
      {proc ? (
        <Card testID="pp-dossier">
          <Text weight="bold">{tr(`cm.pp.p.${proc}` as TKey)}</Text>
          {procList.map(({ k, childId, p }) => {
            const s = paperStatus(p, today);
            return <ListRow key={k} icon={STATUS_ICON[s]} title={tr(`cm.pp.k.${k}` as TKey)} subtitle={tr(`cm.pp.st.${s}` as TKey)} right={<View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color(s) }} />} onPress={() => setSheet({ kind: k, childId })} />;
          })}
          <Text variant="small" style={{ marginTop: 6 }}>{tr('cm.pp.ready', { ok: procList.filter((x) => paperStatus(x.p, today) === 'ok').length, total: procList.length })}</Text>
          <Row wrap style={{ gap: spacing.xs, marginTop: spacing.xs }}>
            <Button label={tr('cm.pp.send', { count: procIds.length })} icon="share" size="sm" disabled={!procIds.length} onPress={() => router.push({ pathname: '/documents/export', params: { ids: procIds.join(',') } })} testID="pp-send" />
            <Button label={tr('cm.pp.official')} icon="external-link" size="sm" variant="ghost" onPress={() => openLink('https://www.service-public.fr/particuliers/vosdroits', () => undefined)} />
          </Row>
          <Text variant="caption" muted>{tr('cm.pp.indicative')}</Text>
        </Card>
      ) : null}

      <SectionTitle title={tr('cm.pp.all')} />
      {children.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Chip label={tr('cm.pp.family')} selected={!who} onPress={() => setWho(null)} testID="pp-who-family" />
          {children.map((c) => <Chip key={c.id} label={c.first_name} selected={who === c.id} onPress={() => setWho(c.id)} testID={`pp-who-${c.first_name}`} />)}
        </View>
      ) : null}
      <Card padded={false}>
        {kinds.map((k) => {
          const p = find(k, who);
          const s = paperStatus(p, today);
          return <ListRow key={k} icon={STATUS_ICON[s]} title={tr(`cm.pp.k.${k}` as TKey)} testID={`pp-kind-${k}`}
            subtitle={`${tr(`cm.pp.st.${s}` as TKey)}${p?.expires_on ? ` · ${formatDate(p.expires_on, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`}
            onPress={() => setSheet({ kind: k, childId: who })} />;
        })}
      </Card>
      <Banner tone="info" icon="lock">{tr('cm.pp.privacy')}</Banner>
      {sheet ? <PaperSheet kind={sheet.kind} childId={sheet.childId} paper={find(sheet.kind, sheet.childId)} visible onClose={() => setSheet(null)} /> : null}
    </Screen>
  );
}
