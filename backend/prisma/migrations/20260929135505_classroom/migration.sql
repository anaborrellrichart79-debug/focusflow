-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "googleAmbitos" TEXT;

-- CreateTable
CREATE TABLE "trabajos_classroom" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "trabajoId" TEXT NOT NULL,
    "tareaId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trabajos_classroom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trabajos_classroom_tareaId_key" ON "trabajos_classroom"("tareaId");

-- CreateIndex
CREATE UNIQUE INDEX "trabajos_classroom_usuarioId_trabajoId_key" ON "trabajos_classroom"("usuarioId", "trabajoId");

-- AddForeignKey
ALTER TABLE "trabajos_classroom" ADD CONSTRAINT "trabajos_classroom_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajos_classroom" ADD CONSTRAINT "trabajos_classroom_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tareas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
