-- CreateEnum
CREATE TYPE "TipoRecordatorio" AS ENUM ('REVISION_SEMANAL', 'ENTREGA', 'VACACIONES');

-- CreateEnum
CREATE TYPE "TipoAviso" AS ENUM ('REVISION_SEMANAL', 'ENTREGA', 'VACACIONES', 'EMERGENCIA');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "emergenciaActiva" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emergenciaDias" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "emergenciaPorCorreo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "recordatorios" (
    "id" TEXT NOT NULL,
    "tipo" "TipoRecordatorio" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "diaSemana" INTEGER,
    "hora" TEXT,
    "horasAntes" INTEGER,
    "diasAntes" INTEGER,
    "soloEscolar" BOOLEAN NOT NULL DEFAULT false,
    "porCorreo" BOOLEAN NOT NULL DEFAULT false,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recordatorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avisos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAviso" NOT NULL,
    "clave" TEXT NOT NULL,
    "datos" JSONB NOT NULL,
    "mensajeIa" TEXT,
    "mostradoEn" TIMESTAMP(3),
    "leidoEn" TIMESTAMP(3),
    "correoEnviadoEn" TIMESTAMP(3),
    "usuarioId" TEXT NOT NULL,
    "tareaId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dias_no_lectivos_propios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "inicio" TEXT NOT NULL,
    "fin" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dias_no_lectivos_propios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "avisos_usuarioId_creadoEn_idx" ON "avisos"("usuarioId", "creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "avisos_usuarioId_clave_key" ON "avisos"("usuarioId", "clave");

-- AddForeignKey
ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dias_no_lectivos_propios" ADD CONSTRAINT "dias_no_lectivos_propios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
