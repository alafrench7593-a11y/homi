/**
 * Tableaux de l'introduction « Je suis… » : chaque scène montre de VRAIS composants de HOMI (tuiles de données,
 * lignes d'agenda de l'accueil, sélecteur de profil, cartes d'outils et leurs glyphes, commande du minuteur de tétée,
 * lignes du carnet de garde, pictogrammes des catégories) alimentés par des données de DÉMONSTRATION constantes —
 * rien n'est lu ni écrit dans un foyer. Non interactives (`pointerEvents="none"`) : le geste de l'introduction reste
 * le balayage. Une seule petite animation par scène, jouée quand le tableau est affiché (`active`) ; Réduire les
 * animations : état final immédiat.
 * Les éléments entrent en cascade grâce à `Layer` (profondeur `depth`) : décalage et fondu dérivés de la position du
 * pager (fil UI, aucune mise à jour React pendant le geste).
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { DataTile } from '@/components/controls';
import { GlassProfileSwitcher, type GlassProfile } from '@/components/glass';
import { MatteSurface } from '@/components/surfaces';
import { Text } from '@/components/ui';
import { HomiIcon, ICON_CATEGORIES, categoryTone, CATEGORY_HOMI_ICON } from '@/brand/icons';
import { SessionOrb } from '@/features/bottleSession';
import { CareRow } from '@/features/nounou/CareUI';
import type { CareItem } from '@/lib/domain/nounou';
import { demoAgenda, demoTiles } from './demoData';
import { TodayAgendaRow } from '@/features/homeToday/TodayTaskRow';
import type { TodayPerson } from '@/features/homeToday/useHomeToday';
import { emptyAnswers, type OnboardingAnswers, type Situation, type TaskKey } from '@/lib/onboarding/personalize';
import { categoryTitle, findEntry, toolCatalog } from '@/lib/domain/toolCatalog';
import type { Scope } from '@/lib/journeys/tools';
import { HubToolRow } from '@/features/hubs/HubList';
import { clockHM } from '@/i18n/formats';
import { formatDate, formatNumber, formatTime, t as tr } from '@/i18n';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import type { IntroScene } from './model';

// ------------------------------------------------------------------ cascade pilotée par le pager
interface LayerCtx { pos: SharedValue<number>; page: number; width: number; dir: number; off: boolean }
export const IntroLayerContext = createContext<LayerCtx | null>(null);

/**
 * Élément d'un tableau qui entre en cascade : plus `depth` est grand, plus il arrive tard et de plus loin pendant le
 * glissement entre deux tableaux (parallaxe), avec un fondu. Fil UI, transform et opacity seulement.
 */
export function Layer({ depth, children, style, testID }: { depth: number; children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const ctx = useContext(IntroLayerContext);
  const page = ctx?.page ?? 0;
  const dir = ctx?.dir ?? 1;
  const off = ctx?.off ?? true;
  const pos = ctx?.pos;
  const a = useAnimatedStyle(() => {
    if (!pos || off) return { opacity: 1, transform: [{ translateX: 0 }] };
    const d = page - pos.value; // > 0 : le tableau arrive de droite
    const k = Math.min(1, Math.abs(d) * (1 + depth * 0.45));
    return { opacity: 1 - k, transform: [{ translateX: d * dir * depth * 34 }] };
  });
  return <Animated.View style={[style, a]} testID={testID}>{children}</Animated.View>;
}

// ------------------------------------------------------------------ données de démonstration
const answersFor = (s: Situation): OnboardingAnswers => ({ ...emptyAnswers(), situations: [s] });

function people(): Record<'me' | 'other', TodayPerson> & { nobody: TodayPerson } {
  const me = tr('intro6.demo.me');
  const other = tr('intro6.demo.partner');
  return {
    me: { id: 'me', name: me, initial: me[0]!.toUpperCase(), avatarPath: null, isMe: true },
    other: { id: 'other', name: other, initial: other[0]!.toUpperCase(), avatarPath: null, isMe: false },
    nobody: { id: null, name: tr('o2.who.later'), initial: '?', avatarPath: null, isMe: false },
  };
}

/** Avatar d'exemple : initiale sur un disque teinté (comme un profil sans photo). */
function Initial({ letter, tone, size = 48 }: { letter: string; tone: string; size?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: tone }}>
      <Text weight="bold" color={t.tokens.action.text} style={{ fontSize: size * 0.4 }}>{letter}</Text>
    </View>
  );
}

function useDemoProfiles(kind: 'baby' | 'kids' | 'family'): GlassProfile[] {
  const t = useTheme();
  return useMemo(() => {
    const me = tr('intro6.demo.me');
    const kid = kind === 'baby' ? tr('intro6.demo.baby') : tr('intro6.demo.kid');
    const list: GlassProfile[] = [
      { key: 'me', label: me, avatar: <Initial letter={me[0]!.toUpperCase()} tone={t.colors.primary} /> },
      { key: 'kid', label: kid, avatar: <Initial letter={kid[0]!.toUpperCase()} tone={t.colors.lavender} /> },
    ];
    if (kind !== 'baby') list.push({ key: 'kid2', label: tr('intro6.demo.kid2'), avatar: <Initial letter={tr('intro6.demo.kid2')[0]!.toUpperCase()} tone={t.colors.gold} /> });
    list.push({ key: 'home', label: tr('intro6.demo.home'), avatar: <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surfaceAlt }}><HomiIcon name="family" size={26} /></View> });
    return list;
  }, [kind, t]);
}

/** Le profil affiché passe d'un avatar à l'autre (l'indicateur du vrai sélecteur glisse) tant que le tableau est vu. */
function useCycle(active: boolean, count: number, ms = 1500) {
  const m = useMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active || m.off) return;
    const id = setInterval(() => setI((x) => (x + 1) % count), ms);
    return () => clearInterval(id);
  }, [active, count, ms, m.off]);
  return i;
}

/** Une action « à faire » de l'agenda se coche toute seule, une fois, quand le tableau est vu. */
function useDoneOnce(active: boolean, ms = 1200) {
  const m = useMotion();
  const [done, setDone] = useState(m.off);
  useEffect(() => {
    if (!active || done) return;
    const id = setTimeout(() => setDone(true), ms);
    return () => clearTimeout(id);
  }, [active, done, ms]);
  return done;
}

// ------------------------------------------------------------------ pièces
function Tiles({ situation, depth = 1 }: { situation: Situation; depth?: number }) {
  const { width } = useWindowDimensions();
  const narrow = width < 360;
  const tiles = useMemo(() => demoTiles(answersFor(situation)).map((x) => {
    if (!narrow || x.key !== 'appt') return x;
    // 320 pt : « dim. 14:30 » ne tient pas en grand dans une demi-tuile → le jour en grand, l'heure dans le contexte
    const at = new Date(); at.setDate(at.getDate() + 2); at.setHours(14, 30, 0, 0);
    return { ...x, value: formatDate(at, { weekday: 'short' }).replace(/^./, (c) => c.toUpperCase()), context: `${formatTime(at)} · ${x.context}` };
  }), [situation, narrow]);
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {tiles.map((x, i) => (
        <Layer key={x.key} depth={depth + i} style={{ flex: 1, minWidth: 0 }}>
          <DataTile label={x.label} value={x.value} unit={x.unit} context={x.context} contextLines={2} icon={x.icon} tint={x.tint} series={x.series} testID={`intro-tile-${x.key}`} style={{ flex: 1 }} />
        </Layer>
      ))}
    </View>
  );
}

function Agenda({ deck, split, active, depth = 1, title, max }: { deck: TaskKey[]; split: OnboardingAnswers['split']; active: boolean; depth?: number; title: string; max?: number }) {
  const t = useTheme();
  const { height } = useWindowDimensions();
  // écran court (568 pt) : deux lignes, jamais une ligne coupée par le pied
  const limit = max ?? (height < 700 ? 2 : 3);
  const rows = useMemo(() => demoAgenda(deck, split).slice(0, limit), [deck, split, limit]);
  const p = people();
  const mine = rows.find((r) => r.canComplete);
  const done = useDoneOnce(active);
  return (
    <Layer depth={depth}>
      <MatteSurface radius={radius.lg} padded={spacing.sm} testID="intro-agenda">
        <Text variant="label" weight="bold" style={{ marginBottom: spacing.xxs }}>{title}</Text>
        {rows.map((x, i) => {
          const isDone = done && x.id === mine?.id;
          return (
            <View key={x.id} style={i ? { borderTopWidth: 1, borderTopColor: t.material.lines.separator } : undefined}>
              <TodayAgendaRow x={{ ...x, done: isDone }} owner={x.ownerId === 'me' ? p.me : x.ownerId === 'other' ? p.other : p.nobody} creator={p.me} celebrate={isDone} onComplete={() => undefined} />
            </View>
          );
        })}
      </MatteSurface>
    </Layer>
  );
}

const NO_LINE = { text: '' };
function ToolRows({ ids, scope, depth = 1 }: { ids: string[]; scope: Scope; depth?: number }) {
  const { height } = useWindowDimensions();
  const tools = useMemo(() => {
    const all = toolCatalog({ scope, childId: 'demo', pregnancyId: 'demo', babyId: 'demo' });
    return ids.map((id) => findEntry(all, id)).filter((x): x is NonNullable<typeof x> => !!x).slice(0, height < 700 ? 3 : 4);
  }, [ids, scope, height]);
  return (
    <Layer depth={depth}>
      <MatteSurface radius={radius.lg} padded={spacing.sm} testID="intro-tools">
        {tools.map((x, i) => (
          <Layer key={x.id} depth={depth + i * 0.5} testID={`intro-tool-${x.id}`}>
            {/* nom de l'outil seul (sa description complète est trop longue pour un tableau d'une phrase) */}
            <HubToolRow tool={x} favorite={false} status={NO_LINE} />
          </Layer>
        ))}
      </MatteSurface>
    </Layer>
  );
}

function Profiles({ kind, active, depth = 1 }: { kind: 'baby' | 'kids' | 'family'; active: boolean; depth?: number }) {
  const list = useDemoProfiles(kind);
  const i = useCycle(active, list.length);
  return (
    <Layer depth={depth}>
      <GlassProfileSwitcher profiles={list} activeKey={list[i]!.key} onChange={() => undefined} label={tr('intro6.demo.profiles')} testID="intro-profiles" />
    </Layer>
  );
}

/** Minuteur de tétée : la vraie commande du minuteur (`SessionOrb`) et le temps qui défile. */
function FeedTimer({ active }: { active: boolean }) {
  const t = useTheme();
  const m = useMotion();
  const [sec, setSec] = useState(12 * 60 + 4);
  useEffect(() => {
    if (!active || m.off) return;
    const id = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active, m.off]);
  const mm = Math.floor(sec / 60);
  const ss = sec % 60;
  return (
    <View style={{ gap: spacing.sm }}>
      <Layer depth={1}>
        <MatteSurface radius={radius.xl} padded={spacing.md} testID="intro-timer">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <SessionOrb icon="pause" label={tr('intro6.timer.pause')} onPress={() => undefined} size={72} pulseKey="run" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="label" muted>{tr('intro6.timer.kind')}</Text>
              <Text style={{ fontSize: 40, lineHeight: 46, fontVariant: ['tabular-nums'] }} weight="bold" accessibilityLabel={tr('intro6.timer.a11y', { min: mm })}>
                {`${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`}
              </Text>
              <Text variant="small" color={t.colors.primary} weight="bold">{tr('intro6.timer.side')}</Text>
            </View>
          </View>
        </MatteSurface>
      </Layer>
      <Layer depth={2}>
        <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
          {[tr('intro6.timer.last', { time: clockHM(9, 40) }), tr('intro6.timer.count', { n: formatNumber(6) })].map((s) => (
            <View key={s} style={{ paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: t.material.lines.iconWell }}>
              <Text variant="small" weight="medium">{s}</Text>
            </View>
          ))}
        </View>
      </Layer>
    </View>
  );
}

/** Carnet de garde : les vraies lignes du carnet (`CareRow`) d'une matinée d'exemple. */
function CareBook() {
  const t = useTheme();
  const at = (h: number, m: number) => new Date(new Date().setHours(h, m, 0, 0)).toISOString();
  const items: CareItem[] = [
    { kind: 'arrival', id: 'a', at: at(8, 5), authorId: 'n', origin: null, row: {} },
    { kind: 'bottle', id: 'b', at: at(9, 40), authorId: 'n', origin: null, row: { consumed_ml: 150 } },
    { kind: 'sleep', id: 's', at: at(10, 15), endAt: at(11, 30), authorId: 'n', origin: null, row: {} },
  ];
  const nanny = tr('intro6.demo.nanny');
  return (
    <Layer depth={1}>
      <MatteSurface radius={radius.lg} padded={spacing.sm} testID="intro-carebook">
        <Text variant="label" weight="bold">{tr('intro6.care.title', { name: tr('intro6.demo.kid') })}</Text>
        {items.map((it, i) => (
          <Layer key={it.id} depth={1 + i * 0.6} style={i ? { borderTopWidth: 1, borderTopColor: t.material.lines.separator } : undefined}>
            <CareRow item={it} author={nanny} />
          </Layer>
        ))}
      </MatteSurface>
    </Layer>
  );
}

/** Les 9 familles d'outils, avec les nouveaux pictogrammes HOMI. */
function Categories() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const cell = Math.floor((Math.min(width, 520) - spacing.lg * 2 - spacing.xs * 2) / 3);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }} testID="intro-categories">
      {ICON_CATEGORIES.map((c, i) => (
        <Layer key={c} depth={1 + Math.floor(i / 3) * 0.7 + (i % 3) * 0.3} style={{ width: cell }}>
          <View style={{ alignItems: 'center', gap: 4, paddingVertical: spacing.sm, borderRadius: radius.lg, backgroundColor: t.material.glass.inset.fill, borderWidth: 1, borderColor: t.material.glass.inset.edge }}>
            <HomiIcon name={CATEGORY_HOMI_ICON[c]} size={30} tone={categoryTone(t, c)} active />
            <Text variant="caption" weight="medium" center numberOfLines={2} style={{ paddingHorizontal: 4 }}>{categoryTitle(c)}</Text>
          </View>
        </Layer>
      ))}
    </View>
  );
}

// ------------------------------------------------------------------ une scène
export function SceneView({ scene, active }: { scene: IntroScene; active: boolean }) {
  switch (scene) {
    case 'pregTiles': return <Tiles situation="pregnant" />;
    case 'nextAction': return <Agenda deck={['appt', 'bag', 'admin']} split={{ appt: 'me', bag: 'other', admin: 'me' }} active={active} title={tr('intro6.agenda.next')} />;
    case 'pregTools': return <ToolRows scope="pregnancy" ids={['preg_evolution', 'preg_moves', 'preg_lists', 'appointments']} />;
    case 'feedTimer': return <FeedTimer active={active} />;
    case 'babyTiles': return <Tiles situation="baby" />;
    case 'familyProfiles': return (
      <View style={{ gap: spacing.sm }}>
        <Profiles kind="baby" active={active} />
        <Agenda deck={['night', 'nanny', 'meals']} split={{ night: 'other', nanny: 'me', meals: 'me' }} active={active} depth={2} title={tr('o2.demo.today')} />
      </View>
    );
    case 'kidProfiles': return (
      <View style={{ gap: spacing.sm }}>
        <Profiles kind="kids" active={active} />
        <Tiles situation="kids" depth={2} />
      </View>
    );
    case 'weekPlan': return <Agenda deck={['school', 'appt', 'meals']} split={{ school: 'other', appt: 'me', meals: 'me' }} active={active} title={tr('intro6.agenda.week')} />;
    case 'kidTools': return <ToolRows scope="child" ids={['kid_routines', 'kid_mood', 'kid_health', 'kid_profile']} />;
    case 'careBook': return <CareBook />;
    case 'split': return <Agenda deck={['daycare', 'shopping', 'laundry']} split={{ daycare: 'other', shopping: 'me', laundry: 'other' }} active={active} title={tr('intro6.agenda.split')} />;
    case 'coparentTools': return <ToolRows scope="family" ids={['family_missions', 'family_calendar', 'family_shopping', 'family_stocks']} />;
    case 'categories': return <Categories />;
    case 'everyone': return (
      <View style={{ gap: spacing.sm }}>
        <Profiles kind="family" active={active} />
        <Tiles situation="home" depth={2} />
      </View>
    );
    case 'today': return <Agenda deck={['appt', 'meals', 'shopping']} split={{ appt: 'me', meals: 'other', shopping: 'me' }} active={active} title={tr('intro6.agenda.next')} />;
  }
}
