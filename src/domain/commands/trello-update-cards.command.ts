import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import {
  ScDbRepository,
  TaskDbRepository,
  TrelloDbRepository,
} from '../../repositories/db';
import { TrelloApiRepository } from '../../repositories/trello-api';
import { asyncForEach } from '../../utils';
import {
  TaskScTicketData,
  TrelloCard,
  TrelloCardHistoryData,
  TrelloCardHistoryItem,
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

@Injectable()
export class TrelloUpdateCardsCommandHandler extends CommandHandler<TrelloUpdateCardsCommand> {
  constructor(
    private readonly trelloDbRepo: TrelloDbRepository,
    private readonly trelloApiRepo: TrelloApiRepository,
    private readonly scDbRepo: ScDbRepository,
    private readonly taskDbRepo: TaskDbRepository,
    private readonly historyConverter: TrelloCardHistoryConverter,
    logger: Logger,
  ) {
    super(logger);
  }

  async handleImplementation(command: TrelloUpdateCardsCommand): Promise<void> {
    const lists = await this.trelloDbRepo.selectTeamLists(command.boardId, {
      isProcessed: false,
    });
    const handleContext = { command, lists };

    await asyncForEach(
      lists.filter(({ type }) => type === TrelloListType.done),
      async ({ id }) => {
        await this.processListCards(id, handleContext);
        await this.trelloDbRepo.updateListProcessedStatus(id, true);
      },
    );
  }

  private async processListCards(
    listId: string,
    handleContext: HandleContext,
  ): Promise<void> {
    try {
      const cards = await this.trelloApiRepo.getListCards(listId);
      await asyncForEach(cards, async (card) =>
        this.processCard(card, handleContext),
      );
      this.logger.log('info', `List ${listId} processed`);
    } catch (error) {
      this.logger.log('error', `Failed to process list ${listId}: `, error);
    }
  }

  private async processCard(
    card: TrelloCard,
    handleContext: HandleContext,
  ): Promise<void> {
    try {
      const taskId = await this.trelloDbRepo.selectTrelloCardTaskId(card.id);

      if (taskId) {
        await this.processExistingCard(taskId, card, handleContext);
      } else {
        await this.processNewCard(card, handleContext);
      }

      this.logger.log('info', `Card ${card.id} processed`);
    } catch (error) {
      this.logger.log('error', `Failed to process card ${card.id}: `, error);
    }
  }

  private async processNewCard(
    card: TrelloCard,
    handleContext: HandleContext,
  ): Promise<void> {
    const [scTicketNumber, scTicketData] = await this.findScData(
      card,
      handleContext.command.nameScRegExp,
    );
    const taskId = scTicketData
      ? scTicketData.taskId
      : await this.taskDbRepo.insertTask();

    if (scTicketNumber && !scTicketData) {
      await this.scDbRepo.insertScTicketData({
        taskId,
        ticketNumber: scTicketNumber,
      });
    }

    await this.insertTrelloData(taskId, card, handleContext);
  }

  private async processExistingCard(
    taskId: string,
    card: TrelloCard,
    handleContext: HandleContext,
  ): Promise<void> {
    await this.trelloDbRepo.deleteTrelloCardMembers(card.id);
    await this.trelloDbRepo.deleteTrelloCardLabels(card.id);
    await this.trelloDbRepo.deleteTrelloCardHistory(card.id);

    await this.insertTrelloData(taskId, card, handleContext);
  }

  private async insertTrelloData(
    taskId: string,
    card: TrelloCard,
    handleContext: HandleContext,
  ): Promise<void> {
    const cardPluginData = await this.trelloApiRepo.getCardPluginData(card.id);
    const [cardHistoryData, cardHistoryItems] = await this.getTrelloCardHistory(
      card,
      handleContext,
    );

    await this.trelloDbRepo.upsertTrelloCard(taskId, {
      ...card,
      ...cardPluginData,
      ...cardHistoryData,
    });
    await this.trelloDbRepo.insertTrelloCardMembers(card.id, card.idMembers);
    await this.trelloDbRepo.insertTrelloCardLabels(card.id, card.idLabels);
    await this.trelloDbRepo.insertTrelloCardHistory(card.id, cardHistoryItems);
  }

  private async getTrelloCardHistory(
    card: TrelloCard,
    handleContext: HandleContext,
  ): Promise<
    [historyData: TrelloCardHistoryData, historyItems: TrelloCardHistoryItem[]]
  > {
    const { lists } = handleContext;
    const cardMoves = await this.trelloApiRepo.getCardMoveHistory(card.id);

    return this.historyConverter.convert(card, lists, cardMoves);
  }

  private async findScData(
    card: TrelloCard,
    nameScRegExp: RegExp,
  ): Promise<
    [scTicketnumber: string | null, scTicketData: TaskScTicketData | null]
  > {
    const scTicketNumber = this.tryGetScTicketFromTrelloCard(
      card,
      nameScRegExp,
    );

    if (!scTicketNumber) {
      return [null, null];
    }

    const scTicketData = await this.getScTicketData(scTicketNumber);
    return [scTicketNumber, scTicketData];
  }

  private async getScTicketData(
    scTicketNumber: string | null,
  ): Promise<TaskScTicketData | null> {
    return scTicketNumber
      ? await this.scDbRepo.selectScDataByTicketNumber(scTicketNumber)
      : null;
  }

  private tryGetScTicketFromTrelloCard(
    { name }: TrelloCard,
    nameScRegExp: RegExp,
  ): string | null {
    const ticketIdFromNameMatch = name.match(nameScRegExp);
    return ticketIdFromNameMatch ? ticketIdFromNameMatch[0] : null;
  }
}
