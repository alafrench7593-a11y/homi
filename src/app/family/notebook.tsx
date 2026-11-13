/**
 * Carnet de la maison : codes, contacts (école, nounou, médecin), tailles et habitudes des enfants, infos de la
 * maison. Partagé dans le foyer (y compris la nounou si elle en fait partie) : chacun trouve seul, sans demander.
 * Jamais de code bancaire ni de mot de passe de compte : rappel affiché.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { EmptyState } from '@/components/States';
import { Banner, Button, Card, Chip, Field, ListRow, Loading, SectionTitle, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useChildren, useHouseholdId, useInvalidate } from '@/lib/data/hooks';
import { useHouseNotes, type HouseNote, type NoteSection } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { useTapShield } from '@/features/tapShield';

const SECTIONS: NoteSection[] = ['contacts', 'kids', 'habits', 'school', 'health', 'home', 'codes', 'other'];
const ICON: Record<NoteSection, 'phone' | 'smile' | 'clock' | 'book' | 'heart' | 'home' | 'key' | 'file-text'> = {
  contacts: 'phone', kids: 'smile', habits: 'clock', school: 'book', health: 'heart', home: 'home', codes: 'key', other: 'file-text',
};

function NoteEditor({ note, visible, onClose }: { note?: HouseNote; visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const inv = useInvalidate();
  const hid = useHouseholdId();
  const children = useChildren().data ?? [];
  const [section, setSection] = useState<NoteSection>('contacts');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [childId, setChildId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // La feuille reste affichée pendant sa fermeture : un double appui sur « Enregistrer » n'ajoute pas la fiche deux fois
  const { arm, guard } = useTapShield();
  React.useEffect(() => {
    if (!visible) return;
    setSection(note?.section ?? 'contacts'); setTitle(note?.title ?? ''); setBody(note?.body ?? ''); setChildId(note?.child_id ?? null);
  }, [visible, note]);
  async function save() {
    if (!title.trim()) return toast(tr('cm.nb.errTitle'), 'error');
    if (!hid) return;
    setBusy(true);
    try {
      const row = { section, title: title.trim().slice(0, 80), body: body.trim() || null, child_id: childId };
      if (note) await backend.update('house_notes', row, [eq('id', note.id)]);
      else await backend.insert('house_notes', { ...row, household_id: hid });
      inv('house_notes'); arm(); onClose();
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function remove() {
    if (!note || !(await confirm(tr('common.delete'), tr('cm.nb.deleteQ'), tr('common.delete')))) return;
    try { await backend.remove('house_notes', [eq('id', note.id)]); inv('house_notes'); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={note ? tr('cm.nb.edit') : tr('cm.nb.new')}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{SECTIONS.map((s) => <Chip key={s} label={tr(`cm.nb.s.${s}` as TKey)} selected={section === s} onPress={() => setSection(s)} testID={`nb-s-${s}`} />)}</View>
      {section === 'codes' ? <Banner tone="warning" icon="shield">{tr('cm.nb.codesWarn')}</Banner> : null}
      <Field label={tr('cm.nb.title')} value={title} onChangeText={setTitle} maxLength={80} placeholder={tr(`cm.nb.ph.${section}` as TKey)} testID="nb-title" />
      <Field label={tr('cm.nb.body')} optional value={body} onChangeText={setBody} maxLength={2000} multiline testID="nb-body" />
      {children.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Chip label={tr('cm.nb.allFamily')} selected={!childId} onPress={() => setChildId(null)} />
          {children.map((c) => <Chip key={c.id} label={c.first_name} selected={childId === c.id} onPress={() => setChildId(c.id)} />)}
        </View>
      ) : null}
      <Button label={tr('common.save')} loading={busy} onPress={guard(save)} testID="nb-save" />
      {note ? <Button label={tr('common.delete')} variant="ghost" onPress={() => void remove()} /> : null}
    </Sheet>
  );
}

export default function Notebook() {
  const q = useHouseNotes();
  const children = useChildren().data ?? [];
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HouseNote | undefined>();
  const [filter, setFilter] = useState<NoteSection | null>(null);
  const notes = (q.data ?? []).filter((n) => !filter || n.section === filter);
  return (
    <Screen back title={tr('tool.house_notebook')} subtitle={tr('tool.house_notebook.sub')}
      action={{ label: tr('cm.nb.new'), icon: 'plus', onPress: () => { setEditing(undefined); setOpen(true); }, testID: 'nb-new' }}>
      <Text muted>{tr('cm.nb.intro')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Chip label={tr('cm.nb.all')} selected={!filter} onPress={() => setFilter(null)} />
        {SECTIONS.map((s) => <Chip key={s} label={tr(`cm.nb.s.${s}` as TKey)} selected={filter === s} onPress={() => setFilter(filter === s ? null : s)} />)}
      </View>
      {q.isLoading ? <Loading /> : !notes.length ? <EmptyState icon="book" title={tr('cm.nb.none')} body={tr('cm.nb.noneD')} /> : SECTIONS.filter((s) => notes.some((n) => n.section === s)).map((s) => (
        <View key={s} style={{ gap: spacing.xs }}>
          <SectionTitle title={tr(`cm.nb.s.${s}` as TKey)} />
          <Card padded={false}>
            {notes.filter((n) => n.section === s).map((n) => (
              <ListRow key={n.id} icon={ICON[s]} title={n.title} testID={`nb-note-${n.id}`}
                subtitle={[children.find((c) => c.id === n.child_id)?.first_name, n.body].filter(Boolean).join(' · ') || undefined}
                onPress={() => { setEditing(n); setOpen(true); }} />
            ))}
          </Card>
        </View>
      ))}
      <Banner tone="info" icon="users">{tr('cm.nb.shared')}</Banner>
      <NoteEditor note={editing} visible={open} onClose={() => setOpen(false)} />
    </Screen>
  );
}
