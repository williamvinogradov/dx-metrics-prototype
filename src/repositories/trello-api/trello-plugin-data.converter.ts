import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { TrelloCardPluginData } from '../../domain';

export interface TrelloRawPluginData {
  idPlugin: string;
  value: string;
}

const DEFAULT_CARD_PLUGIN_DATA: TrelloCardPluginData = {
  score: null,
};

const SUPPORTED_PLUGINS_IDS = {
  storyPoker: '597cbecff4fe5f1d91d4b614',
};

@Injectable()
export class TrelloPluginDataConverter {
  constructor(private readonly logger: Logger) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  convert(
    cardId: string,
    pluginData: TrelloRawPluginData[],
  ): TrelloCardPluginData {
    this.logger.log(
      'verbose',
      'Converting raw plugin data -> card plugin data...',
    );
    const cardPluginData = pluginData.reduce(
      (result, { idPlugin, value }) => {
        switch (idPlugin) {
          case SUPPORTED_PLUGINS_IDS.storyPoker:
            result.score = this.getScoreFromPluginValue(value);
            this.logger.log(
              'verbose',
              `Converted story poker data: score = ${result.score}`,
            );
            break;
          default:
            this.logger.log(
              'warn',
              `Unsupported plugin id: ${idPlugin} (card: ${cardId}). This plugin data skipped.`,
            );
            break;
        }
        return result;
      },
      {
        ...DEFAULT_CARD_PLUGIN_DATA,
      },
    );
    this.logger.log(
      'verbose',
      `Converted card plugin data: ${JSON.stringify(cardPluginData)}`,
    );
    return cardPluginData;
  }

  private getScoreFromPluginValue(pluginValue: string): number | null {
    const score = Number(JSON.parse(pluginValue)?.estimate);
    return score !== Number.NaN ? score : null;
  }
}
