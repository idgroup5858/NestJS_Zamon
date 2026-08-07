import { Module } from '@nestjs/common';
import { ClassModule } from 'src/class/class.module';
import { StudentModule } from 'src/student/student.module';
import { SubjectModule } from 'src/subject/subject.module';
import { BasicGradeModule } from 'src/basic_grade/basic_grade.module';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';

@Module({
  imports:[ClassModule,StudentModule,SubjectModule,BasicGradeModule],
  providers: [TelegramService],
  controllers: [TelegramController],
  exports:[TelegramService]
})
export class TelegramModule {}
