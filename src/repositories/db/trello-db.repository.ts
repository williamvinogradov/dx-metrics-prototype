import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import {
  TrelloCardCustomFieldData,
  TrelloCardFull,
  TrelloCardHistoryItem,
  TrelloCustomField,
  TrelloLabel,
  TrelloList,
  TrelloListType,
  TrelloMember,
} from '../../domain';
import { asyncForEach } from '../../utils';
import { TransactionPrismaClient } from './types';

@Injectable()
export class TrelloDbRepository {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly logger: Logger,
  ) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  async upsertLabels(
    labels: TrelloLabel[],
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log(
      'verbose',
      `Upserting ${labels.length} trello labels in db...`,
    );

    await asyncForEach(labels, async (label) => {
      await dbClient.trello_labels.upsert({
        where: { trello_id: label.id },
        update: {
          name: label.name,
        },
        create: {
          trello_id: label.id,
          trello_board_id: label.idBoard,
          name: label.name,
        },
      });
    });

    this.logger.log('verbose', `Upserted ${labels.length} trello labels in db`);
  }

  async upsertMembers(
    members: TrelloMember[],
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log(
      'verbose',
      `Upserting ${members.length} trello members in db...`,
    );

    await asyncForEach(members, async (member) => {
      await dbClient.trello_members.upsert({
        where: { trello_id: member.id },
        update: {
          full_name: member.fullName,
        },
        create: {
          trello_id: member.id,
          full_name: member.fullName,
          trello_name: member.username,
        },
      });
    });

    this.logger.log(
      'verbose',
      `Upserted ${members.length} trello members in db`,
    );
  }

  async upsertLists(
    lists: TrelloList[],
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log(
      'verbose',
      `Upserting ${lists.length} trello lists in db...`,
    );

    await asyncForEach(lists, async (list) => {
      await dbClient.trello_lists.upsert({
        where: { trello_id: list.id },
        update: {
          name: list.name,
          type: list.type,
        },
        create: {
          trello_id: list.id,
          name: list.name,
          type: list.type,
          is_processed: false,
          trello_board_id: list.idBoard,
        },
      });
    });

    this.logger.log('verbose', `Upserted ${lists.length} trello lists in db`);
  }

  async upsertCustomFields(
    customFields: TrelloCustomField[],
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log(
      'verbose',
      `Upserting ${customFields.length} trello custom fields...`,
    );

    await asyncForEach(customFields, async ({ id, name }) => {
      await dbClient.trello_custom_fields.upsert({
        where: { trello_id: id },
        update: { name },
        create: { trello_id: id, name },
      });
    });

    this.logger.log(
      'verbose',
      `Upserted ${customFields.length} trello custom fields`,
    );
  }

  async selectTeamLists(
    boardId: string,
    options: {
      isProcessed?: boolean;
      listType?: TrelloListType;
    } = {},
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<TrelloList[]> {
    this.logger.log(
      'verbose',
      `Selecting trello lists (board: ${boardId}) with options ${JSON.stringify(
        options,
      )} from db...`,
    );

    const requestOptions = {
      type: options.listType,
      is_processed: options.isProcessed,
    };

    return dbClient.trello_lists
      .findMany({
        where: {
          trello_board_id: boardId,
          ...requestOptions,
        },
      })
      .then((data) => {
        const result: TrelloList[] = data.map((list) => ({
          id: list.trello_id,
          name: list.name,
          type: list.type === 0 ? TrelloListType.work : TrelloListType.done,
          idBoard: list.trello_board_id,
        }));

        this.logger.log(
          'verbose',
          `Selected ${
            result.length
          } trello lists (board: ${boardId}) with options ${JSON.stringify(
            options,
          )} from db...`,
        );

        return result;
      });
  }

  async updateListProcessedStatus(
    listId: string,
    isProcessed: boolean,
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log(
      'verbose',
      `Updating trello lists ${listId} is processed: ${isProcessed}...`,
    );

    await dbClient.trello_lists.update({
      where: { trello_id: listId },
      data: { is_processed: isProcessed },
    });

    this.logger.log(
      'verbose',
      `Updated trello lists ${listId} is processed: ${isProcessed}`,
    );
  }

  async upsertTrelloCard(
    taskId: string,
    cardFull: TrelloCardFull,
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log('verbose', 'Inserting trello card in db...');

    await dbClient.trello_cards.upsert({
      where: { trello_id: cardFull.id },
      update: {
        board_id: cardFull.idBoard,
        score: cardFull.score,
        name: cardFull.name,
        short_url: cardFull.shortUrl,
      },
      create: {
        trello_id: cardFull.id,
        task_id: taskId,
        board_id: cardFull.idBoard,
        name: cardFull.name,
        short_url: cardFull.shortUrl,
        score: cardFull.score,
        done_time: cardFull.doneTime,
        duration_minutes: cardFull.durationInMinutes ?? 0,
      },
    });

    this.logger.log('verbose', 'Inserted trello card in db');
  }

  async selectTrelloCardTaskId(
    cardId: string,
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<string | null> {
    this.logger.log(
      'verbose',
      `Selecting the trello card ${cardId} task id...`,
    );

    const card = await dbClient.trello_cards.findFirst({
      where: { trello_id: cardId },
    });

    if (!card) {
      this.logger.log(
        'verbose',
        `The trello card ${cardId} task id doesn't found.`,
      );

      return null;
    }

    this.logger.log(
      'verbose',
      `The trello card ${cardId} task id: ${card.task_id}`,
    );

    return card.task_id;
  }

  async insertTrelloCardLabels(
    cardId: string,
    labelIds: string[],
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log(
      'verbose',
      'Inserting trello card -> labels relations in db...',
    );

    await dbClient.trello_card_label_relation.createMany({
      data: labelIds.map((labelId) => ({
        trello_card_id: cardId,
        trello_label_id: labelId,
      })),
    });

    this.logger.log(
      'verbose',
      'Inserted trello card -> labels relations in db',
    );
  }

  async deleteTrelloCardLabels(
    cardId: string,
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log('verbose', `Deleting trello card ${cardId} labels...`);

    await dbClient.trello_card_label_relation.deleteMany({
      where: { trello_card_id: cardId },
    });

    this.logger.log('verbose', `Deleted trello card ${cardId} labels`);
  }

  async insertTrelloCardMembers(
    cardId: string,
    memberIds: string[],
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log(
      'verbose',
      'Inserting trello card -> members relations in db...',
    );

    await dbClient.trello_card_member_relation.createMany({
      data: memberIds.map((memberId) => ({
        trello_card_id: cardId,
        trello_member_id: memberId,
      })),
    });

    this.logger.log(
      'verbose',
      'Inserted trello card -> members relations in db',
    );
  }

  async deleteTrelloCardMembers(
    cardId: string,
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log('verbose', `Deleting trello card ${cardId} members...`);

    await dbClient.trello_card_member_relation.deleteMany({
      where: { trello_card_id: cardId },
    });

    this.logger.log('verbose', `Deleted trello card ${cardId} members`);
  }

  async insertTrelloCardHistory(
    cardId: string,
    historyItems: TrelloCardHistoryItem[],
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log('verbose', 'Inserting trello card history in db...');

    await dbClient.trello_card_history.createMany({
      data: historyItems.map((history) => ({
        trello_card_id: cardId,
        trello_list_id: history.listId,
        start_time: history.startTime,
        end_time: history.endTime,
        duration_minutes: history.durationInMinutes,
      })),
    });

    this.logger.log('verbose', 'Inserted trello card history in db');
  }

  async deleteTrelloCardHistory(
    cardId: string,
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log('verbose', `Deleting trello card ${cardId} history...`);

    await dbClient.trello_card_history.deleteMany({
      where: { trello_card_id: cardId },
    });

    this.logger.log('verbose', `Deleted trello card ${cardId} history`);
  }

  async insertTrelloCardCustomFieldsData(
    cardId: string,
    customFieldsData: TrelloCardCustomFieldData[],
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log(
      'verbose',
      `Inserting trello card ${cardId} custom fields data...`,
    );

    await dbClient.trello_card_custom_field_data.createMany({
      data: customFieldsData.map((data) => {
        const valueNumber = Number.isNaN(data.value.number)
          ? null
          : Number(data.value.number);

        return {
          field_id: data.idCustomField,
          trello_card_id: cardId,
          value_number: valueNumber,
        };
      }),
    });

    this.logger.log(
      'verbose',
      `Inserted trello card ${cardId} custom fields data`,
    );
  }

  async deleteTrelloCardCustomFieldsData(
    cardId: string,
    dbClient: TransactionPrismaClient = this.prismaClient,
  ): Promise<void> {
    this.logger.log(
      'verbose',
      `Deleting trello card ${cardId} custom fields data...`,
    );

    await dbClient.trello_card_custom_field_data.deleteMany({
      where: { trello_card_id: cardId },
    });

    this.logger.log(
      'verbose',
      `Deleted trello card ${cardId} custom fields data`,
    );
  }
}
