import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCriterionDto } from './dto/create-criterion.dto';
import { UpdateCriterionDto } from './dto/update-criterion.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Criterion } from './entities/criterion.entity';
import { Repository } from 'typeorm';
import { SubjectService } from 'src/subject/subject.service';

@Injectable()
export class CriteriaService {

  constructor(
    @InjectRepository(Criterion)
    private readonly criterionRepository:Repository<Criterion>,
    private readonly subjectService:SubjectService

  ){}


  async create(createCriterionDto: CreateCriterionDto) {
   const checkSubject = await this.subjectService.findOne(createCriterionDto.subject_id);
   
    const criteria =  this.criterionRepository.create({
      ...createCriterionDto,
      subject:{id:createCriterionDto.subject_id}
    })

    return this.criterionRepository.save(criteria);
  }

  async findAll() {

    return `This action returns all criteria`;
  }

  findOne(id: number) {
    return `This action returns a #${id} criterion`;
  }

  update(id: number, updateCriterionDto: UpdateCriterionDto) {
    return `This action updates a #${id} criterion`;
  }

  remove(id: number) {
    return `This action removes a #${id} criterion`;
  }
}
