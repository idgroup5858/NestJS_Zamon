import { Module } from '@nestjs/common';
import { BasicGradeService } from './basic_grade.service';
import { BasicGradeController } from './basic_grade.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BasicGrade } from './entities/basic_grade.entity';
import { UserModule } from 'src/user/user.module';
import { StudentModule } from 'src/student/student.module';
import { SubjectModule } from 'src/subject/subject.module';
import { BasicGradeItem } from './entities/basic_grade_item.entity';

@Module({
  imports:[TypeOrmModule.forFeature([BasicGrade,BasicGradeItem]),
  UserModule,
  StudentModule,
  SubjectModule
  ],
  controllers: [BasicGradeController],
  providers: [BasicGradeService],
  exports:[BasicGradeService]
})
export class BasicGradeModule {}
