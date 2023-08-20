import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { DbRepository } from '../../repositories/db';
import { TrelloApiRepository } from '../../repositories/trello-api';
import { Command, CommandHandler } from './core';

export class TrelloUpdateCustomFieldsCommand extends Command {
  constructor(public readonly boardId: string) {
    super();
  }
}

@Injectable()
export class TrelloUpdateCustomFieldsCommandHandler extends CommandHandler<TrelloUpdateCustomFieldsCommand> {
  constructor(
    private readonly trelloApiRepo: TrelloApiRepository,
    private readonly dbRepo: DbRepository,
    logger: Logger,
  ) {
    super(logger);
  }

  protected async handleImplementation({
    boardId,
  }: TrelloUpdateCustomFieldsCommand): Promise<void> {
    this.logger.log(
      'verbose',
      `Updating custom fields for trello board ${boardId}...`,
    );

    const customFields = await this.trelloApiRepo.getBoardCustomFields(boardId);

    this.logger.log(
      'verbose',
      `Received ${customFields.length} custom fields from trello board ${boardId}`,
    );

    await this.dbRepo.trello.upsertCustomFields(customFields);

    this.logger.log(
      'verbose',
      `Updated custom fields for trello board ${boardId}`,
    );
  }
}
