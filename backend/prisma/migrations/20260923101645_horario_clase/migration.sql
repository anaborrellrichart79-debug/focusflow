-- CreateEnum
CREATE TYPE "Etapa" AS ENUM ('PRIMARIA', 'ESO', 'BACHILLERATO');

-- CreateEnum
CREATE TYPE "CategoriaAsignatura" AS ENUM ('OBLIGATORIA', 'DE_OPCION', 'OPTATIVA', 'AUTONOMICA');

-- CreateEnum
CREATE TYPE "ComunidadAutonoma" AS ENUM ('ANDALUCIA', 'ARAGON', 'ASTURIAS', 'BALEARES', 'CANARIAS', 'CANTABRIA', 'CASTILLA_LA_MANCHA', 'CASTILLA_Y_LEON', 'CATALUNA', 'COMUNITAT_VALENCIANA', 'EXTREMADURA', 'GALICIA', 'MADRID', 'MURCIA', 'NAVARRA', 'PAIS_VASCO', 'LA_RIOJA', 'CEUTA', 'MELILLA');

-- CreateEnum
CREATE TYPE "TipoFranja" AS ENUM ('CLASE', 'DESCANSO');

-- AlterTable
ALTER TABLE "tareas" ADD COLUMN     "asignaturaHorarioId" TEXT;

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "etapa" "Etapa" NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaturas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaAsignatura" NOT NULL,
    "modalidad" TEXT,
    "comunidad" "ComunidadAutonoma",
    "cursoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "comunidad" "ComunidadAutonoma" NOT NULL,
    "cursoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "franjas_horario" (
    "id" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "tipo" "TipoFranja" NOT NULL DEFAULT 'CLASE',
    "etiqueta" TEXT,
    "horarioId" TEXT NOT NULL,

    CONSTRAINT "franjas_horario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaturas_horario" (
    "id" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "horarioId" TEXT NOT NULL,
    "asignaturaId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignaturas_horario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_clase" (
    "id" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "aula" TEXT,
    "horarioId" TEXT NOT NULL,
    "franjaId" TEXT NOT NULL,
    "asignaturaHorarioId" TEXT NOT NULL,

    CONSTRAINT "sesiones_clase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asignaturas_cursoId_idx" ON "asignaturas"("cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "asignaturas_horario_horarioId_asignaturaId_key" ON "asignaturas_horario"("horarioId", "asignaturaId");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_clase_franjaId_diaSemana_key" ON "sesiones_clase"("franjaId", "diaSemana");

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_asignaturaHorarioId_fkey" FOREIGN KEY ("asignaturaHorarioId") REFERENCES "asignaturas_horario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaturas" ADD CONSTRAINT "asignaturas_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaturas" ADD CONSTRAINT "asignaturas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "franjas_horario" ADD CONSTRAINT "franjas_horario_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "horarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaturas_horario" ADD CONSTRAINT "asignaturas_horario_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "horarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaturas_horario" ADD CONSTRAINT "asignaturas_horario_asignaturaId_fkey" FOREIGN KEY ("asignaturaId") REFERENCES "asignaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_clase" ADD CONSTRAINT "sesiones_clase_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "horarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_clase" ADD CONSTRAINT "sesiones_clase_franjaId_fkey" FOREIGN KEY ("franjaId") REFERENCES "franjas_horario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_clase" ADD CONSTRAINT "sesiones_clase_asignaturaHorarioId_fkey" FOREIGN KEY ("asignaturaHorarioId") REFERENCES "asignaturas_horario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
