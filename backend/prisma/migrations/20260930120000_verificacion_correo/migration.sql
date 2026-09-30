-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "correoVerificado" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "verificacionReenviadaEn" TIMESTAMP(3);
