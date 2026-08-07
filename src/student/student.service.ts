import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { ClassService } from 'src/class/class.service';

@Injectable()
export class StudentService {

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly calssService:ClassService
  ) { }

  async create(createStudentDto: CreateStudentDto) {
    // const checkStudent = await this.studentRepository.findOne({
    //   where: { first_name: createStudentDto.first_name }
    // });
    // if (checkStudent) throw new ConflictException("Already exists");

    const checkClasss= await this.calssService.findOne(createStudentDto.classs_id);
     if (!checkClasss) throw new NotFoundException("Not found");

    const student = this.studentRepository.create({
      ...createStudentDto,
      classs: checkClasss
    })
    const std = await this.studentRepository.save(student);
    
    return this.findOne(std.id);
  }

  async findAllPagSearch(page: number, limit: number, search?: string) {
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;

    const skip = (page - 1) * limit;
    const query = this.studentRepository.createQueryBuilder('student')
    //.leftJoinAndSelect('subject.users', 'users');

    if (search) {
      query.where(
        'student.first_name LIKE :search',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .orderBy('student.id', 'DESC')
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

  findAll() {
    return this.studentRepository.find({
      relations:["classs"]
    });
  }

  async findOne(id: number) {
    const checkStudent = await this.studentRepository.findOne(
      {
        where: { id: id },
        relations:["classs"]    
      });
    if (!checkStudent) throw new NotFoundException("Not found");
    return checkStudent;
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    const checkStudent = await this.studentRepository.findOneBy({ id });
    if (!checkStudent) throw new NotFoundException("Not found");
    const student = await this.studentRepository.preload({
      id,
      ...updateStudentDto
    });

    if (!student) throw new NotFoundException()
    await this.studentRepository.save(student)
    return student;
  }

  async remove(id: number) {
    const checkStudent = await this.studentRepository.findOneBy({ id });
    if (!checkStudent) throw new NotFoundException("Not found");
    await this.studentRepository.remove(checkStudent)
    return { message: "Delted successfully" };
  }




  async moveStudent( id: number,classId: number) {
    const checkStudent = await this.studentRepository.findOneBy({ id });
    if (!checkStudent) throw new NotFoundException("Not found");

    
    const checkClass = await this.calssService.findOne(classId)
    
    checkStudent.classs = checkClass;

    await this.studentRepository.save(checkStudent);

    return this.findOne(id);
  }


  async findByPhone(phone: string) {
    return await this.studentRepository.findOne({
        where: {
            telegram_phone: phone
        }
    });
}
}
