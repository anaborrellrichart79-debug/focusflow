import { Global, Module } from '@nestjs/common';
import { ServicioPrisma } from './prisma.service.js';

@Global()
@Module({
  providers: [ServicioPrisma],
  exports: [ServicioPrisma],
})
export class ModuloPrisma {}
