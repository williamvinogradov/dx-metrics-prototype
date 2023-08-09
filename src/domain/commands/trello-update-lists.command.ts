import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { TrelloDbRepository } from '../../repositories/db';
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
    private readonly trelloDbRepo: TrelloDbRepository,
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
    const lists = await this.trelloApiRepo.getBoardLists(
      boardId,
      workListRegExp,
      doneListRegExp,
    );
    await this.trelloDbRepo.upsertLists(lists);
  }
}
