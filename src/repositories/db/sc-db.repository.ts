import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { TaskScTicketData } from '../../domain';
import { TransactionPrismaClient } from './types';

@Injectable()
export class ScDbRepository {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly logger: Logger,
  ) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  async selectScDataByTicketNumber(
    scTicketNumber: string,
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<TaskScTicketData | null> {
    this.logger.log(
      'verbose',
      `Selecting SC ticket data by number ${scTicketNumber}...`,
    );

    const scTicketData = await dbClient.sc_ticket_data.findFirst({
      where: { ticket_number: scTicketNumber },
    });

    if (!scTicketData) {
      this.logger.log('verbose', `SC ticket data not found`);

      return null;
    }

    this.logger.log(
      'verbose',
      `Selected SC ticket data by number ${scTicketNumber}`,
    );

    return {
      taskId: scTicketData.tasks_id,
      ticketNumber: scTicketData.ticket_number,
    };
  }

  async insertScTicketData(
    scTicketData: TaskScTicketData,
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log(
      'verbose',
      `Inserting SC ticket data ${scTicketData.ticketNumber}...`,
    );

    await dbClient.sc_ticket_data.create({
      data: {
        tasks_id: scTicketData.taskId,
        ticket_number: scTicketData.ticketNumber,
      },
    });

    this.logger.log(
      'verbose',
      `Inserted SC ticket data ${scTicketData.ticketNumber}`,
    );
  }
}
