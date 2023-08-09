import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { TaskScTicketData } from '../../domain';

@Injectable()
export class ScDbRepository {
  constructor(private prismaClient: PrismaClient, private logger: Logger) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  async selectScDataByTicketNumber(
    scTicketNumber: string,
  ): Promise<TaskScTicketData | null> {
    this.logger.log(
      'info',
      `Selecting SC ticket data by number ${scTicketNumber}...`,
    );
    const scTicketData = await this.prismaClient.sc_ticket_data.findFirst({
      where: { ticket_number: scTicketNumber },
    });

    if (!scTicketData) {
      this.logger.log('info', `SC ticket data not found`);
      return null;
    }

    this.logger.log(
      'info',
      `Selected SC ticket data by number ${scTicketNumber}`,
    );
    return {
      taskId: scTicketData.tasks_id,
      ticketNumber: scTicketData.ticket_number,
    };
  }

  async insertScTicketData(scTicketData: TaskScTicketData): Promise<void> {
    this.logger.log(
      'info',
      `Inserting SC ticket data ${scTicketData.ticketNumber}...`,
    );
    await this.prismaClient.sc_ticket_data.create({
      data: {
        tasks_id: scTicketData.taskId,
        ticket_number: scTicketData.ticketNumber,
      },
    });
    this.logger.log(
      'info',
      `Inserted SC ticket data ${scTicketData.ticketNumber}`,
    );
  }
}
