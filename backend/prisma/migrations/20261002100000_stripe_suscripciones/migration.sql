-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "bajaAlFinalDelPeriodo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consejosPlusVistos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "estadoSuscripcion" TEXT,
ADD COLUMN     "plusCortesia" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plusHasta" TIMESTAMP(3),
ADD COLUMN     "stripeClienteId" TEXT,
ADD COLUMN     "stripeSuscripcionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_stripeClienteId_key" ON "usuarios"("stripeClienteId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_stripeSuscripcionId_key" ON "usuarios"("stripeSuscripcionId");

-- Las cuentas que ya tenían el Plus puesto a mano lo conservan de cortesía
-- (sin pagar y sin que Stripe las toque).
UPDATE "usuarios" SET "plusCortesia" = true WHERE "plan" = 'PAGO';
