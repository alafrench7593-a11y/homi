/**
 * Carnet de la maison — fiches (22/11/2026). Même donnée que le carnet (house_notes) :
 *  · `NoteHero` : nombre de fiches en grand, dernière mise à jour (quoi, quand) ;
 *  · `NoteFixTray` : une fiche (gardée dans l'adresse « ?note= ») lue dans le Tray, puis corrigée (titre, texte) en
 *    valeurs provisoires, Annuler, Enregistrer verrouillé, brouillon gardé ; « Formulaire complet » ouvre l'éditeur
 *    du carnet (rubrique, enfant, suppression). Même écriture que l'éditeur (house_notes).
 */
import React from 'react';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import type { HouseNote } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { clock } from '@/lib/domain/sleepPlanner';
import { HmFixTray, HmHero } from './kit';

const when = (iso: string) => `${formatDate(iso, { weekday: 'short', day: 'numeric', month: 'short' })} · ${clock(new Date(iso))}`;

export function NoteHero({ notes }: { notes: readonly HouseNote[] }) {
  if (!notes.length) return null;
  const last = [...notes].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0];
  const sections = new Set(notes.map((n) => n.section)).size;
  return <HmHero testID="hm-nb-hero" value={String(notes.length)} unit={tr('hm.nb.unit', { count: notes.length, sections })}
    caption={tr('hm.nb.last', { title: last.title, when: when(last.updated_at) })} />;
}

export function NoteFixTray({ note, childName, onClose, onFullForm }: { note: HouseNote | null; childName: string | null; onClose: () => void; onFullForm: () => void }) {
  const inv = useInvalidate();
  if (!note) return null;
  return (
    <HmFixTray open onOpenChange={(v) => { if (!v) onClose(); }} testID="hm-nb-tray"
      title={tr(`cm.nb.s.${note.section}` as TKey)} hero={note.title} lines={[note.body, childName, tr('hm.nb.updated', { when: when(note.updated_at) })]}
      onFullForm={onFullForm}
      fields={[{ key: 'title', label: tr('cm.nb.title'), kind: 'text', maxLength: 80 }, { key: 'body', label: tr('cm.nb.body'), kind: 'multiline', maxLength: 2000 }]}
      initial={{ title: note.title, body: note.body ?? '' }}
      validate={(d) => (d.title.trim() ? null : tr('cm.nb.errTitle'))}
      onSave={async (d) => {
        if (!d.title.trim()) return tr('cm.nb.errTitle');
        try { await backend.update('house_notes', { title: d.title.trim().slice(0, 80), body: d.body.trim() || null }, [eq('id', note.id)]); inv('house_notes'); return 'ok'; } catch (e) { return friendlyError(e); }
      }} />
  );
}
