// NOTE: Documentation: https://www.prisma.io/docs/guides/migrate/seed-database
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

const main = async () => {
  await prismaClient.trello_team_settings.upsert({
    where: { board_id: '52ae0ac87505547d150173e6' },
    update: {
      done_list_name_reg_exp: 'Done',
      work_list_name_reg_exp:
        'Sprint planned|Waiting|Doing|Review|Ready to merge',
      trello_name_sc_ticket_reg_exp: 'T\\d{4,8}',
    },
    create: {
      board_id: '52ae0ac87505547d150173e6',
      done_list_name_reg_exp: 'Done',
      work_list_name_reg_exp:
        'Sprint planned|Waiting|Doing|Review|Ready to merge',
      trello_name_sc_ticket_reg_exp: 'T\\d{4,8}',
    },
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
