-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "googleAccessToken" TEXT,
ADD COLUMN     "googleRefreshToken" TEXT,
ADD COLUMN     "googleTokenExpiraEn" TIMESTAMP(3),
ADD COLUMN     "googleUltimaSincronizacion" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "eventos_calendario_google" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "tareaId" TEXT,
    "sesionPomodoroId" TEXT,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_calendario_google_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "eventos_calendario_google_tareaId_key" ON "eventos_calendario_google"("tareaId");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_calendario_google_sesionPomodoroId_key" ON "eventos_calendario_google"("sesionPomodoroId");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_calendario_google_usuarioId_googleEventId_key" ON "eventos_calendario_google"("usuarioId", "googleEventId");

-- AddForeignKey
ALTER TABLE "eventos_calendario_google" ADD CONSTRAINT "eventos_calendario_google_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_calendario_google" ADD CONSTRAINT "eventos_calendario_google_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_calendario_google" ADD CONSTRAINT "eventos_calendario_google_sesionPomodoroId_fkey" FOREIGN KEY ("sesionPomodoroId") REFERENCES "sesiones_pomodoro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
