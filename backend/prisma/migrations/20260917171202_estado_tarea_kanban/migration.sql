/*
  Warnings:

  - You are about to drop the column `completada` on the `tareas` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('POR_HACER', 'EN_PROCESO', 'HECHA');

-- AlterTable
ALTER TABLE "tareas" DROP COLUMN "completada",
ADD COLUMN     "estado" "EstadoTarea" NOT NULL DEFAULT 'POR_HACER';
