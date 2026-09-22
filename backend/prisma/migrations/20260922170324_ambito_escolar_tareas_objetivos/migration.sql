-- CreateEnum
CREATE TYPE "Ambito" AS ENUM ('PERSONAL', 'ESCOLAR');

-- CreateEnum
CREATE TYPE "TipoEscolar" AS ENUM ('EXAMEN', 'TRABAJO', 'PRESENTACION');

-- AlterTable
ALTER TABLE "objetivos" ADD COLUMN     "ambito" "Ambito" NOT NULL DEFAULT 'PERSONAL';

-- AlterTable
ALTER TABLE "tareas" ADD COLUMN     "ambito" "Ambito" NOT NULL DEFAULT 'PERSONAL',
ADD COLUMN     "tipoEscolar" "TipoEscolar";

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "consentimientoConfirmado" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "consentimientoReenviadoEn" TIMESTAMP(3),
ADD COLUMN     "correoTutor" TEXT,
ADD COLUMN     "fechaNacimiento" TIMESTAMP(3),
ADD COLUMN     "modoEscolarActivo" BOOLEAN NOT NULL DEFAULT false;
