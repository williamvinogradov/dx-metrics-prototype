import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { DbRepository } from '../../repositories/db';
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
    private readonly dbRepo: DbRepository,
    private readonly trelloApiRepo: TrelloApiRepository,
    logger: Logger,
  ) {
    super(logger);
  }

  async handleImplementation({
    boardId,
  }: TrelloUpdateLabelsCommand): Promise<void> {
    this.logger.log(
      'verbose',
      `Updating labels for trello board ${boardId}...`,
    );

    const labels = await this.trelloApiRepo.getBoardLabels(boardId);

    this.logger.log(
      'verbose',
      `Received ${labels.length} labels from trello board ${boardId}`,
    );

    await this.dbRepo.trello.upsertLabels(labels);

    this.logger.log('verbose', `Updated labels for trello board ${boardId}`);
  }
}
