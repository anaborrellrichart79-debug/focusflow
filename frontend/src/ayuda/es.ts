import type { TextosAyuda } from './tipos';

// Versión de referencia: las demás son traducciones de esta.
export const es: TextosAyuda = {
  temas: {
    primerosPasos: {
      titulo: 'Primeros pasos',
      resumen: 'FocusFlow junta en un sitio tus tareas, tu agenda y tu tiempo de concentración.',
      pasos: [
        'Al crear la cuenta, un asistente te pregunta para qué la vas a usar (estudiar, trabajar, organizar a la familia) y el Inicio se adapta a eso. Puedes cambiarlo cuando quieras en Ajustes.',
        'Apunta cualquier cosa en cuanto te venga a la cabeza en la barra de abajo, «¿Qué tienes en mente?», y pulsa Intro: queda guardada como tarea por hacer. Ya la ordenarás después.',
        'Pulsa Ctrl + K (o la lupa) para buscar cualquier tarea, nota u objetivo desde cualquier pantalla.',
        'El selector de arriba del menú (Todo, Personal, Escolar, Eventual) deja ver solo un ámbito, para no mezclar el instituto con lo demás.',
        'En el Inicio tienes lo más importante del día: prioridades, lo que vence en los próximos 7 días, tus clases y tus pomodoros.',
      ],
      consejo: 'En cada pantalla, el botón «?» de abajo a la derecha abre la ayuda de esa pantalla.',
    },
    tareas: {
      titulo: 'Organizar tus tareas',
      resumen: 'Varias formas de ver las mismas tareas: elige la que mejor te funcione en cada momento.',
      pasos: [
        'Kanban: cada columna es un estado (Por hacer, En progreso, Bajo control, Pospuesta, Hecha y Archivada). Arrastra las tarjetas de una columna a otra o usa las flechas ← →.',
        'Matriz de Eisenhower: marca cada tarea como Urgente, Importante o las dos, y se coloca sola en Hacer ya, Planificar, Delegar o Eliminar.',
        'La estrella ★ marca una tarea como de alto impacto (el 20 % que da el 80 % del resultado, principio de Pareto).',
        'Pulsa una tarea para abrir su ficha: fecha y hora límite, notas, si se repite, tiempo estimado, etiquetas y subtareas.',
        'Objetivos agrupa las tareas de una meta más grande; Notas y To-Do guarda apuntes y listas cortas; Etiquetas las organiza en categorías de hasta 3 niveles.',
      ],
    },
    agenda: {
      titulo: 'Agenda',
      resumen: 'Tus tareas con fecha y tus clases, en vista de día, semana o mes.',
      pasos: [
        'Cambia de vista con Día, Semana y Mes, y muévete con las flechas o vuelve a Hoy.',
        'Salen las tareas con fecha límite, los deberes y las sesiones de estudio, y, con el modo escolar, las clases de tu horario con su color.',
        'Si conectas Google Calendar en Ajustes, tus eventos y tus tareas se sincronizan en las dos direcciones.',
      ],
    },
    horario: {
      titulo: 'Horario de clase',
      resumen: 'Tu horario semanal, que luego usan la Agenda, los deberes y los avisos de vacaciones.',
      pasos: [
        'Para activarlo, marca el modo escolar en Ajustes y crea el horario eligiendo tu curso y tu comunidad autónoma: las asignaturas oficiales ya vienen cargadas.',
        'Rellénalo a mano con Editar, o con el plan Plus haz una foto al horario en papel y la IA lo pasa a la cuadrícula.',
        'Antes de guardar lo que ha leído la IA lo revisas; después puedes corregir cualquier celda.',
      ],
      consejo: 'La IA entiende abreviaturas («Mates», «Geo i Hist») y las convierte en la asignatura oficial. Si algo no es una asignatura (por ejemplo, la tutoría), lo deja vacío en vez de inventárselo.',
    },
    planificador: {
      titulo: 'Exámenes, trabajos y deberes',
      resumen: 'Todo lo que tienes que entregar o estudiar, ordenado por fecha y con su asignatura.',
      pasos: [
        'En Exámenes y trabajos, añade cada entrega con su fecha, su tipo (examen, trabajo o presentación) y su asignatura.',
        'En Deberes, apunta los de cada día: si no dices para cuándo son, se ponen para la próxima clase de esa asignatura, saltándose fines de semana y festivos.',
        'Con el plan Plus, haz una foto al calendario de exámenes (aunque esté escrito a mano) o a la página de la agenda y la IA lo saca todo. Revisas la lista, quitas lo que no quieras y lo añades.',
        'Marca la casilla de cada entrega cuando la termines.',
      ],
    },
    ia: {
      titulo: 'La ayuda de la IA (plan Plus)',
      resumen: 'La IA te propone y tú decides: nada se guarda sin que lo revises.',
      pasos: [
        'Abre una tarea y, en «Ayuda de la IA», pulsa Dividir en pasos para convertirla en subtareas pequeñas.',
        'En un examen, pulsa Plan de estudio hasta la fecha: la IA reparte sesiones cortas hasta el día del examen, con repaso al final. Cambia el texto o desmarca las que no quieras y añádelas: salen en tu Agenda.',
        'También lee fotos del horario, del calendario de exámenes y de la agenda (en Horario y en el Planificador).',
        'El plan Plus incluye 100 usos al mes, compartidos con las cuentas de tus hijos si las tienes vinculadas. Cuántos llevas lo ves en Ajustes, en Tu plan.',
        'Para contratarlo (solo una persona adulta), ve a Ajustes → Tu plan, elige mensual o anual y pulsa Pasar a Plus: pagas en una página segura de Stripe. Para darte de baja, cambiar la tarjeta o ver las facturas, pulsa Gestionar suscripción en el mismo sitio.',
      ],
    },
    pomodoro: {
      titulo: 'Pomodoro y estadísticas',
      resumen: 'Concéntrate en bloques cortos con descansos, y mira en qué se te va el tiempo.',
      pasos: [
        'Elige la tarea en la que vas a trabajar (opcional) y pulsa Iniciar. Al acabar el bloque suena un aviso y empieza el descanso.',
        'La duración se ajusta a tu edad (los más pequeños, bloques más cortos). Puedes cambiarla en Ajustar el temporizador.',
        'En Estadísticas tienes el tiempo de concentración por etiqueta o por asignatura, el progreso de tus objetivos, la actividad de cada día y el tiempo estimado frente al real.',
        'Puedes exportar las estadísticas en CSV o imprimirlas en PDF.',
      ],
    },
    revision: {
      titulo: 'Revisión semanal y recordatorios',
      resumen: 'Para que nada se te pase: un repaso cada semana y avisos a tiempo.',
      pasos: [
        'La Revisión semanal te enseña las tareas vencidas, lo que has terminado, los objetivos sin movimiento y las tareas sueltas por organizar.',
        'En Recordatorios crea alarmas: la revisión semanal (día y hora), antes de cada fecha límite o antes de las vacaciones. Cada una puede llegarte también por correo.',
        'El modo emergencia hace sonar una alarma si una tarea pendiente lleva varios días sin que la toques.',
        'Para recibir los avisos con la app cerrada, actívalos en Ajustes, en Avisos en este dispositivo.',
      ],
    },
    familia: {
      titulo: 'Familia',
      resumen: 'Vincula tu cuenta con la de tu padre, madre o tutor (o con la de tu hijo o hija) para revisar tareas juntos.',
      pasos: [
        'Quien va a ser revisado genera un código en Familia y se lo da en persona al adulto, que lo introduce en su cuenta. El código sirve una vez y caduca en 48 horas.',
        'Si la cuenta es de un menor, al vincularse el adulto también la confirma: sin esa confirmación no se puede usar.',
        'Para pedir una revisión, abre la tarea, elige quién la revisa y márcala como Hecha. El adulto la aprueba o la devuelve con un comentario, y te llega un aviso.',
        'El adulto también puede asignar tareas y decidir si su hijo o hija puede usar la IA de su plan. Solo ve las tareas que se le envían o que ha asignado, nunca el resto de la cuenta.',
      ],
    },
    ajustes: {
      titulo: 'Ajustes, idioma y móvil',
      resumen: 'Adapta FocusFlow a ti y llévalo en el móvil.',
      pasos: [
        'Abajo del menú cambias el idioma (castellano, valenciano, gallego, euskera, catalán e inglés) y el modo claro u oscuro.',
        'En Ajustes eliges tu perfil, ves tu plan, activas el modo escolar, conectas Google Calendar y Google Classroom y, si quieres, eliminas tu cuenta.',
        'Para tenerla en el móvil o la tablet como una app más, abre focusflowup.com en el navegador y elige Instalar aplicación o Añadir a pantalla de inicio. Después activa los avisos en Ajustes.',
      ],
    },
  },
  videos: {
    horarioFoto: 'Se elige la foto del horario, la IA lo lee en unos segundos y, tras revisarlo, se aplica a la cuadrícula.',
    examenesFoto: 'Foto de un calendario de exámenes escrito a mano: la IA saca las 6 entregas con su fecha, su tipo y su asignatura.',
    deberesFoto: 'Foto de una página de la agenda: los deberes salen con su asignatura y su fecha.',
    planEstudio: 'Plan de estudio para un examen de Matemáticas: se desmarca una sesión, se añaden las demás y aparecen en la Agenda.',
    agenda: 'La semana con las clases, los deberes y las sesiones de estudio; después, la vista de mes con los exámenes.',
    pomodoroEstadisticas: 'Un Pomodoro sobre unos deberes de Matemáticas y, en Estadísticas, el tiempo de concentración por asignatura.',
    familiaPedirRevision: 'La alumna elige quién revisa sus deberes y los marca como hechos.',
    familiaRevisar: 'La madre aprueba los deberes, ve la casilla de la IA de su hija y su plan Plus en Ajustes.',
    idiomaTema: 'Cambio de idioma a valenciano, modo oscuro y cambio a inglés.',
    movil: 'FocusFlow en el móvil: Inicio, el menú y la agenda del día.',
  },
};
