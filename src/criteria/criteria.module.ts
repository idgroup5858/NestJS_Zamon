import { Module } from '@nestjs/common';
import { CriteriaService } from './criteria.service';
import { CriteriaController } from './criteria.controller';
import { SubjectModule } from 'src/subject/subject.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Criterion } from './entities/criterion.entity';

@Module({
  imports:[SubjectModule,TypeOrmModule.forFeature([Criterion])],
  controllers: [CriteriaController],
  providers: [CriteriaService],
})
export class CriteriaModule {}
