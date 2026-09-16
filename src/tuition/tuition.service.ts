import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTuitionDto } from './dto/create-tuition.dto';
import { UpdateTuitionDto } from './dto/update-tuition.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DiscountType, Tuition } from './entities/tuition.entity';
import { Repository } from 'typeorm';
import { Student } from 'src/student/entities/student.entity';

@Injectable()
export class TuitionService {

  constructor(
    @InjectRepository(Tuition)
    private readonly tuitionRepository: Repository<Tuition>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(createTuitionDto: CreateTuitionDto): Promise<Tuition> {
    const { class_id, student_id, ...rest } = createTuitionDto;

    if (!class_id && !student_id) {
      throw new BadRequestException("class_id yoki student_id dan kamida bittasi kiritilishi shart!");
    }
    if (class_id && student_id) {
      throw new BadRequestException("class_id va student_id bir vaqtda kiritilmaydi, faqat bittasini tanlang!");
    }

    try {
      const newTuition = this.tuitionRepository.create({
        ...rest,
        classs: class_id ? ({ id: class_id } as any) : null,
        student: student_id ? ({ id: student_id } as any) : null,
      });
      return await this.tuitionRepository.save(newTuition);
    } catch (error) {
      throw new BadRequestException("To'lov narxini yaratishda xatolik: " + error.message);
    }
  }

  async findAll(): Promise<Tuition[]> {
    return await this.tuitionRepository.find({
      relations: { classs: true, student: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Tuition> {
    const tuition = await this.tuitionRepository.findOne({
      where: { id },
      relations: { classs: true, student: true },
    });
    if (!tuition) {
      throw new NotFoundException(`#${id} raqamli to'lov narxi topilmadi!`);
    }
    return tuition;
  }

  async findAllPagSearch(page: number, limit: number, search?: string) {
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;
    const skip = (page - 1) * limit;

    const query = this.tuitionRepository.createQueryBuilder('tuition')
      .leftJoinAndSelect('tuition.student', 'student')
      .leftJoinAndSelect('tuition.classs', 'classs');

    if (search) {
      query.where(
        '(student.first_name LIKE :search OR student.last_name LIKE :search OR classs.name LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .orderBy('tuition.id', 'DESC')
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

  // Talaba uchun amaldagi narxni topish: avval shaxsiy istisno, bo'lmasa guruh standarti
  async findEffectiveForStudent(studentId: number): Promise<{ tuition: Tuition; net_fee: number }> {
    const effective = await this.getEffectiveFeeOrNull(studentId);
    if (!effective) {
      throw new NotFoundException(`#${studentId} raqamli talaba uchun narx belgilanmagan!`);
    }
    return effective;
  }

  // findEffectiveForStudent bilan bir xil, lekin narx topilmasa xatolik bermay null qaytaradi
  // (ko'plab talabalar bo'yicha status hisoblashda bittasi uchun narx yo'qligi butun so'rovni to'xtatmasligi kerak)
  async getEffectiveFeeOrNull(studentId: number): Promise<{ tuition: Tuition; net_fee: number } | null> {
    let tuition = await this.tuitionRepository.findOne({
      where: { student: { id: studentId } },
      relations: { student: true },
    });

    if (!tuition) {
      const student = await this.studentRepository.findOne({
        where: { id: studentId },
        relations: { classs: true },
      });
      if (student?.classs) {
        tuition = await this.tuitionRepository.findOne({
          where: { classs: { id: student.classs.id } },
          relations: { classs: true },
        });
      }
    }

    return tuition ? { tuition, net_fee: this.computeNetFee(tuition) } : null;
  }

  computeNetFee(tuition: Tuition): number {
    const fee = Number(tuition.monthly_fee);
    if (tuition.discount_type === DiscountType.PERCENT && tuition.discount_value) {
      return fee - (fee * Number(tuition.discount_value)) / 100;
    }
    if (tuition.discount_type === DiscountType.FIXED && tuition.discount_value) {
      return fee - Number(tuition.discount_value);
    }
    return fee;
  }

  async update(id: number, updateTuitionDto: UpdateTuitionDto): Promise<Tuition> {
    const tuition = await this.findOne(id);
    const { class_id, student_id, ...rest } = updateTuitionDto;

    if (class_id) {
      tuition.classs = { id: class_id } as any;
      tuition.student = null;
    }
    if (student_id) {
      tuition.student = { id: student_id } as any;
      tuition.classs = null;
    }
    Object.assign(tuition, rest);

    try {
      return await this.tuitionRepository.save(tuition);
    } catch (error) {
      throw new BadRequestException("To'lov narxini yangilab bo'lmadi: " + error.message);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const tuition = await this.findOne(id);
    await this.tuitionRepository.remove(tuition);
    return { message: `#${id} raqamli to'lov narxi muvaffaqiyatli o'chirildi.` };
  }
}
