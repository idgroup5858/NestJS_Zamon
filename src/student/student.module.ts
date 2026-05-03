import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { ClassModule } from 'src/class/class.module';

@Module({
  imports: [TypeOrmModule.forFeature([Student]),
    ClassModule
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports:[StudentService]
})
export class StudentModule { }
