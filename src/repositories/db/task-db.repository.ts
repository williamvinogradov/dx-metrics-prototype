import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { TransactionPrismaClient } from './types';

@Injectable()
export class TaskDbRepository {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly logger: Logger,
  ) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  async insertTask(
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<string> {
    this.logger.log('verbose', 'Inserting new task...');
    const newTask = await dbClient.tasks.create({ data: {} });
    this.logger.log('verbose', `Inserted new task: ${newTask.id}`);

    return newTask.id;
  }
}
