import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ExpenseService {

  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    try {
      const newExpense = this.expenseRepository.create(createExpenseDto);
      return await this.expenseRepository.save(newExpense);
    } catch (error) {
      throw new BadRequestException("Xarajatni yaratishda xatolik: " + error.message);
    }
  }

  async findAll(): Promise<Expense[]> {
    return await this.expenseRepository.find({
      order: { expense_date: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`#${id} raqamli xarajat topilmadi!`);
    }
    return expense;
  }

  async findAllPagSearch(page: number, limit: number, search?: string) {
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;
    const skip = (page - 1) * limit;

    const query = this.expenseRepository.createQueryBuilder('expense');

    if (search) {
      query.where(
        '(expense.category LIKE :search OR expense.comment LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .orderBy('expense.id', 'DESC')
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

  // period_month/year bo'yicha barcha xarajatlar
  async findByPeriod(month: number, year: number): Promise<Expense[]> {
    return await this.expenseRepository.find({
      where: { period_month: month, period_year: year },
      order: { expense_date: 'DESC' },
    });
  }

  // Dashboard uchun: tanlangan oy/yil bo'yicha umumiy xarajat va kategoriyalar bo'yicha taqsimot
  async getExpenseDashboard(month: number, year: number) {
    const expenses = await this.findByPeriod(month, year);

    const byCategoryMap = new Map<string, { amount: number; count: number }>();
    let total_amount = 0;

    for (const e of expenses) {
      total_amount += Number(e.amount);
      const current = byCategoryMap.get(e.category) ?? { amount: 0, count: 0 };
      current.amount += Number(e.amount);
      current.count += 1;
      byCategoryMap.set(e.category, current);
    }

    const by_category = Array.from(byCategoryMap.entries()).map(([category, v]) => ({
      category,
      amount: v.amount,
      count: v.count,
    }));

    return {
      period_month: month,
      period_year: year,
      total_amount,
      total_count: expenses.length,
      by_category,
    };
  }

  async update(id: number, updateExpenseDto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findOne(id);
    Object.assign(expense, updateExpenseDto);

    try {
      return await this.expenseRepository.save(expense);
    } catch (error) {
      throw new BadRequestException("Xarajatni yangilab bo'lmadi: " + error.message);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const expense = await this.findOne(id);
    await this.expenseRepository.remove(expense);
    return { message: `#${id} raqamli xarajat muvaffaqiyatli o'chirildi.` };
  }
}
