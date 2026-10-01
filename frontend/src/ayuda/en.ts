import type { TextosAyuda } from './tipos';

// Translation of es.ts (the reference version).
export const en: TextosAyuda = {
  temas: {
    primerosPasos: {
      titulo: 'Getting started',
      resumen: 'FocusFlow brings your tasks, your agenda and your focus time together in one place.',
      pasos: [
        'When you create your account, an assistant asks what you’ll use it for (studying, work, organising the family) and Home adapts to it. You can change it at any time in Settings.',
        'Jot anything down as soon as it comes to mind in the bar at the bottom, “What’s on your mind?”, and press Enter: it’s saved as a to-do task. You can sort it out later.',
        'Press Ctrl + K (or the magnifying glass) to search for any task, note or goal from any screen.',
        'The selector at the top of the menu (All, Personal, School, Occasional) shows just one area, so school doesn’t get mixed up with everything else.',
        'Home shows the most important things for the day: priorities, what’s due in the next 7 days, your classes and your pomodoros.',
      ],
      consejo: 'On every screen, the “?” button at the bottom right opens the help for that screen.',
    },
    tareas: {
      titulo: 'Organising your tasks',
      resumen: 'Several ways of looking at the same tasks: pick whichever works best for you at the time.',
      pasos: [
        'Kanban: each column is a status (To do, In progress, Under control, Postponed, Done and Archived). Drag cards from one column to another or use the ← → arrows.',
        'Eisenhower matrix: mark each task as Urgent, Important or both, and it moves by itself to Do now, Schedule, Delegate or Delete.',
        'The ★ star marks a task as high impact (the 20% that gives 80% of the result, the Pareto principle).',
        'Click a task to open it: due date and time, notes, whether it repeats, estimated time, tags and subtasks.',
        'Goals groups the tasks of a bigger aim; Notes & To-Do keeps notes and short lists; Tags organises them into categories up to 3 levels deep.',
      ],
    },
    agenda: {
      titulo: 'Agenda',
      resumen: 'Your tasks with dates and your classes, by day, week or month.',
      pasos: [
        'Switch views with Day, Week and Month, and move around with the arrows or go back to Today.',
        'It shows tasks with a due date, homework and study sessions and, with school mode, the classes in your timetable in their colours.',
        'If you connect Google Calendar in Settings, your events and your tasks sync both ways.',
      ],
    },
    horario: {
      titulo: 'Class timetable',
      resumen: 'Your weekly timetable, used by the Agenda, homework and holiday reminders.',
      pasos: [
        'To turn it on, tick school mode in Settings and create the timetable by choosing your year and your region: the official subjects are already loaded.',
        'Fill it in by hand with Edit or, with the Plus plan, take a photo of your paper timetable and the AI puts it into the grid.',
        'You review what the AI has read before saving it; afterwards you can correct any cell.',
      ],
      consejo: 'The AI understands abbreviations (“Mates”, “Geo i Hist”) and turns them into the official subject. If something isn’t a subject (for example, form time), it leaves it empty instead of making it up.',
    },
    planificador: {
      titulo: 'Exams, assignments and homework',
      resumen: 'Everything you need to hand in or study, sorted by date and with its subject.',
      pasos: [
        'In Exams and assignments, add each one with its date, its type (exam, assignment or presentation) and its subject.',
        'In Homework, note down each day’s homework: if you don’t say when it’s due, it’s set for the next class of that subject, skipping weekends and holidays.',
        'With the Plus plan, take a photo of the exam calendar (even if it’s handwritten) or of your planner page and the AI picks everything out. You check the list, untick what you don’t want and add it.',
        'Tick each item when you’ve finished it.',
      ],
    },
    ia: {
      titulo: 'AI help (Plus plan)',
      resumen: 'The AI suggests and you decide: nothing is saved without you checking it.',
      pasos: [
        'Open a task and, under “AI help”, click Split into steps to turn it into small subtasks.',
        'On an exam, click Study plan up to the due date: the AI spreads short sessions up to the exam day, with revision at the end. Edit the text or untick the ones you don’t want and add them: they appear in your Agenda.',
        'It also reads photos of your timetable, exam calendar and planner (in Class timetable and School planner).',
        'The Plus plan includes 100 uses a month, shared with your children’s accounts if you’ve linked them. You can see how many you’ve used in Settings, under Your plan.',
      ],
    },
    pomodoro: {
      titulo: 'Pomodoro and statistics',
      resumen: 'Focus in short blocks with breaks, and see where your time goes.',
      pasos: [
        'Choose the task you’ll work on (optional) and click Start. When the block ends an alert sounds and the break begins.',
        'The length adapts to your age (younger users get shorter blocks). You can change it under Adjust the timer.',
        'Statistics shows your focus time by tag or by subject, progress on your goals, your daily activity and estimated versus actual time.',
        'You can export your statistics as CSV or print them as PDF.',
      ],
    },
    revision: {
      titulo: 'Weekly review and reminders',
      resumen: 'So nothing slips through: a review every week and alerts in good time.',
      pasos: [
        'The Weekly review shows overdue tasks, what you’ve finished, goals with no activity and loose tasks waiting to be organised.',
        'In Reminders, create alarms: the weekly review (day and time), before each due date or before the holidays. Each one can also reach you by email.',
        'Emergency mode sounds an alarm if a pending task has gone several days without you touching it.',
        'To get alerts while the app is closed, turn them on in Settings, under Notifications on this device.',
      ],
    },
    familia: {
      titulo: 'Family',
      resumen: 'Link your account with your parent’s or guardian’s (or your child’s) to review tasks together.',
      pasos: [
        'The person being reviewed generates a code in Family and gives it in person to the adult, who enters it in their account. The code works once and expires after 48 hours.',
        'If the account belongs to a minor, the adult also confirms it by linking: without that confirmation it can’t be used.',
        'To ask for a review, open the task, choose who reviews it and mark it as Done. The adult approves it or sends it back with a comment, and you get a notice.',
        'The adult can also assign tasks and decide whether their child can use the AI from their plan. They only see the tasks sent to them or that they assigned, never the rest of the account.',
      ],
    },
    ajustes: {
      titulo: 'Settings, language and mobile',
      resumen: 'Make FocusFlow your own and take it with you on your phone.',
      pasos: [
        'At the bottom of the menu you change the language (Spanish, Valencian, Galician, Basque, Catalan and English) and light or dark mode.',
        'In Settings you choose your profile, see your plan, turn on school mode, connect Google Calendar and Google Classroom and, if you want, delete your account.',
        'To have it on your phone or tablet like any other app, open focusflowup.com in your browser and choose Install app or Add to home screen. Then turn on notifications in Settings.',
      ],
    },
  },
  videos: {
    horarioFoto: 'A photo of the timetable is chosen, the AI reads it in a few seconds and, after checking it, it’s applied to the grid.',
    examenesFoto: 'Photo of a handwritten exam calendar: the AI picks out the 6 items with their date, type and subject.',
    deberesFoto: 'Photo of a planner page: the homework appears with its subject and date.',
    planEstudio: 'Study plan for a Maths exam: one session is unticked, the rest are added and they appear in the Agenda.',
    agenda: 'The week with classes, homework and study sessions; then the month view with the exams.',
    pomodoroEstadisticas: 'A Pomodoro on some Maths homework and, in Statistics, focus time by subject.',
    familiaPedirRevision: 'The student chooses who reviews her homework and marks it as done.',
    familiaRevisar: 'The mother approves the homework, sees her daughter’s AI checkbox and her Plus plan in Settings.',
    idiomaTema: 'Switching the language to Valencian, dark mode and switching to English.',
    movil: 'FocusFlow on a phone: Home, the menu and the day’s agenda.',
  },
};
