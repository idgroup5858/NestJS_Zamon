import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBehaviorGradeDto } from './dto/create-behavior_grade.dto';
import { UpdateBehaviorGradeDto } from './dto/update-behavior_grade.dto';
import { BehaviorGrade } from './entities/behavior_grade.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { StudentService } from 'src/student/student.service';
import { SubjectService } from 'src/subject/subject.service';
import { Between, Repository } from 'typeorm';
import { BehaviorGradeItem } from './entities/behavior_grade_items.entity';

@Injectable()
export class BehaviorGradeService {

  constructor(
    @InjectRepository(BehaviorGrade)
    private readonly behaviorGradeRepository: Repository<BehaviorGrade>,

    @InjectRepository(BehaviorGradeItem)
    private readonly behaviorGradeItemRepository: Repository<BehaviorGradeItem>,
    
    private readonly userService: UserService,
    private readonly studentService: StudentService,
    private readonly subjectService: SubjectService,
  ) { }


  async create(dto: CreateBehaviorGradeDto) {
  const { student_id,user_id, subject_id, overall_comment, items } = dto;

  // 1. validation
  if (!items || items.length <4) {
    throw new BadRequestException('Items required');
  }

  // 2. check relations
  const student = await this.studentService.findOne(student_id);
  if (!student) throw new NotFoundException('Student not found');

  const user = await this.userService.findOne(user_id);
  if (!user) throw new NotFoundException('Teacher not found');

  const subject = await this.subjectService.findOne(subject_id);
  if (!subject) throw new NotFoundException('Subject not found');

  // 3. CREATE BehaviorGrade
  const behaviorGrade = this.behaviorGradeRepository.create({
    student,
    user:user,
    subject,
    overall_comment,
  });

  const savedGrade = await this.behaviorGradeRepository.save(behaviorGrade);

  // 4. CREATE items
  const behaviorItems = items.map(item =>
    this.behaviorGradeItemRepository.create({
      behaviorGrade: savedGrade,
      criteria_type: item.criteria_type,
      grade: item.grade,
      comment: item.comment,
    }),
  );

  await this.behaviorGradeItemRepository.save(behaviorItems);

  // 5. return result
  return {
    ...savedGrade,
    items: behaviorItems,
  };
}


  async findAllPagSearch(page: number, limit: number, search?: string) {
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;

    const skip = (page - 1) * limit;

    const query = this.behaviorGradeRepository.createQueryBuilder('behaviorgrade')
    .leftJoinAndSelect('behaviorgrade.user', 'user')
    .leftJoinAndSelect('behaviorgrade.student', 'student')
    .leftJoinAndSelect('behaviorgrade.subject', 'subject')
    .leftJoinAndSelect('student.classs', 'classs')
    .leftJoinAndSelect('behaviorgrade.items', 'items')

    if (search) {
      query.where(
        'student.first_name LIKE :search',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .orderBy('behaviorgrade.id', 'DESC')
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
  async findAllPagSearchRange(
  page: number,
  limit: number,
  search?: string,
  class_name?: string,
  startDate?: string,
  endDate?: string
) {
  // 1. pagination
  page = page > 0 ? page : 1;
  limit = limit > 0 ? limit : 10;

  const skip = (page - 1) * limit;

  // 2. query builder
  const query = this.behaviorGradeRepository
    .createQueryBuilder('behaviorgrade')
    .leftJoinAndSelect('behaviorgrade.user', 'user')
    .leftJoinAndSelect('behaviorgrade.student', 'student')
    .leftJoinAndSelect('student.classs', 'classs')
    .leftJoinAndSelect('behaviorgrade.items', 'items')
    .leftJoinAndSelect('behaviorgrade.subject', 'subject');

  // 3. SEARCH (faqat student)
  if (search) {
    query.andWhere(
      `(student.first_name LIKE :search 
        OR student.last_name LIKE :search)`,
      { search: `%${search}%` }
    );
  }

  // 4. CLASS FILTER (ALOXIDA)
  if (class_name) {
    query.andWhere(
      `classs.name LIKE :class_name`,
      { class_name: `%${class_name}%` }
    );
  }

  // 5. DATE RANGE
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    query.andWhere(
      `behaviorgrade.date BETWEEN :start AND :end`,
      { start, end }
    );
  }

  // 6. execute
  const [data, total] = await query
    .orderBy('behaviorgrade.id', 'DESC')
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  // 7. response
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

  async findAll() {
    return this.behaviorGradeRepository.find({
      relations:["user","student","subject","items"]
    })
  }

  async findAllWithRange(startDate:string,endDate:string){
    const start= new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const result = await this.behaviorGradeRepository.find({
      where:{
        date:Between(start, end)
      },
      relations:["user","student","subject","items","student.classs"]
    })

    return result;
  }

  findOne(id: number) {
    return `This action returns a #${id} behaviour`;
  }

  update(id: number, updateBasicGradeDto: UpdateBehaviorGradeDto) {
    return `This action updates a #${id} behaviour`;
  }

  async remove(id: number) {
    const checkBg = await this.behaviorGradeRepository.findOneBy({ id });
    if (!checkBg) throw new NotFoundException("Not found");
    await this.behaviorGradeRepository.remove(checkBg)
    return { message: "Delted successfully" };
  }
}
