import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTuitionPaymentDto } from './dto/create-tuition_payment.dto';
import { UpdateTuitionPaymentDto } from './dto/update-tuition_payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TuitionPayment } from './entities/tuition_payment.entity';
import { Repository } from 'typeorm';
import { Student } from 'src/student/entities/student.entity';
import { TuitionService } from 'src/tuition/tuition.service';

type TuitionStatus = 'not_paid' | 'partial' | 'fully_paid';

@Injectable()
export class TuitionPaymentService {

  constructor(
    @InjectRepository(TuitionPayment)
    private readonly tuitionPaymentRepository: Repository<TuitionPayment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly tuitionService: TuitionService,
  ) {}

  async create(createTuitionPaymentDto: CreateTuitionPaymentDto): Promise<TuitionPayment> {
    const { student_id, ...rest } = createTuitionPaymentDto;

    const effective = await this.tuitionService.findEffectiveForStudent(student_id);

    try {
      const newTuitionPayment = this.tuitionPaymentRepository.create({
        ...rest,
        net_fee_norm: effective.net_fee,
        student: { id: student_id } as any,
      });
      return await this.tuitionPaymentRepository.save(newTuitionPayment);
    } catch (error) {
      throw new BadRequestException("To'lovni yaratishda xatolik: " + error.message);
    }
  }

  async findAll(): Promise<TuitionPayment[]> {
    return await this.tuitionPaymentRepository.find({
      relations: { student: true },
      order: { paid_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<TuitionPayment> {
    const tuitionPayment = await this.tuitionPaymentRepository.findOne({
      where: { id },
      relations: { student: true },
    });
    if (!tuitionPayment) {
      throw new NotFoundException(`#${id} raqamli to'lov topilmadi!`);
    }
    return tuitionPayment;
  }

  // student_id bo'yicha to'lovlar tarixini topish
  async findByStudentId(studentId: number): Promise<TuitionPayment[]> {
    return await this.tuitionPaymentRepository.find({
      where: { student: { id: studentId } },
      relations: { student: true },
      order: { paid_at: 'DESC' },
    });
  }

  async findAllPagSearch(page: number, limit: number, search?: string) {
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;
    const skip = (page - 1) * limit;

    const query = this.tuitionPaymentRepository.createQueryBuilder('tuition_payment')
      .leftJoinAndSelect('tuition_payment.student', 'student');

    if (search) {
      query.where(
        '(student.first_name LIKE :search OR student.last_name LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .orderBy('tuition_payment.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data,
    };
  }

  // student_id + oy/yil bo'yicha shu oyda qilingan barcha to'lovlar va umumiy holat
  async findByStudentAndPeriod(studentId: number, month: number, year: number) {
    const payments = await this.tuitionPaymentRepository.find({
      where: { student: { id: studentId }, period_month: month, period_year: year },
      relations: { student: true },
      order: { paid_at: 'ASC' },
    });

    const net_fee_norm = payments[0]?.net_fee_norm ?? null;
    const total_paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = net_fee_norm !== null ? Number(net_fee_norm) - total_paid : null;

    return {
      student_id: studentId,
      period_month: month,
      period_year: year,
      payments,
      summary: {
        net_fee_norm,
        total_paid,
        remaining,
        is_fully_paid: remaining !== null ? remaining <= 0 : false,
      },
    };
  }

  // Barcha faol talabalar va tanlangan oy/yil bo'yicha to'lov holati (to'liq/qisman/umuman olmagan)
  async getStudentsTuitionStatus(month: number, year: number, status?: TuitionStatus) {
    const students = await this.studentRepository.find();

    const payments = await this.tuitionPaymentRepository
      .createQueryBuilder('payment')
      .select('payment.student_id', 'student_id')
      .addSelect('SUM(payment.amount)', 'total_paid')
      .where('payment.period_month = :month AND payment.period_year = :year', { month, year })
      .groupBy('payment.student_id')
      .getRawMany();

    const paidByStudent = new Map<number, number>(
      payments.map((p) => [p.student_id, Number(p.total_paid)]),
    );

    const result = await Promise.all(
      students.map(async (student) => {
        const effective = await this.tuitionService.getEffectiveFeeOrNull(student.id);
        const net_fee_norm = effective?.net_fee ?? null;
        const total_paid = paidByStudent.get(student.id) ?? 0;
        const remaining = net_fee_norm !== null ? net_fee_norm - total_paid : null;

        let payment_status: TuitionStatus;
        if (total_paid <= 0) {
          payment_status = 'not_paid';
        } else if (net_fee_norm !== null && total_paid >= net_fee_norm) {
          payment_status = 'fully_paid';
        } else {
          payment_status = 'partial';
        }

        return {
          student_id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          period_month: month,
          period_year: year,
          net_fee_norm,
          total_paid,
          remaining,
          status: payment_status,
        };
      }),
    );

    return status ? result.filter((r) => r.status === status) : result;
  }

  // Dashboard uchun: tanlangan oy/yil bo'yicha umumiy tushum (kutilgan vs haqiqatda tushgan)
  async getTuitionDashboard(month: number, year: number) {
    const studentsStatus = await this.getStudentsTuitionStatus(month, year);

    const summary = {
      period_month: month,
      period_year: year,
      total_students: studentsStatus.length,
      fully_paid: { count: 0, amount: 0 },
      partial: { count: 0, amount: 0 },
      not_paid: { count: 0, amount: 0 },
      total_expected: 0,
      total_paid: 0,
      total_remaining: 0,
    };

    for (const s of studentsStatus) {
      summary.total_paid += s.total_paid;
      if (s.net_fee_norm !== null) {
        summary.total_expected += s.net_fee_norm;
        summary.total_remaining += s.remaining ?? 0;
      }

      if (s.status === 'fully_paid') {
        summary.fully_paid.count += 1;
        summary.fully_paid.amount += s.total_paid;
      } else if (s.status === 'partial') {
        summary.partial.count += 1;
        summary.partial.amount += s.total_paid;
      } else {
        summary.not_paid.count += 1;
        summary.not_paid.amount += s.net_fee_norm ?? 0;
      }
    }

    return summary;
  }

  async update(id: number, updateTuitionPaymentDto: UpdateTuitionPaymentDto): Promise<TuitionPayment> {
    const tuitionPayment = await this.findOne(id);

    const { student_id, ...rest } = updateTuitionPaymentDto;
    if (student_id) {
      tuitionPayment.student = { id: student_id } as any;
    }
    Object.assign(tuitionPayment, rest);

    try {
      return await this.tuitionPaymentRepository.save(tuitionPayment);
    } catch (error) {
      throw new BadRequestException("To'lovni yangilab bo'lmadi: " + error.message);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const tuitionPayment = await this.findOne(id);
    await this.tuitionPaymentRepository.remove(tuitionPayment);
    return { message: `#${id} raqamli to'lov muvaffaqiyatli o'chirildi.` };
  }
}
