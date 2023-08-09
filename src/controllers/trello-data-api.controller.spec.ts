import { Test, TestingModule } from '@nestjs/testing';
import { TrelloDataApiController } from './trello-data-api.controller';

describe('TrelloDataTrelloDataApiController', () => {
  let appController: TrelloDataApiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TrelloDataApiController],
      providers: [],
    }).compile();

    appController = app.get<TrelloDataApiController>(TrelloDataApiController);
  });
});
