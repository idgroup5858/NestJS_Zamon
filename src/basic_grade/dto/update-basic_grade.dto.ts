import { PartialType } from '@nestjs/mapped-types';
import { CreateBasicGradeDto } from './create-basic_grade.dto';

export class UpdateBasicGradeDto extends PartialType(CreateBasicGradeDto) {}
