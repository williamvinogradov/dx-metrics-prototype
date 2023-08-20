import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { HttpAsyncService } from '../../shared/http-async';
import {
  TRELLO_API_OPTIONS_TOKEN,
  TrelloApiOptions,
} from './trello-api-options';
import {
  TrelloCard,
  TrelloCardPluginData,
  TrelloLabel,
  TrelloList,
  TrelloMember,
  TrelloListType,
  TrelloCardMoveAction,
  TrelloCustomField,
  TrelloCardCustomFieldData,
} from '../../domain';
import { TrelloPluginDataConverter } from './trello-plugin-data.converter';

@Injectable()
export class TrelloApiRepository {
  constructor(
    @Inject(TRELLO_API_OPTIONS_TOKEN) private readonly api: TrelloApiOptions,
    private readonly http: HttpAsyncService,
    private readonly pluginDataConverter: TrelloPluginDataConverter,
    private readonly logger: Logger,
  ) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  async getBoardLabels(boardId: string): Promise<TrelloLabel[]> {
    this.logger.log('verbose', `Loading labels from board ${boardId}...`);
    return this.http
      .getAsync(
        `${this.api.url}/boards/${boardId}/labels?limit=1000&key=${this.api.key}&token=${this.api.token}`,
      )
      .then(({ data }) => {
        this.logger.log(
          'verbose',
          `Loaded ${data.length} labels from board ${boardId}`,
        );
        return data;
      });
  }

  async getBoardMembers(boardId: string): Promise<TrelloMember[]> {
    this.logger.log('verbose', `Loading members from board ${boardId}...`);
    return this.http
      .getAsync(
        `${this.api.url}/boards/${boardId}/members?key=${this.api.key}&token=${this.api.token}`,
      )
      .then(({ data }) => {
        this.logger.log(
          'verbose',
          `Loaded ${data.length} members from board ${boardId}`,
        );
        return data;
      });
  }

  async getBoardLists(
    boardId: string,
    workListRegExp: RegExp,
    doneListRegExp: RegExp,
  ): Promise<TrelloList[]> {
    this.logger.log('verbose', `Loading lists from board ${boardId}...`);
    return this.http
      .getAsync<TrelloList[]>(
        `${this.api.url}/boards/${boardId}/lists?key=${this.api.key}&token=${this.api.token}`,
      )
      .then(({ data }) => {
        this.logger.log(
          'verbose',
          `Loaded ${data.length} lists from board ${boardId}`,
        );
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
          'verbose',
          `Lists after list type processing: ${result.length}`,
        );
        return result;
      });
  }

  async getBoardCustomFields(boardId: string): Promise<TrelloCustomField[]> {
    this.logger.log(
      'verbose',
      `Loading custom fields from board ${boardId}...`,
    );
    return this.http
      .getAsync(
        `${this.api.url}/boards/${boardId}/customFields?key=${this.api.key}&token=${this.api.token}`,
      )
      .then(({ data }) => {
        this.logger.log(
          'verbose',
          `Loaded ${data.length} custom fields from board ${boardId}`,
        );
        return data;
      });
  }

  async getListCards(listId: string): Promise<TrelloCard[]> {
    this.logger.log('verbose', `Loading cards from list ${listId}...`);
    return this.http
      .getAsync(
        `${this.api.url}/lists/${listId}/cards?key=${this.api.key}&token=${this.api.token}`,
      )
      .then(({ data }) => {
        this.logger.log(
          'verbose',
          `Loaded ${data.length} cards from list ${listId}`,
        );
        return data;
      });
  }

  async getCardPluginData(cardId: string): Promise<TrelloCardPluginData> {
    this.logger.log('verbose', `Loading plugin data from ${cardId} card...`);
    return this.http
      .getAsync(
        `${this.api.url}/cards/${cardId}/pluginData?key=${this.api.key}&token=${this.api.token}`,
      )
      .then(({ data }) => {
        this.logger.log(
          'verbose',
          `Loaded ${data.length} plugin data from ${cardId} card`,
        );

        return this.pluginDataConverter.convert(cardId, data);
      });
  }

  async getCardMoveHistory(cardId: string): Promise<TrelloCardMoveAction[]> {
    this.logger.log(
      'verbose',
      `Loading card ${cardId} moving history items...`,
    );
    return this.http
      .getAsync(
        `${this.api.url}/cards/${cardId}/actions?filter=updateCard:idList&key=${this.api.key}&token=${this.api.token}`,
      )
      .then(({ data }) => {
        this.logger.log(
          'verbose',
          `Loaded card ${cardId} ${data.length} moving history items.`,
        );
        return data;
      });
  }

  async getCardCustomFieldsData(
    cardId: string,
  ): Promise<TrelloCardCustomFieldData[]> {
    this.logger.log('verbose', `Loading card ${cardId} custom field values...`);
    return this.http
      .getAsync(
        `${this.api.url}/cards/${cardId}/customFieldItems?key=${this.api.key}&token=${this.api.token}`,
      )
      .then(({ data }) => {
        this.logger.log(
          'verbose',
          `Loaded card ${cardId} custom field values: ${JSON.stringify(data)}`,
        );
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
