import type { TextosLegales } from './tipos';

// Versión de referencia. Al cambiar algo aquí, hay que cambiarlo también en
// las demás lenguas (ca, va, gl, eu, en) y actualizar FECHA_TEXTOS_LEGALES.
export const es: TextosLegales = {
  privacidad: {
    titulo: 'Política de privacidad',
    secciones: [
      {
        titulo: '1. Quién es la responsable de tus datos',
        bloques: [
          'FocusFlow (https://focusflowup.com) es un servicio de Ana Borrell Richart, NIF 21673526M, con domicilio en 03820 Cocentaina (Alicante), España. Para cualquier cuestión sobre tus datos puedes escribir a privacidad@focusflowup.com.',
          'Tratamos tus datos conforme al Reglamento General de Protección de Datos de la Unión Europea (RGPD, Reglamento (UE) 2016/679), la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD) y la Ley 34/2002 de servicios de la sociedad de la información (LSSI).',
        ],
      },
      {
        titulo: '2. Qué datos tratamos',
        bloques: [
          {
            lista: [
              'Datos de la cuenta: nombre (opcional), correo electrónico, contraseña (guardada cifrada; nadie puede verla), fecha de nacimiento, correo del padre, madre o tutor en el caso de menores, idioma y preferencias.',
              'Lo que apuntas en la app: objetivos, tareas y subtareas, notas y listas To-Do, etiquetas, horario de clase, exámenes, trabajos y deberes, sesiones Pomodoro, recordatorios, avisos y las estadísticas que se calculan con todo ello.',
              'Vínculo familiar: qué cuentas están vinculadas, las tareas que envías a revisar o que te asignan y los comentarios de la revisión.',
              'Google, solo si lo conectas: los permisos de acceso que concede Google; los eventos de tu Google Calendar de los próximos 30 días (título y fecha), que se traen como tareas; y, si conectas Classroom, tus trabajos pendientes (título, descripción, fecha de entrega, enlace y nombre de la clase), solo en lectura.',
              'Notificaciones: la dirección de suscripción que genera tu navegador o dispositivo si activas los avisos.',
              'Fotos (plan Plus): la foto del horario, del calendario de exámenes o de la agenda que subes para que la IA la lea. Se usa solo para esa lectura y no se guarda.',
              'Uso de la IA: la fecha y el tipo de cada uso, para el límite mensual del plan.',
              'Registros técnicos del servidor (dirección IP, fecha y petición), para la seguridad y para resolver errores.',
            ],
          },
          'No usamos cookies de publicidad ni de seguimiento ni herramientas de analítica. Tu navegador solo guarda lo imprescindible para que la app funcione: la sesión iniciada, el idioma, el tema claro u oscuro y si los avisos están activados.',
        ],
      },
      {
        titulo: '3. Para qué los usamos y con qué base legal',
        bloques: [
          {
            lista: [
              'Para darte el servicio que pides al crear la cuenta: guardar y organizar tus tareas, enviarte los correos de verificación, de consentimiento y de avisos, y las notificaciones (ejecución del contrato, artículo 6.1.b del RGPD).',
              'Para la ayuda de la IA del plan Plus, cuando la usas (ejecución del contrato).',
              'Para conectar Google Calendar y Google Classroom, solo si lo decides tú (consentimiento, artículo 6.1.a del RGPD). Puedes retirarlo en cualquier momento desconectando Google en Ajustes.',
              'Para mantener el servicio seguro y resolver errores (interés legítimo, artículo 6.1.f del RGPD).',
              'Para cumplir las obligaciones legales que correspondan (artículo 6.1.c del RGPD).',
            ],
          },
          'No vendemos tus datos, no los usamos para publicidad y no creamos perfiles de ti.',
        ],
      },
      {
        titulo: '4. Menores de edad',
        bloques: [
          'La ley española permite que un menor dé su consentimiento a partir de los 14 años. FocusFlow es más protector: toda cuenta de una persona menor de 18 años necesita que su padre, madre o tutor la confirme antes de poder usarla, con un enlace que recibe por correo o con un código de vínculo familiar.',
          'La persona adulta vinculada solo ve las tareas que el menor le envía a revisar o las que ella misma le asigna; nunca el resto de su cuenta.',
          'Desde su página Familia, la persona adulta puede apagar la ayuda de la IA en la cuenta del menor en cualquier momento. También puede pedirnos el acceso a los datos del menor o su eliminación escribiendo a privacidad@focusflowup.com.',
        ],
      },
      {
        titulo: '5. Inteligencia artificial (plan Plus)',
        bloques: [
          'La ayuda de la IA (dividir una tarea en pasos, preparar un plan de estudio, redactar los recordatorios y leer fotos del horario, de los exámenes o de la agenda) usa los modelos Claude de Anthropic, PBC (Estados Unidos). Solo se usa en las cuentas con el plan Plus, o en las de un menor vinculado a una persona adulta que lo tenga, y siempre que la familia no la haya apagado.',
          'Qué se envía a Anthropic: el título, la descripción y las fechas de la tarea, la asignatura, los nombres de las asignaturas de tu horario, el idioma de la app y, si la usas, la foto que subes. Para los recordatorios, los títulos y las fechas de tus tareas pendientes. No se envían tu nombre, tu correo ni tu fecha de nacimiento.',
          'Anthropic trata estos datos como encargado del tratamiento, según su acuerdo de tratamiento de datos, y según sus condiciones comerciales no los usa para entrenar sus modelos.',
          'La IA solo hace propuestas: nada se guarda hasta que tú las revisas y las aceptas.',
        ],
      },
      {
        titulo: '6. Con quién compartimos datos',
        bloques: [
          'Solo con los proveedores que necesitamos para prestar el servicio, que actúan como encargados del tratamiento y solo pueden usar los datos para eso:',
          {
            lista: [
              'Hetzner Online GmbH (Alemania): el servidor y la base de datos, en su centro de datos de Falkenstein (Alemania).',
              'Resend, Inc.: el envío de los correos electrónicos.',
              'Cloudflare, Inc.: el dominio focusflowup.com y el reenvío del correo de contacto.',
              'Anthropic, PBC: la IA del plan Plus (ver el apartado 5).',
              'Los servicios de notificaciones del navegador o del sistema (Google, Apple o Mozilla, según tu dispositivo), que entregan los avisos si los activas.',
              'Google, solo si conectas tu cuenta: FocusFlow crea y actualiza en tu Google Calendar los eventos de tus tareas y lee tus trabajos de Classroom.',
            ],
          },
          'Algunos de estos proveedores son de Estados Unidos o pueden tratar datos allí. Esas transferencias internacionales se hacen con las garantías del RGPD: una decisión de adecuación de la Comisión Europea o las cláusulas contractuales tipo que aprueba la Comisión.',
        ],
      },
      {
        titulo: '7. Datos de Google',
        bloques: [
          'El uso y la transferencia a cualquier otra aplicación de la información recibida de las API de Google se ajusta a la Política de datos de usuario de los servicios de API de Google, incluidos los requisitos de uso limitado.',
          'En concreto: los datos de Google Calendar y de Google Classroom solo se usan para mostrarte tus eventos y trabajos como tareas en FocusFlow y mantenerlos sincronizados; no se usan para publicidad, no se venden y ninguna persona los lee salvo que tú lo pidas o lo exija la ley. Si usas la IA del plan Plus sobre una de esas tareas, solo se envía lo necesario para darte esa función, nunca para entrenar modelos de IA.',
        ],
      },
      {
        titulo: '8. Cuánto tiempo guardamos los datos',
        bloques: [
          {
            lista: [
              'Mientras tengas la cuenta. Cuando la eliminas desde Ajustes, se borran al momento tu cuenta y todo su contenido, y se retira el permiso de Google.',
              'Las copias de seguridad de la base de datos se hacen cada día y se guardan 14 días; pasado ese tiempo se borran.',
              'Al desconectar Google se borran los permisos de acceso y el enlace con los eventos del calendario.',
              'Las fotos que lee la IA no se guardan.',
              'Los registros técnicos del servidor se guardan 14 días.',
            ],
          },
        ],
      },
      {
        titulo: '9. Tus derechos',
        bloques: [
          'Puedes acceder a tus datos, corregirlos, eliminarlos, oponerte a su tratamiento, pedir que se limite, llevártelos a otro servicio (portabilidad) y retirar el consentimiento que hayas dado, sin que eso afecte a lo hecho antes.',
          'Muchas cosas las puedes hacer tú desde la app: editar o borrar lo que apuntas, desconectar Google y eliminar tu cuenta en Ajustes. Para lo demás, escribe a privacidad@focusflowup.com; te responderemos en un plazo máximo de un mes.',
          'Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).',
        ],
      },
      {
        titulo: '10. Seguridad',
        bloques: [
          'Toda la comunicación va cifrada (HTTPS), las contraseñas se guardan cifradas, el servidor está en la Unión Europea, se hacen copias de seguridad diarias y el acceso al servidor está restringido.',
        ],
      },
      {
        titulo: '11. Cambios en esta política',
        bloques: [
          'Si cambiamos esta política, lo indicaremos en esta página con su nueva fecha y, si el cambio es importante, te avisaremos en la app o por correo.',
        ],
      },
    ],
  },
  condiciones: {
    titulo: 'Condiciones del servicio',
    secciones: [
      {
        titulo: '1. Quién ofrece el servicio',
        bloques: [
          'FocusFlow (https://focusflowup.com) es un servicio de Ana Borrell Richart, NIF 21673526M, con domicilio en 03820 Cocentaina (Alicante), España. Contacto: privacidad@focusflowup.com.',
          'Al crear una cuenta aceptas estas condiciones y nuestra política de privacidad.',
        ],
      },
      {
        titulo: '2. Qué es FocusFlow',
        bloques: [
          'Una aplicación web para organizarse y vencer la procrastinación: objetivos, tareas, Kanban, Matriz de Eisenhower, Pomodoro, agenda, estadísticas y un modo escolar con horario, exámenes, trabajos y deberes, pensada también para familias.',
        ],
      },
      {
        titulo: '3. Tu cuenta',
        bloques: [
          {
            lista: [
              'Los datos que das al registrarte tienen que ser verdaderos, en especial la fecha de nacimiento.',
              'Si tienes menos de 18 años, tu padre, madre o tutor tiene que confirmar tu cuenta antes de que puedas usarla.',
              'Tu contraseña es personal: no la compartas. Si crees que alguien la conoce, cámbiala o escríbenos.',
            ],
          },
        ],
      },
      {
        titulo: '4. Planes',
        bloques: [
          {
            lista: [
              'Plan gratuito: todas las funciones de organización, sin la ayuda de la IA.',
              'Plan Plus: 3,99 € al mes o 29,99 € al año, IVA incluido. Añade la ayuda de la IA, con un número máximo de usos al mes que se indica en Ajustes. Cubre también a las cuentas vinculadas a la persona que lo tiene (plan familiar), salvo que ella les apague la IA; todas comparten esos mismos usos al mes, de modo que cuantas más cuentas se vinculan, menos usos le corresponden a cada una.',
              'Pago y renovación: se paga al contratar y cubre un mes o un año, según la modalidad elegida. Al cumplirse ese plazo se renueva automáticamente el mismo día y se vuelve a cobrar el mismo importe.',
              'Baja: puedes darte de baja en cualquier momento desde Ajustes, con la misma facilidad con que lo contrataste. La suscripción ya no se renovará y conservarás Plus hasta el final del periodo pagado; no se devuelve la parte que queda.',
              'Derecho de desistimiento: tienes 14 días naturales desde la contratación para desistir sin dar explicaciones, dándote de baja o escribiendo a privacidad@focusflowup.com. Si pediste empezar a usar Plus antes de que terminara ese plazo, se te devolverá lo pagado descontando la parte proporcional al tiempo ya usado.',
              'Cambios de precio: te avisaremos con al menos 30 días de antelación y podrás darte de baja antes de que se apliquen.',
            ],
          },
        ],
      },
      {
        titulo: '5. La ayuda de la IA',
        bloques: [
          'Las propuestas de la IA pueden tener errores: revísalas siempre antes de aceptarlas. La IA no sustituye al profesorado ni a la familia.',
          'Sube solo fotos de tu horario, de tus exámenes o de tu agenda, y evita que aparezcan datos personales de otras personas que no hagan falta.',
        ],
      },
      {
        titulo: '6. Uso aceptable',
        bloques: [
          'No puedes usar FocusFlow para nada ilegal, intentar entrar en cuentas de otras personas, sobrecargar o atacar el servicio, ni usarlo de forma automática para fines distintos de organizarte.',
        ],
      },
      {
        titulo: '7. Tu contenido',
        bloques: [
          'Lo que apuntas en FocusFlow es tuyo. Solo nos das permiso para guardarlo y procesarlo en la medida necesaria para prestarte el servicio, como se explica en la política de privacidad.',
        ],
      },
      {
        titulo: '8. Servicios de terceros',
        bloques: [
          'Si conectas Google Calendar o Google Classroom, su uso está sujeto también a las condiciones de Google. Puedes desconectarlos cuando quieras desde Ajustes.',
        ],
      },
      {
        titulo: '9. Disponibilidad y responsabilidad',
        bloques: [
          'Hacemos lo posible para que FocusFlow funcione siempre y tus datos estén a salvo, pero puede haber interrupciones por mantenimiento o por causas ajenas. En la medida en que lo permita la ley, no respondemos de los daños indirectos que puedan derivarse de una interrupción del servicio. Nada de lo que dicen estas condiciones limita los derechos que te reconoce la normativa de consumidores.',
        ],
      },
      {
        titulo: '10. Baja',
        bloques: [
          'Puedes eliminar tu cuenta cuando quieras desde Ajustes. Podemos suspender o cerrar una cuenta que incumpla estas condiciones, avisándote antes salvo que sea urgente.',
        ],
      },
      {
        titulo: '11. Cambios en las condiciones',
        bloques: [
          'Si cambiamos estas condiciones, lo indicaremos en esta página con su nueva fecha y, si el cambio es importante, te avisaremos con antelación en la app o por correo.',
        ],
      },
      {
        titulo: '12. Ley aplicable',
        bloques: [
          'Estas condiciones se rigen por la ley española. Si eres consumidor, puedes acudir a los tribunales de tu domicilio.',
        ],
      },
    ],
  },
};
