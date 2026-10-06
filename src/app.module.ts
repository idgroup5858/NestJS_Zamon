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
import { SalaryModule } from './salary/salary.module';
import { SalaryPaymentModule } from './salary_payment/salary_payment.module';
import { TuitionModule } from './tuition/tuition.module';
import { TuitionPaymentModule } from './tuition_payment/tuition_payment.module';
import { ExpenseModule } from './expense/expense.module';
import { EmployeeModule } from './employee/employee.module';

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
    CriteriaModule,
    SalaryModule,
    SalaryPaymentModule,
    TuitionModule,
    TuitionPaymentModule,
    ExpenseModule,
    EmployeeModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
