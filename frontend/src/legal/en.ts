import type { TextosLegales } from './tipos';

// Translation of es.ts (the reference version).
export const en: TextosLegales = {
  privacidad: {
    titulo: 'Privacy policy',
    secciones: [
      {
        titulo: '1. Who is responsible for your data',
        bloques: [
          'FocusFlow (https://focusflowup.com) is a service run by Ana Borrell Richart, tax ID (NIF) 21673526M, based in 03820 Cocentaina (Alicante), Spain. For any question about your data, write to privacidad@focusflowup.com.',
          'We process your data in accordance with the European Union’s General Data Protection Regulation (GDPR, Regulation (EU) 2016/679), Spanish Organic Law 3/2018 on Personal Data Protection and Guarantee of Digital Rights (LOPDGDD) and Spanish Law 34/2002 on Information Society Services (LSSI).',
        ],
      },
      {
        titulo: '2. What data we process',
        bloques: [
          {
            lista: [
              'Account data: name (optional), email address, password (stored encrypted; nobody can see it), date of birth, the parent’s or guardian’s email for minors, language and preferences.',
              'What you write in the app: goals, tasks and subtasks, notes and to-do lists, tags, class timetable, exams, assignments and homework, Pomodoro sessions, reminders, notifications and the statistics calculated from all of this.',
              'Family link: which accounts are linked, the tasks you send for review or that are assigned to you, and the review comments.',
              'Google, only if you connect it: the access permissions granted by Google; the events in your Google Calendar for the next 30 days (title and date), which are brought in as tasks; and, if you connect Classroom, your pending coursework (title, description, due date, link and class name), read-only.',
              'Notifications: the subscription address your browser or device generates if you turn notifications on.',
              'Photos (Plus plan): the photo of your timetable, exam calendar or planner that you upload for the AI to read. It is used only for that reading and is not stored.',
              'AI usage: the date and type of each use, for the plan’s monthly limit.',
              'Server technical logs (IP address, date and request), for security and to fix errors.',
            ],
          },
          'We do not use advertising or tracking cookies or analytics tools. Your browser only stores what the app needs to work: your signed-in session, language, light or dark theme and whether notifications are on.',
        ],
      },
      {
        titulo: '3. Why we use it and on what legal basis',
        bloques: [
          {
            lista: [
              'To provide the service you ask for when you create your account: storing and organising your tasks, sending you verification, consent and reminder emails, and notifications (performance of a contract, Article 6(1)(b) GDPR).',
              'For the AI help in the Plus plan, when you use it (performance of a contract).',
              'To connect Google Calendar and Google Classroom, only if you choose to (consent, Article 6(1)(a) GDPR). You can withdraw it at any time by disconnecting Google in Settings.',
              'To keep the service secure and fix errors (legitimate interest, Article 6(1)(f) GDPR).',
              'To comply with any applicable legal obligations (Article 6(1)(c) GDPR).',
            ],
          },
          'We do not sell your data, we do not use it for advertising and we do not profile you.',
        ],
      },
      {
        titulo: '4. Minors',
        bloques: [
          'Spanish law allows a minor to give consent from the age of 14. FocusFlow is more protective: every account of a person under 18 must be confirmed by their parent or guardian before it can be used, with a link sent by email or with a family link code.',
          'The linked adult only sees the tasks the minor sends them for review or the ones they assign; never the rest of the account.',
          'From their Family page, the adult can turn off AI help on the minor’s account at any time. They can also ask us for access to or deletion of the minor’s data by writing to privacidad@focusflowup.com.',
        ],
      },
      {
        titulo: '5. Artificial intelligence (Plus plan)',
        bloques: [
          'AI help (breaking a task into steps, preparing a study plan, writing reminders and reading photos of the timetable, exams or planner) uses the Claude models from Anthropic, PBC (United States). It is only used on accounts with the Plus plan, or on those of a minor linked to an adult who has it, and as long as the family has not turned it off.',
          'What is sent to Anthropic: the task’s title, description and dates, the subject, the names of the subjects in your timetable, the app’s language and, if you use it, the photo you upload. For reminders, the titles and dates of your pending tasks. Your name, email address and date of birth are not sent.',
          'Anthropic processes this data as a data processor under its data processing agreement and, according to its commercial terms, does not use it to train its models.',
          'The AI only makes suggestions: nothing is saved until you review and accept them.',
        ],
      },
      {
        titulo: '6. Who we share data with',
        bloques: [
          'Only with the providers we need to run the service, who act as data processors and may only use the data for that purpose:',
          {
            lista: [
              'Hetzner Online GmbH (Germany): the server and the database, in its Falkenstein data centre (Germany).',
              'Resend, Inc.: sending emails.',
              'Cloudflare, Inc.: the focusflowup.com domain and forwarding of the contact email.',
              'Anthropic, PBC: the AI in the Plus plan (see section 5).',
              'Browser or system notification services (Google, Apple or Mozilla, depending on your device), which deliver notifications if you turn them on.',
              'Google, only if you connect your account: FocusFlow creates and updates the events for your tasks in your Google Calendar and reads your Classroom coursework.',
            ],
          },
          'Some of these providers are based in the United States or may process data there. These international transfers are made with the safeguards required by the GDPR: an adequacy decision of the European Commission or the standard contractual clauses approved by the Commission.',
        ],
      },
      {
        titulo: '7. Google data',
        bloques: [
          'FocusFlow’s use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.',
          'Specifically: Google Calendar and Google Classroom data are only used to show your events and coursework as tasks in FocusFlow and keep them in sync; they are not used for advertising, they are not sold and no person reads them unless you ask us to or the law requires it. If you use the Plus plan’s AI on one of those tasks, only what is needed to provide that feature is sent, never to train AI models.',
        ],
      },
      {
        titulo: '8. How long we keep data',
        bloques: [
          {
            lista: [
              'For as long as you have your account. When you delete it in Settings, your account and all its content are deleted immediately and Google access is revoked.',
              'Database backups are made every day and kept for 14 days; after that they are deleted.',
              'Disconnecting Google deletes the access permissions and the link with the calendar events.',
              'Photos read by the AI are not stored.',
              'Server technical logs are kept for 14 days.',
            ],
          },
        ],
      },
      {
        titulo: '9. Your rights',
        bloques: [
          'You can access, correct and delete your data, object to its processing, ask for it to be restricted, take it to another service (portability) and withdraw any consent you have given, without affecting what was done before.',
          'You can do many of these things yourself in the app: edit or delete what you write, disconnect Google and delete your account in Settings. For anything else, write to privacidad@focusflowup.com; we will reply within one month at the latest.',
          'If you think we have not handled your data properly, you can complain to the Spanish Data Protection Agency (www.aepd.es).',
        ],
      },
      {
        titulo: '10. Security',
        bloques: [
          'All communication is encrypted (HTTPS), passwords are stored encrypted, the server is in the European Union, backups are made daily and access to the server is restricted.',
        ],
      },
      {
        titulo: '11. Changes to this policy',
        bloques: [
          'If we change this policy, we will show it on this page with its new date and, if the change is important, we will let you know in the app or by email.',
        ],
      },
    ],
  },
  condiciones: {
    titulo: 'Terms of service',
    secciones: [
      {
        titulo: '1. Who provides the service',
        bloques: [
          'FocusFlow (https://focusflowup.com) is a service run by Ana Borrell Richart, tax ID (NIF) 21673526M, based in 03820 Cocentaina (Alicante), Spain. Contact: privacidad@focusflowup.com.',
          'By creating an account you accept these terms and our privacy policy.',
        ],
      },
      {
        titulo: '2. What FocusFlow is',
        bloques: [
          'A web app to get organised and beat procrastination: goals, tasks, Kanban, Eisenhower Matrix, Pomodoro, planner, statistics and a school mode with timetable, exams, assignments and homework, also designed for families.',
        ],
      },
      {
        titulo: '3. Your account',
        bloques: [
          {
            lista: [
              'The details you give when signing up must be true, especially your date of birth.',
              'If you are under 18, your parent or guardian must confirm your account before you can use it.',
              'Your password is personal: do not share it. If you think someone knows it, change it or write to us.',
            ],
          },
        ],
      },
      {
        titulo: '4. Plans',
        bloques: [
          {
            lista: [
              'Free plan: every organisation feature, without AI help.',
              'Plus plan: €3.99 a month or €29.99 a year, VAT included. It adds AI help, with a maximum number of uses per month shown in Settings. It also covers minors linked to the person who has it (family plan), unless that person turns their AI off.',
              'Payment and renewal: you pay when you subscribe and it covers one month or one year, depending on the option you choose. When that period ends it renews automatically on the same day and the same amount is charged again.',
              'Cancellation: you can cancel at any time in Settings, as easily as you subscribed. The subscription will not renew and you keep Plus until the end of the period you have paid for; the remaining part is not refunded.',
              'Right of withdrawal: you have 14 calendar days from subscribing to withdraw without giving any reason, by cancelling or by writing to privacidad@focusflowup.com. If you asked to start using Plus before that period ended, you will be refunded what you paid minus the part proportional to the time already used.',
              'Price changes: we will let you know at least 30 days in advance and you can cancel before they apply.',
            ],
          },
        ],
      },
      {
        titulo: '5. AI help',
        bloques: [
          'AI suggestions may contain mistakes: always review them before accepting them. The AI does not replace teachers or family.',
          'Only upload photos of your timetable, exams or planner, and avoid including other people’s personal data that is not needed.',
        ],
      },
      {
        titulo: '6. Acceptable use',
        bloques: [
          'You may not use FocusFlow for anything illegal, try to access other people’s accounts, overload or attack the service, or use it automatically for purposes other than getting organised.',
        ],
      },
      {
        titulo: '7. Your content',
        bloques: [
          'What you write in FocusFlow is yours. You only give us permission to store and process it as needed to provide the service, as explained in the privacy policy.',
        ],
      },
      {
        titulo: '8. Third-party services',
        bloques: [
          'If you connect Google Calendar or Google Classroom, their use is also subject to Google’s terms. You can disconnect them whenever you like in Settings.',
        ],
      },
      {
        titulo: '9. Availability and liability',
        bloques: [
          'We do our best to keep FocusFlow running and your data safe, but there may be interruptions for maintenance or for reasons beyond our control. To the extent permitted by law, we are not liable for indirect damages arising from an interruption of the service. Nothing in these terms limits your rights under consumer law.',
        ],
      },
      {
        titulo: '10. Closing your account',
        bloques: [
          'You can delete your account whenever you like in Settings. We may suspend or close an account that breaches these terms, letting you know beforehand unless it is urgent.',
        ],
      },
      {
        titulo: '11. Changes to these terms',
        bloques: [
          'If we change these terms, we will show it on this page with the new date and, if the change is important, we will let you know in advance in the app or by email.',
        ],
      },
      {
        titulo: '12. Applicable law',
        bloques: [
          'These terms are governed by Spanish law. If you are a consumer, you can go to the courts of your place of residence.',
        ],
      },
    ],
  },
};
