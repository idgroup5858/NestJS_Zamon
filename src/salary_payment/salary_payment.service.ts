import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSalaryPaymentDto } from './dto/create-salary_payment.dto';
import { UpdateSalaryPaymentDto } from './dto/update-salary_payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SalaryPayment } from './entities/salary_payment.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Salary } from 'src/salary/entities/salary.entity';
import { Employee } from 'src/employee/entities/employee.entity';

type SalaryStatus = 'not_paid' | 'partial' | 'fully_paid';

@Injectable()
export class SalaryPaymentService {

  constructor(
    @InjectRepository(SalaryPayment)
    private readonly salaryPaymentRepository: Repository<SalaryPayment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async create(createSalaryPaymentDto: CreateSalaryPaymentDto): Promise<SalaryPayment> {
    const { user_id, employee_id, ...rest } = createSalaryPaymentDto;

    // To'lov yo user'ga, yo employee'ga tegishli - ikkalasiga birdan ham, hech qaysiga ham emas
    if (!user_id === !employee_id) {
      throw new BadRequestException("user_id yoki employee_id dan faqat bittasini yuboring!");
    }

    try {
      const newSalaryPayment = this.salaryPaymentRepository.create({
        ...rest,
        user: user_id ? { id: user_id } as any : undefined,
        employee: employee_id ? { id: employee_id } as any : undefined,
      });
      return await this.salaryPaymentRepository.save(newSalaryPayment);
    } catch (error) {
      throw new BadRequestException("To'lovni yaratishda xatolik: " + error.message);
    }
  }

  async findAll(): Promise<SalaryPayment[]> {
    return await this.salaryPaymentRepository.find({
      relations: { user: true, employee: true },
      order: { paid_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<SalaryPayment> {
    const salaryPayment = await this.salaryPaymentRepository.findOne({
      where: { id },
      relations: ['user', 'employee'],
    });
    if (!salaryPayment) {
      throw new NotFoundException(`#${id} raqamli to'lov topilmadi!`);
    }
    return salaryPayment;
  }

  // Barcha userlar va tanlangan oy/yil bo'yicha maosh holati (to'liq/qisman/olmagan)
  async getUsersSalaryStatus(month: number, year: number, status?: SalaryStatus) {
    const raw = await this.userRepository.createQueryBuilder('user')
      .leftJoin(Salary, 'salary', 'salary.user_id = user.id')
      .leftJoin(
        SalaryPayment,
        'payment',
        'payment.user_id = user.id AND payment.period_month = :month AND payment.period_year = :year',
        { month, year },
      )
      .select('user.id', 'user_id')
      .addSelect('user.first_name', 'first_name')
      .addSelect('user.last_name', 'last_name')
      .addSelect('salary.current_salary', 'base_salary_norm')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'total_paid')
      .groupBy('user.id')
      .addGroupBy('user.first_name')
      .addGroupBy('user.last_name')
      .addGroupBy('salary.current_salary')
      .orderBy('user.id', 'ASC')
      .getRawMany();

    const result = raw.map((row) => {
      const base_salary_norm = row.base_salary_norm !== null ? Number(row.base_salary_norm) : null;
      const total_paid = Number(row.total_paid);
      const remaining = base_salary_norm !== null ? base_salary_norm - total_paid : null;

      let payment_status: SalaryStatus;
      if (total_paid <= 0) {
        payment_status = 'not_paid';
      } else if (base_salary_norm !== null && total_paid >= base_salary_norm) {
        payment_status = 'fully_paid';
      } else {
        payment_status = 'partial';
      }

      return {
        user_id: row.user_id,
        first_name: row.first_name,
        last_name: row.last_name,
        period_month: month,
        period_year: year,
        base_salary_norm,
        total_paid,
        remaining,
        status: payment_status,
      };
    });

    return status ? result.filter((r) => r.status === status) : result;
  }

  // Barcha employee'lar (qorovul, oshpaz...) va tanlangan oy/yil bo'yicha maosh holati (to'liq/qisman/olmagan)
  async getEmployeesSalaryStatus(month: number, year: number, status?: SalaryStatus) {
    const raw = await this.employeeRepository.createQueryBuilder('employee')
      .leftJoin(Salary, 'salary', 'salary.employee_id = employee.id')
      .leftJoin(
        SalaryPayment,
        'payment',
        'payment.employee_id = employee.id AND payment.period_month = :month AND payment.period_year = :year',
        { month, year },
      )
      // Ishdan ketgan xodim o'tgan oylar hisobotida ko'rinishi uchun: o'sha oyda to'lovi bo'lsa u ham chiqadi
      .where('(employee.active = true OR payment.id IS NOT NULL)')
      .select('employee.id', 'employee_id')
      .addSelect('employee.first_name', 'first_name')
      .addSelect('employee.last_name', 'last_name')
      .addSelect('employee.position', 'position')
      .addSelect('salary.current_salary', 'base_salary_norm')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'total_paid')
      .groupBy('employee.id')
      .addGroupBy('employee.first_name')
      .addGroupBy('employee.last_name')
      .addGroupBy('employee.position')
      .addGroupBy('salary.current_salary')
      .orderBy('employee.id', 'ASC')
      .getRawMany();

    const result = raw.map((row) => {
      const base_salary_norm = row.base_salary_norm !== null ? Number(row.base_salary_norm) : null;
      const total_paid = Number(row.total_paid);
      const remaining = base_salary_norm !== null ? base_salary_norm - total_paid : null;

      let payment_status: SalaryStatus;
      if (total_paid <= 0) {
        payment_status = 'not_paid';
      } else if (base_salary_norm !== null && total_paid >= base_salary_norm) {
        payment_status = 'fully_paid';
      } else {
        payment_status = 'partial';
      }

      return {
        employee_id: row.employee_id,
        first_name: row.first_name,
        last_name: row.last_name,
        position: row.position,
        period_month: month,
        period_year: year,
        base_salary_norm,
        total_paid,
        remaining,
        status: payment_status,
      };
    });

    return status ? result.filter((r) => r.status === status) : result;
  }

  // Dashboard uchun: tanlangan oy/yil bo'yicha nechta odamga qancha maosh berilgan/berilmagan/qisman berilgan
  // (user'lar + employee'lar birga hisoblanadi)
  async getSalaryDashboard(month: number, year: number) {
    const usersStatus = await this.getUsersSalaryStatus(month, year);
    const employeesStatus = await this.getEmployeesSalaryStatus(month, year);

    const summary = {
      period_month: month,
      period_year: year,
      total_users: usersStatus.length,
      total_employees: employeesStatus.length,
      fully_paid: { count: 0, amount: 0 },
      partial: { count: 0, amount: 0 },
      not_paid: { count: 0, amount: 0 },
      total_expected: 0,
      total_paid: 0,
      total_remaining: 0,
    };

    for (const u of [...usersStatus, ...employeesStatus]) {
      summary.total_paid += u.total_paid;
      if (u.base_salary_norm !== null) {
        summary.total_expected += u.base_salary_norm;
        summary.total_remaining += u.remaining ?? 0;
      }

      if (u.status === 'fully_paid') {
        summary.fully_paid.count += 1;
        summary.fully_paid.amount += u.total_paid;
      } else if (u.status === 'partial') {
        summary.partial.count += 1;
        summary.partial.amount += u.total_paid;
      } else {
        summary.not_paid.count += 1;
        summary.not_paid.amount += u.base_salary_norm ?? 0;
      }
    }

    return summary;
  }

  async findAllPagSearch(page: number, limit: number, search?: string) {
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;
    const skip = (page - 1) * limit;

    const query = this.salaryPaymentRepository.createQueryBuilder('salary_payment')
      .leftJoinAndSelect('salary_payment.user', 'user')
      .leftJoinAndSelect('salary_payment.employee', 'employee');

    if (search) {
      query.where(
        '(user.first_name LIKE :search OR user.last_name LIKE :search OR employee.first_name LIKE :search OR employee.last_name LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .orderBy('salary_payment.id', 'DESC')
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

  // user_id bo'yicha to'lovlar tarixini topish
  async findByUserId(userId: number): Promise<SalaryPayment[]> {
    return await this.salaryPaymentRepository.find({
      where: { user: { id: userId } },
      relations: { user: true },
      order: { paid_at: 'DESC' },
    });
  }

  // user_id + oy/yil bo'yicha shu oyda qilingan barcha to'lovlar va umumiy holat
  async findByUserAndPeriod(userId: number, month: number, year: number) {
    const payments = await this.salaryPaymentRepository.find({
      where: { user: { id: userId }, period_month: month, period_year: year },
      relations: { user: true },
      order: { paid_at: 'ASC' },
    });

    const base_salary_norm = payments[0]?.base_salary_norm ?? null;
    const total_paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = base_salary_norm !== null ? Number(base_salary_norm) - total_paid : null;

    return {
      user_id: userId,
      period_month: month,
      period_year: year,
      payments,
      summary: {
        base_salary_norm,
        total_paid,
        remaining,
        is_fully_paid: remaining !== null ? remaining <= 0 : false,
      },
    };
  }

  // employee_id bo'yicha to'lovlar tarixini topish
  async findByEmployeeId(employeeId: number): Promise<SalaryPayment[]> {
    return await this.salaryPaymentRepository.find({
      where: { employee: { id: employeeId } },
      relations: { employee: true },
      order: { paid_at: 'DESC' },
    });
  }

  // employee_id + oy/yil bo'yicha shu oyda qilingan barcha to'lovlar va umumiy holat
  async findByEmployeeAndPeriod(employeeId: number, month: number, year: number) {
    const payments = await this.salaryPaymentRepository.find({
      where: { employee: { id: employeeId }, period_month: month, period_year: year },
      relations: { employee: true },
      order: { paid_at: 'ASC' },
    });

    const base_salary_norm = payments[0]?.base_salary_norm ?? null;
    const total_paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = base_salary_norm !== null ? Number(base_salary_norm) - total_paid : null;

    return {
      employee_id: employeeId,
      period_month: month,
      period_year: year,
      payments,
      summary: {
        base_salary_norm,
        total_paid,
        remaining,
        is_fully_paid: remaining !== null ? remaining <= 0 : false,
      },
    };
  }

  async update(id: number, updateSalaryPaymentDto: UpdateSalaryPaymentDto): Promise<SalaryPayment> {
    const salaryPayment = await this.findOne(id);

    const { user_id, employee_id, ...rest } = updateSalaryPaymentDto;
    if (user_id && employee_id) {
      throw new BadRequestException("user_id yoki employee_id dan faqat bittasini yuboring!");
    }

    // To'lov boshqa egaga o'tsa, eskisi null qilinadi
    if (user_id) {
      salaryPayment.user = { id: user_id } as any;
      salaryPayment.employee = null as any;
    }
    if (employee_id) {
      salaryPayment.employee = { id: employee_id } as any;
      salaryPayment.user = null as any;
    }
    Object.assign(salaryPayment, rest);

    try {
      return await this.salaryPaymentRepository.save(salaryPayment);
    } catch (error) {
      const owner = employee_id ? `employee_id (#${employee_id})` : `user_id (#${user_id})`;
      throw new BadRequestException(
        `To'lovni yangilab bo'lmadi. Yuborilgan ${owner} bazada mavjud emas!`
      );
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const salaryPayment = await this.findOne(id);
    await this.salaryPaymentRepository.remove(salaryPayment);
    return { message: `#${id} raqamli to'lov muvaffaqiyatli o'chirildi.` };
  }
}
