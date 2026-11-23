import type { reliability as fr } from '../fr/reliability';
import type { Messages } from '../types';

export const reliability: Messages<typeof fr> = {
  'rel.task.conflict': 'Otra persona del hogar modificó esta tarea mientras tanto. No se ha sobrescrito nada: se muestra la versión actual, revísala y vuelve a intentarlo.',
  'rel.task.notFound': 'Esta tarea ya no existe o ya no tienes acceso a ella.',
  'rel.queued': 'Guardado en este teléfono: se enviará automáticamente en cuanto vuelva la conexión.',
  'rel.signOut.pending': {
    one: '{count} registro aún no se ha enviado (sin red). Se enviará la próxima vez que inicies sesión en este teléfono con esta cuenta; se borrará si otra cuenta inicia sesión.',
    other: '{count} registros aún no se han enviado (sin red). Se enviarán la próxima vez que inicies sesión en este teléfono con esta cuenta; se borrarán si otra cuenta inicia sesión.',
  },
};
