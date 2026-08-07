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
import { TelegramModule } from './telegram/telegram.module';
import { CriteriaModule } from './criteria/criteria.module';

@Module({
  imports: [UserModule, DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',//for env is global coment added new comment new comment
    }),
    SubjectModule,
    ClassModule,
    StudentModule,
    BasicGradeModule,
    BehaviorGradeModule,
    
    
    TelegramModule,
    CriteriaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
