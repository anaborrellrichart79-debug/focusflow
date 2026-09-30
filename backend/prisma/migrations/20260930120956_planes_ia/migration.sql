-- CreateEnum
CREATE TYPE "PlanUsuario" AS ENUM ('GRATUITO', 'PAGO');

-- CreateEnum
CREATE TYPE "TipoUsoIa" AS ENUM ('SUBTAREAS', 'PLAN_ESTUDIO');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "plan" "PlanUsuario" NOT NULL DEFAULT 'GRATUITO';

-- CreateTable
CREATE TABLE "usos_ia" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoUsoIa" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usos_ia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usos_ia_usuarioId_creadoEn_idx" ON "usos_ia"("usuarioId", "creadoEn");

-- AddForeignKey
ALTER TABLE "usos_ia" ADD CONSTRAINT "usos_ia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
