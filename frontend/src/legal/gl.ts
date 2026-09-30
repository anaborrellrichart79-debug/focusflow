import type { TextosLegales } from './tipos';

// Tradución de es.ts (a versión de referencia).
export const gl: TextosLegales = {
  privacidad: {
    titulo: 'Política de privacidade',
    secciones: [
      {
        titulo: '1. Quen é a responsable dos teus datos',
        bloques: [
          'FocusFlow (https://focusflowup.com) é un servizo de Ana Borrell Richart, NIF 21673526M, con domicilio en 03820 Cocentaina (Alacant), España. Para calquera cuestión sobre os teus datos podes escribir a privacidad@focusflowup.com.',
          'Tratamos os teus datos conforme o Regulamento xeral de protección de datos da Unión Europea (RXPD, Regulamento (UE) 2016/679), a Lei orgánica 3/2018 de protección de datos persoais e garantía dos dereitos dixitais (LOPDGDD) e a Lei 34/2002 de servizos da sociedade da información (LSSI).',
        ],
      },
      {
        titulo: '2. Que datos tratamos',
        bloques: [
          {
            lista: [
              'Datos da conta: nome (opcional), correo electrónico, contrasinal (gardado cifrado; ninguén o pode ver), data de nacemento, correo do pai, nai ou titor no caso de menores, idioma e preferencias.',
              'O que apuntas na app: obxectivos, tarefas e subtarefas, notas e listas To-Do, etiquetas, horario de clase, exames, traballos e deberes, sesións Pomodoro, recordatorios, avisos e as estatísticas que se calculan con todo iso.',
              'Vínculo familiar: que contas están vinculadas, as tarefas que envías a revisar ou que che asignan e os comentarios da revisión.',
              'Google, só se o conectas: os permisos de acceso que concede Google; os eventos do teu Google Calendar dos próximos 30 días (título e data), que se traen como tarefas; e, se conectas Classroom, os teus traballos pendentes (título, descrición, data de entrega, ligazón e nome da clase), só en lectura.',
              'Notificacións: o enderezo de subscrición que xera o teu navegador ou dispositivo se activas os avisos.',
              'Fotos (plan Plus): a foto do horario, do calendario de exames ou da axenda que subes para que a IA a lea. Úsase só para esa lectura e non se garda.',
              'Uso da IA: a data e o tipo de cada uso, para o límite mensual do plan.',
              'Rexistros técnicos do servidor (enderezo IP, data e petición), para a seguridade e para resolver erros.',
            ],
          },
          'Non usamos cookies de publicidade nin de seguimento nin ferramentas de analítica. O teu navegador só garda o imprescindible para que a app funcione: a sesión iniciada, o idioma, o tema claro ou escuro e se os avisos están activados.',
        ],
      },
      {
        titulo: '3. Para que os usamos e con que base legal',
        bloques: [
          {
            lista: [
              'Para darche o servizo que pides ao crear a conta: gardar e organizar as túas tarefas, enviarche os correos de verificación, de consentimento e de avisos, e as notificacións (execución do contrato, artigo 6.1.b do RXPD).',
              'Para a axuda da IA do plan Plus, cando a usas (execución do contrato).',
              'Para conectar Google Calendar e Google Classroom, só se o decides ti (consentimento, artigo 6.1.a do RXPD). Podes retiralo en calquera momento desconectando Google en Axustes.',
              'Para manter o servizo seguro e resolver erros (interese lexítimo, artigo 6.1.f do RXPD).',
              'Para cumprir as obrigas legais que correspondan (artigo 6.1.c do RXPD).',
            ],
          },
          'Non vendemos os teus datos, non os usamos para publicidade e non facemos perfís de ti.',
        ],
      },
      {
        titulo: '4. Menores de idade',
        bloques: [
          'A lei española permite que un menor dea o seu consentimento a partir dos 14 anos. FocusFlow é máis protector: toda conta dunha persoa menor de 18 anos necesita que o seu pai, nai ou titor a confirme antes de poder usala, cunha ligazón que recibe por correo ou cun código de vínculo familiar.',
          'A persoa adulta vinculada só ve as tarefas que o menor lle envía a revisar ou as que ela mesma lle asigna; nunca o resto da conta.',
          'Desde a súa páxina Familia, a persoa adulta pode apagar a axuda da IA na conta do menor en calquera momento. Tamén nos pode pedir o acceso aos datos do menor ou a súa eliminación escribindo a privacidad@focusflowup.com.',
        ],
      },
      {
        titulo: '5. Intelixencia artificial (plan Plus)',
        bloques: [
          'A axuda da IA (dividir unha tarefa en pasos, preparar un plan de estudo, redactar os recordatorios e ler fotos do horario, dos exames ou da axenda) usa os modelos Claude de Anthropic, PBC (Estados Unidos). Só se usa nas contas co plan Plus, ou nas dun menor vinculado a unha persoa adulta que o teña, e sempre que a familia non a apagase.',
          'Que se envía a Anthropic: o título, a descrición e as datas da tarefa, a materia, os nomes das materias do teu horario, o idioma da app e, se a usas, a foto que subes. Para os recordatorios, os títulos e as datas das túas tarefas pendentes. Non se envían o teu nome, o teu correo nin a túa data de nacemento.',
          'Anthropic trata estes datos como encargado do tratamento, segundo o seu acordo de tratamento de datos, e segundo as súas condicións comerciais non os usa para adestrar os seus modelos.',
          'A IA só fai propostas: non se garda nada ata que ti as revisas e as aceptas.',
        ],
      },
      {
        titulo: '6. Con quen compartimos datos',
        bloques: [
          'Só cos provedores que necesitamos para prestar o servizo, que actúan como encargados do tratamento e só poden usar os datos para iso:',
          {
            lista: [
              'Hetzner Online GmbH (Alemaña): o servidor e a base de datos, no seu centro de datos de Falkenstein (Alemaña).',
              'Resend, Inc.: o envío dos correos electrónicos.',
              'Cloudflare, Inc.: o dominio focusflowup.com e o reenvío do correo de contacto.',
              'Anthropic, PBC: a IA do plan Plus (ver o apartado 5).',
              'Os servizos de notificacións do navegador ou do sistema (Google, Apple ou Mozilla, segundo o teu dispositivo), que entregan os avisos se os activas.',
              'Google, só se conectas a túa conta: FocusFlow crea e actualiza no teu Google Calendar os eventos das túas tarefas e le os teus traballos de Classroom.',
            ],
          },
          'Algúns destes provedores son dos Estados Unidos ou poden tratar datos alí. Esas transferencias internacionais fanse coas garantías do RXPD: unha decisión de adecuación da Comisión Europea ou as cláusulas contractuais tipo que aproba a Comisión.',
        ],
      },
      {
        titulo: '7. Datos de Google',
        bloques: [
          'O uso e a transferencia a calquera outra aplicación da información recibida das API de Google axústase á Política de datos de usuario dos servizos de API de Google, incluídos os requisitos de uso limitado.',
          'En concreto: os datos de Google Calendar e de Google Classroom só se usan para amosarche os teus eventos e traballos como tarefas en FocusFlow e mantelos sincronizados; non se usan para publicidade, non se venden e ningunha persoa os le salvo que ti o pidas ou o esixa a lei. Se usas a IA do plan Plus nunha desas tarefas, só se envía o necesario para darche esa función, nunca para adestrar modelos de IA.',
        ],
      },
      {
        titulo: '8. Canto tempo gardamos os datos',
        bloques: [
          {
            lista: [
              'Mentres teñas a conta. Cando a eliminas desde Axustes, bórranse no momento a túa conta e todo o seu contido, e retírase o permiso de Google.',
              'As copias de seguridade da base de datos fanse cada día e gárdanse 14 días; pasado ese tempo bórranse.',
              'Ao desconectar Google bórranse os permisos de acceso e a ligazón cos eventos do calendario.',
              'As fotos que le a IA non se gardan.',
              'Os rexistros técnicos do servidor gárdanse 14 días.',
            ],
          },
        ],
      },
      {
        titulo: '9. Os teus dereitos',
        bloques: [
          'Podes acceder aos teus datos, corrixilos, eliminalos, opoñerte ao seu tratamento, pedir que se limite, levalos a outro servizo (portabilidade) e retirar o consentimento que deses, sen que iso afecte ao feito antes.',
          'Moitas cousas podes facelas ti desde a app: editar ou borrar o que apuntas, desconectar Google e eliminar a túa conta en Axustes. Para o demais, escribe a privacidad@focusflowup.com; responderémosche nun prazo máximo dun mes.',
          'Se cres que non tratamos ben os teus datos, podes reclamar ante a Axencia Española de Protección de Datos (www.aepd.es).',
        ],
      },
      {
        titulo: '10. Seguridade',
        bloques: [
          'Toda a comunicación vai cifrada (HTTPS), os contrasinais gárdanse cifrados, o servidor está na Unión Europea, fanse copias de seguridade diarias e o acceso ao servidor está restrinxido.',
        ],
      },
      {
        titulo: '11. Cambios nesta política',
        bloques: [
          'Se cambiamos esta política, indicarémolo nesta páxina coa nova data e, se o cambio é importante, avisarémosche na app ou por correo.',
        ],
      },
    ],
  },
  condiciones: {
    titulo: 'Condicións do servizo',
    secciones: [
      {
        titulo: '1. Quen ofrece o servizo',
        bloques: [
          'FocusFlow (https://focusflowup.com) é un servizo de Ana Borrell Richart, NIF 21673526M, con domicilio en 03820 Cocentaina (Alacant), España. Contacto: privacidad@focusflowup.com.',
          'Ao crear unha conta aceptas estas condicións e a nosa política de privacidade.',
        ],
      },
      {
        titulo: '2. Que é FocusFlow',
        bloques: [
          'Unha aplicación web para organizarse e vencer a procrastinación: obxectivos, tarefas, Kanban, Matriz de Eisenhower, Pomodoro, axenda, estatísticas e un modo escolar con horario, exames, traballos e deberes, pensada tamén para as familias.',
        ],
      },
      {
        titulo: '3. A túa conta',
        bloques: [
          {
            lista: [
              'Os datos que dás ao rexistrarte teñen que ser verdadeiros, sobre todo a data de nacemento.',
              'Se tes menos de 18 anos, o teu pai, nai ou titor ten que confirmar a túa conta antes de que a poidas usar.',
              'O teu contrasinal é persoal: non o compartas. Se cres que alguén o coñece, cámbiao ou escríbenos.',
            ],
          },
        ],
      },
      {
        titulo: '4. Plans',
        bloques: [
          {
            lista: [
              'Plan gratuíto: todas as funcións de organización, sen a axuda da IA.',
              'Plan Plus: 3,99 € ao mes ou 29,99 € ao ano, IVE incluído. Engade a axuda da IA, cun número máximo de usos ao mes que se indica en Axustes. Cobre tamén os menores vinculados á persoa que o ten (plan familiar), salvo que ela lles apague a IA.',
              'Pagamento e renovación: págase ao contratalo e cobre un mes ou un ano, segundo a modalidade escollida. Ao cumprirse ese prazo renóvase automaticamente o mesmo día e volve cobrarse o mesmo importe.',
              'Baixa: podes darte de baixa en calquera momento desde Axustes, coa mesma facilidade coa que o contrataches. A subscrición xa non se renovará e conservarás Plus ata o final do período pagado; non se devolve a parte que queda.',
              'Dereito de desistencia: tes 14 días naturais desde a contratación para desistir sen dar explicacións, dándote de baixa ou escribindo a privacidad@focusflowup.com. Se pediches empezar a usar Plus antes de que rematase ese prazo, devolveráseche o pagado descontando a parte proporcional ao tempo xa usado.',
              'Cambios de prezo: avisarémosche con polo menos 30 días de antelación e poderás darte de baixa antes de que se apliquen.',
            ],
          },
        ],
      },
      {
        titulo: '5. A axuda da IA',
        bloques: [
          'As propostas da IA poden ter erros: revísaas sempre antes de aceptalas. A IA non substitúe o profesorado nin a familia.',
          'Sube só fotos do teu horario, dos teus exames ou da túa axenda, e evita que aparezan datos persoais doutras persoas que non fagan falta.',
        ],
      },
      {
        titulo: '6. Uso aceptable',
        bloques: [
          'Non podes usar FocusFlow para nada ilegal, tentar entrar en contas doutras persoas, sobrecargar ou atacar o servizo, nin usalo de forma automática para fins distintos de organizarte.',
        ],
      },
      {
        titulo: '7. O teu contido',
        bloques: [
          'O que apuntas en FocusFlow é teu. Só nos dás permiso para gardalo e procesalo na medida necesaria para prestarche o servizo, como se explica na política de privacidade.',
        ],
      },
      {
        titulo: '8. Servizos de terceiros',
        bloques: [
          'Se conectas Google Calendar ou Google Classroom, o seu uso está suxeito tamén ás condicións de Google. Podes desconectalos cando queiras desde Axustes.',
        ],
      },
      {
        titulo: '9. Dispoñibilidade e responsabilidade',
        bloques: [
          'Facemos o posible para que FocusFlow funcione sempre e os teus datos estean a salvo, pero pode haber interrupcións por mantemento ou por causas alleas. Na medida en que o permita a lei, non respondemos dos danos indirectos que poidan derivar dunha interrupción do servizo. Nada do que din estas condicións limita os dereitos que che recoñece a normativa de consumidores.',
        ],
      },
      {
        titulo: '10. Baixa',
        bloques: [
          'Podes eliminar a túa conta cando queiras desde Axustes. Podemos suspender ou pechar unha conta que incumpra estas condicións, avisándote antes salvo que sexa urxente.',
        ],
      },
      {
        titulo: '11. Cambios nas condicións',
        bloques: [
          'Se cambiamos estas condicións, indicarémolo nesta páxina coa nova data e, se o cambio é importante, avisarémosche con antelación na app ou por correo.',
        ],
      },
      {
        titulo: '12. Lei aplicable',
        bloques: [
          'Estas condicións réxense pola lei española. Se es consumidor, podes acudir aos tribunais do teu domicilio.',
        ],
      },
    ],
  },
};
