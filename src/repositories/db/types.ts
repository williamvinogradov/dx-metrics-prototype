import { PrismaClient } from '@prisma/client';
import * as prismaRuntime from '@prisma/client/runtime/library';

export type TransactionPrismaClient = Omit<
  PrismaClient,
  prismaRuntime.ITXClientDenyList
>;
