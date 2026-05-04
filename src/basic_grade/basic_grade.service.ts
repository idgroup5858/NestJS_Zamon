import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBasicGradeDto } from './dto/create-basic_grade.dto';
import { UpdateBasicGradeDto } from './dto/update-basic_grade.dto';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BasicGrade } from './entities/basic_grade.entity';
import { UserService } from 'src/user/user.service';
import { StudentService } from 'src/student/student.service';
import { SubjectService } from 'src/subject/subject.service';

@Injectable()
export class BasicGradeService {

  constructor(
    @InjectRepository(BasicGrade)
    private readonly basicGradeRepository:Repository<BasicGrade>,
    private readonly userService:UserService,
    private readonly studentService:StudentService,
    private readonly subjectService:SubjectService,
  ){}

  async create(dto: CreateBasicGradeDto) {
     const student = await this.studentService.findOne(dto.student_id);
  if (!student) throw new NotFoundException("Student not found");

  const user = await this.userService.findOne(dto.user_id);
  if (!user) throw new NotFoundException("Teacher not found");

  const subject = await this.subjectService.findOne(dto.subject_id);
  if (!subject) throw new NotFoundException("Subject not found");

  const grade = this.basicGradeRepository.create({
    

    student: student,
    user: user,
    subject: subject,

    grade: dto.grade,
    comment: dto.comment,
  });

  return this.basicGradeRepository.save(grade);
  }

  async findAllPagSearch(page: number, limit: number, search?: string) {
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;

    const skip = (page - 1) * limit;

    const query = this.basicGradeRepository.createQueryBuilder('basicgrade')
    .leftJoinAndSelect('basicgrade.user', 'user')
    .leftJoinAndSelect('basicgrade.student', 'student')
    .leftJoinAndSelect('basicgrade.subject', 'subject')

    if (search) {
      query.where(
        'student.first_name LIKE :search',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .orderBy('basicgrade.id', 'DESC')
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
  const query = this.basicGradeRepository
    .createQueryBuilder('basicgrade')
    .leftJoinAndSelect('basicgrade.user', 'user')
    .leftJoinAndSelect('basicgrade.student', 'student')
    .leftJoinAndSelect('student.classs', 'classs')
    .leftJoinAndSelect('basicgrade.subject', 'subject');

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
      `basicgrade.date BETWEEN :start AND :end`,
      { start, end }
    );
  }

  // 6. execute
  const [data, total] = await query
    .orderBy('basicgrade.id', 'DESC')
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
    return this.basicGradeRepository.find({
      relations:["user","student","subject"]
    })
  }

  async findAllWithRange(startDate:string,endDate:string){
    const start= new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const result = await this.basicGradeRepository.find({
      where:{
        date:Between(start, end)
      },
      relations:["user","student","subject"]
    })

    return result;
  }

  findOne(id: number) {
    return `This action returns a #${id} basicGrade`;
  }

  update(id: number, updateBasicGradeDto: UpdateBasicGradeDto) {
    return `This action updates a #${id} basicGrade`;
  }

  async remove(id: number) {
    const checkBg = await this.basicGradeRepository.findOneBy({ id });
    if (!checkBg) throw new NotFoundException("Not found");
    await this.basicGradeRepository.remove(checkBg)
    return { message: "Delted successfully" };
  }
}
