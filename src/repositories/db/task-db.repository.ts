import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

@Injectable()
export class TaskDbRepository {
  constructor(private prismaClient: PrismaClient, private logger: Logger) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  async insertTask(): Promise<string> {
    this.logger.log('info', 'Inserting new task...');
    const newTask = await this.prismaClient.tasks.create({ data: {} });
    this.logger.log('info', `Inserted new task: ${newTask.id}`);
    return newTask.id;
  }
}
