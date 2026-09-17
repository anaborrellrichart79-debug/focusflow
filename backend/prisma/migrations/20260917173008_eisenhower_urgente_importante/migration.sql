-- AlterTable
ALTER TABLE "tareas" ADD COLUMN     "importante" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "urgente" BOOLEAN NOT NULL DEFAULT false;
