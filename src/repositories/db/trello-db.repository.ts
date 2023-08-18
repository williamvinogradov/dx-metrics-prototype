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

@Injectable()
export class TrelloDbRepository {
  constructor(private prismaClient: PrismaClient, private logger: Logger) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  async upsertLabels(labels: TrelloLabel[]): Promise<void> {
    this.logger.log('info', `Upserting trello labels in db...`);
    await asyncForEach(labels, async (label) => {
      await this.prismaClient.trello_labels.upsert({
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
    this.logger.log('info', `Upserted trello labels in db`);
  }

  async upsertMembers(members: TrelloMember[]): Promise<void> {
    this.logger.log('info', `Upserting trello members in db...`);
    await asyncForEach(members, async (member) => {
      await this.prismaClient.trello_members.upsert({
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
    this.logger.log('info', `Upserted trello members in db`);
  }

  async upsertLists(lists: TrelloList[]): Promise<void> {
    this.logger.log('info', 'Upserting trello lists in db...');
    await asyncForEach(lists, async (list) => {
      await this.prismaClient.trello_lists.upsert({
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
    this.logger.log('info', 'Upserted trello lists in db');
  }

  async upsertCustomFields(customFields: TrelloCustomField[]): Promise<void> {
    this.logger.log(
      'info',
      `Upserting ${customFields.length} trello custom fields...`,
    );
    await asyncForEach(customFields, async ({ id, name }) => {
      await this.prismaClient.trello_custom_fields.upsert({
        where: { trello_id: id },
        update: { name },
        create: { trello_id: id, name },
      });
    });
    this.logger.log(
      'info',
      `Upserted ${customFields.length} trello custom fields`,
    );
  }

  async selectTeamLists(
    boardId: string,
    options: {
      isProcessed?: boolean;
      listType?: TrelloListType;
    } = {},
  ): Promise<TrelloList[]> {
    this.logger.log(
      'info',
      `Selecting trello lists (board: ${boardId}) with options ${JSON.stringify(
        options,
      )} from db...`,
    );
    const requestOptions = {
      type: options.listType,
      is_processed: options.isProcessed,
    };
    return this.prismaClient.trello_lists
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
          'info',
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
  ): Promise<void> {
    this.logger.log(
      'info',
      `Updating trello lists ${listId} is processed: ${isProcessed}...`,
    );
    await this.prismaClient.trello_lists.update({
      where: { trello_id: listId },
      data: { is_processed: isProcessed },
    });
    this.logger.log(
      'info',
      `Updated trello lists ${listId} is processed: ${isProcessed}`,
    );
  }

  async upsertTrelloCard(
    taskId: string,
    cardFull: TrelloCardFull,
  ): Promise<void> {
    this.logger.log('info', 'Inserting trello card in db...');
    await this.prismaClient.trello_cards.upsert({
      where: { trello_id: cardFull.id },
      update: {
        board_id: cardFull.idBoard,
        score: cardFull.score,
      },
      create: {
        trello_id: cardFull.id,
        task_id: taskId,
        board_id: cardFull.idBoard,
        score: cardFull.score,
        done_time: cardFull.doneTime,
        duration_minutes: cardFull.durationInMinutes ?? 0,
      },
    });
    this.logger.log('info', 'Inserted trello card in db');
  }

  async selectTrelloCardTaskId(cardId: string): Promise<string | null> {
    this.logger.log('info', `Selecting the trello card ${cardId} task id...`);
    const card = await this.prismaClient.trello_cards.findFirst({
      where: { trello_id: cardId },
    });

    if (!card) {
      this.logger.log(
        'info',
        `The trello card ${cardId} task id doesn't found.`,
      );

      return null;
    }

    this.logger.log(
      'info',
      `The trello card ${cardId} task id: ${card.task_id}`,
    );

    return card.task_id;
  }

  async insertTrelloCardLabels(
    cardId: string,
    labelIds: string[],
  ): Promise<void> {
    this.logger.log(
      'info',
      'Inserting trello card -> labels relations in db...',
    );
    await this.prismaClient.trello_card_label_relation.createMany({
      data: labelIds.map((labelId) => ({
        trello_card_id: cardId,
        trello_label_id: labelId,
      })),
    });
    this.logger.log('info', 'Inserted trello card -> labels relations in db');
  }

  async deleteTrelloCardLabels(cardId: string): Promise<void> {
    this.logger.log('info', `Deleting trello card ${cardId} labels...`);
    await this.prismaClient.trello_card_label_relation.deleteMany({
      where: { trello_card_id: cardId },
    });
    this.logger.log('info', `Deleted trello card ${cardId} labels`);
  }

  async insertTrelloCardMembers(
    cardId: string,
    memberIds: string[],
  ): Promise<void> {
    this.logger.log(
      'info',
      'Inserting trello card -> members relations in db...',
    );
    await this.prismaClient.trello_card_member_relation.createMany({
      data: memberIds.map((memberId) => ({
        trello_card_id: cardId,
        trello_member_id: memberId,
      })),
    });
    this.logger.log('info', 'Inserted trello card -> members relations in db');
  }

  async deleteTrelloCardMembers(cardId: string): Promise<void> {
    this.logger.log('info', `Deleting trello card ${cardId} members...`);
    await this.prismaClient.trello_card_member_relation.deleteMany({
      where: { trello_card_id: cardId },
    });
    this.logger.log('info', `Deleted trello card ${cardId} members`);
  }

  async insertTrelloCardHistory(
    cardId: string,
    historyItems: TrelloCardHistoryItem[],
  ): Promise<void> {
    this.logger.log('info', 'Inserting trello card history in db...');
    await this.prismaClient.trello_card_history.createMany({
      data: historyItems.map((history) => ({
        trello_card_id: cardId,
        trello_list_id: history.listId,
        start_time: history.startTime,
        end_time: history.endTime,
        duration_minutes: history.durationInMinutes,
      })),
    });
    this.logger.log('info', 'Inserted trello card history in db');
  }

  async deleteTrelloCardHistory(cardId: string): Promise<void> {
    this.logger.log('info', `Deleting trello card ${cardId} history...`);
    await this.prismaClient.trello_card_history.deleteMany({
      where: { trello_card_id: cardId },
    });
    this.logger.log('info', `Deleted trello card ${cardId} history`);
  }

  async insertTrelloCardCustomFieldsData(
    cardId: string,
    customFieldsData: TrelloCardCustomFieldData[],
  ): Promise<void> {
    this.logger.log(
      'info',
      `Inserting trello card ${cardId} custom fields data...`,
    );
    await this.prismaClient.trello_card_custom_field_data.createMany({
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
      'info',
      `Inserted trello card ${cardId} custom fields data`,
    );
  }

  async deleteTrelloCardCustomFieldsData(cardId: string): Promise<void> {
    this.logger.log(
      'info',
      `Deleting trello card ${cardId} custom fields data...`,
    );
    await this.prismaClient.trello_card_custom_field_data.deleteMany({
      where: { trello_card_id: cardId },
    });
    this.logger.log('info', `Deleted trello card ${cardId} custom fields data`);
  }
}
