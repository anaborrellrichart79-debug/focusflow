-- CreateEnum
CREATE TYPE "EstadoRevision" AS ENUM ('PENDIENTE', 'APROBADA', 'DEVUELTA');

-- AlterEnum
ALTER TYPE "Ambito" ADD VALUE 'EVENTUAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoTarea" ADD VALUE 'BAJO_CONTROL';
ALTER TYPE "EstadoTarea" ADD VALUE 'POSPUESTA';
ALTER TYPE "EstadoTarea" ADD VALUE 'ARCHIVADA';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoAviso" ADD VALUE 'REVISION_SOLICITADA';
ALTER TYPE "TipoAviso" ADD VALUE 'REVISION_RESUELTA';

-- AlterTable
ALTER TABLE "tareas" ADD COLUMN     "comentarioRevision" TEXT,
ADD COLUMN     "creadaPorId" TEXT,
ADD COLUMN     "estadoRevision" "EstadoRevision",
ADD COLUMN     "revisorId" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "codigoVinculo" TEXT,
ADD COLUMN     "codigoVinculoExpiraEn" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "vinculos_familiares" (
    "id" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "supervisadoId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vinculos_familiares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vinculos_familiares_responsableId_supervisadoId_key" ON "vinculos_familiares"("responsableId", "supervisadoId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_codigoVinculo_key" ON "usuarios"("codigoVinculo");

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculos_familiares" ADD CONSTRAINT "vinculos_familiares_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculos_familiares" ADD CONSTRAINT "vinculos_familiares_supervisadoId_fkey" FOREIGN KEY ("supervisadoId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

