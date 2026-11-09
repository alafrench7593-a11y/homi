/**
 * Langues des articles (administration, 08/11/2026). Les articles traduits en espagnol, allemand et italien
 * ne s'affichent qu'une fois la langue PUBLIÉE ici, après relecture par une personne compétente ; avant,
 * l'application montre la version anglaise. Réservé au rôle admin (revérifié par le serveur).
 */
import React from 'react';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/States';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Card, Text } from '@/components/ui';
import { ToggleRow } from '@/features/recipes/ToggleRow';
import { useMutation } from '@tanstack/react-query';
import { backend, eq } from '@/lib/backend';
import { useInvalidate, useContentLocales } from '@/lib/data/hooks';
import { friendlyError, useMyRoles } from '@/lib/data/hooks-settings';
import { useAuth } from '@/lib/auth';
import { formatDate, t as tr, type TKey } from '@/i18n';

export default function AdminLanguages() {
  const { isAdmin, isLoading } = useMyRoles();
  const { session } = useAuth();
  const q = useContentLocales();
  const inv = useInvalidate();
  const toast = useToast();
  const set = useMutation({
    mutationFn: (v: { locale: string; on: boolean }) => backend.update('content_locales',
      { articles_published: v.on, published_at: v.on ? new Date().toISOString() : null, published_by: v.on ? session?.userId ?? null : null, updated_at: new Date().toISOString() },
      [eq('locale', v.locale)]),
    onSuccess: () => inv('content_locales', 'articles'),
  });
  if (!isLoading && !isAdmin) return <Screen back title={tr('la.title')}><EmptyState icon="lock" title={tr('la.denied')} /></Screen>;
  return (
    <Screen back title={tr('la.title')} subtitle={tr('la.subtitle')}>
      <Banner tone="warning" icon="alert-triangle">{tr('la.rule')}</Banner>
      {(['es', 'de', 'it'] as const).map((l) => {
        const row = q.data?.find((r) => r.locale === l) as { articles_published: boolean; published_at?: string | null } | undefined;
        return (
          <Card key={l} testID={`la-${l}`}>
            <ToggleRow label={tr(`la.lang.${l}` as TKey)} hint={row?.articles_published && row.published_at ? tr('la.since', { date: formatDate(row.published_at, { day: 'numeric', month: 'long', year: 'numeric' }) }) : tr('la.off')}
              value={!!row?.articles_published}
              onChange={async (on) => {
                if (on && !(await confirm(tr('la.confirmT'), tr('la.confirmB', { lang: tr(`la.lang.${l}` as TKey) }), tr('la.confirmOk')))) return;
                set.mutate({ locale: l, on }, { onError: (e) => toast(friendlyError(e), 'error'), onSuccess: () => toast(on ? tr('la.published') : tr('la.unpublished')) });
              }} />
          </Card>
        );
      })}
      <Text variant="caption" muted>{tr('la.note')}</Text>
    </Screen>
  );
}
