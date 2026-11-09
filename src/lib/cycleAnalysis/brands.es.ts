/** Textos en español de las reglas de lectura (mismos identificadores y mismo orden que el francés). */
import type { RuleTexts } from './brands';

export const ES_TEXTS: RuleTexts = {
  'clearblue-detection-precoce': {
    model: 'Détection Précoce (líneas)',
    readingRules: [
      'Espera los 3 minutos completos y lee el resultado como máximo 10 minutos después de la prueba.',
      'Línea en la ventana de control + línea en la ventana de resultado: positivo, sea cual sea la intensidad.',
      'Solo la línea de control: negativo.',
      'Ninguna línea en la ventana de control: prueba no válida, hay que repetirla.',
    ],
    source: { title: 'Prospecto Clearblue Détection Précoce (francés)' },
  },
  'first-response-early-result': {
    model: 'Early Result (líneas)',
    readingRules: [
      'Espera 3 minutos; no leas un resultado negativo después de 10 minutos.',
      'Dos líneas rosas: positivo (una línea puede ser más clara que la otra).',
      'Una sola línea rosa: negativo.',
      'Ninguna línea rosa a los 3 minutos: prueba no válida.',
    ],
    source: { title: 'Prospecto First Response Early Result', note: 'Prospecto norteamericano: comprueba el prospecto de la caja comprada en Francia.' },
  },
  'clearblue-detection-rapide': {
    model: 'Détection Rapide (signo + / −)',
    readingRules: [
      'Espera 3 minutos (puede aparecer «Enceinte» desde el primer minuto) y lee el resultado como máximo 10 minutos después de la prueba.',
      'Línea azul en la ventana de control + signo «+»: positivo, aunque un trazo del «+» sea más pálido.',
      'Línea azul en la ventana de control + signo «−»: negativo.',
      'Ninguna línea azul en la ventana de control: prueba no válida.',
    ],
    options: {
      plus: 'Línea de control + signo «+»',
      minus: 'Línea de control + signo «−»',
      no_control: 'Ninguna línea en la ventana de control',
      unsure: 'No estoy segura',
    },
    source: { title: 'Prospecto Clearblue Détection Rapide (francés)', note: 'Eres tú quien lee el signo: el análisis automático de las cruces no está disponible.' },
  },
  'clearblue-ultra-precoce-digital': {
    model: 'Détection Ultra Précoce Digital',
    readingRules: [
      'El resultado aparece después del indicador de progreso (de 1 a 5 minutos).',
      '«Enceinte»: positivo. «Pas Enceinte»: negativo.',
      'Un símbolo «!» o un mensaje de error: la prueba no ha funcionado.',
    ],
    options: {
      pregnant: 'La pantalla muestra «Enceinte»',
      not_pregnant: 'La pantalla muestra «Pas Enceinte»',
      error: 'Símbolo «!» o mensaje de error',
      unsure: 'No consigo leer la pantalla',
    },
    source: { title: 'Prospecto Clearblue Détection Ultra Précoce Digital (francés)' },
  },
  'one-step-lh-strip': {
    model: 'Tira de LH (Co-Innovation Biotech)',
    readingRules: [
      'Lee el resultado a los 5 minutos; no lo leas después.',
      'Dos líneas, con la línea de prueba igual de oscura o más oscura que la línea de control: pico de LH.',
      'Solo la línea de control, o una línea de prueba más clara: sin pico de LH.',
      'Ninguna línea, o solo la línea de prueba: prueba no válida.',
    ],
    source: { title: 'Prospecto One Step LH Test Strip (UE)' },
  },
  'clearblue-ovulation-digital': {
    model: 'Test de ovulación Digital (smiley)',
    readingRules: [
      'Aparece un smiley cuando se detecta el pico de LH.',
      'Consulta el prospecto de la caja para el tiempo de aparición y los demás símbolos.',
    ],
    options: {
      smiley: 'Aparece un smiley',
      no_smiley: 'No hay smiley',
      error: 'Símbolo o mensaje de error',
      unsure: 'No estoy segura',
    },
    source: { title: 'Ficha de producto Clearblue Test de ovulación Digital', note: 'La fuente consultada solo confirma el smiley: el símbolo no puede leerse por reconocimiento de texto, así que lo lees tú.' },
  },
};
