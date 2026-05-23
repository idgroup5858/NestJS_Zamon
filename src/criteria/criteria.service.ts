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

    return this.criterionRepository.find({
      relations:["subject"]
    });
  }

  async findOne(id: number) {
      const checkCriteria = await this.criterionRepository.findOne(
        {
          where: { id: id },
          //relations:["sale","purchase","returns"]    
        });
      if (!checkCriteria) throw new NotFoundException("Not found");
      return checkCriteria;
    }
  
    async update(id: number, updateCriterionDto: UpdateCriterionDto) {
      const checkCriteria = await this.criterionRepository.findOneBy({ id });
      if (!checkCriteria) throw new NotFoundException("Not found");
      const criteria = await this.criterionRepository.preload({
        id,
        ...updateCriterionDto
      });
  
      if (!criteria) throw new NotFoundException()
      await this.criterionRepository.save(criteria)
      return criteria;
    }
  
    async remove(id: number) {
      const checkCriteria = await this.criterionRepository.findOneBy({ id });
      if (!checkCriteria) throw new NotFoundException("Not found");
      await this.criterionRepository.remove(checkCriteria)
      return { message: "Delted successfully" };
    }
}
