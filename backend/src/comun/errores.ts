// Catálogo de los mensajes de error que devuelve la API, cada uno con un
// código estable. Las excepciones se siguen lanzando con el texto en
// castellano (se lee bien en logs y al probar con curl) y FiltroErrores añade
// el código a la respuesta, para que el frontend lo traduzca al idioma de la
// interfaz ("error.<CODIGO>" en frontend/src/idiomas).
//
// Al añadir un mensaje nuevo en un throw o en un DTO hay que añadirlo aquí
// (errores.spec.ts falla si no) y traducirlo en los 6 idiomas del frontend.
export const MENSAJES_ERROR = {
  // Autenticación y cuenta
  CORREO_O_CONTRASENA_INCORRECTOS: 'Correo o contraseña incorrectos',
  CONTRASENA_INCORRECTA: 'La contraseña no es correcta',
  USUARIO_YA_EXISTE: 'Ya existe un usuario con ese correo',
  USUARIO_NO_ENCONTRADO: 'Usuario no encontrado',
  CORREO_NO_VALIDO: 'El correo electrónico no es válido',
  CONTRASENA_CORTA: 'La contraseña debe tener al menos 8 caracteres',
  CONTRASENA_DEBIL: 'La contraseña debe incluir mayúsculas, minúsculas y números',
  FECHA_NACIMIENTO_NO_VALIDA: 'La fecha de nacimiento no es válida',
  FALTA_CORREO_TUTOR: 'Se necesita el correo de un tutor legal para menores de 18 años',
  CONSENTIMIENTO_PENDIENTE: 'Cuenta pendiente de confirmación de un tutor legal',
  ENLACE_CONFIRMACION_NO_VALIDO: 'Enlace de confirmación caducado o inválido',
  SIN_CORREO_TUTOR: 'Esta cuenta no tiene un correo de tutor registrado',
  ESPERA_REENVIO_CORREO: 'Espera unos minutos antes de volver a pedir el correo',
  ENLACE_VERIFICACION_NO_VALIDO: 'Enlace de verificación caducado o inválido',
  CORREO_NO_CONFIGURADO: 'El envío de correo no está configurado en el servidor',

  // Tareas, objetivos, notas y etiquetas
  TAREA_NO_ENCONTRADA: 'Tarea no encontrada',
  SUBTAREA_NO_ENCONTRADA: 'Subtarea no encontrada',
  OBJETIVO_NO_ENCONTRADO: 'Objetivo no encontrado',
  NOTA_NO_ENCONTRADA: 'Nota no encontrada',
  TODO_SIEMPRE_CON_CASILLA: 'Un to-do siempre tiene casilla',
  ETIQUETA_NO_ENCONTRADA: 'Etiqueta no encontrada',
  ETIQUETA_YA_EXISTE: 'Ya tienes una etiqueta con ese nombre',
  ETIQUETA_DENTRO_DE_SI_MISMA: 'Una etiqueta no puede ir dentro de sí misma',

  // Horario y asignaturas
  HORARIO_NO_ENCONTRADO: 'Horario no encontrado',
  CURSO_NO_ENCONTRADO: 'Curso no encontrado',
  ASIGNATURA_NO_ENCONTRADA: 'Asignatura no encontrada',
  ASIGNATURA_NO_ESTA_EN_HORARIO: 'Asignatura no encontrada en este horario',
  ASIGNATURA_NO_ESTA_EN_TUS_HORARIOS: 'Asignatura no encontrada en tus horarios',
  ASIGNATURA_NO_ES_DEL_CURSO: 'Asignatura no encontrada para el curso de este horario',
  ASIGNATURA_FUERA_DEL_HORARIO: 'Esa asignatura no está en este horario',
  ASIGNATURA_YA_EN_HORARIO: 'Esa asignatura ya está en el horario',
  SOLO_BORRAR_ASIGNATURAS_PROPIAS: 'Solo se pueden borrar las asignaturas añadidas por ti',
  FRANJA_NO_ENCONTRADA: 'Franja no encontrada en este horario',
  FRANJA_DE_OTRO_HORARIO: 'Una de las franjas no pertenece a este horario',
  CLASE_EN_DESCANSO: 'En una franja de descanso no se pueden poner clases',

  // Recordatorios y calendario escolar
  RECORDATORIO_NO_ENCONTRADO: 'Recordatorio no encontrado',
  AVISO_NO_ENCONTRADO: 'Aviso no encontrado',
  DIA_NO_LECTIVO_NO_ENCONTRADO: 'Día no lectivo no encontrado',
  FECHA_FIN_ANTERIOR: 'La fecha de fin no puede ser anterior a la de inicio',

  // Familia
  CODIGO_VINCULO_NO_VALIDO: 'El código no es válido o ha caducado',
  VINCULO_CON_UNO_MISMO: 'No puedes vincularte con tu propia cuenta',
  YA_VINCULADOS: 'Ya estáis vinculados',
  CODIGO_NO_GENERADO: 'No se pudo generar un código, inténtalo de nuevo',
  VINCULO_NO_ENCONTRADO: 'Vínculo no encontrado',
  PERSONA_NO_VINCULADA: 'Esa persona no está vinculada contigo',
  REVISION_NO_PENDIENTE: 'Esta tarea no está pendiente de revisión',
  SOLO_ADULTO_AUTORIZA: 'Solo una persona adulta puede autorizar la cuenta de un menor',

  // Asistente de IA (Anthropic, u Ollama en local) y planes
  IA_NO_DISPONIBLE: 'La IA no está disponible ahora mismo',
  PLAN_SIN_IA: 'La ayuda de la IA está incluida en el plan Plus',
  IA_DESACTIVADA_POR_FAMILIA: 'Tu familia ha desactivado la ayuda de la IA',
  LIMITE_IA_ALCANZADO: 'Has llegado al límite de usos de la IA de este mes',
  FOTO_NO_VALIDA: 'Sube una foto (JPG, PNG o WEBP) de menos de 5 MB',
  IA_RESPUESTA_NO_VALIDA: 'La IA no ha dado una propuesta válida, inténtalo de nuevo',
  TAREA_SIN_FECHA_LIMITE: 'Ponle una fecha límite a la tarea para poder planificar el estudio',
  PLAN_SIN_DIAS: 'No quedan días para estudiar antes de la fecha límite',
  CONSEJO_NO_VALIDO: 'Ese consejo no existe',

  // Pagos (Stripe)
  PAGOS_NO_CONFIGURADOS: 'Los pagos no están configurados en el servidor',
  SOLO_ADULTOS_PUEDEN_PAGAR: 'Solo una persona adulta puede contratar el plan Plus',
  VERIFICA_CORREO_PARA_PAGAR: 'Verifica tu correo antes de contratar el plan Plus',
  YA_TIENE_PLUS: 'Ya tienes el plan Plus',
  SIN_SUSCRIPCION: 'No tienes ninguna suscripción',
  FIRMA_WEBHOOK_NO_VALIDA: 'La firma del aviso de Stripe no es válida',
  NO_SE_PUDO_CANCELAR_SUSCRIPCION: 'No se ha podido cancelar tu suscripción; inténtalo de nuevo o escríbenos',

  // Google Calendar
  GOOGLE_NO_CONFIGURADO: 'La sincronización con Google Calendar no está configurada en el servidor',
  GOOGLE_NO_CONECTADO: 'Esta cuenta no está conectada con Google Calendar',
  ENLACE_GOOGLE_NO_VALIDO: 'Enlace de conexión con Google caducado o inválido',
  CLASSROOM_NO_CONECTADO: 'Conecta Google Classroom para importar tus deberes',
  CLASSROOM_API_DESACTIVADA: 'La API de Google Classroom no está activada en el proyecto de Google Cloud',
  CLASSROOM_SIN_PERMISO: 'Google no permite que FocusFlow lea tu Classroom (puede que tu centro lo tenga restringido)',
} as const;

export type CodigoError = keyof typeof MENSAJES_ERROR;

const CODIGO_POR_MENSAJE = new Map<string, CodigoError>(
  Object.entries(MENSAJES_ERROR).map(([codigo, mensaje]) => [mensaje, codigo as CodigoError]),
);

// Errores que no lanza el código propio sino Nest/Passport, por estado HTTP.
const CODIGO_POR_ESTADO: Record<number, string> = {
  401: 'NO_AUTENTICADO',
  403: 'SIN_PERMISO',
  404: 'NO_ENCONTRADO',
};

export function codigoDeMensaje(mensaje: string): CodigoError | null {
  return CODIGO_POR_MENSAJE.get(mensaje) ?? null;
}

export function codigoPorEstado(estado: number): string | null {
  return CODIGO_POR_ESTADO[estado] ?? null;
}
