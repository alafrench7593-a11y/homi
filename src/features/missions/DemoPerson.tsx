/**
 * Démonstration seulement : « vous êtes … / voir comme … » pour essayer les deux côtés d'une mission sur un seul
 * appareil (la démonstration n'a qu'un compte). Rien de tel n'existe avec un vrai compte : chacun répond depuis le sien.
 */
import React from 'react';
import { isDemo } from '@/lib/backend';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useDemoSwitchPerson } from '@/lib/data/hooks-missions';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Text } from '@/components/ui';
import { t as tr } from '@/i18n';

export function DemoPerson() {
  const { people, me } = usePeople();
  const sw = useDemoSwitchPerson();
  const toast = useToast();
  if (!isDemo || !me) return null;
  const self = people.find((p) => p.id === me);
  const other = people.find((p) => p.id !== me);
  const myRole = self ? tr(self.role === 'owner' ? 'u7.role.owner' : self.role === 'coparent' ? 'u7.role.coparent' : 'u7.role.caregiver') : '';
  const otherLabel = other ? (other.role === 'owner' ? tr('u7.role.owner') : other.role === 'coparent' ? tr('u7.role.coparent') : tr('u7.role.caregiver')) : tr('mis.demo.partner');
  return (
    <Banner tone="demo" icon="users" title={tr('mis.demo.as', { person: myRole })}
      action={<Button label={tr('mis.demo.switch', { person: otherLabel })} size="sm" variant="secondary" icon="repeat" loading={sw.isPending} testID="mission-demo-switch"
        style={{ marginTop: 8, alignSelf: 'flex-start' }}
        onPress={() => sw.mutateAsync(other?.id).catch((e) => toast(friendlyError(e), 'error'))} />}>
      <Text variant="small">{tr('mis.demo.hint')}</Text>
    </Banner>
  );
}
