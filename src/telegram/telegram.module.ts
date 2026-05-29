import { Module } from '@nestjs/common';
import { TelegramUpdate } from './telegram.update/telegram.update';
import { ClassModule } from 'src/class/class.module';
import { StudentModule } from 'src/student/student.module';
import { SubjectModule } from 'src/subject/subject.module';
import { BasicGradeModule } from 'src/basic_grade/basic_grade.module';

@Module({
  imports:[ClassModule,StudentModule,SubjectModule,BasicGradeModule],
  providers: [TelegramUpdate]
})
export class TelegramModule {}
