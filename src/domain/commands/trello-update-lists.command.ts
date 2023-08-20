import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { DbRepository } from '../../repositories/db';
import { TrelloApiRepository } from '../../repositories/trello-api';
import { Command, CommandHandler } from './core';

export class TrelloUpdateListsCommand extends Command {
  constructor(
    public readonly boardId: string,
    public readonly workListRegExp: RegExp,
    public readonly doneListRegExp: RegExp,
  ) {
    super();
  }
}

@Injectable()
export class TrelloUpdateListsCommandHandler extends CommandHandler<TrelloUpdateListsCommand> {
  constructor(
    private readonly dbRepo: DbRepository,
    private readonly trelloApiRepo: TrelloApiRepository,
    logger: Logger,
  ) {
    super(logger);
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  async handleImplementation({
    boardId,
    workListRegExp,
    doneListRegExp,
  }: TrelloUpdateListsCommand): Promise<void> {
    this.logger.log('verbose', `Updating lists for trello board ${boardId}...`);

    const lists = await this.trelloApiRepo.getBoardLists(
      boardId,
      workListRegExp,
      doneListRegExp,
    );

    this.logger.log(
      'verbose',
      `Received ${lists.length} lists from trello board ${boardId}`,
    );

    await this.dbRepo.trello.upsertLists(lists);

    this.logger.log('verbose', `Updated lists for trello board ${boardId}`);
  }
}
