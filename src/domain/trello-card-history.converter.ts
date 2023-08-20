import { Injectable } from '@nestjs/common';
import {
  TrelloCard,
  TrelloCardHistoryData,
  TrelloCardHistoryItem,
  TrelloCardMoveAction,
  TrelloList,
} from './model';

const MS_IN_MINUTE = 60 * 1000;
const MINUTES_IN_DAY = 24 * 60;
enum Weekends {
  Sat = 6,
  Sun = 0,
}

@Injectable()
export class TrelloCardHistoryConverter {
  convert(
    card: TrelloCard,
    lists: TrelloList[],
    cardMoves: TrelloCardMoveAction[],
  ): [
    historyData: TrelloCardHistoryData,
    historyItems: TrelloCardHistoryItem[],
  ] {
    const historyItems = this.convertCardMovesToHistoryItems(
      card,
      lists,
      cardMoves,
    );

    if (!historyItems.length) {
      return this.convertEmptyMoveHistory(card);
    }

    const doneTime = historyItems[historyItems.length - 1].startTime;
    const durationInMinutes = historyItems.reduce(
      (result, { durationInMinutes }) => {
        result += durationInMinutes ?? 0;
        return result;
      },
      0,
    );

    return [
      {
        doneTime,
        durationInMinutes,
      },
      historyItems,
    ];
  }

  private convertEmptyMoveHistory(
    card: TrelloCard,
  ): [
    historyData: TrelloCardHistoryData,
    historyItems: TrelloCardHistoryItem[],
  ] {
    const doneTime = new Date(this.getMsFromTrelloItemId(card.id));
    return [
      // history data
      {
        doneTime,
        durationInMinutes: null,
      },
      [
        {
          cardId: card.id,
          listId: card.idList,
          startTime: new Date(this.getMsFromTrelloItemId(card.id)),
          endTime: null,
          durationInMinutes: null,
        },
      ],
    ];
  }

  private convertCardMovesToHistoryItems(
    card: TrelloCard,
    lists: TrelloList[],
    cardMoves: TrelloCardMoveAction[],
  ) {
    const listIdsSet = new Set(lists.map(({ id }) => id));

    return cardMoves.reduceRight<TrelloCardHistoryItem[]>((result, move) => {
      const listBeforeId = move.data.listBefore.id;
      const listAfterId = move.data.listAfter.id;
      const moveDate = new Date(move.date);

      if (!listIdsSet.has(listBeforeId) && !listIdsSet.has(listAfterId)) {
        return result;
      }

      if (!listIdsSet.has(listBeforeId)) {
        result.push({
          cardId: card.id,
          listId: listAfterId,
          startTime: this.normalizeActionDate(moveDate),
          endTime: null,
          durationInMinutes: null,
        });
        return result;
      }

      if (!result.length) {
        const startTime = new Date(this.getMsFromTrelloItemId(card.id));
        result.push({
          cardId: card.id,
          listId: listBeforeId,
          startTime: this.normalizeActionDate(startTime),
          endTime: null,
          durationInMinutes: null,
        });
      }

      const lastItem = result[result.length - 1];
      const normalizedMoveDate = this.normalizeActionDate(moveDate);
      lastItem.endTime = normalizedMoveDate;
      lastItem.durationInMinutes = this.calculateDurationInMinutes(
        lastItem.startTime,
        lastItem.endTime,
      );

      if (listIdsSet.has(listAfterId)) {
        result.push({
          cardId: card.id,
          listId: listAfterId,
          startTime: normalizedMoveDate,
          endTime: null,
          durationInMinutes: null,
        });
      }
      return result;
    }, []);
  }

  private normalizeActionDate(date: Date): Date {
    const dayOfWeek = date.getUTCDay();
    if (dayOfWeek !== Weekends.Sat && dayOfWeek !== Weekends.Sun) {
      return date;
    }

    const newDate = new Date(date);
    const shift = dayOfWeek === Weekends.Sat ? 1 : 2;
    newDate.setUTCDate(newDate.getUTCDate() - shift);
    return this.setEndOfUtcDay(newDate);
  }

  private calculateDurationInMinutes(start: Date, end: Date): number {
    const diff = Math.ceil((end.getTime() - start.getTime()) / MS_IN_MINUTE);
    const weekendCount = this.getWeekendCountBetweenDaysInUtc(start, end);
    const weekendMinutes = weekendCount * MINUTES_IN_DAY;
    return diff - weekendMinutes;
  }

  private getWeekendCountBetweenDaysInUtc(start: Date, end: Date): number {
    const startCopy = new Date(start);
    const endCopy = new Date(end);

    let count = 0;
    while (startCopy <= endCopy) {
      const dayOfWeek = startCopy.getUTCDay();
      if (dayOfWeek === Weekends.Sat || dayOfWeek === Weekends.Sun) {
        count += 1;
      }
      startCopy.setDate(startCopy.getDate() + 1);
    }

    return count;
  }

  private setEndOfUtcDay(date: Date): Date {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        0,
      ),
    );
  }

  // NOTE: Trello docs https://support.atlassian.com/trello/docs/getting-the-time-a-card-or-board-was-created/
  private getMsFromTrelloItemId(id: string) {
    return 1000 * parseInt(id.substring(0, 8), 16);
  }
}
