import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TuitionReminderService } from './tuition_reminder.service';
import { Student } from 'src/student/entities/student.entity';
import { TuitionPayment } from 'src/tuition_payment/entities/tuition_payment.entity';
import { TuitionModule } from 'src/tuition/tuition.module';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [TypeOrmModule.forFeature([Student, TuitionPayment]), TuitionModule, TelegramModule],
  providers: [TuitionReminderService],
})
export class TuitionReminderModule {}
