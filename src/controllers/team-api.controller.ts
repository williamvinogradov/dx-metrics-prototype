import {
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Logger } from 'winston';
import {
  Dispatcher,
  TeamSettings,
  TrelloUpdateCardsCommand,
  TrelloUpdateLabelsCommand,
  TrelloUpdateListsCommand,
  TrelloUpdateMembersCommand,
  TrelloUpdateCustomFieldsCommand,
} from '../domain';
import { DbRepository } from '../repositories/db';

@Controller()
export class TeamApiController {
  constructor(
    private readonly dbRepo: DbRepository,
    private readonly dispatcher: Dispatcher,
    private readonly logger: Logger,
  ) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  @Post('/:teamName/dictionaries')
  async postDictionaries(@Param('teamName') teamName: string): Promise<string> {
    this.logger.log(
      'verbose',
      `Updating the ${teamName} team dictionaries request received`,
    );

    const settings = await this.getTeamSettings(teamName);

    this.logger.log(
      'verbose',
      `Dispatching the ${teamName} team dictionaries update commands...`,
    );

    settings.forEach(({ boardId, workListRegExp, doneListRegExp }) => {
      this.dispatcher.dispatch(new TrelloUpdateLabelsCommand(boardId));
      this.dispatcher.dispatch(new TrelloUpdateMembersCommand(boardId));
      this.dispatcher.dispatch(
        new TrelloUpdateListsCommand(boardId, workListRegExp, doneListRegExp),
      );
      this.dispatcher.dispatch(new TrelloUpdateCustomFieldsCommand(boardId));
    });

    this.logger.log(
      'verbose',
      `Dispatched the ${teamName} team dictionaries update commands`,
    );

    return `The next commands for the ${teamName} team added to the queue: [\
      TrelloUpdateLabelsCommand, \
      TrelloUpdateMembersCommand, \
      TrelloUpdateListsCommand, \
      TrelloUpdateCustomFieldsCommand\
    ]`;
  }

  @Post('/:teamName/cards')
  async postCards(@Param('teamName') teamName: string): Promise<string> {
    this.logger.log(
      'verbose',
      `Updating the ${teamName} team cards request received`,
    );

    const settings = await this.getTeamSettings(teamName);

    this.logger.log(
      'verbose',
      `Dispatching the ${teamName} team cards update commands...`,
    );

    settings.forEach(({ boardId, nameScRegExp }) => {
      this.dispatcher.dispatch(
        new TrelloUpdateCardsCommand(boardId, nameScRegExp),
      );
    });

    this.logger.log(
      'verbose',
      `Dispatched the ${teamName} team cards update commands`,
    );

    return `The TrelloUpdateCardsCommand for the ${teamName} team added to the queue.`;
  }

  private async getTeamSettings(teamName: string): Promise<TeamSettings[]> {
    const settings = await this.dbRepo.teamSettings.selectTeamsSettings(
      teamName,
    );

    if (!settings.length) {
      this.logger.log(
        'warn',
        `Settings for the ${teamName} team weren't found`,
      );

      throw new HttpException(
        `Settings for the ${teamName} team dictionaries update weren't found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return settings;
  }
}
