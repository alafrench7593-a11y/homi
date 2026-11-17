/**
 * Galerie « Liquid Glass » (QA visuelle) : chaque composant de `@/components/glass`, chaque état, sur fond UNI et sur
 * IMAGE, au niveau de verre de l'appareil ou forcé en opaque. Accessible depuis Réglages en mode développeur ou en
 * démonstration seulement ; ailleurs, retour à l'accueil. Contenu d'exemple : `src/features/dev/glassGalleryData.ts`.
 */
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { isDemo } from '@/lib/backend';
import { useDemoInset } from '@/components/demoInset';
import { useDeveloperMode } from '@/lib/devMode';
import { ContentSwap, ReorderList, SkeletonBone, SkeletonPulse, StaggerList, SuccessCheck, useReorderScroll, useShake } from '@/motion';
import { Field, Icon, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import {
  Glass, GlassButton, GlassCard, GlassFab, GlassIconButton, GlassMenu, GlassModal, GlassProfileSwitcher, GlassSearchBar, GlassSegmentedControl, GlassSheet,
  GlassTabBar, GlassTierProvider, GlassToastProvider, GlassToolCard, GlassToolCardSkeleton, useGlass, useMenuAnchor, type GlassTier,
} from '@/components/glass';
import { G } from '@/features/dev/glassGalleryData';
import { t as tr } from '@/i18n';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PHOTO = require('../../../assets/recipes/puree-carotte-pomme-de-terre.webp');

function Section({ title, children, testID }: { title: string; children: React.ReactNode; testID?: string }) {
  return (
    <View style={{ gap: spacing.sm }} testID={testID}>
      {/* étiquette sur verre : lisible sur le fond uni comme sur l'image */}
      <Glass variant="chrome" radius={radius.pill} shadow={false} style={{ alignSelf: 'flex-start' }} contentStyle={{ paddingHorizontal: 12, paddingVertical: 5 }}>
        <GlassLabel>{title}</GlassLabel>
      </Glass>
      {children}
    </View>
  );
}

function GlassLabel({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  const { spec } = useGlass('chrome');
  return <Text variant="caption" weight="bold" color={muted ? spec.inks.muted : spec.inks.text} style={{ letterSpacing: 0.3 }}>{children}</Text>;
}

function Avatar({ initial, size = 48 }: { initial: string; size?: number }) {
  const t = useTheme();
  return (
    <LinearGradient colors={t.tokens.decor.ring} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <Text weight="bold" color={t.tokens.text.onDecor} style={{ fontSize: 19, lineHeight: 24 }}>{initial}</Text>
    </LinearGradient>
  );
}

function Materials() {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {G.variants.map((v) => <Swatch key={v.key} variant={v.key} name={v.name} note={v.note} />)}
    </View>
  );
}
function Swatch({ variant, name, note }: { variant: 'chrome' | 'card' | 'sheet'; name: string; note: string }) {
  const { spec } = useGlass(variant);
  return (
    <Glass variant={variant} radius={radius.lg} style={{ flex: 1 }} contentStyle={{ padding: spacing.sm, gap: 2, minHeight: 86, justifyContent: 'flex-end' }} testID={`gallery-material-${variant}`}>
      <Text weight="bold" color={spec.inks.text}>{name}</Text>
      <Text variant="caption" color={spec.inks.muted}>{note}</Text>
    </Glass>
  );
}

function Toasts() {
  const toast = useToast();
  return (
    <View style={styles.wrap}>
      <GlassButton size="sm" label={G.toastOk} onPress={() => toast(G.toastOkMsg, 'success')} testID="gallery-toast-ok" />
      <GlassButton size="sm" label={G.toastInfo} onPress={() => toast(G.toastInfoMsg, 'info')} />
      <GlassButton size="sm" label={G.toastErr} onPress={() => toast(G.toastErrMsg, 'error')} />
    </View>
  );
}

function MotionDemos() {
  const [profile, setProfile] = useState('lea');
  const [round, setRound] = useState(0);
  const [bad, setBad] = useState(false);
  const [ok, setOk] = useState(true);
  const sh = useShake();
  const p = G.profiles.find((x) => x.key === profile) ?? G.profiles[0];
  return (
    <View style={{ gap: spacing.sm }}>
      <GlassCard testID="gallery-swap">
        <View style={{ gap: spacing.xs }}>
          <ContentSwap swapKey={profile}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Avatar initial={p.initial} size={40} />
              <View style={{ flex: 1 }}>
                <GlassLabel muted>{G.swapOf}</GlassLabel>
                <CardText bold>{p.label}</CardText>
                <CardText>{G.swapLines[p.key]}</CardText>
              </View>
            </View>
          </ContentSwap>
          <GlassButton size="sm" label={G.swap} icon="repeat" testID="gallery-swap-next"
            onPress={() => setProfile(G.profiles[(G.profiles.findIndex((x) => x.key === profile) + 1) % G.profiles.length].key)} />
        </View>
      </GlassCard>
      <View style={styles.wrap}>
        <GlassButton size="sm" label={G.stagger} icon="refresh-cw" onPress={() => setRound((n) => n + 1)} />
        <GlassButton size="sm" label={G.shake} icon="alert-triangle" onPress={() => { setBad(true); sh.shake(); }} testID="gallery-shake" />
        <GlassButton size="sm" label={G.check} icon="check" onPress={() => { setOk(false); setTimeout(() => setOk(true), 250); }} />
      </View>
      <StaggerList key={round} gap={spacing.xs}>
        {G.reorder.slice(0, 3).map((r) => <Row key={r.key} icon={r.icon} title={r.title} />)}
      </StaggerList>
      <GlassCard>
        <View style={{ gap: spacing.sm }}>
          <Animated.View style={sh.style}><Field label={G.shakeField} keyboardType="decimal-pad" error={bad ? G.shakeError : null} onChangeText={() => setBad(false)} testID="gallery-field" /></Animated.View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <SuccessCheck visible={ok} size={28} testID="gallery-check" />
            <CardText>{G.check}</CardText>
          </View>
          <SkeletonPulse label={tr('common.loadingA11y')} style={{ gap: 8 }}>
            <SkeletonBone width="55%" height={14} />
            <SkeletonBone width="90%" height={12} />
          </SkeletonPulse>
        </View>
      </GlassCard>
    </View>
  );
}

function CardIcon({ name, muted }: { name: React.ComponentProps<typeof Icon>['name']; muted?: boolean }) {
  const { spec } = useGlass('card');
  return <Icon name={name} size={muted ? 20 : 22} color={muted ? spec.inks.muted : spec.inks.accent} />;
}

function CardText({ children, bold }: { children: React.ReactNode; bold?: boolean }) {
  const { spec } = useGlass('card');
  return <Text variant={bold ? 'body' : 'small'} weight={bold ? 'bold' : 'regular'} color={bold ? spec.inks.text : spec.inks.muted}>{children}</Text>;
}

function Row({ icon, title, lifted, grip, a11y }: { icon: React.ComponentProps<typeof Icon>['name']; title: string; lifted?: boolean; grip?: boolean; a11y?: object }) {
  const { spec } = useGlass('card');
  return (
    <Glass variant="card" radius={radius.md} shadow={!lifted} contentStyle={styles.row} accessible accessibilityLabel={title} {...a11y}>
      <Icon name={icon} size={20} color={spec.inks.accent} />
      <Text weight="medium" color={spec.inks.text} style={{ flex: 1 }}>{title}</Text>
      {grip ? <Icon name="menu" size={18} color={spec.inks.muted} /> : null}
    </Glass>
  );
}

export default function GlassGallery() {
  const t = useTheme();
  const safe = useSafeAreaInsets();
  // la pastille « Démonstration » occupe le haut de l'écran : la barre du haut passe dessous
  const demoInset = useDemoInset();
  const insets = { ...safe, top: safe.top + demoInset };
  const dev = useDeveloperMode();
  const [backdrop, setBackdrop] = useState<'solid' | 'image'>('solid');
  const [tier, setTier] = useState<'auto' | 'opaque'>('auto');
  const [query, setQuery] = useState(G.searchValue);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [profile, setProfile] = useState('lea');
  const [tab, setTab] = useState('today');
  const [favs, setFavs] = useState<Record<string, boolean>>({ bottle: true });
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [order, setOrder] = useState(G.reorder);
  const menu = useMenuAnchor();
  const scroll = useReorderScroll();
  // Le mode développeur et la démonstration se lisent de façon asynchrone à l'ouverture : court délai de grâce avant
  // de renvoyer à l'accueil (sinon un lien direct vers la galerie serait toujours refusé).
  const [grace, setGrace] = useState(true);
  useEffect(() => { const id = setTimeout(() => setGrace(false), 800); return () => clearTimeout(id); }, []);
  if (!dev && !isDemo) return grace ? <View style={{ flex: 1, backgroundColor: t.colors.background }} /> : <Redirect href="/" />;
  const forced: GlassTier | null = tier === 'opaque' ? 'opaque' : null;
  const wait = (ok: boolean) => new Promise<void>((res, rej) => setTimeout(() => (ok ? res() : rej(new Error(G.toastErrMsg))), 900));

  return (
    <GlassTierProvider value={forced}>
      <GlassToastProvider>
        <View style={{ flex: 1, backgroundColor: t.colors.background }} testID="glass-gallery">
          <StatusBar style={t.isDark ? 'light' : 'dark'} />
          {backdrop === 'image' ? <Image source={PHOTO} resizeMode="cover" accessibilityIgnoresInvertColors style={[StyleSheet.absoluteFill, styles.photo]} testID="gallery-photo" /> : null}
          <Animated.ScrollView {...scroll.props} testID="gallery-scroll" keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: insets.top + 76, paddingHorizontal: spacing.md, paddingBottom: insets.bottom + 132, gap: spacing.lg }}>
            <View style={{ gap: spacing.xs }}>
              <GlassSegmentedControl label={G.backdrop} value={backdrop} onChange={setBackdrop} testID="gallery-backdrop"
                options={[{ value: 'solid', label: G.solid, icon: 'square' }, { value: 'image', label: G.image, icon: 'image' }]} />
              <GlassSegmentedControl label={G.tier} value={tier} onChange={setTier} testID="gallery-tier"
                options={[{ value: 'auto', label: G.auto }, { value: 'opaque', label: G.opaque }]} />
            </View>

            <Section title={G.s.material}><Materials /></Section>

            <Section title={G.s.buttons} testID="gallery-buttons">
              <View style={{ gap: spacing.sm }}>
                <GlassButton variant="primary" label={G.b.primary} icon="check" full onPress={() => wait(true)} testID="gallery-primary" />
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <GlassButton variant="secondary" label={G.b.secondary} style={{ flex: 1 }} full onPress={() => wait(false)} />
                  <GlassButton variant="destructive" label={G.b.destructive} icon="trash-2" style={{ flex: 1 }} full onPress={() => undefined} />
                </View>
                <View style={styles.wrap}>
                  {/* tertiary : sans surface, réservé au fond UNI (sur une image, son libellé n'est pas garanti) */}
                  {backdrop === 'solid' ? <GlassButton variant="tertiary" label={G.b.tertiary} iconRight="arrow-right" onPress={() => undefined} /> : null}
                  <GlassButton size="sm" label={G.b.small} onPress={() => undefined} />
                  <GlassButton size="lg" label={G.b.large} onPress={() => undefined} />
                </View>
              </View>
            </Section>

            <Section title={G.s.states} testID="gallery-states">
              {(['primary', 'secondary', 'destructive'] as const).map((v) => (
                <View key={v} style={{ flexDirection: 'row', gap: spacing.xs }}>
                  <GlassButton size="sm" variant={v} label={G.b.disabled} disabled style={{ flex: 1 }} full />
                  <GlassButton size="sm" variant={v} label={G.b.loading} state="loading" style={{ flex: 1 }} full />
                  <GlassButton size="sm" variant={v} label={G.b.success} state="success" style={{ flex: 1 }} full />
                  <GlassButton size="sm" variant={v} label={G.b.error} state="error" style={{ flex: 1 }} full />
                </View>
              ))}
            </Section>

            <Section title={G.s.floating}>
              <View style={[styles.wrap, { alignItems: 'center' }]}>
                <GlassIconButton icon="share" label={G.b.share} onPress={() => undefined} />
                <GlassIconButton icon="sliders" label={G.b.filter} onPress={() => undefined} selected />
                <GlassIconButton icon="x" label={G.b.close} onPress={() => undefined} disabled />
                <GlassFab icon="plus" label={G.b.add} onPress={() => undefined} testID="gallery-fab" />
                <GlassFab icon="edit-3" label={G.b.add} showLabel tone="glass" onPress={() => undefined} />
              </View>
            </Section>

            <Section title={G.s.search}>
              <GlassSearchBar value={query} onChangeText={setQuery} placeholder={G.searchPlaceholder} testID="gallery-search" />
            </Section>

            <Section title={G.s.segmented}>
              <GlassSegmentedControl label={G.period} options={G.segments} value={period} onChange={setPeriod} testID="gallery-period" />
            </Section>

            <Section title={G.s.profiles}>
              <GlassProfileSwitcher activeKey={profile} onChange={setProfile} onAdd={() => undefined} addLabel={G.addProfile} testID="gallery-profiles"
                profiles={G.profiles.map((p) => ({ key: p.key, label: p.label, accessibilityLabel: p.a11y, avatar: <Avatar initial={p.initial} /> }))} />
            </Section>

            <Section title={G.s.tools} testID="gallery-tools">
              <View style={styles.grid}>
                {G.tools.map((tool, i) => (
                  <GlassToolCard key={tool.key} title={tool.title} description={tool.description} icon={tool.icon} profile={tool.profile} style={styles.cell}
                    favorite={!!favs[tool.key]} onToggleFavorite={(next) => setFavs((f) => ({ ...f, [tool.key]: next }))} onPress={() => undefined}
                    disabled={i === 2} testID={`gallery-tool-${tool.key}`} />
                ))}
                <GlassToolCardSkeleton style={styles.cell} />
              </View>
            </Section>

            <Section title={G.s.card}>
              <GlassCard onPress={() => undefined} accessibilityLabel={G.cardTitle}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <CardIcon name="clock" />
                  <View style={{ flex: 1 }}><CardText bold>{G.cardTitle}</CardText><CardText>{G.cardBody}</CardText></View>
                  <CardIcon name="chevron-right" muted />
                </View>
              </GlassCard>
            </Section>

            <Section title={G.s.overlays}>
              <View style={styles.wrap}>
                <View ref={menu.ref} collapsable={false}><GlassButton size="sm" label={G.menu} icon="more-horizontal" onPress={menu.open} testID="gallery-menu-open" /></View>
                <GlassButton size="sm" label={G.modal} onPress={() => setModal(true)} testID="gallery-modal-open" />
                <GlassButton size="sm" label={G.sheet} onPress={() => setSheet(true)} testID="gallery-sheet-open" />
              </View>
              <Toasts />
            </Section>

            <Section title={G.s.motion}><MotionDemos /></Section>

            <Section title={G.s.reorder} testID="gallery-reorder">
              <GlassLabel muted>{G.reorderHint}</GlassLabel>
              <ReorderList data={order} keyOf={(r) => r.key} gap={spacing.xs} scroll={scroll} liftRadius={radius.md}
                moveUpLabel={tr('glass.reorder.up')} moveDownLabel={tr('glass.reorder.down')}
                onReorder={(keys) => setOrder(keys.map((k) => G.reorder.find((r) => r.key === k)!))}
                renderItem={(r, info) => <Row icon={r.icon} title={r.title} grip lifted={info.active} a11y={{ ...info.a11y, accessibilityHint: tr('glass.reorder.hint') }} />} />
            </Section>
          </Animated.ScrollView>

          {/* Barre du haut et barre d'onglets : verre flottant au-dessus du contenu qui défile */}
          <View pointerEvents="box-none" style={[styles.top, { paddingTop: insets.top + 8 }]}>
            <GlassIconButton icon="chevron-left" label={G.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))} testID="gallery-back" />
            <Glass variant="chrome" radius={22} contentStyle={{ height: 44, paddingHorizontal: spacing.md, justifyContent: 'center' }}>
              <GlassLabel>{G.title}</GlassLabel>
            </Glass>
          </View>
          <GlassTabBar style={styles.bottom} activeKey={tab} onChange={setTab} tabs={G.tabs} centerAfter={2} testID="gallery-tabbar"
            center={<GlassFab icon="plus" label={G.b.add} size={48} onPress={() => undefined} />} />

          <GlassMenu visible={menu.visible} onClose={menu.close} anchor={menu.anchor} testID="gallery-menu"
            items={G.menuItems.map((it) => ({ ...it, destructive: it.key === 'delete', selected: it.key === 'pin', onPress: () => undefined }))} />
          <GlassModal visible={modal} onClose={() => setModal(false)} title={G.modalTitle} message={G.modalBody} testID="gallery-modal"
            actions={[{ label: G.modalCancel, onPress: () => setModal(false) }, { label: G.modalOk, variant: 'destructive', onPress: () => setModal(false) }]} />
          <GlassSheet visible={sheet} onClose={() => setSheet(false)} title={G.sheetTitle}>
            <Text muted>{G.sheetBody}</Text>
            <GlassButton variant="primary" label={G.b.primary} full onPress={() => setSheet(false)} />
          </GlassSheet>
        </View>
      </GlassToastProvider>
    </GlassTierProvider>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', height: '100%' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: { flexBasis: '46%', flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md },
  top: { position: 'absolute', top: 0, left: spacing.md, right: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
