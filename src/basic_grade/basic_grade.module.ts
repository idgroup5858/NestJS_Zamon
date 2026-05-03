import { Module } from '@nestjs/common';
import { BasicGradeService } from './basic_grade.service';
import { BasicGradeController } from './basic_grade.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BasicGrade } from './entities/basic_grade.entity';
import { UserModule } from 'src/user/user.module';
import { StudentModule } from 'src/student/student.module';
import { SubjectModule } from 'src/subject/subject.module';

@Module({
  imports:[TypeOrmModule.forFeature([BasicGrade]),
  UserModule,
  StudentModule,
  SubjectModule
  ],
  controllers: [BasicGradeController],
  providers: [BasicGradeService],
})
export class BasicGradeModule {}
