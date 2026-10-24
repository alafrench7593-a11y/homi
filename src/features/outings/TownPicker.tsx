/**
 * Choix de la zone : ville ou code postal (géocodage public de l'IGN, sans clé), ou position du moment facultative,
 * arrondie à ~1 km et gardée en mémoire seulement. Jamais d'adresse personnelle recherchée.
 */
import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import * as Location from 'expo-location';
import { useToast } from '@/components/Overlays';
import { Button, Chip, Field, Row, Text } from '@/components/ui';
import { useTownSearch } from '@/lib/data/hooks-discoveries';
import { coarse, validTownQuery } from '@/lib/domain/nearby';
import { useUiStore } from '@/lib/store';
import { t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

export function TownPicker({ onHere, compact }: { onHere: (p: { lat: number; lon: number } | null) => void; compact?: boolean }) {
  const toast = useToast();
  const town = useUiStore((s) => s.nearbyTown);
  const setTown = useUiStore((s) => s.setNearbyTown);
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [locating, setLocating] = useState(false);
  const towns = useTownSearch(submitted);
  function search() {
    if (!validTownQuery(q)) return toast(tr('nb.invalidTown'), 'info');
    onHere(null);
    setSubmitted(q.trim());
  }
  async function locate() {
    setLocating(true);
    try {
      let pos: { lat: number; lon: number } | null = null;
      if (Platform.OS === 'web') {
        pos = await new Promise((res) => {
          if (!('geolocation' in navigator)) return res(null);
          navigator.geolocation.getCurrentPosition((g) => res({ lat: g.coords.latitude, lon: g.coords.longitude }), () => res(null), { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
        });
      } else {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.granted) { const g = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }); pos = { lat: g.coords.latitude, lon: g.coords.longitude }; }
      }
      if (!pos) return toast(tr('nb.locationRefused'), 'info');
      onHere(coarse(pos)); // arrondie à ~1 km, jamais enregistrée
    } finally { setLocating(false); }
  }
  return (
    <View style={{ gap: spacing.sm }}>
      <Field label={tr('nb.where')} value={q} onChangeText={setQ} placeholder={tr('nb.wherePh')} returnKeyType="search" onSubmitEditing={search} testID="out-town" />
      <Row wrap>
        <Button label={tr('nb.search')} icon="search" size="sm" onPress={search} testID="out-search" />
        <Button label={tr('nb.useLocation')} icon="navigation" size="sm" variant="ghost" loading={locating} onPress={locate} testID="out-locate" />
      </Row>
      {compact ? null : <Text variant="caption" muted>{tr('nb.locationHint')}</Text>}
      {submitted && towns.isFetching ? <Text variant="small" muted>{tr('nb.loading')}</Text> : null}
      {submitted && towns.isError ? <Text variant="small" muted testID="out-town-error">{tr('nb.serviceError')}</Text> : null}
      {submitted && towns.data ? (
        towns.data.length ? (
          <Row wrap testID="out-towns">
            {towns.data.map((x) => <Chip key={`${x.label}-${x.lat}`} label={x.postcode ? `${x.city} (${x.postcode})` : x.label} selected={town?.label === x.label} onPress={() => { setTown({ label: x.label, lat: x.lat, lon: x.lon }); onHere(null); setSubmitted(''); setQ(''); }} testID={`out-townpick-${x.postcode ?? x.city}`} />)}
          </Row>
        ) : <Text variant="small" muted>{tr('nb.townNotFound')}</Text>
      ) : null}
    </View>
  );
}
