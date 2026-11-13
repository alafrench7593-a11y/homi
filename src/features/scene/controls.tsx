/**
 * Commandes partagées de la tranche Accueil + Missions (16/11/2026), en POINT D'INJECTION.
 * Le design system crée en parallèle les versions définitives ; tant qu'elles n'existent pas, ces versions sobres
 * (jetons du thème, src/motion) tiennent la place, avec les mêmes props :
 *  - `MemberSelector` → TODO(design system) : remplacer par `MemberSelector` / `GlassSelector` (verre léger, indicateur
 *    qui glisse) via `registerSceneControls({ MemberSelector })` ;
 *  - `DataTile`       → TODO(design system) : remplacer par `DataTile` (tuile de résultat : valeur + contexte) ;
 *  - `IconOrb`        → TODO(design system) : remplacer par `IconOrb` (bouton rond à icône).
 *
 * MemberSelector : groupe radio (lecteurs d'écran : « radio, sélectionné »), chaque option ≥ 48 px, avatar + prénom ; passe
 * à la ligne si besoin ; l'indicateur glisse d'une option à l'autre (ressort « doux », x et y) ; Réduire les animations :
 * il se pose sans mouvement.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Icon, Text, haptic, type IconName } from '@/components/ui';
import { UserAvatar } from '@/components/UserAvatar';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';

export interface MemberOption {
  value: string;
  label: string;
  /** Avatar (photo / initiale) ; sinon `icon`. */
  avatarPath?: string | null;
  initial?: string;
  icon?: IconName;
  testID?: string;
  hint?: string;
}

export interface MemberSelectorProps { label: string; options: MemberOption[]; value: string; onChange: (v: string) => void; testID?: string }

function DefaultMemberSelector({ label, options, value, onChange, testID }: MemberSelectorProps) {
  const t = useTheme();
  const m = useMotion();
  const [boxes, setBoxes] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({});
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const w = useSharedValue(0);
  const h = useSharedValue(0);
  const placed = useRef(false);
  const box = boxes[value];
  useEffect(() => {
    if (!box) return;
    if (!placed.current || m.off) { x.value = box.x; y.value = box.y; w.value = box.w; h.value = box.h; placed.current = true; return; }
    x.value = m.spring(box.x, 'doux');
    y.value = m.spring(box.y, 'doux');
    w.value = m.spring(box.w, 'doux');
    h.value = m.spring(box.h, 'doux');
  }, [box, m, x, y, w, h]);
  const ind = useAnimatedStyle(() => ({ width: w.value, height: h.value, transform: [{ translateX: x.value }, { translateY: y.value }] }));
  const onLayout = (k: string) => (e: LayoutChangeEvent) => {
    const { x: bx, y: by, width, height } = e.nativeEvent.layout;
    setBoxes((b) => (b[k]?.x === bx && b[k]?.y === by && b[k]?.w === width && b[k]?.h === height ? b : { ...b, [k]: { x: bx, y: by, w: width, h: height } }));
  };
  // Plusieurs lignes si besoin (petit écran, texte agrandi) : jamais de défilement horizontal caché
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} testID={testID}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 4, borderRadius: radius.lg, backgroundColor: t.material.lines.controlFill, borderWidth: 1, borderColor: t.colors.border }}>
      {box ? (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, borderRadius: radius.pill, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.tokens.border.active }, ind]} />
      ) : null}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onLayout={onLayout(o.value)} accessibilityRole="radio" accessibilityState={{ checked: on, selected: on }} aria-checked={on}
            accessibilityLabel={o.hint ? `${o.label}, ${o.hint}` : o.label} testID={o.testID}
            onPress={() => { if (!on) { haptic('selection'); onChange(o.value); } }}
            style={{ minHeight: MIN_TOUCH, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingLeft: 6, paddingRight: spacing.sm, borderRadius: radius.pill }}>
            {o.icon ? (
              <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.lines.iconWell }}>
                <Icon name={o.icon} size={16} color={on ? t.colors.primary : t.colors.textMuted} />
              </View>
            ) : <UserAvatar path={o.avatarPath} initial={o.initial ?? (o.label.trim()[0] ?? '?').toUpperCase()} size={32} />}
            <Text weight={on ? 'bold' : 'medium'} color={on ? t.colors.text : t.colors.textMuted} style={{ flexShrink: 1 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export interface DataTileProps {
  /** Valeur (nombre déjà formaté) ; null : état vide explicite (`empty`). */
  value: string | null;
  label: string;
  /** Contexte sous la valeur (« attendent votre réponse »). */
  context?: string;
  empty?: string;
  icon?: IconName;
  tone?: 'accent' | 'calm' | 'done';
  onPress?: () => void;
  testID?: string;
}

function DefaultDataTile({ value, label, context, empty, icon, tone = 'calm', onPress, testID }: DataTileProps) {
  const t = useTheme();
  const color = tone === 'accent' ? t.colors.primary : tone === 'done' ? t.colors.success : t.colors.text;
  const a11y = value == null ? `${label}. ${empty ?? ''}` : `${label} : ${value}${context ? `, ${context}` : ''}`;
  const body = (
    <View style={{ gap: 2, minHeight: 76, justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon ? <Icon name={icon} size={14} color={color} /> : null}
        <Text variant="caption" weight="bold" muted numberOfLines={2} style={{ flex: 1 }}>{label}</Text>
      </View>
      {value == null
        ? <Text variant="small" muted>{empty}</Text>
        : <Text variant="title" weight="bold" color={color} style={{ fontVariant: ['tabular-nums'] }}>{value}</Text>}
      {value != null && context ? <Text variant="caption" muted numberOfLines={2}>{context}</Text> : null}
    </View>
  );
  const style = { flex: 1, minWidth: 84, padding: spacing.sm, borderRadius: radius.md, backgroundColor: t.tokens.surface.opaque, borderWidth: 1, borderColor: t.colors.border };
  if (!onPress) return <View testID={testID} accessible accessibilityLabel={a11y} style={style}>{body}</View>;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} style={style}>{body}</Pressable>;
}

type Controls = { MemberSelector: React.ComponentType<MemberSelectorProps>; DataTile: React.ComponentType<DataTileProps> };
let injected: Partial<Controls> = {};
/** Point d'injection des commandes du design system (`{}` : revenir au défaut). */
export function registerSceneControls(c: Partial<Controls>) { injected = { ...c }; }

export function MemberSelector(p: MemberSelectorProps) { const C = injected.MemberSelector ?? DefaultMemberSelector; return <C {...p} />; }
export function DataTile(p: DataTileProps) { const C = injected.DataTile ?? DefaultDataTile; return <C {...p} />; }
