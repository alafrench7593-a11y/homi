/**
 * Boutons de la famille de commandes v3 (alias nommés du `Button` unique de ui.tsx — un seul moteur d'états) :
 *
 *  - `PrimaryButton`   : verre TEINTÉ de la palette (dégradé + reflet haut), reflet fin sur l'arête, libellé
 *                        contrasté (≥ 4,5:1 testé). Pression : s'enfonce (0,98) et le reflet traverse brièvement.
 *                        Enregistrement (promesse ou `loading`) : indicateur à la place du libellé, LARGEUR STABLE,
 *                        appuis suivants ignorés (pas de double soumission). Succès : respiration ; erreur : léger
 *                        tremblement + message. Désactivé : fondu.
 *  - `SecondaryButton` : verre fumé / givré, reflet discret, lisible en clair et en sombre.
 *  - `SensitiveButton` : action sensible (supprimer, quitter le foyer…) : libellé explicite, couleur sémantique
 *                        (erreur), confirmation avant d'agir (`confirm`, sauf `confirm={false}`), mouvement sobre
 *                        (aucun reflet, aucun rebond décoratif).
 */
import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Button } from '../ui';
import { confirm as confirmDialog } from '../Overlays';

type ButtonProps = React.ComponentProps<typeof Button>;

export function PrimaryButton(p: Omit<ButtonProps, 'variant'>) {
  return <Button {...p} variant="primary" />;
}

export function SecondaryButton(p: Omit<ButtonProps, 'variant'>) {
  return <Button {...p} variant="secondary" />;
}

export function SensitiveButton({ onPress, confirm = true, confirmTitle, confirmMessage, confirmLabel, ...p }: Omit<ButtonProps, 'variant' | 'onPress'> & {
  onPress: (e?: GestureResponderEvent) => unknown;
  /** Demander confirmation avant d'agir (défaut : oui) */
  confirm?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  confirmLabel?: string;
}) {
  return (
    <Button
      {...p}
      variant="danger"
      onPress={async (e) => {
        if (confirm) {
          const ok = await confirmDialog(confirmTitle ?? p.label, confirmMessage ?? '', confirmLabel ?? p.label, true);
          if (!ok) return;
        }
        await onPress(e);
      }}
    />
  );
}
