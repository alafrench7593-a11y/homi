/**
 * Live Activities iOS HOMI (27/11/2026) : écran verrouillé (bannière) et Dynamic Island (compacte, minimale, déployée)
 * pour six suivis en cours : allaitement, biberon, sieste, contractions, tire-lait, relais de nuit.
 *
 * Règles du moteur expo-widgets (vérifiées dans le vrai moteur par src/__tests__/liveRender.test.ts) :
 *  - la vue est compilée en chaîne ('widget') et évaluée dans l'extension : AUCUNE variable extérieure, tout vient des props ;
 *  - seuls les nœuds gérés par DynamicView.swift sont utilisés (Text, HStack, VStack, Spacer, Image, Circle) ; aucun « slot » ;
 *  - le temps avance seul (Text date/timer ou timerInterval) : aucune mise à jour en arrière-plan.
 * Une seule mise en page, six types d'activité : l'accent et les textes viennent des props (contrôleur src/live/model.ts).
 * Palette locale obligatoire (la vue n'a pas accès aux jetons du thème) : mêmes teintes que les widgets HOMI.
 */
import { Circle, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { activityBackgroundTint, cornerRadius, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, monospacedDigit, multilineTextAlignment, padding, privacySensitive, resizable } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';
import type { LiveProps } from './types';

const LiveView = (p: LiveProps, env: LiveActivityEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  // Accent par type : [clair, sombre]
  const A: Record<string, string[]> = {
    breast: ['#A8466F', '#F2A7C3'], bottle: ['#2A64A3', '#9CC7F2'], sleep: ['#5A4BB8', '#B4A8F0'],
    contractions: ['#A34A26', '#F4B48F'], pump: ['#1F7A66', '#8FD6C2'], relay: ['#7A5C14', '#E8C677'],
  };
  const pair = A[p.k] || A.sleep;
  const C = { bg: dark ? '#121320' : '#F6F4FB', text: dark ? '#F1EFFA' : '#1E1B2E', muted: dark ? '#ABA6C4' : '#59546E', accent: dark ? pair[1] : pair[0] };
  // Dynamic Island : fond toujours noir
  const I = { text: '#F1EFFA', muted: '#ABA6C4', accent: pair[1] };
  const now = Date.now();
  const over = p.end > 0 && (env.isStale || p.end <= now);
  const sens = (mods: unknown[]) => (p.sens ? [...mods, privacySensitive()] : mods);

  const clock = (mods: unknown[]) => {
    if (over) return <Text modifiers={mods as never}>{p.l.done}</Text>;
    if (p.end > 0) return <Text timerInterval={{ lower: new Date(Math.min(p.from, p.end)), upper: new Date(p.end) }} countsDown modifiers={mods as never} />;
    if (p.pause > 0) return <Text timerInterval={{ lower: new Date(p.from), upper: new Date(Math.max(p.pause, p.from) + 86400000) }} countsDown={false} pauseTime={new Date(Math.max(p.pause, p.from))} modifiers={mods as never} />;
    return <Text date={new Date(p.from)} dateStyle="timer" modifiers={mods as never} />;
  };
  const logo = (size: number) => (p.logo ? <Image uiImage={p.logo} modifiers={[resizable(), frame({ width: size, height: size }), cornerRadius(Math.round(size / 4))]} /> : <Circle modifiers={[foregroundStyle(I.accent), frame({ width: 10, height: 10 })]} />);
  const subText = env.isStale && !over ? p.l.stale : p.sub;

  const banner = (
    <HStack alignment="center" spacing={12} modifiers={[padding({ horizontal: 16, vertical: 14 }), activityBackgroundTint(C.bg)]}>
      <VStack alignment="leading" spacing={3}>
        <HStack spacing={6}>
          {logo(16)}
          <Text modifiers={sens([font({ textStyle: 'caption', weight: 'bold' }), foregroundStyle(C.accent), lineLimit(1)]) as never}>{p.title}</Text>
          {p.who ? <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(C.muted), lineLimit(1), privacySensitive()]}>{p.who}</Text> : null}
        </HStack>
        <Text modifiers={sens([font({ textStyle: 'headline', weight: 'semibold' }), foregroundStyle(C.text), lineLimit(1), minimumScaleFactor(0.8)]) as never}>{p.state}</Text>
        {subText ? <Text modifiers={sens([font({ textStyle: 'footnote' }), foregroundStyle(C.muted), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.8)]) as never}>{subText}</Text> : null}
      </VStack>
      <Spacer />
      {clock([font({ size: 34, weight: 'semibold', design: 'rounded' }), foregroundStyle(over ? C.muted : C.text), monospacedDigit(), multilineTextAlignment('trailing'), lineLimit(1), minimumScaleFactor(0.5), frame({ maxWidth: 140, alignment: 'trailing' })])}
    </HStack>
  );

  return {
    banner,
    compactLeading: (
      <HStack spacing={4} modifiers={[padding({ leading: 2 })]}>
        {logo(18)}
        {p.short ? <Text modifiers={[font({ textStyle: 'caption', weight: 'bold' }), foregroundStyle(I.accent), lineLimit(1)]}>{p.short}</Text> : null}
      </HStack>
    ),
    compactTrailing: clock([font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(I.accent), monospacedDigit(), multilineTextAlignment('trailing'), lineLimit(1), frame({ maxWidth: 56, alignment: 'trailing' })]),
    minimal: logo(18),
    expandedLeading: (
      <HStack spacing={6} modifiers={[padding({ leading: 6, top: 4 })]}>
        {logo(20)}
        <Text modifiers={sens([font({ textStyle: 'subheadline', weight: 'bold' }), foregroundStyle(I.accent), lineLimit(1)]) as never}>{p.title}</Text>
      </HStack>
    ),
    expandedTrailing: clock([font({ textStyle: 'title2', weight: 'semibold', design: 'rounded' }), foregroundStyle(over ? I.muted : I.text), monospacedDigit(), multilineTextAlignment('trailing'), lineLimit(1), minimumScaleFactor(0.6), frame({ maxWidth: 120, alignment: 'trailing' }), padding({ trailing: 6, top: 4 })]),
    expandedBottom: (
      <VStack alignment="leading" spacing={2} modifiers={[padding({ horizontal: 6, bottom: 4 })]}>
        <HStack spacing={6}>
          <Text modifiers={sens([font({ textStyle: 'headline' }), foregroundStyle(I.text), lineLimit(1), minimumScaleFactor(0.8)]) as never}>{p.state}</Text>
          {p.who ? <Text modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(I.muted), lineLimit(1), privacySensitive()]}>{p.who}</Text> : null}
          <Spacer />
        </HStack>
        {subText ? <Text modifiers={sens([font({ textStyle: 'footnote' }), foregroundStyle(I.muted), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.8)]) as never}>{subText}</Text> : null}
      </VStack>
    ),
  };
};

/** Nom natif de chaque type (rangé avec les props dans l'activité ; une mise en page enregistrée par type). */
export const LIVE_NAMES = {
  breast: 'HomiBreastLive', bottle: 'HomiBottleLive', sleep: 'HomiSleepLive',
  contractions: 'HomiContractionsLive', pump: 'HomiPumpLive', relay: 'HomiRelayLive',
} as const;

export const BreastLive = createLiveActivity<LiveProps>(LIVE_NAMES.breast, LiveView);
export const BottleLive = createLiveActivity<LiveProps>(LIVE_NAMES.bottle, LiveView);
export const SleepLive = createLiveActivity<LiveProps>(LIVE_NAMES.sleep, LiveView);
export const ContractionsLive = createLiveActivity<LiveProps>(LIVE_NAMES.contractions, LiveView);
export const PumpLive = createLiveActivity<LiveProps>(LIVE_NAMES.pump, LiveView);
export const RelayLive = createLiveActivity<LiveProps>(LIVE_NAMES.relay, LiveView);
