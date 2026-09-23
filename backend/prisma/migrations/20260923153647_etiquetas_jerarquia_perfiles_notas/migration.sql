-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ESTUDIANTE', 'PROFESIONAL', 'PADRE');

-- CreateEnum
CREATE TYPE "TipoNota" AS ENUM ('NOTA', 'TODO');

-- AlterTable
ALTER TABLE "etiquetas" ADD COLUMN     "padreId" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "perfiles" "PerfilUsuario"[] DEFAULT ARRAY[]::"PerfilUsuario"[];

-- CreateTable
CREATE TABLE "notas" (
    "id" TEXT NOT NULL,
    "tipo" "TipoNota" NOT NULL,
    "contenido" TEXT NOT NULL,
    "conCasilla" BOOLEAN NOT NULL DEFAULT false,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "tareaId" TEXT,
    "objetivoId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notas_usuarioId_tipo_idx" ON "notas"("usuarioId", "tipo");

-- AddForeignKey
ALTER TABLE "etiquetas" ADD CONSTRAINT "etiquetas_padreId_fkey" FOREIGN KEY ("padreId") REFERENCES "etiquetas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tareas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "objetivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
