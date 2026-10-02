import type { TextosAyuda } from './tipos';

// Tradución de es.ts (a versión de referencia).
export const gl: TextosAyuda = {
  temas: {
    primerosPasos: {
      titulo: 'Primeiros pasos',
      resumen: 'FocusFlow xunta nun só sitio as túas tarefas, a túa axenda e o teu tempo de concentración.',
      pasos: [
        'Ao crear a conta, un asistente pregúntache para que a vas usar (estudar, traballar, organizar a familia) e o Inicio adáptase a iso. Podes cambialo cando queiras en Axustes.',
        'Apunta calquera cousa en canto che veña á cabeza na barra de abaixo, «Que tes na mente?», e preme Intro: queda gardada como tarefa por facer. Xa a ordenarás despois.',
        'Preme Ctrl + K (ou a lupa) para buscar calquera tarefa, nota ou obxectivo desde calquera pantalla.',
        'O selector de enriba do menú (Todo, Persoal, Escolar, Eventual) deixa ver só un ámbito, para non mesturar o instituto co demais.',
        'No Inicio tes o máis importante do día: prioridades, o que vence nos próximos 7 días, as túas clases e os teus pomodoros.',
      ],
      consejo: 'En cada pantalla, o botón «?» de abaixo á dereita abre a axuda desa pantalla.',
    },
    tareas: {
      titulo: 'Organizar as túas tarefas',
      resumen: 'Varias formas de ver as mesmas tarefas: escolle a que mellor che funcione en cada momento.',
      pasos: [
        'Kanban: cada columna é un estado (Por facer, En proceso, Baixo control, Aprazada, Feita e Arquivada). Arrastra as tarxetas dunha columna a outra ou usa as frechas ← →.',
        'Matriz de Eisenhower: marca cada tarefa como Urxente, Importante ou as dúas, e colócase soa en Facer xa, Planificar, Delegar ou Eliminar.',
        'A estrela ★ marca unha tarefa como de alto impacto (o 20 % que dá o 80 % do resultado, principio de Pareto).',
        'Preme unha tarefa para abrir a súa ficha: data e hora límite, notas, se se repite, tempo estimado, etiquetas e subtarefas.',
        'Obxectivos agrupa as tarefas dunha meta máis grande; Notas e To-Do garda apuntamentos e listas curtas; Etiquetas organízaas en categorías de ata 3 niveis.',
      ],
    },
    agenda: {
      titulo: 'Axenda',
      resumen: 'As túas tarefas con data e as túas clases, en vista de día, semana ou mes.',
      pasos: [
        'Cambia de vista con Día, Semana e Mes, e móvete coas frechas ou volve a Hoxe.',
        'Saen as tarefas con data límite, os deberes e as sesións de estudo e, co modo escolar, as clases do teu horario coa súa cor.',
        'Se conectas Google Calendar en Axustes, os teus eventos e as túas tarefas sincronízanse nas dúas direccións.',
      ],
    },
    horario: {
      titulo: 'Horario de clase',
      resumen: 'O teu horario semanal, que despois usan a Axenda, os deberes e os avisos de vacacións.',
      pasos: [
        'Para activalo, marca o modo escolar en Axustes e crea o horario escollendo o teu curso e a túa comunidade autónoma: as materias oficiais xa veñen cargadas.',
        'Énchelo a man con Editar, ou co plan Plus fai unha foto ao horario en papel e a IA pásao á grade.',
        'Antes de gardar o que leu a IA revísalo; despois podes corrixir calquera cela.',
      ],
      consejo: 'A IA entende abreviaturas («Mates», «Geo i Hist») e convérteas na materia oficial. Se algo non é unha materia (por exemplo, a titoría), déixao baleiro en vez de inventalo.',
    },
    planificador: {
      titulo: 'Exames, traballos e deberes',
      resumen: 'Todo o que tes que entregar ou estudar, ordenado por data e coa súa materia.',
      pasos: [
        'En Exames e traballos, engade cada entrega coa súa data, o seu tipo (exame, traballo ou presentación) e a súa materia.',
        'En Deberes, apunta os de cada día: se non dis para cando son, póñense para a próxima clase desa materia, saltando fins de semana e festivos.',
        'Co plan Plus, fai unha foto ao calendario de exames (aínda que estea escrito a man) ou á páxina da axenda e a IA sácao todo. Revisas a lista, quitas o que non queiras e engádelo.',
        'Marca a caixa de cada entrega cando a remates.',
      ],
    },
    ia: {
      titulo: 'A axuda da IA (plan Plus)',
      resumen: 'A IA proponche e ti decides: non se garda nada sen que o revises.',
      pasos: [
        'Abre unha tarefa e, en «Axuda da IA», preme Dividir en pasos para convertela en subtarefas pequenas.',
        'Nun exame, preme Plan de estudo ata a data: a IA reparte sesións curtas ata o día do exame, con repaso ao final. Cambia o texto ou desmarca as que non queiras e engádeas: saen na túa Axenda.',
        'Tamén le fotos do horario, do calendario de exames e da axenda (en Horario e no Planificador).',
        'O plan Plus inclúe 100 usos ao mes, compartidos coas contas dos teus fillos se as tes vinculadas. Cantos levas velo en Axustes, en O teu plan.',
        'Para contratalo (só unha persoa adulta), vai a Axustes → O teu plan, escolle mensual ou anual e preme Pasar a Plus: pagas nunha páxina segura de Stripe. Para darte de baixa, cambiar a tarxeta ou ver as facturas, preme Xestionar subscrición no mesmo sitio.',
      ],
    },
    pomodoro: {
      titulo: 'Pomodoro e estatísticas',
      resumen: 'Concéntrate en bloques curtos con descansos, e mira en que se che vai o tempo.',
      pasos: [
        'Escolle a tarefa na que vas traballar (opcional) e preme Iniciar. Ao acabar o bloque soa un aviso e comeza o descanso.',
        'A duración axústase á túa idade (os máis pequenos, bloques máis curtos). Podes cambiala en Axustar o temporizador.',
        'En Estatísticas tes o tempo de concentración por etiqueta ou por materia, o progreso dos teus obxectivos, a actividade de cada día e o tempo estimado fronte ao real.',
        'Podes exportar as estatísticas en CSV ou imprimilas en PDF.',
      ],
    },
    revision: {
      titulo: 'Revisión semanal e recordatorios',
      resumen: 'Para que non se che pase nada: un repaso cada semana e avisos a tempo.',
      pasos: [
        'A Revisión semanal amósache as tarefas vencidas, o que remataches, os obxectivos sen movemento e as tarefas soltas por organizar.',
        'En Recordatorios crea alarmas: a revisión semanal (día e hora), antes de cada data límite ou antes das vacacións. Cada unha pode chegarche tamén por correo.',
        'O modo emerxencia fai soar unha alarma se unha tarefa pendente leva varios días sen que a toques.',
        'Para recibir os avisos coa app pechada, actívaos en Axustes, en Avisos neste dispositivo.',
      ],
    },
    familia: {
      titulo: 'Familia',
      resumen: 'Vincula a túa conta coa do teu pai, nai ou titor (ou coa do teu fillo ou filla) para revisar tarefas xuntos.',
      pasos: [
        'Quen vai ser revisado xera un código en Familia e dállo en persoa ao adulto, que o introduce na súa conta. O código serve unha vez e caduca en 48 horas.',
        'Se a conta é dun menor, ao vincularse o adulto tamén a confirma: sen esa confirmación non se pode usar.',
        'Para pedir unha revisión, abre a tarefa, escolle quen a revisa e márcaa como Feita. O adulto apróbaa ou devólvea cun comentario, e chégache un aviso.',
        'O adulto tamén pode asignar tarefas e decidir se o seu fillo ou filla pode usar a IA do seu plan. Só ve as tarefas que se lle envían ou que asignou, nunca o resto da conta.',
      ],
    },
    ajustes: {
      titulo: 'Axustes, idioma e móbil',
      resumen: 'Adapta FocusFlow a ti e lévao no móbil.',
      pasos: [
        'Debaixo do menú cambias o idioma (castelán, valenciano, galego, éuscaro, catalán e inglés) e o modo claro ou escuro.',
        'En Axustes escolles o teu perfil, ves o teu plan, activas o modo escolar, conectas Google Calendar e Google Classroom e, se queres, eliminas a túa conta.',
        'Para tela no móbil ou na tableta como unha app máis, abre focusflowup.com no navegador e escolle Instalar aplicación ou Engadir á pantalla de inicio. Despois activa os avisos en Axustes.',
      ],
    },
  },
  videos: {
    horarioFoto: 'Escóllese a foto do horario, a IA leo nuns segundos e, tras revisalo, aplícase á grade.',
    examenesFoto: 'Foto dun calendario de exames escrito a man: a IA saca as 6 entregas coa súa data, o seu tipo e a súa materia.',
    deberesFoto: 'Foto dunha páxina da axenda: os deberes saen coa súa materia e a súa data.',
    planEstudio: 'Plan de estudo para un exame de Matemáticas: desmárcase unha sesión, engádense as demais e aparecen na Axenda.',
    agenda: 'A semana coas clases, os deberes e as sesións de estudo; despois, a vista de mes cos exames.',
    pomodoroEstadisticas: 'Un Pomodoro sobre uns deberes de Matemáticas e, en Estatísticas, o tempo de concentración por materia.',
    familiaPedirRevision: 'A alumna escolle quen revisa os seus deberes e márcaos como feitos.',
    familiaRevisar: 'A nai aproba os deberes, ve a caixa da IA da súa filla e o seu plan Plus en Axustes.',
    idiomaTema: 'Cambio de idioma a valenciano, modo escuro e cambio a inglés.',
    movil: 'FocusFlow no móbil: Inicio, o menú e a axenda do día.',
  },
};
