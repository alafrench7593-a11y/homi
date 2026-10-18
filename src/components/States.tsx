/**
 * Les quatre états d'un écran : chargement (squelettes), vide (message + action utile),
 * erreur (message + « Réessayer ») et succès. Plus une liste virtualisée pour les longues listes.
 *
 * Usage typique :
 *   const q = useRows(...);
 *   <QueryView query={q} skeleton="list" empty={{ icon: 'droplet', title: 'Aucun biberon noté', action: { label: 'Ajouter', onPress } }}>
 *     {(rows) => <VirtualList data={rows} renderItem={...} />}
 *   </QueryView>
 */
import React, { useEffect, useRef } from 'react';
import { Animated, FlatList, type FlatListProps, View } from 'react-native';
import { Button, Card, Icon, type IconName, Text } from '@/components/ui';
import { friendlyErrorMessage } from '@/lib/errors';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

// ------------------------------------------------------------------ squelettes
export function SkeletonBlock({ height = 16, width = '100%', style }: { height?: number; width?: number | `${number}%`; style?: object }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse, reduce]);
  return <Animated.View style={[{ height, width, borderRadius: radius.sm, backgroundColor: t.colors.border, opacity: pulse }, style]} />;
}

/** Squelette d'écran : « list » (lignes), « card » (cartes) ou « detail » (titre + paragraphes). */
export function Skeleton({ kind = 'list', rows = 4 }: { kind?: 'list' | 'card' | 'detail'; rows?: number }) {
  return (
    <View accessible accessibilityLabel="Chargement…" accessibilityRole="progressbar" style={{ gap: spacing.sm }}>
      {kind === 'detail' ? (
        <>
          <SkeletonBlock height={28} width="60%" />
          {Array.from({ length: rows }, (_, i) => <SkeletonBlock key={i} height={14} width={i === rows - 1 ? '70%' : '100%'} />)}
        </>
      ) : (
        Array.from({ length: rows }, (_, i) => (
          <Card key={i}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              {kind === 'list' ? <SkeletonBlock height={38} width={38} style={{ borderRadius: 12 }} /> : null}
              <View style={{ flex: 1, gap: 8 }}>
                <SkeletonBlock height={14} width="55%" />
                <SkeletonBlock height={12} width="85%" />
                {kind === 'card' ? <SkeletonBlock height={12} width="40%" /> : null}
              </View>
            </View>
          </Card>
        ))
      )}
    </View>
  );
}

// ------------------------------------------------------------------ vide
export interface EmptyProps {
  icon?: IconName;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void; icon?: IconName };
}

export function EmptyState({ icon = 'inbox', title, body, action }: EmptyProps) {
  const t = useTheme();
  return (
    <Card tone="soft">
      <View style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surface }}>
          <Icon name={icon} color={t.colors.primary} />
        </View>
        <Text weight="bold" center accessibilityRole="header">{title}</Text>
        {body ? <Text variant="small" muted center>{body}</Text> : null}
        {action ? <Button label={action.label} icon={action.icon ?? 'plus'} size="sm" style={{ marginTop: spacing.xs }} onPress={action.onPress} /> : null}
      </View>
    </Card>
  );
}

// ------------------------------------------------------------------ erreur
export function ErrorView({ error, onRetry, title = 'Impossible d’afficher ces informations' }: { error: unknown; onRetry?: () => void; title?: string }) {
  const t = useTheme();
  return (
    <Card tone="soft" accessibilityLabel={`${title}. ${friendlyErrorMessage(error)}`}>
      <View style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md }}>
        <Icon name="cloud-off" color={t.colors.danger} />
        <Text weight="bold" center>{title}</Text>
        <Text variant="small" muted center accessibilityLiveRegion="polite">{friendlyErrorMessage(error)}</Text>
        {onRetry ? <Button label="Réessayer" icon="refresh-cw" size="sm" variant="secondary" style={{ marginTop: spacing.xs }} onPress={onRetry} /> : null}
      </View>
    </Card>
  );
}

// ------------------------------------------------------------------ requête complète
interface QueryLike<T> { data: T | undefined | null; isLoading: boolean; isError: boolean; error: unknown; refetch: () => unknown }

/**
 * Affiche le bon état d'une requête TanStack Query.
 * `isEmpty` par défaut : tableau vide ou donnée absente.
 */
export function QueryView<T>({ query, children, empty, skeleton = 'list', rows, isEmpty }: {
  query: QueryLike<T>;
  children: (data: T) => React.ReactNode;
  empty?: EmptyProps;
  skeleton?: 'list' | 'card' | 'detail';
  rows?: number;
  isEmpty?: (data: T) => boolean;
}) {
  if (query.isLoading && query.data == null) return <Skeleton kind={skeleton} rows={rows} />;
  if (query.isError && query.data == null) return <ErrorView error={query.error} onRetry={() => void query.refetch()} />;
  const data = query.data as T;
  const emptyNow = isEmpty ? isEmpty(data) : data == null || (Array.isArray(data) && data.length === 0);
  if (emptyNow) return empty ? <EmptyState {...empty} /> : null;
  return <>{children(data)}</>;
}

// ------------------------------------------------------------------ liste virtualisée
/**
 * Liste longue virtualisée (seules les lignes visibles sont rendues).
 * À utiliser à l'intérieur d'un écran qui défile : `scrollEnabled={false}` n'est PAS virtualisé,
 * on utilise donc la liste comme conteneur de défilement (prop `screen` de <Screen scroll={false}>).
 */
function VirtualListInner<T>(props: FlatListProps<T>, ref: React.ForwardedRef<FlatList<T>>) {
  return (
    <FlatList
      ref={ref}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={7}
      removeClippedSubviews
      keyboardShouldPersistTaps="handled"
      {...props}
    />
  );
}

/** `ref` transmis à la FlatList (défilement vers le bas d'une conversation, par exemple). */
export const VirtualList = React.forwardRef(VirtualListInner) as <T>(props: FlatListProps<T> & { ref?: React.Ref<FlatList<T>> }) => React.ReactElement;
