import { Controller, Put } from '@nestjs/common';
import {
  Dispatcher,
  TrelloUpdateLabelsCommand,
  TrelloUpdateMembersCommand,
  TrelloUpdateListsCommand,
  TrelloUpdateCardsCommand,
} from '../domain';
import { TrelloTeamSettingsDbRepository } from '../repositories/db';

@Controller()
export class TrelloDataApiController {
  constructor(
    private readonly teamSettingRepo: TrelloTeamSettingsDbRepository,
    private readonly dispatcher: Dispatcher,
  ) {}

  @Put('/api/v1/trello/labels')
  async putLabels(): Promise<string> {
    const settings = await this.teamSettingRepo.selectAllTeamsSettings();

    settings.forEach(({ boardId }) => {
      this.dispatcher.dispatch(new TrelloUpdateLabelsCommand(boardId));
    });

    return 'OK';
  }

  @Put('/api/v1/trello/members')
  async putMembers(): Promise<string> {
    const settings = await this.teamSettingRepo.selectAllTeamsSettings();

    settings.forEach(({ boardId }) => {
      this.dispatcher.dispatch(new TrelloUpdateMembersCommand(boardId));
    });

    return 'OK';
  }

  @Put('/api/v1/trello/lists')
  async putLists(): Promise<string> {
    const settings = await this.teamSettingRepo.selectAllTeamsSettings();

    settings.forEach(({ boardId, workListRegExp, doneListRegExp }) => {
      this.dispatcher.dispatch(
        new TrelloUpdateListsCommand(boardId, workListRegExp, doneListRegExp),
      );
    });

    return 'OK';
  }

  @Put('/api/v1/trello/cards')
  async putCards(): Promise<string> {
    const settings = await this.teamSettingRepo.selectAllTeamsSettings();

    settings.forEach(({ boardId, nameScRegExp }) => {
      this.dispatcher.dispatch(
        new TrelloUpdateCardsCommand(boardId, nameScRegExp),
      );
    });

    return 'OK';
  }
}
