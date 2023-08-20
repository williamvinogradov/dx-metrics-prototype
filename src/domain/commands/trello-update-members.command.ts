import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { DbRepository } from '../../repositories/db';
import { TrelloApiRepository } from '../../repositories/trello-api';
import { Command, CommandHandler } from './core';

export class TrelloUpdateMembersCommand extends Command {
  constructor(public readonly boardId: string) {
    super();
  }
}

@Injectable()
export class TrelloUpdateMembersCommandHandler extends CommandHandler<TrelloUpdateMembersCommand> {
  constructor(
    private readonly dbRepo: DbRepository,
    private readonly trelloApiRepo: TrelloApiRepository,
    logger: Logger,
  ) {
    super(logger);
  }

  async handleImplementation({
    boardId,
  }: TrelloUpdateMembersCommand): Promise<void> {
    this.logger.log(
      'verbose',
      `Updating members for trello board ${boardId}...`,
    );

    const members = await this.trelloApiRepo.getBoardMembers(boardId);

    this.logger.log(
      'verbose',
      `Received ${members.length} members from trello board ${boardId}`,
    );

    await this.dbRepo.trello.upsertMembers(members);

    this.logger.log('verbose', `Updated members for trello board ${boardId}`);
  }
}
