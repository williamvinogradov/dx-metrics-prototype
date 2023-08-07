import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { TrelloDbRepository } from '../../repositories/db';
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
    private readonly trelloDbRepo: TrelloDbRepository,
    private readonly trelloApiRepo: TrelloApiRepository,
    logger: Logger,
  ) {
    super(logger);
  }

  async handleImplementation({
    boardId,
  }: TrelloUpdateMembersCommand): Promise<void> {
    const members = await this.trelloApiRepo.getBoardMembers(boardId);
    await this.trelloDbRepo.upsertMembers(members);
  }
}
