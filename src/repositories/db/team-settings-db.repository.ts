import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { TeamSettings } from '../../domain';
import { TransactionPrismaClient } from './types';

@Injectable()
export class TeamSettingsDbRepository {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly logger: Logger,
  ) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  async selectTeamsSettings(
    teamName: string,
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<TeamSettings[]> {
    this.logger.log(
      'verbose',
      `Selecting the ${teamName} team trello settings from db...`,
    );

    const selectResult = await dbClient.teams.findFirst({
      where: { team_name: teamName },
      include: {
        team_settings: true,
      },
    });

    const teamSettings =
      selectResult?.team_settings.map((setting) => ({
        boardId: setting.trello_board_id,
        workListRegExp: new RegExp(setting.trello_work_list_name_reg_exp),
        doneListRegExp: new RegExp(setting.trello_done_list_name_reg_exp),
        nameScRegExp: new RegExp(setting.trello_name_sc_ticket_reg_exp),
        teamName: selectResult.team_name,
      })) ?? [];

    this.logger.log(
      'verbose',
      `Selected the ${
        teamSettings.length
      } ${teamName} team trello settings: ${JSON.stringify(teamSettings)}`,
    );

    return teamSettings;
  }
}
