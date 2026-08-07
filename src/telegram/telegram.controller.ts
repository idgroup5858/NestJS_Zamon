import { Body, Controller, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('bot')
export class TelegramController {
    constructor(private botService: TelegramService) {}

  @Post(':token')
  handleUpdate(@Body() update: any) {
    this.botService.bot.processUpdate(update);
  }
}
