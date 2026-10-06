import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/student/entities/student.entity';
import { TuitionPayment } from 'src/tuition_payment/entities/tuition_payment.entity';
import { TuitionService } from 'src/tuition/tuition.service';
import { TelegramService } from 'src/telegram/telegram.service';

const MONTH_NAMES = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

@Injectable()
export class TuitionReminderService {
  private readonly logger = new Logger(TuitionReminderService.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(TuitionPayment)
    private readonly tuitionPaymentRepository: Repository<TuitionPayment>,
    private readonly tuitionService: TuitionService,
    private readonly telegramService: TelegramService,
  ) {}

  // Har oyning 5 va 10 sanasida soat 09:00 da (Toshkent vaqti) joriy oy uchun to'lovi to'liq bo'lmaganlarga eslatma
  @Cron('0 9 5,10 * *', { name: 'tuition-reminder', timeZone: 'Asia/Tashkent', waitForCompletion: true })
  async sendMonthlyReminders() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Faqat o'qiyotgan (faol) talabalar
    const students = await this.studentRepository.find({ where: { active: true } });

    // Joriy oy bo'yicha har bir talabaning jami to'lagan summasi
    const payments = await this.tuitionPaymentRepository
      .createQueryBuilder('payment')
      .select('payment.student_id', 'student_id')
      .addSelect('SUM(payment.amount)', 'total_paid')
      .where('payment.period_month = :month AND payment.period_year = :year', { month, year })
      .groupBy('payment.student_id')
      .getRawMany();

    const paidByStudent = new Map<number, number>(
      payments.map((p) => [Number(p.student_id), Number(p.total_paid)]),
    );

    let sent = 0;
    let notConnected = 0;

    for (const student of students) {
      // Narx belgilanmagan talaba to'lashi shart emas - unga xabar yuborilmaydi
      const effective = await this.tuitionService.getEffectiveFeeOrNull(student.id);
      if (!effective) continue;

      const total_paid = paidByStudent.get(student.id) ?? 0;
      const remaining = effective.net_fee - total_paid;
      if (remaining <= 0) continue;

      if (!student.telegram_chat_id) {
        notConnected += 1;
        continue;
      }

      const message =
        `📢 To'lov eslatmasi\n\n` +
        `Hurmatli ota-ona, farzandingiz ${student.first_name} ${student.last_name} uchun ` +
        `${MONTH_NAMES[month - 1]} oyi o'qish to'lovi hali to'liq amalga oshirilmagan.\n\n` +
        `💰 Oylik to'lov: ${this.formatSum(effective.net_fee)} so'm\n` +
        `✅ To'langan: ${this.formatSum(total_paid)} so'm\n` +
        `❗ Qoldiq: ${this.formatSum(remaining)} so'm\n\n` +
        `Iltimos, to'lovni o'z vaqtida amalga oshiring.`;

      await this.telegramService.goMessage(student.telegram_chat_id, message);
      sent += 1;

      // Telegram bir vaqtda ko'p xabar yuborishni cheklaydi - har xabardan keyin biroz kutamiz
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.logger.log(
      `${MONTH_NAMES[month - 1]} ${year} to'lov eslatmasi: ${sent} ta ota-onaga yuborildi, ${notConnected} ta ota-ona botga ulanmagan.`,
    );
  }

  // 1500000 -> "1 500 000"
  private formatSum(value: number): string {
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
}
