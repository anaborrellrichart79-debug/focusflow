import type { TextosAyuda } from './tipos';

// Traducció de es.ts (la versió de referència).
export const va: TextosAyuda = {
  temas: {
    primerosPasos: {
      titulo: 'Primers passos',
      resumen: 'FocusFlow reunix en un sol lloc les teues tasques, la teua agenda i el teu temps de concentració.',
      pasos: [
        'En crear el compte, un assistent et pregunta per a què el faràs servir (estudiar, treballar, organitzar la família) i l’Inici s’adapta a això. Ho pots canviar quan vulgues a Configuració.',
        'Apunta qualsevol cosa tan bon punt se t’acudisca en la barra de baix, «Què tens en ment?», i prem Intro: queda guardada com a tasca per fer. Ja l’ordenaràs després.',
        'Prem Ctrl + K (o la lupa) per a buscar qualsevol tasca, nota o objectiu des de qualsevol pantalla.',
        'El selector de dalt del menú (Tot, Personal, Escolar, Eventual) deixa veure només un àmbit, per a no mesclar l’institut amb la resta.',
        'A l’Inici tens el més important del dia: prioritats, el que vencerà en els pròxims 7 dies, les teues classes i els teus pomodoros.',
      ],
      consejo: 'En cada pantalla, el botó «?» de baix a la dreta obri l’ajuda d’eixa pantalla.',
    },
    tareas: {
      titulo: 'Organitzar les teues tasques',
      resumen: 'Diverses maneres de veure les mateixes tasques: tria la que millor et funcione en cada moment.',
      pasos: [
        'Kanban: cada columna és un estat (Per fer, En procés, Sota control, Posposada, Feta i Arxivada). Arrossega les targetes d’una columna a una altra o usa les fletxes ← →.',
        'Matriu d’Eisenhower: marca cada tasca com a Urgent, Important o les dues coses, i es col·loca sola en Fer ja, Planificar, Delegar o Eliminar.',
        'L’estrela ★ marca una tasca com d’alt impacte (el 20 % que dona el 80 % del resultat, principi de Pareto).',
        'Prem una tasca per a obrir la seua fitxa: data i hora límit, notes, si es repetix, temps estimat, etiquetes i subtasques.',
        'Objectius agrupa les tasques d’una meta més gran; Notes i To-Do guarda apunts i llistes curtes; Etiquetes les organitza en categories de fins a 3 nivells.',
      ],
    },
    agenda: {
      titulo: 'Agenda',
      resumen: 'Les teues tasques amb data i les teues classes, en vista de dia, setmana o mes.',
      pasos: [
        'Canvia de vista amb Dia, Setmana i Mes, i mou-te amb les fletxes o torna a Hui.',
        'Hi ixen les tasques amb data límit, els deures i les sessions d’estudi, i, amb el mode escolar, les classes del teu horari amb el seu color.',
        'Si connectes Google Calendar a Configuració, els teus esdeveniments i les teues tasques se sincronitzen en les dos direccions.',
      ],
    },
    horario: {
      titulo: 'Horari de classe',
      resumen: 'El teu horari setmanal, que després usen l’Agenda, els deures i els avisos de vacances.',
      pasos: [
        'Per a activar-lo, marca el mode escolar a Configuració i crea l’horari triant el teu curs i la teua comunitat autònoma: les assignatures oficials ja hi vénen carregades.',
        'Ompli’l a mà amb Editar, o amb el pla Plus fes una foto a l’horari en paper i la IA el passa a la quadrícula.',
        'Abans de guardar el que ha llegit la IA, ho revises; després pots corregir qualsevol cel·la.',
      ],
      consejo: 'La IA entén abreviatures («Mates», «Geo i Hist») i les convertix en l’assignatura oficial. Si alguna cosa no és una assignatura (per exemple, la tutoria), la deixa buida en lloc d’inventar-se-la.',
    },
    planificador: {
      titulo: 'Exàmens, treballs i deures',
      resumen: 'Tot el que has d’entregar o estudiar, ordenat per data i amb la seua assignatura.',
      pasos: [
        'A Exàmens i treballs, afig cada entrega amb la data, el tipus (examen, treball o presentació) i l’assignatura.',
        'A Deures, apunta els de cada dia: si no dius per a quan són, es posen per a la pròxima classe d’eixa assignatura, sense comptar caps de setmana ni festius.',
        'Amb el pla Plus, fes una foto al calendari d’exàmens (encara que estiga escrit a mà) o a la pàgina de l’agenda i la IA ho trau tot. Revises la llista, lleves el que no vulgues i ho afiges.',
        'Marca la casella de cada entrega quan l’acabes.',
      ],
    },
    ia: {
      titulo: 'L’ajuda de la IA (pla Plus)',
      resumen: 'La IA et proposa i tu decidixes: no es guarda res sense que ho revises.',
      pasos: [
        'Obri una tasca i, a «Ajuda de la IA», prem Dividix en passos per a convertir-la en subtasques xicotetes.',
        'En un examen, prem Pla d’estudi fins a la data: la IA repartix sessions curtes fins al dia de l’examen, amb repàs al final. Canvia el text o desmarca les que no vulgues i afig-les: ixen en la teua Agenda.',
        'També llig fotos de l’horari, del calendari d’exàmens i de l’agenda (a Horari i al Planificador).',
        'El pla Plus inclou 100 usos al mes, compartits amb els comptes dels teus fills si els tens vinculats. Quants en portes ho veus a Configuració, en El teu pla.',
        'Per a contractar-lo (només una persona adulta), ves a Configuració → El teu pla, tria mensual o anual i prem Passar a Plus: pagues en una pàgina segura d’Stripe. Per a donar-te de baixa, canviar la targeta o veure les factures, prem Gestionar subscripció en el mateix lloc.',
      ],
    },
    pomodoro: {
      titulo: 'Pomodoro i estadístiques',
      resumen: 'Concentra’t en blocs curts amb descansos, i mira en què se’t va el temps.',
      pasos: [
        'Tria la tasca en què treballaràs (opcional) i prem Iniciar. En acabar el bloc sona un avís i comença el descans.',
        'La durada s’ajusta a la teua edat (els més menuts, blocs més curts). La pots canviar en Ajusta el temporitzador.',
        'A Estadístiques tens el temps de concentració per etiqueta o per assignatura, el progrés dels teus objectius, l’activitat de cada dia i el temps estimat davant del real.',
        'Pots exportar les estadístiques en CSV o imprimir-les en PDF.',
      ],
    },
    revision: {
      titulo: 'Revisió setmanal i recordatoris',
      resumen: 'Perquè no se’t passe res: un repàs cada setmana i avisos a temps.',
      pasos: [
        'La Revisió setmanal et mostra les tasques vençudes, el que has acabat, els objectius sense moviment i les tasques soltes per organitzar.',
        'A Recordatoris crea alarmes: la revisió setmanal (dia i hora), abans de cada data límit o abans de les vacances. Cadascuna també et pot arribar per correu.',
        'El mode emergència fa sonar una alarma si una tasca pendent porta uns quants dies sense que la toques.',
        'Per a rebre els avisos amb l’app tancada, activa’ls a Configuració, en Avisos en este dispositiu.',
      ],
    },
    familia: {
      titulo: 'Família',
      resumen: 'Vincula el teu compte amb el del teu pare, mare o tutor (o amb el del teu fill o filla) per a revisar tasques junts.',
      pasos: [
        'Qui serà revisat genera un codi a Família i li’l dona en persona a l’adult, que l’introduïx en el seu compte. El codi servix una vegada i caduca en 48 hores.',
        'Si el compte és d’un menor, en vincular-se l’adult també el confirma: sense eixa confirmació no es pot usar.',
        'Per a demanar una revisió, obri la tasca, tria qui la revisa i marca-la com a Feta. L’adult l’aprova o la torna amb un comentari, i t’arriba un avís.',
        'L’adult també pot assignar tasques i decidir si el seu fill o filla pot usar la IA del seu pla. Només veu les tasques que se li envien o que ha assignat, mai la resta del compte.',
      ],
    },
    ajustes: {
      titulo: 'Configuració, idioma i mòbil',
      resumen: 'Adapta FocusFlow a tu i porta’l en el mòbil.',
      pasos: [
        'Baix del menú canvies l’idioma (castellà, valencià, gallec, basc, català i anglés) i el mode clar o fosc.',
        'A Configuració tries el teu perfil, veus el teu pla, actives el mode escolar, connectes Google Calendar i Google Classroom i, si vols, elimines el teu compte.',
        'Per a tindre-la en el mòbil o la tauleta com una app més, obri focusflowup.com en el navegador i tria Instal·lar aplicació o Afegir a la pantalla d’inici. Després activa els avisos a Configuració.',
      ],
    },
  },
  videos: {
    horarioFoto: 'Es tria la foto de l’horari, la IA el llig en uns segons i, després de revisar-lo, s’aplica a la quadrícula.',
    examenesFoto: 'Foto d’un calendari d’exàmens escrit a mà: la IA trau les 6 entregues amb la data, el tipus i l’assignatura.',
    deberesFoto: 'Foto d’una pàgina de l’agenda: els deures ixen amb l’assignatura i la data.',
    planEstudio: 'Pla d’estudi per a un examen de Matemàtiques: es desmarca una sessió, s’afigen les altres i apareixen en l’Agenda.',
    agenda: 'La setmana amb les classes, els deures i les sessions d’estudi; després, la vista de mes amb els exàmens.',
    pomodoroEstadisticas: 'Un Pomodoro sobre uns deures de Matemàtiques i, a Estadístiques, el temps de concentració per assignatura.',
    familiaPedirRevision: 'L’alumna tria qui revisa els seus deures i els marca com a fets.',
    familiaRevisar: 'La mare aprova els deures, veu la casella de la IA de la seua filla i el seu pla Plus a Configuració.',
    idiomaTema: 'Canvi d’idioma a valencià, mode fosc i canvi a anglés.',
    movil: 'FocusFlow en el mòbil: Inici, el menú i l’agenda del dia.',
  },
};
