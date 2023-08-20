import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { ScDbRepository } from './sc-db.repository';
import { TaskDbRepository } from './task-db.repository';
import { TeamSettingsDbRepository } from './team-settings-db.repository';
import { TrelloDbRepository } from './trello-db.repository';
import { TransactionPrismaClient } from './types';

@Injectable()
export class DbRepository {
  constructor(
    public readonly sc: ScDbRepository,
    public readonly task: TaskDbRepository,
    public readonly trello: TrelloDbRepository,
    public readonly teamSettings: TeamSettingsDbRepository,
    private readonly prismaClient: PrismaClient,
  ) {}

  async $transaction<T>(
    dbAction: (dbClient: TransactionPrismaClient) => Promise<T>,
  ): Promise<T> {
    return this.prismaClient.$transaction<T>(dbAction);
  }
}
