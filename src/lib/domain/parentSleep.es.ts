/** « Mon sommeil » — versión en español de los consejos (misma forma que la francesa). */
import type { SleepTip } from './parentSleep';

export const POSTPARTUM_TIPS_ES: SleepTip[] = [
  { key: 'sieste-bebe', icon: 'moon', title: 'Dormir cuando el bebé duerme, cuando sea posible', text: 'Tumbarte durante una siesta del bebé cuenta, aunque sean 20 minutos. La ropa y los platos pueden esperar.' },
  { key: 'relais', icon: 'users', title: 'Pedir relevo por la noche', text: 'Compartir las noches con el otro progenitor o con alguien cercano (cambio, mecer, biberón) permite a cada uno tener un bloque de sueño más largo.' },
  { key: 'aide', icon: 'gift', title: 'Aceptar la ayuda que te ofrecen', text: 'Una comida que te traen, un recado, una hora de cuidado: aceptar también es cuidar de tu familia.' },
];

export const GENERAL_TIPS_ES: SleepTip[] = [
  { key: 'ecrans', icon: 'smartphone', title: 'Limitar las pantallas por la noche', text: 'Si puedes, deja el teléfono un rato antes de dormir y baja el brillo. El modo noche de la aplicación está pensado para los despertares.' },
  { key: 'rituel', icon: 'feather', title: 'Un pequeño ritual de noche', text: 'Luz suave, una bebida caliente sin cafeína, algunas respiraciones lentas: una referencia sencilla a veces ayuda a soltar.' },
  { key: 'cafeine', icon: 'coffee', title: 'La cafeína, mejor por la mañana', text: 'Café, té, refrescos: dejarlos para el principio del día puede facilitar conciliar el sueño.' },
];
