import { Module } from '@nestjs/common';
import { TelegramUpdate } from './telegram.update/telegram.update';
import { ClassModule } from 'src/class/class.module';
import { StudentModule } from 'src/student/student.module';

@Module({
  imports:[ClassModule,StudentModule],
  providers: [TelegramUpdate]
})
export class TelegramModule {}
