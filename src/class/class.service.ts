import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ClassService {

  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    private readonly userService: UserService
  ) { }

  async create(createClassDto: CreateClassDto) {
    const checkClass = await this.classRepository.findOne({
      where: { name: createClassDto.name }
    });
    if (checkClass) throw new ConflictException("Already exists");
    const classs = this.classRepository.create(createClassDto)
    await this.classRepository.save(classs);
    return classs;
  }

  async findAllPagSearch(page: number, limit: number, search?: string) {
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;

    const skip = (page - 1) * limit;

    const query = this.classRepository.createQueryBuilder('class')
    .leftJoinAndSelect('class.users', 'users')
    .leftJoinAndSelect('class.students', 'students')

    if (search) {
      query.where(
        'class.name LIKE :search',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .orderBy('class.id', 'DESC')
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
    return this.classRepository.find({
      relations:["users","students"]
    });
  }

  async findOne(id: number) {
    if (!id) {
    throw new BadRequestException('classs id is required');
  }
    const checkClass = await this.classRepository.findOne(
      {
        where: { id: id },
        relations:["users","students"]    
      });
    if (!checkClass) throw new NotFoundException("Not found");
    return checkClass;
  }

  async update(id: number, updateClassDto: UpdateClassDto) {
    const checkClass = await this.classRepository.findOneBy({ id });
    if (!checkClass) throw new NotFoundException("Not found");
    const classs = await this.classRepository.preload({
      id,
      ...updateClassDto
    });

    if (!classs) throw new NotFoundException()
    await this.classRepository.save(classs)
    return classs;
  }

  async remove(id: number) {
    const checkClass = await this.classRepository.findOneBy({ id });
    if (!checkClass) throw new NotFoundException("Not found");
    await this.classRepository.remove(checkClass)
    return { message: "Delted successfully" };
  }



  //relations

  async assignTeacher( userId: number,classId: number) {
    const classs = await this.classRepository.findOne({
      where: { id: classId },
      relations: ['users'],
    });

    if (!classs) {
      throw new NotFoundException('Not found');
    }

    const user = await this.userService.findOne(userId)
    if (!user) {
      throw new NotFoundException('Not found');
    }

    classs.users = user;

   await this.classRepository.save(classs);

    return this.classRepository.findOne({
      where: { id: classId },
      relations: ['users'],
    });
  }
  async removeTeacher(classId: number) {
    const classEntity = await this.classRepository.findOne({
      where: { id: classId },
      relations: ['users'],
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    classEntity.users = null;

    return this.classRepository.save(classEntity);
  }



}



/*


async createClass(dto: CreateClassDto) {
  const classEntity = this.classRepository.create({
    name: dto.name,
    classTeacher: { id: dto.teacher_id }, //  
  });

  return this.classRepository.save(classEntity);
}

*/