-- CreateEnum
CREATE TYPE "Recurrencia" AS ENUM ('NINGUNA', 'DIARIA', 'SEMANAL');

-- AlterTable
ALTER TABLE "tareas" ADD COLUMN     "recurrencia" "Recurrencia" NOT NULL DEFAULT 'NINGUNA';
