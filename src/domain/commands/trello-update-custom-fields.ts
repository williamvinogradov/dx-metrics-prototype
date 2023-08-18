import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { TrelloDbRepository } from '../../repositories/db';
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
    private readonly trelloDbRepo: TrelloDbRepository,
    private readonly trelloApiRepo: TrelloApiRepository,
    logger: Logger,
  ) {
    super(logger);
  }

  protected async handleImplementation({
    boardId,
  }: TrelloUpdateCustomFieldsCommand): Promise<void> {
    const customFields = await this.trelloApiRepo.getBoardCustomFields(boardId);
    await this.trelloDbRepo.upsertCustomFields(customFields);
  }
}
