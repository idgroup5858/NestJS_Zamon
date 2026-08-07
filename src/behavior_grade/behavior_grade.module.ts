import { Module } from '@nestjs/common';
import { BehaviorGradeService } from './behavior_grade.service';
import { BehaviorGradeController } from './behavior_grade.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BehaviorGrade } from './entities/behavior_grade.entity';
import { BehaviorGradeItem } from './entities/behavior_grade_items.entity';
import { UserModule } from 'src/user/user.module';
import { StudentModule } from 'src/student/student.module';
import { SubjectModule } from 'src/subject/subject.module';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [TypeOrmModule.forFeature([BehaviorGrade, BehaviorGradeItem]),
    UserModule,
    StudentModule,
    SubjectModule,
    TelegramModule
  ],
  controllers: [BehaviorGradeController],
  providers: [BehaviorGradeService],
})
export class BehaviorGradeModule { }
