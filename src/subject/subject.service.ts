import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';

@Injectable()
export class SubjectService {

  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>
  ) { }

  async create(createSubjectDto: CreateSubjectDto) {
    const checkSubject = await this.subjectRepository.findOne({
      where: { name: createSubjectDto.name }
    });
    if (checkSubject) throw new ConflictException("Already exists");
    const subject = this.subjectRepository.create(createSubjectDto)
    await this.subjectRepository.save(subject);
    return subject;
  }

  async findAllPagSearch(page: number, limit: number, search?: string) {
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;

    const skip = (page - 1) * limit;

    const query = this.subjectRepository.createQueryBuilder('subject')
    .leftJoinAndSelect('subject.users', 'users')

    if (search) {
      query.where(
        'subject.name LIKE :search',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .orderBy('subject.id', 'DESC')
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
    return this.subjectRepository.find({
      relations:["users"]
    });
  }

  async findOne(id: number) {
    const checkSubject = await this.subjectRepository.findOne(
      {
        where: { id: id },
        //relations:["sale","purchase","returns"]    
      });
    if (!checkSubject) throw new NotFoundException("Not found");
    return checkSubject;
  }

  async update(id: number, updateSubjectDto: UpdateSubjectDto) {
    const checkSubject = await this.subjectRepository.findOneBy({ id });
    if (!checkSubject) throw new NotFoundException("Not found");
    const subject = await this.subjectRepository.preload({
      id,
      ...updateSubjectDto
    });

    if (!subject) throw new NotFoundException()
    await this.subjectRepository.save(subject)
    return subject;
  }

  async remove(id: number) {
    const checkSubject = await this.subjectRepository.findOneBy({ id });
    if (!checkSubject) throw new NotFoundException("Not found");
    await this.subjectRepository.remove(checkSubject)
    return { message: "Delted successfully" };
  }
}





