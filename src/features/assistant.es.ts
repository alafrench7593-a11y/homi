/** Assistant — textes espagnols (questions suggérées, présentation), traduits depuis le français. */
import type { Journey } from '@/lib/types';

export const ASSISTANT_INTRO_ES =
  'Estás hablando con un asistente de inteligencia artificial especializado en información sobre salud y crianza. No sustituye a un médico, una matrona, un pediatra ni a los servicios de urgencias.';

export const SUGGESTIONS_BY_JOURNEY_ES: Record<Journey, { label: string; questions: string[] }> = {
  avoid: {
    label: 'Anticoncepción',
    questions: [
      '¿Cuáles son los distintos métodos anticonceptivos?',
      '¿Qué hacer si olvido tomar la píldora?',
      '¿Cómo funciona la anticoncepción de urgencia?',
      '¿Qué anticoncepción es posible después de un parto?',
    ],
  },
  cycle: {
    label: 'Mi ciclo',
    questions: [
      '¿Cuál es la duración habitual de un ciclo?',
      'Las reglas irregulares, ¿son frecuentes?',
      '¿Qué síntomas pueden acompañar a la regla?',
      '¿Cuándo consultar por reglas dolorosas?',
    ],
  },
  ttc: {
    label: 'Buscar un bebé',
    questions: [
      '¿Qué pruebas hacer antes de concebir?',
      '¿Por qué tomar ácido fólico antes de un embarazo?',
      '¿Cuánto tiempo se tarda de media en concebir?',
      '¿Cuándo consultar si el embarazo no llega?',
    ],
  },
  pregnant: {
    label: 'Embarazo',
    questions: [
      '¿Qué debo meter en la bolsa para la maternidad?',
      '¿Qué alimentos evitar durante el embarazo?',
      '¿Qué signos deben hacerme llamar a la maternidad?',
      '¿Cómo es el seguimiento de un embarazo gemelar?',
    ],
  },
  newborn: {
    label: 'Bebé',
    questions: [
      '¿Cómo saber si mi bebé come lo suficiente?',
      '¿Cómo acostar al bebé de forma segura?',
      'Mi bebé regurgita: ¿qué debo observar?',
      '¿Cuáles son las primeras citas de control del bebé?',
    ],
  },
  child: {
    label: 'Niño/a',
    questions: [
      '¿Cómo empezar la alimentación complementaria?',
      '¿Cuántas horas de sueño necesita un niño de 2 años?',
      '¿Qué información anotar antes de la cita con el pediatra?',
      '¿Cómo limitar las pantallas en los niños pequeños?',
    ],
  },
  family: {
    label: 'Familia',
    questions: [
      '¿Cómo preparar a mis hijos para la llegada del bebé?',
      '¿Cómo organizar las noches con gemelos?',
      '¿Cómo detectar el agotamiento parental?',
      '¿Para qué sirve la rehabilitación del suelo pélvico?',
    ],
  },
};
