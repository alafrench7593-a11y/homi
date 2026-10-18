/**
 * Composants de « Comprendre mon cycle et mes tests » : prise de photo guidée, cadrage, résultat.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, View, type LayoutChangeEvent } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ProgressBar } from '@/components/Motion';
import { Banner, Button, Card, Icon, Row, Segmented, Text, Toggle } from '@/components/ui';
import { canKeepPhotos } from '@/lib/cycleAnalysis/privacy';
import { friendlyErrorMessage } from '@/lib/errors';
import { confidenceLabel, OUTCOME_LABEL, type TestAnalysis } from '@/lib/cycleAnalysis/interpret';
import { QUALITY_THRESHOLDS } from '@/lib/cycleAnalysis/quality';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export type PhotoSource = 'camera' | 'library';

/**
 * Prise de photo : l'image n'est PAS enregistrée dans la galerie (copie temporaire dans le cache de l'app,
 * supprimée après l'analyse). Le recadrage natif est proposé sur téléphone.
 */
export async function pickPhoto(source: PhotoSource): Promise<{ uri: string } | { error: string } | null> {
  const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { error: source === 'camera' ? 'Autorisez l’appareil photo dans les réglages pour prendre la photo.' : 'Autorisez l’accès aux photos dans les réglages.' };
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.92, exif: false, allowsEditing: Platform.OS !== 'web', base64: false };
  const r = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync({ ...opts, allowsMultipleSelection: false });
  if (r.canceled || !r.assets?.[0]?.uri) return null;
  return { uri: r.assets[0].uri };
}

export function PhotoGuide({ kind }: { kind: 'test' | 'mucus' }) {
  return (
    <Card tone="soft">
      <Row gap={6}><Icon name="camera" size={18} /><Text weight="bold">Pour une photo exploitable</Text></Row>
      {(kind === 'test'
        ? ['Posez le test à plat sur une surface claire et unie.', 'Lumière naturelle ou blanche, sans flash ni reflet sur la fenêtre.', 'Toute la fenêtre de résultat doit être visible et nette (touchez l’écran pour la mise au point).', 'Prenez la photo pendant le délai de lecture de la notice.']
        : ['Sur un support propre et clair (papier toilette blanc, bout des doigts).', 'Lumière naturelle, sans flash, photo nette et rapprochée.', 'Ne photographiez que l’échantillon, sans partie du corps reconnaissable.']
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
      onError(friendlyErrorMessage(err, source === 'camera' ? 'Impossible d’ouvrir l’appareil photo. Réessayez.' : 'Impossible d’ouvrir vos photos. Réessayez.'));
    } finally {
      setBusy(null);
    }
  }
  return (
    <Row wrap>
      <Button label="Prendre une photo" icon="camera" onPress={() => go('camera')} disabled={disabled || busy === 'library'} loading={busy === 'camera'} />
      <Button label="Choisir une image" icon="image" variant="secondary" onPress={() => go('library')} disabled={disabled || busy === 'camera'} loading={busy === 'library'} />
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

  return (
    <View style={{ gap: spacing.xs }}>
      <Text weight="bold">{!value.c ? '1. Touchez l’extrémité de la fenêtre côté ligne de contrôle (C)' : !value.t ? '2. Touchez l’autre extrémité de la fenêtre (côté T)' : 'Cadrage prêt : la bande colorée doit couvrir les lignes'}</Text>
      <Pressable
        ref={boxRef}
        accessibilityRole="imagebutton"
        accessibilityLabel="Photo du test : touchez les deux extrémités de la fenêtre de résultat"
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
        {seg && (
          <View pointerEvents="none" style={{ position: 'absolute', left: seg.a.left, top: seg.a.top - seg.thick / 2, width: seg.len, height: seg.thick, borderWidth: 2, borderColor: t.colors.primary, backgroundColor: t.colors.primary + '22', transformOrigin: 'left center', transform: [{ rotate: `${seg.ang}rad` }] }} />
        )}
        {value.c && <Marker at={P(value.c)} label="C" colour={t.colors.heart} />}
        {value.t && <Marker at={P(value.t)} label="T" colour={t.colors.lavender} />}
      </Pressable>
      <Row wrap>
        <Button label="Recommencer le cadrage" icon="rotate-ccw" variant="secondary" size="sm" onPress={() => onChange({ ...value, c: null, t: null })} />
      </Row>
      <Segmented label="Largeur de la bande analysée" value={value.band <= 0.15 ? 'fine' : value.band >= 0.3 ? 'large' : 'normal'} onChange={(v) => onChange({ ...value, band: v === 'fine' ? 0.12 : v === 'large' ? 0.34 : 0.22 })} options={[{ value: 'fine', label: 'Fine' }, { value: 'normal', label: 'Normale' }, { value: 'large', label: 'Large' }]} />
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
    <View accessible accessibilityLabel={`Niveau de confiance : ${label}`} style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="small" muted>Niveau de confiance</Text>
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
    <View accessible accessibilityLabel={`Lignes détectées : contrôle ${s.control ? 'oui' : 'non'}, test ${s.test ? 'oui' : 'non'}`}>
      <Row gap={1} style={{ height: 48, alignItems: 'flex-end' }}>
        {vals.map((v, i) => {
          const pos = (i + 0.5) / n;
          const isC = s.control && Math.abs(pos - s.control.position) < 0.03;
          const isT = s.test && Math.abs(pos - s.test.position) < 0.03;
          return <View key={i} style={{ flex: 1, height: Math.max(2, (v / max) * 48), borderRadius: 1, backgroundColor: isC ? t.colors.heart : isT ? t.colors.lavender : t.colors.border }} />;
        })}
      </Row>
      <Row style={{ justifyContent: 'space-between', marginTop: 2 }}>
        <Text variant="caption" muted>côté C</Text>
        <Text variant="caption" muted>côté T</Text>
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
      <Text variant="caption" muted weight="bold" style={{ letterSpacing: 1 }}>RÉSULTAT PROPOSÉ — À CONFIRMER</Text>
      <Text variant="heading" style={{ marginTop: 4 }} accessibilityRole="header">{OUTCOME_LABEL[analysis.outcome]}</Text>
      <View style={{ marginTop: spacing.sm }}><ConfidenceMeter value={analysis.confidence} /></View>
      {analysis.messages.map((m) => <Text key={m} variant="small" style={{ marginTop: spacing.xs }}>{m}</Text>)}
      {q || s ? (
        <View style={{ marginTop: spacing.sm, gap: 4 }}>
          <Text variant="label">Contrôles effectués sur le téléphone</Text>
          {q ? <Check ok={!q.issues.includes('too_dark') && !q.issues.includes('too_bright')} label={`Luminosité (${Math.round(q.windowBrightness ?? q.brightness)}/255)`} /> : null}
          {q ? <Check ok={!q.issues.includes('blurry')} label={`Netteté (indice ${q.sharpness.toFixed(2)}, minimum ${QUALITY_THRESHOLDS.blurry})`} /> : null}
          {s && q?.ok ? <Check ok={!!s.control} label="Ligne de contrôle" /> : null}
          {s && q?.ok && s.control ? <Check ok={s.test ? true : null} label={s.test ? `Ligne de test (intensité ${Math.round((s.ratio ?? 0) * 100)} % du contrôle)` : 'Ligne de test non détectée'} /> : null}
        </View>
      ) : null}
      {s && q?.ok ? <View style={{ marginTop: spacing.sm }}><LineProfile analysis={analysis} /></View> : null}
      <Banner tone={tone}>Ce résultat est une aide à la lecture, pas un diagnostic. Seule la notice du fabricant fait foi.</Banner>
    </Card>
  );
}

/** Choix de conservation : par défaut, rien n'est gardé. */
export function KeepPhotoChoice({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  if (!canKeepPhotos()) {
    return <Text variant="caption" muted>La photo sera supprimée après l’enregistrement. La conservation chiffrée des photos n’est disponible que dans l’application mobile connectée à votre compte.</Text>;
  }
  return (
    <View style={{ gap: 4 }}>
      <Toggle value={value} onChange={onChange} label="Garder la photo (chiffrée, visible uniquement par vous)" />
      <Text variant="caption" muted>{value
        ? 'La photo sera chiffrée sur ce téléphone avant d’être enregistrée dans votre espace privé. La clé reste sur ce téléphone : sans lui, la photo ne peut plus être ouverte.'
        : 'Par défaut, seul le résultat est gardé : la photo est supprimée juste après l’enregistrement.'}</Text>
    </View>
  );
}
