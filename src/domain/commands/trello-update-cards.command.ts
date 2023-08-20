import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { DbRepository, TransactionPrismaClient } from '../../repositories/db';
import { TrelloApiRepository } from '../../repositories/trello-api';
import { asyncForEach } from '../../utils';
import {
  TaskScTicketData,
  TrelloCard,
  TrelloCardCustomFieldData,
  TrelloCardHistoryData,
  TrelloCardHistoryItem,
  TrelloCardPluginData,
  TrelloList,
  TrelloListType,
} from '../model';
import { TrelloCardHistoryConverter } from '../trello-card-history.converter';
import { Command, CommandHandler } from './core';

export class TrelloUpdateCardsCommand extends Command {
  constructor(
    public readonly boardId: string,
    public readonly nameScRegExp: RegExp,
  ) {
    super();
  }
}

interface HandleContext {
  command: TrelloUpdateCardsCommand;
  lists: TrelloList[];
}

interface CardTrelloData {
  pluginsData: TrelloCardPluginData;
  history: [
    cardHistoryData: TrelloCardHistoryData,
    cardHistoryItems: TrelloCardHistoryItem[],
  ];
  customFieldsData: TrelloCardCustomFieldData[];
}

interface CardHandleContext extends HandleContext {
  dbClient: TransactionPrismaClient;
  cardTrelloData: CardTrelloData;
}

@Injectable()
export class TrelloUpdateCardsCommandHandler extends CommandHandler<TrelloUpdateCardsCommand> {
  constructor(
    private readonly dbRepo: DbRepository,
    private readonly trelloApiRepo: TrelloApiRepository,
    private readonly historyConverter: TrelloCardHistoryConverter,
    logger: Logger,
  ) {
    super(logger);
  }

  async handleImplementation(command: TrelloUpdateCardsCommand): Promise<void> {
    this.logger.log(
      'verbose',
      `Start processing cards from the board ${command.boardId}...`,
    );

    const allLists = await this.dbRepo.trello.selectTeamLists(command.boardId, {
      isProcessed: false,
    });
    const doneLists = allLists.filter(
      ({ type }) => type === TrelloListType.done,
    );

    this.logger.log(
      'verbose',
      `Received ${doneLists.length} unprocessed done lists from the board ${command.boardId}`,
    );

    if (!doneLists.length) {
      this.logger.log(
        'info',
        `The board ${command.boardId} doesn't contains unprocessed done lists. There is nothing to process.`,
      );

      return;
    }

    const handleContext = { command, lists: allLists };

    await asyncForEach(doneLists, async (list) => {
      await this.processListCards(list, handleContext);
      await this.dbRepo.trello.updateListProcessedStatus(list.id, true);

      this.logger.log(
        'verbose',
        `The list ${this.getListLogInfo(list)} marked as processed`,
      );
    });

    this.logger.log(
      'verbose',
      `Cards from the board ${command.boardId} processed`,
    );
  }

  private async processListCards(
    list: TrelloList,
    handleContext: HandleContext,
  ): Promise<void> {
    try {
      this.logger.log(
        'verbose',
        `Start processing list ${this.getListLogInfo(list)} cards...`,
      );

      const cards = await this.trelloApiRepo.getListCards(list.id);

      this.logger.log(
        'verbose',
        `Received ${cards.length} cards from the list ${this.getListLogInfo(
          list,
        )}`,
      );

      let processedCardsCount = 0;
      let failedCardsCount = 0;
      await asyncForEach(cards, async (card) => {
        const result = await this.processCard(card, handleContext);

        if (result) {
          processedCardsCount += 1;
        } else {
          failedCardsCount += 1;
        }
      });

      this.logger.log(
        'info',
        `The list ${this.getListLogInfo(list)} cards processed.\n\
         Processed cards: ${processedCardsCount}.\n\
         Failed cards: ${failedCardsCount}.`,
      );
    } catch (error) {
      this.logger.log(
        'warn',
        `Failed to process the list ${this.getListLogInfo(list)}: `,
        error,
      );
    }
  }

  private async processCard(
    card: TrelloCard,
    handleContext: HandleContext,
  ): Promise<boolean> {
    try {
      this.logger.log(
        'verbose',
        `Start processing the card ${this.getCardLogInfo(card)}...`,
      );

      // NOTE: It's important to don't do any API requests inside the db transaction!
      const cardTrelloData = await this.getCardTrelloData(card, handleContext);
      const taskId = await this.dbRepo.trello.selectTrelloCardTaskId(card.id);

      await this.dbRepo.$transaction<void>(async (dbClient) => {
        const cardHandleContext = {
          ...handleContext,
          dbClient,
          cardTrelloData,
        };

        if (taskId) {
          this.logger.log(
            'verbose',
            `The card ${this.getCardLogInfo(card)} already exists in the db.`,
          );

          await this.processExistingCard(taskId, card, cardHandleContext);
        } else {
          this.logger.log(
            'verbose',
            `The card ${this.getCardLogInfo(card)} doesn't exists in the db`,
          );

          await this.processNewCard(card, cardHandleContext);
        }
      });

      this.logger.log(
        'verbose',
        `The card ${this.getCardLogInfo(card)} is processed`,
      );

      return true;
    } catch (error) {
      this.logger.log(
        'warn',
        `Failed to process the card ${this.getCardLogInfo(card)}: `,
        error,
      );

      return false;
    }
  }

  private async getCardTrelloData(
    card: TrelloCard,
    handleContext: HandleContext,
  ): Promise<CardTrelloData> {
    this.logger.log(
      'verbose',
      `Getting the card ${this.getCardLogInfo(
        card,
      )} related data from trello...`,
    );

    const [pluginsData, [historyData, historyItems], customFieldsData] =
      await Promise.all([
        this.trelloApiRepo.getCardPluginData(card.id),
        this.getTrelloCardHistory(card, handleContext),
        this.trelloApiRepo.getCardCustomFieldsData(card.id),
      ]);

    this.logger.log(
      'verbose',
      `Received the card ${this.getCardLogInfo(card)} related data from trello`,
    );

    return {
      pluginsData,
      history: [historyData, historyItems],
      customFieldsData,
    };
  }

  private async processNewCard(
    card: TrelloCard,
    cardHandleContext: CardHandleContext,
  ): Promise<void> {
    const [scTicketNumber, scTicketData] = await this.findScData(
      card,
      cardHandleContext,
    );

    const taskId = scTicketData
      ? scTicketData.taskId
      : await this.dbRepo.task.insertTask();

    if (scTicketNumber && !scTicketData) {
      await this.dbRepo.sc.insertScTicketData({
        taskId,
        ticketNumber: scTicketNumber,
      });
    }

    await this.insertTrelloData(taskId, card, cardHandleContext);
  }

  private async processExistingCard(
    taskId: string,
    card: TrelloCard,
    cardHandleContext: CardHandleContext,
  ): Promise<void> {
    const { dbClient } = cardHandleContext;

    this.logger.log(
      'verbose',
      `Clearing the card ${this.getCardLogInfo(card)} related data...`,
    );

    await this.dbRepo.trello.deleteTrelloCardMembers(card.id, dbClient);
    await this.dbRepo.trello.deleteTrelloCardLabels(card.id, dbClient);
    await this.dbRepo.trello.deleteTrelloCardHistory(card.id, dbClient);
    await this.dbRepo.trello.deleteTrelloCardCustomFieldsData(
      card.id,
      dbClient,
    );

    this.logger.log(
      'verbose',
      `The card ${this.getCardLogInfo(card)} related data is cleared`,
    );

    await this.insertTrelloData(taskId, card, cardHandleContext);
  }

  private async insertTrelloData(
    taskId: string,
    card: TrelloCard,
    cardHandleContext: CardHandleContext,
  ): Promise<void> {
    const {
      dbClient,
      cardTrelloData: {
        pluginsData,
        history: [historyData, historyItems],
        customFieldsData,
      },
    } = cardHandleContext;

    await this.dbRepo.trello.upsertTrelloCard(
      taskId,
      {
        ...card,
        ...pluginsData,
        ...historyData,
      },
      dbClient,
    );
    await this.dbRepo.trello.insertTrelloCardMembers(
      card.id,
      card.idMembers,
      dbClient,
    );
    await this.dbRepo.trello.insertTrelloCardLabels(
      card.id,
      card.idLabels,
      dbClient,
    );
    await this.dbRepo.trello.insertTrelloCardHistory(
      card.id,
      historyItems,
      dbClient,
    );
    await this.dbRepo.trello.insertTrelloCardCustomFieldsData(
      card.id,
      customFieldsData,
      dbClient,
    );

    this.logger.log(
      'verbose',
      `The card ${this.getCardLogInfo(
        card,
      )} related data from trello inserted in the db`,
    );
  }

  private async getTrelloCardHistory(
    card: TrelloCard,
    handleContext: HandleContext,
  ): Promise<
    [historyData: TrelloCardHistoryData, historyItems: TrelloCardHistoryItem[]]
  > {
    const { lists } = handleContext;
    const cardMoves = await this.trelloApiRepo.getCardMoveHistory(card.id);

    this.logger.log(
      'verbose',
      `Received the card ${this.getCardLogInfo(card)} ${
        cardMoves.length
      } move history items`,
    );

    const cardHistory = this.historyConverter.convert(card, lists, cardMoves);

    this.logger.log(
      'verbose',
      `The card ${this.getCardLogInfo(card)} moving history: ${JSON.stringify(
        cardHistory,
      )}`,
    );

    return cardHistory;
  }

  private async findScData(
    card: TrelloCard,
    cardHandleContext: CardHandleContext,
  ): Promise<
    [scTicketnumber: string | null, scTicketData: TaskScTicketData | null]
  > {
    const {
      command: { nameScRegExp },
    } = cardHandleContext;
    const scTicketNumber = this.tryGetScTicketFromTrelloCard(
      card,
      nameScRegExp,
    );

    if (!scTicketNumber) {
      return [null, null];
    }

    const scTicketData = await this.getScTicketData(
      scTicketNumber,
      cardHandleContext,
    );

    return [scTicketNumber, scTicketData];
  }

  private async getScTicketData(
    scTicketNumber: string | null,
    { dbClient }: CardHandleContext,
  ): Promise<TaskScTicketData | null> {
    return scTicketNumber
      ? await this.dbRepo.sc.selectScDataByTicketNumber(
          scTicketNumber,
          dbClient,
        )
      : null;
  }

  private tryGetScTicketFromTrelloCard(
    { name }: TrelloCard,
    nameScRegExp: RegExp,
  ): string | null {
    const ticketIdFromNameMatch = name.match(nameScRegExp);
    return ticketIdFromNameMatch ? ticketIdFromNameMatch[0] : null;
  }

  private getListLogInfo(list: TrelloList): string {
    return `"${list.name} (id: ${list.id})"`;
  }

  private getCardLogInfo(card: TrelloCard): string {
    return `"${card.name} (id: ${card.id})"`;
  }
}
