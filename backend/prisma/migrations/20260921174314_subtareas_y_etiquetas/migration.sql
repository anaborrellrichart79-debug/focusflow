-- CreateTable
CREATE TABLE "subtareas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "tareaId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subtareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etiquetas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "etiquetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TareaEtiquetas" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TareaEtiquetas_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "etiquetas_usuarioId_nombre_key" ON "etiquetas"("usuarioId", "nombre");

-- CreateIndex
CREATE INDEX "_TareaEtiquetas_B_index" ON "_TareaEtiquetas"("B");

-- AddForeignKey
ALTER TABLE "subtareas" ADD CONSTRAINT "subtareas_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etiquetas" ADD CONSTRAINT "etiquetas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TareaEtiquetas" ADD CONSTRAINT "_TareaEtiquetas_A_fkey" FOREIGN KEY ("A") REFERENCES "etiquetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TareaEtiquetas" ADD CONSTRAINT "_TareaEtiquetas_B_fkey" FOREIGN KEY ("B") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
