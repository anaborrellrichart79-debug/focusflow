import type { TextosLegales } from './tipos';

// Traducció de es.ts (la versió de referència).
export const ca: TextosLegales = {
  privacidad: {
    titulo: 'Política de privacitat',
    secciones: [
      {
        titulo: '1. Qui és la responsable de les teves dades',
        bloques: [
          'FocusFlow (https://focusflowup.com) és un servei d’Ana Borrell Richart, NIF 21673526M, amb domicili a 03820 Cocentaina (Alacant), Espanya. Per a qualsevol qüestió sobre les teves dades pots escriure a privacidad@focusflowup.com.',
          'Tractem les teves dades d’acord amb el Reglament general de protecció de dades de la Unió Europea (RGPD, Reglament (UE) 2016/679), la Llei orgànica 3/2018 de protecció de dades personals i garantia dels drets digitals (LOPDGDD) i la Llei 34/2002 de serveis de la societat de la informació (LSSI).',
        ],
      },
      {
        titulo: '2. Quines dades tractem',
        bloques: [
          {
            lista: [
              'Dades del compte: nom (opcional), correu electrònic, contrasenya (desada xifrada; ningú no la pot veure), data de naixement, correu del pare, mare o tutor en el cas de menors, idioma i preferències.',
              'El que apuntes a l’app: objectius, tasques i subtasques, notes i llistes To-Do, etiquetes, horari de classe, exàmens, treballs i deures, sessions Pomodoro, recordatoris, avisos i les estadístiques que es calculen amb tot això.',
              'Vincle familiar: quins comptes estan vinculats, les tasques que envies a revisar o que t’assignen i els comentaris de la revisió.',
              'Google, només si el connectes: els permisos d’accés que concedeix Google; els esdeveniments del teu Google Calendar dels propers 30 dies (títol i data), que es porten com a tasques; i, si connectes Classroom, els teus treballs pendents (títol, descripció, data de lliurament, enllaç i nom de la classe), només en lectura.',
              'Notificacions: l’adreça de subscripció que genera el teu navegador o dispositiu si actives els avisos.',
              'Fotos (pla Plus): la foto de l’horari, del calendari d’exàmens o de l’agenda que puges perquè la IA la llegeixi. S’usa només per a aquesta lectura i no es desa.',
              'Ús de la IA: la data i el tipus de cada ús, per al límit mensual del pla.',
              'Registres tècnics del servidor (adreça IP, data i petició), per a la seguretat i per resoldre errors.',
            ],
          },
          'No fem servir galetes de publicitat ni de seguiment ni eines d’analítica. El teu navegador només desa l’imprescindible perquè l’app funcioni: la sessió iniciada, l’idioma, el tema clar o fosc i si els avisos estan activats.',
        ],
      },
      {
        titulo: '3. Per a què les fem servir i amb quina base legal',
        bloques: [
          {
            lista: [
              'Per donar-te el servei que demanes en crear el compte: desar i organitzar les teves tasques, enviar-te els correus de verificació, de consentiment i d’avisos, i les notificacions (execució del contracte, article 6.1.b del RGPD).',
              'Per a l’ajuda de la IA del pla Plus, quan la fas servir (execució del contracte).',
              'Per connectar Google Calendar i Google Classroom, només si ho decideixes tu (consentiment, article 6.1.a del RGPD). El pots retirar en qualsevol moment desconnectant Google a Ajustos.',
              'Per mantenir el servei segur i resoldre errors (interès legítim, article 6.1.f del RGPD).',
              'Per complir les obligacions legals que corresponguin (article 6.1.c del RGPD).',
            ],
          },
          'No venem les teves dades, no les fem servir per a publicitat i no en fem perfils.',
        ],
      },
      {
        titulo: '4. Menors d’edat',
        bloques: [
          'La llei espanyola permet que un menor doni el consentiment a partir dels 14 anys. FocusFlow és més protector: tot compte d’una persona menor de 18 anys necessita que el seu pare, mare o tutor el confirmi abans de poder fer-lo servir, amb un enllaç que rep per correu o amb un codi de vincle familiar.',
          'La persona adulta vinculada només veu les tasques que el menor li envia a revisar o les que ella mateixa li assigna; mai la resta del compte.',
          'Des de la seva pàgina Família, la persona adulta pot apagar l’ajuda de la IA al compte del menor en qualsevol moment. També ens pot demanar l’accés a les dades del menor o que les eliminem escrivint a privacidad@focusflowup.com.',
        ],
      },
      {
        titulo: '5. Intel·ligència artificial (pla Plus)',
        bloques: [
          'L’ajuda de la IA (dividir una tasca en passos, preparar un pla d’estudi, redactar els recordatoris i llegir fotos de l’horari, dels exàmens o de l’agenda) fa servir els models Claude d’Anthropic, PBC (Estats Units). Només s’usa en els comptes amb el pla Plus, o en els d’un menor vinculat a una persona adulta que el tingui, i sempre que la família no l’hagi apagada.',
          'Què s’envia a Anthropic: el títol, la descripció i les dates de la tasca, l’assignatura, els noms de les assignatures del teu horari, l’idioma de l’app i, si la fas servir, la foto que puges. Per als recordatoris, els títols i les dates de les teves tasques pendents. No s’envien el teu nom, el teu correu ni la teva data de naixement.',
          'Anthropic tracta aquestes dades com a encarregat del tractament, segons el seu acord de tractament de dades, i segons les seves condicions comercials no les fa servir per entrenar els seus models.',
          'La IA només fa propostes: no es desa res fins que tu les revises i les acceptes.',
        ],
      },
      {
        titulo: '6. Amb qui compartim dades',
        bloques: [
          'Només amb els proveïdors que necessitem per prestar el servei, que actuen com a encarregats del tractament i només poden fer servir les dades per a això:',
          {
            lista: [
              'Hetzner Online GmbH (Alemanya): el servidor i la base de dades, al seu centre de dades de Falkenstein (Alemanya).',
              'Resend, Inc.: l’enviament dels correus electrònics.',
              'Cloudflare, Inc.: el domini focusflowup.com i el reenviament del correu de contacte.',
              'Anthropic, PBC: la IA del pla Plus (vegeu l’apartat 5).',
              'Els serveis de notificacions del navegador o del sistema (Google, Apple o Mozilla, segons el teu dispositiu), que lliuren els avisos si els actives.',
              'Google, només si connectes el teu compte: FocusFlow crea i actualitza al teu Google Calendar els esdeveniments de les teves tasques i llegeix els teus treballs de Classroom.',
            ],
          },
          'Alguns d’aquests proveïdors són dels Estats Units o poden tractar dades allà. Aquestes transferències internacionals es fan amb les garanties del RGPD: una decisió d’adequació de la Comissió Europea o les clàusules contractuals tipus que aprova la Comissió.',
        ],
      },
      {
        titulo: '7. Dades de Google',
        bloques: [
          'L’ús i la transferència a qualsevol altra aplicació de la informació rebuda de les API de Google s’ajusta a la Política de dades d’usuari dels serveis d’API de Google, inclosos els requisits d’ús limitat.',
          'En concret: les dades de Google Calendar i de Google Classroom només s’usen per mostrar-te els esdeveniments i els treballs com a tasques a FocusFlow i mantenir-los sincronitzats; no s’usen per a publicitat, no es venen i cap persona no les llegeix llevat que tu ho demanis o ho exigeixi la llei. Si fas servir la IA del pla Plus en una d’aquestes tasques, només s’envia el necessari per donar-te aquesta funció, mai per entrenar models d’IA.',
        ],
      },
      {
        titulo: '8. Quant de temps desem les dades',
        bloques: [
          {
            lista: [
              'Mentre tinguis el compte. Quan l’elimines des d’Ajustos, s’esborren al moment el teu compte i tot el seu contingut, i es retira el permís de Google.',
              'Les còpies de seguretat de la base de dades es fan cada dia i es desen 14 dies; passat aquest temps s’esborren.',
              'En desconnectar Google s’esborren els permisos d’accés i l’enllaç amb els esdeveniments del calendari.',
              'Les fotos que llegeix la IA no es desen.',
              'Els registres tècnics del servidor es desen 14 dies.',
            ],
          },
        ],
      },
      {
        titulo: '9. Els teus drets',
        bloques: [
          'Pots accedir a les teves dades, corregir-les, eliminar-les, oposar-te al seu tractament, demanar-ne la limitació, endur-te-les a un altre servei (portabilitat) i retirar el consentiment que hagis donat, sense que això afecti el que s’ha fet abans.',
          'Moltes coses les pots fer tu mateix des de l’app: editar o esborrar el que apuntes, desconnectar Google i eliminar el teu compte a Ajustos. Per a la resta, escriu a privacidad@focusflowup.com; et respondrem en un termini màxim d’un mes.',
          'Si creus que no hem tractat bé les teves dades, pots reclamar davant l’Agència Espanyola de Protecció de Dades (www.aepd.es).',
        ],
      },
      {
        titulo: '10. Seguretat',
        bloques: [
          'Tota la comunicació va xifrada (HTTPS), les contrasenyes es desen xifrades, el servidor és a la Unió Europea, es fan còpies de seguretat diàries i l’accés al servidor està restringit.',
        ],
      },
      {
        titulo: '11. Canvis en aquesta política',
        bloques: [
          'Si canviem aquesta política, ho indicarem en aquesta pàgina amb la nova data i, si el canvi és important, t’avisarem a l’app o per correu.',
        ],
      },
    ],
  },
  condiciones: {
    titulo: 'Condicions del servei',
    secciones: [
      {
        titulo: '1. Qui ofereix el servei',
        bloques: [
          'FocusFlow (https://focusflowup.com) és un servei d’Ana Borrell Richart, NIF 21673526M, amb domicili a 03820 Cocentaina (Alacant), Espanya. Contacte: privacidad@focusflowup.com.',
          'En crear un compte acceptes aquestes condicions i la nostra política de privacitat.',
        ],
      },
      {
        titulo: '2. Què és FocusFlow',
        bloques: [
          'Una aplicació web per organitzar-se i vèncer la procrastinació: objectius, tasques, Kanban, Matriu d’Eisenhower, Pomodoro, agenda, estadístiques i un mode escolar amb horari, exàmens, treballs i deures, pensada també per a les famílies.',
        ],
      },
      {
        titulo: '3. El teu compte',
        bloques: [
          {
            lista: [
              'Les dades que dones en registrar-te han de ser certes, sobretot la data de naixement.',
              'Si tens menys de 18 anys, el teu pare, mare o tutor ha de confirmar el teu compte abans que el puguis fer servir.',
              'La teva contrasenya és personal: no la comparteixis. Si creus que algú la coneix, canvia-la o escriu-nos.',
            ],
          },
        ],
      },
      {
        titulo: '4. Plans',
        bloques: [
          {
            lista: [
              'Pla gratuït: totes les funcions d’organització, sense l’ajuda de la IA.',
              'Pla Plus: 3,99 € al mes o 29,99 € l’any, IVA inclòs. Afegeix l’ajuda de la IA, amb un nombre màxim d’usos al mes que s’indica a Ajustos. Cobreix també els menors vinculats a la persona que el té (pla familiar), llevat que ella els apagui la IA.',
              'Pagament i renovació: es paga en contractar-lo i cobreix un mes o un any, segons la modalitat triada. Quan s’acaba aquest termini es renova automàticament el mateix dia i es torna a cobrar el mateix import.',
              'Baixa: et pots donar de baixa en qualsevol moment des d’Ajustos, amb la mateixa facilitat amb què el vas contractar. La subscripció ja no es renovarà i conservaràs Plus fins al final del període pagat; no es retorna la part que queda.',
              'Dret de desistiment: tens 14 dies naturals des de la contractació per desistir sense donar explicacions, donant-te de baixa o escrivint a privacidad@focusflowup.com. Si vas demanar començar a fer servir Plus abans que acabés aquest termini, se’t retornarà el que has pagat descomptant la part proporcional al temps ja utilitzat.',
              'Canvis de preu: t’avisarem amb almenys 30 dies d’antelació i et podràs donar de baixa abans que s’apliquin.',
            ],
          },
        ],
      },
      {
        titulo: '5. L’ajuda de la IA',
        bloques: [
          'Les propostes de la IA poden tenir errors: revisa-les sempre abans d’acceptar-les. La IA no substitueix el professorat ni la família.',
          'Puja només fotos del teu horari, dels teus exàmens o de la teva agenda, i evita que hi apareguin dades personals d’altres persones que no calguin.',
        ],
      },
      {
        titulo: '6. Ús acceptable',
        bloques: [
          'No pots fer servir FocusFlow per a res il·legal, intentar entrar en comptes d’altres persones, sobrecarregar o atacar el servei, ni fer-lo servir de manera automàtica per a finalitats diferents d’organitzar-te.',
        ],
      },
      {
        titulo: '7. El teu contingut',
        bloques: [
          'El que apuntes a FocusFlow és teu. Només ens dones permís per desar-ho i processar-ho en la mesura necessària per prestar-te el servei, com s’explica a la política de privacitat.',
        ],
      },
      {
        titulo: '8. Serveis de tercers',
        bloques: [
          'Si connectes Google Calendar o Google Classroom, el seu ús està subjecte també a les condicions de Google. Els pots desconnectar quan vulguis des d’Ajustos.',
        ],
      },
      {
        titulo: '9. Disponibilitat i responsabilitat',
        bloques: [
          'Fem tot el possible perquè FocusFlow funcioni sempre i les teves dades estiguin segures, però hi pot haver interrupcions per manteniment o per causes alienes. En la mesura que ho permeti la llei, no responem dels danys indirectes que es puguin derivar d’una interrupció del servei. Res del que diuen aquestes condicions limita els drets que et reconeix la normativa de consumidors.',
        ],
      },
      {
        titulo: '10. Baixa',
        bloques: [
          'Pots eliminar el teu compte quan vulguis des d’Ajustos. Podem suspendre o tancar un compte que incompleixi aquestes condicions, avisant-te abans llevat que sigui urgent.',
        ],
      },
      {
        titulo: '11. Canvis en les condicions',
        bloques: [
          'Si canviem aquestes condicions, ho indicarem en aquesta pàgina amb la nova data i, si el canvi és important, t’avisarem amb antelació a l’app o per correu.',
        ],
      },
      {
        titulo: '12. Llei aplicable',
        bloques: [
          'Aquestes condicions es regeixen per la llei espanyola. Si ets consumidor, pots acudir als tribunals del teu domicili.',
        ],
      },
    ],
  },
};
