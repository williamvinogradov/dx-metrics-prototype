import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { TrelloTeamSettings } from '../../domain';

@Injectable()
export class TrelloTeamSettingsDbRepository {
  constructor(private prismaClient: PrismaClient, private logger: Logger) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  async selectAllTeamsSettings(): Promise<TrelloTeamSettings[]> {
    this.logger.log('info', 'Selecting trello team settings from db...');
    return await this.prismaClient.trello_team_settings
      .findMany()
      .then((teamSettings) => {
        const result = teamSettings.map((settings) => ({
          boardId: settings.board_id,
          nameScRegExp: new RegExp(settings.trello_name_sc_ticket_reg_exp),
          workListRegExp: new RegExp(settings.work_list_name_reg_exp),
          doneListRegExp: new RegExp(settings.done_list_name_reg_exp),
        }));
        this.logger.log('info', 'Selected trello team settings.');
        return result;
      });
  }
}
