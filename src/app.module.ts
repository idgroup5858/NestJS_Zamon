import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { SubjectModule } from './subject/subject.module';
import { ClassModule } from './class/class.module';
import { StudentModule } from './student/student.module';
import { BasicGradeModule } from './basic_grade/basic_grade.module';
import { BehaviorGradeModule } from './behavior_grade/behavior_grade.module';

@Module({
  imports: [UserModule, DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',//for env is global
    }),
    SubjectModule,
    ClassModule,
    StudentModule,
    BasicGradeModule,
    BehaviorGradeModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
