import { Module } from '@nestjs/common';
import { SalaryPaymentService } from './salary_payment.service';
import { SalaryPaymentController } from './salary_payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryPayment } from './entities/salary_payment.entity';
import { User } from 'src/user/entities/user.entity';
import { Salary } from 'src/salary/entities/salary.entity';
import { Employee } from 'src/employee/entities/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SalaryPayment, User, Salary, Employee])],
  controllers: [SalaryPaymentController],
  providers: [SalaryPaymentService],
})
export class SalaryPaymentModule {}
