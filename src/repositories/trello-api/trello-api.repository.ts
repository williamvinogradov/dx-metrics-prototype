import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { HttpAsyncService } from '../../services/http-async.service';
import { API_OPTIONS_TOKEN, ApiOptions } from './api-options';
import {
  TrelloCard,
  TrelloCardPluginData,
  TrelloLabel,
  TrelloList,
  TrelloMember,
  TrelloListType,
  TrelloCardMoveAction,
} from '../../domain';

@Injectable()
export class TrelloApiRepository {
  constructor(
    @Inject(API_OPTIONS_TOKEN) private api: ApiOptions,
    private http: HttpAsyncService,
    private logger: Logger,
  ) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  async getBoardLabels(boardId: string): Promise<TrelloLabel[]> {
    this.logger.log('info', `Loading board ${boardId} labels...`);
    return this.http
      .getAsync(
        `${this.api.url}/boards/${boardId}/labels?limit=1000&key=${this.api.key}&token=${this.api.token}`,
      )
      .then(({ data }) => {
        this.logger.log(
          'info',
          `TrelloApiRepository: Loaded board ${boardId} labels`,
        );
        return data;
      });
  }

  async getBoardMembers(boardId: string): Promise<TrelloMember[]> {
    this.logger.log('info', `Loading board ${boardId} members...`);
    return this.http
      .getAsync(
        `${this.api.url}/boards/${boardId}/members?key=${this.api.key}&token=${this.api.token}`,
      )
      .then(({ data }) => {
        this.logger.log('info', `Loaded board ${boardId} members`);
        return data;
      });
  }

  async getBoardLists(
    boardId: string,
    workListRegExp: RegExp,
    doneListRegExp: RegExp,
  ): Promise<TrelloList[]> {
    return this.http
      .getAsync<TrelloList[]>(
        `${this.api.url}/boards/${boardId}/lists?key=${this.api.key}&token=${this.api.token}`,
      )
      .then(({ data }) => {
        const result = data.reduce((result, list) => {
          const listType = this.getTrelloListType(
            list.name,
            workListRegExp,
            doneListRegExp,
          );

          if (listType !== null) {
            result.push({
              ...list,
              type: listType,
            });
          }

          return result;
        }, [] as TrelloList[]);

        this.logger.log(
          'info',
          `TrelloApiRepository: Loaded board's ${boardId} lists`,
        );
        return result;
      });
  }

  async getListCards(listId: string): Promise<TrelloCard[]> {
    return this.http
      .getAsync(
        `${this.api.url}/lists/${listId}/cards?key=${this.api.key}&token=${this.api.token}`,
      )
      .then(({ data }) => {
        this.logger.log(
          'info',
          `TrelloApiRepository: Loaded list ${listId} cards`,
        );
        return data;
      });
  }

  async getCardPluginData(cardId: string): Promise<TrelloCardPluginData> {
    return this.http
      .getAsync(
        `${this.api.url}/cards/${cardId}/pluginData?key=${this.api.key}&token=${this.api.token}`,
      )
      .then(({ data }) => {
        if (data[0]?.idPlugin === '597cbecff4fe5f1d91d4b614') {
          const score = Number(JSON.parse(data[0].value)?.estimate);
          return {
            score: score !== Number.NaN ? score : null,
          };
        }

        return {
          score: null,
        };
      });
  }

  async getCardMoveHistory(cardId: string): Promise<TrelloCardMoveAction[]> {
    return this.http
      .getAsync(
        `${this.api.url}/cards/${cardId}/actions?filter=updateCard:idList&key=${this.api.key}&token=${this.api.token}`,
      )
      .then(({ data }) => {
        return data;
      });
  }

  private getTrelloListType(
    name: string,
    workListRegExp: RegExp,
    doneListRegExp: RegExp,
  ): TrelloListType | null {
    switch (true) {
      case workListRegExp.test(name):
        return TrelloListType.work;
      case doneListRegExp.test(name):
        return TrelloListType.done;
      default:
        return null;
    }
  }
}
