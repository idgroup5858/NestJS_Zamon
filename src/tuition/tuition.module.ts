import { Module } from '@nestjs/common';
import { TuitionService } from './tuition.service';
import { TuitionController } from './tuition.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tuition } from './entities/tuition.entity';
import { Student } from 'src/student/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tuition, Student])],
  controllers: [TuitionController],
  providers: [TuitionService],
  exports: [TuitionService],
})
export class TuitionModule {}
