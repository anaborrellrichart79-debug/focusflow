-- CreateEnum
CREATE TYPE "FasePomodoro" AS ENUM ('TRABAJO', 'DESCANSO_CORTO', 'DESCANSO_LARGO');

-- CreateTable
CREATE TABLE "sesiones_pomodoro" (
    "id" TEXT NOT NULL,
    "fase" "FasePomodoro" NOT NULL,
    "duracionSegundos" INTEGER NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tareaId" TEXT,
    "completadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_pomodoro_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sesiones_pomodoro" ADD CONSTRAINT "sesiones_pomodoro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_pomodoro" ADD CONSTRAINT "sesiones_pomodoro_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tareas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
