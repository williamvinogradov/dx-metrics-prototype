import { Module } from '@nestjs/common';
import { LoggerProvider } from '../logger';
import { DbRepositoriesModule } from '../repositories/db';
import { TrelloApiRepositoryModule } from '../repositories/trello-api';
import {
  Dispatcher,
  TrelloUpdateCardsCommand,
  TrelloUpdateCardsCommandHandler,
  TrelloUpdateLabelsCommand,
  TrelloUpdateLabelsCommandHandler,
  TrelloUpdateListsCommand,
  TrelloUpdateListsCommandHandler,
  TrelloUpdateMembersCommand,
  TrelloUpdateMembersCommandHandler,
} from './commands';
import {
  TrelloUpdateCustomFieldsCommand,
  TrelloUpdateCustomFieldsCommandHandler,
} from './commands/trello-update-custom-fields';
import { TrelloCardHistoryConverter } from './trello-card-history.converter';

@Module({
  imports: [DbRepositoriesModule, TrelloApiRepositoryModule],
  controllers: [],
  providers: [
    LoggerProvider,
    TrelloCardHistoryConverter,
    Dispatcher,
    // handlers
    {
      provide: TrelloUpdateLabelsCommand.name,
      useClass: TrelloUpdateLabelsCommandHandler,
    },
    {
      provide: TrelloUpdateMembersCommand.name,
      useClass: TrelloUpdateMembersCommandHandler,
    },
    {
      provide: TrelloUpdateListsCommand.name,
      useClass: TrelloUpdateListsCommandHandler,
    },
    {
      provide: TrelloUpdateCardsCommand.name,
      useClass: TrelloUpdateCardsCommandHandler,
    },
    {
      provide: TrelloUpdateCustomFieldsCommand.name,
      useClass: TrelloUpdateCustomFieldsCommandHandler,
    },
  ],
  exports: [Dispatcher],
})
export class DomainModule {}
