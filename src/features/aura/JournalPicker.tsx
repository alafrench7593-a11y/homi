/**
 * Sélecteur des entrées d'un journal à partager avec Aura (synthèse). Consentement EXPLICITE, demande par demande :
 * rien n'est coché d'avance, l'aperçu montre ce qui part (date, humeur, ressentis, et le texte des seules pages
 * cochées du journal intime, tronqué), le coût est affiché avant l'envoi, et rien n'est conservé après la réponse.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Sheet } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Button, Icon, Row, Text, Toggle } from '@/components/ui';
import { feelingLabel, moodLabel } from '@/features/mood/MoodJournalUI';
import { useMoods } from '@/lib/data/hooks';
import { diaryPages } from '@/lib/domain/diary';
import { formatDate, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { journalPayload } from './model';
import { MAX_JOURNAL_ENTRIES } from '../../../supabase/functions/_shared/aura-data';

export function JournalPicker({ journal, cost, onClose, onSend }: {
  journal: 'mood' | 'diary' | null; cost: number; onClose: () => void;
  onSend: (payload: ReturnType<typeof journalPayload>) => void;
}) {
  const t = useTheme();
  const moodsQ = useMoods(60);
  const rows = useMemo(() => (journal === 'diary' ? diaryPages(moodsQ.data) : moodsQ.data ?? []).slice(0, 30), [journal, moodsQ.data]);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [agreed, setAgreed] = useState(false);
  const toggle = (id: string) => setChosen((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else if (n.size < MAX_JOURNAL_ENTRIES) n.add(id);
    return n;
  });
  const close = () => { setChosen(new Set()); setAgreed(false); onClose(); };
  return (
    <Sheet visible={!!journal} onClose={close} title={tr('aura.journal.title')}>
      <View style={{ gap: spacing.sm }} testID="aura-journal-sheet">
        <Text variant="small" muted>{tr('aura.journal.body')}</Text>
        <Text variant="label">{tr(journal === 'diary' ? 'aura.journal.diary' : 'aura.journal.mood')}</Text>
        {!rows.length ? <Text muted testID="aura-journal-empty">{tr('aura.journal.empty')}</Text> : rows.map((r) => {
          const on = chosen.has(r.id);
          return (
            <Tappable key={r.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggle(r.id)} testID="aura-journal-entry"
              style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: on ? t.colors.primary : t.colors.border, backgroundColor: on ? t.colors.accentSoft : t.colors.surface }}>
              <Icon name={on ? 'check-square' : 'square'} size={20} color={on ? t.colors.primary : t.colors.textMuted} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="small" weight="bold">{`${formatDate(r.checked_at, { weekday: 'short', day: 'numeric', month: 'short' })} · ${moodLabel(r.mood)}`}</Text>
                {r.feelings.length ? <Text variant="caption" muted>{r.feelings.slice(0, 4).map(feelingLabel).join(', ')}</Text> : null}
                {journal === 'diary' && r.journal ? <Text variant="caption" muted numberOfLines={2}>{r.journal}</Text> : null}
              </View>
            </Tappable>
          );
        })}
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={{ flex: 1 }} variant="small">{tr('aura.journal.consent', { count: chosen.size })}</Text>
          <Toggle label={tr('aura.journal.consent', { count: chosen.size })} value={agreed} onChange={setAgreed} />
        </Row>
        <Button label={tr('aura.journal.send', { count: cost })} icon="send" full disabled={!chosen.size || !agreed} testID="aura-journal-send"
          onPress={() => { if (!journal) return; const p = journalPayload(journal, rows, chosen); close(); onSend(p); }} />
        <Button label={tr('aura.act.cancel')} variant="ghost" full onPress={close} />
      </View>
    </Sheet>
  );
}
