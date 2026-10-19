/** Photo facultative de l'enfant (espace privé du foyer, lien signé temporaire) ou ses initiales. */
import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { initialsColor } from '@/components/Illustrations';
import { Text } from '@/components/ui';
import { backend } from '@/lib/backend';
import { initials } from '@/lib/domain/child';
import type { Child } from '@/lib/types';

export function ChildAvatar({ child, size = 40 }: { child: Pick<Child, 'id' | 'first_name' | 'photo_path'>; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (child.photo_path) backend.storage.signedUrl('avatars', child.photo_path, 600).then((u) => { if (alive) setUrl(u); }).catch(() => undefined);
    return () => { alive = false; };
  }, [child.photo_path]);
  if (url) return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityLabel={`Photo de ${child.first_name}`} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: initialsColor(child.id), alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no">
      <Text variant={size > 48 ? 'heading' : 'small'} weight="bold" color="#2B2433">{initials(child.first_name)}</Text>
    </View>
  );
}
