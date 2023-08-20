// NOTE: Documentation: https://www.prisma.io/docs/guides/migrate/seed-database
import { PrismaClient } from '@prisma/client';
import { asyncForEach } from '../src/utils';

const prismaClient = new PrismaClient();

const TEAMS = {
  grids: 'grids',
};
const TEAM_DEFAULT_SETTINGS = {
  [TEAMS.grids]: [
    {
      trello_board_id: '52ae0ac87505547d150173e6',
      trello_done_list_name_reg_exp: 'Done',
      trello_work_list_name_reg_exp: 'Waiting|Doing|Review|Ready to merge',
      trello_name_sc_ticket_reg_exp: 'T\\d{4,8}',
    },
  ],
};

const main = async () => {
  await prismaClient.team_settings.deleteMany();
  await prismaClient.teams.deleteMany();

  // NOTE: Sqlserver specific reset autoincrement.
  await prismaClient.$queryRaw`DBCC CHECKIDENT (teams, RESEED, 0); DBCC CHECKIDENT (team_settings, RESEED, 0);`;

  await asyncForEach(Object.values(TEAMS), async (team) => {
    await prismaClient.teams.create({
      data: {
        team_name: team,
        team_settings: {
          createMany: {
            data: TEAM_DEFAULT_SETTINGS[team],
          },
        },
      },
      include: {
        team_settings: true,
      },
    });
  });
};

main()
  .then(async () => {
    await prismaClient.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prismaClient.$disconnect();
    process.exit(1);
  });
