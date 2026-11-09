/** Offre Premium — textes affichés en espagnol (traduits depuis le français). Aucun produit, prix, quota ni droit ici : uniquement les libellés. */
import type { FeatureInfo, PremiumFeature } from './features';

export type FeatureText = Omit<FeatureInfo, 'icon'>;

export const FEATURE_TEXT_ES: Record<PremiumFeature, FeatureText> = {
  sleep_insights: { title: 'Descubre el ritmo personalizado de {name}', benefit: 'Después de cada despertar: próxima siesta, rutina y hora de dormir estimadas según su edad y luego según sus propios registros, recalculadas en tiempo real, con notificaciones suaves y tendencias de 7 días.', free: 'Anotar siestas, noches, despertares y tomas nocturnas; modificar los horarios; totales del día; ayuda para la noche; sueño seguro', premium: 'Estimaciones personalizadas, recálculo, notificaciones, valoraciones «justo / demasiado pronto / demasiado tarde», medias y evolución' },
  bedtime_routine: { title: 'Una rutina para la hora de dormir de {name}', benefit: 'Los pasos de vuestra noche, en vuestro orden, con un recordatorio opcional a la hora que elijas.', free: '—', premium: 'Rutina personalizable y recordatorio' },
  assistant_more: { title: 'Hazle todas tus preguntas al asistente', benefit: 'Muchas más preguntas cada mes, adaptadas a tu etapa y al perfil mostrado.', free: 'Algunas preguntas al mes', premium: 'Muchas más preguntas' },
  assistant_saved: { title: 'Guarda las respuestas útiles', benefit: 'Guarda una respuesta para encontrarla en un instante.', free: 'Volver a leer las respuestas ya guardadas', premium: 'Guardar nuevas respuestas' },
  assistant_suggestions: { title: 'Preguntas sugeridas para {name}', benefit: 'Ideas de preguntas según la semana de embarazo o la edad exacta del niño.', free: 'Sugerencias generales', premium: 'Sugerencias personalizadas' },
  scanner_more: { title: 'Analiza todos tus productos', benefit: 'Análisis ampliados cada mes, adaptados al perfil elegido.', free: 'Algunos análisis al mes; alertas oficiales de retirada siempre ilimitadas', premium: 'Análisis ampliados' },
  scanner_compare: { title: 'Compara estos productos', benefit: 'Composición, alérgenos y precauciones lado a lado, sin una nota opaca.', free: '—', premium: 'Comparación y filtros por perfil' },
  coparent_invite: { title: 'Comparte la información con el otro progenitor', benefit: 'Invitación segura, elección de los perfiles compartidos, lectura o edición, sincronización sin duplicados, revocación inmediata.', free: 'Quitar a un miembro y salir de un hogar en cualquier momento', premium: 'Invitar y compartir por perfil' },
  voice_entry: { title: 'Registra fácilmente con tu voz', benefit: '«Lina ha bebido 150 ml a las 13:10»: la frase se convierte en un registro, que tú confirmas.', free: 'Algunas pruebas al mes', premium: 'Entrada por voz ilimitada en la práctica' },
  summaries: { title: 'Genera el resumen completo de {name}', benefit: 'Comidas, sueño, pañales, síntomas anotados, tratamientos prescritos, medidas: los hechos registrados, sin interpretación.', free: 'Resumen del día', premium: 'Resúmenes de la semana y antes de las citas' },
  summary_export: { title: 'Exportar o compartir el resumen', benefit: 'Un PDF claro para enseñárselo al profesional sanitario.', free: '1 exportación al mes', premium: 'Exportaciones frecuentes' },
  weekly_menu: { title: 'Prepara los menús de toda la semana', benefit: 'Un menú adaptado a cada perfil, con la lista de la compra hecha automáticamente.', free: 'Biblioteca de recetas, favoritos, filtros, compra de una receta', premium: 'Menús semanales y lista de la compra automática' },
  cycle_insights: { title: 'Comprende tus ciclos', benefit: 'Estadísticas claras y tendencias de todo tu historial (siempre estimaciones).', free: 'Calendario, registros, estimaciones básicas', premium: 'Estadísticas y tendencias' },
  cycle_trends: { title: 'Detecta lo que se repite en tu ciclo', benefit: 'Las tendencias observadas en tus propios datos (tras varios ciclos comparables) y, si lo deseas, un mensaje antes de un periodo en el que sueles anotar un síntoma. Nunca una certeza.', free: 'Calendario, menstruación, estimación sencilla, síntomas esenciales, información general y de seguridad', premium: 'Tendencias personales y anticipación' },
  cycle_custom: { title: 'Personaliza el seguimiento de tu ciclo', benefit: 'Tus propios elementos para seguir y tantas etiquetas como quieras.', free: '3 etiquetas diferentes', premium: 'Elementos personalizados y etiquetas ilimitadas' },
  cycle_share: { title: 'Comparte tu ciclo con tu pareja', benefit: 'Tú eliges qué compartir (menstruación, ventana fértil estimada, estado de ánimo, síntomas) con un miembro de tu hogar, solo en lectura; nunca las relaciones sexuales, la anticoncepción ni tus notas. Revocable en cualquier momento.', free: 'No se comparte nada', premium: 'Uso compartido elegido y revocable' },
  cycle_monthly: { title: 'El resumen de tu mes', benefit: 'Menstruación, duración del ciclo, síntomas y estados de ánimo más anotados del mes, en un PDF para guardar o enseñar a tu profesional. Hechos anotados, nunca un diagnóstico.', free: 'Calendario y ficha de cada día', premium: 'Resumen mensual y PDF' },
  cycle_export: { title: 'Exporta el seguimiento de tu ciclo', benefit: 'Un PDF para compartir con tu profesional sanitario.', free: '—', premium: 'Exportación en PDF' },
  family_summary: { title: 'El resumen familiar del día', benefit: 'Cada niño, sus comidas, su sueño y sus citas, sin mezclar nada.', free: 'Vista general de los perfiles', premium: 'Resumen familiar diario' },
  more_children: { title: 'Sigue a más niños', benefit: 'Más perfiles, cada uno con sus propios datos.', free: 'Hasta 3 niños', premium: 'Perfiles ampliados' },
  more_reminders: { title: 'Recordatorios personales sin límite', benefit: 'Recordatorios totalmente configurables: modificar, aplazar, desactivar.', free: '5 recordatorios personales; medicamentos prescritos, biberones y vacunas siempre ilimitados', premium: 'Recordatorios personales ampliados' },
  more_documents: { title: 'Un archivo de documentos ampliado', benefit: 'Ecografías, recetas, informes: todo en el mismo sitio.', free: 'Archivo limitado', premium: 'Archivo ampliado' },
  more_lists: { title: 'Listas de preparación ilimitadas', benefit: 'Bolsa para la maternidad, papeles, habitación…', free: 'Algunas listas', premium: 'Listas ampliadas' },
  premium_content: { title: 'Guías en profundidad', benefit: 'Series y guías adaptadas a la edad exacta o a la semana de embarazo.', free: 'Toda la información de seguridad', premium: 'Guías en profundidad' },
  growth_export: { title: 'Exportar las medidas', benefit: 'Un archivo con las medidas de crecimiento para compartir.', free: '—', premium: 'Exportación de las medidas' },
  diversification: { title: 'Todos los descubrimientos de {name}', benefit: 'El catálogo completo de alimentos, las recetas que usan lo que ya ha probado, ideas adaptadas a su edad, filtros avanzados y todo el historial.', free: 'Hasta 15 alimentos seguidos por niño, los alimentos esenciales de cada categoría, los alérgenos, la información de seguridad y el historial de los últimos 30 días', premium: 'Catálogo completo, recetas asociadas, ideas personalizadas, filtros avanzados, historial completo' },
  development_full: { title: 'Sigue todas las etapas de {name}', benefit: 'Todas las etapas de cada franja de edad, con una actividad adaptada para cada una, y un resumen en PDF para enseñar al profesional.', free: 'Las etapas principales, los consejos de seguridad, las fuentes y el resumen en pantalla', premium: 'Seguimiento completo, actividades adaptadas a la edad, resumen en PDF' },
  community_profile: { title: 'Personaliza tu perfil en la comunidad', benefit: 'Un color, un banner, una presentación más larga y una insignia Premium discreta si lo deseas.', free: 'Seudónimo, nombre de usuario, avatar o foto, presentación breve, etapa', premium: 'Color, banner, presentación ampliada, insignia opcional' },
  community_groups: { title: 'Crea tu grupo privado de madres y padres', benefit: 'Un espacio solo para vosotros, por invitación: las publicaciones no son visibles para el resto de la comunidad.', free: 'Unirte a los grupos temáticos, a los grupos por mes y a los grupos privados a los que te inviten', premium: 'Crear grupos privados e invitar a miembros' },
  community_albums: { title: 'Álbumes de fotos para compartir', benefit: 'Álbumes privados, o compartidos solo con los miembros que elijas. Fotos sin su ubicación GPS.', free: 'Ver los álbumes que comparten contigo; hasta 4 fotos por publicación', premium: 'Crear álbumes y compartirlos' },
  community_search: { title: 'Filtros y búsqueda avanzados', benefit: 'Varias categorías a la vez, encuestas, publicaciones con fotos, sin respuesta, de un miembro, de un periodo.', free: 'Búsqueda por palabras clave y por categoría, secciones «Para ti», «Suscripciones» y «Reciente»', premium: 'Filtros combinados y búsqueda avanzada' },
  community_history: { title: 'Tu registro de actividad', benefit: 'La cronología de tus publicaciones, respuestas, reacciones y elementos guardados.', free: 'Tus publicaciones, respuestas y publicaciones que te gustan o has guardado siguen disponibles', premium: 'Cronología completa y filtrable' },
  saved_folders: { title: 'Ordena lo que guardas', benefit: 'Carpetas para encontrar en un instante las conversaciones útiles («Sueño», «Bolsa de maternidad»…).', free: 'Guardar sin límite', premium: 'Carpetas' },
  community_ai: { title: 'Resumir una conversación larga', benefit: 'Lo esencial de una conversación de más de 6 respuestas, presentado como testimonios. Traducción de un mensaje si hace falta.', free: 'Leer todas las respuestas', premium: 'Resumen y traducción (servicio de IA que se configura en el servidor)' },
  community_events: { title: 'Talleres y encuentros', benefit: 'Talleres y encuentros por videollamada reservados a las personas suscritas, cuando el equipo los programa.', free: 'Toda la comunidad y la información de seguridad', premium: 'Inscripción a los talleres' },
};

export const ALWAYS_FREE_ES = [
  'Información y números de emergencia',
  'Recursos sobre la depresión posparto',
  'Alertas oficiales de retirada de productos',
  'Eliminación de la cuenta y exportación legal de tus datos',
  'Gestión de los consentimientos',
  'Denuncia y bloqueo en la comunidad',
  'Acceso a todos los datos que ya has creado, incluso después de que termine una suscripción',
  'Tu perfil y tus ajustes',
  'Dar tu opinión sobre la aplicación',
];
