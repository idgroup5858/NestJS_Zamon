import { Module } from '@nestjs/common';
import { TuitionPaymentService } from './tuition_payment.service';
import { TuitionPaymentController } from './tuition_payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TuitionPayment } from './entities/tuition_payment.entity';
import { Student } from 'src/student/entities/student.entity';
import { TuitionModule } from 'src/tuition/tuition.module';

@Module({
  imports: [TypeOrmModule.forFeature([TuitionPayment, Student]), TuitionModule],
  controllers: [TuitionPaymentController],
  providers: [TuitionPaymentService],
})
export class TuitionPaymentModule {}
