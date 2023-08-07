import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { TrelloDbRepository } from '../../repositories/db';
import { TrelloApiRepository } from '../../repositories/trello-api';
import { Command, CommandHandler } from './core';

export class TrelloUpdateLabelsCommand extends Command {
  constructor(public readonly boardId: string) {
    super();
  }
}

@Injectable()
export class TrelloUpdateLabelsCommandHandler extends CommandHandler<TrelloUpdateLabelsCommand> {
  constructor(
    private readonly trelloDbRepo: TrelloDbRepository,
    private readonly trelloApiRepo: TrelloApiRepository,
    logger: Logger,
  ) {
    super(logger);
  }

  async handleImplementation({
    boardId,
  }: TrelloUpdateLabelsCommand): Promise<void> {
    const labels = await this.trelloApiRepo.getBoardLabels(boardId);
    await this.trelloDbRepo.upsertLabels(labels);
  }
}
