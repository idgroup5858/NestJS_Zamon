import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Salary } from './entities/salary.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SalaryService {


  constructor(
    @InjectRepository(Salary)
    private readonly salaryRepository:Repository<Salary>
  ){}


  async create(createSalaryDto: CreateSalaryDto): Promise<Salary> {
    const { user_id, employee_id, current_salary } = createSalaryDto;

    // Maosh yo user'ga, yo employee'ga tegishli - ikkalasiga birdan ham, hech qaysiga ham emas
    if (!user_id === !employee_id) {
      throw new BadRequestException("user_id yoki employee_id dan faqat bittasini yuboring!");
    }

    try {
      const newSalary = this.salaryRepository.create({
        current_salary,
        user: user_id ? { id: user_id } as any : undefined,
        employee: employee_id ? { id: employee_id } as any : undefined,
      });
      return await this.salaryRepository.save(newSalary);
    } catch (error) {
      throw new BadRequestException('Maoshni yaratishda xatolik: ' + error.message);
    }
  }

  async findAll(): Promise<Salary[]> {
    return await this.salaryRepository.find({
      relations:{user:true,employee:true},
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Salary> {
    const salary = await this.salaryRepository.findOne({
      where: { id },
      relations: ['user', 'employee'],
    });
    if (!salary) {
      throw new NotFoundException(`#${id} raqamli maosh topilmadi!`);
    }
    return salary;
  }

      async findAllPagSearch(page: number, limit: number, search?: string) {
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;
    const skip = (page - 1) * limit;

    const query = this.salaryRepository.createQueryBuilder('salary')
      .leftJoinAndSelect('salary.user', 'user')
      .leftJoinAndSelect('salary.employee', 'employee');

    // MySQL/MariaDB uchun mardona LIKE va bir nechta ustunda qidiruv:
    if (search) {
      query.where(
        '(user.first_name LIKE :search OR user.last_name LIKE :search OR employee.first_name LIKE :search OR employee.last_name LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .orderBy('salary.id', 'DESC')
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



    // user_id bo'yicha maoshni topish
  async findByUserId(userId: number): Promise<Salary> {
    const salary = await this.salaryRepository.findOne({
      where: { user: { id: userId } }, // munosabat (relation) ichidagi id bo'yicha qidirish
      relations:{user:true}, // Agar xodim ma'lumotlari ham kerak bo'lsa
    });

    // Agar bu xodimga hali maosh biriktirilmagan bo'lsa, 404 xatolik beramiz
    if (!salary) {
      throw new NotFoundException(`Foydalanuvchi (#${userId}) uchun maosh topilmadi!`);
    }

    return salary;
  }


    // employee_id bo'yicha maoshni topish
  async findByEmployeeId(employeeId: number): Promise<Salary> {
    const salary = await this.salaryRepository.findOne({
      where: { employee: { id: employeeId } },
      relations:{employee:true},
    });

    if (!salary) {
      throw new NotFoundException(`Xodim (#${employeeId}) uchun maosh topilmadi!`);
    }

    return salary;
  }


   async update(id: number, updateSalaryDto: UpdateSalaryDto): Promise<Salary> {
    // 1. Avval maoshning o'zi borligini tekshiramiz (yo'q bo'lsa 404 beradi)
    const salary = await this.findOne(id);

    if (updateSalaryDto.user_id && updateSalaryDto.employee_id) {
      throw new BadRequestException("user_id yoki employee_id dan faqat bittasini yuboring!");
    }

    // 2. Kelgan ma'lumotlarni obyektga yuklaymiz (maosh boshqa egaga o'tsa, eskisi null qilinadi)
    if (updateSalaryDto.user_id) {
      salary.user = { id: updateSalaryDto.user_id } as any;
      salary.employee = null as any;
    }
    if (updateSalaryDto.employee_id) {
      salary.employee = { id: updateSalaryDto.employee_id } as any;
      salary.user = null as any;
    }
    if (updateSalaryDto.current_salary !== undefined) {
      salary.current_salary = updateSalaryDto.current_salary;
    }

    try {
      // 3. Bazaga saqlashni sinab ko'ramiz
      return await this.salaryRepository.save(salary);
    } catch (error) {
      // 4. Agar user_id/employee_id bazada topilmasa (Foreign Key xatosi bo'lsa), shu yerda ushlanadi
      const owner = updateSalaryDto.employee_id
        ? `employee_id (#${updateSalaryDto.employee_id})`
        : `user_id (#${updateSalaryDto.user_id})`;
      throw new BadRequestException(
        `Maoshni yangilab bo'lmadi. Yuborilgan ${owner} bazada mavjud emas!`
      );
    }
  }


  async remove(id: number): Promise<{ message: string }> {
    const salary = await this.findOne(id);
    await this.salaryRepository.remove(salary);
    return { message: `#${id} raqamli maosh muvaffaqiyatli o'chirildi.` };
  }
}
