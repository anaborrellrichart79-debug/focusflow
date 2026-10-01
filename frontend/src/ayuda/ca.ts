import type { TextosAyuda } from './tipos';

// Traducció de es.ts (la versió de referència).
export const ca: TextosAyuda = {
  temas: {
    primerosPasos: {
      titulo: 'Primers passos',
      resumen: 'FocusFlow reuneix en un sol lloc les teves tasques, la teva agenda i el teu temps de concentració.',
      pasos: [
        'En crear el compte, un assistent et pregunta per a què el faràs servir (estudiar, treballar, organitzar la família) i l’Inici s’hi adapta. Ho pots canviar quan vulguis a Configuració.',
        'Apunta qualsevol cosa tan bon punt se t’acudeixi a la barra de baix, «Què tens en ment?», i prem Retorn: queda desada com a tasca per fer. Ja l’endreçaràs després.',
        'Prem Ctrl + K (o la lupa) per cercar qualsevol tasca, nota o objectiu des de qualsevol pantalla.',
        'El selector de dalt del menú (Tot, Personal, Escolar, Eventual) deixa veure només un àmbit, per no barrejar l’institut amb la resta.',
        'A l’Inici tens el més important del dia: prioritats, el que venç en els propers 7 dies, les teves classes i els teus pomodoros.',
      ],
      consejo: 'A cada pantalla, el botó «?» de baix a la dreta obre l’ajuda d’aquella pantalla.',
    },
    tareas: {
      titulo: 'Organitzar les teves tasques',
      resumen: 'Diverses maneres de veure les mateixes tasques: tria la que et funcioni millor a cada moment.',
      pasos: [
        'Kanban: cada columna és un estat (Per fer, En procés, Sota control, Ajornada, Feta i Arxivada). Arrossega les targetes d’una columna a una altra o fes servir les fletxes ← →.',
        'Matriu d’Eisenhower: marca cada tasca com a Urgent, Important o totes dues coses, i es col·loca sola a Fer ja, Planificar, Delegar o Eliminar.',
        'L’estrella ★ marca una tasca com d’alt impacte (el 20 % que dona el 80 % del resultat, principi de Pareto).',
        'Prem una tasca per obrir-ne la fitxa: data i hora límit, notes, si es repeteix, temps estimat, etiquetes i subtasques.',
        'Objectius agrupa les tasques d’una meta més gran; Notes i To-Do desa apunts i llistes curtes; Etiquetes les organitza en categories de fins a 3 nivells.',
      ],
    },
    agenda: {
      titulo: 'Agenda',
      resumen: 'Les teves tasques amb data i les teves classes, en vista de dia, setmana o mes.',
      pasos: [
        'Canvia de vista amb Dia, Setmana i Mes, i mou-te amb les fletxes o torna a Avui.',
        'Hi surten les tasques amb data límit, els deures i les sessions d’estudi, i, amb el mode escolar, les classes del teu horari amb el seu color.',
        'Si connectes Google Calendar a Configuració, els teus esdeveniments i les teves tasques se sincronitzen en les dues direccions.',
      ],
    },
    horario: {
      titulo: 'Horari de classe',
      resumen: 'El teu horari setmanal, que després fan servir l’Agenda, els deures i els avisos de vacances.',
      pasos: [
        'Per activar-lo, marca el mode escolar a Configuració i crea l’horari triant el teu curs i la teva comunitat autònoma: les assignatures oficials ja hi vénen carregades.',
        'Omple’l a mà amb Edita, o amb el pla Plus fes una foto a l’horari en paper i la IA el passa a la quadrícula.',
        'Abans de desar el que ha llegit la IA, ho revises; després pots corregir qualsevol cel·la.',
      ],
      consejo: 'La IA entén abreviatures («Mates», «Geo i Hist») i les converteix en l’assignatura oficial. Si alguna cosa no és una assignatura (per exemple, la tutoria), la deixa buida en lloc d’inventar-se-la.',
    },
    planificador: {
      titulo: 'Exàmens, treballs i deures',
      resumen: 'Tot el que has de lliurar o estudiar, ordenat per data i amb la seva assignatura.',
      pasos: [
        'A Exàmens i treballs, afegeix cada lliurament amb la data, el tipus (examen, treball o presentació) i l’assignatura.',
        'A Deures, apunta els de cada dia: si no dius per a quan són, es posen per a la propera classe d’aquella assignatura, sense comptar caps de setmana ni festius.',
        'Amb el pla Plus, fes una foto al calendari d’exàmens (encara que estigui escrit a mà) o a la pàgina de l’agenda i la IA ho treu tot. Revises la llista, treus el que no vulguis i ho afegeixes.',
        'Marca la casella de cada lliurament quan l’acabis.',
      ],
    },
    ia: {
      titulo: 'L’ajuda de la IA (pla Plus)',
      resumen: 'La IA et proposa i tu decideixes: no es desa res sense que ho revisis.',
      pasos: [
        'Obre una tasca i, a «Ajuda de la IA», prem Divideix en passos per convertir-la en subtasques petites.',
        'En un examen, prem Pla d’estudi fins a la data: la IA reparteix sessions curtes fins al dia de l’examen, amb repàs al final. Canvia el text o desmarca les que no vulguis i afegeix-les: surten a la teva Agenda.',
        'També llegeix fotos de l’horari, del calendari d’exàmens i de l’agenda (a Horari i al Planificador).',
        'El pla Plus inclou 100 usos al mes, compartits amb els comptes dels teus fills si els tens vinculats. Quants en portes ho veus a Configuració, a El teu pla.',
      ],
    },
    pomodoro: {
      titulo: 'Pomodoro i estadístiques',
      resumen: 'Concentra’t en blocs curts amb descansos, i mira en què se’t va el temps.',
      pasos: [
        'Tria la tasca en què treballaràs (opcional) i prem Iniciar. En acabar el bloc sona un avís i comença el descans.',
        'La durada s’ajusta a la teva edat (els més petits, blocs més curts). La pots canviar a Ajusta el temporitzador.',
        'A Estadístiques tens el temps de concentració per etiqueta o per assignatura, el progrés dels teus objectius, l’activitat de cada dia i el temps estimat davant del real.',
        'Pots exportar les estadístiques en CSV o imprimir-les en PDF.',
      ],
    },
    revision: {
      titulo: 'Revisió setmanal i recordatoris',
      resumen: 'Perquè no se t’escapi res: un repàs cada setmana i avisos a temps.',
      pasos: [
        'La Revisió setmanal et mostra les tasques vençudes, el que has acabat, els objectius sense moviment i les tasques soltes per organitzar.',
        'A Recordatoris crea alarmes: la revisió setmanal (dia i hora), abans de cada data límit o abans de les vacances. Cadascuna també et pot arribar per correu.',
        'El mode emergència fa sonar una alarma si una tasca pendent fa uns quants dies que no la toques.',
        'Per rebre els avisos amb l’app tancada, activa’ls a Configuració, a Avisos en aquest dispositiu.',
      ],
    },
    familia: {
      titulo: 'Família',
      resumen: 'Vincula el teu compte amb el del teu pare, mare o tutor (o amb el del teu fill o filla) per revisar tasques junts.',
      pasos: [
        'Qui serà revisat genera un codi a Família i el dona en persona a l’adult, que l’introdueix al seu compte. El codi serveix una vegada i caduca en 48 hores.',
        'Si el compte és d’un menor, en vincular-s’hi l’adult també el confirma: sense aquesta confirmació no es pot fer servir.',
        'Per demanar una revisió, obre la tasca, tria qui la revisa i marca-la com a Feta. L’adult l’aprova o la retorna amb un comentari, i t’arriba un avís.',
        'L’adult també pot assignar tasques i decidir si el seu fill o filla pot fer servir la IA del seu pla. Només veu les tasques que se li envien o que ha assignat, mai la resta del compte.',
      ],
    },
    ajustes: {
      titulo: 'Configuració, idioma i mòbil',
      resumen: 'Adapta FocusFlow a tu i porta’l al mòbil.',
      pasos: [
        'A sota del menú canvies l’idioma (castellà, valencià, gallec, basc, català i anglès) i el mode clar o fosc.',
        'A Configuració tries el teu perfil, veus el teu pla, actives el mode escolar, connectes Google Calendar i Google Classroom i, si vols, elimines el teu compte.',
        'Per tenir-la al mòbil o la tauleta com una app més, obre focusflowup.com al navegador i tria Instal·la l’aplicació o Afegeix a la pantalla d’inici. Després activa els avisos a Configuració.',
      ],
    },
  },
  videos: {
    horarioFoto: 'Es tria la foto de l’horari, la IA el llegeix en uns segons i, després de revisar-lo, s’aplica a la quadrícula.',
    examenesFoto: 'Foto d’un calendari d’exàmens escrit a mà: la IA en treu els 6 lliuraments amb la data, el tipus i l’assignatura.',
    deberesFoto: 'Foto d’una pàgina de l’agenda: els deures surten amb l’assignatura i la data.',
    planEstudio: 'Pla d’estudi per a un examen de Matemàtiques: es desmarca una sessió, s’afegeixen les altres i apareixen a l’Agenda.',
    agenda: 'La setmana amb les classes, els deures i les sessions d’estudi; després, la vista de mes amb els exàmens.',
    pomodoroEstadisticas: 'Un Pomodoro sobre uns deures de Matemàtiques i, a Estadístiques, el temps de concentració per assignatura.',
    familiaPedirRevision: 'L’alumna tria qui revisa els seus deures i els marca com a fets.',
    familiaRevisar: 'La mare aprova els deures, veu la casella de la IA de la seva filla i el seu pla Plus a Configuració.',
    idiomaTema: 'Canvi d’idioma a valencià, mode fosc i canvi a anglès.',
    movil: 'FocusFlow al mòbil: Inici, el menú i l’agenda del dia.',
  },
};
