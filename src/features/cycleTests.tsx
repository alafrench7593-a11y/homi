/**
 * Composants de « Comprendre mon cycle et mes tests » : prise de photo guidée, cadrage, résultat.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform, View, type LayoutChangeEvent } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ProgressBar } from '@/components/Motion';
import { Banner, Button, Card, Icon, Row, Segmented, Text, Toggle } from '@/components/ui';
import { canKeepPhotos } from '@/lib/cycleAnalysis/privacy';
import { friendlyErrorMessage } from '@/lib/errors';
import { confidenceLabel, OUTCOME_LABEL, type TestAnalysis } from '@/lib/cycleAnalysis/interpret';
import { QUALITY_THRESHOLDS } from '@/lib/cycleAnalysis/quality';
import { formatNumber, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

export type PhotoSource = 'camera' | 'library';

/**
 * Prise de photo : l'image n'est PAS enregistrée dans la galerie (copie temporaire dans le cache de l'app,
 * supprimée après l'analyse). Le recadrage natif est proposé sur téléphone.
 */
export async function pickPhoto(source: PhotoSource): Promise<{ uri: string } | { error: string } | null> {
  const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { error: source === 'camera' ? tr('u8.cyc.permCam') : tr('u8.cyc.permLib') };
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.92, exif: false, allowsEditing: Platform.OS !== 'web', base64: false };
  const r = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync({ ...opts, allowsMultipleSelection: false });
  if (r.canceled || !r.assets?.[0]?.uri) return null;
  return { uri: r.assets[0].uri };
}

export function PhotoGuide({ kind }: { kind: 'test' | 'mucus' }) {
  return (
    <Card tone="soft">
      <Row gap={6}><Icon name="camera" size={18} /><Text weight="bold">{tr('u8.cyc.guideTitle')}</Text></Row>
      {(kind === 'test'
        ? [tr('u8.cyc.g1'), tr('u8.cyc.g2'), tr('u8.cyc.g3'), tr('u8.cyc.g4')]
        : [tr('u8.cyc.m1'), tr('u8.cyc.m2'), tr('u8.cyc.m3')]
      ).map((l) => <Text key={l} variant="small" style={{ marginTop: 4 }}>• {l}</Text>)}
    </Card>
  );
}

export function PhotoButtons({ onPicked, onError, disabled }: { onPicked: (uri: string) => void; onError: (msg: string) => void; disabled?: boolean }) {
  const [busy, setBusy] = useState<PhotoSource | null>(null);
  async function go(source: PhotoSource) {
    setBusy(source);
    try {
      const r = await pickPhoto(source);
      if (!r) return;
      if ('error' in r) onError(r.error);
      else onPicked(r.uri);
    } catch (err) {
      onError(friendlyErrorMessage(err, source === 'camera' ? tr('u8.cyc.openCam') : tr('u8.cyc.openLib')));
    } finally {
      setBusy(null);
    }
  }
  return (
    <Row wrap>
      <Button label={tr('u8.cyc.take')} icon="camera" onPress={() => go('camera')} disabled={disabled || busy === 'library'} loading={busy === 'camera'} />
      <Button label={tr('u8.cyc.choose')} icon="image" variant="secondary" onPress={() => go('library')} disabled={disabled || busy === 'camera'} loading={busy === 'library'} />
    </Row>
  );
}

export interface CropValue { c: { x: number; y: number } | null; t: { x: number; y: number } | null; band: number }

/**
 * Recadrage guidé : touchez l'extrémité de la fenêtre côté C, puis l'extrémité côté T.
 * Les coordonnées sont normalisées (0–1) dans l'image.
 */
export function CropPicker({ uri, value, onChange }: { uri: string; value: CropValue; onChange: (v: CropValue) => void }) {
  const t = useTheme();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [boxW, setBoxW] = useState(0);
  const boxRef = useRef<View>(null);
  useEffect(() => {
    Image.getSize(uri, (w, h) => setSize({ w, h }), () => setSize({ w: 4, h: 3 }));
  }, [uri]);
  const ratio = size ? size.h / size.w : 0.75;
  const dispH = Math.min(boxW * ratio, 420);
  const dispW = dispH / ratio;
  const offX = (boxW - dispW) / 2;

  function tap(x: number, y: number) {
    const nx = (x - offX) / dispW;
    const ny = y / dispH;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;
    if (!value.c || value.t) onChange({ ...value, c: { x: nx, y: ny }, t: null });
    else onChange({ ...value, t: { x: nx, y: ny } });
  }
  const P = (p: { x: number; y: number }) => ({ left: offX + p.x * dispW, top: p.y * dispH });
  const seg = value.c && value.t ? (() => {
    const a = P(value.c), b = P(value.t);
    const len = Math.hypot(b.left - a.left, b.top - a.top);
    const ang = Math.atan2(b.top - a.top, b.left - a.left);
    return { a, len, ang, thick: Math.max(6, len * value.band) };
  })() : null;

  const segStyle = seg ? ({ position: 'absolute' as const, left: seg.a.left, top: seg.a.top - seg.thick / 2, width: seg.len, height: seg.thick, borderWidth: 2, borderColor: t.colors.primary, backgroundColor: t.colors.primary + '22', transformOrigin: 'left center', transform: [{ rotate: `${seg.ang}rad` }] }) : null;

  return (
    <View style={{ gap: spacing.xs }}>
      <Text weight="bold">{!value.c ? tr('u8.cyc.crop1') : !value.t ? tr('u8.cyc.crop2') : tr('u8.cyc.crop3')}</Text>
      <Tappable
        ref={boxRef}
        accessibilityRole="imagebutton"
        accessibilityLabel={tr('u8.cyc.photoA11y')}
        onLayout={(e: LayoutChangeEvent) => setBoxW(e.nativeEvent.layout.width)}
        onPress={(e) => {
          // Position du toucher rapportée au cadre (locationX n'est pas fiable sur le web quand on touche l'image)
          const ne = e.nativeEvent as unknown as { pageX: number; pageY: number; clientX?: number; clientY?: number };
          const px = Platform.OS === 'web' ? ne.clientX ?? ne.pageX : ne.pageX;
          const py = Platform.OS === 'web' ? ne.clientY ?? ne.pageY : ne.pageY;
          boxRef.current?.measureInWindow((x, y) => tap(px - x, py - y));
        }}
        style={{ width: '100%', height: dispH || 240, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#0006' }}
      >
        {boxW > 0 && <Image source={{ uri }} style={{ position: 'absolute', left: offX, top: 0, width: dispW, height: dispH }} resizeMode="stretch" />}
        {segStyle ? <View pointerEvents="none" style={segStyle} /> : null}
        {value.c && <Marker at={P(value.c)} label="C" colour={t.colors.heart} />}
        {value.t && <Marker at={P(value.t)} label="T" colour={t.colors.lavender} />}
      </Tappable>
      <Row wrap>
        <Button label={tr('u8.cyc.redo')} icon="rotate-ccw" variant="secondary" size="sm" onPress={() => onChange({ ...value, c: null, t: null })} />
      </Row>
      <Segmented label={tr('u8.cyc.bandWidth')} value={value.band <= 0.15 ? 'fine' : value.band >= 0.3 ? 'large' : 'normal'} onChange={(v) => onChange({ ...value, band: v === 'fine' ? 0.12 : v === 'large' ? 0.34 : 0.22 })} options={[{ value: 'fine', label: tr('u8.cyc.fine') }, { value: 'normal', label: tr('u8.cyc.normal') }, { value: 'large', label: tr('u8.cyc.large') }]} />
    </View>
  );
}

function Marker({ at, label, colour }: { at: { left: number; top: number }; label: string; colour: string }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: at.left - 13, top: at.top - 13, width: 26, height: 26, borderRadius: 13, backgroundColor: colour, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' }}>
      <Text variant="caption" weight="bold" color="#fff">{label}</Text>
    </View>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  const t = useTheme();
  const label = confidenceLabel(value);
  return (
    <View accessible accessibilityLabel={tr('u8.cyc.confA11y', { label })} style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="small" muted>{tr('u8.cyc.conf')}</Text>
        <Text variant="small" weight="bold">{label}</Text>
      </Row>
      <ProgressBar value={value} track={t.colors.border} color={value >= 0.75 ? t.colors.success : value >= 0.5 ? t.colors.gold : t.colors.heart} />
    </View>
  );
}

/** Profil d'intensité mesuré le long de la fenêtre, avec les lignes retenues (C et T). */
export function LineProfile({ analysis }: { analysis: TestAnalysis }) {
  const t = useTheme();
  const s = analysis.scan;
  if (!s) return null;
  const n = 50;
  const step = s.residual.length / n;
  const vals = Array.from({ length: n }, (_, i) => Math.max(0, ...s.residual.slice(Math.floor(i * step), Math.floor((i + 1) * step))));
  const max = Math.max(10, ...vals);
  return (
    <View accessible accessibilityLabel={tr('u8.cyc.linesA11y', { control: s.control ? tr('u8.cyc.yes') : tr('u8.cyc.no'), test: s.test ? tr('u8.cyc.yes') : tr('u8.cyc.no') })}>
      <Row gap={1} style={{ height: 48, alignItems: 'flex-end' }}>
        {vals.map((v, i) => {
          const pos = (i + 0.5) / n;
          const isC = s.control && Math.abs(pos - s.control.position) < 0.03;
          const isT = s.test && Math.abs(pos - s.test.position) < 0.03;
          return <View key={i} style={{ flex: 1, height: Math.max(2, (v / max) * 48), borderRadius: 1, backgroundColor: isC ? t.colors.heart : isT ? t.colors.lavender : t.colors.border }} />;
        })}
      </Row>
      <Row style={{ justifyContent: 'space-between', marginTop: 2 }}>
        <Text variant="caption" muted>{tr('u8.cyc.sideC')}</Text>
        <Text variant="caption" muted>{tr('u8.cyc.sideT')}</Text>
      </Row>
    </View>
  );
}

function Check({ ok, label }: { ok: boolean | null; label: string }) {
  const t = useTheme();
  return (
    <Row gap={6}>
      <Icon name={ok == null ? 'minus' : ok ? 'check-circle' : 'x-circle'} size={16} color={ok == null ? t.colors.textMuted : ok ? t.colors.success : t.colors.heart} />
      <Text variant="small" style={{ flex: 1 }}>{label}</Text>
    </Row>
  );
}

export function AnalysisCard({ analysis }: { analysis: TestAnalysis }) {
  const q = analysis.quality;
  const s = analysis.scan;
  const tone = analysis.outcome === 'unusable' || analysis.outcome === 'invalid' ? 'warning' : 'info';
  return (
    <Card>
      <Text variant="caption" muted weight="bold" style={{ letterSpacing: 1 }}>{tr('u8.cyc.proposed')}</Text>
      <Text variant="heading" style={{ marginTop: 4 }} accessibilityRole="header">{OUTCOME_LABEL[analysis.outcome]}</Text>
      <View style={{ marginTop: spacing.sm }}><ConfidenceMeter value={analysis.confidence} /></View>
      {analysis.messages.map((m) => <Text key={m} variant="small" style={{ marginTop: spacing.xs }}>{m}</Text>)}
      {q || s ? (
        <View style={{ marginTop: spacing.sm, gap: 4 }}>
          <Text variant="label">{tr('u8.cyc.checks')}</Text>
          {q ? <Check ok={!q.issues.includes('too_dark') && !q.issues.includes('too_bright')} label={tr('u8.cyc.bright', { v: Math.round(q.windowBrightness ?? q.brightness) })} /> : null}
          {q ? <Check ok={!q.issues.includes('blurry')} label={tr('u8.cyc.sharp', { v: formatNumber(q.sharpness, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), min: QUALITY_THRESHOLDS.blurry })} /> : null}
          {s && q?.ok ? <Check ok={!!s.control} label={tr('u8.cyc.ctrlLine')} /> : null}
          {s && q?.ok && s.control ? <Check ok={s.test ? true : null} label={s.test ? tr('u8.cyc.testLine', { pct: Math.round((s.ratio ?? 0) * 100) }) : tr('u8.cyc.noTestLine')} /> : null}
        </View>
      ) : null}
      {s && q?.ok ? <View style={{ marginTop: spacing.sm }}><LineProfile analysis={analysis} /></View> : null}
      <Banner tone={tone}>{tr('u8.cyc.disclaimer')}</Banner>
    </Card>
  );
}

/** Choix de conservation : par défaut, rien n'est gardé. */
export function KeepPhotoChoice({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  if (!canKeepPhotos()) {
    return <Text variant="caption" muted>{tr('u8.cyc.delPhoto')}</Text>;
  }
  return (
    <View style={{ gap: 4 }}>
      <Toggle value={value} onChange={onChange} label={tr('u8.cyc.keep')} />
      <Text variant="caption" muted>{value
        ? tr('u8.cyc.keepOn')
        : tr('u8.cyc.keepOff')}</Text>
    </View>
  );
}
