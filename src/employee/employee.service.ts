import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EmployeeService {

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    try {
      const newEmployee = this.employeeRepository.create(createEmployeeDto);
      return await this.employeeRepository.save(newEmployee);
    } catch (error) {
      throw new BadRequestException("Xodimni yaratishda xatolik: " + error.message);
    }
  }

  async findAll(): Promise<Employee[]> {
    return await this.employeeRepository.find({
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`#${id} raqamli xodim topilmadi!`);
    }
    return employee;
  }

  async findAllPagSearch(page: number, limit: number, search?: string, active?: boolean) {
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;
    const skip = (page - 1) * limit;

    const query = this.employeeRepository.createQueryBuilder('employee');

    if (search) {
      query.andWhere(
        '(employee.first_name LIKE :search OR employee.last_name LIKE :search OR employee.phone LIKE :search OR employee.position LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // active berilmasa - hammasi, true - ishlayotganlar, false - ishdan ketganlar
    if (active !== undefined) {
      query.andWhere('employee.active = :active', { active });
    }

    const [data, total] = await query
      .orderBy('employee.id', 'DESC')
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

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOne(id);
    Object.assign(employee, updateEmployeeDto);

    try {
      return await this.employeeRepository.save(employee);
    } catch (error) {
      throw new BadRequestException("Xodimni yangilab bo'lmadi: " + error.message);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const employee = await this.findOne(id);
    await this.employeeRepository.remove(employee);
    return { message: `#${id} raqamli xodim muvaffaqiyatli o'chirildi.` };
  }
}
