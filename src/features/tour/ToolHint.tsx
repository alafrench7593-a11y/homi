/**
 * Aide contextuelle à la PREMIÈRE ouverture d'un outil : une seule bulle sobre par outil (sa phrase « Problème résolu »,
 * sinon sa description du registre), montrée une fois, en haut de l'écran, sans voile et sans arrêter aucun toucher.
 * Désactivable d'un geste (« Ne plus afficher ces aides ») ou dans Réglages ; jamais sur une urgence ni pendant la
 * visite guidée. Elle s'efface seule quand on quitte l'outil.
 */
import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass, GlassButton } from '@/components/glass';
import { useDemoInset } from '@/components/demoInset';
import { Text } from '@/components/ui';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { lastEmergencyCall, tourShownPath, useTourStore } from './store';
import { emergencyRecent, isEmergencyPath, shouldHint } from './model';

/** Ouverture réelle d'un outil (src/components/ToolCard.tsx `openTool`) : décide s'il faut montrer son aide. */
export function maybeToolHint(o: { id: string; urgent?: boolean; title: string; body: string | null; path?: string }) {
  const st = useTourStore.getState();
  const p = st.owner ? st.byUser[st.owner] : null;
  if (!o.body) return;
  const emergency = (o.path ? isEmergencyPath(o.path) : false) || emergencyRecent(lastEmergencyCall(), Date.now());
  if (!shouldHint({ id: o.id, urgent: o.urgent, seen: st.hintsSeen, off: st.hintsOff, touring: p?.status === 'running', emergency })) return;
  st.showHint({ id: o.id, title: o.title, body: o.body, from: tourShownPath() });
}

export function ToolHintBubble() {
  const hint = useTourStore((s) => s.hint);
  const close = useTourStore((s) => s.closeHint);
  const setOff = useTourStore((s) => s.setHintsOff);
  const insets = useSafeAreaInsets();
  const demoInset = useDemoInset();
  const pathname = usePathname();
  // L'aide accompagne l'écran de l'outil : on note l'écran d'ORIGINE (où l'outil a été touché), puis l'écran de l'outil ;
  // elle se ferme dès qu'on quitte ce dernier. Si l'outil ne s'ouvre pas (écran verrouillé, même adresse), elle se
  // ferme au bout de 4 s au lieu de suivre la personne sur les écrans suivants.
  const track = useRef<{ id: string; tool: string | null } | null>(null);
  useEffect(() => {
    if (!hint) { track.current = null; return; }
    if (!track.current || track.current.id !== hint.id) track.current = { id: hint.id, tool: null };
    const cur = track.current;
    if (cur.tool == null) { if (pathname !== (hint.from ?? '')) cur.tool = pathname; return; }
    if (pathname !== cur.tool) close();
  }, [hint, pathname, close]);
  useEffect(() => {
    if (!hint) return;
    const id = setTimeout(() => { if (track.current?.id === hint.id && track.current.tool == null) close(); }, 4000);
    return () => clearTimeout(id);
  }, [hint, close]);
  useEffect(() => { if (hint) AccessibilityInfo.announceForAccessibility?.(`${hint.title}. ${hint.body}`); }, [hint]);
  if (!hint || isEmergencyPath(pathname)) return null;
  return (
    <View pointerEvents="box-none" testID="tool-hint" style={{ position: 'absolute', left: spacing.md, right: spacing.md, top: insets.top + demoInset + spacing.xs, alignItems: 'center' }}>
      <Glass variant="sheet" radius={radius.lg} style={{ width: '100%', maxWidth: 420 }} contentStyle={{ padding: spacing.sm, gap: 4 }} accessibilityLiveRegion="polite">
        <Text variant="small" weight="bold">{hint.title}</Text>
        <Text variant="small" testID="tool-hint-body">{hint.body}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.xxs }}>
          <GlassButton label={tr('tour.hint.off')} variant="tertiary" size="sm" onPress={() => setOff(true)} testID="tool-hint-off" />
          <GlassButton label={tr('tour.hint.ok')} variant="secondary" size="sm" onPress={close} testID="tool-hint-ok" />
        </View>
      </Glass>
    </View>
  );
}
