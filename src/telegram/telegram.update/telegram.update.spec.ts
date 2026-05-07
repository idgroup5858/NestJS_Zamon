import { Test, TestingModule } from '@nestjs/testing';
import { TelegramUpdate } from './telegram.update';

describe('TelegramUpdate', () => {
  let provider: TelegramUpdate;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelegramUpdate],
    }).compile();

    provider = module.get<TelegramUpdate>(TelegramUpdate);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
