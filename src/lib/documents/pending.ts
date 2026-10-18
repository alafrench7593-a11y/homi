/**
 * Fichiers choisis sur l'écran Documents, transmis à l'écran d'enregistrement.
 * (Le sélecteur doit s'ouvrir sur un geste de l'utilisatrice : on le lance avant de changer d'écran.)
 * Rien n'est conservé : la liste est vidée dès qu'elle est lue.
 */
import type { PickedFile } from './io';

export type PendingImport = { kind: 'photos'; files: PickedFile[] } | { kind: 'files'; files: PickedFile[] };
let pending: PendingImport | null = null;
export const setPendingImport = (p: PendingImport | null) => { pending = p; };
export const takePendingImport = (): PendingImport | null => { const p = pending; pending = null; return p; };
