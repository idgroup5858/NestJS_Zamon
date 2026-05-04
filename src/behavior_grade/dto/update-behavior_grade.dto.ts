import { PartialType } from '@nestjs/mapped-types';
import { CreateBehaviorGradeDto } from './create-behavior_grade.dto';

export class UpdateBehaviorGradeDto extends PartialType(CreateBehaviorGradeDto) {}
